import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Board } from '../boards/board.entity';
import { BoardMember } from '../boards/board-member.entity';
import { BoardColumn } from '../columns/column.entity';
import { Task } from '../tasks/task.entity';
import { AppConfig } from '../config/configuration';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        type: 'postgres',
        host: configService.get('database', { infer: true }).host,
        port: configService.get('database', { infer: true }).port,
        username: configService.get('database', { infer: true }).user,
        password: configService.get('database', { infer: true }).password,
        database: configService.get('database', { infer: true }).name,
        entities: [User, Board, BoardMember, BoardColumn, Task],
        // Migrations are the source of schema truth; never auto-sync in any environment.
        synchronize: false,
        logging: configService.get('nodeEnv', { infer: true }) === 'development' ? ['error', 'warn'] : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
