import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { LoggerService } from 'src/modules/logger/logger.service';
import { EmbeddingModels } from 'src/common/enums/embedding-models.enum';

@Injectable()
export class EmbeddingModelService implements OnModuleInit {
  private ai: GoogleGenAI;
  // the "text-embedding-004" is cost $0.15 per 1M tokens
  private readonly embeddingModel = EmbeddingModels.TEXT_EMBEDDING;
  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * to knew what happen if i embed some of chunk in specific language
   * are if i embed in antoher langue are teh comparison between them
   * will be occure or what see the file embedding-language.md in the same folder
   */
  async generateEmbedding(
    text: string,
  ): Promise<{ embeddings: number[]; tokens: number }> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: text,
      });

      if (!response.embeddings) {
        this.logger.error(
          'No embeddings found in response in generateEmbedding',
        );
        throw new Error('No embeddings found in response');
      }
      // The embedding is an array of numbers
      return {
        embeddings: response.embeddings[0].values as number[],
        tokens: response?.embeddings[0]?.statistics?.tokenCount as number,
      };
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`);
      throw error;
    }
  }

  // for embeddings all of the video chunks at once (if needed)
  async generateArrayEmbeddings(
    chunks: string[],
  ): Promise<{ embeddings: number[][]; tokens: number }> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: chunks,
      });
      return {
        embeddings: response.embeddings?.map(
          (e) => e.values as number[],
        ) as number[][],
        tokens: response.embeddings?.reduce(
          (accumulator, currentValue) =>
            (currentValue?.statistics?.tokenCount as number) + accumulator,
          0,
        ) as number,
      };
    } catch (error) {
      this.logger.error(`Error generating array embeddings: ${error.message}`);
      throw error;
    }
  }
}
