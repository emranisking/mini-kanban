import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './cache.constants';
import { AppConfig } from '../config/configuration';

/**
 * The only module allowed to talk to Redis directly. Every other service
 * goes through get/set/delete/deleteByPattern here.
 *
 * Redis is a performance layer, never the source of truth: every method
 * swallows Redis errors, logs them, and lets the caller fall back to
 * PostgreSQL instead of failing the request.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    this.defaultTtl = this.configService.get('cache', { infer: true }).ttlSeconds;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`GET failed for key "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds ?? this.defaultTtl;
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      this.logger.warn(`SET failed for key "${key}": ${(err as Error).message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`DEL failed for key "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Deletes every key matching a pattern (e.g. "board:123:user:*").
   * Uses SCAN rather than KEYS so it never blocks Redis on a large keyspace.
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Pattern delete failed for "${pattern}": ${(err as Error).message}`);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.delete(k)));
  }
}
