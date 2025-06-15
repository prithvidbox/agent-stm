import { v4 as uuidv4 } from 'uuid';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import { MemoryManager } from './MemoryManager.js';

export class SemanticMemoryManager extends MemoryManager {
  constructor(dbManager, config = {}) {
    super(dbManager);
    this.vectorStores = new Map(); // sessionId -> vectorStore
    this.embeddings = null;
    
    // Enhanced configuration with improved defaults
    this.similarityThreshold = config.similarityThreshold || parseFloat(process.env.SEMANTIC_SIMILARITY_THRESHOLD) || 0.75;
    this.maxSemanticContext = config.maxSemanticContext || parseInt(process.env.MAX_SEMANTIC_CONTEXT) || 5;
    this.semanticWeight = config.semanticWeight || parseFloat(process.env.SEMANTIC_WEIGHT) || 0.6;
    
    // Embedding model configuration
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    this.embeddingDimensions = config.embeddingDimensions || 1536;
  }

  async initialize() {
    console.log('Initializing Semantic Memory Manager...');
    
    try {
      // Initialize embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: this.embeddingModel,
        dimensions: this.embeddingDimensions
      });
      
      // Test embedding generation
      await this.embeddings.embedQuery('test initialization');
      
      console.log(`✅ Semantic Memory Manager initialized`);
      console.log(`   - Short-term memory size: ${this.shortTermMemorySize}`);
      console.log(`   - Long-term memory threshold: ${this.longTermMemoryThreshold}`);
      console.log(`   - Similarity threshold: ${this.similarityThreshold}`);
      console.log(`   - Embedding model: ${this.embeddingModel}`);
      
