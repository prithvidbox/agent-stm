import { v4 as uuidv4 } from 'uuid';

export class MemoryManager {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.shortTermMemory = new Map(); // sessionId -> memory data
    this.shortTermMemorySize = parseInt(process.env.SHORT_TERM_MEMORY_SIZE) || 10;
    this.longTermMemoryThreshold = parseInt(process.env.LONG_TERM_MEMORY_THRESHOLD) || 5;
  }

  async initialize() {
    console.log('Initializing Memory Manager...');
    // Load any existing long-term memories into cache if needed
    console.log(`Short-term memory size: ${this.shortTermMemorySize}`);
    console.log(`Long-term memory threshold: ${this.longTermMemoryThreshold}`);
  }

  // Short-term memory management
  getShortTermMemory(sessionId) {
    if (!this.shortTermMemory.has(sessionId)) {
      this.shortTermMemory.set(sessionId, {
        messages: [],
        context: {},
        entities: new Map(),
        topics: new Set(),
        lastActivity: Date.now()
      });
    }
    return this.shortTermMemory.get(sessionId);
  }

  addToShortTermMemory(sessionId, message, role = 'user') {
    const memory = this.getShortTermMemory(sessionId);
    
    const messageData = {
      id: uuidv4(),
      role,
      content: message,
      timestamp: Date.now(),
      entities: this.extractEntities(message),
      sentiment: this.analyzeSentiment(message),
      topics: this.extractTopics(message)
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

    // Maintain size limit
    if (memory.messages.length > this.shortTermMemorySize) {
      const removedMessage = memory.messages.shift();
      // Consider promoting to long-term memory if important
      this.considerLongTermPromotion(sessionId, removedMessage);
    }

    return messageData;
  }

  getRecentMessages(sessionId, count = 5) {
    const memory = this.getShortTermMemory(sessionId);
    return memory.messages.slice(-count);
  }

  getContextSummary(sessionId) {
    const memory = this.getShortTermMemory(sessionId);
    
    const recentMessages = memory.messages.slice(-5);
    const entities = Array.from(memory.entities.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const topics = Array.from(memory.topics).slice(-5);

    return {
      messageCount: memory.messages.length,
      recentMessages: recentMessages.map(m => ({
        role: m.role,
        content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
        timestamp: m.timestamp
      })),
      keyEntities: entities,
      activeTopics: topics,
      lastActivity: memory.lastActivity
    };
  }

  // Long-term memory management
  async considerLongTermPromotion(sessionId, message) {
    const importanceScore = this.calculateImportanceScore(message);
    
    if (importanceScore >= this.longTermMemoryThreshold) {
      await this.promoteToLongTermMemory(sessionId, message, importanceScore);
    }
  }

  calculateImportanceScore(message) {
    let score = 0;
    
    // Length factor (longer messages might be more important)
    score += Math.min(message.content.length / 100, 2);
    
    // Entity factor (messages with many entities might be more important)
    score += message.entities.length * 0.5;
    
    // Sentiment factor (strong emotions might be more memorable)
    if (message.sentiment) {
      score += Math.abs(message.sentiment.score) * 2;
    }
    
    // Question factor (questions might be more important)
    if (message.content.includes('?')) {
      score += 1;
    }
    
    // Personal information factor
    const personalKeywords = ['my', 'i am', 'i like', 'i hate', 'i want', 'i need'];
    const hasPersonalInfo = personalKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    );
    if (hasPersonalInfo) {
      score += 2;
    }
    
    // Topic relevance (if message contains important topics)
    const importantTopics = ['work', 'family', 'health', 'goals', 'problems'];
    const hasImportantTopic = importantTopics.some(topic =>
      message.content.toLowerCase().includes(topic)
    );
    if (hasImportantTopic) {
      score += 1.5;
    }
    
    return score;
  }

  async promoteToLongTermMemory(sessionId, message, importanceScore) {
    try {
      const session = await this.dbManager.getSession(sessionId);
      const userId = session?.user_id || 'anonymous';
      
      const memoryContent = {
        originalMessage: message.content,
        entities: message.entities,
        topics: message.topics,
        sentiment: message.sentiment,
        context: `From session ${sessionId} at ${new Date(message.timestamp).toISOString()}`
      };
      
      await this.dbManager.saveLongTermMemory(
        userId,
        'conversation',
        JSON.stringify(memoryContent),
        importanceScore,
        {
          sessionId,
          originalTimestamp: message.timestamp,
          promotionReason: 'importance_threshold'
        }
      );
      
      console.log(`Promoted message to long-term memory with score ${importanceScore}`);
    } catch (error) {
      console.error('Error promoting to long-term memory:', error);
    }
  }

  async getLongTermMemoryContext(userId, query = null) {
    try {
      // Check if the database method exists and handle gracefully
      if (!this.dbManager || typeof this.dbManager.getLongTermMemories !== 'function') {
        console.log('Long-term memory not available - database method missing');
        return [];
      }
      
      const memories = await this.dbManager.getLongTermMemories(userId, 10);
      
      // If no memories found, return empty array
      if (!memories || memories.length === 0) {
        return [];
      }
      
      if (query) {
        // Filter memories relevant to the query
        const relevantMemories = memories.filter(memory => {
          try {
            // Ensure memory has content property
            if (!memory.content) {
              return false;
            }
            
            // Try to parse as JSON first
            const content = JSON.parse(memory.content);
            if (content && content.originalMessage && content.topics) {
              return content.originalMessage.toLowerCase().includes(query.toLowerCase()) ||
                     content.topics.some(topic => query.toLowerCase().includes(topic.toLowerCase()));
            }
            // If structure is unexpected, fall back to string matching
            return memory.content.toLowerCase().includes(query.toLowerCase());
          } catch (error) {
            // If JSON parsing fails, try simple string matching
            if (memory.content && typeof memory.content === 'string') {
              return memory.content.toLowerCase().includes(query.toLowerCase());
            }
            return false;
          }
        });
        
        // Update access counts for relevant memories
        for (const memory of relevantMemories) {
          try {
            if (this.dbManager.updateMemoryAccess && typeof this.dbManager.updateMemoryAccess === 'function') {
              await this.dbManager.updateMemoryAccess(memory.id);
            }
          } catch (error) {
            console.error('Error updating memory access:', error);
          }
        }
        
        return relevantMemories;
      }
      
      return memories;
    } catch (error) {
      console.error('Error retrieving long-term memory:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Entity extraction (simple implementation)
  extractEntities(text) {
    const entities = [];
    
    // Simple regex patterns for common entities
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      time: /\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b/gi,
      url: /https?:\/\/[^\s]+/g,
      mention: /@\w+/g,
      hashtag: /#\w+/g
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({ type, value: match.trim() });
        });
      }
    }
    
    // Extract potential names (capitalized words)
    const namePattern = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;
    const nameMatches = text.match(namePattern);
    if (nameMatches) {
      nameMatches.forEach(match => {
        // Filter out common words that might be capitalized
        const commonWords = ['I', 'The', 'This', 'That', 'What', 'Where', 'When', 'How', 'Why'];
        if (!commonWords.includes(match)) {
          entities.push({ type: 'name', value: match });
        }
      });
    }
    
    return entities;
  }

  // Simple sentiment analysis
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const score = (positiveCount - negativeCount) / words.length;
    const magnitude = (positiveCount + negativeCount) / words.length;
    
    return {
      score: score,
      magnitude: magnitude,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
    };
  }

  // Topic extraction
  extractTopics(text) {
    const topicKeywords = {
      work: ['job', 'work', 'career', 'office', 'boss', 'colleague', 'meeting', 'project'],
      family: ['family', 'mother', 'father', 'parent', 'child', 'sibling', 'brother', 'sister'],
      health: ['health', 'doctor', 'medicine', 'sick', 'hospital', 'exercise', 'diet'],
      technology: ['computer', 'software', 'app', 'website', 'internet', 'phone', 'tech'],
      travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'destination', 'journey'],
      food: ['food', 'restaurant', 'cooking', 'recipe', 'meal', 'dinner', 'lunch'],
      entertainment: ['movie', 'music', 'book', 'game', 'show', 'concert', 'theater'],
      education: ['school', 'university', 'study', 'learn', 'course', 'teacher', 'student']
    };
    
    const topics = [];
    const lowerText = text.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  // Memory cleanup and maintenance
  cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = Date.now();
    const sessionsToRemove = [];
    
    for (const [sessionId, memory] of this.shortTermMemory.entries()) {
      if (now - memory.lastActivity > maxAge) {
        sessionsToRemove.push(sessionId);
      }
    }
    
    sessionsToRemove.forEach(sessionId => {
      this.shortTermMemory.delete(sessionId);
    });
    
    if (sessionsToRemove.length > 0) {
      console.log(`Cleaned up ${sessionsToRemove.length} old memory sessions`);
    }
  }

  // Get memory statistics
  getMemoryStats() {
    const shortTermStats = {
      activeSessions: this.shortTermMemory.size,
      totalMessages: Array.from(this.shortTermMemory.values())
        .reduce((sum, memory) => sum + memory.messages.length, 0),
      totalEntities: Array.from(this.shortTermMemory.values())
        .reduce((sum, memory) => sum + memory.entities.size, 0),
      totalTopics: Array.from(this.shortTermMemory.values())
        .reduce((sum, memory) => sum + memory.topics.size, 0)
    };
    
    return {
      shortTerm: shortTermStats,
      config: {
        shortTermMemorySize: this.shortTermMemorySize,
        longTermMemoryThreshold: this.longTermMemoryThreshold
      }
    };
  }

  // Clear session memory (required by ChatbotEngine)
  clearSession(sessionId) {
    try {
      console.log(`🧹 Clearing session memory for: ${sessionId}`);
      
      if (this.shortTermMemory.has(sessionId)) {
        this.shortTermMemory.delete(sessionId);
        console.log(`✅ Removed short-term memory for session: ${sessionId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  // Export memory for analysis
  exportMemory(sessionId) {
    const memory = this.getShortTermMemory(sessionId);
    return {
      sessionId,
      messages: memory.messages,
      entities: Array.from(memory.entities.entries()),
      topics: Array.from(memory.topics),
      context: memory.context,
      lastActivity: memory.lastActivity,
      summary: this.getContextSummary(sessionId)
    };
  }
}
