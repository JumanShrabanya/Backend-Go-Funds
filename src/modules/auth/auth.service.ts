import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { AuthTokensResponseDto } from './dto/response/auth-tokens.response.dto';
import { UserResponseDto } from '../users/dto/response/user.response.dto';
import { User } from '../users/entities/user.entity';
import { MessageResponseDto } from './dto/response/message.response.dto';
import { VerifyEmailRequestDto } from './dto/request/verify-email.request.dto';
import { ResendOtpRequestDto } from './dto/request/resend-otp.request.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterRequestDto): Promise<MessageResponseDto> {
    const saltRounds = this.configService.get<number>(
      'app.bcrypt.saltRounds',
    )!;

    const plainPassword = this.decryptPassword(dto.password);
    
    // Manual validation of decrypted password
    if (plainPassword.length < 8 || plainPassword.length > 20) {
      throw new BadRequestException('Password must be between 8 and 20 characters long.');
    }
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;
    if (!passRegex.test(plainPassword)) {
      throw new BadRequestException('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser?.isVerified) {
      throw new ConflictException('An account with this email already exists.');
    }

    const user = existingUser
      ? await this.usersService.updateUnverifiedUser(existingUser, {
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
        })
      : await this.usersService.createUser({
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
        });

    await this.createAndSendVerificationOtp(user);
    return { message: 'Verification code sent to your email address.' };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginRequestDto): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.findByEmail(
      dto.email.toLowerCase().trim(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const plainPassword = this.decryptPassword(dto.password);
    const isPasswordValid = await bcrypt.compare(plainPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in.',
      );
    }

    return this.generateAuthResponse(user);
  }

  async verifyEmail(dto: VerifyEmailRequestDto): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    if (user.isVerified) {
      throw new BadRequestException('This email address is already verified.');
    }

    const verification = await this.usersService.findActiveVerificationOtp(user.id);
    if (!verification || verification.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    const isOtpValid = await bcrypt.compare(dto.otp, verification.otpHash);
    if (!isOtpValid || !(await this.usersService.consumeVerificationOtp(verification.id))) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    await this.usersService.markEmailVerified(user.id);
    user.isVerified = true;
    return this.generateAuthResponse(user);
  }

  async resendVerificationOtp(dto: ResendOtpRequestDto): Promise<MessageResponseDto> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new BadRequestException('No account exists for this email address.');
    }

    if (user.isVerified) {
      throw new BadRequestException('This email address is already verified.');
    }

    await this.createAndSendVerificationOtp(user);
    return { message: 'Verification code sent to your email address.' };
  }

  async refresh(user: User): Promise<AuthTokensResponseDto> {
    await this.usersService.revokeAllRefreshTokensForUser(user.id);
    return this.generateAuthResponse(user);
  }

  async logout(user: User): Promise<MessageResponseDto> {
    await this.usersService.revokeAllRefreshTokensForUser(user.id);
    return { message: 'You have been signed out successfully.' };
  }

  private async createAndSendVerificationOtp(user: User): Promise<void> {
    const otp = this.generateOtp();
    const saltRounds = this.configService.get<number>('app.bcrypt.saltRounds')!;
    const otpHash = await bcrypt.hash(otp, saltRounds);
    const expiresInMinutes = this.configService.get<number>('app.otp.expiresInMinutes')!;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.usersService.replaceVerificationOtp({
      userId: user.id,
      otpHash,
      expiresAt,
    });
    await this.mailService.sendVerificationEmail(user.email, otp, expiresInMinutes);
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private decryptPassword(encryptedBase64: string): string {
    const privateKey = process.env.RSA_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('RSA_PRIVATE_KEY is not configured in the environment');
    }
    try {
      const buffer = Buffer.from(encryptedBase64, 'base64');
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey.replace(/\\n/g, '\n'), // handle newlines if escaped in .env
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        buffer
      );
      const decryptedStr = decrypted.toString('utf8');
      console.log(`[DEBUG] Decrypted password length: ${decryptedStr.length}`);
      return decryptedStr;
    } catch (err) {
      throw new BadRequestException('Invalid password encryption.');
    }
  }

  // ── Token generation ──────────────────────────────────────────────────────

  private async generateAuthResponse(
    user: User,
  ): Promise<AuthTokensResponseDto> {
    const { accessToken, refreshToken } = await this.generateTokenPair(user);

    const serializedUser = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return plainToInstance(
      AuthTokensResponseDto,
      { accessToken, refreshToken, user: serializedUser },
      { excludeExtraneousValues: true },
    );
  }

  private async generateTokenPair(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenId = uuidv4();

    const accessSignOptions: JwtSignOptions = {
      secret: this.configService.get<string>('app.jwt.accessSecret'),
      expiresIn: (this.configService.get<string>('app.jwt.accessExpiresIn') ?? '15m') as JwtSignOptions['expiresIn'],
    };

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      accessSignOptions,
    );

    const refreshSignOptions: JwtSignOptions = {
      secret: this.configService.get<string>('app.jwt.refreshSecret'),
      expiresIn: (this.configService.get<string>('app.jwt.refreshExpiresIn') ?? '7d') as JwtSignOptions['expiresIn'],
    };

    const rawRefreshToken = this.jwtService.sign(
      { sub: user.id, tokenId },
      refreshSignOptions,
    );

    const saltRounds = this.configService.get<number>(
      'app.bcrypt.saltRounds',
    )!;
    const tokenHash = await bcrypt.hash(rawRefreshToken, saltRounds);

    const refreshExpiresIn =
      this.configService.get<string>('app.jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = this.parseExpiresIn(refreshExpiresIn);

    await this.usersService.saveRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  /**
   * Converts a JWT expiry string (e.g. '7d', '15m') into a Date object.
   */
  private parseExpiresIn(expiresIn: string): Date {
    const now = new Date();
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }

    return now;
  }
}
