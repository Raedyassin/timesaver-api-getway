import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { SendMailModule } from '../send-mail/send-mail.module';

@Module({
  imports: [UserModule, SendMailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
