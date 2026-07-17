import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FundsSyncService } from './funds-sync.service';

@Injectable()
export class FundsCronService {
  private readonly logger = new Logger(FundsCronService.name);

  constructor(private readonly fundsSyncService: FundsSyncService) {}

  // Run daily at 11:00 PM (when AMFI updates NAVs for the day)
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async handleDailyNavSync() {
    this.logger.log('Starting daily scheduled AMFI NAV sync...');
    const result = await this.fundsSyncService.syncAmfiNavData();
    this.logger.log(
      `Daily NAV sync finished. Status: ${result.success ? 'Success' : 'Failed'}. Processed: ${result.processed}, Errors: ${result.errors}`
    );
  }
}
