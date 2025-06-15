import express from 'express';

const router = express.Router();
let mcpManager = null;

// Function to set the MCP manager instance
export function setMCPManager(manager) {
  mcpManager = manager;
}

// Get all MCP servers
router.get('/servers', async (req, res) => {
  try {
    const servers = await mcpManager.getAllServers();
    res.json({ success: true, servers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get enabled MCP servers
router.get('/servers/enabled', async (req, res) => {
  try {
    const servers = await mcpManager.getEnabledServers();
    res.json({ success: true, servers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enable/disable MCP server
router.post('/servers/:serverName/toggle', async (req, res) => {
  try {
    const { serverName } = req.params;
    const { enabled } = req.body;
    
    let result;
    if (enabled) {
      result = await mcpManager.enableServer(serverName);
    } else {
      result = await mcpManager.disableServer(serverName);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all available tools
router.get('/tools', async (req, res) => {
  try {
    if (!mcpManager) {
      return res.status(500).json({ success: false, error: 'MCP Manager not initialized' });
    }
    
    console.log('🔧 Tools endpoint called');
    
    // Use the MCPManager's getAvailableTools method which already has the correct logic
    const tools = await mcpManager.getAvailableTools();
    
    console.log('🔧 getAvailableTools() returned:', tools.length, 'tools');
    console.log('🔧 Tools:', tools.map(t => t.name).join(', '));
    
    res.json({ tools });
  } catch (error) {
    console.error('❌ Error in /tools endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to check database directly
router.get('/debug/tools', async (req, res) => {
  try {
    if (!mcpManager) {
      return res.status(500).json({ success: false, error: 'MCP Manager not initialized' });
    }
    
    // Get raw data from database
    const servers = await mcpManager.getAllServers();
    const enabledServers = await mcpManager.getEnabledServers();
    const tools = await mcpManager.getAvailableTools();
    
    res.json({ 
      servers: servers.length,
      enabledServers: enabledServers.length,
      tools: tools.length,
      rawServers: servers,
      rawEnabledServers: enabledServers,
      rawTools: tools
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search tools
router.get('/tools/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }
    
    const tools = await mcpManager.searchTools(q);
    res.json({ success: true, tools, query: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enable/disable specific tool
router.post('/tools/:serverName/:toolName/toggle', async (req, res) => {
  try {
    const { serverName, toolName } = req.params;
    const { enabled } = req.body;
    
    let result;
    if (enabled) {
      result = await mcpManager.enableTool(serverName, toolName);
    } else {
      result = await mcpManager.disableTool(serverName, toolName);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Call a tool
router.post('/tools/:serverName/:toolName/call', async (req, res) => {
  try {
    const { serverName, toolName } = req.params;
    const { arguments: args } = req.body;
    
    const result = await mcpManager.callTool(serverName, toolName, args || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get server health status
router.get('/health', async (req, res) => {
  try {
    const health = await mcpManager.getAllServerHealth();
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific server health
router.get('/health/:serverName', async (req, res) => {
  try {
    const { serverName } = req.params;
    const health = await mcpManager.getServerHealth(serverName);
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Discover tools for a server
router.post('/servers/:serverName/discover', async (req, res) => {
  try {
    const { serverName } = req.params;
    const result = await mcpManager.discoverTools(serverName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tool usage statistics
router.get('/stats/usage', async (req, res) => {
  try {
    const stats = await mcpManager.getToolUsageStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add custom MCP server
router.post('/servers', async (req, res) => {
  try {
    const serverConfig = req.body;
    const result = await mcpManager.addCustomServer(serverConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove MCP server
router.delete('/servers/:serverName', async (req, res) => {
  try {
    const { serverName } = req.params;
    const result = await mcpManager.removeServer(serverName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get MCP dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [servers, tools, health, stats] = await Promise.all([
      mcpManager.getAllServers(),
      mcpManager.getAvailableTools(),
      mcpManager.getAllServerHealth(),
      mcpManager.getToolUsageStats()
    ]);

    const dashboard = {
      summary: {
        totalServers: servers.length,
        enabledServers: servers.filter(s => s.enabled).length,
        totalTools: tools.length,
        healthyServers: health.filter(h => h.healthy).length
      },
      servers,
      tools,
      health,
      topTools: stats.slice(0, 10),
      categories: [...new Set(servers.map(s => s.category))]
    };

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as mcpRoutes, mcpManager };
