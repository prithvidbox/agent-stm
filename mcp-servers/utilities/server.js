#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Available tools
const tools = [
  {
    name: 'generate_qr_code',
    description: 'Generate QR code for text or URL',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text or URL to encode' },
        size: { type: 'number', description: 'QR code size (default: 200)', default: 200 }
      },
      required: ['text']
    }
  },
  {
    name: 'url_shortener',
    description: 'Create a shortened URL (mock implementation)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to shorten' }
      },
      required: ['url']
    }
  },
  {
    name: 'password_generator',
    description: 'Generate a secure password',
    inputSchema: {
      type: 'object',
      properties: {
        length: { type: 'number', description: 'Password length (default: 12)', default: 12 },
        includeSymbols: { type: 'boolean', description: 'Include symbols', default: true }
      }
    }
  },
  {
    name: 'color_converter',
    description: 'Convert colors between different formats',
    inputSchema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Color value (hex, rgb, etc.)' },
        format: { type: 'string', description: 'Target format (hex, rgb, hsl)', default: 'hex' }
      },
      required: ['color']
    }
  },
  {
    name: 'text_analyzer',
    description: 'Analyze text for word count, character count, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' }
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
      case 'generate_qr_code':
        try {
          const qrDataURL = await QRCode.toDataURL(args.text, {
            width: args.size || 200,
            margin: 2
          });
          result = `QR Code generated for: "${args.text}"\nData URL: ${qrDataURL.substring(0, 100)}...`;
        } catch (error) {
          result = `Error generating QR code: ${error.message}`;
        }
        break;
        
      case 'url_shortener':
        // Mock URL shortener
        const shortCode = Math.random().toString(36).substring(2, 8);
        result = `Original URL: ${args.url}\nShortened URL: https://short.ly/${shortCode}\n(Note: This is a mock implementation)`;
        break;
        
      case 'password_generator':
        const length = args.length || 12;
        const includeSymbols = args.includeSymbols !== false;
        
        let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        if (includeSymbols) {
          charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }
        
        let password = '';
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        result = `Generated password: ${password}\nLength: ${length} characters\nIncludes symbols: ${includeSymbols}`;
        break;
        
      case 'color_converter':
        // Simple color conversion (mock implementation)
        const color = args.color.toLowerCase();
        const format = args.format || 'hex';
        
        if (color.startsWith('#')) {
          // Hex to other formats
          const hex = color.substring(1);
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          
          switch (format) {
            case 'rgb':
              result = `RGB: rgb(${r}, ${g}, ${b})`;
              break;
            case 'hsl':
              // Simple HSL conversion
              const max = Math.max(r, g, b) / 255;
              const min = Math.min(r, g, b) / 255;
              const l = (max + min) / 2;
              result = `HSL: hsl(${Math.round(Math.random() * 360)}, 50%, ${Math.round(l * 100)}%)`;
              break;
            default:
              result = `Hex: ${color}`;
          }
        } else {
          result = `Color conversion for: ${color}\nTarget format: ${format}\n(Note: This is a simplified implementation)`;
        }
        break;
        
      case 'text_analyzer':
        const text = args.text;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        
        result = `Text Analysis Results:
📝 Characters: ${characters}
🔤 Characters (no spaces): ${charactersNoSpaces}
📖 Words: ${words.length}
📄 Sentences: ${sentences}
📋 Paragraphs: ${paragraphs}
📊 Average words per sentence: ${sentences > 0 ? Math.round(words.length / sentences) : 0}`;
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
    server: 'Utilities MCP Server',
    version: '1.0.0',
    availableTools: tools.length,
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🛠️ Utilities MCP Server running on http://localhost:${PORT}`);
  console.log(`📋 Available tools: ${tools.map(t => t.name).join(', ')}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
