import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskMovementService } from './services/task-movement.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardAccessGuard } from '../boards/guards/board-access.guard';
import { BoardRoleGuard } from '../boards/guards/board-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { BoardRole } from '../boards/board-role.enum';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('boards/:boardId/tasks')
@UseGuards(JwtAuthGuard, BoardAccessGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskMovementService: TaskMovementService,
  ) {}

  @Get()
  list(@Param('boardId') boardId: string) {
    return this.tasksService.list(boardId);
  }

  @Get(':taskId')
  getOne(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.getOne(boardId, taskId, user.userId);
  }

  @Post()
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  create(@Param('boardId') boardId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(boardId, dto);
  }

  @Patch(':taskId')
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  update(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(boardId, taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  async remove(@Param('boardId') boardId: string, @Param('taskId') taskId: string) {
    await this.tasksService.delete(boardId, taskId);
  }

  @Patch(':taskId/move')
  @UseGuards(BoardRoleGuard)
  @RequireRole(BoardRole.OWNER, BoardRole.EDITOR)
  move(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.taskMovementService.move(boardId, taskId, dto);
  }
}
