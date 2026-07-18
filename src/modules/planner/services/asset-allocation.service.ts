import { Injectable } from '@nestjs/common';
import { RiskProfile, InvestmentGoal, InvestmentHorizon } from '../planner.enums';
import { FundSubCategory, FundRiskLevel } from '../../funds/funds.enums';
import { AllocationSchema } from '../interfaces/engine.interfaces';

@Injectable()
export class AssetAllocationService {
  allocate(riskProfile: RiskProfile, horizon: InvestmentHorizon, goal: InvestmentGoal): AllocationSchema[] {
    
    // 1. Goal Overrides
    if (goal === InvestmentGoal.TAX_SAVING) {
      return [
        { subCategory: FundSubCategory.ELSS, percentage: 1.0, targetRisk: FundRiskLevel.VERY_HIGH }
      ];
    }
    
    if (goal === InvestmentGoal.EMERGENCY_FUND) {
      return [
        { subCategory: FundSubCategory.LIQUID, percentage: 1.0, targetRisk: FundRiskLevel.LOW_TO_MODERATE }
      ];
    }

    // 2. Base Asset Class Split
    let equityPct = 0;
    let debtPct = 0;

    switch (riskProfile) {
      case RiskProfile.AGGRESSIVE:
        equityPct = 0.8;
        debtPct = 0.2;
        break;
      case RiskProfile.MODERATE:
        equityPct = 0.6;
        debtPct = 0.4;
        break;
      case RiskProfile.CONSERVATIVE:
        equityPct = 0.3;
        debtPct = 0.7;
        break;
    }

    const schemas: AllocationSchema[] = [];

    // 3. Debt Allocation
    if (debtPct > 0) {
      // For debt, we'll suggest a dynamic bond fund or corporate bond for diversification
      schemas.push({
        subCategory: FundSubCategory.CORPORATE_BOND,
        percentage: debtPct,
        targetRisk: FundRiskLevel.MODERATE
      });
    }

    // 4. Equity Allocation based on Horizon
    if (equityPct > 0) {
      if (horizon === InvestmentHorizon.LESS_THAN_3_YEARS) {
        // Very short horizon for equity -> stick to large cap
        schemas.push({
          subCategory: FundSubCategory.LARGE_CAP,
          percentage: equityPct,
          targetRisk: FundRiskLevel.VERY_HIGH
        });
      } else if (horizon === InvestmentHorizon.THREE_TO_FIVE_YEARS) {
        // Large & Mid
        schemas.push({
          subCategory: FundSubCategory.LARGE_CAP,
          percentage: Number((equityPct * 0.7).toFixed(2)),
          targetRisk: FundRiskLevel.VERY_HIGH
        });
        schemas.push({
          subCategory: FundSubCategory.MID_CAP,
          percentage: Number((equityPct * 0.3).toFixed(2)),
          targetRisk: FundRiskLevel.VERY_HIGH
        });
      } else {
        // 5+ years -> Large, Mid, Small
        schemas.push({
          subCategory: FundSubCategory.LARGE_CAP,
          percentage: Number((equityPct * 0.5).toFixed(2)),
          targetRisk: FundRiskLevel.VERY_HIGH
        });
        schemas.push({
          subCategory: FundSubCategory.MID_CAP,
          percentage: Number((equityPct * 0.3).toFixed(2)),
          targetRisk: FundRiskLevel.VERY_HIGH
        });
        schemas.push({
          subCategory: FundSubCategory.SMALL_CAP,
          percentage: Number((equityPct * 0.2).toFixed(2)),
          targetRisk: FundRiskLevel.VERY_HIGH
        });
      }
    }

    // Normalize percentages to ensure they sum exactly to 1.0
    const totalPct = schemas.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPct !== 1.0 && schemas.length > 0) {
      const diff = 1.0 - totalPct;
      schemas[0].percentage = Number((schemas[0].percentage + diff).toFixed(2));
    }

    return schemas;
  }
}
