import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required.' })
  resetToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
