import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FundHouse } from '../entities/fund-house.entity';
import { Fund } from '../entities/fund.entity';
import { FundMainCategory, FundSubCategory, FundRiskLevel } from '../funds.enums';

const COMMON_AMCS = [
  'SBI', 'HDFC', 'ICICI Prudential', 'Nippon India', 'Axis', 'Kotak', 'Aditya Birla Sun Life',
  'DSP', 'Franklin Templeton', 'UTI', 'Bandhan', 'Quant', 'Tata', 'Parag Parikh', 'Motilal Oswal',
  'Invesco', 'Canara Robeco', 'Groww', 'HSBC', 'LIC', 'PGIM India', 'PPFAS', 'Sundaram', 'Taurus',
  'Union', 'WhiteOak Capital'
];

@Injectable()
export class FundsSyncService {
  private readonly logger = new Logger(FundsSyncService.name);

  constructor(
    @InjectRepository(FundHouse)
    private readonly fundHouseRepository: Repository<FundHouse>,
    @InjectRepository(Fund)
    private readonly fundRepository: Repository<Fund>,
  ) {}

  async syncAmfiNavData(): Promise<{ success: boolean; processed: number; errors: number }> {
    this.logger.log('Starting AMFI NAV data synchronization...');
    let processedCount = 0;
    let errorCount = 0;

    try {
      const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch AMFI feed: ${response.statusText}`);
      }

      const textData = await response.text();
      const lines = textData.split('\n');

      // Map to keep track of already verified FundHouses to avoid repetitive DB queries
      const fundHouseMap = new Map<string, string>();

      // Batch array for database upserts
      const fundsToUpsert: Partial<Fund>[] = [];
      const batchSize = 300;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip headers, empty lines, or AMC group name separators (which don't contain semicolons)
        if (!line || !line.includes(';') || line.startsWith('Scheme Code')) {
          continue;
        }

        const parts = line.split(';');
        if (parts.length < 5) continue;

        const schemeCode = parts[0].trim();
        const isin = parts[1].trim() || parts[2].trim() || null;
        const fundName = parts[3].trim();
        const navVal = parseFloat(parts[4].trim());

        if (isNaN(navVal)) continue;

        try {
          // 1. Resolve FundHouse
          const amcName = this.extractAmcName(fundName);
          let fundHouseId = fundHouseMap.get(amcName);

          if (!fundHouseId) {
            let house = await this.fundHouseRepository.findOne({ where: { fundHouseName: amcName } });
            if (!house) {
              house = this.fundHouseRepository.create({ fundHouseName: amcName });
              house = await this.fundHouseRepository.save(house);
            }
            fundHouseId = house.id;
            fundHouseMap.set(amcName, fundHouseId);
          }

          // 2. Classify Categories & Risk
          const { mainCat, subCat } = this.classifyFund(fundName);
          const risk = this.estimateRisk(mainCat, subCat);
          const mockReturns = this.estimateReturns(mainCat, subCat);

          fundsToUpsert.push({
            schemeCode,
            fundName,
            isin,
            nav: navVal,
            fundHouseId,
            fundMainCategory: mainCat,
            fundSubCategory: subCat,
            fundRisk: risk,
            fundReturnRate: mockReturns,
            launchDate: new Date('2018-01-01'), // Default default fallback launch date
          });

          processedCount++;

          // 3. Batch write to database
          if (fundsToUpsert.length >= batchSize) {
            await this.upsertFundsBatch(fundsToUpsert);
            fundsToUpsert.length = 0; // Clear array
          }

        } catch (err) {
          errorCount++;
          if (errorCount <= 10) {
            this.logger.error(`Error processing scheme ${schemeCode}: ${err instanceof Error ? err.message : err}`);
          }
        }
      }

      // Upsert remaining items
      if (fundsToUpsert.length > 0) {
        await this.upsertFundsBatch(fundsToUpsert);
      }

      this.logger.log(`AMFI NAV sync completed. Processed: ${processedCount}, Errors: ${errorCount}`);
      return { success: true, processed: processedCount, errors: errorCount };

    } catch (error) {
      this.logger.error('Error during AMFI NAV synchronization', error);
      return { success: false, processed: processedCount, errors: errorCount };
    }
  }

  private extractAmcName(fundName: string): string {
    const matched = COMMON_AMCS.find(amc => fundName.toLowerCase().startsWith(amc.toLowerCase()));
    if (matched) {
      return `${matched} Mutual Fund`;
    }
    // Fallback: Use the first two words of the fund name
    const words = fundName.split(' ').slice(0, 2).join(' ');
    return `${words} Mutual Fund`;
  }

  private classifyFund(name: string): { mainCat: FundMainCategory; subCat: FundSubCategory } {
    const lower = name.toLowerCase();

    // Index Funds
    if (lower.includes('index') || lower.includes('nifty') || lower.includes('sensex')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.INDEX_FUNDS };
    }
    // Large Cap
    if (lower.includes('large cap')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.LARGE_CAP };
    }
    // Mid Cap
    if (lower.includes('mid cap')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.MID_CAP };
    }
    // Small Cap
    if (lower.includes('small cap')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.SMALL_CAP };
    }
    // Flexi Cap
    if (lower.includes('flexi cap')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.FLEXI_CAP };
    }
    // Multi Cap
    if (lower.includes('multi cap')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.MULTI_CAP };
    }
    // ELSS / Tax Saver
    if (lower.includes('elss') || lower.includes('tax saver')) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.ELSS };
    }
    // Sectoral / Thematic
    if (
      lower.includes('digital') || lower.includes('tech') || lower.includes('pharma') || 
      lower.includes('healthcare') || lower.includes('banking') || lower.includes('infrastructure') || 
      lower.includes('thematic') || lower.includes('sectoral')
    ) {
      return { mainCat: FundMainCategory.EQUITY, subCat: FundSubCategory.SECTORAL_THEMATIC };
    }
    // Liquid
    if (lower.includes('liquid')) {
      return { mainCat: FundMainCategory.DEBT, subCat: FundSubCategory.LIQUID };
    }
    // Ultra Short
    if (lower.includes('ultra short')) {
      return { mainCat: FundMainCategory.DEBT, subCat: FundSubCategory.ULTRA_SHORT };
    }
    // Money Market
    if (lower.includes('money market')) {
      return { mainCat: FundMainCategory.DEBT, subCat: FundSubCategory.MONEY_MARKET };
    }
    // Arbitrage
    if (lower.includes('arbitrage')) {
      return { mainCat: FundMainCategory.HYBRID, subCat: FundSubCategory.ARBITRAGE };
    }
    // Balanced / Dynamic Asset Allocation / Balanced Advantage
    if (lower.includes('balanced advantage') || lower.includes('dynamic asset') || lower.includes('baf')) {
      return { mainCat: FundMainCategory.HYBRID, subCat: FundSubCategory.DYNAMIC_ASSET_ALLOCATION };
    }
    // General Hybrid
    if (lower.includes('hybrid') || lower.includes('balanced')) {
      return { mainCat: FundMainCategory.HYBRID, subCat: FundSubCategory.OTHER };
    }
    // General Debt
    if (lower.includes('debt') || lower.includes('gilt') || lower.includes('bond') || lower.includes('treasury')) {
      return { mainCat: FundMainCategory.DEBT, subCat: FundSubCategory.OTHER };
    }
    // Solution Oriented
    if (lower.includes('children') || lower.includes('retirement')) {
      return { mainCat: FundMainCategory.SOLUTION_ORIENTED, subCat: FundSubCategory.OTHER };
    }

    return { mainCat: FundMainCategory.OTHER, subCat: FundSubCategory.OTHER };
  }

  private estimateRisk(main: FundMainCategory, sub: FundSubCategory): FundRiskLevel {
    if (main === FundMainCategory.EQUITY) {
      if (sub === FundSubCategory.SECTORAL_THEMATIC || sub === FundSubCategory.SMALL_CAP) {
        return FundRiskLevel.VERY_HIGH;
      }
      return FundRiskLevel.HIGH;
    }
    if (main === FundMainCategory.HYBRID) {
      return FundRiskLevel.MODERATELY_HIGH;
    }
    if (main === FundMainCategory.DEBT) {
      if (sub === FundSubCategory.LIQUID) {
        return FundRiskLevel.LOW;
      }
      return FundRiskLevel.LOW_TO_MODERATE;
    }
    return FundRiskLevel.MODERATE;
  }

  private estimateReturns(main: FundMainCategory, sub: FundSubCategory): number {
    // Generate a realistic annualized return rate based on the category
    if (main === FundMainCategory.EQUITY) {
      if (sub === FundSubCategory.SMALL_CAP) return 21.4;
      if (sub === FundSubCategory.MID_CAP) return 18.2;
      return 15.6; // Large Cap / Index / Flexi Cap average
    }
    if (main === FundMainCategory.HYBRID) {
      return 11.5;
    }
    if (main === FundMainCategory.DEBT) {
      return 7.2;
    }
    return 6.0;
  }

  private async upsertFundsBatch(batch: Partial<Fund>[]): Promise<void> {
    // Upsert into TypeORM based on unique schemeCode index
    await this.fundRepository
      .createQueryBuilder()
      .insert()
      .into(Fund)
      .values(batch)
      .orUpdate(
        ['fund_name', 'isin', 'nav', 'fund_main_category', 'fund_sub_category', 'fund_risk', 'fund_return_rate', 'updated_at'],
        ['scheme_code']
      )
      .execute();
  }
}
