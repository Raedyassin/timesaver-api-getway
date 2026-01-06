i'm trying use pgvector (postgres vector) but because is use windows it have some problme so i try to solve it for 5 hours

so i decide use the Pinecone vector database on cloud and his free qouta
this from GML 4.7
  ### The Limits (Starter Plan)
  2. Projects: 1 (You).
  3. Indexes: 1 (One database).
  4. Vectors: Approximately 100,000 Vectors (depending on dimension size).
  5. Dimension Size: Supports up to 20,000 dimensions (Gemini is 768, so you are fine).
  6. Metadata: Included.
  7. Namespace Filtering: Included (Crucial for your "Tabs/Sessions").
  8. API Access: Full access.

## Does this fit your project? (Yes, definitely)
Let's do the math based on your use case (YouTube Video Summarizer):
  1 Video Transcript: ~1,500 words.
  Chunk Size: ~200 words.
  Vectors per Video: ~7-10 vectors.
  Total Capacity:
  100,000 vectors / 10 vectors per video = 10,000 Videos.

Even if you become successful and have users, you can process thousands of videos before you hit the free limit.

Important Features You Get for Free (That You Need)
  Namespaces (The "Tabs" solution):
  You can use Pinecone Namespaces to separate users or videos.
  Example: namespace: "user-123-video-456"
  When searching, you tell Pinecone to only look in that namespace. This prevents "User A's video" from showing up in "User B's" search results.
  Metadata Filtering:
  You can store extra data like { "video_id": "xyz", "timestamp": "12:00" } alongside the vector and filter by it.
  Fast Search:
  It will handle your searches in milliseconds, which makes your app feel snappy.
  What happens when you exceed the free limit?
  If you eventually grow past the 100,000 vectors (which is a great problem to have)
