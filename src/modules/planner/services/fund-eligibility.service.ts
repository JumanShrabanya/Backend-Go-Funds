import { Injectable } from '@nestjs/common';
import { AllocationSchema } from '../interfaces/engine.interfaces';
import { InvestmentMode } from '../planner.enums';
import { FundsQueryService } from '../../funds/services/funds-query.service';
import { Fund } from '../../funds/entities/fund.entity';

export interface EligibleFundsGroup {
  schema: AllocationSchema;
  eligibleFunds: Fund[];
}

@Injectable()
export class FundEligibilityService {
  constructor(private readonly fundsQueryService: FundsQueryService) {}

  async filterEligibleFunds(
    schemas: AllocationSchema[],
    mode: InvestmentMode,
  ): Promise<EligibleFundsGroup[]> {
    const groups: EligibleFundsGroup[] = [];

    for (const schema of schemas) {
      // Find funds matching the required sub-category, target risk, and investment mode
      const funds = await this.fundsQueryService.findEligibleFunds(
        schema.subCategory,
        schema.targetRisk,
        mode,
      );

      groups.push({
        schema,
        eligibleFunds: funds,
      });
    }

    return groups;
  }
}
