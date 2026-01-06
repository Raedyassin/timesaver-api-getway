import { IsNotEmpty, IsString } from 'class-validator';

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;
}
