import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { LoggerService } from 'src/modules/logger/logger.service';

@Injectable()
export class VectorDBService implements OnModuleInit {
  private pinecone: Pinecone;
  private index: any;

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('PINECONE_API_KEY');
    const indexName = this.configService.getOrThrow<string>(
      'PINECONE_INDEX_NAME',
    );

    // 1. Initialize Client
    this.pinecone = new Pinecone({ apiKey });
    // 2. Connect to the specific index you created in dashboard
    this.index = this.pinecone.index(indexName);
    this.logger.info('✅ Pinecone Service connected');
  }

  /**
   * Saves a text chunk and its vector into Pinecone.
   * @param sessionId - Used as a Namespace (to separate different videos)
   * @param chunkId - Unique ID for this chunk (e.g., "video-123-chunk-5")
   * @param text - The actual text content
   * @param embedding - The 768 float array from Gemini
   */
  async upsertChunk(
    sessionId: string,
    chunkId: string,
    text: string,
    embedding: number[],
  ) {
    const record: PineconeRecord = {
      id: chunkId,
      values: embedding,
      metadata: {
        text: text, // Store text here so we can retrieve it later
        sessionId: sessionId,
      },
    };

    // Use namespace to isolate data per video session (The "Tab" concept)
    await this.index.namespace(sessionId).upsert([record]);
  }

  // ✅ NEW METHOD: Upsert Many Vectors at Once
  async upsertBatch(
    sessionId: string,
    vectors: { id: string; text: string; embedding: number[] }[],
  ) {
    // 1. Format data for Pinecone
    const records: PineconeRecord[] = vectors.map((v) => ({
      id: v.id,
      values: v.embedding,
      metadata: {
        text: v.text,
        sessionId: sessionId,
      },
    }));

    // 2. Send ALL vectors in ONE network request
    // namespace is used to isolate data per video session (each video has a separate namespace)
    await this.index.namespace(sessionId).upsert(records);
  }

  /**
   * Finds the most similar text chunks to a question.
   * @param sessionId - Only search within this video session
   * @param questionEmbedding - The 768 float array for the user's question
   * @param topK - Number of results to return
   * @returns - Array of text strings
   */
  async searchChunks(
    sessionId: string,
    questionEmbedding: number[],
    topK: number = 6,
  ): Promise<string[]> {
    const queryResponse = await this.index.namespace(sessionId).query({
      vector: questionEmbedding,
      topK: topK,
      includeMetadata: true, // CRITICAL: Must be true to get the text back
      includeValues: false, // We don't need the vector back, just the text
    });

    // Extract just the text from the metadata
    return queryResponse.matches.map(
      (match) => match.metadata?.text as string,
    ) as string[];
  }
}
