import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export class ChromaRAGSystem {
  constructor(config = {}) {
    this.chromaClient = new ChromaClient({
      path: config.chromaUrl || process.env.CHROMA_URL || 'http://localhost:8000'
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: config.embeddingModel || 'text-embedding-ada-002'
    });
    
    this.collectionName = config.collectionName || 'chatbot_documents';
    this.collection = null;
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
    
    this.initialized = false;
    this.dbManager = null;
  }

  async initialize(dbManager) {
    try {
      console.log('🔍 Initializing ChromaDB RAG System...');
      
      this.dbManager = dbManager;
      
      // Test ChromaDB connection
      await this.chromaClient.heartbeat();
      console.log('✅ ChromaDB connection verified');
      
      // Get or create collection
      try {
        this.collection = await this.chromaClient.getCollection({
          name: this.collectionName
        });
        console.log(`✅ Connected to existing collection: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.chromaClient.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Chatbot document embeddings',
            created_at: new Date().toISOString()
          }
        });
        console.log(`✅ Created new collection: ${this.collectionName}`);
      }
      
      // Load existing documents from database
      await this.loadExistingDocuments();
      
      this.initialized = true;
      console.log('✅ ChromaDB RAG System initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ChromaDB RAG System:', error);
      throw error;
    }
  }

  async loadExistingDocuments() {
    try {
      if (!this.dbManager) return;
      
      const documents = await this.dbManager.getAllDocuments();
      console.log(`📚 Loading ${documents.length} existing documents into ChromaDB...`);
      
      for (const doc of documents) {
        try {
          // Check if document already exists in ChromaDB
          const existing = await this.collection.get({
            where: { document_id: doc.id }
          });
          
          if (existing.ids.length === 0) {
            // Document not in ChromaDB, add it
            await this.processAndStoreDocument(doc);
            console.log(`📄 Loaded document: ${doc.metadata?.title || doc.id}`);
          }
        } catch (error) {
          console.error(`❌ Error loading document ${doc.id}:`, error);
        }
      }
      
      console.log('✅ Existing documents loaded into ChromaDB');
    } catch (error) {
      console.error('❌ Error loading existing documents:', error);
    }
  }

  async processAndStoreDocument(document) {
    try {
      // Split document into chunks
      const chunks = await this.textSplitter.splitText(document.content);
      
      if (chunks.length === 0) {
        console.warn(`⚠️ No chunks generated for document ${document.id}`);
        return { success: false, reason: 'No chunks generated' };
      }
      
      // Generate embeddings for all chunks
      const embeddings = await this.embeddings.embedDocuments(chunks);
      
      // Prepare data for ChromaDB
      const ids = chunks.map((_, index) => `${document.id}_chunk_${index}`);
      const metadatas = chunks.map((chunk, index) => ({
        document_id: document.id,
        chunk_index: index,
        chunk_size: chunk.length,
        title: document.metadata?.title || 'Untitled',
        source: document.metadata?.source || 'unknown',
        type: document.metadata?.type || 'text',
        created_at: document.timestamp || new Date().toISOString(),
        ...document.metadata
      }));
      
      // Store in ChromaDB
      await this.collection.add({
        ids,
        embeddings,
        documents: chunks,
        metadatas
      });
      
      // Update document in database with chunk count
      if (this.dbManager) {
        await this.dbManager.updateDocument(document.id, {
          chunkCount: chunks.length,
          processed: true,
          processedAt: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        documentId: document.id,
        chunkCount: chunks.length
      };
      
    } catch (error) {
      console.error('❌ Error processing document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addDocument(content, metadata = {}) {
    try {
      if (!this.initialized) {
        throw new Error('RAG system not initialized');
      }
      
      const documentId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Store document in database first
      const document = {
        id: documentId,
        content,
        metadata: {
          ...metadata,
          addedAt: timestamp
        },
        timestamp
      };
      
      if (this.dbManager) {
        await this.dbManager.saveDocument(document);
      }
      
      // Process and store in ChromaDB
      const result = await this.processAndStoreDocument(document);
      
      return {
        documentId,
        ...result
      };
      
    } catch (error) {
      console.error('❌ Error adding document:', error);
      throw error;
    }
  }

  async addDocumentFromFile(filePath, metadata = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      return await this.addDocument(content, {
        ...metadata,
        source: fileName,
        type: 'file',
        filePath
      });
      
    } catch (error) {
      console.error('❌ Error adding document from file:', error);
      throw error;
    }
  }

  async getRelevantContext(query, maxResults = 5, minSimilarity = 0.6) {
    try {
      if (!this.initialized) {
        console.warn('⚠️ RAG system not initialized');
        return {
          context: '',
          sources: [],
          relevantChunks: 0
        };
      }
      
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Search in ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: maxResults * 2, // Get more results to filter by similarity
        include: ['documents', 'metadatas', 'distances']
      });
      
      if (!results.documents || results.documents[0].length === 0) {
        return {
          context: '',
          sources: [],
          relevantChunks: 0
        };
      }
      
      // Filter by similarity (ChromaDB returns distances, lower is better)
      const maxDistance = 1 - minSimilarity; // Convert similarity to distance
      const filteredResults = [];
      
      for (let i = 0; i < results.documents[0].length; i++) {
        const distance = results.distances[0][i];
        if (distance <= maxDistance) {
          filteredResults.push({
            document: results.documents[0][i],
            metadata: results.metadatas[0][i],
            distance,
            similarity: 1 - distance
          });
        }
      }
      
      // Sort by similarity (highest first) and limit results
      filteredResults.sort((a, b) => b.similarity - a.similarity);
      const topResults = filteredResults.slice(0, maxResults);
      
      if (topResults.length === 0) {
        return {
          context: '',
          sources: [],
          relevantChunks: 0
        };
      }
      
      // Build context and collect sources
      const contextParts = [];
      const sources = new Set();
      
      topResults.forEach((result, index) => {
        const metadata = result.metadata;
        const source = metadata.title || metadata.source || 'Unknown';
        sources.add(source);
        
        contextParts.push(
          `[Source: ${source}]\n${result.document}\n`
        );
      });
      
      return {
        context: contextParts.join('\n---\n\n'),
        sources: Array.from(sources),
        relevantChunks: topResults.length,
        results: topResults.map(r => ({
          content: r.document,
          metadata: r.metadata,
          similarity: r.similarity
        }))
      };
      
    } catch (error) {
      console.error('❌ Error getting relevant context:', error);
      return {
        context: '',
        sources: [],
        relevantChunks: 0,
        error: error.message
      };
    }
  }

  async searchDocuments(query, limit = 10) {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances']
      });
      
      if (!results.documents || results.documents[0].length === 0) {
        return [];
      }
      
      return results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        similarity: 1 - results.distances[0][index]
      }));
      
    } catch (error) {
      console.error('❌ Error searching documents:', error);
      return [];
    }
  }

  async deleteDocument(documentId) {
    try {
      // Get all chunks for this document
      const chunks = await this.collection.get({
        where: { document_id: documentId }
      });
      
      if (chunks.ids.length > 0) {
        // Delete from ChromaDB
        await this.collection.delete({
          ids: chunks.ids
        });
      }
      
      // Delete from database
      if (this.dbManager) {
        await this.dbManager.deleteDocument(documentId);
      }
      
      return {
        success: true,
        deletedChunks: chunks.ids.length
      };
      
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDocuments() {
    try {
      if (this.dbManager) {
        return await this.dbManager.getAllDocuments();
      }
      
      // Fallback: get unique documents from ChromaDB
      const allChunks = await this.collection.get({
        include: ['metadatas']
      });
      
      const documentsMap = new Map();
      
      allChunks.metadatas.forEach(metadata => {
        const docId = metadata.document_id;
        if (!documentsMap.has(docId)) {
          documentsMap.set(docId, {
            id: docId,
            metadata: {
              title: metadata.title,
              source: metadata.source,
              type: metadata.type,
              created_at: metadata.created_at
            },
            chunkCount: 1
          });
        } else {
          documentsMap.get(docId).chunkCount++;
        }
      });
      
      return Array.from(documentsMap.values());
      
    } catch (error) {
      console.error('❌ Error getting documents:', error);
      return [];
    }
  }

  async getRAGStats() {
    try {
      const collectionInfo = await this.collection.count();
      const documents = await this.getDocuments();
      
      return {
        initialized: this.initialized,
        collection: {
          name: this.collectionName,
          totalChunks: collectionInfo,
          totalDocuments: documents.length
        },
        chunking: {
          chunkSize: this.textSplitter.chunkSize,
          chunkOverlap: this.textSplitter.chunkOverlap
        },
        embedding: {
          model: 'text-embedding-ada-002',
          provider: 'OpenAI'
        }
      };
      
    } catch (error) {
      console.error('❌ Error getting RAG stats:', error);
      return {
        initialized: this.initialized,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      // Test ChromaDB connection
      await this.chromaClient.heartbeat();
      
      // Test collection access
      const count = await this.collection.count();
      
      return {
        healthy: true,
        chromadb: {
          connected: true,
          collection: this.collectionName,
          documentCount: count
        },
        embeddings: {
          provider: 'OpenAI',
          model: 'text-embedding-ada-002'
        }
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        chromadb: {
          connected: false
        }
      };
    }
  }

  async reindexDocuments() {
    try {
      console.log('🔄 Starting document reindexing...');
      
      // Clear existing collection
      await this.chromaClient.deleteCollection({ name: this.collectionName });
      
      // Recreate collection
      this.collection = await this.chromaClient.createCollection({
        name: this.collectionName,
        metadata: {
          description: 'Chatbot document embeddings (reindexed)',
          created_at: new Date().toISOString()
        }
      });
      
      // Reload all documents
      await this.loadExistingDocuments();
      
      console.log('✅ Document reindexing completed');
      
      return {
        success: true,
        message: 'Documents reindexed successfully'
      };
      
    } catch (error) {
      console.error('❌ Error reindexing documents:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanup() {
    try {
      // Remove orphaned chunks (chunks without corresponding documents in database)
      if (this.dbManager) {
        const dbDocuments = await this.dbManager.getAllDocuments();
        const dbDocumentIds = new Set(dbDocuments.map(doc => doc.id));
        
        const allChunks = await this.collection.get({
          include: ['metadatas']
        });
        
        const orphanedChunkIds = [];
        
        allChunks.ids.forEach((chunkId, index) => {
          const metadata = allChunks.metadatas[index];
          if (!dbDocumentIds.has(metadata.document_id)) {
            orphanedChunkIds.push(chunkId);
          }
        });
        
        if (orphanedChunkIds.length > 0) {
          await this.collection.delete({
            ids: orphanedChunkIds
          });
          
          console.log(`🧹 Cleaned up ${orphanedChunkIds.length} orphaned chunks`);
        }
        
        return {
          success: true,
          cleanedChunks: orphanedChunkIds.length
        };
      }
      
      return { success: true, cleanedChunks: 0 };
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
