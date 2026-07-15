import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { AuthTokensResponseDto } from './dto/response/auth-tokens.response.dto';
import { UserResponseDto } from '../users/dto/response/user.response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterRequestDto): Promise<AuthTokensResponseDto> {
    const saltRounds = this.configService.get<number>(
      'app.bcrypt.saltRounds',
    )!;

    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.createUser({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    });

    return this.generateAuthResponse(user);
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginRequestDto): Promise<AuthTokensResponseDto> {
    const user = await this.usersService.findByEmail(
      dto.email.toLowerCase().trim(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    return this.generateAuthResponse(user);
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
