import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RiskProfile, InvestmentGoal, InvestmentHorizon } from '../planner.enums';

@Entity({ name: 'investment_plans' })
export class InvestmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.investmentPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: RiskProfile,
    name: 'risk_profile',
  })
  riskProfile: RiskProfile;

  @Column({
    type: 'enum',
    enum: InvestmentGoal,
    name: 'goal_type',
  })
  goalType: InvestmentGoal;

  @Column({
    type: 'enum',
    enum: InvestmentHorizon,
    name: 'horizon',
  })
  horizon: InvestmentHorizon;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'monthly_amount',
  })
  monthlyAmount: number;

  @Column({ type: 'jsonb' })
  allocations: any;

  @Column({ length: 50, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
