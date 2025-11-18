import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';
import { IMailTemplate } from 'src/common/interfaces/mail-template.interface';
import { VerificationCodeTemplate } from './templates/verfication-code.template';

@Injectable()
export class SendMailService {
  private template = new Map<string, IMailTemplate>();
  constructor(private readonly mailService: MailService) {
    this.template.set('verificationCode', new VerificationCodeTemplate());
  }
  async sendVerificationCode(
    userEmail: string,
    userName: string,
    code: string,
  ) {
    await this.mailService.sendMail(
      {
        to: userEmail,
        subject: 'TimeSaver Email Verification',
        html: this.template
          ?.get('verificationCode')
          ?.render({ code, userName }),
      },
      'Verification Code Email',
    );
  }
}
