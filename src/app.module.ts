import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from './modules/logger/logger.module';
import { RedisModule } from './modules/redis/redis.module';
import { SendMailModule } from './modules/send-mail/send-mail.module';
import { GlobalFilter } from './common/filters/global-exception.filter';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from './common/guards/custom-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    RedisModule,
    SendMailModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: parseInt(configService.getOrThrow<string>('RATE_TIME')), // time for each endpoint in seconds
            limit: parseInt(configService.getOrThrow<string>('RATE_REQ')), // requests per ttl for each endpoint
          },
        ],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_FILTER',
      useClass: GlobalFilter,
    },
    {
      provide: 'APP_GUARD',
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
