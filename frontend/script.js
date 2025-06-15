// Global state
let currentSessionId = null;
let currentUserId = 'user-001';
let messageCount = 0;
let ws = null;

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing Chatbot Playground...');
    
    // Generate new session ID
    currentSessionId = generateUUID();
    updateSessionInfo();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize WebSocket connection
    initializeWebSocket();
    
    // Check system health
    await checkSystemHealth();
    
    // Load initial data
    await loadInitialData();
    
    console.log('Application initialized successfully');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // Session controls
    document.getElementById('newSessionBtn').addEventListener('click', createNewSession);
    document.getElementById('userId').addEventListener('change', (e) => {
        currentUserId = e.target.value;
        updateSessionInfo();
    });
    
    // Chat functionality
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('clearChatBtn').addEventListener('click', clearChat);
    document.getElementById('exportChatBtn').addEventListener('click', exportChat);
    
    // Memory controls
    document.getElementById('refreshShortMemoryBtn').addEventListener('click', loadShortTermMemory);
    document.getElementById('refreshLongMemoryBtn').addEventListener('click', loadLongTermMemory);
    document.getElementById('testShortMemoryBtn').addEventListener('click', testShortTermMemory);
    document.getElementById('testLongMemoryBtn').addEventListener('click', testLongTermMemory);
    
    // RAG controls
    setupRAGEventListeners();
    
    // MCP controls
    document.getElementById('refreshMcpBtn').addEventListener('click', loadMCPStatus);
    document.getElementById('testToolBtn').addEventListener('click', testMCPTool);
    
    // Tools dropdown
    document.getElementById('toolsDropdownBtn').addEventListener('click', toggleToolsDropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.tools-dropdown');
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Testing controls
    document.getElementById('runCompleteTestBtn').addEventListener('click', runCompleteTest);
    document.getElementById('testMemoryBtn').addEventListener('click', () => testIndividualSystem('memory'));
    document.getElementById('testRagOnlyBtn').addEventListener('click', () => testIndividualSystem('rag'));
    document.getElementById('testMcpOnlyBtn').addEventListener('click', () => testIndividualSystem('mcp'));
    document.getElementById('systemHealthBtn').addEventListener('click', checkSystemHealth);
    
    // Analytics controls
    document.getElementById('refreshStatsBtn').addEventListener('click', loadSystemStats);
}

function setupRAGEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // File upload drag and drop
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFileUpload(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
    });
    
    // RAG controls
    document.getElementById('addTextBtn').addEventListener('click', addTextDocument);
    document.getElementById('searchBtn').addEventListener('click', searchDocuments);
    document.getElementById('testRagBtn').addEventListener('click', testRAGSystem);
    document.getElementById('refreshDocsBtn').addEventListener('click', loadDocuments);
    document.getElementById('ragStatsBtn').addEventListener('click', loadRAGStats);
}

function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    console.log('🔌 Initializing WebSocket connection to:', wsUrl);
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected successfully');
            updateSystemStatus('connected', 'Connected');
        };
        
        ws.onmessage = (event) => {
            console.log('📨 Frontend received WebSocket message:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('📋 Frontend parsed message data:', data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('❌ Frontend failed to parse WebSocket message:', error);
            }
        };
        
        ws.onclose = (event) => {
            console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
            updateSystemStatus('error', 'Disconnected');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                console.log('🔄 Attempting to reconnect WebSocket...');
                initializeWebSocket();
            }, 5000);
        };
        
        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            updateSystemStatus('error', 'Connection Error');
        };
    } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
        updateSystemStatus('error', 'Connection Failed');
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'chat_start':
            handleChatStart(data);
            break;
        case 'chat_status':
            handleChatStatus(data);
            break;
        case 'chat_stream':
            handleChatStream(data);
            break;
        case 'chat_response':
            handleChatResponse(data.response);
            break;
        case 'chat_error':
            handleChatError(data);
            break;
        case 'error':
            showToast('Error: ' + data.message, 'error');
            break;
        default:
            console.log('Unknown WebSocket message:', data);
    }
}

