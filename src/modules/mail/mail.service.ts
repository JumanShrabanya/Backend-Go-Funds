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
}
