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
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
// import { DatabaseEventsService } from './services/database-events.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(
            configService.getOrThrow<string>('JWT_EXPIRATION'),
          ), // '30d'
        },
      }),
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.getOrThrow<string>('DB_SYNC') == 'true',
      }),
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    // DatabaseEventsService,
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
