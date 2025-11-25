import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PlanQueryDto {
  @Type(() => Number) // converts the value before validation
  @IsInt()
  @Min(1)
  page: number = 1; // default value

  @Type(() => Number) // converts the value before validation
  @IsInt()
  @Min(10)
  limit: number = 50; // default value

  // @IsOptional()
  // @IsString()
  // sort?: string;

  // @IsOptional()
  // @IsString()
  // search?: string;
}
