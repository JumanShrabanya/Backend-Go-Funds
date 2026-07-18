import { Injectable } from '@nestjs/common';
import { FundAllocation } from '../interfaces/engine.interfaces';
import { InvestmentHorizon } from '../planner.enums';
import { FundMainCategory } from '../../funds/funds.enums';

@Injectable()
export class InvestmentCalculatorService {
  calculate(
    baseAllocations: Omit<FundAllocation, 'monthlyAmount'>[],
    monthlyInvestment: number,
    horizonEnum: InvestmentHorizon,
  ): {
    allocations: FundAllocation[];
    expectedReturnRate: number;
    estimatedFutureValue: number;
    horizonYears: number;
  } {
    // 1. Assign exact monthly amounts to each fund
    const allocations: FundAllocation[] = baseAllocations.map(alloc => ({
      ...alloc,
      monthlyAmount: Math.round(monthlyInvestment * alloc.allocationPercentage),
    }));

    // 2. Map Horizon Enum to Years for projection
    let horizonYears = 5;
    switch (horizonEnum) {
      case InvestmentHorizon.LESS_THAN_3_YEARS:
        horizonYears = 2;
        break;
      case InvestmentHorizon.THREE_TO_FIVE_YEARS:
        horizonYears = 4;
        break;
      case InvestmentHorizon.FIVE_TO_TEN_YEARS:
        horizonYears = 7;
        break;
      case InvestmentHorizon.MORE_THAN_10_YEARS:
        horizonYears = 15;
        break;
    }

    // 3. Calculate blended expected return rate
    // Assumption: Equity ~ 12%, Debt ~ 7%, Hybrid ~ 10%, Others ~ 6%
    let blendedRate = 0;
    for (const alloc of allocations) {
      let expectedRate = 0.06; // default
      if (alloc.fund.fundMainCategory === FundMainCategory.EQUITY) {
        expectedRate = 0.12;
      } else if (alloc.fund.fundMainCategory === FundMainCategory.DEBT) {
        expectedRate = 0.07;
      } else if (alloc.fund.fundMainCategory === FundMainCategory.HYBRID) {
        expectedRate = 0.10;
      }
      blendedRate += expectedRate * alloc.allocationPercentage;
    }

    // 4. Calculate Future Value (FV of an Ordinary Annuity / SIP)
    // Formula: P * [ ((1 + r)^n - 1) / r ] * (1 + r)
    // P = Monthly SIP
    // r = Monthly Rate
    // n = Total Months
    const P = monthlyInvestment;
    const r = blendedRate / 12;
    const n = horizonYears * 12;

    const fv = P * ( (Math.pow(1 + r, n) - 1) / r ) * (1 + r);

    return {
      allocations,
      expectedReturnRate: Number((blendedRate * 100).toFixed(2)),
      estimatedFutureValue: Math.round(fv),
      horizonYears,
    };
  }
}
