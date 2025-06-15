import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export class RedisMemoryManager {
  constructor(redisConfig = {}) {
    this.redis = new Redis({
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      password: redisConfig.password || process.env.REDIS_PASSWORD,
      db: redisConfig.db || process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      ...redisConfig
    });
    
    this.dbManager = null;
    this.shortTermTTL = 3600; // 1 hour
    this.longTermTTL = 86400 * 30; // 30 days
    this.maxShortTermMessages = 50;
    this.initialized = false;
  }

  async initialize(dbManager) {
    try {
      await this.redis.connect();
      this.dbManager = dbManager;
      this.initialized = true;
      console.log('✅ Redis Memory Manager initialized');
      
      // Test connection
      await this.redis.ping();
      console.log('✅ Redis connection verified');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Redis Memory Manager:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  // Short-term memory operations
  async addToShortTermMemory(sessionId, content, role = 'user', metadata = {}) {
    try {
      const messageId = uuidv4();
      const timestamp = Date.now();
      
      const message = {
        id: messageId,
        sessionId,
        role,
        content,
        timestamp,
        metadata
      };

      // Add to Redis list (FIFO)
      const key = `session:${sessionId}:messages`;
      await this.redis.lpush(key, JSON.stringify(message));
      
      // Trim to max messages
      await this.redis.ltrim(key, 0, this.maxShortTermMessages - 1);
      
      // Set TTL
      await this.redis.expire(key, this.shortTermTTL);
      
      // Update session metadata
      await this.updateSessionMetadata(sessionId, {
        lastActivity: timestamp,
        messageCount: await this.redis.llen(key)
      });

      return message;
    } catch (error) {
      console.error('Error adding to short-term memory:', error);
      throw error;
    }
  }

  async getRecentMessages(sessionId, limit = 10) {
    try {
      const key = `session:${sessionId}:messages`;
      const messages = await this.redis.lrange(key, 0, limit - 1);
      
      return messages.map(msg => JSON.parse(msg)).reverse(); // Reverse for chronological order
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  async getShortTermMemory(sessionId) {
    try {
      const messages = await this.getRecentMessages(sessionId, this.maxShortTermMessages);
      const metadata = await this.getSessionMetadata(sessionId);
      
      return {
        sessionId,
        messages,
        metadata,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('Error getting short-term memory:', error);
      return { sessionId, messages: [], metadata: {}, messageCount: 0 };
    }
  }

  async clearShortTermMemory(sessionId) {
    try {
      const key = `session:${sessionId}:messages`;
      await this.redis.del(key);
      
      // Clear session metadata
      await this.redis.del(`session:${sessionId}:metadata`);
      
      return true;
    } catch (error) {
      console.error('Error clearing short-term memory:', error);
      return false;
    }
  }

  // Session metadata operations
  async updateSessionMetadata(sessionId, metadata) {
    try {
      const key = `session:${sessionId}:metadata`;
      const existing = await this.redis.hgetall(key);
      
      const updated = {
        ...existing,
        ...metadata,
        updatedAt: Date.now()
      };

      await this.redis.hmset(key, updated);
      await this.redis.expire(key, this.shortTermTTL);
      
      return updated;
    } catch (error) {
      console.error('Error updating session metadata:', error);
      throw error;
    }
  }

  async getSessionMetadata(sessionId) {
    try {
      const key = `session:${sessionId}:metadata`;
      const metadata = await this.redis.hgetall(key);
      
      // Convert string numbers back to numbers
      if (metadata.lastActivity) metadata.lastActivity = parseInt(metadata.lastActivity);
      if (metadata.messageCount) metadata.messageCount = parseInt(metadata.messageCount);
      if (metadata.updatedAt) metadata.updatedAt = parseInt(metadata.updatedAt);
      
      return metadata;
    } catch (error) {
      console.error('Error getting session metadata:', error);
      return {};
    }
  }

  // Context analysis and summarization
  getContextSummary(sessionId) {
    // This will be implemented with Redis data
    return this.getShortTermMemory(sessionId).then(memory => {
      const messages = memory.messages || [];
      const entities = this.extractEntities(messages);
      const topics = this.extractTopics(messages);
      
      return {
        sessionId,
        messageCount: messages.length,
        recentMessages: messages.slice(-5),
        keyEntities: entities,
        activeTopics: topics,
        lastActivity: memory.metadata.lastActivity || Date.now()
      };
    });
  }

  extractEntities(messages) {
    const entities = [];
    const entityPatterns = {
      person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}-\d{3}-\d{4}\b/g,
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g
    };

    messages.forEach(msg => {
      if (msg.role === 'user') {
        Object.entries(entityPatterns).forEach(([type, pattern]) => {
          const matches = msg.content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              entities.push({ type, value: match, confidence: 0.8 });
            });
          }
        });
      }
    });

    return entities.slice(0, 10); // Limit to top 10 entities
  }

  extractTopics(messages) {
    const topics = [];
    const topicKeywords = {
      'technology': ['computer', 'software', 'programming', 'code', 'tech', 'AI', 'machine learning'],
      'business': ['company', 'business', 'market', 'sales', 'revenue', 'profit'],
      'health': ['health', 'medical', 'doctor', 'medicine', 'treatment', 'symptoms'],
      'education': ['school', 'university', 'learning', 'study', 'education', 'course'],
      'travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination']
    };

    const content = messages.map(msg => msg.content.toLowerCase()).join(' ');
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => content.includes(keyword));
      if (matches.length > 0) {
        topics.push({
          topic,
          relevance: matches.length / keywords.length,
          keywords: matches
        });
      }
    });

    return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  // Long-term memory operations (delegated to database)
  async getLongTermMemoryContext(userId, currentMessage = '') {
    if (!this.dbManager) {
      return [];
    }
    
    try {
      return await this.dbManager.getLongTermMemoryContext(userId, currentMessage);
    } catch (error) {
      console.error('Error getting long-term memory context:', error);
      return [];
    }
  }

  async saveLongTermMemory(userId, type, content, importance, metadata = {}) {
    if (!this.dbManager) {
      throw new Error('Database manager not available');
    }
    
    return await this.dbManager.saveLongTermMemory(userId, type, content, importance, metadata);
  }

  // Cache operations for frequently accessed data
  async cacheSet(key, value, ttl = 3600) {
    try {
      await this.redis.setex(`cache:${key}`, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  async cacheGet(key) {
    try {
      const value = await this.redis.get(`cache:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async cacheDel(key) {
    try {
      await this.redis.del(`cache:${key}`);
      return true;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  // Session management
  async createSession(sessionId, userId, metadata = {}) {
    try {
      const sessionData = {
        sessionId,
        userId,
        createdAt: Date.now(),
        ...metadata
      };

      await this.updateSessionMetadata(sessionId, sessionData);
      
      // Add to user's session list
      await this.redis.sadd(`user:${userId}:sessions`, sessionId);
      
      return sessionData;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getUserSessions(userId, limit = 10) {
    try {
      const sessionIds = await this.redis.smembers(`user:${userId}:sessions`);
      const sessions = [];
      
      for (const sessionId of sessionIds.slice(0, limit)) {
        const metadata = await this.getSessionMetadata(sessionId);
        if (Object.keys(metadata).length > 0) {
          sessions.push({ sessionId, ...metadata });
        }
      }
      
      return sessions.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Analytics and monitoring
  async getMemoryStats() {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Count different types of keys
      const sessionKeys = await this.redis.keys('session:*');
      const cacheKeys = await this.redis.keys('cache:*');
      const userKeys = await this.redis.keys('user:*');
      
      return {
        redis: {
          connected: this.redis.status === 'ready',
          memory: this.parseRedisInfo(info),
          keyspace: this.parseRedisInfo(keyspace)
        },
        keys: {
          total: sessionKeys.length + cacheKeys.length + userKeys.length,
          sessions: sessionKeys.length,
          cache: cacheKeys.length,
          users: userKeys.length
        },
        shortTermMemory: {
          maxMessages: this.maxShortTermMessages,
          ttl: this.shortTermTTL
        }
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return { error: error.message };
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(value) ? value : Number(value);
      }
    });
    
    return result;
  }

  // Health check
  async healthCheck() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        latency,
        status: this.redis.status,
        connected: this.redis.status === 'ready'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: this.redis.status
      };
    }
  }

  // Cleanup operations
  async cleanup() {
    try {
      // Remove expired sessions
      const allSessions = await this.redis.keys('session:*:metadata');
      let cleanedCount = 0;
      
      for (const sessionKey of allSessions) {
        const ttl = await this.redis.ttl(sessionKey);
        if (ttl === -1) { // No TTL set
          await this.redis.expire(sessionKey, this.shortTermTTL);
        } else if (ttl === -2) { // Key doesn't exist
          cleanedCount++;
        }
      }
      
      return { cleanedSessions: cleanedCount };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return { error: error.message };
    }
  }
}
