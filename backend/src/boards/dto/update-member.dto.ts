import { IsEnum } from 'class-validator';
import { BoardRole } from '../board-role.enum';

export class UpdateMemberDto {
  @IsEnum(BoardRole, { message: 'role must be one of OWNER, EDITOR, VIEWER' })
  role: BoardRole;
}
