# Production Deployment Guide

This guide covers deploying the Chatbot Playground system in production with Redis for memory storage and ChromaDB for vector embeddings.

## 🏗️ Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React-like Interface)                           │
│  ├── WebSocket Client                                      │
│  ├── Admin Panel                                           │
│  └── Real-time Chat UI                                     │
├─────────────────────────────────────────────────────────────┤
│  Backend (Node.js + Express)                               │
│  ├── WebSocket Server                                      │
│  ├── REST API                                              │
│  ├── ChatbotEngine (LangChain + OpenAI)                   │
│  ├── RedisMemoryManager                                    │
│  ├── ChromaRAGSystem                                       │
│  └── MCPManager                                            │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure (Docker Containers)                        │
│  ├── Redis (Memory & Session Storage)                      │
│  ├── ChromaDB (Vector Embeddings)                         │
│  ├── PostgreSQL (Persistent Data)                         │
│  └── MCP Servers (Tools & Utilities)                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start (Production Mode)

### Prerequisites

- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **OpenAI API Key**

### 1. Clone and Setup

```bash
git clone <your-repo>
cd chatbot-playground

# Make production script executable
chmod +x start-production.sh

# Install dependencies
cd backend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy and edit production environment
cp backend/.env.example backend/.env.production

# Edit the file with your settings
nano backend/.env.production
```

**Required Environment Variables:**

```env
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_api_key

# Production Mode
NODE_ENV=production
USE_REDIS_MEMORY=true
USE_CHROMA_RAG=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ChromaDB Configuration
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=chatbot_documents

# Server Configuration
PORT=3001
```

### 3. Start Production System

```bash
# Start all services (Redis, ChromaDB, PostgreSQL, MCP servers, and main app)
./start-production.sh
```

This will:
- ✅ Start Docker containers (Redis, ChromaDB, PostgreSQL)
- ✅ Wait for services to be ready
- ✅ Start MCP servers
- ✅ Launch the main application
- ✅ Provide health checks

### 4. Access the System

- **Main Interface**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/admin.html
- **API Health**: http://localhost:3001/health
- **ChromaDB UI**: http://localhost:8000

## 🔧 Manual Production Setup

### 1. Start Infrastructure Services

```bash
# Start Docker services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Install Dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Start MCP Servers

```bash
# Terminal 1: HTTP Tools Server
cd mcp-servers/http-tools
node server.js

# Terminal 2: Utilities Server  
cd mcp-servers/utilities
node server.js
```

### 4. Start Main Application

```bash
cd backend
NODE_ENV=production npm start
```

## 📊 Production Features

### Redis Memory Management

- **Session Storage**: User sessions with TTL
- **Short-term Memory**: Recent conversation history
- **Caching**: Frequently accessed data
- **Analytics**: Memory usage statistics

### ChromaDB Vector Storage

- **Document Embeddings**: OpenAI text-embedding-ada-002
- **Semantic Search**: Vector similarity search
- **Persistent Storage**: Automatic data persistence
- **Collection Management**: Organized document collections

### MCP Tools Integration

- **11 Available Tools**: Math, text processing, utilities
- **Auto-detection**: Natural language tool triggering
- **Error Handling**: Graceful fallbacks
- **Usage Tracking**: Tool usage analytics

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Overall system health
curl http://localhost:3001/health

# Redis health
curl http://localhost:3001/api/system/memory/stats

# ChromaDB health  
curl http://localhost:8000/api/v1/heartbeat

# MCP tools status
curl http://localhost:3001/api/mcp/debug
```

### Service Status

```bash
# Check Docker services
docker-compose ps

# Check Redis
docker-compose exec redis redis-cli ping

# Check PostgreSQL
docker-compose exec postgres pg_isready -U chatbot_user -d chatbot_db

# Check logs
docker-compose logs redis
docker-compose logs chromadb
docker-compose logs postgres
```

## 🛠️ Configuration Options

### Memory Configuration

