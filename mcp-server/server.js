#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create MCP server
const server = new Server(
  {
    name: 'chatbot-playground-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Base directory for file operations (chatbot-playground root)
const BASE_DIR = path.resolve(__dirname, '..');

// Helper function to resolve safe paths
function resolveSafePath(relativePath) {
  const resolved = path.resolve(BASE_DIR, relativePath);
  if (!resolved.startsWith(BASE_DIR)) {
    throw new Error('Path traversal not allowed');
  }
  return resolved;
}

// Helper function to format file size
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// List available resources
server.setRequestHandler({
  method: 'resources/list'
}, async () => {
  return {
    resources: [
      {
        uri: 'file://docs/',
        name: 'Documentation Directory',
        description: 'Access to all documentation files in the chatbot playground',
        mimeType: 'text/plain'
      },
      {
        uri: 'file://backend/src/',
        name: 'Backend Source Code',
        description: 'Access to backend source code files',
        mimeType: 'text/plain'
      },
      {
        uri: 'file://frontend/',
        name: 'Frontend Files',
        description: 'Access to frontend HTML, CSS, and JavaScript files',
        mimeType: 'text/plain'
      },
      {
        uri: 'config://project',
        name: 'Project Configuration',
        description: 'Project configuration and environment settings',
        mimeType: 'application/json'
      }
    ]
  };
});

// Read resource content
server.setRequestHandler({
  method: 'resources/read'
}, async (request) => {
  const { uri } = request.params;
  
  if (uri.startsWith('file://')) {
    const relativePath = uri.replace('file://', '');
    const fullPath = resolveSafePath(relativePath);
    
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        const files = await fs.readdir(fullPath);
        const fileList = files.map(file => `- ${file}`).join('\n');
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `Directory listing for ${relativePath}:\n\n${fileList}`
            }
          ]
        };
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: content
            }
          ]
        };
      }
    } catch (error) {
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  } else if (uri === 'config://project') {
    const config = {
      projectName: 'Chatbot Playground',
      version: '1.0.0',
      backend: {
        port: 3001,
        database: 'SQLite',
        features: ['Chat', 'Memory', 'RAG', 'MCP']
      },
      frontend: {
        framework: 'Vanilla JavaScript',
        features: ['Real-time Chat', 'Document Upload', 'Testing Interface']
      },
      documentation: {
        totalFiles: 6,
        topics: ['AI/ML', 'MCP Protocol', 'Software Development', 'API Documentation', 'Business Processes']
      }
    };
    
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(config, null, 2)
        }
      ]
    };
  }
  
  throw new Error(`Unsupported resource URI: ${uri}`);
});

// List available tools
server.setRequestHandler({
  method: 'tools/list'
}, async () => {
  return {
    tools: [
      {
        name: 'list_files',
        description: 'List files and directories in the chatbot playground project',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path from project root (default: ".")',
              default: '.'
            },
            recursive: {
              type: 'boolean',
              description: 'List files recursively',
              default: false
            },
            include_hidden: {
              type: 'boolean',
              description: 'Include hidden files and directories',
              default: false
            }
          }
        }
      },
      {
        name: 'read_file',
        description: 'Read the contents of a file in the chatbot playground project',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path to the file from project root'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'search_files',
        description: 'Search for text content across files in the project',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Text to search for'
            },
            path: {
              type: 'string',
              description: 'Directory to search in (default: ".")',
              default: '.'
            },
            file_pattern: {
              type: 'string',
              description: 'File pattern to match (e.g., "*.js", "*.md")',
              default: '*'
            },
            case_sensitive: {
              type: 'boolean',
              description: 'Case sensitive search',
              default: false
            }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_project',
        description: 'Analyze the chatbot playground project structure and provide insights',
        inputSchema: {
          type: 'object',
          properties: {
            analysis_type: {
              type: 'string',
              enum: ['overview', 'code_metrics', 'documentation', 'dependencies'],
              description: 'Type of analysis to perform',
              default: 'overview'
            }
          }
        }
      },
      {
        name: 'get_file_info',
        description: 'Get detailed information about a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path to the file or directory'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'calculate',
        description: 'Perform mathematical calculations',
        inputSchema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")'
            }
          },
          required: ['expression']
        }
      },
      {
        name: 'generate_report',
        description: 'Generate various reports about the chatbot playground',
        inputSchema: {
          type: 'object',
          properties: {
            report_type: {
              type: 'string',
              enum: ['project_summary', 'file_statistics', 'documentation_index', 'feature_list'],
              description: 'Type of report to generate'
            }
          },
          required: ['report_type']
        }
      }
    ]
  };
});

