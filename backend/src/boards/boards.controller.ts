import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardAccessGuard } from './guards/board-access.guard';
import { BoardRoleGuard } from './guards/board-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { BoardRole } from './board-role.enum';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.boardsService.listForUser(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(user.userId, dto);
  }

  @Get(':boardId')
  @UseGuards(BoardAccessGuard)
  getOne(@Param('boardId') boardId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.boardsService.getById(boardId, user.userId);
  }

  @Patch(':boardId')
  @UseGuards(BoardAccessGuard, BoardRoleGuard)
  @RequireRole(BoardRole.OWNER)
  update(@Param('boardId') boardId: string, @Body() dto: UpdateBoardDto) {
    return this.boardsService.update(boardId, dto);
  }

  @Delete(':boardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BoardAccessGuard, BoardRoleGuard)
  @RequireRole(BoardRole.OWNER)
  async remove(@Param('boardId') boardId: string) {
    await this.boardsService.delete(boardId);
  }

  @Get(':boardId/members')
  @UseGuards(BoardAccessGuard)
  listMembers(@Param('boardId') boardId: string) {
    return this.boardsService.listMembers(boardId);
  }

  @Post(':boardId/members')
  @UseGuards(BoardAccessGuard, BoardRoleGuard)
  @RequireRole(BoardRole.OWNER)
  addMember(@Param('boardId') boardId: string, @Body() dto: AddMemberDto) {
    return this.boardsService.addMember(boardId, dto);
  }

  @Patch(':boardId/members/:userId')
  @UseGuards(BoardAccessGuard, BoardRoleGuard)
  @RequireRole(BoardRole.OWNER)
  updateMember(
    @Param('boardId') boardId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.boardsService.updateMemberRole(boardId, targetUserId, dto);
  }

  @Delete(':boardId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BoardAccessGuard, BoardRoleGuard)
  @RequireRole(BoardRole.OWNER)
  async removeMember(
    @Param('boardId') boardId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.boardsService.removeMember(boardId, targetUserId, user.userId);
  }
}
