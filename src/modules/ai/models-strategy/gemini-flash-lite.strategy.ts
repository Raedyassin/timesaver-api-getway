// gemini-2.5-flash-lite.strategy.ts
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
  readonly INPUT_TOKENS_PER_CREDIT = 1000; // this cost $0.0001 per credit
  readonly OUTPUT_TOKENS_PER_CREDIT = 250; // Output is 4x more expensive than input

  calculateCost(usageTokens: UsageTokens): UsageReport {
    const { inputTokens, outputTokens } = usageTokens;

    // 1. Calculate USD Cost (Internal)
    // const inputCost = (inputTokens / 1_000_000) * this.pricing.inputPricePerM;
    // const outputCost =
    //   (outputTokens / 1_000_000) * this.pricing.outputPricePerM;
    // const totalCostUsd = inputCost + outputCost;

    // 2. Calculate Credits (Weighted)
    const inputCredits = inputTokens / this.INPUT_TOKENS_PER_CREDIT;
    const outputCredits = outputTokens / this.OUTPUT_TOKENS_PER_CREDIT;

    // Sum them up and Round Up
    const totalCredits = inputCredits + outputCredits;

    return {
      // modelName: this.modelName,
      // usageTokens,
      // costUsd: Number(totalCostUsd.toFixed(6)),
      creditsUsed: Math.ceil(totalCredits),
    };
  }
}