// Tool implementations
server.setRequestHandler({
  method: 'tools/call'
}, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'list_files': {
        const targetPath = resolveSafePath(args.path || '.');
        const recursive = args.recursive || false;
        const includeHidden = args.include_hidden || false;
        
        async function listDirectory(dirPath, currentDepth = 0) {
          const items = [];
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            if (!includeHidden && entry.name.startsWith('.')) continue;
            
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(BASE_DIR, fullPath);
            const stats = await fs.stat(fullPath);
            
            const item = {
              name: entry.name,
              path: relativePath,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: entry.isFile() ? formatFileSize(stats.size) : null,
              modified: stats.mtime.toISOString()
            };
            
            items.push(item);
            
            if (recursive && entry.isDirectory() && currentDepth < 3) {
              const subItems = await listDirectory(fullPath, currentDepth + 1);
              items.push(...subItems.map(subItem => ({
                ...subItem,
                name: `  ${'  '.repeat(currentDepth)}${subItem.name}`,
                path: subItem.path
              })));
            }
          }
          
          return items;
        }
        
        const items = await listDirectory(targetPath);
        const output = items.map(item => 
          `${item.type === 'directory' ? '📁' : '📄'} ${item.name} ${item.size ? `(${item.size})` : ''}`
        ).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `Files in ${args.path || '.'}:\n\n${output}\n\nTotal items: ${items.length}`
            }
          ]
        };
      }
      
      case 'read_file': {
        const filePath = resolveSafePath(args.path);
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        return {
          content: [
            {
              type: 'text',
              text: `File: ${args.path}\nSize: ${formatFileSize(stats.size)}\nModified: ${stats.mtime.toISOString()}\n\n--- Content ---\n${content}`
            }
          ]
        };
      }
      
      case 'search_files': {
        const searchPath = resolveSafePath(args.path || '.');
        const query = args.query;
        const filePattern = args.file_pattern || '*';
        const caseSensitive = args.case_sensitive || false;
        
        async function searchInDirectory(dirPath) {
          const results = [];
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(BASE_DIR, fullPath);
            
            if (entry.isDirectory()) {
              const subResults = await searchInDirectory(fullPath);
              results.push(...subResults);
            } else if (entry.isFile()) {
              // Simple pattern matching
              if (filePattern !== '*' && !entry.name.includes(filePattern.replace('*', ''))) {
                continue;
              }
              
              try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const searchText = caseSensitive ? content : content.toLowerCase();
                const searchQuery = caseSensitive ? query : query.toLowerCase();
                
                if (searchText.includes(searchQuery)) {
                  const lines = content.split('\n');
                  const matchingLines = lines
                    .map((line, index) => ({ line, number: index + 1 }))
                    .filter(({ line }) => {
                      const checkLine = caseSensitive ? line : line.toLowerCase();
                      return checkLine.includes(searchQuery);
                    })
                    .slice(0, 5); // Limit to first 5 matches per file
                  
                  results.push({
                    file: relativePath,
                    matches: matchingLines.length,
                    lines: matchingLines
                  });
                }
              } catch (error) {
                // Skip files that can't be read as text
              }
            }
          }
          
          return results;
        }
        
        const results = await searchInDirectory(searchPath);
        const output = results.map(result => {
          const lineOutput = result.lines.map(({ line, number }) => 
            `  ${number}: ${line.trim()}`
          ).join('\n');
          return `📄 ${result.file} (${result.matches} matches)\n${lineOutput}`;
        }).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `Search results for "${query}" in ${args.path || '.'}:\n\n${output || 'No matches found'}\n\nTotal files with matches: ${results.length}`
            }
          ]
        };
      }
      
      case 'analyze_project': {
        const analysisType = args.analysis_type || 'overview';
        
        async function countFiles(dirPath, extensions = {}) {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await countFiles(fullPath, extensions);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name);
              extensions[ext] = (extensions[ext] || 0) + 1;
            }
          }
          
          return extensions;
        }
        
        switch (analysisType) {
          case 'overview': {
            const extensions = await countFiles(BASE_DIR);
            const totalFiles = Object.values(extensions).reduce((sum, count) => sum + count, 0);
            
            const overview = `
# Chatbot Playground Project Analysis

## Project Structure
- **Total Files**: ${totalFiles}
- **File Types**: ${Object.keys(extensions).length}

## File Distribution
${Object.entries(extensions)
  .sort(([,a], [,b]) => b - a)
  .map(([ext, count]) => `- ${ext || 'no extension'}: ${count} files`)
  .join('\n')}

## Key Components
- 🤖 **Backend**: Node.js server with Express
- 🎨 **Frontend**: Vanilla HTML/CSS/JavaScript
- 📚 **Documentation**: Comprehensive guides and API docs
- 🔧 **MCP Integration**: Model Context Protocol support
- 🧠 **Memory System**: Short and long-term memory
- 📖 **RAG System**: Document retrieval and generation
            `.trim();
            
            return {
              content: [{ type: 'text', text: overview }]
            };
          }
          
          case 'documentation': {
            const docsPath = resolveSafePath('docs');
            const docFiles = await fs.readdir(docsPath);
            const docInfo = [];
            
            for (const file of docFiles) {
              if (file.endsWith('.md')) {
                const filePath = path.join(docsPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n').length;
                const words = content.split(/\s+/).length;
                
                docInfo.push({
                  file,
                  lines,
                  words,
                  size: formatFileSize((await fs.stat(filePath)).size)
                });
              }
            }
            
            const docReport = `
# Documentation Analysis

## Available Documents
${docInfo.map(doc => 
  `- **${doc.file}**: ${doc.lines} lines, ${doc.words} words, ${doc.size}`
).join('\n')}

## Total Documentation
- **Files**: ${docInfo.length}
- **Total Lines**: ${docInfo.reduce((sum, doc) => sum + doc.lines, 0)}
- **Total Words**: ${docInfo.reduce((sum, doc) => sum + doc.words, 0)}
            `.trim();
            
            return {
              content: [{ type: 'text', text: docReport }]
            };
          }
          
          default:
            return {
              content: [{ type: 'text', text: `Analysis type "${analysisType}" not implemented yet.` }]
            };
        }
      }
      
      case 'get_file_info': {
        const filePath = resolveSafePath(args.path);
        const stats = await fs.stat(filePath);
        
        const info = {
          path: args.path,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: formatFileSize(stats.size),
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString()
        };
        
        if (stats.isFile()) {
          const ext = path.extname(args.path);
          info.extension = ext;
          
          // Try to read first few lines for preview
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            info.lines = lines.length;
            info.preview = lines.slice(0, 5).join('\n');
          } catch (error) {
            info.preview = 'Binary file or unable to read';
          }
        }
        
        const output = `
File Information: ${args.path}

Type: ${info.type}
Size: ${info.size}
${info.lines ? `Lines: ${info.lines}` : ''}
Created: ${info.created}
Modified: ${info.modified}
Accessed: ${info.accessed}

${info.preview ? `Preview:\n${info.preview}` : ''}
        `.trim();
        
        return {
          content: [{ type: 'text', text: output }]
        };
      }
      
      case 'calculate': {
        try {
          // Simple math evaluation (be careful with eval in production!)
          const expression = args.expression.replace(/[^0-9+\-*/().\s]/g, '');
          const result = eval(expression);
          
          return {
            content: [
              {
                type: 'text',
                text: `Calculation: ${args.expression}\nResult: ${result}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error calculating "${args.expression}": ${error.message}`
              }
            ]
          };
        }
      }
      
      case 'generate_report': {
        const reportType = args.report_type;
        
        switch (reportType) {
          case 'project_summary': {
            const summary = `
# Chatbot Playground Project Summary

## Overview
A comprehensive chatbot testing environment with advanced features including memory systems, RAG (Retrieval-Augmented Generation), and MCP (Model Context Protocol) integration.

## Key Features
- 💬 **Real-time Chat**: WebSocket-based chat interface
- 🧠 **Memory Systems**: Short-term and long-term memory with entity extraction
- 📚 **RAG Integration**: Document upload, processing, and semantic search
- 🔧 **MCP Support**: Model Context Protocol for external tool integration
- 📊 **Analytics**: Performance monitoring and system health checks
- 🎨 **Modern UI**: Clean, responsive web interface

## Technology Stack
- **Backend**: Node.js, Express, SQLite, LangChain
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: OpenAI GPT-4, Embeddings
- **Protocols**: WebSocket, HTTP REST API, MCP

## Sample Data
- AI/ML comprehensive guide
- MCP protocol documentation
- Software development best practices
- REST API documentation
- Business process management guide

## Status
✅ Fully operational and ready for testing
            `.trim();
            
            return {
              content: [{ type: 'text', text: summary }]
            };
          }
          
          default:
            return {
              content: [{ type: 'text', text: `Report type "${reportType}" not implemented yet.` }]
            };
        }
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool "${name}": ${error.message}`
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
  console.error('Chatbot Playground MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