// Utility functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function updateSessionInfo() {
    document.getElementById('sessionId').textContent = currentSessionId.substring(0, 8) + '...';
    document.getElementById('userId').value = currentUserId;
    document.getElementById('messageCount').textContent = messageCount;
}

function updateSystemStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    indicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

async function loadTabData(tabName) {
    switch (tabName) {
        case 'memory':
            await loadMemoryData();
            break;
        case 'rag':
            await loadRAGData();
            break;
        case 'mcp':
            await loadMCPData();
            break;
        case 'analytics':
            await loadAnalyticsData();
            break;
    }
}

function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
    overlay.classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// API functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
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
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
}

// Chat functions
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    console.log('💬 sendMessage called with message:', message);
    
    if (!message) {
        console.log('❌ Empty message, returning');
        return;
    }
    
    // Clear input and add user message to chat
    input.value = '';
    addMessageToChat('user', message);
    
    console.log('📝 User message added to chat');
    console.log('🔌 WebSocket state:', ws ? ws.readyState : 'null');
    console.log('🔌 WebSocket.OPEN constant:', WebSocket.OPEN);
    
    try {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('✅ WebSocket is open, sending message via WebSocket');
            
            const messageData = {
                type: 'chat',
                message,
                sessionId: currentSessionId,
                userId: currentUserId
            };
            
            console.log('📤 Sending WebSocket message:', messageData);
            ws.send(JSON.stringify(messageData));
            console.log('✅ WebSocket message sent successfully');
            
        } else {
            console.log('❌ WebSocket not available, falling back to HTTP API');
            console.log('🔌 WebSocket state details:', {
                exists: !!ws,
                readyState: ws ? ws.readyState : 'null',
                expectedState: WebSocket.OPEN
            });
            
            // Fallback to HTTP API
            console.log('📡 Making HTTP API call...');
            const response = await apiCall('/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message,
                    sessionId: currentSessionId,
                    userId: currentUserId
                })
            });
            
            console.log('✅ HTTP API response received:', response);
            handleChatResponse(response);
        }
    } catch (error) {
        console.error('❌ Error in sendMessage:', error);
        showToast('Failed to send message: ' + error.message, 'error');
        addMessageToChat('system', 'Error: Failed to send message');
    }
}

function handleChatResponse(response) {
    addMessageToChat('assistant', response.content, response.context);
    messageCount++;
    updateSessionInfo();
}

