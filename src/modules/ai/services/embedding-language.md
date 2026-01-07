## Multilingual RAG: Arabic Questions with English Transcripts

**Question:**  
Can the system retrieve relevant English transcript chunks when a user asks a question in Arabic using Gemini embeddings?

**Answer:**  
Yes. This works correctly as long as the same multilingual embedding model is used for both document content and user queries.

### Implementation Overview
- English transcripts are split into semantic chunks  
- Each chunk is embedded using **Gemini `text-embedding-004`**  
- Embeddings are stored in **Pinecone (vector database)**  
- Users may ask questions in **Arabic**  
- Arabic questions are embedded using the **same `text-embedding-004` model**  
- Pinecone retrieves the **top-K (e.g., 5) most semantically relevant chunks**

### Why This Works
`text-embedding-004` is a **multilingual (cross-lingual) embedding model**, meaning it maps text with the same meaning—across different languages—into nearby vectors.  
Because of this, Arabic queries can retrieve English transcript chunks based on **semantic meaning**, not keyword matching.

### Key Rules
- Always use **one embedding model** for both documents and queries  
- Do **not mix embedding models**  
- No translation step is required during retrieval  
- The LLM can generate the final answer in **Arabic** using the retrieved **English context**

### Conclusion
Using Gemini **`text-embedding-004`** enables accurate cross-language semantic search, allowing Arabic user questions to retrieve relevant English transcript content from Pinecone effectively.
