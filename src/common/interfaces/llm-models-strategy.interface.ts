export interface ModelPricing {
  inputPricePerM: number; // Price per 1 million input tokens
  outputPricePerM: number; // Price per 1 million output tokens
}

export interface UsageTokens {
  inputTokens: number;
  outputTokens: number;
}

export interface UsageReport {
  // modelName: string;
  // usageTokens: UsageTokens;
  // costUsd: number;
  creditsUsed: number;
}

export interface IModelStrategy {
  readonly modelName: string;
  readonly pricing: ModelPricing;
  calculateCost(metrics: UsageTokens): UsageReport;
}
