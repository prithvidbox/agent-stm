# REST API Documentation

## Overview

This document provides comprehensive documentation for the Chatbot Playground REST API. The API follows RESTful principles and provides endpoints for managing chat sessions, memory systems, RAG (Retrieval-Augmented Generation), and MCP (Model Context Protocol) integrations.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication for development purposes. In production, implement proper authentication mechanisms such as:

- JWT tokens
- API keys
- OAuth 2.0
- Session-based authentication

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid request parameters |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource already exists |
| 422  | Unprocessable Entity - Validation errors |
| 500  | Internal Server Error - Server error |

## Endpoints

### Chat Management

#### Send Message
Send a message to the chatbot and receive a response.

**Endpoint:** `POST /chat/message`

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "sessionId": "session-123",
  "userId": "user-456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing well, thank you for asking. How can I help you today?",
    "sessionId": "session-123",
    "messageId": "msg-789",
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
      "responseTime": 1250,
      "tokensUsed": 45,
      "model": "gpt-4"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid message format
- `422` - Message validation failed
- `500` - AI service unavailable

#### Get Chat History
Retrieve chat history for a specific session.

**Endpoint:** `GET /chat/history/{sessionId}`

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)
- `order` (optional): Sort order - 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-789",
        "sessionId": "session-123",
        "userId": "user-456",
        "message": "Hello, how are you?",
        "response": "Hello! I'm doing well, thank you for asking.",
        "timestamp": "2024-01-15T10:30:00Z",
        "metadata": {
          "responseTime": 1250,
          "tokensUsed": 45
        }
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### Export Chat History
Export chat history in various formats.

**Endpoint:** `GET /chat/export/{sessionId}`

**Query Parameters:**
- `format`: Export format - 'json', 'csv', 'txt' (required)
- `includeMetadata` (optional): Include metadata in export (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/downloads/chat-export-session-123.json",
    "expiresAt": "2024-01-15T11:30:00Z",
    "format": "json",
    "size": 15420
  }
}
```

### Memory Management

#### Get Short-term Memory
Retrieve current short-term memory for a session.

**Endpoint:** `GET /memory/short-term/{sessionId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "messages": [
      {
        "role": "user",
        "content": "My name is John and I work as a software engineer",
        "timestamp": "2024-01-15T10:25:00Z"
      },
      {
        "role": "assistant",
        "content": "Nice to meet you, John! It's great to connect with a fellow software engineer.",
        "timestamp": "2024-01-15T10:25:30Z"
      }
    ],
    "contextWindow": 10,
    "totalMessages": 2
  }
}
```

#### Get Long-term Memory
Retrieve long-term memory entries for a user.

**Endpoint:** `GET /memory/long-term/{userId}`

**Query Parameters:**
- `limit` (optional): Number of entries to retrieve (default: 20)
- `category` (optional): Filter by memory category
- `minImportance` (optional): Minimum importance score (0-10)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-456",
    "memories": [
      {
        "id": "mem-001",
        "content": "User mentioned they work as a software engineer at a tech startup",
        "category": "personal_info",
        "importance": 8,
        "entities": ["John", "software engineer", "tech startup"],
        "sentiment": "neutral",
        "createdAt": "2024-01-15T10:25:00Z",
        "lastAccessed": "2024-01-15T10:30:00Z",
        "accessCount": 3
      }
    ],
    "totalMemories": 15,
    "categories": ["personal_info", "preferences", "work_context"]
  }
}
```

#### Test Memory System
Run comprehensive tests on the memory system.

**Endpoint:** `POST /memory/test`

**Request Body:**
```json
{
  "testType": "comprehensive",
  "sessionId": "test-session",
  "userId": "test-user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testResults": {
      "shortTermMemory": {
        "status": "passed",
        "tests": 5,
        "passed": 5,
        "failed": 0,
        "duration": 150
      },
      "longTermMemory": {
        "status": "passed",
        "tests": 8,
        "passed": 8,
        "failed": 0,
        "duration": 320
      },
      "entityExtraction": {
        "status": "passed",
        "tests": 3,
        "passed": 3,
        "failed": 0,
        "duration": 80
      }
    },
    "overallStatus": "passed",
    "totalDuration": 550
  }
}
```

### RAG (Retrieval-Augmented Generation)

#### Upload Document
Upload a document to the RAG system for indexing.

**Endpoint:** `POST /rag/upload`

