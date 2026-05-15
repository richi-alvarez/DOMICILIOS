-- Initialize pgvector extension for RAG capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Create RAG/embedding tables for future use
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  content_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_type, content_id)
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_embeddings_content_type ON embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON embeddings(created_at);

-- Ensure UTF-8 encoding for text content
ALTER TABLE embeddings CONVERT TO CHARACTER SET utf8mb4;

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON embeddings TO :POSTGRES_USER;
GRANT ALL PRIVILEGES ON embeddings_id_seq TO :POSTGRES_USER;

-- Log initialization completion
SELECT 'pgvector and RAG tables initialized successfully' AS status;
