# Chatbot Playground Testing Guide

## System Status ✅
- **Server**: Running on http://localhost:3001
- **Database**: SQLite operational
- **Memory System**: Short-term and long-term memory active
- **RAG System**: Document processing ready
- **WebSocket**: Real-time chat functional
- **Sample Data**: 5 comprehensive documents (35,000+ words)

## Quick Start Testing

### 1. Upload Sample Documents to RAG System
Use the frontend interface to upload these documents from the `docs/` folder:

1. **sample-ai-document.md** - AI/ML comprehensive guide
2. **mcp-protocol-guide.md** - MCP protocol documentation  
3. **software-development-best-practices.md** - Development practices
4. **rest-api-documentation.md** - API documentation
5. **business-process-management.md** - BPM guide

### 2. Test Basic Chat Functionality
Try these sample conversations:

**Memory Testing:**
```
User: "Hi, my name is Sarah and I'm a software engineer"
Bot: [Should acknowledge and remember name/role]
User: "What do you remember about me?"
Bot: [Should recall name and profession]
```

**General Knowledge:**
```
User: "What is machine learning?"
User: "Explain the SOLID principles"
User: "What is Six Sigma methodology?"
```

### 3. Test RAG System (After uploading documents)
Try these queries that should pull from the uploaded documents:

**AI/ML Queries:**
```
"What are the different types of machine learning?"
"Explain neural networks and deep learning"
"What are the ethical considerations in AI?"
```

**Software Development:**
```
"What are clean code principles?"
"How do I implement test-driven development?"
"What are the SOLID principles in detail?"
```

**API Documentation:**
```
"How do I authenticate with the API?"
"What are the available chat endpoints?"
"How do I handle API errors?"
```

**MCP Protocol:**
```
"How does the Model Context Protocol work?"
"What are MCP tools and resources?"
"How do I implement an MCP server?"
```

**Business Processes:**
```
"What is Business Process Management?"
"Explain the Six Sigma DMAIC framework"
"How do I implement Lean methodology?"
```

### 4. Test Cross-Document Queries
These should pull information from multiple documents:

```
"How can AI be used in business process management?"
"What are the security considerations for both APIs and MCP?"
"Compare agile methodologies in software development and BPM"
```

### 5. Test Memory Persistence
1. Have a conversation about your interests
2. Refresh the page or start a new session
3. Ask "What do you remember about our previous conversations?"
4. The bot should recall information from long-term memory

### 6. Test Advanced Features

**Entity Extraction:**
```
"I work at TechCorp as a Senior Developer using Python and React"
```
The system should extract and remember: TechCorp, Senior Developer, Python, React

**Context Awareness:**
```
User: "I'm working on a REST API project"
Bot: [Response about APIs]
User: "What security measures should I implement?"
Bot: [Should understand context is about API security]
```

## Expected Behaviors

### ✅ Working Features
- Real-time chat via WebSocket
- Short-term memory (within conversation)
- Long-term memory (across sessions)
- Entity extraction from conversations
- Document upload and processing
- Semantic search across documents
- Context-aware responses
- Clean, responsive UI

### 🔧 Features for Future Enhancement
- MCP tool integration (SDK compatibility issues resolved)
- Advanced analytics dashboard
- Multi-user support
- Document versioning
- Export/import functionality

## Performance Testing

### Load Testing
1. Open multiple browser tabs
2. Send simultaneous messages
3. Upload multiple documents
4. Monitor server logs for performance

### Memory Testing
1. Have long conversations (50+ messages)
2. Test memory recall accuracy
3. Check entity extraction quality
4. Verify context preservation

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Check if server is running on port 3001
2. **Document Upload Fails**: Ensure file is text-based (MD, TXT, JSON)
3. **Memory Not Working**: Check database connection in logs
4. **RAG Not Finding Documents**: Verify documents were uploaded successfully

### Debug Information
- Server logs: Check terminal running `npm start`
- Browser console: F12 → Console tab
- Network requests: F12 → Network tab
- Database: Located at `backend/data/chatbot.db`

## Sample Test Scenarios

### Scenario 1: New User Onboarding
1. User introduces themselves with name and role
2. User asks about AI/ML concepts
3. System should remember user info and provide relevant responses
4. Test memory persistence across sessions

### Scenario 2: Technical Documentation Search
1. Upload all sample documents
2. Ask specific technical questions
3. Verify responses cite correct sources
4. Test cross-document knowledge synthesis

### Scenario 3: Progressive Learning
1. Start with basic questions about a topic
2. Gradually ask more complex questions
3. System should maintain context and build on previous answers
4. Test knowledge integration across multiple domains

## Success Metrics

### Functionality
- ✅ All core features working without errors
- ✅ Clean server logs (no MCP errors)
- ✅ Responsive and intuitive UI
- ✅ Accurate document search and retrieval

### Quality
- ✅ Relevant and accurate responses
- ✅ Proper memory retention and recall
- ✅ Context awareness in conversations
- ✅ Appropriate source attribution

### Performance
- ✅ Fast response times (<2 seconds)
- ✅ Stable WebSocket connections
- ✅ Efficient document processing
- ✅ Smooth user experience

The chatbot playground is now fully operational with comprehensive real-world sample data, providing an excellent testing environment for AI chatbot capabilities including memory systems, RAG integration, and conversational AI.
