import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor() {}

  private transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    port: parseInt(process.env.SMTP_PORT),
    host: process.env.SMTP_SERVER,
    secure: true,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_ID,
      pass: process.env.SMTP_PW,
    },
  });

  async sendPasswordResetEmail({
    email,
    resetCode,
  }: {
    email: string;
    resetCode: string;
  }) {
    const mailOptions = {
      from: process.env.SMTP_ID,
      to: email,
      subject: '비밀번호 재설정 요청',
      html: `
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
          <h1 style="color: #333;">비밀번호 재설정</h1>
          <p>아래의 인증 코드를 입력하여 비밀번호를 재설정하세요:</p>
          <h2 style="color: #007bff; letter-spacing: 3px;">${resetCode}</h2>
          <p style="color: #666; font-size: 14px;">이 코드는 30분 후에 만료됩니다.</p>
          <p style="color: #dc3545;">본인이 요청하지 않은 경우 이 메일을 무시하세요.</p>
        </div>
      `,
    };

    return this.transporter.sendMail(mailOptions);
  }
}
