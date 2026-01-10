// gemini-flash-lite.strategy.ts
import { LlmModels } from 'src/common/enums/llm-models.enum';
import {
  IModelStrategy,
  ModelPricing,
  UsageTokens,
  UsageReport,
} from 'src/common/interfaces/llm-models-strategy.interface';

export class Gemini25FlashLiteStrategy implements IModelStrategy {
  readonly modelName = LlmModels.GEMINI_2_5_FLASH_LITE;
  readonly pricing: ModelPricing = {
    inputPricePerM: 0.1, // $0.10 per 1M tokens (text / image / video)
    outputPricePerM: 0.4, // $0.40 per 1M tokens
  };

  calculateCost(usageTokens: UsageTokens): UsageReport {
    const inputCost = Math.ceil(
      (usageTokens.inputTokens / 1_000_000) * this.pricing.inputPricePerM,
    );
    const outputCost = Math.ceil(
      (usageTokens.outputTokens / 1_000_000) * this.pricing.outputPricePerM,
    );

    return {
      modelName: this.modelName,
      usageTokens,
      costUsd: Number((inputCost + outputCost).toFixed(6)),
    };
  }
}
