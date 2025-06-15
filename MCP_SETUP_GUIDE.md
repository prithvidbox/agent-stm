# MCP Server Setup Guide

## Overview

This guide shows you how to add and configure MCP (Model Context Protocol) servers for your chatbot playground. MCP servers provide tools and resources that extend your chatbot's capabilities.

## Available MCP Servers

### 1. Simple Tools Server ✅
**Location:** `mcp-servers/simple-tools/`
**Tools:**
- `echo` - Echo back text
- `add_numbers` - Add two numbers
- `get_time` - Get current time
- `reverse_text` - Reverse text

### 2. Weather Utils Server ✅
**Location:** `mcp-servers/weather-utils/`
**Tools:**
- `get_weather` - Get weather for a city (mock data)
- `generate_uuid` - Generate random UUID
- `encode_base64` - Encode text to base64
- `decode_base64` - Decode base64 to text
- `hash_text` - Generate SHA-256 hash
- `random_number` - Generate random number in range

## How to Enable MCP Servers

### Step 1: Update Backend Configuration

Edit `backend/.env` and enable MCP:

```env
# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_TYPE=stdio
```

### Step 2: Configure Multiple MCP Servers

Update the backend to support multiple MCP servers. Edit `backend/src/mcp/MCPClient.js` to support multiple servers:

```javascript
// Add this to the constructor
this.servers = new Map(); // serverName -> client instance

// Add method to connect multiple servers
async initializeMultipleServers() {
  const serverConfigs = [
    {
      name: 'simple-tools',
      path: '../mcp-servers/simple-tools/server.js'
    },
    {
      name: 'weather-utils', 
      path: '../mcp-servers/weather-utils/server.js'
    }
  ];

  for (const config of serverConfigs) {
    try {
      const client = new MCPClient();
      client.serverPath = `stdio://${config.path}`;
      await client.connect();
      this.servers.set(config.name, client);
      console.log(`✅ Connected to MCP server: ${config.name}`);
    } catch (error) {
      console.error(`Failed to connect to ${config.name}:`, error);
    }
  }
}
```

### Step 3: Test MCP Server Individually

Test each server works independently:

```bash
# Test simple-tools server
cd chatbot-playground/mcp-servers/simple-tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node server.js

# Test weather-utils server  
cd chatbot-playground/mcp-servers/weather-utils
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node server.js
```

## Creating Your Own MCP Server

### Step 1: Create Server Directory

```bash
mkdir chatbot-playground/mcp-servers/my-custom-server
cd chatbot-playground/mcp-servers/my-custom-server
```

### Step 2: Create package.json

```json
{
  "name": "my-custom-mcp-server",
  "version": "1.0.0",
  "description": "My custom MCP server",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

### Step 3: Create server.js

```javascript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define your tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'my_tool',
        description: 'Description of what my tool does',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input parameter description'
            }
          },
          required: ['input']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'my_tool':
      return {
        content: [
          {
            type: 'text',
            text: `Tool result: ${args.input}`
          }
        ]
      };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('My Custom MCP Server running');
}

main().catch(console.error);
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Test Your Server

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node server.js
```

## Popular MCP Server Examples

### 1. File System Server

```javascript
// Tools: read_file, write_file, list_directory, delete_file
{
  name: 'read_file',
  description: 'Read contents of a file',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' }
    },
    required: ['path']
  }
}
```

### 2. Database Server

```javascript
// Tools: query_database, insert_record, update_record, delete_record
{
  name: 'query_database',
  description: 'Execute SQL query',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'SQL query' },
      params: { type: 'array', description: 'Query parameters' }
    },
    required: ['query']
  }
}
```

### 3. Web Scraping Server

```javascript
// Tools: scrape_url, extract_links, get_page_title, download_image
{
  name: 'scrape_url',
  description: 'Scrape content from a URL',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to scrape' },
      selector: { type: 'string', description: 'CSS selector (optional)' }
    },
    required: ['url']
  }
}
```

### 4. Email Server

```javascript
// Tools: send_email, check_inbox, mark_read, delete_email
{
  name: 'send_email',
  description: 'Send an email',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body' }
    },
    required: ['to', 'subject', 'body']
  }
}
```

### 5. Calendar Server

```javascript
// Tools: create_event, list_events, update_event, delete_event
{
  name: 'create_event',
  description: 'Create a calendar event',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Event title' },
      start: { type: 'string', description: 'Start time (ISO 8601)' },
      end: { type: 'string', description: 'End time (ISO 8601)' },
      description: { type: 'string', description: 'Event description' }
    },
    required: ['title', 'start', 'end']
  }
}
```

## Advanced MCP Features

### Resources

MCP servers can also provide resources (read-only data):

```javascript
server.setRequestHandler('resources/list', async () => {
  return {
    resources: [
      {
        uri: 'file://config.json',
        name: 'Configuration',
        description: 'Server configuration',
        mimeType: 'application/json'
      }
    ]
  };
});

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;
  
  if (uri === 'file://config.json') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ setting: 'value' }, null, 2)
        }
      ]
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});
```

### Prompts

MCP servers can provide reusable prompts:

```javascript
server.setRequestHandler('prompts/list', async () => {
  return {
    prompts: [
      {
        name: 'summarize',
        description: 'Summarize text',
        arguments: [
          {
            name: 'text',
            description: 'Text to summarize',
            required: true
          }
        ]
      }
    ]
  };
});

server.setRequestHandler('prompts/get', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'summarize') {
    return {
      description: 'Summarize the following text',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please summarize this text: ${args.text}`
          }
        }
      ]
    };
  }
  
  throw new Error(`Unknown prompt: ${name}`);
});
```

## Troubleshooting

### Common Issues

1. **Server won't start**: Check Node.js version and dependencies
2. **Tools not appearing**: Verify `tools/list` handler is correct
3. **Tool calls failing**: Check `tools/call` handler and parameter validation
4. **Connection issues**: Ensure stdio transport is working

### Debug Mode

Add debug logging to your server:

```javascript
server.setRequestHandler('tools/call', async (request) => {
  console.error(`DEBUG: Tool call - ${request.params.name}`, request.params.arguments);
  // ... rest of handler
});
```

### Testing Tools

Test individual tools:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"text":"hello"}}}' | node server.js
```

## Integration with Chatbot

Once your MCP servers are working, the chatbot can use them by:

1. **Automatic Tool Discovery**: The chatbot discovers available tools
2. **Natural Language Processing**: User requests are mapped to appropriate tools
3. **Parameter Extraction**: The chatbot extracts parameters from user input
4. **Tool Execution**: Tools are called with extracted parameters
5. **Response Integration**: Tool results are integrated into conversation

### Example Usage

```
User: "What's the weather in New York?"
Bot: [Uses get_weather tool] "The weather in New York is sunny, 25°C..."

User: "Generate a UUID for me"
Bot: [Uses generate_uuid tool] "Here's a UUID: 123e4567-e89b-12d3-a456-426614174000"

User: "Encode 'hello world' to base64"
Bot: [Uses encode_base64 tool] "Base64 encoded: aGVsbG8gd29ybGQ="
```

## Next Steps

1. **Enable MCP**: Set `MCP_ENABLED=true` in backend/.env
2. **Test Servers**: Verify both servers work independently
3. **Update Backend**: Modify MCPClient to support multiple servers
4. **Add More Servers**: Create custom servers for your specific needs
5. **Monitor Usage**: Add logging to track tool usage and performance

The MCP system provides powerful extensibility for your chatbot, allowing you to add any functionality through custom tools and resources.
