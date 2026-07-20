import { Injectable, Logger } from '@nestjs/common';
import { EligibleFundsGroup } from './fund-eligibility.service';

@Injectable()
export class FundScoringService {
  private readonly logger = new Logger(FundScoringService.name);

  scoreAndRank(groups: EligibleFundsGroup[]): EligibleFundsGroup[] {
    return groups.map(group => {
      // Create a shallow copy to sort
      const rankedFunds = [...group.eligibleFunds].sort((a, b) => {
        // Primary sort: fundReturnRate (descending)
        const returnA = a.fundReturnRate ?? -999;
        const returnB = b.fundReturnRate ?? -999;
        
        if (returnA !== returnB) {
          return returnB - returnA;
        }
        
        // Fallback sort: id string comparison (for stable sort when returns are missing)
        return a.id.localeCompare(b.id);
      });

      if (rankedFunds.length === 0) {
        this.logger.warn(`No eligible funds found for category: ${group.schema.subCategory}`);
      }

      return {
        schema: group.schema,
        eligibleFunds: rankedFunds,
      };
    });
  }
}
