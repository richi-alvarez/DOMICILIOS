/**
 * RAG (Retrieval Augmented Generation) Example with pgvector
 *
 * This file demonstrates how to use PostgreSQL pgvector extension
 * for semantic search and RAG capabilities.
 *
 * TODO: Replace placeholder API calls with your actual embedding service
 * (OpenAI, Anthropic, Hugging Face, etc.)
 */

import { db } from '@/db'
import { sql } from 'drizzle-orm'

// Example embedding vector (1536 dimensions for OpenAI's text-embedding-3-small)
type EmbeddingVector = number[]

interface EmbeddingRecord {
  id: number
  content_type: string
  content_id: number
  content: string
  embedding: EmbeddingVector
  metadata: Record<string, unknown>
}

interface SearchResult {
  id: number
  content: string
  similarity: number
  metadata: Record<string, unknown>
}

/**
 * Generate embeddings using your preferred service
 *
 * Example with Anthropic (update with your actual API):
 */
async function generateEmbedding(text: string): Promise<EmbeddingVector> {
  // TODO: Implement actual embedding generation
  // Example using OpenAI:
  // const response = await fetch('https://api.openai.com/v1/embeddings', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
  //   body: JSON.stringify({
  //     model: 'text-embedding-3-small',
  //     input: text,
  //   }),
  // })
  // const data = await response.json()
  // return data.data[0].embedding

  // Placeholder: return mock embedding
  return Array(1536).fill(0).map(() => Math.random())
}

/**
 * Store product description with embedding for RAG
 *
 * Usage: When a product is created/updated, call this to index it
 */
export async function storeProductEmbedding(
  productId: number,
  productName: string,
  description: string,
  catalogId: number
) {
  try {
    // Generate embedding from concatenated text
    const textToEmbed = `${productName}: ${description}`
    const embedding = await generateEmbedding(textToEmbed)

    // Store in database
    const result = await db.execute(sql`
      INSERT INTO embeddings (content_type, content_id, content, embedding, metadata)
      VALUES (
        'product',
        ${productId},
        ${textToEmbed},
        ${JSON.stringify(embedding)}::vector,
        ${JSON.stringify({ catalogId, productName })}::jsonb
      )
      ON CONFLICT (content_type, content_id)
      DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `)

    console.log(`✓ Stored embedding for product ${productId}`)
    return result
  } catch (error) {
    console.error('Failed to store embedding:', error)
    throw error
  }
}

/**
 * Semantic search using vector similarity
 *
 * Finds products semantically similar to the query
 * Returns top K results ordered by cosine similarity
 */
export async function semanticSearch(
  query: string,
  contentType: string = 'product',
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Search using cosine similarity
    const results = await db.execute(sql`
      SELECT
        id,
        content,
        (1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector)) as similarity,
        metadata
      FROM embeddings
      WHERE content_type = ${contentType}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `)

    return (results.rows as unknown as SearchResult[])
  } catch (error) {
    console.error('Semantic search failed:', error)
    throw error
  }
}

/**
 * RAG Context Retrieval
 *
 * Retrieves relevant product information to augment LLM context
 */
export async function retrieveRAGContext(
  userQuery: string,
  catalogId: number,
  limit: number = 3
): Promise<{ products: SearchResult[]; context: string }> {
  try {
    // Search for relevant products
    const results = await db.execute(sql`
      SELECT
        id,
        content,
        metadata,
        (1 - (embedding <=> (SELECT embedding FROM embeddings WHERE content IS LIKE ${userQuery}))) as similarity
      FROM embeddings
      WHERE
        content_type = 'product'
        AND metadata->>'catalogId' = ${catalogId}::text
        AND (1 - (embedding <=> (SELECT embedding FROM embeddings LIMIT 1))) > 0.7
      ORDER BY similarity DESC
      LIMIT ${limit}
    `)

    // Format context for LLM
    const products = (results.rows as unknown as SearchResult[])
    const context = products
      .map((p) => `- ${p.content}`)
      .join('\n')

    return { products, context }
  } catch (error) {
    console.error('RAG context retrieval failed:', error)
    throw error
  }
}

/**
 * Delete embeddings (when product is deleted)
 */
export async function deleteEmbedding(
  contentType: string,
  contentId: number
) {
  try {
    await db.execute(sql`
      DELETE FROM embeddings
      WHERE content_type = ${contentType}
      AND content_id = ${contentId}
    `)
    console.log(`✓ Deleted embedding for ${contentType} ${contentId}`)
  } catch (error) {
    console.error('Failed to delete embedding:', error)
    throw error
  }
}

/**
 * Clear all embeddings for a catalog (use with caution)
 */
export async function clearCatalogEmbeddings(catalogId: number) {
  try {
    const result = await db.execute(sql`
      DELETE FROM embeddings
      WHERE metadata->>'catalogId' = ${catalogId}::text
    `)
    console.log(`✓ Cleared embeddings for catalog ${catalogId}`)
    return result
  } catch (error) {
    console.error('Failed to clear catalog embeddings:', error)
    throw error
  }
}

/**
 * Vector operations reference
 *
 * PostgreSQL pgvector operators:
 * <->  : L2 distance (Euclidean)
 * <#>  : Negative inner product distance
 * <=>  : Cosine distance (1 - cosine_similarity)
 *
 * Usage in queries:
 * - `ORDER BY embedding <=> query_embedding` — finds most similar
 * - `WHERE embedding <=> query_embedding < 0.3` — filters by similarity threshold
 */

/**
 * Example: Similarity threshold search
 */
export async function searchWithThreshold(
  query: string,
  minSimilarity: number = 0.7
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query)

  const results = await db.execute(sql`
    SELECT
      id,
      content,
      (1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector)) as similarity,
      metadata
    FROM embeddings
    WHERE (1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector)) > ${minSimilarity}
    ORDER BY similarity DESC
  `)

  return (results.rows as unknown as SearchResult[])
}
