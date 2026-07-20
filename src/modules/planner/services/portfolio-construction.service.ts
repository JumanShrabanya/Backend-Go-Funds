import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EligibleFundsGroup } from './fund-eligibility.service';
import { FundAllocation } from '../interfaces/engine.interfaces';

@Injectable()
export class PortfolioConstructionService {
  construct(rankedGroups: EligibleFundsGroup[]): Omit<FundAllocation, 'monthlyAmount'>[] {
    const allocations: Omit<FundAllocation, 'monthlyAmount'>[] = [];
    const usedFundIds = new Set<string>();

    for (const group of rankedGroups) {
      if (group.eligibleFunds.length === 0) {
        throw new InternalServerErrorException(
          `Could not construct portfolio: No eligible funds found for category ${group.schema.subCategory}.`
        );
      }

      // Find the best fund that hasn't been used yet (to strictly avoid duplicates if categories overlap somehow)
      let selectedFund: typeof group.eligibleFunds[0] | null = null;
      for (const fund of group.eligibleFunds) {
        if (!usedFundIds.has(fund.id)) {
          selectedFund = fund;
          break;
        }
      }

      if (!selectedFund) {
        throw new InternalServerErrorException(
          `Could not construct portfolio: Not enough unique funds for category ${group.schema.subCategory}.`
        );
      }

      usedFundIds.add(selectedFund.id);

      allocations.push({
        fund: selectedFund,
        allocationPercentage: group.schema.percentage,
      });
    }

    return allocations;
  }
}
