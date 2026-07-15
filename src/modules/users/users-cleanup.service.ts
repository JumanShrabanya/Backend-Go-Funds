import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class UsersCleanupService {
  private readonly logger = new Logger(UsersCleanupService.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async removeExpiredUnverifiedUsers(): Promise<void> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const deleted = await this.usersService.deleteExpiredUnverifiedUsers(cutoff);
    if (deleted > 0) {
      this.logger.log(`Deleted ${deleted} unverified user account(s).`);
    }
  }
}
