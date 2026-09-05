import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { BoardColumn } from '../columns/column.entity';
import { TasksService } from './tasks.service';
import { TaskMovementService } from './services/task-movement.service';
import { TasksController } from './tasks.controller';
import { BoardsModule } from '../boards/boards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, BoardColumn]), BoardsModule],
  controllers: [TasksController],
  providers: [TasksService, TaskMovementService],
})
export class TasksModule {}
