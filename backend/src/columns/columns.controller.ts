import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardAccessGuard } from '../boards/guards/board-access.guard';
import { BoardRoleGuard } from '../boards/guards/board-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { BoardRole } from '../boards/board-role.enum';

@Controller('boards/:boardId/columns')
@UseGuards(JwtAuthGuard, BoardAccessGuard)
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  list(@Param('boardId') boardId: string) {
    return this.columnsService.list(boardId);
  }

  @Post()
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  create(@Param('boardId') boardId: string, @Body() dto: CreateColumnDto) {
    return this.columnsService.create(boardId, dto);
  }

  @Patch(':columnId')
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  update(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnsService.update(boardId, columnId, dto);
  }

  @Delete(':columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  async remove(@Param('boardId') boardId: string, @Param('columnId') columnId: string) {
    await this.columnsService.delete(boardId, columnId);
  }
}
