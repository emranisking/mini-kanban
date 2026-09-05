import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './board.entity';
import { BoardMember } from './board-member.entity';
import { BoardRole } from './board-role.enum';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CacheService } from '../cache/cache.service';
import { CacheKeyFactory } from '../cache/cache-key.factory';
import { UsersService } from '../users/users.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boardsRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly membersRepository: Repository<BoardMember>,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
    private readonly cacheKeys: CacheKeyFactory,
  ) {}

  async create(userId: string, dto: CreateBoardDto): Promise<Board> {
    const board = this.boardsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      ownerId: userId,
    });
    const saved = await this.boardsRepository.save(board);

    const ownerMembership = this.membersRepository.create({
      boardId: saved.id,
      userId,
      role: BoardRole.OWNER,
    });
    await this.membersRepository.save(ownerMembership);

    await this.cacheService.delete(this.cacheKeys.boardsList(userId));
    return saved;
  }

  async listForUser(userId: string): Promise<Board[]> {
    const cacheKey = this.cacheKeys.boardsList(userId);
    const cached = await this.cacheService.get<Board[]>(cacheKey);
    if (cached) return cached;

    const boards = await this.boardsRepository
      .createQueryBuilder('board')
      .innerJoin(BoardMember, 'member', 'member.boardId = board.id')
      .where('member.userId = :userId', { userId })
      .orderBy('board.updatedAt', 'DESC')
      .getMany();

    await this.cacheService.set(cacheKey, boards);
    return boards;
  }

  async getById(boardId: string, userId: string): Promise<Board> {
    const cacheKey = this.cacheKeys.board(boardId, userId);
    const cached = await this.cacheService.get<Board>(cacheKey);
    if (cached) return cached;

    const board = await this.boardsRepository.findOne({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.cacheService.set(cacheKey, board);
    return board;
  }

  async update(boardId: string, dto: UpdateBoardDto): Promise<Board> {
    const board = await this.boardsRepository.findOne({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    Object.assign(board, {
      name: dto.name ?? board.name,
      description: dto.description !== undefined ? dto.description : board.description,
    });
    const saved = await this.boardsRepository.save(board);

    await this.invalidateBoard(boardId);
    return saved;
  }

  async delete(boardId: string): Promise<void> {
    const board = await this.boardsRepository.findOne({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Grab member IDs before the cascade delete so we can clear their caches too.
    const members = await this.membersRepository.find({ where: { boardId } });
    await this.boardsRepository.remove(board);

    await this.cacheService.deleteByPattern(this.cacheKeys.boardWildcard(boardId));
    await this.cacheService.delete(this.cacheKeys.members(boardId));
    await this.cacheService.delete(this.cacheKeys.columns(boardId));
    await this.cacheService.delete(this.cacheKeys.tasks(boardId));
    await Promise.all(
      members.map((m) => this.cacheService.delete(this.cacheKeys.boardsList(m.userId))),
    );
  }

  async listMembers(boardId: string): Promise<Array<{ id: string; userId: string; name: string; email: string; role: BoardRole }>> {
    const cacheKey = this.cacheKeys.members(boardId);
    const cached = await this.cacheService.get<
      Array<{ id: string; userId: string; name: string; email: string; role: BoardRole }>
    >(cacheKey);
    if (cached) return cached;

    const members = await this.membersRepository.find({ where: { boardId } });
    const users = await this.usersService.findByIds(members.map((m) => m.userId));
    const userById = new Map(users.map((u) => [u.id, u]));

    const result = members.map((m) => {
      const user = userById.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: user?.name ?? 'Unknown user',
        email: user?.email ?? '',
        role: m.role,
      };
    });

    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async addMember(boardId: string, dto: AddMemberDto): Promise<BoardMember> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('No user is registered with that email');
    }

    const existing = await this.membersRepository.findOne({
      where: { boardId, userId: user.id },
    });
    if (existing) {
      throw new ConflictException('This user is already a member of the board');
    }

    const member = this.membersRepository.create({ boardId, userId: user.id, role: dto.role });
    const saved = await this.membersRepository.save(member);

    await this.invalidateMembership(boardId, user.id);
    return saved;
  }

  async updateMemberRole(
    boardId: string,
    targetUserId: string,
    dto: UpdateMemberDto,
  ): Promise<BoardMember> {
    const member = await this.membersRepository.findOne({
      where: { boardId, userId: targetUserId },
    });
    if (!member) {
      throw new NotFoundException('This user is not a member of the board');
    }

    if (member.role === BoardRole.OWNER && dto.role !== BoardRole.OWNER) {
      const ownerCount = await this.membersRepository.count({
        where: { boardId, role: BoardRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('A board must always have at least one owner');
      }
    }

    member.role = dto.role;
    const saved = await this.membersRepository.save(member);

    await this.invalidateMembership(boardId, targetUserId);
    return saved;
  }

  async removeMember(boardId: string, targetUserId: string, requestingUserId: string): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { boardId, userId: targetUserId },
    });
    if (!member) {
      throw new NotFoundException('This user is not a member of the board');
    }

    if (member.role === BoardRole.OWNER) {
      const ownerCount = await this.membersRepository.count({
        where: { boardId, role: BoardRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('A board must always have at least one owner');
      }
    }

    if (targetUserId === requestingUserId && member.role === BoardRole.OWNER) {
      throw new ForbiddenException('Transfer ownership before removing yourself');
    }

    await this.membersRepository.remove(member);
    await this.invalidateMembership(boardId, targetUserId);
  }

  private async invalidateBoard(boardId: string): Promise<void> {
    await this.cacheService.deleteByPattern(this.cacheKeys.boardWildcard(boardId));
    const members = await this.membersRepository.find({ where: { boardId } });
    await Promise.all(
      members.map((m) => this.cacheService.delete(this.cacheKeys.boardsList(m.userId))),
    );
  }

  private async invalidateMembership(boardId: string, userId: string): Promise<void> {
    await this.cacheService.delete(this.cacheKeys.members(boardId));
    await this.cacheService.delete(this.cacheKeys.board(boardId, userId));
    await this.cacheService.delete(this.cacheKeys.boardsList(userId));
  }
}
