import { SetMetadata } from '@nestjs/common';
import { BoardRole } from '../../boards/board-role.enum';

export const REQUIRE_ROLE_KEY = 'requireRole';

/**
 * Marks a route as requiring at least one of the given board roles.
 * Enforced by BoardRoleGuard, which runs after BoardAccessGuard has
 * already attached the caller's membership to the request.
 */
export const RequireRole = (...roles: BoardRole[]) => SetMetadata(REQUIRE_ROLE_KEY, roles);
