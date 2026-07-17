import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FundsSyncService } from './services/funds-sync.service';
import { FundsQueryService } from './services/funds-query.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FundMainCategory, FundSubCategory, FundRiskLevel } from './funds.enums';

@ApiTags('Funds')
@Controller('funds')
export class FundsController {
  constructor(
    private readonly fundsSyncService: FundsSyncService,
    private readonly fundsQueryService: FundsQueryService,
  ) {}

  /**
   * Manually trigger an AMFI data sync (dev/admin use).
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger a manual AMFI NAV sync (admin / dev)' })
  async triggerSync() {
    return this.fundsSyncService.syncAmfiNavData();
  }

  /**
   * Paginated list of all funds with optional filters.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all funds with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'mainCategory', required: false, enum: FundMainCategory })
  @ApiQuery({ name: 'subCategory', required: false, enum: FundSubCategory })
  @ApiQuery({ name: 'risk', required: false, enum: FundRiskLevel })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('mainCategory') mainCategory?: FundMainCategory,
    @Query('subCategory') subCategory?: FundSubCategory,
    @Query('risk') risk?: FundRiskLevel,
    @Query('search') search?: string,
  ) {
    return this.fundsQueryService.findAll({ page: +page, limit: +limit, mainCategory, subCategory, risk, search });
  }

  /**
   * Get a single fund by its UUID.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a fund by ID' })
  async findOne(@Param('id') id: string) {
    return this.fundsQueryService.findOneById(id);
  }

  /**
   * Get a single fund by its AMFI scheme code.
   */
  @Get('scheme/:schemeCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a fund by AMFI scheme code' })
  async findBySchemeCode(@Param('schemeCode') schemeCode: string) {
    return this.fundsQueryService.findBySchemeCode(schemeCode);
  }
}
