import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FundsModule } from './modules/funds/funds.module';
import { User } from './modules/users/entities/user.entity';
import { RefreshToken } from './modules/users/entities/refresh-token.entity';
import { OtpVerification } from './modules/users/entities/otp-verification.entity';
import { FundHouse } from './modules/funds/entities/fund-house.entity';
import { Fund } from './modules/funds/entities/fund.entity';
import { PlannerModule } from './modules/planner/planner.module';
import { InvestmentPlan } from './modules/planner/entities/investment-plan.entity';

@Module({
  imports: [
    // ── Global config ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),

    // ── Database ──────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sslEnabled = configService.get<boolean>('app.database.ssl');

        return {
          type: 'postgres' as const,
          url: configService.get<string>('app.database.url'),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          extra: sslEnabled
            ? { ssl: { rejectUnauthorized: false } }
            : undefined,
          entities: [User, RefreshToken, OtpVerification, FundHouse, Fund, InvestmentPlan],

          // Never mutate a production schema automatically; use migrations there.
          synchronize: configService.get<boolean>('app.database.synchronize'),
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),

    // ── Feature modules ───────────────────────────────────────────────────
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    FundsModule,
    PlannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

