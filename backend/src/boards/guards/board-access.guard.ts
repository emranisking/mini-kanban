import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardAccessService } from '../board-access.service';

/**
 * Runs after JwtAuthGuard. Confirms the caller is a member of the board
 * named by the :boardId route param, and attaches that membership (plus
 * the board) to the request so downstream guards/handlers don't re-query.
 *
 * This guard alone is what stands between a stale/warm Redis cache entry
 * and an unauthorized read: every board-scoped route goes through this
 * check first, regardless of whether the response ends up served from
 * cache or from Postgres.
 */
@Injectable()
export class BoardAccessGuard implements CanActivate {
  constructor(private readonly boardAccessService: BoardAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const boardId: string | undefined = request.params?.boardId;
    const user = request.user;

    if (!boardId) {
      throw new NotFoundException('Board not found');
    }

    // Confirms the board itself exists before we talk about membership.
    const board = await this.boardAccessService.getBoardOrThrow(boardId);

    const membership = await this.boardAccessService.getMembership(boardId, user.userId);
    if (!membership) {
      throw new ForbiddenException('You do not have access to this board');
    }

    request.board = board;
    request.boardMembership = membership;
    return true;
  }
}
