import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      this.client = createClient({
        socket: {
          host: this.configService.get('REDIS_HOST', 'localhost'),
          port: this.configService.get('REDIS_PORT', 6379),
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Too many retries on Redis. Giving up.');
              return false; // to stop retrying
            }
            this.logger.warn(`Redis connection retrying... on attempt(${retries})`);
            return Math.min(retries * 100, 3000); // For every retry, it waits retries * 100 milliseconds
          },
        },
        password: this.configService.get('REDIS_PASSWORD'),
      });

      // Event listeners
      this.client.on('error', (err: Error) => {
        this.logger.error('Redis Client Error', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.info('Redis Client Connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.logger.info('Redis Client Connected and Ready');
      });

      this.client.on('end', () => {
        this.isConnected = false;
        this.logger.warn('Redis Client Disconnected');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error.stack);
      throw error;
    }
  }

  private async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.logger.warn('Redis Client Disconnected');
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.client.setEx(key, ttl, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<number> {
    return await this.client.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    // return the remaining time to live in seconds
    return await this.client.ttl(key);
  }
}
