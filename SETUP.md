# Quick Setup Guide

## Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## Quick Start (Recommended)

1. **Run the startup script:**
   ```bash
   ./start.sh
   ```
   
   This script will:
   - Check Node.js installation
   - Install dependencies
   - Create necessary directories
   - Guide you through configuration
   - Start the server

2. **Configure your OpenAI API key:**
   - The script will create a `.env` file from `.env.example`
   - Edit `backend/.env` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

3. **Open the application:**
   - Navigate to `http://localhost:3001`
   - Start chatting and testing features!

## Manual Setup

If you prefer manual setup:

1. **Install dependencies:**
   ```bash
   cd chatbot-playground/backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Testing the Application

### 1. Basic Chat Test
- Go to the Chat tab
- Send a message like "Hello, my name is John and I work as a software engineer"
- The chatbot should respond and remember your information

### 2. Memory System Test
- Go to the Memory tab
- Click "Test" buttons to run memory tests
- View short-term and long-term memory data

### 3. RAG System Test
- Go to the RAG tab
- Upload the sample document: `docs/sample-ai-document.md`
- Search for "What is machine learning?"
- The system should find relevant information from the document

### 4. MCP Integration Test
- Go to the MCP tab
- Check the connection status
- If you have an MCP server running, you'll see available tools

### 5. Comprehensive Test
- Go to the Testing tab
- Click "Run Complete Test"
- This will test all systems automatically

## Features to Explore

### Chat Interface
- **Real-time messaging** with WebSocket support
- **Context awareness** with memory integration
- **RAG integration** for document-based responses
- **Export functionality** for chat history

### Memory Systems
- **Short-term memory**: Session-based context retention
- **Long-term memory**: Persistent storage with importance scoring
- **Entity extraction**: Automatic identification of names, dates, etc.
- **Sentiment analysis**: Emotional tone detection

### RAG (Retrieval-Augmented Generation)
- **Document upload**: Support for PDF, DOCX, TXT, MD, JSON
- **Text input**: Direct text content addition
- **Semantic search**: Vector-based document search
- **Source citation**: Automatic source attribution

### MCP (Model Context Protocol)
- **Tool integration**: Connect external tools and services
- **Resource access**: Access external data sources
- **Real-time discovery**: Dynamic tool discovery
- **Usage monitoring**: Comprehensive logging

### Analytics & Monitoring
- **System health**: Real-time status monitoring
- **Performance metrics**: Detailed usage statistics
- **Session tracking**: User session management
- **Export capabilities**: Data export functionality

## Configuration Options

### Environment Variables

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Memory Configuration
SHORT_TERM_MEMORY_SIZE=10
LONG_TERM_MEMORY_THRESHOLD=5

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# MCP Configuration (Optional)
MCP_SERVER_URL=ws://localhost:3000
MCP_ENABLED=true
```

### Memory System Tuning
- `SHORT_TERM_MEMORY_SIZE`: Number of messages to keep in session memory
- `LONG_TERM_MEMORY_THRESHOLD`: Importance score threshold for long-term storage

### RAG System Tuning
- `CHUNK_SIZE`: Size of document chunks for processing
- `CHUNK_OVERLAP`: Overlap between chunks for better context

## Troubleshooting

### Common Issues

1. **"OpenAI API key not found"**
   - Make sure you've added your API key to the `.env` file
   - Verify the key starts with `sk-`

2. **"Failed to install dependencies"**
   - Make sure you have Node.js 18+ installed
   - Try deleting `node_modules` and running `npm install` again

3. **"Port 3001 already in use"**
   - Change the `PORT` in your `.env` file
   - Or stop any other services using port 3001

4. **"WebSocket connection failed"**
   - This is normal if you're not using MCP
   - Set `MCP_ENABLED=false` in `.env` to disable MCP

5. **"RAG search returns no results"**
   - Make sure you've uploaded documents first
   - Try different search queries
   - Check that documents were processed successfully

### Getting Help

1. Check the browser console for error messages
2. Check the server logs in your terminal
3. Verify all environment variables are set correctly
4. Make sure all required services are running

## Next Steps

1. **Upload your own documents** to test RAG with your content
2. **Set up an MCP server** to test tool integration
3. **Experiment with different prompts** to test memory systems
4. **Monitor the analytics** to understand system behavior
5. **Customize the configuration** for your use case

## Development

If you want to modify or extend the application:

1. **Backend code** is in `backend/src/`
2. **Frontend code** is in `frontend/`
3. **API documentation** is in the main README
4. **Sample documents** are in `docs/`

The application is built with:
- **Backend**: Node.js, Express, LangChain, SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: OpenAI GPT-4 and embeddings
- **Database**: SQLite for persistence
- **Communication**: WebSocket for real-time chat

Happy testing! 🚀
