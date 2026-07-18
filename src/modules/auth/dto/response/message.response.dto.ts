import { Expose } from 'class-transformer';

/**
 * Returned from /auth/register and /auth/resend-otp.
 * Does not include tokens since the user is not yet verified.
 */
export class MessageResponseDto {
  @Expose()
  message: string;
}
