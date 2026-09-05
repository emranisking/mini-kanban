import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Task } from '../task.entity';
import { BoardColumn } from '../../columns/column.entity';
import { MoveTaskDto } from '../dto/move-task.dto';
import { CacheService } from '../../cache/cache.service';
import { CacheKeyFactory } from '../../cache/cache-key.factory';

/**
 * Isolated from TasksService on purpose: moving a task is a multi-row,
 * lock-then-shift operation, not a simple field update. Keeping it in its
 * own service keeps TasksService's plain CRUD easy to read.
 *
 * The whole operation runs inside one PostgreSQL transaction:
 *   BEGIN
 *     -> lock the moving task row
 *     -> verify task belongs to the board in the URL
 *     -> lock + verify the target column belongs to the same board
 *     -> lock every task row whose position will shift
 *     -> recalculate positions
 *     -> update the moved task
 *   COMMIT (or ROLLBACK on any failure)
 *
 * Locking every affected row up front (SELECT ... FOR UPDATE) before any
 * UPDATE is what keeps two concurrent moves on the same column from ever
 * producing duplicate or skipped positions.
 */
@Injectable()
export class TaskMovementService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly cacheKeys: CacheKeyFactory,
  ) {}

  async move(boardId: string, taskId: string, dto: MoveTaskDto): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const taskRepo = queryRunner.manager.getRepository(Task);
      const columnRepo = queryRunner.manager.getRepository(BoardColumn);

      // Lock the task being moved first so two simultaneous moves of the
      // *same* task simply serialize instead of racing.
      const task = await taskRepo
        .createQueryBuilder('task')
        .setLock('pessimistic_write')
        .where('task.id = :taskId', { taskId })
        .getOne();

      if (!task) {
        throw new NotFoundException('Task not found');
      }
      if (task.boardId !== boardId) {
        // A task from another board can never be moved via this board's URL.
        throw new BadRequestException('Task does not belong to this board');
      }

      const targetColumn = await columnRepo
        .createQueryBuilder('column')
        .setLock('pessimistic_write')
        .where('column.id = :columnId', { columnId: dto.targetColumnId })
        .getOne();

      if (!targetColumn) {
        throw new NotFoundException('Target column not found');
      }
      if (targetColumn.boardId !== boardId) {
        throw new BadRequestException('Target column does not belong to this board');
      }

      const sourceColumnId = task.columnId;
      const isSameColumn = sourceColumnId === dto.targetColumnId;

      // Lock every task row in the column(s) whose position might shift,
      // ordered by position so lock acquisition order is deterministic
      // (prevents deadlocks between two transactions moving within the
      // same pair of columns in opposite directions).
      const columnIdsToLock = isSameColumn ? [sourceColumnId] : [sourceColumnId, dto.targetColumnId];
      await taskRepo
        .createQueryBuilder('task')
        .setLock('pessimistic_write')
        .where('task.columnId IN (:...columnIds)', { columnIds: columnIdsToLock })
        .orderBy('task.columnId', 'ASC')
        .addOrderBy('task.position', 'ASC')
        .getMany();

      const targetCount = await taskRepo.count({
        where: { columnId: dto.targetColumnId },
      });
      const maxPosition = isSameColumn ? targetCount - 1 : targetCount;
      const targetPosition = Math.max(0, Math.min(dto.targetPosition, maxPosition));

      if (isSameColumn) {
        await this.moveWithinColumn(taskRepo, task, targetPosition);
      } else {
        await this.moveAcrossColumns(taskRepo, task, dto.targetColumnId, targetPosition);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    await this.invalidate(boardId, taskId);

    const finalTask = await this.dataSource.getRepository(Task).findOne({ where: { id: taskId } });
    return finalTask as Task;
  }

  private async moveWithinColumn(
    taskRepo: Repository<Task>,
    task: Task,
    targetPosition: number,
  ): Promise<void> {
    const currentPosition = task.position;
    if (targetPosition === currentPosition) {
      return;
    }

    if (targetPosition > currentPosition) {
      // Shift everything between the old and new spot back by one to close the gap.
      await taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ position: () => '"position" - 1' })
        .where(
          'columnId = :columnId AND position > :currentPosition AND position <= :targetPosition',
          { columnId: task.columnId, currentPosition, targetPosition },
        )
        .execute();
    } else {
      // Shift everything between the new and old spot forward by one to open a gap.
      await taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ position: () => '"position" + 1' })
        .where(
          'columnId = :columnId AND position >= :targetPosition AND position < :currentPosition',
          { columnId: task.columnId, currentPosition, targetPosition },
        )
        .execute();
    }

    await taskRepo.update({ id: task.id }, { position: targetPosition });
  }

  private async moveAcrossColumns(
    taskRepo: Repository<Task>,
    task: Task,
    targetColumnId: string,
    targetPosition: number,
  ): Promise<void> {
    // Close the gap left behind in the source column.
    await taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({ position: () => '"position" - 1' })
      .where('columnId = :columnId AND position > :position', {
        columnId: task.columnId,
        position: task.position,
      })
      .execute();

    // Open a gap at the target position in the destination column.
    await taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({ position: () => '"position" + 1' })
      .where('columnId = :columnId AND position >= :position', {
        columnId: targetColumnId,
        position: targetPosition,
      })
      .execute();

    await taskRepo.update(
      { id: task.id },
      { columnId: targetColumnId, position: targetPosition },
    );
  }

  private async invalidate(boardId: string, taskId: string): Promise<void> {
    await this.cacheService.delete(this.cacheKeys.tasks(boardId));
    await this.cacheService.deleteByPattern(this.cacheKeys.taskWildcard(taskId));
    await this.cacheService.deleteByPattern(this.cacheKeys.boardWildcard(boardId));
  }
}
