import { Injectable } from '@nestjs/common';
import { EmbeddingModelService } from './embedding.service';
import { VectorDBService } from './vector-db.service';

@Injectable()
export class RagService {
  constructor(
    private readonly vectorDBService: VectorDBService,
    private readonly embeddingModelService: EmbeddingModelService,
  ) {}

  private async embedQuestion(question: string) {
    const embedding =
      await this.embeddingModelService.generateEmbedding(question);
    return embedding;
  }

  private async embedingArrayOfChunks(chunks: string[]) {
    const embeddings =
      await this.embeddingModelService.generateArrayEmbeddings(chunks);
    return embeddings;
  }

  // The pinconeService code
  private async getRelevantChunksFromDB(
    videoId: string,
    questionEmbedding: number[],
    top = 4,
  ) {
    return this.vectorDBService.searchChunks(videoId, questionEmbedding, top);
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

  // ************************ pulbic methods ************************
  async proccessVideoTranscript(sessionId: string, transcript: string) {
    const chunks = this.convertTranscriptToChunks(transcript);
    console.log('chunks', chunks.length);
    /**
     * this code make memeroy leak because the embedding that return from long
     * tarnscript will be stored in memory and this will cause memory leak (be big memory)
     */
    const chunkEmbeddings = await this.embedingArrayOfChunks(chunks);
    const vectors: { id: string; text: string; embedding: number[] }[] = [];
    for (let i = 0; i < chunks.length; i++) {
      vectors.push({
        id: `${sessionId}-chunk-${i}`,
        text: chunks[i],
        embedding: chunkEmbeddings[i],
      });
    }
    await this.insertChunkArrayIntoDB(sessionId, vectors);
  }
  // vide chunking
  private convertTranscriptToChunks(transcript: string): string[] {
    /**
     * 1. Size: Reduced from 500 words (~3000 chars) to ~1000 chars.(last version was 500 words)
        2. Overlap: Added 200 char overlap so context is preserved.
        3. Word Boundary Logic: Added a check to ensure we don't cut a word in half (looks for the last space).
     */
    // 1. Settings
    const chunkSize = 1000; // Approx 200 words. Good for RAG.
    const overlap = 200; // Ensures context isn't lost between chunks.

    const chunkContents: string[] = [];
    let index = 0;

    while (index < transcript.length) {
      // 2. Define the end of this chunk
      let end = index + chunkSize;

      // 3. Handle the end of the text
      if (end >= transcript.length) {
        end = transcript.length;
      } else {
        // 4. Try to break at the last space/punctuation to avoid cutting words
        // Look backwards from 'end' up to 'overlap' distance
        const lastSpaceIndex = transcript.lastIndexOf(' ', end);
        /**
         * Visual Example
            Let's say we want a 10-character chunk.
            Text: "The quick brown fox jumps" (Length: 25)

            Target end: 10 (The letter 'r' in "brown").
            Current Chunk: "The quick br"
            lastSpaceIndex: It looks backwards from 'r'.
            It finds the space after "quick" at Index 9.
            The Check:
              Is 9 > 0? (Is it past the start?) -> Yes.
              Is 9 > 5? (Is it within the overlap limit?)* -> Yes.
            Result:
            We move end to 9.
            New Chunk: "The quick " (Clean end, no broken word).
            (Note: If there was no space found, the check would fail, and the code would simply cut at character 10).
         */
        // Only break at space if we found one within reasonable distance
        if (lastSpaceIndex > index && lastSpaceIndex > end - overlap) {
          end = lastSpaceIndex;
        }
      }

      // 5. Extract the chunk
      const chunkText = transcript.slice(index, end).trim();
      chunkContents.push(chunkText);

      // 6. Move index for next chunk (Move forward by chunk size, minus overlap)
      index = end - overlap;
    }

    return chunkContents;
  }
}
