import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsUUID()
  @IsNotEmpty()
  chatId: string;
}
