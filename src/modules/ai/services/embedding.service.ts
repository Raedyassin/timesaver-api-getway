import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { LoggerService } from 'src/modules/logger/logger.service';
import { EmbeddingModels } from 'src/common/enums/embedding-models.enum';

@Injectable()
export class EmbeddingModelService implements OnModuleInit {
  private ai: GoogleGenAI;
  private readonly embeddingModel = EmbeddingModels.TEXT_EMBEDDING;
  private readonly countTokenModelName = 'gemini-2.0-flash-lite';

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateEmbedding(
    text: string,
  ): Promise<{ embeddings: number[]; tokens: number }> {
    try {
      // FIX: In @google/genai, use ai.models.countTokens directly
      const tokenResponse = await this.ai.models.countTokens({
        model: this.countTokenModelName,
        contents: [{ role: 'user', parts: [{ text }] }],
      });
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: text,
      });

      return {
        embeddings: response?.embeddings?.[0]?.values as number[],
        tokens: tokenResponse.totalTokens ?? 0,
      };
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`);
      throw error;
    }
  }

  async generateArrayEmbeddings(
    chunks: string[],
  ): Promise<{ embeddings: number[][]; tokens: number }> {
    try {
      if (!chunks || chunks.length === 0) return { embeddings: [], tokens: 0 };

      // FIX: Bulk count tokens for the whole array
      const tokenResponse = await this.ai.models.countTokens({
        model: this.countTokenModelName,
        contents: chunks.map((chunk) => ({
          role: 'user',
          parts: [{ text: chunk }],
        })),
      });
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: chunks,
      });

      return {
        embeddings: response.embeddings?.map((e) => e.values as number[]) || [],
        tokens: tokenResponse.totalTokens ?? 0,
      };
    } catch (error) {
      this.logger.error(`Error generating array embeddings: ${error.message}`);
      throw error;
    }
  }
}
