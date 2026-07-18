import { FundSubCategory, FundRiskLevel } from '../../funds/funds.enums';
import { Fund } from '../../funds/entities/fund.entity';

export interface AllocationSchema {
  subCategory: FundSubCategory;
  percentage: number;
  targetRisk: FundRiskLevel;
}

export interface FundAllocation {
  fund: Fund;
  allocationPercentage: number;
  monthlyAmount: number;
}

export interface InvestmentPlanOutput {
  monthlyInvestment: number;
  expectedReturnRate: number;
  estimatedFutureValue: number;
  horizonYears: number;
  allocations: FundAllocation[];
  explanation: string[];
}
