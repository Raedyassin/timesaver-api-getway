import { Injectable } from '@nestjs/common';
import { EmbeddingModelService } from './embedding.service';
import { VectorDBService } from './vector-db.service';

@Injectable()
export class RagService {
  constructor(
    private readonly vectorDBService: VectorDBService,
    private readonly embeddingModelService: EmbeddingModelService,
  ) {}

  private async embedQuestion(question: string): Promise<{
    embeddings: number[];
    tokens: number;
  }> {
    return await this.embeddingModelService.generateEmbedding(question);
  }

  private async embedingArrayOfChunks(chunks: string[]): Promise<{
    embeddings: number[][];
    tokens: number;
  }> {
    return await this.embeddingModelService.generateArrayEmbeddings(chunks);
  }

  // The pinconeService code
  private async getRelevantChunksFromDB(
    videoChatSessionId: string,
    questionEmbedding: number[],
    top = 4,
  ) {
    return this.vectorDBService.searchChunks(
      videoChatSessionId,
      questionEmbedding,
      top,
    );
  }

  private async insertChunkIntoDB(
    sessionId: string,
    chunkId: string,
    text: string,
    embedding: number[],
  ) {
    await this.vectorDBService.upsertChunk(sessionId, chunkId, text, embedding);
  }
  private async insertChunkArrayIntoDB(
    sessionId: string,
    vectors: { id: string; text: string; embedding: number[] }[],
  ) {
    await this.vectorDBService.upsertBatch(sessionId, vectors);
  }

  private *chunkTranscript(transcript: string): Generator<string> {
    const chunkSize = 1000; // by char mean 1000 chars ~200 words
    const overlap = 200;

    let index = 0;

    while (index < transcript.length) {
      let end = Math.min(index + chunkSize, transcript.length);

      const lastSpace = transcript.lastIndexOf(' ', end);
      if (lastSpace > index && lastSpace > end - overlap) {
        end = lastSpace;
      }

      const chunk = transcript.slice(index, end).trim();
      if (chunk.length > 0) yield chunk;

      const nextIndex = end - overlap;
      if (nextIndex <= index) break;
      index = nextIndex;
    }
  }

  private async embedAndStoreBatch(
    sessionId: string,
    chunks: string[],
    startIndex: number,
  ): Promise<number> {
    let embeddings = await this.embedingArrayOfChunks(chunks);
    const vectors = embeddings.embeddings.map((embedding, i) => ({
      id: `${sessionId}-chunk-${startIndex + i}`,
      text: chunks[i],
      embedding,
    }));

    await this.insertChunkArrayIntoDB(sessionId, vectors);

    // explicit cleanup
    embeddings = { embeddings: [], tokens: 0 };
    vectors.length = 0;
    return embeddings.tokens;
  }

  // ************************ pulbic methods ************************
  async processVideoTranscript(
    sessionId: string,
    transcript: string,
  ): Promise<number> {
    const BATCH_SIZE = 10;
    const batch: string[] = [];
    let chunkIndex = 0;
    let embeddingTokens = 0;
    for (const chunk of this.chunkTranscript(transcript)) {
      batch.push(chunk);

      if (batch.length === BATCH_SIZE) {
        embeddingTokens += await this.embedAndStoreBatch(
          sessionId,
          batch,
          chunkIndex,
        );
        chunkIndex += batch.length;
        batch.length = 0; // free memory
      }
    }

    if (batch.length > 0) {
      embeddingTokens += await this.embedAndStoreBatch(
        sessionId,
        batch,
        chunkIndex,
      );
    }
    return embeddingTokens;
  }
  async processUserQuestion(videoChatSessionId: string, userQuestion: string) {
    const embedding = await this.embedQuestion(userQuestion);
    const relevantChunks = await this.getRelevantChunksFromDB(
      videoChatSessionId,
      embedding.embeddings,
      4,
    );
    return {
      relevantChunks,
      embeddingTokens: embedding.tokens,
    };
  }
}
