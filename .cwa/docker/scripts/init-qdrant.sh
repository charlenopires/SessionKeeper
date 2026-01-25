#!/bin/bash
# Initialize Qdrant collections for CWA

QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"

echo "Creating CWA Qdrant collections..."

# Create memories collection (768 dims for nomic-embed-text)
curl -s -X PUT "${QDRANT_URL}/collections/cwa_memories" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": { "size": 768, "distance": "Cosine" }
  }' && echo " - cwa_memories: created"

# Create terms collection for glossary embeddings
curl -s -X PUT "${QDRANT_URL}/collections/cwa_terms" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": { "size": 768, "distance": "Cosine" }
  }' && echo " - cwa_terms: created"

echo "Done."
