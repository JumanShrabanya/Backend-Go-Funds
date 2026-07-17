import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundHouse } from './entities/fund-house.entity';
import { Fund } from './entities/fund.entity';
import { FundsSyncService } from './services/funds-sync.service';
import { FundsCronService } from './services/funds-cron.service';
import { FundsQueryService } from './services/funds-query.service';
import { FundsController } from './funds.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FundHouse, Fund]),
  ],
  controllers: [FundsController],
  providers: [FundsSyncService, FundsCronService, FundsQueryService],
  exports: [FundsQueryService],
})
export class FundsModule {}
