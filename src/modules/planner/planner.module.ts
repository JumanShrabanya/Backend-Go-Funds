import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerController } from './planner.controller';
import { InvestmentPlan } from './entities/investment-plan.entity';
import { FundsModule } from '../funds/funds.module';

// Services
import { UserValidationService } from './services/user-validation.service';
import { PlannerStatsService } from './services/planner-stats.service';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { GoalAnalysisService } from './services/goal-analysis.service';
import { AssetAllocationService } from './services/asset-allocation.service';
import { FundEligibilityService } from './services/fund-eligibility.service';
import { FundScoringService } from './services/fund-scoring.service';
import { PortfolioConstructionService } from './services/portfolio-construction.service';
import { InvestmentCalculatorService } from './services/investment-calculator.service';
import { PlanExplanationService } from './services/plan-explanation.service';
import { RecommendationService } from './services/recommendation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvestmentPlan]),
    FundsModule, // Need access to funds query service
  ],
  controllers: [PlannerController],
  providers: [
    UserValidationService,
    PlannerStatsService,
    RiskAssessmentService,
    GoalAnalysisService,
    AssetAllocationService,
    FundEligibilityService,
    FundScoringService,
    PortfolioConstructionService,
    InvestmentCalculatorService,
    PlanExplanationService,
    RecommendationService,
  ],
  exports: [RecommendationService],
})
export class PlannerModule {}
