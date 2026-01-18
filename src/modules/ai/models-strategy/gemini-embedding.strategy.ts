import { EmbeddingModels } from 'src/common/enums/embedding-models.enum';
import {
  IModelStrategy,
  ModelPricing,
  UsageTokens,
  UsageReport,
} from 'src/common/interfaces/llm-models-strategy.interface';

export class GeminiEmbeddingStrategy implements IModelStrategy {
  readonly modelName = EmbeddingModels.GEMINI_EMBEDDING; // Add to enum
  readonly pricing: ModelPricing = {
    inputPricePerM: 0.25, // Embeddings are expensive!
    outputPricePerM: 0, // No output tokens
  };

  // --- THE WEIGHTED RULE ---
  // 1 Credit = $0.0001
  // $0.25/M is 2.5x more expensive than Flash Lite Input ($0.10)
  // So we get fewer tokens per credit: 400 tokens instead of 1000.
  readonly INPUT_TOKENS_PER_CREDIT = 400;

  calculateCost(usageTokens: UsageTokens): UsageReport {
    // Embeddings only use Input
    const totalTokens = usageTokens.inputTokens;

    // Calculate Credits
    const totalCredits = totalTokens / this.INPUT_TOKENS_PER_CREDIT;

    return {
      creditsUsed: Math.ceil(totalCredits),
    };
  }
}
