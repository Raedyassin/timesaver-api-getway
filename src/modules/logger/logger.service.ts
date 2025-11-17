import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// It helps me monitor application behavior, diagnose errors, track performance,
// and understand what is happening inside the server at any moment.To implement a
// reliable and scalable logging system, I use Winston, one of the most popular and
// powerful logging libraries in Node.js.

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.simple(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true, // compress old files (recommended)
          maxFiles: '40d', // keep for 40 days
          level: 'info',
        }),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, { trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }
}
