import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ROLE_KEY } from '../../common/decorators/require-role.decorator';
import { BoardRole } from '../board-role.enum';
import { BoardMember } from '../board-member.entity';

/**
 * Runs after BoardAccessGuard. Reads the roles set by @RequireRole(...) on
 * the route handler and checks them against the membership BoardAccessGuard
 * already attached to the request. If a route has no @RequireRole, any
 * member (including VIEWER) is allowed through.
 */
@Injectable()
export class BoardRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<BoardRole[] | undefined>(
      REQUIRE_ROLE_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const membership: BoardMember | undefined = request.boardMembership;

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
