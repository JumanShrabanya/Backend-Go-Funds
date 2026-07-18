import { Injectable } from '@nestjs/common';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { 
  InvestmentHorizon, 
  MarketFallReaction, 
  InvestmentExperience, 
  EmergencyFundStatus,
  RiskProfile 
} from '../planner.enums';

@Injectable()
export class RiskAssessmentService {
  assess(dto: CreatePlanDto): RiskProfile {
    let capacityScore = 0;
    let toleranceScore = 0;

    // --- Capacity ---
    
    // 1. Age
    if (dto.age >= 18 && dto.age <= 30) capacityScore += 15;
    else if (dto.age >= 31 && dto.age <= 40) capacityScore += 12;
    else if (dto.age >= 41 && dto.age <= 50) capacityScore += 8;
    else if (dto.age >= 51 && dto.age <= 60) capacityScore += 4;
    else capacityScore += 0;

    // 2. Horizon
    if (dto.horizon === InvestmentHorizon.MORE_THAN_10_YEARS) capacityScore += 30;
    else if (dto.horizon === InvestmentHorizon.FIVE_TO_TEN_YEARS) capacityScore += 20;
    else if (dto.horizon === InvestmentHorizon.THREE_TO_FIVE_YEARS) capacityScore += 10;
    else capacityScore += 0;

    // 3. Emergency Fund
    if (dto.emergencyFund === EmergencyFundStatus.MORE_THAN_6_MONTHS) capacityScore += 10;
    else if (dto.emergencyFund === EmergencyFundStatus.THREE_TO_SIX_MONTHS) capacityScore += 5;
    else capacityScore += 0;

    // 4. Investment Rate (Inv / Inc)
    const invRate = dto.monthlyInvestment / dto.monthlyIncome;
    if (invRate < 0.2) capacityScore += 10;
    else if (invRate <= 0.4) capacityScore += 5;
    else capacityScore += 0;

    // --- Tolerance ---

    // 1. Market Fall
    if (dto.marketFallReaction === MarketFallReaction.BUY_MORE) toleranceScore += 30;
    else if (dto.marketFallReaction === MarketFallReaction.WAIT) toleranceScore += 15;
    else toleranceScore += 0;

    // 2. Experience
    if (dto.investmentExperience === InvestmentExperience.MORE_THAN_2_YEARS) toleranceScore += 10;
    else if (dto.investmentExperience === InvestmentExperience.LESS_THAN_2_YEARS) toleranceScore += 5;
    else toleranceScore += 2;

    // --- Decision Matrix ---
    const isHighCapacity = capacityScore > 30;
    const isHighTolerance = toleranceScore > 20;

    if (isHighCapacity && isHighTolerance) return RiskProfile.AGGRESSIVE;
    if (isHighCapacity && !isHighTolerance) return RiskProfile.MODERATE;
    if (!isHighCapacity && isHighTolerance) return RiskProfile.MODERATE;
    
    return RiskProfile.CONSERVATIVE;
  }
}
