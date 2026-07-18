import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { InvestmentPlan } from '../entities/investment-plan.entity';

// Import all engines
import { UserValidationService } from './user-validation.service';
import { RiskAssessmentService } from './risk-assessment.service';
import { GoalAnalysisService } from './goal-analysis.service';
import { AssetAllocationService } from './asset-allocation.service';
import { FundEligibilityService } from './fund-eligibility.service';
import { FundScoringService } from './fund-scoring.service';
import { PortfolioConstructionService } from './portfolio-construction.service';
import { InvestmentCalculatorService } from './investment-calculator.service';
import { PlanExplanationService } from './plan-explanation.service';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(InvestmentPlan)
    private readonly planRepository: Repository<InvestmentPlan>,
    private readonly validationService: UserValidationService,
    private readonly riskAssessmentService: RiskAssessmentService,
    private readonly goalAnalysisService: GoalAnalysisService,
    private readonly assetAllocationService: AssetAllocationService,
    private readonly fundEligibilityService: FundEligibilityService,
    private readonly fundScoringService: FundScoringService,
    private readonly portfolioConstructionService: PortfolioConstructionService,
    private readonly calculatorService: InvestmentCalculatorService,
    private readonly explanationService: PlanExplanationService,
  ) {}

  async generateRecommendation(userId: string, dto: CreatePlanDto): Promise<InvestmentPlan> {
    // 1. Validation
    this.validationService.validate(dto);

    // 2. Risk Assessment
    const riskProfile = this.riskAssessmentService.assess(dto);

    // 3. Goal Analysis
    const goalStrategy = this.goalAnalysisService.analyze(dto.goal);

    // 4. Asset Allocation
    const allocationSchemas = this.assetAllocationService.allocate(riskProfile, dto.horizon, dto.goal);

    // 5. Fund Eligibility
    const eligibleGroups = await this.fundEligibilityService.filterEligibleFunds(allocationSchemas, dto.investmentMode);

    // 6. Fund Scoring
    const scoredGroups = this.fundScoringService.scoreAndRank(eligibleGroups);

    // 7. Portfolio Construction
    const constructedAllocations = this.portfolioConstructionService.construct(scoredGroups);

    // 8. Investment Calculator
    const calculation = this.calculatorService.calculate(
      constructedAllocations,
      dto.monthlyInvestment,
      dto.horizon
    );

    // 9. Plan Explanation
    const explanation = this.explanationService.generate(dto, riskProfile, goalStrategy, calculation.allocations);

    // 10. Assemble and Save Plan
    const allocationsJson = {
      expectedReturnRate: calculation.expectedReturnRate,
      estimatedFutureValue: calculation.estimatedFutureValue,
      horizonYears: calculation.horizonYears,
      funds: calculation.allocations.map(a => ({
        fundId: a.fund.id,
        fundName: a.fund.fundName,
        category: a.fund.fundSubCategory,
        percentage: a.allocationPercentage,
        monthlyAmount: a.monthlyAmount,
      })),
      explanation,
    };

    const newPlan = this.planRepository.create({
      userId,
      riskProfile,
      goalType: dto.goal,
      horizon: dto.horizon,
      monthlyAmount: dto.monthlyInvestment,
      allocations: allocationsJson,
      status: 'active',
    });

    try {
      return await this.planRepository.save(newPlan);
    } catch (error) {
      throw new InternalServerErrorException('Failed to save the investment plan.');
    }
  }
}
