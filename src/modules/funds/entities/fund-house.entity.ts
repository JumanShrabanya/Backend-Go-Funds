import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Fund } from './fund.entity';

@Entity({ name: 'fund_houses' })
export class FundHouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fund_house_name', unique: true, length: 255 })
  fundHouseName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @OneToMany(() => Fund, (fund) => fund.fundHouse)
  funds: Fund[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
