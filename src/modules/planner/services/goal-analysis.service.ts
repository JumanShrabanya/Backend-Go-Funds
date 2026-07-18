import { Injectable } from '@nestjs/common';
import { InvestmentGoal } from '../planner.enums';

export interface GoalStrategy {
  primaryObjective: string;
  focusArea: string;
}

@Injectable()
export class GoalAnalysisService {
  analyze(goal: InvestmentGoal): GoalStrategy {
    switch (goal) {
      case InvestmentGoal.EMERGENCY_FUND:
        return {
          primaryObjective: 'Capital Preservation & Liquidity',
          focusArea: 'Liquid and Ultra-Short Duration Debt Funds',
        };
      case InvestmentGoal.WEALTH_CREATION:
        return {
          primaryObjective: 'Long-Term Capital Appreciation',
          focusArea: 'Equity-Oriented Growth Portfolio',
        };
      case InvestmentGoal.RETIREMENT:
        return {
          primaryObjective: 'Aggressive Growth transitioning to Stability',
          focusArea: 'Diversified Long-Term Equity Portfolio',
        };
      case InvestmentGoal.HOUSE_PURCHASE:
        return {
          primaryObjective: 'Balanced Growth with Lower Volatility',
          focusArea: 'Balanced Advantage or Hybrid Portfolio',
        };
      case InvestmentGoal.CHILD_EDUCATION:
        return {
          primaryObjective: 'Inflation-beating Growth with Gradual Stability',
          focusArea: 'Growth Equity with Debt allocation',
        };
      case InvestmentGoal.TAX_SAVING:
        return {
          primaryObjective: 'Wealth Creation with Section 80C Tax Benefits',
          focusArea: 'ELSS (Equity Linked Savings Scheme) Funds',
        };
      default:
        return {
          primaryObjective: 'Balanced Growth',
          focusArea: 'Diversified Portfolio',
        };
    }
  }
}
