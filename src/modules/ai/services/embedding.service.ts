import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { LoggerService } from 'src/modules/logger/logger.service';

@Injectable()
export class EmbeddingModelService implements OnModuleInit {
  private ai: GoogleGenAI;
  private readonly embeddingModel = 'text-embedding-004'; //'gemini-embedding-001' or 'text-embedding-004'
  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
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
      return response.embeddings[0].values as number[];
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`);
      throw error;
    }
  }

  // for embeddings all of the video chunks at once (if needed)
  async generateArrayEmbeddings(chunks: string[]): Promise<number[][]> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: chunks,
      });
      return response.embeddings?.map(
        (e) => e.values as number[],
      ) as number[][];
    } catch (error) {
      this.logger.error(`Error generating array embeddings: ${error.message}`);
      throw error;
    }
  }
}
