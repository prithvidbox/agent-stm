import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class RAGSystem {
  constructor() {
    this.embeddings = null;
    this.vectorStore = null;
    this.textSplitter = null;
    this.documents = new Map(); // documentId -> metadata
    this.chunkSize = parseInt(process.env.CHUNK_SIZE) || 1000;
    this.chunkOverlap = parseInt(process.env.CHUNK_OVERLAP) || 200;
    this.vectorStorePath = process.env.VECTOR_STORE_PATH || path.join(__dirname, '../../data/vector_store');
  }

  async initialize() {
    console.log('Initializing RAG System...');
    
    try {
      // Initialize embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'text-embedding-ada-002'
      });
      
      // Initialize text splitter
      this.textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap,
        separators: ['\n\n', '\n', ' ', '']
      });
      
      // Initialize vector store
      this.vectorStore = new MemoryVectorStore(this.embeddings);
      
      // Load existing documents if any
      await this.loadExistingDocuments();
      
      console.log(`RAG System initialized with chunk size: ${this.chunkSize}, overlap: ${this.chunkOverlap}`);
      
    } catch (error) {
      console.error('Failed to initialize RAG System:', error);
      throw error;
    }
  }

  async loadExistingDocuments() {
    try {
      // Ensure vector store directory exists
      await fs.mkdir(this.vectorStorePath, { recursive: true });
      
      // Load document metadata if exists
      const metadataPath = path.join(this.vectorStorePath, 'documents.json');
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const documentsArray = JSON.parse(metadataContent);
        documentsArray.forEach(doc => {
          this.documents.set(doc.id, doc);
        });
        console.log(`Loaded ${documentsArray.length} document metadata entries`);
      } catch (error) {
        // File doesn't exist yet, that's okay
        console.log('No existing document metadata found');
      }
      
    } catch (error) {
      console.error('Error loading existing documents:', error);
    }
  }

  async saveDocumentMetadata() {
    try {
      const metadataPath = path.join(this.vectorStorePath, 'documents.json');
      const documentsArray = Array.from(this.documents.values());
      await fs.writeFile(metadataPath, JSON.stringify(documentsArray, null, 2));
    } catch (error) {
      console.error('Error saving document metadata:', error);
    }
  }

  // Document processing methods
  async addDocument(content, metadata = {}) {
    try {
      const documentId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Split the document into chunks
      const chunks = await this.textSplitter.splitText(content);
      
      // Create Document objects for each chunk
      const documents = chunks.map((chunk, index) => new Document({
        pageContent: chunk,
        metadata: {
          documentId,
          chunkIndex: index,
          totalChunks: chunks.length,
          timestamp,
          ...metadata
        }
      }));
      
      // Add documents to vector store
      await this.vectorStore.addDocuments(documents);
      
      // Store document metadata
      this.documents.set(documentId, {
        id: documentId,
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Store preview
        fullContentLength: content.length,
        chunkCount: chunks.length,
        timestamp,
        metadata
      });
      
      await this.saveDocumentMetadata();
      
      console.log(`Added document ${documentId} with ${chunks.length} chunks`);
      return documentId;
      
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async addDocumentFromFile(filePath, metadata = {}) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      let content = '';
      
      switch (fileExtension) {
        case '.txt':
        case '.md':
        case '.json':
          content = await fs.readFile(filePath, 'utf-8');
          break;
          
        case '.pdf':
          const pdfBuffer = await fs.readFile(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          content = pdfData.text;
          break;
          
        case '.docx':
          const docxBuffer = await fs.readFile(filePath);
          const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
          content = docxResult.value;
          break;
          
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
      const fileName = path.basename(filePath);
      const fileMetadata = {
        fileName,
        filePath,
        fileType: fileExtension,
        ...metadata
      };
      
      return await this.addDocument(content, fileMetadata);
      
    } catch (error) {
      console.error('Error adding document from file:', error);
      throw error;
    }
  }

  // Retrieval methods
  async similaritySearch(query, k = 5, filter = null) {
    try {
      if (!this.vectorStore) {
        throw new Error('Vector store not initialized');
      }
      
      const results = await this.vectorStore.similaritySearch(query, k, filter);
      
      // Enhance results with additional metadata
      const enhancedResults = results.map(result => ({
        content: result.pageContent,
        metadata: result.metadata,
        documentInfo: this.documents.get(result.metadata.documentId),
        relevanceScore: result.score || 0
      }));
      
      return enhancedResults;
      
    } catch (error) {
      console.error('Error in similarity search:', error);
      return [];
    }
  }

  async similaritySearchWithScore(query, k = 5, filter = null) {
    try {
      if (!this.vectorStore) {
        throw new Error('Vector store not initialized');
      }
      
      const results = await this.vectorStore.similaritySearchWithScore(query, k, filter);
      
      // Enhance results with additional metadata
      const enhancedResults = results.map(([result, score]) => ({
        content: result.pageContent,
        metadata: result.metadata,
        documentInfo: this.documents.get(result.metadata.documentId),
        relevanceScore: score
      }));
      
      return enhancedResults;
      
    } catch (error) {
      console.error('Error in similarity search with score:', error);
      return [];
    }
  }

  // Context generation for chat
  async getRelevantContext(query, maxChunks = 5, minRelevanceScore = 0.7) {
    try {
      const results = await this.similaritySearchWithScore(query, maxChunks * 2);
      
      // Filter by relevance score and remove duplicates
      const filteredResults = results
        .filter(result => result.relevanceScore >= minRelevanceScore)
        .slice(0, maxChunks);
      
      if (filteredResults.length === 0) {
        return {
          context: '',
          sources: [],
          relevantChunks: 0
        };
      }
      
      // Combine context from relevant chunks
      const contextParts = filteredResults.map(result => {
        const docInfo = result.documentInfo;
        const source = docInfo?.metadata?.fileName || `Document ${result.metadata.documentId}`;
        return {
          content: result.content,
          source,
          score: result.relevanceScore,
          chunkIndex: result.metadata.chunkIndex
        };
      });
      
      const context = contextParts
        .map(part => `[Source: ${part.source}]\n${part.content}`)
        .join('\n\n---\n\n');
      
      const sources = [...new Set(contextParts.map(part => part.source))];
      
      return {
        context,
        sources,
        relevantChunks: contextParts.length,
        chunks: contextParts
      };
      
    } catch (error) {
      console.error('Error getting relevant context:', error);
      return {
        context: '',
        sources: [],
        relevantChunks: 0
      };
    }
  }

  // Document management
  async removeDocument(documentId) {
    try {
      // Note: MemoryVectorStore doesn't have a direct remove method
      // In a production system, you'd want to use a persistent vector store
      // that supports deletion, like Pinecone, Weaviate, or Chroma
      
      this.documents.delete(documentId);
      await this.saveDocumentMetadata();
      
      console.log(`Removed document ${documentId} from metadata`);
      console.warn('Note: Document chunks remain in vector store (MemoryVectorStore limitation)');
      
    } catch (error) {
      console.error('Error removing document:', error);
      throw error;
    }
  }

  async listDocuments() {
    return Array.from(this.documents.values()).map(doc => ({
      id: doc.id,
      preview: doc.content,
      chunkCount: doc.chunkCount,
      timestamp: doc.timestamp,
      metadata: doc.metadata
    }));
  }

  async getDocumentInfo(documentId) {
    return this.documents.get(documentId);
  }

  // Batch processing
  async addMultipleDocuments(documents) {
    const results = [];
    
    for (const doc of documents) {
      try {
        let documentId;
        if (doc.filePath) {
          documentId = await this.addDocumentFromFile(doc.filePath, doc.metadata || {});
        } else if (doc.content) {
          documentId = await this.addDocument(doc.content, doc.metadata || {});
        } else {
          throw new Error('Document must have either filePath or content');
        }
        
        results.push({ success: true, documentId, metadata: doc.metadata });
      } catch (error) {
        results.push({ success: false, error: error.message, metadata: doc.metadata });
      }
    }
    
    return results;
  }

  // Search with filters
  async searchByMetadata(metadataFilter, k = 10) {
    try {
      const allDocuments = Array.from(this.documents.values());
      const filteredDocs = allDocuments.filter(doc => {
        return Object.entries(metadataFilter).every(([key, value]) => {
          return doc.metadata[key] === value;
        });
      });
      
      return filteredDocs.slice(0, k);
    } catch (error) {
      console.error('Error searching by metadata:', error);
      return [];
    }
  }

  // Analytics and statistics
  getRAGStats() {
    const totalDocuments = this.documents.size;
    const totalChunks = Array.from(this.documents.values())
      .reduce((sum, doc) => sum + doc.chunkCount, 0);
    
    const documentTypes = {};
    const documentSizes = [];
    
    this.documents.forEach(doc => {
      const fileType = doc.metadata.fileType || 'unknown';
      documentTypes[fileType] = (documentTypes[fileType] || 0) + 1;
      documentSizes.push(doc.fullContentLength);
    });
    
    const avgDocumentSize = documentSizes.length > 0 
      ? documentSizes.reduce((sum, size) => sum + size, 0) / documentSizes.length 
      : 0;
    
    return {
      totalDocuments,
      totalChunks,
      documentTypes,
      averageDocumentSize: Math.round(avgDocumentSize),
      averageChunksPerDocument: totalDocuments > 0 ? Math.round(totalChunks / totalDocuments) : 0,
      config: {
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap
      }
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.embeddings || !this.vectorStore || !this.textSplitter) {
        return { healthy: false, error: 'Components not initialized' };
      }
      
      // Test embedding generation
      await this.embeddings.embedQuery('test query');
      
      return { 
        healthy: true, 
        documentsLoaded: this.documents.size,
        vectorStoreReady: !!this.vectorStore
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message 
      };
    }
  }
}
