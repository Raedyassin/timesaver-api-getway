import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './modules/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const logger = app.get(LoggerService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown fields (extra fields)
      forbidNonWhitelisted: false, // for an extra field don't throw an error
      transform: true, // auto-transform types
    }),
  );

  await app.listen(process.env.PORT ?? 3000);

  logger.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