function addMessageToChat(role, content, context = null) {
    const messagesContainer = document.getElementById('chatMessages');
    
    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);
    
    // Add MCP tools display for assistant messages
    if (role === 'assistant' && context && context.mcpTools && context.mcpTools.length > 0) {
        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'mcp-tools-used';
        toolsDiv.innerHTML = '<h4>🔧 Tools Used:</h4>';
        
        context.mcpTools.forEach(tool => {
            const toolDiv = document.createElement('div');
            toolDiv.className = `tool-result ${tool.success ? 'success' : 'error'}`;
            
            toolDiv.innerHTML = `
                <div class="tool-header">
                    <span class="tool-name">${tool.toolName || tool.name}</span>
                    <span class="tool-status">${tool.success ? '✅' : '❌'}</span>
                </div>
                <div class="tool-details">
                    ${tool.parameters ? `<div class="tool-params"><strong>Parameters:</strong> ${JSON.stringify(tool.parameters)}</div>` : ''}
                    <div class="tool-result-content">
                        <strong>${tool.success ? 'Result:' : 'Error:'}</strong> 
                        ${tool.success ? tool.result : tool.error}
                    </div>
                </div>
            `;
            
            toolsDiv.appendChild(toolDiv);
        });
        
        messageDiv.appendChild(toolsDiv);
    }
    
    // Add context information for assistant messages
    if (role === 'assistant' && context) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        
        const metaInfo = [];
        if (context.usedRAG) metaInfo.push(`📚 RAG: ${context.ragSources?.length || 0} sources`);
        if (context.usedMCP) metaInfo.push(`🔧 MCP: ${context.mcpTools?.length || 0} tools`);
        if (context.memoryContext) metaInfo.push(`🧠 Memory: ${context.memoryContext.messageCount} msgs`);
        
        metaDiv.textContent = metaInfo.join(' | ');
        messageDiv.appendChild(metaDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function clearChat() {
    try {
        await apiCall(`/chat/${currentSessionId}`, { method: 'DELETE' });
        
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>Chat Cleared!</h3>
                <p>Start a new conversation to test the chatbot's capabilities.</p>
            </div>
        `;
        
        messageCount = 0;
        updateSessionInfo();
        showToast('Chat cleared successfully', 'success');
    } catch (error) {
        showToast('Failed to clear chat: ' + error.message, 'error');
    }
}

function exportChat() {
    // Get all messages
    const messages = Array.from(document.querySelectorAll('.message')).map(msg => {
        const role = msg.classList.contains('user') ? 'user' : 'assistant';
        const content = msg.querySelector('div').textContent;
        return { role, content, timestamp: new Date().toISOString() };
    });
    
    const exportData = {
        sessionId: currentSessionId,
        userId: currentUserId,
        exportDate: new Date().toISOString(),
        messages
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${currentSessionId.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Chat exported successfully', 'success');
}

function createNewSession() {
    currentSessionId = generateUUID();
    messageCount = 0;
    updateSessionInfo();
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <h3>New Session Started!</h3>
            <p>Session ID: ${currentSessionId}</p>
            <p>Start chatting to test the chatbot's capabilities.</p>
        </div>
    `;
    
    showToast('New session created', 'success');
}

// Memory functions
async function loadMemoryData() {
    await Promise.all([
        loadShortTermMemory(),
        loadLongTermMemory(),
        loadMemoryStats()
    ]);
}

async function loadShortTermMemory() {
    try {
        const data = await apiCall(`/memory/short-term/${currentSessionId}`);
        displayMemoryData('shortTermMemory', data);
    } catch (error) {
        document.getElementById('shortTermMemory').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

async function loadLongTermMemory() {
    try {
        const data = await apiCall(`/memory/long-term/${currentUserId}`);
        displayMemoryData('longTermMemory', data);
    } catch (error) {
        document.getElementById('longTermMemory').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

async function loadMemoryStats() {
    try {
        const data = await apiCall('/memory/stats');
        displayMemoryData('memoryStats', data);
    } catch (error) {
        document.getElementById('memoryStats').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

function displayMemoryData(elementId, data) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<pre class="json-display">${JSON.stringify(data, null, 2)}</pre>`;
}

async function testShortTermMemory() {
    try {
        showLoading('Testing short-term memory...');
        
        const testMessages = [
            'My name is Alice and I work as a data scientist',
            'I love hiking and photography in my free time',
            'I have a cat named Whiskers',
            'My favorite programming language is Python',
            'I am working on a machine learning project'
        ];
        
        const data = await apiCall('/memory/test/short-term', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: currentSessionId,
                testMessages
            })
        });
        
        displayMemoryData('shortTermMemory', data);
        showToast('Short-term memory test completed', 'success');
    } catch (error) {
        showToast('Short-term memory test failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function testLongTermMemory() {
    try {
        showLoading('Testing long-term memory...');
        
        const testData = [
            { content: 'User prefers morning meetings', importance: 7.5, type: 'preference' },
            { content: 'User is working on AI research', importance: 8.0, type: 'work' },
            { content: 'User mentioned having a conference next month', importance: 9.0, type: 'important' },
            { content: 'User likes coffee but not tea', importance: 6.0, type: 'preference' },
            { content: 'User has experience with deep learning', importance: 8.5, type: 'skill' }
        ];
        
        const data = await apiCall('/memory/test/long-term', {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUserId,
                testData
            })
        });
        
        displayMemoryData('longTermMemory', data);
        showToast('Long-term memory test completed', 'success');
    } catch (error) {
        showToast('Long-term memory test failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// RAG functions
async function loadRAGData() {
    await Promise.all([
        loadDocuments(),
        loadRAGStats()
    ]);
}

async function handleFileUpload(files) {
    for (const file of files) {
        try {
            showLoading(`Uploading ${file.name}...`);
            
            const formData = new FormData();
            formData.append('document', file);
            formData.append('title', document.getElementById('documentTitle').value || file.name);
            formData.append('description', document.getElementById('documentDescription').value);
            formData.append('tags', document.getElementById('documentTags').value);
            formData.append('userId', currentUserId);
            
            const response = await fetch(`${API_BASE}/rag/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            showToast(`Document "${file.name}" uploaded successfully`, 'success');
            
            // Clear form
            document.getElementById('documentTitle').value = '';
            document.getElementById('documentDescription').value = '';
            document.getElementById('documentTags').value = '';
            
            // Refresh documents list
            await loadDocuments();
            
        } catch (error) {
            showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
        }
    }
    
    hideLoading();
}

async function addTextDocument() {
    const content = document.getElementById('textContent').value.trim();
    if (!content) {
        showToast('Please enter some text content', 'warning');
        return;
    }
    
    try {
        showLoading('Adding text document...');
        
        const data = await apiCall('/rag/add-text', {
            method: 'POST',
            body: JSON.stringify({
                content,
                metadata: {
                    title: 'Text Document',
                    addedBy: currentUserId,
                    type: 'text'
                }
            })
        });
        
        document.getElementById('textContent').value = '';
        showToast('Text document added successfully', 'success');
        await loadDocuments();
        
    } catch (error) {
        showToast('Failed to add text document: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function searchDocuments() {
    const query = document.getElementById('searchQuery').value.trim();
    if (!query) {
        showToast('Please enter a search query', 'warning');
        return;
    }
    
    try {
        showLoading('Searching documents...');
        
        const data = await apiCall('/rag/search', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        
        displaySearchResults(data);
        
    } catch (error) {
        document.getElementById('searchResults').innerHTML = `<p class="error-text">Search failed: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}

function displaySearchResults(data) {
    const container = document.getElementById('searchResults');
    
    if (!data.context || data.relevantChunks === 0) {
        container.innerHTML = '<p>No relevant results found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="search-summary">
            <p><strong>Found ${data.relevantChunks} relevant chunks from ${data.sources.length} sources</strong></p>
            <p class="text-small text-muted">Sources: ${data.sources.join(', ')}</p>
        </div>
        <div class="search-context">
            <pre class="json-display">${data.context}</pre>
        </div>
    `;
}

async function loadDocuments() {
    try {
        const data = await apiCall('/rag/documents');
        displayDocuments(data.documents);
    } catch (error) {
        document.getElementById('documentsList').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

function displayDocuments(documents) {
    const container = document.getElementById('documentsList');
    
    if (!documents || documents.length === 0) {
        container.innerHTML = '<p>No documents uploaded yet</p>';
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="document-item">
            <div class="document-title">${doc.metadata?.title || 'Untitled Document'}</div>
            <div class="document-meta">
                ID: ${doc.id} | Chunks: ${doc.chunkCount} | 
                Uploaded: ${new Date(doc.timestamp).toLocaleString()}
            </div>
            <div class="document-preview">${doc.preview}</div>
        </div>
    `).join('');
}

async function loadRAGStats() {
    try {
        const data = await apiCall('/rag/stats');
        displayMemoryData('ragStatsDisplay', data);
    } catch (error) {
        console.error('Failed to load RAG stats:', error);
    }
}

async function testRAGSystem() {
    try {
        showLoading('Testing RAG system...');
        
        const data = await apiCall('/rag/test', {
            method: 'POST',
            body: JSON.stringify({
                query: 'What is artificial intelligence and machine learning?'
            })
        });
        
        displaySearchResults(data);
        showToast('RAG system test completed', 'success');
        
    } catch (error) {
        showToast('RAG test failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// MCP functions
async function loadMCPData() {
    await Promise.all([
        loadMCPStatus(),
        loadMCPTools(),
        loadMCPResources()
    ]);
}

async function loadMCPStatus() {
    try {
        // Use the new admin MCP system health endpoint
        const healthData = await apiCall('/mcp/health');
        const serversData = await apiCall('/mcp/servers');
        
        const status = {
            enabled: true,
            message: "MCP Admin System Active",
            servers: serversData.servers?.length || 0,
            healthyServers: healthData.health?.filter(h => h.healthy).length || 0,
            totalTools: healthData.health?.reduce((sum, h) => sum + (h.availableTools || 0), 0) || 0,
            health: healthData.health
        };
        
        displayMemoryData('mcpStatus', status);
    } catch (error) {
        document.getElementById('mcpStatus').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

async function loadMCPTools() {
    try {
        // Try the regular tools endpoint first
        let data = await apiCall('/mcp/tools');
        
        // If tools is empty, try the debug endpoint
        if (!data.tools || data.tools.length === 0) {
            console.log('Tools endpoint returned empty, trying debug endpoint...');
            const debugData = await apiCall('/mcp/debug/tools');
            if (debugData.rawTools && debugData.rawTools.length > 0) {
                data = { tools: debugData.rawTools };
                console.log('Using tools from debug endpoint:', data.tools.length);
            }
        }
        
        displayMCPTools(data.tools);
        populateToolSelect(data.tools);
    } catch (error) {
        document.getElementById('mcpTools').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

async function loadMCPResources() {
    try {
        const data = await apiCall('/mcp/resources');
        displayMCPResources(data.resources);
    } catch (error) {
        document.getElementById('mcpResources').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

function displayMCPTools(tools) {
    const container = document.getElementById('mcpTools');
    
    if (!tools || tools.length === 0) {
        container.innerHTML = '<p>No MCP tools available</p>';
        return;
    }
    
    container.innerHTML = tools.map(tool => `
        <div class="tool-item">
            <div class="tool-name">${tool.name}</div>
            <div class="tool-description">${tool.description || 'No description available'}</div>
        </div>
    `).join('');
}

function displayMCPResources(resources) {
    const container = document.getElementById('mcpResources');
    
    if (!resources || resources.length === 0) {
        container.innerHTML = '<p>No MCP resources available</p>';
        return;
    }
    
    container.innerHTML = resources.map(resource => `
        <div class="resource-item">
            <div class="resource-name">${resource.name || resource.uri}</div>
            <div class="resource-description">${resource.description || resource.uri}</div>
        </div>
    `).join('');
}

function populateToolSelect(tools) {
    const select = document.getElementById('toolSelect');
    select.innerHTML = '<option value="">Select a tool...</option>';
    
    tools.forEach(tool => {
        const option = document.createElement('option');
        option.value = tool.name;
        option.textContent = tool.name;
        select.appendChild(option);
    });
}

async function testMCPTool() {
    const toolName = document.getElementById('toolSelect').value;
    const parametersText = document.getElementById('toolParameters').value.trim();
    
    if (!toolName) {
        showToast('Please select a tool', 'warning');
        return;
    }
    
    let parameters = {};
    if (parametersText) {
        try {
            parameters = JSON.parse(parametersText);
        } catch (error) {
            showToast('Invalid JSON parameters', 'error');
            return;
        }
    }
    
    try {
        showLoading(`Executing tool: ${toolName}...`);
        
        // Find which server this tool belongs to
        const debugData = await apiCall('/mcp/debug/tools');
        const tool = debugData.rawTools?.find(t => t.name === toolName);
        
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }
        
        const serverName = tool.server;
        
        // Call the correct endpoint with server name
        const data = await apiCall(`/mcp/tools/${serverName}/${toolName}/call`, {
            method: 'POST',
            body: JSON.stringify({ arguments: parameters })
        });
        
        displayMemoryData('toolResults', data);
        showToast('Tool executed successfully', 'success');
        
    } catch (error) {
        document.getElementById('toolResults').innerHTML = `<p class="error-text">Tool execution failed: ${error.message}</p>`;
        showToast('Tool execution failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Testing functions
async function runCompleteTest() {
    const testOptions = {
        testShortTermMemory: document.getElementById('testShortMemory').checked,
        testLongTermMemory: document.getElementById('testLongMemory').checked,
        testRAG: document.getElementById('testRAGSystem').checked,
        testMCP: document.getElementById('testMCPSystem').checked,
        sessionId: currentSessionId,
        userId: currentUserId
    };
    
    try {
        showLoading('Running comprehensive tests...');
        
        const data = await apiCall('/test/complete', {
            method: 'POST',
            body: JSON.stringify(testOptions)
        });
        
        displayTestResults(data);
        showToast('Complete test finished', 'success');
        
    } catch (error) {
        showToast('Complete test failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function testIndividualSystem(system) {
    try {
        showLoading(`Testing ${system} system...`);
        
        let data;
        switch (system) {
            case 'memory':
                data = await Promise.all([
                    testShortTermMemory(),
                    testLongTermMemory()
                ]);
                break;
            case 'rag':
                data = await apiCall('/rag/test', {
                    method: 'POST',
                    body: JSON.stringify({ query: 'test query for RAG system' })
                });
                break;
            case 'mcp':
                data = await apiCall('/mcp/test');
                break;
        }
        
        displayTestResults({ [system]: data });
        showToast(`${system} test completed`, 'success');
        
    } catch (error) {
        showToast(`${system} test failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function displayTestResults(data) {
    const container = document.getElementById('testResults');
    container.innerHTML = `<pre class="json-display">${JSON.stringify(data, null, 2)}</pre>`;
}

// Analytics functions
async function loadAnalyticsData() {
    await Promise.all([
        loadSystemStats(),
        loadSessionHistory(),
        loadMCPLogs()
    ]);
}

async function loadSystemStats() {
    try {
        const data = await apiCall('/system/stats');
        displayMemoryData('systemStats', data);
    } catch (error) {
        document.getElementById('systemStats').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

async function loadSessionHistory() {
    try {
        const data = await apiCall('/database/sessions?limit=10');
        displaySessionHistory(data.sessions);
    } catch (error) {
        document.getElementById('sessionHistory').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

async function loadMCPLogs() {
    try {
        const data = await apiCall('/database/mcp-logs?limit=20');
        displayMCPLogs(data.logs);
    } catch (error) {
        document.getElementById('mcpLogs').innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
}

function displaySessionHistory(sessions) {
    const container = document.getElementById('sessionHistory');
    
    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p>No session history available</p>';
        return;
    }
    
    container.innerHTML = sessions.map(session => `
        <div class="session-item">
            <strong>Session:</strong> ${session.id}<br>
            <strong>User:</strong> ${session.user_id}<br>
            <strong>Created:</strong> ${new Date(session.created_at).toLocaleString()}<br>
            <strong>Updated:</strong> ${new Date(session.updated_at).toLocaleString()}
        </div>
    `).join('<hr>');
}

function displayMCPLogs(logs) {
    const container = document.getElementById('mcpLogs');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p>No MCP logs available</p>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="log-item">
            <strong>Tool:</strong> ${log.tool_name}<br>
            <strong>Success:</strong> ${log.success ? 'Yes' : 'No'}<br>
            <strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}<br>
            <strong>Execution Time:</strong> ${log.execution_time}ms
        </div>
    `).join('<hr>');
}

// System health check
async function checkSystemHealth() {
    try {
        const data = await apiCall('/system/health');
        updateSystemHealthStatus(data);
        return data;
    } catch (error) {
        console.error('System health check failed:', error);
        updateSystemStatus('error', 'Health Check Failed');
        return null;
    }
}

function updateSystemHealthStatus(healthData) {
    const allHealthy = Object.values(healthData).every(system => 
        typeof system === 'object' ? system.healthy : true
    );
    
    if (allHealthy) {
        updateSystemStatus('connected', 'All Systems Healthy');
    } else {
        updateSystemStatus('warning', 'Some Systems Offline');
    }
}

// Tools dropdown functions
function toggleToolsDropdown(e) {
    e.stopPropagation();
    const dropdown = document.querySelector('.tools-dropdown');
    dropdown.classList.toggle('active');
    
    // Load tools if dropdown is opened
    if (dropdown.classList.contains('active')) {
        loadToolsDropdown();
    }
}

async function loadToolsDropdown() {
    try {
        // Try the regular tools endpoint first
        let data = await apiCall('/mcp/tools');
        
        // If tools is empty, try the debug endpoint
        if (!data.tools || data.tools.length === 0) {
            const debugData = await apiCall('/mcp/debug/tools');
            if (debugData.rawTools && debugData.rawTools.length > 0) {
                data = { tools: debugData.rawTools };
            }
        }
        
        displayToolsDropdown(data.tools || []);
        updateToolsCount(data.tools?.length || 0);
        
    } catch (error) {
        console.error('Failed to load tools dropdown:', error);
        document.getElementById('toolsList').innerHTML = '<p class="error-text">Failed to load tools</p>';
        document.getElementById('toolsStatus').textContent = 'Error loading tools';
    }
}

async function displayToolsDropdown(tools) {
    const container = document.getElementById('toolsList');
    const statusElement = document.getElementById('toolsStatus');
    
    if (!tools || tools.length === 0) {
        container.innerHTML = '<p>No MCP tools available</p>';
        statusElement.textContent = 'No tools available';
        return;
    }
    
    // Get server information
    let servers = [];
    try {
        const serversData = await apiCall('/mcp/servers');
        servers = serversData.servers || [];
    } catch (error) {
        console.error('Failed to load servers:', error);
    }
    
    // Group tools by server
    const toolsByServer = tools.reduce((acc, tool) => {
        const server = tool.server || 'Unknown';
        if (!acc[server]) acc[server] = [];
        acc[server].push(tool);
        return acc;
    }, {});
    
    const totalServers = Object.keys(toolsByServer).length;
    statusElement.textContent = `${totalServers} MCP servers, ${tools.length} tools`;
    
    container.innerHTML = Object.entries(toolsByServer).map(([serverName, serverTools]) => {
        const serverInfo = servers.find(s => s.name === serverName);
        const serverDescription = serverInfo?.description || 'MCP Server';
        const serverStatus = serverInfo?.enabled ? 'online' : 'offline';
        
        return `
            <div class="mcp-server-group">
                <div class="mcp-server-header" onclick="toggleServerTools('${serverName}')">
                    <div class="mcp-server-info">
                        <div class="mcp-server-name">
                            <i class="fas fa-server"></i>
                            ${serverName}
                            <span class="mcp-server-status ${serverStatus}">
                                <i class="fas fa-circle"></i>
                            </span>
                        </div>
                        <div class="mcp-server-description">${serverDescription}</div>
                        <div class="mcp-server-meta">${serverTools.length} tools available</div>
                    </div>
                    <div class="mcp-server-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="mcp-server-tools" id="server-tools-${serverName}">
                    ${serverTools.map(tool => `
                        <div class="dropdown-tool-item" onclick="selectToolFromDropdown('${tool.name}', '${serverName}')">
                            <div class="dropdown-tool-info">
                                <div class="dropdown-tool-name">
                                    <i class="fas fa-wrench"></i>
                                    ${tool.name}
                                </div>
                                <div class="dropdown-tool-description">${tool.description || 'No description available'}</div>
                            </div>
                            <div class="dropdown-tool-status">
                                <i class="fas fa-circle"></i>
                                <span>Ready</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function toggleServerTools(serverName) {
    const toolsContainer = document.getElementById(`server-tools-${serverName}`);
    const serverHeader = toolsContainer.previousElementSibling;
    const chevron = serverHeader.querySelector('.fa-chevron-down');
    
    if (toolsContainer.style.display === 'none' || !toolsContainer.style.display) {
        toolsContainer.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
        serverHeader.classList.add('expanded');
    } else {
        toolsContainer.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
        serverHeader.classList.remove('expanded');
    }
}

function selectToolFromDropdown(toolName, serverName) {
    // Close dropdown
    document.querySelector('.tools-dropdown').classList.remove('active');
    
    // Show tool info in a toast
    showToast(`Selected tool: ${toolName} from ${serverName}`, 'info');
    
    // You could also auto-fill the tool test section if needed
    const toolSelect = document.getElementById('toolSelect');
    if (toolSelect) {
        toolSelect.value = toolName;
    }
}

function updateToolsCount(count) {
    document.getElementById('toolsCount').textContent = `(${count})`;
}

// Enhanced message display with tool execution indicators
function addToolExecutionIndicator(messageDiv, toolName) {
    const indicator = document.createElement('div');
    indicator.className = 'tool-execution-indicator';
    indicator.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <span>Executing ${toolName}...</span>
    `;
    messageDiv.appendChild(indicator);
    return indicator;
}

function removeToolExecutionIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

// Streaming response handlers
let currentStreamingMessage = null;
let currentLoadingIndicator = null;

function handleChatStart(data) {
    // Add loading message to chat
    currentLoadingIndicator = addLoadingMessageToChat();
}

function handleChatStatus(data) {
    // Update loading message with current status
    if (currentLoadingIndicator) {
        updateLoadingMessage(currentLoadingIndicator, data.message);
    }
}

function handleChatStream(data) {
    // Handle streaming updates
    if (currentLoadingIndicator) {
        updateLoadingMessage(currentLoadingIndicator, data.message);
        
        // If this is a tool execution, show tool indicator
        if (data.status === 'tool_execution' && data.toolName) {
            updateLoadingMessage(currentLoadingIndicator, `🔧 ${data.message}`);
        } else if (data.status === 'tool_complete' && data.toolName) {
            updateLoadingMessage(currentLoadingIndicator, `✅ ${data.message}`);
        } else if (data.status === 'tool_error' && data.toolName) {
            updateLoadingMessage(currentLoadingIndicator, `❌ ${data.message}`);
        }
    }
}

function handleChatError(data) {
    // Remove loading indicator and show error
    if (currentLoadingIndicator) {
        removeLoadingMessage(currentLoadingIndicator);
        currentLoadingIndicator = null;
    }
    
    addMessageToChat('system', `Error: ${data.error}`);
    showToast('Chat error: ' + data.error, 'error');
}

function addLoadingMessageToChat() {
    const messagesContainer = document.getElementById('chatMessages');
    
    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message-content loading-content';
    loadingDiv.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <span class="loading-text">Processing your message...</span>
        </div>
    `;
    
    messageDiv.appendChild(loadingDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

function updateLoadingMessage(loadingElement, message) {
    const loadingText = loadingElement.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function removeLoadingMessage(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

// Enhanced handleChatResponse with loading indicator removal
function handleChatResponse(response) {
    console.log('🎯 handleChatResponse called with:', response);
    
    // Remove loading indicator
    if (currentLoadingIndicator) {
        console.log('🗑️ Removing loading indicator');
        removeLoadingMessage(currentLoadingIndicator);
        currentLoadingIndicator = null;
    }
    
    // Add the response message to chat
    addMessageToChat('assistant', response.content, response.context);
    messageCount++;
    updateSessionInfo();
    
    console.log('✅ Chat response handled successfully');
}

// Load initial data
async function loadInitialData() {
    try {
        // Load basic system information
        await checkSystemHealth();
        
        // Load memory stats
        await loadMemoryStats();
        
        // Load tools count for dropdown
        await loadToolsDropdown();
        
        console.log('Initial data loaded successfully');
    } catch (error) {
        console.error('Failed to load initial data:', error);
        showToast('Failed to load initial data', 'warning');
    }
}
