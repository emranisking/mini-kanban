import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BoardColumn } from './column.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { CacheService } from '../cache/cache.service';
import { CacheKeyFactory } from '../cache/cache-key.factory';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(BoardColumn)
    private readonly columnsRepository: Repository<BoardColumn>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly cacheKeys: CacheKeyFactory,
  ) {}

  async list(boardId: string): Promise<BoardColumn[]> {
    const cacheKey = this.cacheKeys.columns(boardId);
    const cached = await this.cacheService.get<BoardColumn[]>(cacheKey);
    if (cached) return cached;

    const columns = await this.columnsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    await this.cacheService.set(cacheKey, columns);
    return columns;
  }

  async create(boardId: string, dto: CreateColumnDto): Promise<BoardColumn> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BoardColumn);

      let position = dto.position;
      if (position === undefined) {
        const max = await repo
          .createQueryBuilder('c')
          .where('c.boardId = :boardId', { boardId })
          .select('COALESCE(MAX(c.position), -1)', 'max')
          .getRawOne<{ max: number }>();
        position = Number(max?.max ?? -1) + 1;
      } else {
        // Make room for the inserted column by shifting everything after it.
        await repo
          .createQueryBuilder()
          .update(BoardColumn)
          .set({ position: () => '"position" + 1' })
          .where('boardId = :boardId AND position >= :position', { boardId, position })
          .execute();
      }

      const column = repo.create({ boardId, name: dto.name, position });
      const saved = await repo.save(column);

      await this.invalidate(boardId);
      return saved;
    });
  }

  async update(boardId: string, columnId: string, dto: UpdateColumnDto): Promise<BoardColumn> {
    const column = await this.columnsRepository.findOne({ where: { id: columnId, boardId } });
    if (!column) {
      throw new NotFoundException('Column not found on this board');
    }

    if (dto.position !== undefined && dto.position !== column.position) {
      await this.reorderColumn(boardId, column, dto.position);
    }

    if (dto.name !== undefined) {
      column.name = dto.name;
      await this.columnsRepository.save(column);
    }

    await this.invalidate(boardId);
    const refreshed = await this.columnsRepository.findOne({ where: { id: columnId } });
    return refreshed as BoardColumn;
  }

  async delete(boardId: string, columnId: string): Promise<void> {
    const column = await this.columnsRepository.findOne({ where: { id: columnId, boardId } });
    if (!column) {
      throw new NotFoundException('Column not found on this board');
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BoardColumn);
      await repo.remove(column);
      // Close the gap left behind.
      await repo
        .createQueryBuilder()
        .update(BoardColumn)
        .set({ position: () => '"position" - 1' })
        .where('boardId = :boardId AND position > :position', {
          boardId,
          position: column.position,
        })
        .execute();
    });

    await this.invalidate(boardId);
  }

  private async reorderColumn(boardId: string, column: BoardColumn, targetPosition: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BoardColumn);
      const current = column.position;

      if (targetPosition > current) {
        await repo
          .createQueryBuilder()
          .update(BoardColumn)
          .set({ position: () => '"position" - 1' })
          .where('boardId = :boardId AND position > :current AND position <= :target', {
            boardId,
            current,
            target: targetPosition,
          })
          .execute();
      } else {
        await repo
          .createQueryBuilder()
          .update(BoardColumn)
          .set({ position: () => '"position" + 1' })
          .where('boardId = :boardId AND position >= :target AND position < :current', {
            boardId,
            current,
            target: targetPosition,
          })
          .execute();
      }

      await repo.update({ id: column.id }, { position: targetPosition });
    });
  }

  private async invalidate(boardId: string): Promise<void> {
    await this.cacheService.delete(this.cacheKeys.columns(boardId));
    await this.cacheService.deleteByPattern(this.cacheKeys.boardWildcard(boardId));
  }
}
