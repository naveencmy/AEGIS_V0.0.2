-- AEGIS-NTRO PostgreSQL Initialization Script
-- Extensions for Vector Embeddings, Trigram Fuzzy Search, Unaccent, and UUIDs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Auto-update tsvector trigger for framework controls
CREATE OR REPLACE FUNCTION update_framework_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.guidance, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
