import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { AuthTokensResponseDto } from './dto/response/auth-tokens.response.dto';
import { MessageResponseDto } from './dto/response/message.response.dto';
import { VerifyEmailRequestDto } from './dto/request/verify-email.request.dto';
import { ResendOtpRequestDto } from './dto/request/resend-otp.request.dto';
import { ForgotPasswordRequestDto } from './dto/request/forgot-password.request.dto';
import { VerifyResetOtpRequestDto } from './dto/request/verify-reset-otp.request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<MessageResponseDto> {
    return this.authService.register(dto);
  }

  
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto): Promise<AuthTokensResponseDto> {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailRequestDto,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification-otp')
  @HttpCode(HttpStatus.OK)
  async resendVerificationOtp(
    @Body() dto: ResendOtpRequestDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resendVerificationOtp(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@CurrentUser() user: User): Promise<AuthTokensResponseDto> {
    return this.authService.refresh(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async logout(@CurrentUser() user: User): Promise<MessageResponseDto> {
    return this.authService.logout(user);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyResetOtp(@Body() dto: VerifyResetOtpRequestDto): Promise<{ resetToken: string }> {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }
}
