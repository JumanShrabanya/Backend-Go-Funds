import { registerAs } from '@nestjs/config';

/**
 * Typed configuration factory for all environment variables.
 * Access via ConfigService: configService.get('app').jwtSecret
 */
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '8000', 10),

  database: {
    url: process.env.DATABASE_URL ?? 'localhost',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
