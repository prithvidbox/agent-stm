import fetch from 'node-fetch';
import { DatabaseManager } from '../database/DatabaseManager.js';

export class MCPManager {
  constructor() {
    this.servers = new Map();
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.db = new DatabaseManager();
    await this.db.initialize();
    await this.initializeDatabase();
    this.initialized = true;
  }

  async initializeDatabase() {
    // Create MCP configuration tables
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        url TEXT NOT NULL,
        port INTEGER,
        enabled BOOLEAN DEFAULT 1,
        category TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS mcp_tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_name TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_name) REFERENCES mcp_servers (name)
      )
    `);

    // Insert default MCP servers
    await this.registerDefaultServers();
  }

  async registerDefaultServers() {
    const defaultServers = [
      {
        name: 'http-tools',
        description: 'Basic HTTP tools for text processing and utilities',
        url: 'http://localhost:3002',
        port: 3002,
        category: 'basic',
        enabled: true
      },
      {
        name: 'utilities',
        description: 'Advanced utility tools including QR codes and text analysis',
        url: 'http://localhost:3003',
        port: 3003,
        category: 'utilities',
        enabled: false
      },
      {
        name: 'browserbase',
        description: 'Cloud browser automation with Browserbase - web scraping, screenshots, and browser control',
        url: 'stdio://../mcp-servers/browserbase/server.js',
        port: null,
        category: 'browser',
        enabled: process.env.BROWSERBASE_ENABLED === 'true'
      }
    ];

    for (const server of defaultServers) {
      try {
        await this.db.run(`
          INSERT OR IGNORE INTO mcp_servers (name, description, url, port, category, enabled)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [server.name, server.description, server.url, server.port, server.category, server.enabled]);
      } catch (error) {
        console.error(`Error registering server ${server.name}:`, error);
      }
    }
  }

  async getAllServers() {
    return await this.db.all('SELECT * FROM mcp_servers ORDER BY name');
  }

  async getEnabledServers() {
    return await this.db.all('SELECT * FROM mcp_servers WHERE enabled = 1 ORDER BY name');
  }

  async enableServer(serverName) {
    await this.db.run('UPDATE mcp_servers SET enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE name = ?', [serverName]);
    await this.discoverTools(serverName);
    return { success: true, message: `Server ${serverName} enabled` };
  }

  async disableServer(serverName) {
    await this.db.run('UPDATE mcp_servers SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE name = ?', [serverName]);
    await this.db.run('UPDATE mcp_tools SET enabled = 0 WHERE server_name = ?', [serverName]);
    return { success: true, message: `Server ${serverName} disabled` };
  }

  async enableTool(serverName, toolName) {
    await this.db.run(`
      UPDATE mcp_tools 
      SET enabled = 1 
      WHERE server_name = ? AND tool_name = ?
    `, [serverName, toolName]);
    return { success: true, message: `Tool ${toolName} enabled` };
  }

  async disableTool(serverName, toolName) {
    await this.db.run(`
      UPDATE mcp_tools 
      SET enabled = 0 
      WHERE server_name = ? AND tool_name = ?
    `, [serverName, toolName]);
    return { success: true, message: `Tool ${toolName} disabled` };
  }

  async discoverTools(serverName) {
    try {
      const server = await this.db.get('SELECT * FROM mcp_servers WHERE name = ?', [serverName]);
      if (!server || !server.enabled) {
        return { success: false, message: 'Server not found or disabled' };
      }

      const response = await fetch(`${server.url}/tools/list`);
      const data = await response.json();

      if (data.success && data.tools) {
        // Clear existing tools for this server
        await this.db.run('DELETE FROM mcp_tools WHERE server_name = ?', [serverName]);

        // Add discovered tools
        for (const tool of data.tools) {
          await this.db.run(`
            INSERT INTO mcp_tools (server_name, tool_name, description, enabled)
            VALUES (?, ?, ?, 1)
          `, [serverName, tool.name, tool.description]);
        }

        return { success: true, tools: data.tools.length };
      }
    } catch (error) {
      console.error(`Error discovering tools for ${serverName}:`, error);
      return { success: false, error: error.message };
    }
  }

  async getAvailableTools() {
    const tools = await this.db.all(`
      SELECT t.*, s.url, s.category
      FROM mcp_tools t
      JOIN mcp_servers s ON t.server_name = s.name
      WHERE t.enabled = 1 AND s.enabled = 1
      ORDER BY s.category, t.tool_name
    `);

    return tools.map(tool => ({
      name: tool.tool_name,
      description: tool.description,
      server: tool.server_name,
      category: tool.category,
      url: tool.url,
      usageCount: tool.usage_count,
      lastUsed: tool.last_used
    }));
  }

  async callTool(serverName, toolName, args) {
    try {
      // Check if tool is enabled
      const tool = await this.db.get(`
        SELECT t.*, s.url
        FROM mcp_tools t
        JOIN mcp_servers s ON t.server_name = s.name
        WHERE t.server_name = ? AND t.tool_name = ? AND t.enabled = 1 AND s.enabled = 1
      `, [serverName, toolName]);

      if (!tool) {
        return { success: false, error: 'Tool not found or disabled' };
      }

      // Call the tool
      const response = await fetch(`${tool.url}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toolName,
          arguments: args
        })
      });

      const result = await response.json();

      // Update usage statistics
      await this.db.run(`
        UPDATE mcp_tools 
        SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP
        WHERE server_name = ? AND tool_name = ?
      `, [serverName, toolName]);

      return result;
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error);
      return { success: false, error: error.message };
    }
  }

  async getServerHealth(serverName) {
    try {
      const server = await this.db.get('SELECT * FROM mcp_servers WHERE name = ?', [serverName]);
      if (!server) {
        return { healthy: false, error: 'Server not found' };
      }

      const response = await fetch(`${server.url}/health`, { timeout: 5000 });
      const health = await response.json();
      
      return {
        healthy: true,
        ...health,
        serverName: serverName
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        serverName: serverName
      };
    }
  }

  async getAllServerHealth() {
    const servers = await this.getAllServers();
    const healthChecks = await Promise.all(
      servers.map(server => this.getServerHealth(server.name))
    );
    
    return healthChecks;
  }

  async getToolUsageStats() {
    const stats = await this.db.all(`
      SELECT 
        t.server_name,
        t.tool_name,
        t.usage_count,
        t.last_used,
        s.category
      FROM mcp_tools t
      JOIN mcp_servers s ON t.server_name = s.name
      WHERE t.enabled = 1 AND s.enabled = 1
      ORDER BY t.usage_count DESC
    `);

    return stats;
  }

  async addCustomServer(serverConfig) {
    try {
      await this.db.run(`
        INSERT INTO mcp_servers (name, description, url, port, category, enabled)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        serverConfig.name,
        serverConfig.description,
        serverConfig.url,
        serverConfig.port,
        serverConfig.category || 'custom',
        serverConfig.enabled !== false
      ]);

      // Discover tools for the new server
      if (serverConfig.enabled !== false) {
        await this.discoverTools(serverConfig.name);
      }

      return { success: true, message: `Server ${serverConfig.name} added successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeServer(serverName) {
    try {
      await this.db.run('DELETE FROM mcp_tools WHERE server_name = ?', [serverName]);
      await this.db.run('DELETE FROM mcp_servers WHERE name = ?', [serverName]);
      return { success: true, message: `Server ${serverName} removed successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchTools(query) {
    const tools = await this.db.all(`
      SELECT t.*, s.url, s.category
      FROM mcp_tools t
      JOIN mcp_servers s ON t.server_name = s.name
      WHERE (t.tool_name LIKE ? OR t.description LIKE ?)
        AND t.enabled = 1 AND s.enabled = 1
      ORDER BY t.usage_count DESC
    `, [`%${query}%`, `%${query}%`]);

    return tools.map(tool => ({
      name: tool.tool_name,
      description: tool.description,
      server: tool.server_name,
      category: tool.category,
      usageCount: tool.usage_count
    }));
  }
}
