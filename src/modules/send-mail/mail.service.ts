import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { LoggerService } from 'src/modules/logger/logger.service';

@Injectable()
export class MailService {
  private readonly transport: Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.transport = nodemailer.createTransport({
      host: configService.getOrThrow<string>('MAIL_HOST'),
      port: configService.getOrThrow<number>('MAIL_PORT'),
      secure: configService.getOrThrow<number>('MAIL_PORT') == 465,
      auth: {
        user: configService.getOrThrow<string>('MAIL_USER'),
        pass: configService.getOrThrow<string>('MAIL_PASS'),
      },
    });
  }

  async sendMail(
    options: SendMailOptions,
    templateName: string,
  ): Promise<void> {
    try {
      await this.transport.sendMail({
        from: this.configService.getOrThrow<string>('MAIL_FROM'),
        ...options,
      });
      this.logger.info(`${templateName} send to: ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}
