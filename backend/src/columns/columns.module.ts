import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardColumn } from './column.entity';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { BoardsModule } from '../boards/boards.module';

@Module({
  imports: [TypeOrmModule.forFeature([BoardColumn]), BoardsModule],
  controllers: [ColumnsController],
  providers: [ColumnsService],
  exports: [TypeOrmModule],
})
export class ColumnsModule {}
