import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { FundHouse } from './fund-house.entity';
import { FundMainCategory, FundSubCategory, FundRiskLevel } from '../funds.enums';

@Entity({ name: 'funds' })
export class Fund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fund_house_id' })
  fundHouseId: string;

  @ManyToOne(() => FundHouse, (house) => house.funds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fund_house_id' })
  fundHouse: FundHouse;

  @Column({ name: 'fund_name', length: 255 })
  fundName: string;

  @Column({
    type: 'enum',
    enum: FundMainCategory,
    name: 'fund_main_category',
    default: FundMainCategory.OTHER,
  })
  fundMainCategory: FundMainCategory;

  @Column({
    type: 'enum',
    enum: FundSubCategory,
    name: 'fund_sub_category',
    default: FundSubCategory.OTHER,
  })
  fundSubCategory: FundSubCategory;

  @Index({ unique: true })
  @Column({ name: 'scheme_code', length: 50 })
  schemeCode: string;

  @Column({
    type: 'enum',
    enum: FundRiskLevel,
    name: 'fund_risk',
    default: FundRiskLevel.MODERATE,
  })
  fundRisk: FundRiskLevel;

  @Column({
    name: 'fund_return_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  fundReturnRate: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  isin: string | null;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 4,
    default: 0.0000,
  })
  nav: number;

  @Column({
    name: 'expense_ratio',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  expenseRatio: number | null;

  @Column({
    name: 'assets_under_management',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  assetsUnderManagement: number | null;

  @Column({
    name: 'minimum_investment',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  minimumInvestment: number | null;

  @Column({ name: 'launch_date', type: 'date', nullable: true })
  launchDate: Date | null;

  @Column({ name: 'sip_allowed', type: 'boolean', default: true })
  sipAllowed: boolean;

  @Column({ name: 'lump_sum_allowed', type: 'boolean', default: true })
  lumpSumAllowed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
