import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { UsersService } from './users.service';
import { UsersCleanupService } from './users-cleanup.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken, OtpVerification])],
  controllers: [UsersController],
  providers: [UsersService, UsersCleanupService],
  exports: [UsersService],
})
export class UsersModule {}
