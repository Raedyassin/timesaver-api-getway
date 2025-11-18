import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './modules/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);
  await app.listen(process.env.PORT ?? 3000);

  logger.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
