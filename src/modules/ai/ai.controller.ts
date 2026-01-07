import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { URLDto } from './dto/url';
import { QuestionDto } from './dto/question';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { HistoryQueryDto } from './dto/history-query.dto';

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

  @Get('history')
  getHistory(@GetUser() user: User, @Query('page') query: HistoryQueryDto) {
    return this.aiService.getHistory(user.id, query);
  }

  @Get('chat-history/:chatId')
  getChatHistory(@Param('chatId') chatId: string, @GetUser() user: User) {
    return this.aiService.getChatHistory(chatId, user.id);
  }
}
