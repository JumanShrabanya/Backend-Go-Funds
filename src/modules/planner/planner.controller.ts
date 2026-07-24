import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationService } from './services/recommendation.service';
import { PlannerStatsService } from './services/planner-stats.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly plannerStatsService: PlannerStatsService,
  ) {}

  @Get('plans')
  @HttpCode(HttpStatus.OK)
  async getUserPlans(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return await this.plannerStatsService.getUserPlans(userId);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.OK)
  async deletePlan(@Req() req: Request & { user: User }, @Param('id') planId: string) {
    const userId = req.user.id;
    const deleted = await this.plannerStatsService.deletePlan(userId, planId);
    if (!deleted) {
      throw new NotFoundException('Plan not found or could not be deleted');
    }
    return { message: 'Plan deleted successfully' };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(@Req() req: Request & { user: User }) {
    const userId = req.user.id;
    return await this.plannerStatsService.getDashboardStats(userId);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generatePlan(@Req() req: Request & { user: User }, @Body() createPlanDto: CreatePlanDto) {
    const userId = req.user.id;
    const plan = await this.recommendationService.generateRecommendation(userId, createPlanDto);
    console.log('[PlannerController] Returning plan:', JSON.stringify(plan));
    return {
      message: 'Investment plan generated successfully',
      data: plan,
    };
  }
}
