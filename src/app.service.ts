import { Injectable } from '@nestjs/common';
import { RedisService } from './modules/redis/redis.service';

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}
  getHello(): string {
    return 'Hello World!';
  }
}
