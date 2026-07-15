import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates the Bearer JWT refresh token on incoming requests.
 * Used exclusively on the token-refresh endpoint.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
