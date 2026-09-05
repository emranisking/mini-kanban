import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardMember } from './board-member.entity';
import { Board } from './board.entity';
import { BoardRole } from './board-role.enum';

/**
 * Pure membership/role lookups, shared by the guards and the services.
 * This is the single place that answers "can this user touch this board?"
 */
@Injectable()
export class BoardAccessService {
  constructor(
    @InjectRepository(Board) private readonly boardsRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly membersRepository: Repository<BoardMember>,
  ) {}

  async getBoardOrThrow(boardId: string): Promise<Board> {
    const board = await this.boardsRepository.findOne({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  async getMembership(boardId: string, userId: string): Promise<BoardMember | null> {
    return this.membersRepository.findOne({ where: { boardId, userId } });
  }

  roleSatisfies(role: BoardRole, allowed: BoardRole[]): boolean {
    return allowed.includes(role);
  }
}
