import { registerAs } from '@nestjs/config';

/**
 * Typed configuration factory for all environment variables.
 * Access via ConfigService: configService.get('app').jwtSecret
 */
export const appConfig = registerAs('app', () => {
  const environment = process.env.APP_ENV ?? 'development';
  const isProduction = environment === 'production';

  return {
  environment,
  port: parseInt(process.env.PORT ?? '8000', 10),

  database: {
    // DATABASE_URL remains a backward-compatible fallback for existing Neon setups.
    url: isProduction
      ? (process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? 'localhost')
      : (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5434/gofunds'),
    ssl: isProduction,
    synchronize: !isProduction,
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

  mail: {
    host: 'smtp.gmail.com',
    port: 465,
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
  },

  otp: {
    // OTP expires in 15 minutes
    expiresInMinutes: parseInt(process.env.OTP_EXPIRES_IN_MINUTES ?? '15', 10),
  },
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
