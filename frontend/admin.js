// MCP Admin Dashboard JavaScript

let dashboardData = {};
let allTools = [];
let allServers = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setInterval(refreshHealthStatus, 30000); // Refresh health every 30 seconds
});

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'overview':
            loadDashboard();
            break;
        case 'servers':
            loadServers();
            break;
        case 'tools':
            loadTools();
            break;
        case 'testing':
            loadTestingData();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// API helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`/api/mcp${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('API call failed: ' + error.message, 'error');
        throw error;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const data = await apiCall('/dashboard');
        dashboardData = data.dashboard;
        
        updateOverviewStats();
        updateServerHealth();
        updateTopTools();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function updateOverviewStats() {
    const summary = dashboardData.summary || {};
    
    document.getElementById('totalServers').textContent = summary.totalServers || 0;
    document.getElementById('enabledServers').textContent = summary.enabledServers || 0;
    document.getElementById('totalTools').textContent = summary.totalTools || 0;
    document.getElementById('healthyServers').textContent = summary.healthyServers || 0;
}

function updateServerHealth() {
    const healthList = document.getElementById('serverHealthList');
    const health = dashboardData.health || [];
    
    if (health.length === 0) {
        healthList.innerHTML = '<p>No servers configured</p>';
        return;
    }
    
    healthList.innerHTML = health.map(server => `
        <div class="server-item ${server.healthy ? '' : 'disabled'}">
            <div>
                <span class="status-indicator ${server.healthy ? 'status-healthy' : 'status-unhealthy'}"></span>
                <strong>${server.serverName}</strong>
                ${server.healthy ? `(${server.availableTools || 0} tools)` : '(Offline)'}
            </div>
            <div style="font-size: 0.8em; color: #666;">
                ${server.healthy ? `Uptime: ${Math.round(server.uptime || 0)}s` : server.error || 'Unreachable'}
            </div>
        </div>
    `).join('');
}

function updateTopTools() {
    const topToolsList = document.getElementById('topToolsList');
    const topTools = dashboardData.topTools || [];
    
    if (topTools.length === 0) {
        topToolsList.innerHTML = '<p>No tool usage data available</p>';
        return;
    }
    
    topToolsList.innerHTML = topTools.map(tool => `
        <div class="tool-item">
            <div>
                <strong>${tool.tool_name}</strong>
                <div style="font-size: 0.8em; color: #666;">${tool.server_name}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold;">${tool.usage_count} uses</div>
                <div style="font-size: 0.8em; color: #666;">
                    ${tool.last_used ? new Date(tool.last_used).toLocaleDateString() : 'Never'}
                </div>
            </div>
        </div>
    `).join('');
}

// Server management
async function loadServers() {
    try {
        const data = await apiCall('/servers');
        allServers = data.servers || [];
        updateServersList();
    } catch (error) {
        console.error('Failed to load servers:', error);
    }
}

function updateServersList() {
    const serversList = document.getElementById('serversList');
    
    if (allServers.length === 0) {
        serversList.innerHTML = '<li>No servers configured</li>';
        return;
    }
    
    serversList.innerHTML = allServers.map(server => `
        <li class="server-item ${server.enabled ? '' : 'disabled'}">
            <div>
                <strong>${server.name}</strong>
                <div style="font-size: 0.8em; color: #666;">
                    ${server.description || 'No description'}
                </div>
                <div style="font-size: 0.8em; color: #999;">
                    ${server.url} | Category: ${server.category}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <label class="toggle-switch">
                    <input type="checkbox" ${server.enabled ? 'checked' : ''} 
                           onchange="toggleServer('${server.name}', this.checked)">
                    <span class="slider"></span>
                </label>
                <button class="btn" onclick="discoverTools('${server.name}')">🔍 Discover</button>
                <button class="btn btn-danger" onclick="removeServer('${server.name}')">🗑️</button>
            </div>
        </li>
    `).join('');
}

