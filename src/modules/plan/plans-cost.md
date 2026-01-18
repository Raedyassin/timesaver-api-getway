# Each plan cost 
- LLM Input (gemini-2.5-flash-lite): 1,000 Tokens = 1 Credit.
- LLM Output (gemini-2.5-flash-lite): 250 Tokens = 1 Credit (4x expensive).
- Embedding (text-embedding-004): 400 Tokens = 1 Credit (2.5x expensive).
- Pinecone: well take his price from our profite

# Pinecone pricing
## pincon take money from three things
  -The Rates (AWS us-east-1):
    - Storage: $0.10 per GB per month.
    - Writes: $1.00 per 1 Million Write Units.
    - Reads: $1.00 per 1 Million Read Units
      -"1 Million Units" allows you to write or read roughly 10 Billion vectors.

## The embedding cost
  - for "gemini-embedding-001" the price is 0.15$ for 1M token




# Plans
## 1 The "Explorer" (Free)
  - Price: $0
  - Quota: 1,000 Credits
  - Pinecone Cost: is very low 
  - LLM Cost: $0.10 (Very cheap user acquisition).

## 2 The "Pro Scholar" ($9.99)
  - Price: $9.99 / month
  - Quota: 30,000 Credits
  - Pinecone Cost: is approxmitely cost $0.05
  - LLM Cost: $3.00 (Perfectly safe).






# Explain some of Pincone
A. The Upsert (Saving the video)
  - Data: You split a 10-min video into ~20 chunks.
  - Vector Size: 768 dimensions + Text metadata (~4KB).
  - Calculation:
    - You write 20 vectors.
    - Pinecone charges roughly $0.000002 per 20 vectors.
    - Total Cost: $0.000005 (Negligible).
B. The Search (Asking a Question)
  - Data: User asks 1 question (topK: 4).
  - Calculation:
    - You retrieve 4 vectors.
    - Pinecone charges roughly $0.0000001 per query.
    - Total Cost: $0.0000001 (Effectively Free).
C. Storage
  - Data: 20 vectors x 4KB = 80KB.
  - Calculation:
    - $0.10 per GB = $0.0000001 per KB.
    - Total Cost: $0.000008 per month.
| Users | Videos/Month | Storage (GB) | Total Pinecone Cost |
| :--- | :--- | :--- | :--- |
| **Small** | 100 | < 0.01 | **$0.00 (Free Tier covers this)** |
| **Medium** | 1,000 | 0.04 | **$0.00 - $0.01** |
| **Large** | 10,000 | 0.4 | **~$0.05** |
| **Huge** | 1,000,000 | 40 | **~$4.00** |

