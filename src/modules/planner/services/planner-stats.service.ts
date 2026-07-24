import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentPlan } from '../entities/investment-plan.entity';

export interface RiskAllocationItem {
  name: string;
  value: number;
}

export interface DashboardStats {
  totalPlans: number;
  totalMonthlyInvestment: number;
  riskAllocation: RiskAllocationItem[];
}

@Injectable()
export class PlannerStatsService {
  constructor(
    @InjectRepository(InvestmentPlan)
    private readonly planRepository: Repository<InvestmentPlan>,
  ) {}

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const plans = await this.planRepository.find({
      where: { userId, status: 'active' },
    });

    if (!plans || plans.length === 0) {
      return {
        totalPlans: 0,
        totalMonthlyInvestment: 0,
        riskAllocation: [],
      };
    }

    const totalPlans = plans.length;
    let totalMonthlyInvestment = 0;
    
    // Using a map to aggregate by riskProfile
    const riskMap = new Map<string, number>();

    for (const plan of plans) {
      // Sum the monthly investment. Ensure it's a number since decimal types can come back as strings.
      totalMonthlyInvestment += Number(plan.monthlyAmount || 0);

      const risk = plan.riskProfile || 'Unknown';
      riskMap.set(risk, (riskMap.get(risk) || 0) + 1);
    }

    // Convert map to array format for frontend charting
    const riskAllocation: RiskAllocationItem[] = Array.from(riskMap.entries()).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    return {
      totalPlans,
      totalMonthlyInvestment,
      riskAllocation,
    };
  }

  async getUserPlans(userId: string): Promise<InvestmentPlan[]> {
    return this.planRepository.find({
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async deletePlan(userId: string, planId: string): Promise<boolean> {
    const result = await this.planRepository.update(
      { id: planId, userId },
      { status: 'deleted' }
    );
    return result.affected !== undefined && result.affected > 0;
  }
}
