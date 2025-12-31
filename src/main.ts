import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './modules/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { raw } from 'express';
// import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const logger = app.get(LoggerService);

  // for stripe webhook run correctly
  // app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));
  // Because Stripe requires the raw body, not JSON parsed.
  app.use('/api/v1/payment/webhook', raw({ type: 'application/json' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown fields (extra fields)
      forbidNonWhitelisted: false, // for an extra field don't throw an error
      transform: true, // auto-transform types
    }),
  );

  // Get the already-initialized DataSource
  const dataSource = app.get(DataSource);

  if (dataSource.isInitialized) {
    logger.info('✅ Database connected successfully');
  } else {
    logger.error('❌ Database failed to connect');
  }

  await app.listen(process.env.PORT ?? 3000);

  logger.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