**Request:** Multipart form data
- `file`: Document file (PDF, DOCX, TXT, MD, JSON)
- `metadata` (optional): JSON string with document metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc-001",
    "filename": "company-handbook.pdf",
    "size": 2048576,
    "pages": 45,
    "chunks": 89,
    "processingTime": 3500,
    "metadata": {
      "title": "Company Employee Handbook",
      "author": "HR Department",
      "category": "policy"
    }
  }
}
```

#### Add Text Content
Add text content directly to the RAG system.

**Endpoint:** `POST /rag/add-text`

**Request Body:**
```json
{
  "content": "This is important information about our company policies...",
  "metadata": {
    "title": "Company Policies",
    "category": "policy",
    "source": "internal"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc-002",
    "chunks": 3,
    "processingTime": 250,
    "wordCount": 1250
  }
}
```

#### Search Documents
Search through indexed documents using semantic search.

**Endpoint:** `POST /rag/search`

**Request Body:**
```json
{
  "query": "What is the company vacation policy?",
  "limit": 5,
  "threshold": 0.7,
  "includeMetadata": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "What is the company vacation policy?",
    "results": [
      {
        "documentId": "doc-001",
        "chunkId": "chunk-045",
        "content": "Employees are entitled to 20 days of paid vacation per year...",
        "score": 0.92,
        "metadata": {
          "title": "Company Employee Handbook",
          "page": 12,
          "section": "Benefits"
        }
      }
    ],
    "totalResults": 3,
    "searchTime": 45
  }
}
```

#### List Documents
Get a list of all indexed documents.

**Endpoint:** `GET /rag/documents`

**Query Parameters:**
- `limit` (optional): Number of documents to retrieve (default: 20)
- `offset` (optional): Number of documents to skip (default: 0)
- `category` (optional): Filter by document category

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-001",
        "filename": "company-handbook.pdf",
        "title": "Company Employee Handbook",
        "category": "policy",
        "size": 2048576,
        "chunks": 89,
        "uploadedAt": "2024-01-15T09:00:00Z",
        "lastAccessed": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### Delete Document
Remove a document from the RAG system.

**Endpoint:** `DELETE /rag/documents/{documentId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc-001",
    "chunksRemoved": 89,
    "message": "Document successfully removed from RAG system"
  }
}
```

### MCP (Model Context Protocol)

#### Get MCP Status
Check the status of MCP connections and available tools.

**Endpoint:** `GET /mcp/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "serverUrl": "ws://localhost:3000",
    "connectionTime": "2024-01-15T09:00:00Z",
    "lastHeartbeat": "2024-01-15T10:29:45Z",
    "availableTools": [
      {
        "name": "search_database",
        "description": "Search the company database",
        "parameters": ["query", "limit"]
      },
      {
        "name": "send_email",
        "description": "Send email notifications",
        "parameters": ["to", "subject", "body"]
      }
    ],
    "availableResources": [
      {
        "uri": "file:///company/docs",
        "name": "Company Documentation",
        "description": "Access to company documentation"
      }
    ]
  }
}
```

#### List MCP Tools
Get detailed information about available MCP tools.

**Endpoint:** `GET /mcp/tools`

**Response:**
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "search_database",
        "description": "Search the company database for information",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query"
            },
            "limit": {
              "type": "integer",
              "description": "Maximum number of results",
              "default": 10
            }
          },
          "required": ["query"]
        },
        "lastUsed": "2024-01-15T10:15:00Z",
        "usageCount": 25
      }
    ],
    "totalTools": 5
  }
}
```

#### Call MCP Tool
Execute an MCP tool with specified parameters.

**Endpoint:** `POST /mcp/tools/{toolName}/call`

**Request Body:**
```json
{
  "arguments": {
    "query": "SELECT * FROM employees WHERE department = 'Engineering'",
    "limit": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "toolName": "search_database",
    "result": {
      "content": [
        {
          "type": "text",
          "text": "Found 8 employees in Engineering department:\n1. John Doe - Senior Developer\n2. Jane Smith - DevOps Engineer\n..."
        }
      ]
    },
    "executionTime": 150,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### List MCP Resources
Get available MCP resources.

**Endpoint:** `GET /mcp/resources`

**Response:**
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "uri": "file:///company/docs/handbook.pdf",
        "name": "Employee Handbook",
        "description": "Company employee handbook and policies",
        "mimeType": "application/pdf",
        "size": 2048576
      },
      {
        "uri": "database://employees",
        "name": "Employee Database",
        "description": "Company employee information database",
        "mimeType": "application/json"
      }
    ],
    "totalResources": 12
  }
}
```

#### Read MCP Resource
Access content from an MCP resource.

**Endpoint:** `GET /mcp/resources/read`

