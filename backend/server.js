import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Import our custom modules
import { MemoryManager } from './src/memory/MemoryManager.js';
import { RedisMemoryManager } from './src/memory/RedisMemoryManager.js';
import { SemanticMemoryManager } from './src/memory/SemanticMemoryManager.js';
import { RAGSystem } from './src/rag/RAGSystem.js';
import { ChromaRAGSystem } from './src/rag/ChromaRAGSystem.js';
import { MCPClient } from './src/mcp/MCPClient.js';
import { ChatbotEngine } from './src/chatbot/ChatbotEngine.js';
import { setupRoutes } from './src/routes/index.js';
import { mcpRoutes, setMCPManager } from './src/routes/mcp.js';
import { MCPManager } from './src/mcp/MCPManager.js';
import { DatabaseManager } from './src/database/DatabaseManager.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend
app.use(express.static(join(__dirname, '../frontend')));

// Initialize core systems
let memoryManager;
let ragSystem;
let mcpClient;
let chatbotEngine;
let dbManager;
let mcpManager;

async function initializeSystems() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const useRedisMemory = process.env.USE_REDIS_MEMORY === 'true';
    const useSemanticMemory = process.env.USE_SEMANTIC_MEMORY === 'true';
    const useChromaRAG = process.env.USE_CHROMA_RAG === 'true';
    
    console.log('🚀 Initializing Chatbot Playground Systems...');
    console.log(`🔧 Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`🧠 Memory: ${useSemanticMemory ? 'Semantic' : useRedisMemory ? 'Redis' : 'In-Memory'}`);
    console.log(`📚 RAG: ${useChromaRAG ? 'ChromaDB' : 'Local Vector Store'}`);
    
    // Initialize database
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    console.log('✅ Database initialized');
    
    // Initialize memory manager with priority: Semantic > Redis > In-Memory
    if (useSemanticMemory) {
      memoryManager = new SemanticMemoryManager(dbManager, {
        similarityThreshold: parseFloat(process.env.SEMANTIC_SIMILARITY_THRESHOLD) || 0.75,
        maxSemanticContext: parseInt(process.env.MAX_SEMANTIC_CONTEXT) || 5,
        clusteringInterval: parseInt(process.env.CLUSTERING_INTERVAL) || 5,
        semanticWeight: parseFloat(process.env.SEMANTIC_WEIGHT) || 0.6,
        embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS) || 1536
      });
      await memoryManager.initialize();
      console.log('✅ Semantic Memory Manager initialized');
    } else if (useRedisMemory) {
      memoryManager = new RedisMemoryManager({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB
      });
      await memoryManager.initialize(dbManager);
      console.log('✅ Redis Memory Manager initialized');
    } else {
      memoryManager = new MemoryManager(dbManager);
      await memoryManager.initialize();
      console.log('✅ In-Memory Manager initialized');
    }
    
    // Initialize RAG system (ChromaDB for production, local for development)
    if (useChromaRAG) {
      ragSystem = new ChromaRAGSystem({
        chromaUrl: process.env.CHROMA_URL,
        collectionName: process.env.CHROMA_COLLECTION,
        chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
        chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200
      });
      await ragSystem.initialize(dbManager);
      console.log('✅ ChromaDB RAG System initialized');
    } else {
      ragSystem = new RAGSystem();
      await ragSystem.initialize();
      console.log('✅ Local RAG System initialized');
    }
    
    // Initialize MCP Manager
    mcpManager = new MCPManager();
    await mcpManager.initialize();
    console.log('✅ MCP Manager initialized');
    
    // Set the MCP manager for routes
    setMCPManager(mcpManager);
    
    // Initialize MCP client if enabled
    if (process.env.MCP_ENABLED === 'true') {
      mcpClient = new MCPClient();
      await mcpClient.initialize();
      console.log('✅ MCP Client initialized');
    }
    
    // Initialize chatbot engine
    chatbotEngine = new ChatbotEngine({
      memoryManager,
      ragSystem,
      mcpClient,
      mcpManager
    });
    await chatbotEngine.initialize();
    console.log('✅ Chatbot Engine initialized');
    
    // Setup API routes
    setupRoutes(app, {
      memoryManager,
      ragSystem,
      mcpClient,
      chatbotEngine,
      dbManager
    });
    
    // Setup MCP management routes
    app.use('/api/mcp', mcpRoutes);
    
    console.log('🎉 All systems initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize systems:', error);
    process.exit(1);
  }
}

// WebSocket handling for real-time chat
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established');
  
  ws.on('message', async (message) => {
    console.log('📨 Received WebSocket message:', message.toString());
    
    try {
      const data = JSON.parse(message.toString());
      console.log('📋 Parsed message data:', data);
      
      if (data.type === 'chat') {
        console.log('💬 Processing chat message:', data.message);
        
        // Send immediate acknowledgment
        const startMessage = {
          type: 'chat_start',
          sessionId: data.sessionId,
          messageId: data.messageId || Date.now().toString()
        };
        console.log('📤 Sending chat_start:', startMessage);
        ws.send(JSON.stringify(startMessage));
        
        // Send processing status
        const statusMessage = {
          type: 'chat_status',
          status: 'thinking',
          message: 'Processing your message...',
          sessionId: data.sessionId
        };
        console.log('📤 Sending chat_status:', statusMessage);
        ws.send(JSON.stringify(statusMessage));
        
        try {
          console.log('🤖 Calling chatbotEngine.processMessage...');
          
          // Process the message
          const response = await chatbotEngine.processMessage(
            data.message,
            data.sessionId || 'default',
            data.userId || 'anonymous'
          );
          
          console.log('✅ Got response from chatbotEngine:', {
            content: response.content?.substring(0, 100) + '...',
            sessionId: response.sessionId,
            processingTime: response.processingTime
          });
          
          // Send final response
          const responseMessage = {
            type: 'chat_response',
            response,
            sessionId: data.sessionId
          };
          console.log('📤 Sending chat_response');
          ws.send(JSON.stringify(responseMessage));
          
        } catch (error) {
          console.error('❌ Chat processing error:', error);
          const errorMessage = {
            type: 'chat_error',
            error: error.message,
            sessionId: data.sessionId
          };
          console.log('📤 Sending chat_error:', errorMessage);
          ws.send(JSON.stringify(errorMessage));
        }
      } else {
        console.log('❓ Unknown message type:', data.type);
      }
      
    } catch (error) {
      console.error('❌ WebSocket message parsing error:', error);
      const errorMessage = {
        type: 'error',
        message: 'Failed to process message: ' + error.message
      };
      console.log('📤 Sending error message:', errorMessage);
      ws.send(JSON.stringify(errorMessage));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    systems: {
      memory: !!memoryManager,
      rag: !!ragSystem,
      mcp: !!mcpClient,
      chatbot: !!chatbotEngine,
      database: !!dbManager
    }
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await initializeSystems();
  
  server.listen(PORT, () => {
    console.log(`🌟 Chatbot Playground Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (mcpClient) await mcpClient.disconnect();
  if (dbManager) await dbManager.close();
  process.exit(0);
});

startServer().catch(console.error);
