import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';
import { IMailTemplate } from 'src/common/interfaces/mail-template.interface';
import { VerificationCodeTemplate } from './templates/verfication-code.template';
import { ForgotPasswordCodeTemplate } from './templates/forgot-password-code.template';

@Injectable()
export class SendMailService {
  private template = new Map<string, IMailTemplate>();
  constructor(private readonly mailService: MailService) {
    this.template.set('verificationCode', new VerificationCodeTemplate());
    this.template.set('forgotPasswordCode', new ForgotPasswordCodeTemplate());
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
  async sendPasswordResetCode(
    userEmail: string,
    userName: string,
    code: string,
  ) {
    await this.mailService.sendMail(
      {
        to: userEmail,
        subject: 'TimeSaver Forgot Password Code',
        html: this.template
          ?.get('forgotPasswordCode')
          ?.render({ code, userName }),
      },
      'Forgot Password Code Email',
    );
  }
}