async function toggleServer(serverName, enabled) {
    try {
        await apiCall(`/servers/${serverName}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ enabled })
        });
        
        showNotification(`Server ${serverName} ${enabled ? 'enabled' : 'disabled'}`, 'success');
        loadServers();
        loadDashboard();
    } catch (error) {
        console.error('Failed to toggle server:', error);
        loadServers(); // Revert UI
    }
}

async function discoverTools(serverName) {
    try {
        const result = await apiCall(`/servers/${serverName}/discover`, {
            method: 'POST'
        });
        
        if (result.success) {
            showNotification(`Discovered ${result.tools} tools for ${serverName}`, 'success');
            loadTools();
        } else {
            showNotification(`Failed to discover tools: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Failed to discover tools:', error);
    }
}

async function removeServer(serverName) {
    if (!confirm(`Are you sure you want to remove server "${serverName}"?`)) {
        return;
    }
    
    try {
        await apiCall(`/servers/${serverName}`, {
            method: 'DELETE'
        });
        
        showNotification(`Server ${serverName} removed`, 'success');
        loadServers();
        loadDashboard();
    } catch (error) {
        console.error('Failed to remove server:', error);
    }
}

// Add server form
function showAddServerForm() {
    document.getElementById('addServerForm').style.display = 'block';
}

function hideAddServerForm() {
    document.getElementById('addServerForm').style.display = 'none';
    // Clear form
    document.getElementById('newServerName').value = '';
    document.getElementById('newServerUrl').value = '';
    document.getElementById('newServerPort').value = '';
    document.getElementById('newServerCategory').value = '';
    document.getElementById('newServerDescription').value = '';
}

async function addCustomServer() {
    const name = document.getElementById('newServerName').value.trim();
    const url = document.getElementById('newServerUrl').value.trim();
    const port = document.getElementById('newServerPort').value.trim();
    const category = document.getElementById('newServerCategory').value.trim();
    const description = document.getElementById('newServerDescription').value.trim();
    
    if (!name || !url) {
        showNotification('Name and URL are required', 'error');
        return;
    }
    
    try {
        const serverConfig = {
            name,
            url,
            port: port ? parseInt(port) : null,
            category: category || 'custom',
            description,
            enabled: true
        };
        
        const result = await apiCall('/servers', {
            method: 'POST',
            body: JSON.stringify(serverConfig)
        });
        
        if (result.success) {
            showNotification(`Server ${name} added successfully`, 'success');
            hideAddServerForm();
            loadServers();
            loadDashboard();
        } else {
            showNotification(`Failed to add server: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Failed to add server:', error);
    }
}

// Tool management
async function loadTools() {
    try {
        const data = await apiCall('/tools');
        allTools = data.tools || [];
        updateToolsList();
        updateTestingSelects();
    } catch (error) {
        console.error('Failed to load tools:', error);
    }
}

function updateToolsList() {
    const toolsList = document.getElementById('toolsList');
    
    if (allTools.length === 0) {
        toolsList.innerHTML = '<li>No tools available</li>';
        return;
    }
    
    toolsList.innerHTML = allTools.map(tool => `
        <li class="tool-item">
            <div>
                <strong>${tool.name}</strong>
                <div style="font-size: 0.8em; color: #666;">
                    ${tool.description || 'No description'}
                </div>
                <div style="font-size: 0.8em; color: #999;">
                    Server: ${tool.server} | Category: ${tool.category}
                    ${tool.usageCount ? ` | Used ${tool.usageCount} times` : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="btn" onclick="testToolQuick('${tool.server}', '${tool.name}')">🧪 Test</button>
                <label class="toggle-switch">
                    <input type="checkbox" checked 
                           onchange="toggleTool('${tool.server}', '${tool.name}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        </li>
    `).join('');
}

async function toggleTool(serverName, toolName, enabled) {
    try {
        await apiCall(`/tools/${serverName}/${toolName}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ enabled })
        });
        
        showNotification(`Tool ${toolName} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
        console.error('Failed to toggle tool:', error);
        loadTools(); // Revert UI
    }
}

function searchTools() {
    const query = document.getElementById('toolSearch').value.toLowerCase();
    const toolItems = document.querySelectorAll('.tool-item');
    
    toolItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

// Testing functions
function loadTestingData() {
    updateTestingSelects();
}

function updateTestingSelects() {
    const serverSelect = document.getElementById('testServerSelect');
    const toolSelect = document.getElementById('testToolSelect');
    
    // Update server select
    serverSelect.innerHTML = '<option value="">Select Server</option>' +
        allServers.filter(s => s.enabled).map(server => 
            `<option value="${server.name}">${server.name}</option>`
        ).join('');
    
    // Update tool select when server changes
    serverSelect.onchange = function() {
        const selectedServer = this.value;
        const serverTools = allTools.filter(tool => tool.server === selectedServer);
        
        toolSelect.innerHTML = '<option value="">Select Tool</option>' +
            serverTools.map(tool => 
                `<option value="${tool.name}">${tool.name}</option>`
            ).join('');
    };
}

async function testTool() {
    const serverName = document.getElementById('testServerSelect').value;
    const toolName = document.getElementById('testToolSelect').value;
    const argsText = document.getElementById('testArgs').value.trim();
    
    if (!serverName || !toolName) {
        showNotification('Please select server and tool', 'error');
        return;
    }
    
    let args = {};
    if (argsText) {
        try {
            args = JSON.parse(argsText);
        } catch (error) {
            showNotification('Invalid JSON in arguments', 'error');
            return;
        }
    }
    
    await executeToolTest(serverName, toolName, args);
}

async function quickTest(serverName, toolName, argsJson) {
    const args = JSON.parse(argsJson);
    await executeToolTest(serverName, toolName, args);
}

async function testToolQuick(serverName, toolName) {
    await executeToolTest(serverName, toolName, {});
}

async function executeToolTest(serverName, toolName, args) {
    const resultDiv = document.getElementById('testResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'tool-result loading';
    resultDiv.textContent = 'Testing tool...';
    
    try {
        const result = await apiCall(`/tools/${serverName}/${toolName}/call`, {
            method: 'POST',
            body: JSON.stringify({ arguments: args })
        });
        
        resultDiv.className = result.success ? 'tool-result success' : 'tool-result error';
        resultDiv.textContent = JSON.stringify(result, null, 2);
        
        if (result.success) {
            showNotification('Tool test completed successfully', 'success');
        } else {
            showNotification('Tool test failed', 'error');
        }
    } catch (error) {
        resultDiv.className = 'tool-result error';
        resultDiv.textContent = 'Error: ' + error.message;
        console.error('Tool test failed:', error);
    }
}

// Settings and utilities
function loadSettings() {
    // Load saved settings from localStorage
    const autoDiscover = localStorage.getItem('autoDiscoverTools') !== 'false';
    const showStats = localStorage.getItem('showUsageStats') !== 'false';
    
    document.getElementById('autoDiscoverTools').checked = autoDiscover;
    document.getElementById('showUsageStats').checked = showStats;
    
    refreshUsageStats();
}

function saveSettings() {
    const autoDiscover = document.getElementById('autoDiscoverTools').checked;
    const showStats = document.getElementById('showUsageStats').checked;
    
    localStorage.setItem('autoDiscoverTools', autoDiscover);
    localStorage.setItem('showUsageStats', showStats);
    
    showNotification('Settings saved', 'success');
}

async function refreshUsageStats() {
    try {
        const data = await apiCall('/stats/usage');
        const stats = data.stats || [];
        
        const usageStatsDiv = document.getElementById('usageStats');
        
        if (stats.length === 0) {
            usageStatsDiv.innerHTML = '<p>No usage statistics available</p>';
            return;
        }
        
        const statsHtml = stats.map(stat => `
            <div class="tool-item">
                <div>
                    <strong>${stat.tool_name}</strong>
                    <div style="font-size: 0.8em; color: #666;">${stat.server_name}</div>
                </div>
                <div style="text-align: right;">
                    <div>${stat.usage_count} uses</div>
                    <div style="font-size: 0.8em; color: #666;">
                        ${stat.last_used ? new Date(stat.last_used).toLocaleDateString() : 'Never'}
                    </div>
                </div>
            </div>
        `).join('');
        
        usageStatsDiv.innerHTML = statsHtml;
    } catch (error) {
        console.error('Failed to load usage stats:', error);
    }
}

async function resetAllServers() {
    if (!confirm('Are you sure you want to reset all servers? This will disable all servers and clear their tools.')) {
        return;
    }
    
    try {
        // Disable all servers
        for (const server of allServers) {
            if (server.enabled) {
                await apiCall(`/servers/${server.name}/toggle`, {
                    method: 'POST',
                    body: JSON.stringify({ enabled: false })
                });
            }
        }
        
        showNotification('All servers have been reset', 'success');
        loadServers();
        loadDashboard();
    } catch (error) {
        console.error('Failed to reset servers:', error);
    }
}

// Utility functions
async function refreshServers() {
    await loadServers();
    showNotification('Servers refreshed', 'success');
}

async function refreshTools() {
    await loadTools();
    showNotification('Tools refreshed', 'success');
}

async function refreshHealthStatus() {
    try {
        const data = await apiCall('/health');
        if (dashboardData) {
            dashboardData.health = data.health;
            updateServerHealth();
        }
    } catch (error) {
        console.error('Failed to refresh health status:', error);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