```env
# Redis Memory Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Memory Limits
SHORT_TERM_MEMORY_SIZE=50
LONG_TERM_MEMORY_THRESHOLD=5
```

### RAG Configuration

```env
# ChromaDB Settings
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=chatbot_documents

# Chunking Settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### MCP Configuration

```env
# MCP Settings
MCP_ENABLED=true
MCP_SERVER_URL=http://localhost:3002
```

## 🔒 Security Considerations

### Environment Variables

- Store sensitive data in `.env.production`
- Never commit API keys to version control
- Use strong passwords for databases
- Consider using Docker secrets for production

### Network Security

- Configure firewall rules
- Use HTTPS in production
- Implement rate limiting
- Add authentication if needed

### Data Protection

- Regular database backups
- Redis persistence configuration
- ChromaDB data backup
- Log rotation and retention

## 📈 Performance Optimization

### Redis Optimization

```env
# Redis Memory Policy
REDIS_MAXMEMORY=2gb
REDIS_MAXMEMORY_POLICY=allkeys-lru

# Persistence
REDIS_SAVE=900 1 300 10 60 10000
```

### ChromaDB Optimization

- Use appropriate embedding models
- Optimize chunk sizes for your use case
- Regular collection maintenance
- Monitor vector storage usage

### Application Optimization

- Enable Node.js clustering
- Use PM2 for process management
- Implement caching strategies
- Monitor memory usage

## 🚨 Troubleshooting

### Common Issues

**Redis Connection Failed**
```bash
# Check Redis status
docker-compose logs redis
docker-compose exec redis redis-cli ping
```

**ChromaDB Not Responding**
```bash
# Check ChromaDB status
curl http://localhost:8000/api/v1/heartbeat
docker-compose logs chromadb
```

**MCP Tools Not Working**
```bash
# Check MCP server logs
tail -f data/logs/http-tools.log
tail -f data/logs/utilities.log

# Test MCP endpoints
curl http://localhost:3002/tools/list
curl http://localhost:3003/tools/list
```

### Log Locations

- **Application Logs**: Console output
- **MCP Server Logs**: `data/logs/`
- **Docker Logs**: `docker-compose logs <service>`
- **Redis Logs**: `docker-compose logs redis`

## 🔄 Backup & Recovery

### Database Backup

```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U chatbot_user chatbot_db > backup.sql

# Redis backup
docker-compose exec redis redis-cli BGSAVE
```

### ChromaDB Backup

```bash
# Backup ChromaDB data
docker cp chatbot-chromadb:/chroma/chroma ./chromadb-backup
```

### Restore Procedures

```bash
# Restore PostgreSQL
docker-compose exec postgres psql -U chatbot_user chatbot_db < backup.sql

# Restore ChromaDB
docker cp ./chromadb-backup chatbot-chromadb:/chroma/chroma
```

## 📋 Maintenance Tasks

### Regular Maintenance

- Monitor disk usage
- Clean up old sessions
- Update dependencies
- Review security logs
- Performance monitoring

### Automated Tasks

```bash
# Cleanup script (run daily)
curl -X POST http://localhost:3001/api/system/cleanup

# Health check script (run every 5 minutes)
curl http://localhost:3001/health
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Docker services running
- [ ] Redis accessible and configured
- [ ] ChromaDB accessible and configured
- [ ] PostgreSQL accessible and configured
- [ ] MCP servers running
- [ ] Application starts without errors
- [ ] Health checks passing
- [ ] SSL/TLS configured (if applicable)
- [ ] Monitoring setup
- [ ] Backup procedures tested
- [ ] Security measures implemented

## 📞 Support

For production support:

1. Check the troubleshooting section
2. Review application logs
3. Test individual components
4. Check Docker service status
5. Verify environment configuration

## 🔗 Related Documentation

- [MCP Setup Guide](./MCP_SETUP_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [API Documentation](./docs/rest-api-documentation.md)
- [Admin Panel Guide](./frontend/admin.html)
