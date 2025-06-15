# Chatbot Playground

A comprehensive chatbot testing platform featuring MCP (Model Context Protocol) support, LangChain integration, advanced memory systems, and RAG (Retrieval-Augmented Generation) capabilities.

## Features

### 🤖 Advanced Chatbot Engine
- **LangChain Integration**: Powered by LangChain for sophisticated language model orchestration
- **OpenAI GPT-4**: Uses GPT-4 Turbo for high-quality responses
- **Real-time Communication**: WebSocket support for instant messaging
- **Context-Aware Responses**: Intelligent context management across conversations

### 🧠 Memory Systems
- **Short-term Memory**: Session-based memory for immediate context
- **Long-term Memory**: Persistent memory with importance scoring
- **Entity Extraction**: Automatic extraction of names, dates, emails, etc.
- **Sentiment Analysis**: Basic sentiment analysis of user messages
- **Topic Classification**: Automatic categorization of conversation topics

### 🔍 RAG (Retrieval-Augmented Generation)
- **Document Upload**: Support for PDF, DOCX, TXT, MD, and JSON files
- **Vector Search**: Semantic search using OpenAI embeddings
- **Chunk Management**: Intelligent document chunking with overlap
- **Source Citation**: Automatic source attribution in responses
- **Multiple Formats**: Drag-and-drop file upload and text input

### 🛠️ MCP (Model Context Protocol) Support
- **Tool Integration**: Connect external tools and services
- **Resource Access**: Access external data sources
- **Real-time Discovery**: Dynamic tool and resource discovery
- **Error Handling**: Robust error handling and retry mechanisms
- **Usage Logging**: Comprehensive logging of tool usage

### 📊 Analytics & Testing
- **System Health Monitoring**: Real-time system status tracking
- **Performance Metrics**: Detailed performance and usage statistics
- **Comprehensive Testing**: Built-in test suites for all components
- **Session Management**: Track and analyze user sessions
- **Export Capabilities**: Export chat history and analytics data

## Architecture

```
chatbot-playground/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── chatbot/        # Main chatbot engine
│   │   ├── memory/         # Memory management system
│   │   ├── rag/            # RAG implementation
│   │   ├── mcp/            # MCP client
│   │   ├── database/       # SQLite database manager
│   │   └── routes/         # API routes
│   ├── data/               # Data storage
│   └── package.json
├── frontend/               # HTML/CSS/JS frontend
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── docs/                   # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key
- (Optional) MCP server for tool integration

### Installation

1. **Clone and setup the project:**
```bash
cd chatbot-playground/backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your OpenAI API key and other settings
```

3. **Start the server:**
```bash
npm start
```

4. **Open the application:**
Navigate to `http://localhost:3001` in your browser

### Environment Configuration

Create a `.env` file in the backend directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_PATH=./data/chatbot.db

# MCP Configuration (Optional)
MCP_SERVER_URL=ws://localhost:3000
MCP_ENABLED=true

# Memory Configuration
SHORT_TERM_MEMORY_SIZE=10
LONG_TERM_MEMORY_THRESHOLD=5

# RAG Configuration
VECTOR_STORE_PATH=./data/vector_store
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## Usage Guide

### 1. Chat Interface
- Start chatting immediately with the AI assistant
- The chatbot has access to memory, RAG, and MCP tools
- View real-time context information in message metadata
- Export chat history as JSON

### 2. Memory Testing
- **Short-term Memory**: Test session-based memory retention
- **Long-term Memory**: Test persistent memory with importance scoring
- View memory statistics and current memory state
- Test entity extraction and sentiment analysis

### 3. RAG System
- **Upload Documents**: Drag and drop files or use the file picker
- **Add Text**: Directly input text content for indexing
- **Search**: Query your document collection
- **View Documents**: Browse uploaded documents and their metadata

### 4. MCP Integration
- **View Status**: Check MCP server connection status
- **Browse Tools**: See available MCP tools and their descriptions
- **Test Tools**: Execute MCP tools with custom parameters
- **Monitor Usage**: View MCP tool usage logs

