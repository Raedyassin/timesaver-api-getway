import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PlanType } from 'src/common/enums/plan.enum';

export class CreatePlanDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsInt({ message: 'Monthly Price must be an integer' })
  @Min(0, { message: 'Monthly Price must be greater than or equal to 0$' })
  monthlyPrice: number;

  @IsInt({ message: 'Yearly Price must be an integer' })
  @Min(0, { message: 'Yearly Price must be greater than or equal to 0$' })
  yearlyPrice: number;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsInt({ message: 'Credits Per Month must be an integer' })
  @Min(0, { message: 'Credits Per Month must be greater than or equal to 0' })
  creditsPerMonth: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  features: string[];

  @IsOptional()
  @IsNotEmpty({ message: 'Plan Type is required' })
  @IsEnum({
    type: PlanType,
    message:
      'Plan Type must be one of the following values: subscription, extra',
  })
  planType: PlanType = PlanType.SUBSCRIPTION;

  @IsBoolean({
    message:
      'Custom must be a boolean value true for special plan and special user or false for common plan',
  })
  custom: boolean;
}
