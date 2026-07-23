import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    email: string,
    otp: string,
    expiresInMinutes: number,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your Go Funds email address',
        text: `Your Go Funds verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        html: `<p>Your Go Funds verification code is <strong>${otp}</strong>.</p><p>It expires in ${expiresInMinutes} minutes.</p>`,
      });
    } catch (error) {
      this.logger.error(`Unable to send verification email to ${email}`, error);
      throw new InternalServerErrorException(
        'Unable to send the verification email. Please try again later.',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    otp: string,
    expiresInMinutes: number,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your Go Funds password',
        text: `Your Go Funds password reset code is ${otp}. It expires in ${expiresInMinutes} minutes. If you did not request this, please ignore this email.`,
        html: `<p>Your Go Funds password reset code is <strong>${otp}</strong>.</p><p>It expires in ${expiresInMinutes} minutes.</p><p>If you did not request a password reset, you can safely ignore this email.</p>`,
      });
    } catch (error) {
      this.logger.error(`Unable to send password reset email to ${email}`, error);
      throw new InternalServerErrorException(
        'Unable to send the password reset email. Please try again later.',
      );
    }
  }
}
