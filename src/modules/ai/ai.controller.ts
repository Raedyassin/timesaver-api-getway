import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { URLDto } from './dto/url';
import { QuestionDto } from './dto/question';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summary')
  summary(@Body() body: URLDto, @GetUser() user: User) {
    return this.aiService.getSummary(body, user.id.toString());
  }

  @Post('ask-question')
  qa(@Body() body: QuestionDto, @GetUser() user: User) {
    return this.aiService.askQuestion(body, user.id.toString());
  }
}
