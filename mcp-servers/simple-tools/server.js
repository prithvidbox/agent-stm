#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Create MCP server
const server = new Server(
  {
    name: 'simple-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
            a: {
              type: 'number',
              description: 'First number'
            },
            b: {
              type: 'number',
              description: 'Second number'
            }
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
            text: {
              type: 'string',
              description: 'Text to reverse'
            }
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
        description: 'Generate a hash of the input text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to hash'
            },
            algorithm: {
              type: 'string',
              description: 'Hash algorithm (md5, sha1, sha256)',
              default: 'sha256'
            }
          },
          required: ['text']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'echo':
        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${args.text}`
            }
          ]
        };
      
      case 'add_numbers':
        const sum = args.a + args.b;
        return {
          content: [
            {
              type: 'text',
              text: `${args.a} + ${args.b} = ${sum}`
            }
          ]
        };
      
      case 'get_time':
        const now = new Date();
        return {
          content: [
            {
              type: 'text',
              text: `Current time: ${now.toISOString()}`
            }
          ]
        };
      
      case 'reverse_text':
        const reversed = args.text.split('').reverse().join('');
        return {
          content: [
            {
              type: 'text',
              text: `Reversed: ${reversed}`
            }
          ]
        };
      
      case 'generate_uuid':
        // Simple UUID v4 generator
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        return {
          content: [
            {
              type: 'text',
              text: `Generated UUID: ${uuid}`
            }
          ]
        };
      
      case 'hash_text':
        // Simple hash function (for demo purposes)
        const algorithm = args.algorithm || 'sha256';
        let hash = 0;
        const text = args.text;
        for (let i = 0; i < text.length; i++) {
          const char = text.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return {
          content: [
            {
              type: 'text',
              text: `${algorithm.toUpperCase()} hash of "${text}": ${Math.abs(hash).toString(16)}`
            }
          ]
        };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Simple Tools MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
