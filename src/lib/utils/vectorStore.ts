import { type IndexedContent, getContentDatabase } from "./contentIndexer"

// Simple vector representation for text
interface TextVector {
  id: string
  vector: number[]
  text: string
  metadata: {
    url: string
    title: string
  }
}

// Simple vector store
class VectorStore {
  private vectors: TextVector[] = []

  // Add a document to the vector store
  public addDocument(content: IndexedContent): void {
    // In a real implementation, we would use a proper embedding model
    // For now, we'll use a simple bag-of-words approach
    const words = content.content.toLowerCase().split(/\W+/).filter(Boolean)
    const uniqueWords = [...new Set(words)]

    // Create a simple vector (just for demonstration)
    const vector = uniqueWords.map((word) => {
      // Simple hash function to convert word to number
      return Array.from(word).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    })

    this.vectors.push({
      id: content.id,
      vector,
      text: content.content,
      metadata: {
        url: content.url,
        title: content.title,
      },
    })
  }

  // Search for similar documents
  public search(query: string, limit = 3): { text: string; score: number; url: string }[] {
    const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean)
    const uniqueQueryWords = [...new Set(queryWords)]

    // Create a simple query vector
    const queryVector = uniqueQueryWords.map((word) => {
      return Array.from(word).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    })

    // Calculate similarity scores (very simplified)
    const results = this.vectors.map((doc) => {
      // Count matching words as a simple similarity measure
      const matchingWords = queryWords.filter((word) => doc.text.toLowerCase().includes(word)).length
      const score = matchingWords / queryWords.length

      return {
        text: doc.text,
        score,
        url: doc.metadata.url,
      }
    })

    // Sort by score and return top results
    return results
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Initialize from content database
  public initializeFromDatabase(): void {
    const database = getContentDatabase()
    database.pages.forEach((page) => this.addDocument(page))
  }
}

// Create and initialize the vector store
const vectorStore = new VectorStore()
vectorStore.initializeFromDatabase()

export { vectorStore }
