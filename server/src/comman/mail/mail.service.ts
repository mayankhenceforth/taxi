import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('NODEMAILER_EMAIL'),
        pass: this.configService.get<string>('NODEMAILER_PASSWORD'),
      },
    });
  }

  async sendPdf({ email, subject, pdfBuffer }: { email: string; subject: string; pdfBuffer: Buffer }) {

    await this.transporter.sendMail({
      from: this.configService.get<string>('NODEMAILER_EMAIL'),
      to: email,
      subject,
      text: `Hello ${email}, please find the attached PDF document.`,
      attachments: [
        {
          filename: 'document.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`PDF sent to ${email}`);
  }

 async sendMail(options: { to: string; subject: string; text?: string; html?: string }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('NODEMAILER_EMAIL'),
      ...options, // spreads to, subject, text, html
    });

    console.log(`Email sent to ${options.to}`);
  }
}