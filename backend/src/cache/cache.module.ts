import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { CacheKeyFactory } from './cache-key.factory';
import { REDIS_CLIENT } from './cache.constants';
import { AppConfig } from '../config/configuration';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const redisConfig = configService.get('redis', { infer: true });
        const client = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          // Don't let a slow/unavailable Redis block the app from booting or
          // from serving requests straight from Postgres. See CacheService.
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => Math.min(times * 200, 2000),
          lazyConnect: false,
        });
        client.on('error', (err) => {
          // eslint-disable-next-line no-console
          console.error(`[Redis] connection error: ${err.message}`);
        });
        return client;
      },
    },
    CacheService,
    CacheKeyFactory,
  ],
  exports: [CacheService, CacheKeyFactory],
})
export class CacheModule {}
