import { IMailTemplate } from 'src/common/interfaces/mail-template.interface';

export class VerificationCodeTemplate implements IMailTemplate {
  render(data: { code: string; userName?: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #4F46E5; 
              text-align: center; 
              padding: 20px;
              background: white;
              border-radius: 8px;
              letter-spacing: 8px;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              ${data.userName ? `<p>Hello ${data.userName},</p>` : '<p>Hello,</p>'}
              <p>Your verification code is:</p>
              <div class="code">${data.code}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TimeSaver. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
