import { EmbeddingModels } from 'src/common/enums/embedding-models.enum';
import {
  IModelStrategy,
  ModelPricing,
  UsageTokens,
  UsageReport,
} from 'src/common/interfaces/llm-models-strategy.interface';

export class GeminiEmbeddingStrategy implements IModelStrategy {
  readonly modelName = EmbeddingModels.TEXT_EMBEDDING;

  // OFFICIAL PRICE: $0.15 per 1 million tokens (Google AI Studio Paid Tier)
  readonly pricing: ModelPricing = {
    inputPricePerM: 0.15,
    outputPricePerM: 0,
  };

  /**
   * --- THE REAL-WORLD CALCULATION ---
   * Goal: 1 Credit = $0.0001
   * Calculation: (Price per 1M / 1,000,000) = Price per Token
   * $0.0001 / 0.00000015 = ~666.67 tokens per credit
   */
  readonly INPUT_TOKENS_PER_CREDIT = 666.67;

  calculateCost(usageTokens: UsageTokens): UsageReport {
    // Embeddings only have input tokens
    const totalTokens = usageTokens.inputTokens;

    if (totalTokens === 0) return { creditsUsed: 0 };

    // Calculate Credits (e.g., 1000 tokens / 666.67 = 1.5 -> 2 credits)
    const totalCredits = totalTokens / this.INPUT_TOKENS_PER_CREDIT;

    return {
      creditsUsed: Math.ceil(totalCredits),
    };
  }
}
