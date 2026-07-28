import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private config: ConfigService) {
    const apiKey =
      this.config.get<string>('RESEND_API_KEY') ??
      this.config.get<string>('gmail_password');
    this.from =
      this.config.get<string>('EMAIL_FROM') ??
      (this.config.get<string>('gmail_user')
        ? `Yumix <${this.config.get<string>('gmail_user')}>`
        : 'Yumix <onboarding@resend.dev>');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendVerificationCode(email: string, code: string) {
    if (!this.resend) {
      this.logger.error('RESEND_API_KEY is not configured');
      throw new InternalServerErrorException(
        'ელფოსტის გაგზავნა ვერ მოხერხდა. სცადე მოგვიანებით.',
      );
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: `${code} — Yumix ვერიფიკაციის კოდი`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #FF0050; font-size: 22px; margin: 0 0 12px;">Yumix</h1>
          <p style="color: #333; font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
            შენი რეგისტრაციის ვერიფიკაციის კოდია:
          </p>
          <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #111; margin: 0 0 16px;">
            ${code}
          </p>
          <p style="color: #666; font-size: 13px; margin: 0;">
            კოდი მოქმედებს 10 წუთი. თუ შენ არ მოითხოვე რეგისტრაცია, უგულებელყავი ეს წერილი.
          </p>
        </div>
      `,
      text: `შენი Yumix ვერიფიკაციის კოდია: ${code}. კოდი მოქმედებს 10 წუთი.`,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new InternalServerErrorException(
        'ელფოსტის გაგზავნა ვერ მოხერხდა. სცადე მოგვიანებით.',
      );
    }
  }

  async sendPasswordResetCode(email: string, code: string) {
    if (!this.resend) {
      this.logger.error('RESEND_API_KEY is not configured');
      throw new InternalServerErrorException(
        'ელფოსტის გაგზავნა ვერ მოხერხდა. სცადე მოგვიანებით.',
      );
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: `${code} — Yumix პაროლის აღდგენის კოდი`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #FF0050; font-size: 22px; margin: 0 0 12px;">Yumix</h1>
          <p style="color: #333; font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
            შენი პაროლის აღდგენის კოდია:
          </p>
          <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #111; margin: 0 0 16px;">
            ${code}
          </p>
          <p style="color: #666; font-size: 13px; margin: 0;">
            კოდი მოქმედებს 10 წუთი. თუ შენ არ მოითხოვე პაროლის აღდგენა, უგულებელყავი ეს წერილი.
          </p>
        </div>
      `,
      text: `შენი Yumix პაროლის აღდგენის კოდია: ${code}. კოდი მოქმედებს 10 წუთი.`,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new InternalServerErrorException(
        'ელფოსტის გაგზავნა ვერ მოხერხდა. სცადე მოგვიანებით.',
      );
    }
  }
}
