#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fetch from 'node-fetch';

// Create MCP server
const server = new Server(
  {
    name: 'weather-utils',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Add tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a city (uses free weather API)',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name'
            }
          },
          required: ['city']
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
        name: 'encode_base64',
        description: 'Encode text to base64',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to encode'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'decode_base64',
        description: 'Decode base64 to text',
        inputSchema: {
          type: 'object',
          properties: {
            encoded: {
              type: 'string',
              description: 'Base64 encoded text'
            }
          },
          required: ['encoded']
        }
      },
      {
        name: 'hash_text',
        description: 'Generate SHA-256 hash of text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to hash'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'random_number',
        description: 'Generate a random number within a range',
        inputSchema: {
          type: 'object',
          properties: {
            min: {
              type: 'number',
              description: 'Minimum value',
              default: 0
            },
            max: {
              type: 'number',
              description: 'Maximum value',
              default: 100
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'get_weather':
        try {
          // Using a free weather API (OpenWeatherMap-like format)
          // Note: This is a mock response since we don't have API keys
          const mockWeatherData = {
            city: args.city,
            temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
            condition: ['sunny', 'cloudy', 'rainy', 'partly cloudy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
            windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
          };
          
          return {
            content: [
              {
                type: 'text',
                text: `Weather in ${mockWeatherData.city}:
🌡️ Temperature: ${mockWeatherData.temperature}°C
☁️ Condition: ${mockWeatherData.condition}
💧 Humidity: ${mockWeatherData.humidity}%
💨 Wind Speed: ${mockWeatherData.windSpeed} km/h

Note: This is mock weather data for demonstration purposes.`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching weather data: ${error.message}`
              }
            ]
          };
        }
      
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
      
      case 'encode_base64':
        const encoded = Buffer.from(args.text, 'utf8').toString('base64');
        return {
          content: [
            {
              type: 'text',
              text: `Base64 encoded: ${encoded}`
            }
          ]
        };
      
      case 'decode_base64':
        try {
          const decoded = Buffer.from(args.encoded, 'base64').toString('utf8');
          return {
            content: [
              {
                type: 'text',
                text: `Decoded text: ${decoded}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error decoding base64: Invalid base64 string`
              }
            ]
          };
        }
      
      case 'hash_text':
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(args.text).digest('hex');
        return {
          content: [
            {
              type: 'text',
              text: `SHA-256 hash: ${hash}`
            }
          ]
        };
      
      case 'random_number':
        const min = args.min || 0;
        const max = args.max || 100;
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        return {
          content: [
            {
              type: 'text',
              text: `Random number between ${min} and ${max}: ${randomNum}`
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
  console.error('Weather Utils MCP Server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
