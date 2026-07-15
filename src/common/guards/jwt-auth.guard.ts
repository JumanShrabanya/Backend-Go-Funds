import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates the Bearer JWT access token on incoming requests.
 * Attach to any route or controller that requires authentication.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
