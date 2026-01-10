// model-factory.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { Gemini25FlashLiteStrategy } from '../models-strategy/gemini-flash-lite.strategy';
import { IModelStrategy } from 'src/common/interfaces/llm-models-strategy.interface';
import { LoggerService } from 'src/modules/logger/logger.service';

@Injectable()
export class ModelUsageFactory {
  private strategies: Map<string, IModelStrategy> = new Map();

  constructor(private logger: LoggerService) {
    // Register your models here
    const gemini = new Gemini25FlashLiteStrategy();
    this.strategies.set(gemini.modelName, gemini);
  }

  getStrategy(modelName: string): IModelStrategy {
    const strategy = this.strategies.get(modelName);
    if (!strategy) {
      this.logger.error(`Pricing strategy for ${modelName} not found`);
      throw new BadRequestException('Sory, this model is not supported');
    }
    return strategy;
  }
}
