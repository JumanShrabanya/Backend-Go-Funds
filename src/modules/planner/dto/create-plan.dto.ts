import { IsEnum, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import {
  InvestmentGoal,
  InvestmentHorizon,
  MarketFallReaction,
  InvestmentExperience,
  EmergencyFundStatus,
  InvestmentMode,
} from '../planner.enums';

export class CreatePlanDto {
  @IsNumber()
  @Min(18)
  @Max(100)
  @IsNotEmpty()
  age: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  monthlyIncome: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  monthlyInvestment: number;

  @IsEnum(InvestmentGoal)
  @IsNotEmpty()
  goal: InvestmentGoal;

  @IsEnum(InvestmentHorizon)
  @IsNotEmpty()
  horizon: InvestmentHorizon;

  @IsEnum(MarketFallReaction)
  @IsNotEmpty()
  marketFallReaction: MarketFallReaction;

  @IsEnum(InvestmentExperience)
  @IsNotEmpty()
  investmentExperience: InvestmentExperience;

  @IsEnum(EmergencyFundStatus)
  @IsNotEmpty()
  emergencyFund: EmergencyFundStatus;

  @IsEnum(InvestmentMode)
  @IsNotEmpty()
  investmentMode: InvestmentMode;
}
