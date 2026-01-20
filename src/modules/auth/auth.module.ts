import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { SendMailModule } from '../send-mail/send-mail.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [UserModule, SendMailModule, SubscriptionModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
