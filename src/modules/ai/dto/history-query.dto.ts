import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class HistoryQueryDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  page: number = 1;

  @IsNumber()
  @IsNotEmpty()
  @Min(50)
  @Max(100)
  limit: number = 50;
}
