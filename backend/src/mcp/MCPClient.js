import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class MCPClient {
  constructor() {
    this.process = null;
    this.serverPath = process.env.MCP_SERVER_URL || 'stdio://./mcp-server/server.js';
    this.serverType = process.env.MCP_SERVER_TYPE || 'stdio';
    this.isConnected = false;
    this.pendingRequests = new Map(); // requestId -> { resolve, reject, timestamp }
    this.availableTools = new Map(); // toolName -> toolInfo
    this.availableResources = new Map(); // resourceUri -> resourceInfo
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.reconnectTimeout = null;
    this.messageBuffer = '';
  }

  async initialize() {
    console.log('Initializing MCP Client...');
    
    if (process.env.MCP_ENABLED !== 'true') {
      console.log('MCP Client disabled via environment variable');
      return;
    }
    
    try {
      await this.connect();
      console.log('✅ MCP Client initialized');
    } catch (error) {
      console.error('Failed to initialize MCP Client:', error);
      // Don't throw error - allow system to continue without MCP
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        if (this.serverType === 'stdio') {
          this.connectStdio(resolve, reject);
        } else {
          // Fallback to WebSocket for backward compatibility
          this.connectWebSocket(resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  connectStdio(resolve, reject) {
    try {
      // Extract server path from URL
      const serverPath = this.serverPath.replace('stdio://', '');
      const fullPath = path.resolve(process.cwd(), serverPath);
      
      console.log(`Connecting to MCP server via stdio: ${fullPath}`);
      
      // Spawn the MCP server process
      this.process = spawn('node', [fullPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      this.process.on('spawn', () => {
        console.log('✅ MCP server process spawned');
        this.isConnected = true;
        this.connectionRetries = 0;
        
        // Initialize connection with server
        this.initializeConnection().then(() => {
          resolve();
        }).catch(reject);
      });
      
      this.process.stdout.on('data', (data) => {
        this.handleStdioMessage(data);
      });
      
      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        if (!message.includes('MCP Server running')) {
          console.error('MCP server stderr:', message);
        }
      });
      
      this.process.on('close', (code, signal) => {
        console.log(`MCP server process closed: code=${code}, signal=${signal}`);
        this.isConnected = false;
        this.handleDisconnection();
      });
      
      this.process.on('error', (error) => {
        console.error('MCP server process error:', error);
        this.isConnected = false;
        
        if (this.connectionRetries === 0) {
          reject(error);
        }
      });
      
    } catch (error) {
      reject(error);
    }
  }

  connectWebSocket(resolve, reject) {
    // Fallback WebSocket implementation (simplified)
    console.log('WebSocket MCP connection not implemented in this version');
    reject(new Error('WebSocket MCP connection not supported'));
  }

  handleStdioMessage(data) {
    // Buffer incoming data as messages might be split
    this.messageBuffer += data.toString();
    
    // Process complete JSON messages
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing MCP message:', error, 'Raw line:', line);
        }
      }
    }
  }

  async initializeConnection() {
    try {
      // Send initialization message
      const initResponse = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'chatbot-playground',
          version: '1.0.0'
        }
      });
      
      console.log('MCP initialization successful');
      
      // List available tools
      await this.listTools();
      
      // List available resources
      await this.listResources();
      
    } catch (error) {
      console.error('Error initializing MCP connection:', error);
      throw error;
    }
  }

  async listTools() {
    try {
      const response = await this.sendRequest('tools/list', {});
      
      if (response.tools) {
        this.availableTools.clear();
        response.tools.forEach(tool => {
          this.availableTools.set(tool.name, tool);
        });
        console.log(`✅ Discovered ${response.tools.length} MCP tools:`, 
          response.tools.map(t => t.name).join(', '));
      }
      
      return response.tools || [];
    } catch (error) {
      console.error('Error listing MCP tools:', error);
      return [];
    }
  }

  async listResources() {
    try {
      const response = await this.sendRequest('resources/list', {});
      
      if (response.resources) {
        this.availableResources.clear();
        response.resources.forEach(resource => {
          this.availableResources.set(resource.uri, resource);
        });
        console.log(`✅ Discovered ${response.resources.length} MCP resources:`, 
          response.resources.map(r => r.uri).join(', '));
      }
      
      return response.resources || [];
    } catch (error) {
      console.error('Error listing MCP resources:', error);
      return [];
    }
  }

  async callTool(toolName, parameters = {}) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    
    if (!this.availableTools.has(toolName)) {
      throw new Error(`Tool '${toolName}' not available. Available tools: ${Array.from(this.availableTools.keys()).join(', ')}`);
    }
    
    try {
      const startTime = Date.now();
      
      const response = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: parameters
      });
      
      const executionTime = Date.now() - startTime;
      
      console.log(`🔧 MCP tool '${toolName}' executed in ${executionTime}ms`);
      
      return {
        success: true,
        result: response.content,
        executionTime,
        toolName,
        parameters
      };
      
    } catch (error) {
      console.error(`Error calling MCP tool '${toolName}':`, error);
      
      return {
        success: false,
        error: error.message,
        toolName,
        parameters
      };
    }
  }

  async readResource(resourceUri) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    
    if (!this.availableResources.has(resourceUri)) {
      throw new Error(`Resource '${resourceUri}' not available. Available resources: ${Array.from(this.availableResources.keys()).join(', ')}`);
    }
    
    try {
      const response = await this.sendRequest('resources/read', {
        uri: resourceUri
      });
      
      return {
        success: true,
        content: response.contents,
        uri: resourceUri
      };
      
    } catch (error) {
      console.error(`Error reading MCP resource '${resourceUri}':`, error);
      
      return {
        success: false,
        error: error.message,
        uri: resourceUri
      };
    }
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.process) {
        reject(new Error('MCP client not connected'));
        return;
      }
      
      const requestId = uuidv4();
      const message = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params
      };
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timestamp: Date.now(),
        method,
        params
      });
      
      // Send message via stdin
      const messageStr = JSON.stringify(message) + '\n';
      this.process.stdin.write(messageStr);
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`MCP request timeout for method: ${method}`));
        }
      }, 30000); // 30 second timeout
    });
  }

  handleMessage(message) {
    try {
      // Handle response to our request
      if (message.id && this.pendingRequests.has(message.id)) {
        const pendingRequest = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          pendingRequest.reject(new Error(message.error.message || 'MCP request failed'));
        } else {
          pendingRequest.resolve(message.result);
        }
        return;
      }
      
      // Handle notifications from server
      if (message.method) {
        this.handleNotification(message);
      }
      
    } catch (error) {
      console.error('Error handling MCP message:', error);
    }
  }

  handleNotification(message) {
    switch (message.method) {
      case 'notifications/tools/list_changed':
        console.log('MCP tools list changed, refreshing...');
        this.listTools();
        break;
        
      case 'notifications/resources/list_changed':
        console.log('MCP resources list changed, refreshing...');
        this.listResources();
        break;
        
      case 'notifications/resources/updated':
        console.log('MCP resource updated:', message.params?.uri);
        break;
        
      default:
        console.log('Unknown MCP notification:', message.method);
    }
  }

  handleDisconnection() {
    // Clear pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('MCP connection lost'));
    });
    this.pendingRequests.clear();
    
    // Attempt reconnection if within retry limit
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      console.log(`Attempting MCP reconnection ${this.connectionRetries}/${this.maxRetries} in ${this.retryDelay}ms...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch(error => {
          console.error('MCP reconnection failed:', error);
        });
      }, this.retryDelay);
    } else {
      console.error('Max MCP reconnection attempts reached');
    }
  }

  // Tool discovery and information
  getAvailableTools() {
    return Array.from(this.availableTools.values());
  }

  getToolInfo(toolName) {
    return this.availableTools.get(toolName);
  }

  getAvailableResources() {
    return Array.from(this.availableResources.values());
  }

  getResourceInfo(resourceUri) {
    return this.availableResources.get(resourceUri);
  }

  // Batch operations
  async callMultipleTools(toolCalls) {
    const results = [];
    
    for (const { toolName, parameters } of toolCalls) {
      try {
        const result = await this.callTool(toolName, parameters);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          toolName,
          parameters
        });
      }
    }
    
    return results;
  }

  // Connection status and health
  isHealthy() {
    return this.isConnected && this.process && !this.process.killed;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      serverPath: this.serverPath,
      serverType: this.serverType,
      availableTools: this.availableTools.size,
      availableResources: this.availableResources.size,
      pendingRequests: this.pendingRequests.size,
      connectionRetries: this.connectionRetries,
      processId: this.process?.pid
    };
  }

  // Cleanup
  async disconnect() {
    console.log('Disconnecting MCP client...');
    
    // Clear timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close process
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    
    this.isConnected = false;
    
    // Clear pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('MCP client disconnected'));
    });
    this.pendingRequests.clear();
    
    console.log('MCP client disconnected');
  }

  // Utility methods for chatbot integration
  async suggestToolsForQuery(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [toolName, toolInfo] of this.availableTools) {
      // Simple keyword matching - could be enhanced with embeddings
      const toolDescription = (toolInfo.description || '').toLowerCase();
      const toolKeywords = toolDescription.split(/\s+/);
      
      const queryWords = lowerQuery.split(/\s+/);
      const matchCount = queryWords.filter(word => 
        toolKeywords.some(keyword => keyword.includes(word) || word.includes(keyword))
      ).length;
      
      if (matchCount > 0) {
        suggestions.push({
          toolName,
          toolInfo,
          relevanceScore: matchCount / queryWords.length,
          matchedWords: queryWords.filter(word => 
            toolKeywords.some(keyword => keyword.includes(word) || word.includes(keyword))
          )
        });
      }
    }
    
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Enhanced tool calling with natural language
  async executeToolFromNaturalLanguage(query) {
    const suggestions = await this.suggestToolsForQuery(query);
    
    if (suggestions.length === 0) {
      return {
        success: false,
        error: 'No relevant tools found for this query',
        suggestions: []
      };
    }
    
    // For now, use the most relevant tool
    const bestMatch = suggestions[0];
    const toolName = bestMatch.toolName;
    const toolInfo = bestMatch.toolInfo;
    
    // Extract parameters from query (simplified approach)
    const parameters = this.extractParametersFromQuery(query, toolInfo);
    
    try {
      const result = await this.callTool(toolName, parameters);
      return {
        ...result,
        suggestedTool: bestMatch,
        extractedParameters: parameters
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestedTool: bestMatch,
        extractedParameters: parameters
      };
    }
  }

  extractParametersFromQuery(query, toolInfo) {
    const parameters = {};
    const lowerQuery = query.toLowerCase();
    
    // Simple parameter extraction based on tool schema
    if (toolInfo.inputSchema && toolInfo.inputSchema.properties) {
      for (const [paramName, paramInfo] of Object.entries(toolInfo.inputSchema.properties)) {
        // Look for parameter values in the query
        if (paramName === 'path' && lowerQuery.includes('file')) {
          // Extract file path patterns
          const pathMatch = query.match(/["']([^"']+)["']/) || query.match(/(\S+\.\w+)/);
          if (pathMatch) {
            parameters[paramName] = pathMatch[1];
          }
        } else if (paramName === 'query' || paramName === 'expression') {
          // For search queries or expressions, use parts of the original query
          const words = query.split(/\s+/);
          const relevantWords = words.filter(word => 
            !['search', 'find', 'calculate', 'analyze', 'list', 'show', 'get'].includes(word.toLowerCase())
          );
          if (relevantWords.length > 0) {
            parameters[paramName] = relevantWords.join(' ');
          }
        }
      }
    }
    
    return parameters;
  }

  // Statistics and monitoring
  getStats() {
    return {
      connection: this.getConnectionStatus(),
      tools: {
        total: this.availableTools.size,
        list: Array.from(this.availableTools.keys())
      },
      resources: {
        total: this.availableResources.size,
        list: Array.from(this.availableResources.keys())
      },
      performance: {
        pendingRequests: this.pendingRequests.size,
        connectionRetries: this.connectionRetries
      }
    };
  }
}
