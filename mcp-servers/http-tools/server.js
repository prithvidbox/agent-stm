#!/usr/bin/env node

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Available tools
const tools = [
  {
    name: 'echo',
    description: 'Echo back the input text',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to echo back'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'add_numbers',
    description: 'Add two numbers together',
    inputSchema: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' }
      },
      required: ['a', 'b']
    }
  },
  {
    name: 'get_time',
    description: 'Get the current time',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'reverse_text',
    description: 'Reverse the input text',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to reverse' }
      },
      required: ['text']
    }
  },
  {
    name: 'generate_uuid',
    description: 'Generate a random UUID',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'hash_text',
    description: 'Generate SHA-256 hash of text',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to hash' }
      },
      required: ['text']
    }
  }
];

// MCP-style endpoints
app.get('/tools/list', (req, res) => {
  res.json({
    success: true,
    tools: tools
  });
});

app.post('/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body;
  
  try {
    let result;
    
    switch (name) {
      case 'echo':
        result = `Echo: ${args.text}`;
        break;
        
      case 'add_numbers':
        const sum = args.a + args.b;
        result = `${args.a} + ${args.b} = ${sum}`;
        break;
        
      case 'get_time':
        const now = new Date();
        result = `Current time: ${now.toISOString()}`;
        break;
        
      case 'reverse_text':
        const reversed = args.text.split('').reverse().join('');
        result = `Reversed: ${reversed}`;
        break;
        
      case 'generate_uuid':
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        result = `Generated UUID: ${uuid}`;
        break;
        
      case 'hash_text':
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(args.text).digest('hex');
        result = `SHA-256 hash: ${hash}`;
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    res.json({
      success: true,
      result: result,
      toolName: name,
      executionTime: Date.now()
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      toolName: name
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    server: 'HTTP Tools MCP Server',
    version: '1.0.0',
    availableTools: tools.length,
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔧 HTTP Tools MCP Server running on http://localhost:${PORT}`);
  console.log(`📋 Available tools: ${tools.map(t => t.name).join(', ')}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Tools list: http://localhost:${PORT}/tools/list`);
});
