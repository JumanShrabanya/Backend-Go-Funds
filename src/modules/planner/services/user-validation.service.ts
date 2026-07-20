import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePlanDto } from '../dto/create-plan.dto';

@Injectable()
export class UserValidationService {
  validate(dto: CreatePlanDto): void {
    if (dto.monthlyInvestment > dto.monthlyIncome) {
      throw new BadRequestException('Monthly investment cannot exceed monthly income.');
    }

    if (dto.monthlyInvestment < 500) {
      throw new BadRequestException('Minimum monthly investment should be at least ₹500.');
    }

    if (dto.age < 18) {
      throw new BadRequestException('You must be at least 18 years old to invest.');
    }
    
    // Additional sanity checks can be added here
  }
}
