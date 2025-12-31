import { Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summary')
  summary() {
    return;
  }

  @Post('qa')
  qa() {
    return;
  }
}
