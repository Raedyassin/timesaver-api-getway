import { Injectable } from '@nestjs/common';
import { LoggerService } from './modules/logger/logger.service';

@Injectable()
export class AppService {
  constructor(private readonly log: LoggerService) {}
  getHello(): string {
    this.log.info('Hello World!');
    this.log.error('Hello World!', new Error().stack);
    this.log.warn('Hello World!');
    return 'Hello World!';
  }
}
