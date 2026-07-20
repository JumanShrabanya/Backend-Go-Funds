import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationService } from './services/recommendation.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(private readonly recommendationService: RecommendationService) {}

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
