import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

export interface JwtRefreshPayload {
  sub: string;       // user id
  tokenId: string;   // refresh token DB record id
  raw: string;       // the raw token (added in the payload for validation)
}

/**
 * Validates the long-lived refresh token.
 * The raw token must match the bcrypt hash stored in the DB.
 * On success, the resolved User entity is attached to req.user.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwt.refreshSecret')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const rawToken = req.headers.authorization?.split(' ')[1];

    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    const tokenRecord = await this.usersService.validateRefreshToken(
      payload.tokenId,
      rawToken,
    );

    if (!tokenRecord) {
      throw new UnauthorizedException(
        'Refresh token is invalid, expired, or revoked.',
      );
    }

    return tokenRecord.user;
  }
}
