import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { UpdateProfileRequestDto } from './dto/request/update-profile.request.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,

    @InjectRepository(OtpVerification)
    private readonly otpVerificationRepository: Repository<OtpVerification>,
  ) {}

  // ── User methods ──────────────────────────────────────────────────────────

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsBy({ email });
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    if (await this.existsByEmail(params.email)) {
      throw new ConflictException('An account with this email already exists.');
    }

    const user = this.userRepository.create(params);
    return this.userRepository.save(user);
  }

  async updateUnverifiedUser(
    user: User,
    params: {
      passwordHash: string;
      firstName: string;
      lastName: string;
    },
  ): Promise<User> {
    user.passwordHash = params.passwordHash;
    user.firstName = params.firstName;
    user.lastName = params.lastName;
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isVerified: true });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(userId, { passwordHash });
  }

  async updateProfile(userId: string, data: UpdateProfileRequestDto): Promise<User> {
    const user = await this.findById(userId);
    
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) {
      user.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.annualIncome !== undefined) user.annualIncome = data.annualIncome;

    return this.userRepository.save(user);
  }

  async deleteExpiredUnverifiedUsers(before: Date): Promise<number> {
    const result = await this.userRepository.delete({
      isVerified: false,
      createdAt: LessThan(before),
    });
    return result.affected ?? 0;
  }

  // -- Email OTP methods ---------------------------------------------------

  async replaceVerificationOtp(params: {
    userId: string;
    otpHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.otpVerificationRepository.delete({ userId: params.userId });
    await this.otpVerificationRepository.save(
      this.otpVerificationRepository.create(params),
    );
  }

  async findActiveVerificationOtp(userId: string): Promise<OtpVerification | null> {
    return this.otpVerificationRepository.findOne({
      where: {
        userId,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async consumeVerificationOtp(id: string): Promise<boolean> {
    const result = await this.otpVerificationRepository.update(
      { id, isUsed: false },
      { isUsed: true },
    );
    return (result.affected ?? 0) === 1;
  }

  // ── Refresh token methods ─────────────────────────────────────────────────

  async saveRefreshToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const refreshToken = this.refreshTokenRepository.create(params);
    await this.refreshTokenRepository.save(refreshToken);
  }

  async findRefreshToken(tokenId: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { id: tokenId },
      relations: { user: true },
    });
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, { isRevoked: true });
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  
  async validateRefreshToken(
    tokenId: string,
    rawToken: string,
  ): Promise<RefreshToken | null> {
    const record = await this.findRefreshToken(tokenId);

    if (!record || record.isRevoked || record.expiresAt < new Date()) {
      return null;
    }

    const isMatch = await bcrypt.compare(rawToken, record.tokenHash);
    return isMatch ? record : null;
  }
}