      // Call parent initialize
      await super.initialize();
      
    } catch (error) {
      console.error('Failed to initialize Semantic Memory Manager:', error);
      throw error;
    }
  }

  // Override addToShortTermMemory to add semantic processing
  addToShortTermMemory(sessionId, message, role = 'user') {
    const memory = this.getShortTermMemory(sessionId);
    
    const messageData = {
      id: uuidv4(),
      role,
      content: message,
      timestamp: Date.now(),
      entities: this.extractEntities(message),
      sentiment: this.analyzeSentiment(message),
      topics: this.extractTopics(message),
      embedding: null // Will be generated asynchronously
    };

    memory.messages.push(messageData);
    memory.lastActivity = Date.now();

    // Update entities and topics
    messageData.entities.forEach(entity => {
      const key = `${entity.type}:${entity.value}`;
      if (memory.entities.has(key)) {
        memory.entities.get(key).count++;
        memory.entities.get(key).lastMentioned = Date.now();
      } else {
        memory.entities.set(key, {
          type: entity.type,
          value: entity.value,
          count: 1,
          firstMentioned: Date.now(),
          lastMentioned: Date.now()
        });
      }
    });

    messageData.topics.forEach(topic => memory.topics.add(topic));

    // Generate embedding and add to vector store asynchronously
    this.generateEmbeddingAsync(sessionId, messageData);

    // Maintain size limit
    if (memory.messages.length > this.shortTermMemorySize) {
      const removedMessage = memory.messages.shift();
      // Consider promoting to long-term memory if important
      this.considerLongTermPromotion(sessionId, removedMessage);
    }

    return messageData;
  }

  // Generate embedding asynchronously
  async generateEmbeddingAsync(sessionId, messageData) {
    try {
      if (!this.embeddings) return;
      
      const embedding = await this.embeddings.embedQuery(messageData.content);
      messageData.embedding = embedding;
      
      // Add to vector store
      const vectorStore = this.getOrCreateVectorStore(sessionId);
      const document = new Document({
        pageContent: messageData.content,
        metadata: {
          messageId: messageData.id,
          sessionId,
          role: messageData.role,
          timestamp: messageData.timestamp,
          entities: messageData.entities,
          topics: messageData.topics
        }
      });
      
      await vectorStore.addDocuments([document]);
      
    } catch (error) {
      console.error('Error generating embedding:', error);
    }
  }

  // Get or create vector store for session
  getOrCreateVectorStore(sessionId) {
    if (!this.vectorStores.has(sessionId)) {
      this.vectorStores.set(sessionId, new MemoryVectorStore(this.embeddings));
    }
    return this.vectorStores.get(sessionId);
  }

  // Get semantically relevant context
  async getRelevantContext(sessionId, currentMessage, maxTokens = 2000) {
    try {
      const memory = this.getShortTermMemory(sessionId);
      
      // Get recent messages (temporal context)
      const recentMessages = memory.messages.slice(-5).map(msg => ({
        ...msg,
        contextType: 'temporal',
        relevanceScore: 1.0 - ((Date.now() - msg.timestamp) / (1000 * 60 * 60)) // Decay over time
      }));

      // Get semantically similar messages
      const semanticMatches = await this.getSemanticContext(sessionId, currentMessage, this.maxSemanticContext);
      const semanticMessages = semanticMatches.map(match => {
        const originalMessage = memory.messages.find(msg => msg.id === match.messageId);
        return {
          ...originalMessage,
          contextType: 'semantic',
          relevanceScore: match.similarity
        };
      });

      // Combine and deduplicate contexts
      const allContext = this.mergeContexts(recentMessages, semanticMessages);
      
      // Prioritize and truncate to token limit
      return this.prioritizeContext(allContext, maxTokens);
      
    } catch (error) {
      console.error('Error getting relevant context:', error);
      // Fallback to recent messages
      return this.getRecentMessages(sessionId, 5);
    }
  }

  // Get semantically similar messages
  async getSemanticContext(sessionId, query, topK = 5) {
    try {
      const vectorStore = this.vectorStores.get(sessionId);
      if (!vectorStore) return [];

      const results = await vectorStore.similaritySearchWithScore(query, topK * 2);
      
      // Filter by similarity threshold and format results
      const semanticMatches = results
        .filter(([doc, score]) => score >= this.similarityThreshold)
        .slice(0, topK)
        .map(([doc, score]) => ({
          messageId: doc.metadata.messageId,
          content: doc.pageContent,
          role: doc.metadata.role,
          timestamp: doc.metadata.timestamp,
          similarity: score,
          metadata: doc.metadata
        }));

      return semanticMatches;
      
    } catch (error) {
      console.error('Error getting semantic context:', error);
      return [];
    }
  }

  // Merge temporal and semantic contexts, removing duplicates
  mergeContexts(temporalContext, semanticContext) {
    const contextMap = new Map();
    
    // Add temporal context with temporal weight
    temporalContext.forEach(msg => {
      contextMap.set(msg.id, {
        ...msg,
        finalScore: msg.relevanceScore * (1 - this.semanticWeight)
      });
    });
    
    // Add or update with semantic context
    semanticContext.forEach(msg => {
      if (contextMap.has(msg.id)) {
        // Message exists in both contexts - combine scores
        const existing = contextMap.get(msg.id);
        existing.finalScore += msg.relevanceScore * this.semanticWeight;
        existing.contextType = 'both';
      } else {
        // New semantic message
        contextMap.set(msg.id, {
          ...msg,
          finalScore: msg.relevanceScore * this.semanticWeight
        });
      }
    });
    
    return Array.from(contextMap.values());
  }

  // Prioritize context messages and truncate to token limit
  prioritizeContext(contextMessages, maxTokens) {
    // Sort by final relevance score
    const sortedMessages = contextMessages.sort((a, b) => b.finalScore - a.finalScore);
    
    let totalTokens = 0;
    const selectedMessages = [];
    
    for (const message of sortedMessages) {
      const messageTokens = this.estimateTokens(message.content);
      if (totalTokens + messageTokens <= maxTokens) {
        selectedMessages.push(message);
        totalTokens += messageTokens;
      } else {
        break;
      }
    }
    
    // Sort selected messages by timestamp for chronological order
    return selectedMessages.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
  }

  // Override clearSession to also clear vector stores
  clearSession(sessionId) {
    try {
      console.log(`🧹 Clearing semantic session memory for: ${sessionId}`);
      
      // Clear vector store
      if (this.vectorStores.has(sessionId)) {
        this.vectorStores.delete(sessionId);
        console.log(`✅ Removed vector store for session: ${sessionId}`);
      }
      
      // Call parent clearSession
      return super.clearSession(sessionId);
      
    } catch (error) {
      console.error('Error clearing semantic session:', error);
      return false;
    }
  }

  // Enhanced context summary with semantic information
  async getContextSummary(sessionId) {
    const summary = super.getContextSummary(sessionId);
    
    // Add semantic information
    summary.semanticInfo = {
      vectorStoreExists: this.vectorStores.has(sessionId),
      embeddingModel: this.embeddingModel,
      similarityThreshold: this.similarityThreshold,
      semanticWeight: this.semanticWeight
    };
    
    return summary;
  }
}
