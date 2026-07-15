import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
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
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
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

  /**
   * Validates a raw refresh token string against a stored RefreshToken record.
   * Returns the record if valid, null otherwise.
   */
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
