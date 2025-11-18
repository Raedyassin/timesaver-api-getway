import { Module } from '@nestjs/common';
import { SendMailService } from './send-mail.service';
import { MailService } from './mail.service';

@Module({
  providers: [SendMailService, MailService],
  exports: [SendMailService],
})
export class SendMailModule {}
