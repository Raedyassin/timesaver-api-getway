import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
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

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  deleted?: boolean = false;

  @IsOptional()
  @IsString()
  sort?: [string, 'ASC' | 'DESC']; // this is for delatedAt, createdAt, and updatedAt

  @IsOptional()
  @IsString()
  search?: string;
}
