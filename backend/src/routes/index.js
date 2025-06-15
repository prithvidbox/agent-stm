import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.md', '.pdf', '.docx', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

export function setupRoutes(app, { memoryManager, ragSystem, mcpClient, chatbotEngine, dbManager }) {
  
  // Chat endpoints
  router.post('/chat', async (req, res) => {
    try {
      const { message, sessionId = uuidv4(), userId = 'anonymous' } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const response = await chatbotEngine.processMessage(message, sessionId, userId);
      res.json(response);
      
    } catch (error) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  });

  router.get('/chat/history/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;
      
      const history = await chatbotEngine.getConversationHistory(sessionId, parseInt(limit));
      res.json({ sessionId, history });
      
    } catch (error) {
      console.error('Chat history endpoint error:', error);
      res.status(500).json({ error: 'Failed to get conversation history' });
    }
  });

  router.delete('/chat/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const success = await chatbotEngine.clearConversation(sessionId);
      res.json({ success, sessionId });
      
    } catch (error) {
      console.error('Clear conversation endpoint error:', error);
      res.status(500).json({ error: 'Failed to clear conversation' });
    }
  });

  // Memory endpoints
  router.get('/memory/short-term/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const memory = memoryManager.exportMemory(sessionId);
      res.json(memory);
      
    } catch (error) {
      console.error('Short-term memory endpoint error:', error);
      res.status(500).json({ error: 'Failed to get short-term memory' });
    }
  });

  router.get('/memory/long-term/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;
      
      const memories = await memoryManager.getLongTermMemoryContext(userId);
      res.json({ userId, memories: memories.slice(0, parseInt(limit)) });
      
    } catch (error) {
      console.error('Long-term memory endpoint error:', error);
      res.status(500).json({ error: 'Failed to get long-term memory' });
    }
  });

  router.get('/memory/stats', async (req, res) => {
    try {
      const stats = memoryManager.getMemoryStats();
      res.json(stats);
      
    } catch (error) {
      console.error('Memory stats endpoint error:', error);
      res.status(500).json({ error: 'Failed to get memory stats' });
    }
  });

  // Memory testing endpoints
  router.post('/memory/test/short-term', async (req, res) => {
    try {
      const { sessionId = uuidv4(), testMessages = [] } = req.body;
      
      if (!Array.isArray(testMessages) || testMessages.length === 0) {
        return res.status(400).json({ error: 'testMessages array is required' });
      }
      
      const results = await chatbotEngine.testShortTermMemory(sessionId, testMessages);
      res.json(results);
      
    } catch (error) {
      console.error('Short-term memory test error:', error);
      res.status(500).json({ error: 'Failed to test short-term memory' });
    }
  });

  router.post('/memory/test/long-term', async (req, res) => {
    try {
      const { userId = 'test-user', testData = [] } = req.body;
      
      if (!Array.isArray(testData) || testData.length === 0) {
        return res.status(400).json({ error: 'testData array is required' });
      }
      
      const results = await chatbotEngine.testLongTermMemory(userId, testData);
      res.json(results);
      
    } catch (error) {
      console.error('Long-term memory test error:', error);
      res.status(500).json({ error: 'Failed to test long-term memory' });
    }
  });

  // RAG endpoints
  router.post('/rag/upload', upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { title, description, tags } = req.body;
      const metadata = {
        title: title || req.file.originalname,
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.body.userId || 'anonymous',
        originalName: req.file.originalname
      };
      
      const documentId = await ragSystem.addDocumentFromFile(req.file.path, metadata);
      
      res.json({
        success: true,
        documentId,
        filename: req.file.originalname,
        metadata
      });
      
    } catch (error) {
      console.error('RAG upload endpoint error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  router.post('/rag/add-text', async (req, res) => {
    try {
      const { content, metadata = {} } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }
      
      const documentId = await ragSystem.addDocument(content, metadata);
      
      res.json({
        success: true,
        documentId,
        metadata
      });
      
    } catch (error) {
      console.error('RAG add text endpoint error:', error);
      res.status(500).json({ error: 'Failed to add text document' });
    }
  });

  router.get('/rag/documents', async (req, res) => {
    try {
      const documents = await ragSystem.listDocuments();
      res.json({ documents });
      
    } catch (error) {
      console.error('RAG documents endpoint error:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  });

  router.post('/rag/search', async (req, res) => {
    try {
      const { query, maxChunks = 5, minRelevanceScore = 0.6 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await ragSystem.getRelevantContext(query, maxChunks, minRelevanceScore);
      res.json(results);
      
    } catch (error) {
      console.error('RAG search endpoint error:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  });

  router.delete('/rag/documents/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;
      
      await ragSystem.removeDocument(documentId);
      res.json({ success: true, documentId });
      
    } catch (error) {
      console.error('RAG delete endpoint error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  router.get('/rag/stats', async (req, res) => {
    try {
      const stats = ragSystem.getRAGStats();
      res.json(stats);
      
    } catch (error) {
      console.error('RAG stats endpoint error:', error);
      res.status(500).json({ error: 'Failed to get RAG stats' });
    }
  });

  // RAG testing endpoint
  router.post('/rag/test', async (req, res) => {
    try {
      const { query, expectedSources = [] } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await chatbotEngine.testRAG(query, expectedSources);
      res.json(results);
      
    } catch (error) {
      console.error('RAG test endpoint error:', error);
      res.status(500).json({ error: 'Failed to test RAG' });
    }
  });

  // MCP endpoints
  router.get('/mcp/status', async (req, res) => {
    try {
      if (!mcpClient) {
        return res.json({ enabled: false, message: 'MCP client not configured' });
      }
      
      const status = mcpClient.getConnectionStatus();
      res.json({ enabled: true, ...status });
      
    } catch (error) {
      console.error('MCP status endpoint error:', error);
      res.status(500).json({ error: 'Failed to get MCP status' });
    }
  });

  router.get('/mcp/tools', async (req, res) => {
    try {
      if (!mcpClient) {
        return res.json({ tools: [] });
      }
      
      const tools = mcpClient.getAvailableTools();
      res.json({ tools });
      
    } catch (error) {
      console.error('MCP tools endpoint error:', error);
      res.status(500).json({ error: 'Failed to get MCP tools' });
    }
  });

  router.get('/mcp/resources', async (req, res) => {
    try {
      if (!mcpClient) {
        return res.json({ resources: [] });
      }
      
      const resources = mcpClient.getAvailableResources();
      res.json({ resources });
      
    } catch (error) {
      console.error('MCP resources endpoint error:', error);
      res.status(500).json({ error: 'Failed to get MCP resources' });
    }
  });

  router.post('/mcp/tools/:toolName', async (req, res) => {
    try {
      if (!mcpClient) {
        return res.status(400).json({ error: 'MCP client not available' });
      }
      
      const { toolName } = req.params;
      const { parameters = {} } = req.body;
      
      const result = await mcpClient.callTool(toolName, parameters);
      res.json(result);
      
    } catch (error) {
      console.error('MCP tool call endpoint error:', error);
      res.status(500).json({ error: 'Failed to call MCP tool' });
    }
  });

  router.get('/mcp/resources/:resourceUri', async (req, res) => {
    try {
      if (!mcpClient) {
        return res.status(400).json({ error: 'MCP client not available' });
      }
      
      const { resourceUri } = req.params;
      
      const result = await mcpClient.readResource(decodeURIComponent(resourceUri));
      res.json(result);
      
    } catch (error) {
      console.error('MCP resource read endpoint error:', error);
      res.status(500).json({ error: 'Failed to read MCP resource' });
    }
  });

  // MCP testing endpoint
  router.get('/mcp/test', async (req, res) => {
    try {
      const results = await chatbotEngine.testMCP();
      res.json(results);
      
    } catch (error) {
      console.error('MCP test endpoint error:', error);
      res.status(500).json({ error: 'Failed to test MCP' });
    }
  });

  // System endpoints
  router.get('/system/health', async (req, res) => {
    try {
      const health = await chatbotEngine.getSystemHealth();
      res.json(health);
      
    } catch (error) {
      console.error('System health endpoint error:', error);
      res.status(500).json({ error: 'Failed to get system health' });
    }
  });

  router.get('/system/stats', async (req, res) => {
    try {
      const stats = await chatbotEngine.getSystemStats();
      res.json(stats);
      
    } catch (error) {
      console.error('System stats endpoint error:', error);
      res.status(500).json({ error: 'Failed to get system stats' });
    }
  });

  // Database endpoints
  router.get('/database/sessions', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      
      const sessions = await dbManager.all(
        'SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT ?',
        [parseInt(limit)]
      );
      
      res.json({ sessions });
      
    } catch (error) {
      console.error('Database sessions endpoint error:', error);
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  });

  router.get('/database/mcp-logs', async (req, res) => {
    try {
      const { sessionId, limit = 50 } = req.query;
      
      const logs = await dbManager.getMCPLogs(sessionId, parseInt(limit));
      res.json({ logs });
      
    } catch (error) {
      console.error('Database MCP logs endpoint error:', error);
      res.status(500).json({ error: 'Failed to get MCP logs' });
    }
  });

  // Testing endpoints
  router.post('/test/complete', async (req, res) => {
    try {
      const { 
        sessionId = uuidv4(),
        userId = 'test-user',
        testShortTermMemory = true,
        testLongTermMemory = true,
        testRAG = true,
        testMCP = true
      } = req.body;

      const results = {
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test short-term memory
      if (testShortTermMemory) {
        const testMessages = [
          'Hello, my name is John',
          'I work as a software engineer',
          'I like pizza and coffee',
          'My favorite color is blue',
          'I have a dog named Max'
        ];
        results.tests.shortTermMemory = await chatbotEngine.testShortTermMemory(sessionId, testMessages);
      }

      // Test long-term memory
      if (testLongTermMemory) {
        const testData = [
          { content: 'User prefers morning meetings', importance: 7.5, type: 'preference' },
          { content: 'User is working on a React project', importance: 8.0, type: 'work' },
          { content: 'User mentioned having a deadline next week', importance: 9.0, type: 'important' }
        ];
        results.tests.longTermMemory = await chatbotEngine.testLongTermMemory(userId, testData);
      }

      // Test RAG
      if (testRAG) {
        results.tests.rag = await chatbotEngine.testRAG('What is artificial intelligence?');
      }

      // Test MCP
      if (testMCP) {
        results.tests.mcp = await chatbotEngine.testMCP();
      }

      // System health
      results.systemHealth = await chatbotEngine.getSystemHealth();

      res.json(results);

    } catch (error) {
      console.error('Complete test endpoint error:', error);
      res.status(500).json({ error: 'Failed to run complete test' });
    }
  });

  // Enhanced: Memory analytics endpoint
  router.get('/memory/analytics/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const analytics = await memoryManager.getMemoryAnalytics(sessionId);
      res.json(analytics);
    } catch (error) {
      console.error('Memory analytics endpoint error:', error);
      res.status(500).json({ error: 'Failed to get memory analytics' });
    }
  });

  // Enhanced: Entity relationships endpoint
  router.get('/memory/entities/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const entities = memoryManager.getEntityRelationships(sessionId);
      res.json(entities);
    } catch (error) {
      console.error('Entity relationships endpoint error:', error);
      res.status(500).json({ error: 'Failed to get entity relationships' });
    }
  });

  // Enhanced: Entity state endpoint
  router.get('/memory/entities/:sessionId/:entityName', async (req, res) => {
    try {
      const { sessionId, entityName } = req.params;
      const entityState = memoryManager.getEntityCurrentState(sessionId, entityName);
      const entityHistory = memoryManager.getEntityHistory(sessionId, entityName);
      res.json({ entityState, entityHistory });
    } catch (error) {
      console.error('Entity state endpoint error:', error);
      res.status(500).json({ error: 'Failed to get entity state' });
    }
  });

  // Enhanced: Manual entity correction endpoint
  router.post('/memory/correct-entity', async (req, res) => {
    try {
      const { sessionId, entityKey, newValue } = req.body;
      if (!sessionId || !entityKey || !newValue) {
        return res.status(400).json({ error: 'sessionId, entityKey, and newValue are required' });
      }
      
      const result = await memoryManager.manualEntityCorrection(sessionId, entityKey, newValue);
      res.json(result);
    } catch (error) {
      console.error('Manual entity correction endpoint error:', error);
      res.status(500).json({ error: 'Failed to apply entity correction' });
    }
  });

  // Mount the router
  app.use('/api', router);
  
  console.log('API routes configured successfully');
}
