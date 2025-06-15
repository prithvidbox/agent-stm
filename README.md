# Agent STM - Semantic Memory Chatbot Playground

A comprehensive chatbot testing platform featuring advanced semantic memory, MCP (Model Context Protocol) support, LangChain integration, and RAG (Retrieval-Augmented Generation) capabilities. This playground is specifically designed for testing and developing Agent Short-Term Memory (STM) systems with sophisticated context management.

## 🧠 Semantic Memory Features

### Advanced Memory Architecture
- **Semantic Memory**: Vector embeddings with OpenAI for context similarity
- **Short-term Memory**: Session-based memory for immediate context
- **Long-term Memory**: Persistent memory with importance scoring
- **Entity Relationship Tracking**: Advanced entity extraction and relationship mapping
- **Context Fusion**: Intelligent merging of temporal and semantic contexts

### Memory Testing Capabilities
- **Multi-turn Conversations**: Complex conversation flow testing
- **Entity Recall**: Test entity memory across sessions
- **Role Change Handling**: Dynamic entity relationship updates
- **Pronoun Resolution**: Advanced coreference resolution
- **Context Corrections**: Handle content modifications and updates

## Features

### 🤖 Advanced Chatbot Engine
- **LangChain Integration**: Powered by LangChain for sophisticated language model orchestration
- **OpenAI GPT-4**: Uses GPT-4 Turbo for high-quality responses
- **Real-time Communication**: WebSocket support for instant messaging
- **Context-Aware Responses**: Intelligent context management across conversations

### 🧠 Memory Systems
- **Semantic Memory**: Vector embeddings with similarity search
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
- **Browserbase Integration**: Cloud browser automation with web scraping and screenshots

### 📊 Analytics & Testing
- **System Health Monitoring**: Real-time system status tracking
- **Performance Metrics**: Detailed performance and usage statistics
- **Comprehensive Testing**: Built-in test suites for all components
- **Session Management**: Track and analyze user sessions
- **Export Capabilities**: Export chat history and analytics data

## Architecture

```
agent-stm/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── chatbot/        # Main chatbot engine
│   │   ├── memory/         # Advanced memory management system
│   │   │   ├── MemoryManager.js           # Base memory manager
│   │   │   ├── SemanticMemoryManager.js   # Semantic memory with embeddings
│   │   │   └── EntityRelationshipManager.js # Entity relationship tracking
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
├── docs/                   # Documentation
├── MEMORY_MANAGEMENT_ARCHITECTURE.md  # Detailed memory architecture
├── SECURITY.md            # Security guidelines
└── GIT_SECURITY_SETUP.md  # Git security setup guide
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key
- (Optional) MCP server for tool integration

### Installation

1. **Clone and setup the project:**
```bash
cd agent-stm/backend
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

# Semantic Memory Configuration
USE_SEMANTIC_MEMORY=true
SEMANTIC_SIMILARITY_THRESHOLD=0.75
MAX_SEMANTIC_CONTEXT=5
SEMANTIC_WEIGHT=0.6
EMBEDDING_MODEL=text-embedding-3-small

# Memory Configuration
SHORT_TERM_MEMORY_SIZE=20
LONG_TERM_MEMORY_THRESHOLD=5

# RAG Configuration
VECTOR_STORE_PATH=./data/vector_store
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## Usage Guide

### 1. Chat Interface
- Start chatting immediately with the AI assistant
- The chatbot has access to semantic memory, RAG, and MCP tools
- View real-time context information in message metadata
- Export chat history as JSON

### 2. Semantic Memory Testing
- **Entity Recall**: Test "I have a friend named Rahul. He's a data scientist at Google." → "What does Rahul do?"
- **Role Changes**: Test "Sara is the manager of the sales team." → "Actually, she's now working in marketing." → "Which team is Sara part of now?"
- **Complex Scenarios**: Multi-turn conversations with context evolution
- **Relationship Tracking**: Entity relationship updates and corrections

### 3. Memory Testing
- **Short-term Memory**: Test session-based memory retention
- **Long-term Memory**: Test persistent memory with importance scoring
- View memory statistics and current memory state
- Test entity extraction and sentiment analysis

### 4. RAG System
- **Upload Documents**: Drag and drop files or use the file picker
- **Add Text**: Directly input text content for indexing
- **Search**: Query your document collection
- **View Documents**: Browse uploaded documents and their metadata

### 5. MCP Integration
- **View Status**: Check MCP server connection status
- **Browse Tools**: See available MCP tools and their descriptions
- **Test Tools**: Execute MCP tools with custom parameters
- **Monitor Usage**: View MCP tool usage logs

## Semantic Memory Architecture

The semantic memory system implements a sophisticated multi-layered approach:

### Memory Layers
1. **Short-Term Memory (STM)**: In-memory storage with session isolation
2. **Long-Term Memory (LTM)**: Persistent SQLite storage for important information
3. **Semantic Memory**: Vector embeddings with similarity search

### Key Features
- **Vector Embeddings**: OpenAI text-embedding-3-small for semantic understanding
- **Context Fusion**: Intelligent merging of temporal and semantic contexts
- **Entity Relationships**: Advanced entity extraction and relationship tracking
- **Session Isolation**: Perfect separation between different conversation sessions
- **Automatic Promotion**: Smart promotion from STM to LTM based on importance

### Testing Scenarios
The system has been tested with complex scenarios including:
- Performance review conversations with multiple context updates
- Travel planning with pronoun resolution and context switching
- Entity relationship tracking with corrections and modifications
- Multi-document conversations with cross-referencing

## Security

This project implements comprehensive security measures:

- **Environment Protection**: All sensitive data in environment variables
- **Pre-commit Hooks**: Automatic scanning for exposed secrets
- **Comprehensive .gitignore**: Protection for all sensitive file types
- **Security Documentation**: Detailed security guidelines and procedures

See `SECURITY.md` and `GIT_SECURITY_SETUP.md` for detailed security information.

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

## Documentation

- **MEMORY_MANAGEMENT_ARCHITECTURE.md**: Detailed memory system architecture
- **SECURITY.md**: Security guidelines and best practices
- **GIT_SECURITY_SETUP.md**: Git security setup guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Follow security guidelines
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **LangChain**: For the excellent language model framework
- **OpenAI**: For providing powerful language models and embeddings
- **MCP**: For the Model Context Protocol specification
- **SQLite**: For reliable local database storage
