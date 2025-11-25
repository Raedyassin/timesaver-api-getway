import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

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

  @IsInt({ message: 'Monthly Discount must be an integer' })
  @Min(0, { message: 'Monthly Discount must be greater than or equal to 0' })
  @Max(100, { message: 'Monthly Discount must be less than or equal to 100' })
  monthlyDiscount: number;

  @IsInt({ message: 'Yearly Discount must be an integer' })
  @Min(0, { message: 'Yearly Discount must be greater than or equal to 0' })
  @Max(100, { message: 'Yearly Discount must be less than or equal to 100' })
  yearlyDiscount: number;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsInt({ message: 'Credits Per Month must be an integer' })
  @Min(0, { message: 'Credits Per Month must be greater than or equal to 0' })
  creditsPerMonth: number;

  @IsBoolean({
    message:
      'Custom must be a boolean value true for special plan and special user or false for common plan',
  })
  custom: boolean;
}
