import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Fund } from '../entities/fund.entity';
import { FundMainCategory, FundSubCategory, FundRiskLevel } from '../funds.enums';
import { InvestmentMode } from '../../planner/planner.enums';

export interface FundListOptions {
  page: number;
  limit: number;
  mainCategory?: FundMainCategory;
  subCategory?: FundSubCategory;
  risk?: FundRiskLevel;
  search?: string;
}

@Injectable()
export class FundsQueryService {
  private readonly logger = new Logger(FundsQueryService.name);

  constructor(
    @InjectRepository(Fund)
    private readonly fundRepository: Repository<Fund>,
  ) {}

  async findAll(options: FundListOptions): Promise<{
    data: Fund[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, mainCategory, subCategory, risk, search } = options;

    const queryBuilder = this.fundRepository
      .createQueryBuilder('fund')
      .leftJoinAndSelect('fund.fundHouse', 'fundHouse')
      .orderBy('fund.fundName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (mainCategory) {
      queryBuilder.andWhere('fund.fundMainCategory = :mainCategory', { mainCategory });
    }
    if (subCategory) {
      queryBuilder.andWhere('fund.fundSubCategory = :subCategory', { subCategory });
    }
    if (risk) {
      queryBuilder.andWhere('fund.fundRisk = :risk', { risk });
    }
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(fund.fundName) LIKE :search OR LOWER(fund.schemeCode) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneById(id: string): Promise<Fund> {
    const fund = await this.fundRepository.findOne({
      where: { id },
      relations: { fundHouse: true },
    });
    if (!fund) throw new NotFoundException(`Fund with ID "${id}" not found.`);
    return fund;
  }

  async findBySchemeCode(schemeCode: string): Promise<Fund> {
    const fund = await this.fundRepository.findOne({
      where: { schemeCode },
      relations: { fundHouse: true },
    });
    if (!fund) throw new NotFoundException(`Fund with scheme code "${schemeCode}" not found.`);
    return fund;
  }

  /**
   * Internal method used by the Recommendation Engine to find funds matching 
   * strict criteria.
   */
  async findEligibleFunds(
    subCategory: FundSubCategory,
    risk: FundRiskLevel,
    mode: InvestmentMode,
  ): Promise<Fund[]> {
    const queryBuilder = this.fundRepository.createQueryBuilder('fund');

    queryBuilder.andWhere('fund.fundSubCategory = :subCategory', { subCategory });
  

    if (mode === InvestmentMode.SIP) {
      queryBuilder.andWhere('fund.sipAllowed = :sipAllowed', { sipAllowed: true });
    } else if (mode === InvestmentMode.LUMP_SUM) {
      queryBuilder.andWhere('fund.lumpSumAllowed = :lumpSumAllowed', { lumpSumAllowed: true });
    } else if (mode === InvestmentMode.BOTH) {
      queryBuilder.andWhere('fund.sipAllowed = :sipAllowed AND fund.lumpSumAllowed = :lumpSumAllowed', { 
        sipAllowed: true, 
        lumpSumAllowed: true 
      });
    }

    return await queryBuilder.getMany();
  }
}
