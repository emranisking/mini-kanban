import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './board.entity';
import { BoardMember } from './board-member.entity';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { BoardAccessService } from './board-access.service';
import { BoardAccessGuard } from './guards/board-access.guard';
import { BoardRoleGuard } from './guards/board-role.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardMember]), UsersModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardAccessService, BoardAccessGuard, BoardRoleGuard],
  exports: [BoardAccessService, TypeOrmModule],
})
export class BoardsModule {}
