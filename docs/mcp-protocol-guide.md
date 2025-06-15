# Model Context Protocol (MCP) - Complete Guide

## Introduction to MCP

The Model Context Protocol (MCP) is an open protocol that enables secure connections between host applications (like Claude Desktop, IDEs, or other AI tools) and external data sources and tools. MCP allows AI assistants to access real-time information and perform actions on behalf of users while maintaining security and user control.

## Core Concepts

### Architecture Overview

MCP follows a client-server architecture where:
- **MCP Host**: The application using an AI model (e.g., Claude Desktop)
- **MCP Client**: The component within the host that implements the MCP protocol
- **MCP Server**: External applications that provide resources and tools via MCP

### Key Components

#### 1. Resources
Resources represent data that can be read by the AI model:
- Files and documents
- Database records
- API responses
- Live data feeds
- Configuration settings

#### 2. Tools
Tools are functions that the AI can invoke to perform actions:
- File operations (read, write, delete)
- API calls to external services
- Database queries and updates
- System commands
- Custom business logic

#### 3. Prompts
Prompts are reusable templates that can be invoked by name:
- System prompts for specific contexts
- User interaction templates
- Workflow automation prompts

## Protocol Specification

### Transport Layer

MCP supports multiple transport mechanisms:

#### 1. Standard I/O (stdio)
```json
{
  "command": "node",
  "args": ["path/to/mcp-server.js"],
  "env": {
    "API_KEY": "your-api-key"
  }
}
```

#### 2. Server-Sent Events (SSE)
```json
{
  "url": "http://localhost:3000/sse",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

#### 3. WebSocket
```json
{
  "url": "ws://localhost:3000/ws",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

### Message Format

All MCP messages follow JSON-RPC 2.0 specification:

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "method_name",
  "params": {
    "parameter1": "value1",
    "parameter2": "value2"
  }
}
```

### Core Methods

#### Initialize
Establishes connection and exchanges capabilities:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "resources": {},
      "tools": {},
      "prompts": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  }
}
```

#### List Resources
Retrieves available resources:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/list",
  "params": {}
}
```

#### Read Resource
Accesses specific resource content:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "file:///path/to/document.txt"
  }
}
```

#### List Tools
Gets available tools:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/list",
  "params": {}
}
```

#### Call Tool
Invokes a specific tool:

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "search_database",
    "arguments": {
      "query": "SELECT * FROM users WHERE active = true",
      "limit": 10
    }
  }
}
```

## Implementation Examples

### Basic MCP Server (Node.js)

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'example-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define a resource
server.setRequestHandler('resources/list', async () => {
  return {
    resources: [
      {
        uri: 'file:///example.txt',
        name: 'Example Document',
        description: 'A sample text document',
        mimeType: 'text/plain'
      }
    ]
  };
});

// Define a tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'echo',
        description: 'Echo back the input',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to echo'
            }
          },
          required: ['message']
        }
      }
    ]
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'echo') {
    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${args.message}`
        }
      ]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python MCP Server

```python
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent

app = Server("example-server")

@app.list_resources()
async def list_resources() -> list[Resource]:
    return [
        Resource(
            uri="file:///example.txt",
            name="Example Document",
            description="A sample text document",
            mimeType="text/plain"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "file:///example.txt":
        return "This is example content from the MCP server."
    raise ValueError(f"Unknown resource: {uri}")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="calculate",
            description="Perform basic calculations",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate"
                    }
                },
                "required": ["expression"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "calculate":
        try:
            result = eval(arguments["expression"])
            return [TextContent(type="text", text=f"Result: {result}")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as streams:
        await app.run(*streams)

if __name__ == "__main__":
    asyncio.run(main())
```

## Security Considerations

### Authentication and Authorization
- Use secure transport mechanisms (HTTPS, WSS)
- Implement proper authentication tokens
- Validate all input parameters
- Implement rate limiting

### Data Privacy
- Encrypt sensitive data in transit
- Implement access controls
- Log security events
- Regular security audits

### Best Practices
1. **Principle of Least Privilege**: Grant minimal necessary permissions
2. **Input Validation**: Sanitize all inputs
3. **Error Handling**: Don't expose sensitive information in errors
4. **Monitoring**: Log all operations for audit trails

## Common Use Cases

### 1. Database Integration
Connect AI assistants to databases for querying and updating data:

```javascript
// Tool for database queries
{
  name: 'query_database',
  description: 'Execute SQL queries on the database',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      parameters: { type: 'array' }
    }
  }
}
```

### 2. File System Access
Provide controlled access to files and directories:

```javascript
// Resource for file access
{
  uri: 'file:///project/docs/',
  name: 'Project Documentation',
  description: 'Access to project documentation files'
}
```

### 3. API Integration
Connect to external APIs and services:

```javascript
// Tool for API calls
{
  name: 'call_api',
  description: 'Make HTTP requests to external APIs',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      method: { type: 'string' },
      headers: { type: 'object' },
      body: { type: 'string' }
    }
  }
}
```

### 4. Real-time Data
Access live data feeds and streaming information:

```javascript
// Resource for live data
{
  uri: 'stream://market-data',
  name: 'Market Data Feed',
  description: 'Real-time financial market data'
}
```

## Troubleshooting

### Common Issues

#### Connection Problems
- Verify transport configuration
- Check network connectivity
- Validate authentication credentials
- Review firewall settings

#### Protocol Errors
- Ensure JSON-RPC 2.0 compliance
- Validate message format
- Check method names and parameters
- Review error responses

#### Performance Issues
- Implement caching strategies
- Optimize resource queries
- Use pagination for large datasets
- Monitor resource usage

### Debugging Tips
1. Enable verbose logging
2. Use protocol analyzers
3. Test with minimal examples
4. Validate against specification

## Future Developments

### Planned Features
- Enhanced security mechanisms
- Improved error handling
- Better debugging tools
- Performance optimizations

### Community Contributions
- Open source implementations
- Protocol extensions
- Best practice guides
- Integration examples

## Conclusion

The Model Context Protocol provides a powerful and secure way to extend AI capabilities by connecting to external data sources and tools. By following the protocol specification and security best practices, developers can create robust integrations that enhance AI assistant functionality while maintaining user control and data security.

For the latest updates and community resources, visit the official MCP documentation and GitHub repositories.
