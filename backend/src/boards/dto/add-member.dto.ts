import { IsEmail, IsEnum } from 'class-validator';
import { BoardRole } from '../board-role.enum';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(BoardRole, { message: 'role must be one of OWNER, EDITOR, VIEWER' })
  role: BoardRole;
}
