import { Injectable } from '@nestjs/common';

/**
 * Centralizes every Redis key this application ever writes, so no two
 * modules can accidentally diverge on how a key is built.
 */
@Injectable()
export class CacheKeyFactory {
  boardsList(userId: string): string {
    return `boards:user:${userId}`;
  }

  board(boardId: string, userId: string): string {
    return `board:${boardId}:user:${userId}`;
  }

  boardWildcard(boardId: string): string {
    return `board:${boardId}:user:*`;
  }

  boardsListWildcard(): string {
    return `boards:user:*`;
  }

  members(boardId: string): string {
    return `board:${boardId}:members`;
  }

  columns(boardId: string): string {
    return `board:${boardId}:columns`;
  }

  tasks(boardId: string): string {
    return `board:${boardId}:tasks`;
  }

  task(taskId: string, userId: string): string {
    return `task:${taskId}:user:${userId}`;
  }

  taskWildcard(taskId: string): string {
    return `task:${taskId}:*`;
  }
}
