import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/modules/logger/logger.service';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseEventsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
  ) {
    this.attachEvents();
  }

  private attachEvents() {
    this.dataSource
      .initialize()
      .then(() => {
        this.logger.info('✅ Database connected successfully');
      })
      .catch((err) => {
        this.logger.error('❌ Database connection failed', err);
      });

    this.dataSource
      .destroy()
      .then(() => {
        this.logger.info('✅ Database disconnected successfully');
      })
      .catch((err) => {
        this.logger.error('❌ Database disconnection failed', err);
      });
  }
}
