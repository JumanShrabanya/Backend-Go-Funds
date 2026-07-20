import { Injectable } from '@nestjs/common';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { RiskProfile } from '../planner.enums';
import { GoalStrategy } from './goal-analysis.service';
import { FundAllocation } from '../interfaces/engine.interfaces';
import { FundSubCategory } from '../../funds/funds.enums';

@Injectable()
export class PlanExplanationService {
  generate(
    dto: CreatePlanDto,
    riskProfile: RiskProfile,
    goalStrategy: GoalStrategy,
    allocations: FundAllocation[],
  ): string[] {
    const explanations: string[] = [];

    explanations.push(
      `Based on your goal to focus on "${goalStrategy.primaryObjective}", we've structured a ${goalStrategy.focusArea}.`
    );

    explanations.push(
      `Your calculated risk profile is ${riskProfile.toUpperCase()}, which accounts for your age (${dto.age}) and investment horizon.`
    );

    if (dto.age < 35) {
      explanations.push(
        `Being under 35 gives you a high risk capacity, allowing a stronger tilt towards growth-oriented funds to maximize long-term wealth.`
      );
    }

    if (allocations.some(a => a.fund.fundSubCategory === FundSubCategory.SMALL_CAP || a.fund.fundSubCategory === FundSubCategory.MID_CAP)) {
      explanations.push(
        `We included Mid and/or Small Cap funds to potentially beat inflation significantly over your extended horizon.`
      );
    }

    if (allocations.some(a => a.fund.fundMainCategory === 'Debt')) {
      explanations.push(
        `Debt funds are included to cushion the portfolio against market volatility and provide stability.`
      );
    }

    explanations.push(
      `All recommended funds are filtered by their historical return performance and selected to avoid category overlap, ensuring true diversification.`
    );

    return explanations;
  }
}
