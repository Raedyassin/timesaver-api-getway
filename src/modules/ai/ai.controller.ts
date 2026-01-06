import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { URLDto } from './dto/url';
import { QuestionDto } from './dto/question';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summary')
  summary(@Body() body: URLDto) {
    return this.aiService.getSummary(body.youtubeUrl);
  }

  @Post('qa')
  qa(@Body() body: QuestionDto) {
    return this.aiService.askQuestion(body.question);
  }
}
