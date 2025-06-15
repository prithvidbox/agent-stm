import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

export class ChatbotEngine {
  constructor({ memoryManager, ragSystem, mcpClient, mcpManager }) {
    this.memoryManager = memoryManager;
    this.ragSystem = ragSystem;
    this.mcpClient = mcpClient;
    this.mcpManager = mcpManager;
    this.llm = null;
    this.systemPrompt = this.getSystemPrompt();
  }

  async initialize() {
    console.log('Initializing Chatbot Engine...');
    
    // Initialize OpenAI LLM
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4096
    });
    
    console.log('Chatbot Engine initialized successfully');
  }

  getSystemPrompt() {
    return `You are an intelligent AI assistant with access to advanced capabilities including:

1. **Memory Systems**: You have both short-term and long-term memory to remember conversations and important information about users.

2. **RAG (Retrieval-Augmented Generation)**: You can search through uploaded documents and knowledge bases to provide accurate, contextual information.

3. **MCP (Model Context Protocol) Tools**: You have access to external tools and resources that can help you perform various tasks.

**Your Capabilities:**
- Remember conversation context and user preferences
- Search and retrieve information from documents
- Use external tools when appropriate
- Provide detailed, helpful responses
- Learn from interactions and improve over time

**Guidelines:**
- Always be helpful, accurate, and honest
- Use your memory to provide personalized responses
- When relevant information is available from documents, cite your sources
- Suggest using MCP tools when they could be helpful
- Ask clarifying questions when needed
- Explain your reasoning when using different capabilities

**Memory Usage:**
- Short-term memory: Recent conversation context and immediate session data
- Long-term memory: Important user information, preferences, and significant interactions

**RAG Usage:**
- Search documents when users ask questions that might be answered by uploaded content
- Always cite sources when using information from documents
- Indicate confidence level in retrieved information

**MCP Tool Usage:**
- Suggest relevant tools based on user queries
- Explain what tools can do before using them
- Provide clear results from tool usage

Remember: You're not just a chatbot, you're an intelligent assistant with persistent memory and access to external knowledge and tools.`;
  }

  async processMessage(message, sessionId, userId = 'anonymous') {
    try {
      const startTime = Date.now();
      
      // Ensure session exists
      await this.ensureSession(sessionId, userId);
      
      // Add message to short-term memory
      const messageData = this.memoryManager.addToShortTermMemory(sessionId, message, 'user');
      
      // Get conversation context
      const context = await this.buildContext(sessionId, userId, message);
      
      // Generate response
      const response = await this.generateResponse(context, sessionId, userId, message);
      
      // Add response to memory
      this.memoryManager.addToShortTermMemory(sessionId, response.content, 'assistant');
      
      // Save to database
      await this.saveMessageToDatabase(sessionId, 'user', message);
      await this.saveMessageToDatabase(sessionId, 'assistant', response.content);
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: response.content,
        sessionId,
        userId,
        processingTime,
        context: {
          usedRAG: response.usedRAG,
          ragSources: response.ragSources,
          usedMCP: response.usedMCP,
          mcpTools: response.mcpTools,
          memoryContext: response.memoryContext
        },
        metadata: {
          messageId: messageData.id,
          timestamp: Date.now(),
          model: 'gpt-4-turbo-preview'
        }
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        error: error.message,
        sessionId,
        userId
      };
    }
  }

  async buildContext(sessionId, userId, currentMessage) {
    const context = {
      messages: [],
      ragContext: null,
      longTermMemory: [],
      mcpSuggestions: [],
      memoryContext: null,
      semanticContext: null
    };

    // Check if we're using semantic memory manager
    const isSemanticMemory = this.memoryManager.constructor.name === 'SemanticMemoryManager';
    
    if (isSemanticMemory) {
      // Get enhanced context using semantic memory
      const relevantContext = await this.memoryManager.getRelevantContext(sessionId, currentMessage, 2000);
      context.messages = relevantContext.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        contextType: msg.contextType,
        relevanceScore: msg.relevanceScore,
        semanticCluster: msg.semanticCluster
      }));
      
      // Get semantic context summary
      context.semanticContext = await this.memoryManager.getContextSummary(sessionId);
    } else {
      // Fallback to traditional memory approach
      const recentMessages = this.memoryManager.getRecentMessages(sessionId, 10);
      context.messages = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
    }

    // Get memory context summary (works for both types)
    if (typeof this.memoryManager.getContextSummary === 'function') {
      context.memoryContext = await this.memoryManager.getContextSummary(sessionId);
    }

    // Get long-term memory context
    try {
      context.longTermMemory = await this.memoryManager.getLongTermMemoryContext(userId, currentMessage);
    } catch (error) {
      console.error('Error retrieving long-term memory:', error);
    }

    // Get RAG context if available
    if (this.ragSystem) {
      try {
        context.ragContext = await this.ragSystem.getRelevantContext(currentMessage, 5, 0.6);
      } catch (error) {
        console.error('Error retrieving RAG context:', error);
      }
    }

    // Get MCP tool suggestions if available
    console.log('🔧 ChatbotEngine: Checking MCP Manager...');
    console.log('🔧 ChatbotEngine: mcpManager exists:', !!this.mcpManager);
    console.log('🔧 ChatbotEngine: mcpManager initialized:', this.mcpManager?.initialized);
    console.log('🔧 ChatbotEngine: MCP enabled:', process.env.MCP_ENABLED === 'true');
    
    if (this.mcpClient && process.env.MCP_ENABLED === 'true') {
      try {
        console.log('🔧 ChatbotEngine: Getting MCP tools...');
        
        // Since getAvailableTools() is not working, use hardcoded list of known tools
        const availableTools = [
          { name: 'add_numbers', description: 'Add two numbers together', server: 'simple-tools', category: 'basic' },
          { name: 'echo', description: 'Echo back the input text', server: 'simple-tools', category: 'basic' },
          { name: 'generate_uuid', description: 'Generate a random UUID', server: 'simple-tools', category: 'basic' },
          { name: 'get_time', description: 'Get the current time', server: 'simple-tools', category: 'basic' },
          { name: 'hash_text', description: 'Generate SHA-256 hash of text', server: 'simple-tools', category: 'basic' },
          { name: 'reverse_text', description: 'Reverse the input text', server: 'simple-tools', category: 'basic' }
        ];
        
        console.log('🔧 ChatbotEngine: Using hardcoded tools list with', availableTools.length, 'tools:', availableTools.map(t => t.name).join(', '));
        
        context.mcpSuggestions = availableTools.map(tool => ({
          toolName: tool.name,
          toolInfo: {
            description: tool.description,
            server: tool.server,
            category: tool.category
          },
          relevanceScore: this.calculateToolRelevance(currentMessage, tool)
        })).filter(suggestion => suggestion.relevanceScore > 0.3)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
          
        console.log('🔧 ChatbotEngine: Relevant tools for "' + currentMessage + '":', context.mcpSuggestions.map(s => `${s.toolName}(${s.relevanceScore.toFixed(2)})`).join(', '));
      } catch (error) {
        console.error('❌ Error getting MCP suggestions:', error);
      }
    } else {
      console.log('🔧 ChatbotEngine: MCP Client not available or not initialized');
    }

    return context;
  }

  calculateToolRelevance(message, tool) {
    const messageWords = message.toLowerCase().split(/\s+/);
    const toolWords = (tool.name + ' ' + (tool.description || '')).toLowerCase().split(/\s+/);
    
    let relevanceScore = 0;
    
    // Check for direct keyword matches
    const keywordMatches = messageWords.filter(word => toolWords.includes(word));
    relevanceScore += keywordMatches.length * 0.3;
    
    // Check for category relevance
    if (tool.category) {
      const categoryWords = tool.category.toLowerCase().split(/\s+/);
      const categoryMatches = messageWords.filter(word => categoryWords.includes(word));
      relevanceScore += categoryMatches.length * 0.2;
    }
    
    // Specific tool relevance patterns
    const toolPatterns = {
      'echo': ['echo', 'repeat', 'say', 'output'],
      'add_numbers': ['add', 'sum', 'plus', 'calculate', 'math', '+', 'addition'],
      'get_time': ['time', 'date', 'now', 'current'],
      'reverse_text': ['reverse', 'backward', 'flip'],
      'generate_uuid': ['uuid', 'id', 'unique', 'identifier'],
      'hash_text': ['hash', 'encrypt', 'sha', 'checksum'],
      'generate_qr_code': ['qr', 'code', 'barcode', 'scan'],
      'password_generator': ['password', 'generate', 'secure', 'random'],
      'color_converter': ['color', 'hex', 'rgb', 'convert'],
      'text_analyzer': ['analyze', 'text', 'count', 'words', 'statistics']
    };
    
    const patterns = toolPatterns[tool.name] || [];
    const patternMatches = messageWords.filter(word => patterns.includes(word));
    relevanceScore += patternMatches.length * 0.5;
    
    return Math.min(relevanceScore, 1.0);
  }

  async generateResponse(context, sessionId, userId, originalMessage) {
    const messages = [];
    
    // System message with context
    let systemMessage = this.systemPrompt;
    
    // Add memory context
    if (context.memoryContext && context.memoryContext.keyEntities.length > 0) {
      systemMessage += `\n\n**Current Session Context:**
- Active entities: ${context.memoryContext.keyEntities.map(e => `${e.type}: ${e.value}`).join(', ')}
- Topics discussed: ${context.memoryContext.activeTopics.join(', ')}
- Messages in session: ${context.memoryContext.messageCount}`;
    }

    // Add long-term memory context
    if (context.longTermMemory.length > 0) {
      systemMessage += `\n\n**Relevant Long-term Memory:**`;
      context.longTermMemory.slice(0, 3).forEach((memory, index) => {
        try {
          const memoryContent = JSON.parse(memory.content);
          systemMessage += `\n${index + 1}. ${memoryContent.originalMessage} (Importance: ${memory.importance_score})`;
        } catch (error) {
          // Skip malformed memory entries
        }
      });
    }

    // Add RAG context
    let usedRAG = false;
    let ragSources = [];
    if (context.ragContext && context.ragContext.relevantChunks > 0) {
      usedRAG = true;
      ragSources = context.ragContext.sources;
      systemMessage += `\n\n**Relevant Document Information:**\n${context.ragContext.context}`;
    }

    // Add MCP tool information with enhanced instructions
    let mcpToolsInfo = [];
    if (context.mcpSuggestions.length > 0) {
      systemMessage += `\n\n**Available Tools (use when appropriate):**`;
      context.mcpSuggestions.slice(0, 5).forEach(suggestion => {
        systemMessage += `\n- ${suggestion.toolName}: ${suggestion.toolInfo.description || 'No description'}`;
        mcpToolsInfo.push({
          name: suggestion.toolName,
          description: suggestion.toolInfo.description,
          relevanceScore: suggestion.relevanceScore,
          server: suggestion.toolInfo.server
        });
      });
      
      systemMessage += `\n\n**Tool Usage Instructions:**
- When a user request can be fulfilled by a tool, use the format: [TOOL_USE:tool_name:parameters]
- For example: [TOOL_USE:add_numbers:{"a":5,"b":3}]
- Always explain what you're doing before using a tool
- Show the tool results to the user clearly
- Available tools: ${context.mcpSuggestions.map(s => s.toolName).join(', ')}`;
    }

    messages.push(new SystemMessage(systemMessage));

    // Add conversation history
    context.messages.forEach(msg => {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    });

    // Generate initial response
    const response = await this.llm.invoke(messages);
    
    // Check for and execute MCP tools - pass the original message directly
    const toolResults = await this.detectAndExecuteTools(response.content, context.mcpSuggestions, originalMessage);
    
    // If tools were used, generate a follow-up response with results
    let finalContent = response.content;
    if (toolResults.length > 0) {
      // Add tool results to the conversation
      messages.push(new AIMessage(response.content));
      
      // Create tool results message
      let toolResultsMessage = "\n\n**Tool Results:**\n";
      toolResults.forEach(result => {
        toolResultsMessage += `\n🔧 **${result.toolName}**: ${result.success ? '✅' : '❌'}\n`;
        if (result.success) {
          toolResultsMessage += `Result: ${result.result}\n`;
        } else {
          toolResultsMessage += `Error: ${result.error}\n`;
        }
      });
      
      messages.push(new HumanMessage(`Here are the tool execution results: ${toolResultsMessage}`));
      
      // Generate final response incorporating tool results
      const finalResponse = await this.llm.invoke(messages);
      finalContent = finalResponse.content;
    }

    return {
      content: finalContent,
      usedRAG,
      ragSources,
      usedMCP: toolResults.length > 0,
      mcpTools: toolResults,
      memoryContext: context.memoryContext,
      toolsAvailable: mcpToolsInfo
    };
  }

  async detectAndExecuteTools(responseContent, mcpSuggestions, originalMessage) {
    const toolResults = [];
    
    console.log('🔧 detectAndExecuteTools called with', mcpSuggestions.length, 'suggestions');
    
    if (!this.mcpClient || mcpSuggestions.length === 0 || process.env.MCP_ENABLED !== 'true') {
      console.log('🔧 No MCP client or suggestions available, or MCP disabled');
      return toolResults;
    }

    // First check for explicit tool usage format
    const toolUsePattern = /\[TOOL_USE:(\w+):(\{.*?\})\]/g;
    let match;
    
    while ((match = toolUsePattern.exec(responseContent)) !== null) {
      const toolName = match[1];
      let parameters = {};
      
      try {
        parameters = JSON.parse(match[2]);
      } catch (error) {
        console.error('Error parsing tool parameters:', error);
        toolResults.push({
          toolName,
          success: false,
          error: 'Invalid parameters format'
        });
        continue;
      }
      
      // Find the tool in suggestions
      const toolSuggestion = mcpSuggestions.find(s => s.toolName === toolName);
      
      if (toolSuggestion) {
        try {
          const toolResult = await this.mcpClient.callTool(toolName, parameters);
          
          // Extract text from MCP result format
          let resultText = toolResult.result;
          if (Array.isArray(toolResult.result) && toolResult.result[0]?.text) {
            resultText = toolResult.result[0].text;
          } else if (toolResult.result?.content?.[0]?.text) {
            resultText = toolResult.result.content[0].text;
          }
          
          toolResults.push({
            toolName,
            success: toolResult.success,
            result: resultText,
            parameters,
            server: toolSuggestion.toolInfo.server
          });
          
        } catch (error) {
          console.error('Error executing MCP tool:', error);
          toolResults.push({
            toolName,
            success: false,
            error: error.message,
            parameters
          });
        }
      }
    }

    // If no explicit tool usage found, check for natural language patterns
    if (toolResults.length === 0) {
      console.log('🔧 No explicit tool usage found, checking natural language patterns...');
      const autoToolResult = await this.detectNaturalToolUsage(originalMessage, mcpSuggestions);
      if (autoToolResult) {
        console.log('🔧 Auto-detected tool usage:', autoToolResult.toolName);
        toolResults.push(autoToolResult);
      }
    }

    console.log('🔧 Tool execution results:', toolResults.length, 'tools executed');
    return toolResults;
  }

  async detectNaturalToolUsage(message, mcpSuggestions) {
    const messageLower = message.toLowerCase();
    console.log('🔧 Checking natural tool usage for:', message);
    
    // Math/calculation patterns
    if (messageLower.match(/(\d+)\s*[\+\-\*\/]\s*(\d+)/) || messageLower.includes('add') || messageLower.includes('calculate')) {
      console.log('🔧 Math pattern detected');
      const mathTool = mcpSuggestions.find(s => s.toolName === 'add_numbers');
      if (mathTool && mathTool.relevanceScore > 0.3) {
        console.log('🔧 Found add_numbers tool with relevance:', mathTool.relevanceScore);
        // Extract numbers for addition
        const addMatch = message.match(/(\d+)\s*(?:\+|add|plus)\s*(\d+)/i);
        if (addMatch) {
          const a = parseInt(addMatch[1]);
          const b = parseInt(addMatch[2]);
          
          console.log('🔧 Executing add_numbers with:', { a, b });
          
          try {
            const toolResult = await this.mcpClient.callTool('add_numbers', { a, b });
            
            console.log('🔧 Tool result:', toolResult);
            
            // Extract text from MCP result format
            let resultText = toolResult.result;
            if (Array.isArray(toolResult.result) && toolResult.result[0]?.text) {
              resultText = toolResult.result[0].text;
            } else if (toolResult.result?.content?.[0]?.text) {
              resultText = toolResult.result.content[0].text;
            }
            
            return {
              toolName: 'add_numbers',
              success: toolResult.success,
              result: resultText,
              parameters: { a, b },
              server: mathTool.toolInfo.server,
              autoDetected: true
            };
          } catch (error) {
            console.error('❌ Error executing add_numbers:', error);
            return {
              toolName: 'add_numbers',
              success: false,
              error: error.message,
              parameters: { a, b },
              autoDetected: true
            };
          }
        }
      }
    }
    
    return null;
  }

  // Test methods for API endpoints
  async testShortTermMemory(sessionId, testMessages) {
    try {
      const results = {
        sessionId,
        testMessages: testMessages.length,
        results: []
      };

      // Add test messages to memory
      for (const message of testMessages) {
        this.memoryManager.addToShortTermMemory(sessionId, message, 'user');
        results.results.push({
          message,
          stored: true,
          timestamp: Date.now()
        });
      }

      // Test retrieval
      const memory = this.memoryManager.exportMemory(sessionId);
      results.memoryState = memory;
      results.success = true;

      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sessionId
      };
    }
  }

  async testLongTermMemory(userId, testData) {
    try {
      const results = {
        userId,
        testData: testData.length,
        results: []
      };

      // Add test data to long-term memory
      for (const data of testData) {
        await this.memoryManager.addToLongTermMemory(userId, data.content, data.importance, data.type);
        results.results.push({
          content: data.content,
          stored: true,
          importance: data.importance,
          type: data.type
        });
      }

      // Test retrieval
      const memories = await this.memoryManager.getLongTermMemoryContext(userId);
      results.memoryState = memories;
      results.success = true;

      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        userId
      };
    }
  }

  async testRAG(query, expectedSources = []) {
    try {
      if (!this.ragSystem) {
        return {
          success: false,
          error: 'RAG system not available'
        };
      }

      const results = await this.ragSystem.getRelevantContext(query, 5, 0.6);
      
      return {
        success: true,
        query,
        results,
        expectedSources,
        found: results.relevantChunks || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query
      };
    }
  }

  async testMCP() {
    try {
      if (!this.mcpClient) {
        return {
          success: false,
          error: 'MCP client not available'
        };
      }

      const results = {
        success: true,
        tests: []
      };

      // Test echo tool
      try {
        const echoResult = await this.mcpClient.callTool('echo', { text: 'Hello MCP!' });
        results.tests.push({
          tool: 'echo',
          success: echoResult.success,
          result: echoResult.result
        });
      } catch (error) {
        results.tests.push({
          tool: 'echo',
          success: false,
          error: error.message
        });
      }

      // Test add_numbers tool
      try {
        const mathResult = await this.mcpClient.callTool('add_numbers', { a: 5, b: 3 });
        results.tests.push({
          tool: 'add_numbers',
          success: mathResult.success,
          result: mathResult.result
        });
      } catch (error) {
        results.tests.push({
          tool: 'add_numbers',
          success: false,
          error: error.message
        });
      }

      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSystemStats() {
    try {
      const stats = {
        memory: this.memoryManager.getMemoryStats(),
        rag: this.ragSystem ? this.ragSystem.getRAGStats() : null,
        mcp: this.mcpClient ? {
          connected: this.mcpClient.initialized,
          tools: this.mcpClient.getAvailableTools().length
        } : null,
        timestamp: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getConversationHistory(sessionId, limit = 50) {
    try {
      const messages = await this.memoryManager.dbManager.all(
        'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?',
        [sessionId, limit]
      );
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  async clearConversation(sessionId) {
    try {
      // Clear from memory manager
      this.memoryManager.clearSession(sessionId);
      
      // Clear from database
      await this.memoryManager.dbManager.run(
        'DELETE FROM chat_messages WHERE session_id = ?',
        [sessionId]
      );
      
      return true;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      return false;
    }
  }

  async ensureSession(sessionId, userId) {
    try {
      const existingSession = await this.memoryManager.dbManager.getSession(sessionId);
      if (!existingSession) {
        await this.memoryManager.dbManager.createSession(sessionId, userId, {
          createdAt: new Date().toISOString(),
          userAgent: 'chatbot-playground'
        });
      } else {
        await this.memoryManager.dbManager.updateSessionTimestamp(sessionId);
      }
    } catch (error) {
      console.error('Error ensuring session:', error);
    }
  }

  async saveMessageToDatabase(sessionId, role, content) {
    try {
      await this.memoryManager.dbManager.saveMessage(sessionId, role, content, {
        timestamp: new Date().toISOString(),
        processed: true
      });
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  }

  // Get system health status
  getSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        components: {
          llm: {
            status: this.llm ? 'connected' : 'disconnected',
            model: 'gpt-4-turbo-preview'
          },
          memory: {
            status: this.memoryManager ? 'connected' : 'disconnected',
            type: this.memoryManager?.constructor.name || 'unknown'
          },
          rag: {
            status: this.ragSystem ? 'connected' : 'disconnected',
            type: this.ragSystem?.constructor.name || 'none'
          },
          mcp: {
            status: this.mcpClient?.initialized ? 'connected' : 'disconnected',
            client: this.mcpClient ? 'available' : 'unavailable'
          }
        },
        timestamp: new Date().toISOString()
      };

      // Check if any critical components are down
      const criticalComponents = ['llm', 'memory'];
      const hasFailures = criticalComponents.some(comp => 
        health.components[comp].status === 'disconnected'
      );

      if (hasFailures) {
        health.status = 'degraded';
      }

      return health;
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
