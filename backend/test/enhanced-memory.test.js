import { SemanticMemoryManager } from '../src/memory/SemanticMemoryManager.js';
import { EntityRelationshipManager } from '../src/memory/EntityRelationshipManager.js';
import { DatabaseManager } from '../src/database/DatabaseManager.js';

describe('Enhanced Memory Features', () => {
  let memoryManager;
  let dbManager;
  const testSessionId = 'test-session-enhanced';

  beforeAll(async () => {
    // Initialize test database
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    
    // Initialize memory manager with test configuration
    memoryManager = new SemanticMemoryManager(dbManager, {
      similarityThreshold: 0.65,
      maxSemanticContext: 8,
      semanticWeight: 0.5
    });
    
    // Mock OpenAI embeddings for testing
    memoryManager.embeddings = {
      embedQuery: async (text) => {
        // Simple mock embedding based on text hash
        const hash = text.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        return new Array(1536).fill(0).map((_, i) => Math.sin(hash + i) * 0.1);
      }
    };
  });

  afterAll(async () => {
    if (dbManager) {
      await dbManager.close();
    }
  });

  describe('Entity Relationship Management', () => {
    test('should extract person-role relationships', async () => {
      const message = "I have a friend named Rahul. He's a data scientist at Google.";
      
      await memoryManager.addToShortTermMemory(testSessionId, message, 'user');
      
      const relationships = memoryManager.getEntityRelationships(testSessionId);
      
      expect(relationships.relationships.length).toBeGreaterThan(0);
      expect(relationships.entities).toContain('Rahul');
      expect(relationships.entities).toContain('scientist');
      expect(relationships.entities).toContain('google');
    });

    test('should handle entity corrections properly', async () => {
      // Initial information
      await memoryManager.addToShortTermMemory(testSessionId, "Sara is the manager of the sales team.", 'user');
      
      // Correction
      await memoryManager.addToShortTermMemory(testSessionId, "Actually, she's now working in marketing.", 'user');
      
      const entityState = memoryManager.getEntityCurrentState(testSessionId, 'Sara');
      
      expect(entityState.departments.length).toBeGreaterThan(0);
      // Should have marketing as the most recent/confident department
      expect(entityState.departments[0].value).toBe('marketing');
    });

    test('should track entity history with corrections', async () => {
      const entityHistory = memoryManager.getEntityHistory(testSessionId, 'Sara');
      
      expect(entityHistory.length).toBeGreaterThan(0);
      // Should have both sales and marketing entries
      const departments = entityHistory.filter(h => h.type === 'person_department');
      expect(departments.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Enhanced Context Retrieval', () => {
    test('should provide entity-aware context', async () => {
      const query = "What does Sara do?";
      
      const enhancedContext = await memoryManager.getEnhancedRelevantContext(testSessionId, query, 2000);
      
      expect(enhancedContext.length).toBeGreaterThan(0);
      
      // Should include entity-related messages
      const entityMessages = enhancedContext.filter(ctx => ctx.contextType === 'entity');
      expect(entityMessages.length).toBeGreaterThan(0);
    });

    test('should prioritize correction messages', async () => {
      const query = "Which team is Sara part of now?";
      
      const context = await memoryManager.getEnhancedRelevantContext(testSessionId, query, 2000);
      
      // Correction messages should have higher priority
      const correctionMessage = context.find(ctx => 
        ctx.content && ctx.content.toLowerCase().includes('actually')
      );
      
      expect(correctionMessage).toBeDefined();
      expect(correctionMessage.enhancedScore).toBeGreaterThan(0.5);
    });
  });

  describe('Memory Analytics', () => {
    test('should provide comprehensive memory analytics', async () => {
      const analytics = await memoryManager.getMemoryAnalytics(testSessionId);
      
      expect(analytics).toHaveProperty('session');
      expect(analytics).toHaveProperty('performance');
      expect(analytics).toHaveProperty('entities');
      expect(analytics).toHaveProperty('relationships');
      expect(analytics).toHaveProperty('memory');
      
      expect(analytics.session.messageCount).toBeGreaterThan(0);
      expect(analytics.entities.total).toBeGreaterThan(0);
      expect(analytics.performance.correctionAccuracy).toBeGreaterThanOrEqual(0);
    });

    test('should calculate correction accuracy', async () => {
      const analytics = await memoryManager.getMemoryAnalytics(testSessionId);
      
      expect(analytics.performance.totalCorrections).toBeGreaterThan(0);
      expect(analytics.performance.correctionAccuracy).toBeGreaterThan(0);
    });
  });

  describe('Manual Entity Correction', () => {
    test('should allow manual entity corrections', async () => {
      const result = await memoryManager.manualEntityCorrection(
        testSessionId, 
        'name:Sara', 
        'Senior Marketing Manager'
      );
      
      expect(result.success).toBe(true);
      expect(result.correction).toBeDefined();
      expect(result.correction.confidence).toBe(1.0);
    });
  });

  describe('Enhanced Configuration', () => {
    test('should use enhanced configuration values', () => {
      expect(memoryManager.shortTermMemorySize).toBe(30);
      expect(memoryManager.similarityThreshold).toBe(0.65);
      expect(memoryManager.maxSemanticContext).toBe(8);
      expect(memoryManager.semanticWeight).toBe(0.5);
    });

    test('should have entity relationship manager initialized', () => {
      expect(memoryManager.entityRelationshipManager).toBeDefined();
      expect(memoryManager.entityRelationshipManager).toBeInstanceOf(EntityRelationshipManager);
    });
  });

  describe('Entity Relationship Manager', () => {
    test('should calculate relationship confidence correctly', () => {
      const erm = new EntityRelationshipManager();
      
      const highConfidence = erm.calculateRelationshipConfidence(
        'john is a manager at google',
        'John',
        'manager'
      );
      
      const lowConfidence = erm.calculateRelationshipConfidence(
        'john and manager are words',
        'John',
        'manager'
      );
      
      expect(highConfidence).toBeGreaterThan(lowConfidence);
      expect(highConfidence).toBeGreaterThan(0.7);
    });

    test('should export relationship graph correctly', () => {
      const memory = memoryManager.getShortTermMemory(testSessionId);
      const exported = memoryManager.entityRelationshipManager.exportRelationshipGraph(memory.entityGraph);
      
      expect(exported).toHaveProperty('relationships');
      expect(exported).toHaveProperty('entities');
      expect(exported).toHaveProperty('statistics');
      
      expect(Array.isArray(exported.relationships)).toBe(true);
      expect(Array.isArray(exported.entities)).toBe(true);
      expect(typeof exported.statistics.totalRelationships).toBe('number');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete entity recall and correction workflow', async () => {
      const newSessionId = 'integration-test-session';
      
      // Step 1: Basic entity recall
      await memoryManager.addToShortTermMemory(newSessionId, "I have a friend named Rahul. He's a data scientist at Google.", 'user');
      
      // Step 2: Query entity
      const context1 = await memoryManager.getEnhancedRelevantContext(newSessionId, "What does Rahul do?", 1000);
      expect(context1.length).toBeGreaterThan(0);
      
      // Step 3: Role change
      await memoryManager.addToShortTermMemory(newSessionId, "Sara is the manager of the sales team.", 'user');
      await memoryManager.addToShortTermMemory(newSessionId, "Actually, she's now working in marketing.", 'user');
      
      // Step 4: Query updated entity
      const context2 = await memoryManager.getEnhancedRelevantContext(newSessionId, "Which team is Sara part of now?", 1000);
      expect(context2.length).toBeGreaterThan(0);
      
      // Step 5: Verify entity state
      const saraState = memoryManager.getEntityCurrentState(newSessionId, 'Sara');
      expect(saraState.departments.length).toBeGreaterThan(0);
      expect(saraState.departments[0].value).toBe('marketing');
      
      // Step 6: Check analytics
      const analytics = await memoryManager.getMemoryAnalytics(newSessionId);
      expect(analytics.entities.withCorrections).toBeGreaterThan(0);
      expect(analytics.performance.correctionAccuracy).toBeGreaterThan(0);
    });
  });
});