**Query Parameters:**
- `uri`: Resource URI (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "uri": "file:///company/docs/handbook.pdf",
    "content": "Employee Handbook\n\nTable of Contents\n1. Introduction\n2. Company Policies...",
    "mimeType": "text/plain",
    "size": 15420,
    "lastModified": "2024-01-10T14:30:00Z"
  }
}
```

### System Health

#### Health Check
Get overall system health status.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 3600,
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 5,
        "connections": 3
      },
      "openai": {
        "status": "healthy",
        "responseTime": 250,
        "lastRequest": "2024-01-15T10:29:45Z"
      },
      "mcp": {
        "status": "connected",
        "serverUrl": "ws://localhost:3000",
        "lastHeartbeat": "2024-01-15T10:29:50Z"
      },
      "memory": {
        "status": "healthy",
        "shortTermSessions": 5,
        "longTermEntries": 150
      },
      "rag": {
        "status": "healthy",
        "documentsIndexed": 15,
        "totalChunks": 450
      }
    }
  }
}
```

#### System Metrics
Get detailed system performance metrics.

**Endpoint:** `GET /metrics`

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 1250,
      "successful": 1200,
      "failed": 50,
      "averageResponseTime": 180
    },
    "chat": {
      "totalMessages": 500,
      "activeSessions": 12,
      "averageResponseTime": 1200
    },
    "memory": {
      "shortTermMemory": {
        "activeSessions": 12,
        "totalMessages": 500
      },
      "longTermMemory": {
        "totalEntries": 150,
        "averageImportance": 6.5
      }
    },
    "rag": {
      "totalDocuments": 15,
      "totalChunks": 450,
      "searchQueries": 75,
      "averageSearchTime": 45
    },
    "mcp": {
      "toolCalls": 25,
      "resourceAccesses": 40,
      "averageExecutionTime": 150
    }
  }
}
```

## Error Handling

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_REQUEST` | Request format is invalid | Check request body format |
| `MISSING_PARAMETER` | Required parameter is missing | Include all required parameters |
| `INVALID_PARAMETER` | Parameter value is invalid | Check parameter constraints |
| `SESSION_NOT_FOUND` | Chat session not found | Create new session or use valid session ID |
| `DOCUMENT_NOT_FOUND` | Document not found in RAG system | Check document ID or upload document |
| `MCP_CONNECTION_ERROR` | MCP server connection failed | Check MCP server status |
| `AI_SERVICE_ERROR` | OpenAI API error | Check API key and service status |
| `DATABASE_ERROR` | Database operation failed | Check database connection |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement rate limiting |

### Error Response Examples

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "message",
      "constraint": "Message cannot be empty",
      "value": ""
    }
  }
}
```

#### Service Unavailable
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "OpenAI API is currently unavailable",
    "details": {
      "service": "openai",
      "retryAfter": 30,
      "lastAttempt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Chat endpoints**: 60 requests per minute per session
- **RAG upload**: 10 uploads per hour per user
- **MCP tool calls**: 100 calls per hour per user
- **Search operations**: 200 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248600
```

## Webhooks

The API supports webhooks for real-time notifications:

### Chat Message Webhook
Triggered when a chat message is processed.

**Payload:**
```json
{
  "event": "chat.message.processed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "sessionId": "session-123",
    "messageId": "msg-789",
    "userId": "user-456",
    "responseTime": 1250
  }
}
```

### Document Processing Webhook
Triggered when a document is successfully processed by RAG.

**Payload:**
```json
{
  "event": "rag.document.processed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "documentId": "doc-001",
    "filename": "handbook.pdf",
    "chunks": 89,
    "processingTime": 3500
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const ChatbotAPI = require('./chatbot-api-client');

const client = new ChatbotAPI({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000
});

// Send a chat message
const response = await client.chat.sendMessage({
  message: 'Hello, how can you help me?',
  sessionId: 'my-session',
  userId: 'user-123'
});

console.log(response.data.response);
```

### Python
```python
import requests

class ChatbotAPI:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def send_message(self, message, session_id, user_id):
        response = requests.post(
            f"{self.base_url}/chat/message",
            json={
                "message": message,
                "sessionId": session_id,
                "userId": user_id
            }
        )
        return response.json()

# Usage
client = ChatbotAPI('http://localhost:3001/api')
result = client.send_message('Hello!', 'my-session', 'user-123')
print(result['data']['response'])
```

## Testing

### Unit Tests
Run API unit tests:
```bash
npm test
```

### Integration Tests
Run integration tests against running API:
```bash
npm run test:integration
```

### Load Testing
Use tools like Apache Bench or Artillery for load testing:
```bash
artillery run load-test-config.yml
```

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Chat management endpoints
- Memory system integration
- RAG document processing
- MCP tool integration
- Health monitoring endpoints

## Support

For API support and questions:
- Documentation: [API Docs](http://localhost:3001/docs)
- Issues: [GitHub Issues](https://github.com/example/chatbot-playground/issues)
- Email: support@example.com
