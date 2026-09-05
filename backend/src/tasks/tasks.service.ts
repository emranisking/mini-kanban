import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { BoardColumn } from '../columns/column.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CacheService } from '../cache/cache.service';
import { CacheKeyFactory } from '../cache/cache-key.factory';

/**
 * Plain CRUD for tasks. Reordering/moving lives in TaskMovementService
 * because it's a fundamentally different, transaction-heavy operation.
 */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasksRepository: Repository<Task>,
    @InjectRepository(BoardColumn)
    private readonly columnsRepository: Repository<BoardColumn>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly cacheKeys: CacheKeyFactory,
  ) {}

  async list(boardId: string): Promise<Task[]> {
    const cacheKey = this.cacheKeys.tasks(boardId);
    const cached = await this.cacheService.get<Task[]>(cacheKey);
    if (cached) return cached;

    const tasks = await this.tasksRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    await this.cacheService.set(cacheKey, tasks);
    return tasks;
  }

  async getOne(boardId: string, taskId: string, userId: string): Promise<Task> {
    const cacheKey = this.cacheKeys.task(taskId, userId);
    const cached = await this.cacheService.get<Task>(cacheKey);
    if (cached && cached.boardId === boardId) return cached;

    const task = await this.tasksRepository.findOne({ where: { id: taskId, boardId } });
    if (!task) {
      throw new NotFoundException('Task not found on this board');
    }

    await this.cacheService.set(cacheKey, task);
    return task;
  }

  async create(boardId: string, dto: CreateTaskDto): Promise<Task> {
    const column = await this.columnsRepository.findOne({ where: { id: dto.columnId, boardId } });
    if (!column) {
      // Never trust a client-supplied columnId without verifying it belongs to this board.
      throw new BadRequestException('That column does not belong to this board');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Task);
      const max = await repo
        .createQueryBuilder('t')
        .where('t.columnId = :columnId', { columnId: dto.columnId })
        .select('COALESCE(MAX(t.position), -1)', 'max')
        .getRawOne<{ max: number }>();
      const position = Number(max?.max ?? -1) + 1;

      const task = repo.create({
        boardId,
        columnId: dto.columnId,
        title: dto.title,
        description: dto.description ?? null,
        position,
      });
      const saved = await repo.save(task);

      await this.invalidate(boardId, saved.id);
      return saved;
    });
  }

  async update(boardId: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId, boardId } });
    if (!task) {
      throw new NotFoundException('Task not found on this board');
    }

    Object.assign(task, {
      title: dto.title ?? task.title,
      description: dto.description !== undefined ? dto.description : task.description,
    });
    const saved = await this.tasksRepository.save(task);

    await this.invalidate(boardId, taskId);
    return saved;
  }

  async delete(boardId: string, taskId: string): Promise<void> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId, boardId } });
    if (!task) {
      throw new NotFoundException('Task not found on this board');
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Task);
      await repo.remove(task);
      await repo
        .createQueryBuilder()
        .update(Task)
        .set({ position: () => '"position" - 1' })
        .where('columnId = :columnId AND position > :position', {
          columnId: task.columnId,
          position: task.position,
        })
        .execute();
    });

    await this.invalidate(boardId, taskId);
  }

  private async invalidate(boardId: string, taskId: string): Promise<void> {
    await this.cacheService.delete(this.cacheKeys.tasks(boardId));
    await this.cacheService.deleteByPattern(this.cacheKeys.taskWildcard(taskId));
    await this.cacheService.deleteByPattern(this.cacheKeys.boardWildcard(boardId));
  }
}