### 5. Testing & Analytics
- **Comprehensive Tests**: Run full system tests
- **Individual Tests**: Test specific components
- **System Health**: Monitor system status and performance
- **Analytics**: View usage statistics and session history

## API Reference

### Chat Endpoints
- `POST /api/chat` - Send a message to the chatbot
- `GET /api/chat/history/:sessionId` - Get conversation history
- `DELETE /api/chat/:sessionId` - Clear conversation

### Memory Endpoints
- `GET /api/memory/short-term/:sessionId` - Get short-term memory
- `GET /api/memory/long-term/:userId` - Get long-term memory
- `POST /api/memory/test/short-term` - Test short-term memory
- `POST /api/memory/test/long-term` - Test long-term memory

### RAG Endpoints
- `POST /api/rag/upload` - Upload document
- `POST /api/rag/add-text` - Add text document
- `POST /api/rag/search` - Search documents
- `GET /api/rag/documents` - List documents

### MCP Endpoints
- `GET /api/mcp/status` - Get MCP status
- `GET /api/mcp/tools` - List available tools
- `POST /api/mcp/tools/:toolName` - Execute tool
- `GET /api/mcp/resources` - List available resources

### System Endpoints
- `GET /api/system/health` - System health check
- `GET /api/system/stats` - System statistics
- `POST /api/test/complete` - Run comprehensive tests

## Technical Details

### Memory System
The memory system implements a two-tier approach:

1. **Short-term Memory**: In-memory storage for current session context
   - Configurable size limit (default: 10 messages)
   - Entity extraction and sentiment analysis
   - Topic classification
   - Automatic promotion to long-term memory

2. **Long-term Memory**: Persistent SQLite storage for important information
   - Importance scoring algorithm
   - Access frequency tracking
   - Contextual retrieval based on current conversation

### RAG Implementation
The RAG system uses:

- **OpenAI Embeddings**: text-embedding-ada-002 model
- **Vector Storage**: In-memory vector store (MemoryVectorStore)
- **Text Splitting**: Recursive character text splitter
- **Document Processing**: Support for multiple file formats
- **Semantic Search**: Similarity search with configurable thresholds

### MCP Integration
The MCP client provides:

- **WebSocket Communication**: Real-time connection to MCP servers
- **Tool Discovery**: Automatic discovery of available tools
- **Resource Access**: Access to external data sources
- **Error Handling**: Robust error handling and reconnection
- **Usage Logging**: Comprehensive logging for debugging

## Development

### Project Structure
```
backend/src/
├── chatbot/
│   └── ChatbotEngine.js      # Main orchestration engine
├── memory/
│   └── MemoryManager.js      # Memory management
├── rag/
│   └── RAGSystem.js          # RAG implementation
├── mcp/
│   └── MCPClient.js          # MCP client
├── database/
│   └── DatabaseManager.js   # SQLite operations
└── routes/
    └── index.js              # API routes
```

### Adding New Features

1. **New Memory Types**: Extend `MemoryManager.js`
2. **Document Formats**: Add processors to `RAGSystem.js`
3. **MCP Tools**: Implement in external MCP servers
4. **API Endpoints**: Add routes to `routes/index.js`

### Testing

The application includes comprehensive testing capabilities:

- **Unit Tests**: Test individual components
- **Integration Tests**: Test system interactions
- **End-to-End Tests**: Test complete workflows
- **Performance Tests**: Monitor system performance

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure network connectivity

2. **Memory Issues**
   - Check database permissions
   - Verify SQLite installation
   - Monitor memory usage

3. **RAG Problems**
   - Verify document upload permissions
   - Check embedding generation
   - Monitor vector store size

4. **MCP Connection Issues**
   - Verify MCP server is running
   - Check WebSocket connectivity
   - Review MCP server logs

### Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check the browser console and server logs for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **LangChain**: For the excellent language model framework
- **OpenAI**: For providing powerful language models and embeddings
- **MCP**: For the Model Context Protocol specification
- **SQLite**: For reliable local database storage
