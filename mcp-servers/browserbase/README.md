# Browserbase MCP Server

This MCP server provides cloud browser automation capabilities using [Browserbase](https://www.browserbase.com/). It enables LLMs to interact with web pages, take screenshots, and execute JavaScript in a cloud browser environment.

## Features

- **Cloud Browser Automation**: Control browsers running in the cloud
- **Web Interaction**: Navigate, click, type, and interact with web elements
- **Screenshot Capture**: Take full-page and element-specific screenshots
- **Data Extraction**: Extract structured data from web pages
- **Console Monitoring**: Track browser console logs and errors
- **Context Persistence**: Maintain browser state across sessions
- **Cookie Management**: Add, get, and delete cookies
- **Proxy Support**: Use Browserbase proxies for enhanced privacy
- **Advanced Stealth**: Bypass detection with advanced stealth mode

## Prerequisites

1. **Browserbase Account**: Sign up at [browserbase.com](https://www.browserbase.com/)
2. **API Credentials**: Get your API key and project ID from the Browserbase dashboard

## Configuration

### Environment Variables

Create or update your `.env` file with the following variables:

```env
# Browserbase Configuration (Required)
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here

# Server Configuration (Optional)
BROWSERBASE_MCP_PORT=8932
BROWSERBASE_MCP_HOST=localhost

# Browser Configuration (Optional)
BROWSERBASE_BROWSER_WIDTH=1024
BROWSERBASE_BROWSER_HEIGHT=768

# Feature Flags (Optional)
BROWSERBASE_PROXIES=false
BROWSERBASE_ADVANCED_STEALTH=false
BROWSERBASE_PERSIST=true

# Advanced Configuration (Optional)
BROWSERBASE_CONTEXT_ID=your_context_id
BROWSERBASE_COOKIES={"cookies": []}
```

### Getting Browserbase Credentials

1. Sign up at [browserbase.com](https://www.browserbase.com/)
2. Create a new project in your dashboard
3. Copy your API key from the settings page
4. Copy your project ID from the project dashboard

## Installation

1. **Install dependencies:**
```bash
cd mcp-servers/browserbase
npm install
```

2. **Configure environment variables:**
```bash
# Copy the example environment file
cp ../../backend/.env.example .env

# Edit the .env file and add your Browserbase credentials
nano .env
```

3. **Test the server:**
```bash
npm start
```

## Usage

### Starting the Server

```bash
# Start the Browserbase MCP server
npm start

# Or run in development mode with auto-restart
npm run dev
```

### Available Tools

The Browserbase MCP server provides the following tools:

#### Browser Session Management
- `browserbase_session_create`: Create a new browser session
- `browserbase_session_close`: Close an existing browser session
- `browserbase_session_list`: List all active sessions

#### Navigation & Interaction
- `browserbase_navigate`: Navigate to a URL
- `browserbase_click`: Click on elements
- `browserbase_type`: Type text into input fields
- `browserbase_scroll`: Scroll the page
- `browserbase_wait`: Wait for elements or conditions

#### Data Extraction
- `browserbase_screenshot`: Take screenshots
- `browserbase_get_text`: Extract text from elements
- `browserbase_get_html`: Get HTML content
- `browserbase_evaluate`: Execute JavaScript

#### Context Management
- `browserbase_context_create`: Create a new context for persistence
- `browserbase_context_delete`: Delete a context
- `browserbase_context_list`: List available contexts

#### Cookie Management
- `browserbase_cookies_add`: Add cookies to the session
- `browserbase_cookies_get`: Get cookies from the session
- `browserbase_cookies_delete`: Delete cookies

### Example Usage in Chat

```
User: "Take a screenshot of google.com"

AI: I'll help you take a screenshot of Google's homepage. Let me create a browser session and navigate to the site.

[Uses browserbase_session_create to start a new browser session]
[Uses browserbase_navigate to go to google.com]
[Uses browserbase_screenshot to capture the page]

Here's the screenshot of Google's homepage showing the search interface and current layout.
```

```
User: "Search for 'AI news' on Google and get the first 5 results"

AI: I'll search for AI news on Google and extract the first 5 results for you.

[Uses browserbase_session_create to start a browser session]
[Uses browserbase_navigate to go to google.com]
[Uses browserbase_type to enter "AI news" in the search box]
[Uses browserbase_click to click the search button]
[Uses browserbase_get_text to extract the search results]

Here are the first 5 AI news results from Google...
```

## Integration with Agent STM

The Browserbase MCP server is integrated with the Agent STM chatbot system and provides:

- **Semantic Memory Integration**: Browser interactions are stored in the semantic memory system
- **Context Awareness**: The chatbot remembers previous browser sessions and can reference them
- **Multi-turn Conversations**: Complex browser automation tasks across multiple messages
- **Error Handling**: Robust error handling with fallback strategies

## Configuration in Agent STM

The Browserbase MCP server is automatically configured in the Agent STM system. To enable it:

1. **Add Browserbase credentials to your environment:**
```bash
# In backend/.env
BROWSERBASE_API_KEY=your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
BROWSERBASE_ENABLED=true
```

2. **The MCP Manager will automatically detect and connect to the Browserbase server**

3. **Available in chat interface with tools like:**
   - Web scraping and data extraction
   - Automated testing of web applications
   - Screenshot capture for documentation
   - Form filling and submission
   - Multi-step web workflows

## Advanced Features

### Context Persistence

Browserbase contexts allow you to maintain browser state across sessions:

```javascript
// Create a persistent context
browserbase_context_create({ name: "my_session" })

// Use the context in a session
browserbase_session_create({ 
  context: { name: "my_session" },
  persist: true 
})
```

### Proxy Configuration

Enable proxies for enhanced privacy and geo-location:

```env
BROWSERBASE_PROXIES=true
```

### Advanced Stealth Mode

Bypass detection systems (requires Scale plan):

```env
BROWSERBASE_ADVANCED_STEALTH=true
```

### Custom Browser Dimensions

Set custom viewport sizes:

```env
BROWSERBASE_BROWSER_WIDTH=1920
BROWSERBASE_BROWSER_HEIGHT=1080
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your API key and project ID are correct
   - Check that your Browserbase account is active
   - Ensure you have sufficient credits

2. **Session Creation Failures**
   - Check your Browserbase plan limits
   - Verify network connectivity
   - Review Browserbase dashboard for errors

3. **Tool Execution Timeouts**
   - Increase timeout values in configuration
   - Check for slow-loading websites
   - Verify element selectors are correct

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
BROWSERBASE_DEBUG=true
```

### Support

- **Browserbase Documentation**: [docs.browserbase.com](https://docs.browserbase.com/)
- **Browserbase Support**: [support.browserbase.com](https://support.browserbase.com/)
- **Agent STM Issues**: Create an issue in the repository

## Security Considerations

- **API Key Protection**: Never commit API keys to version control
- **Session Management**: Always close sessions when done
- **Data Privacy**: Be mindful of sensitive data in screenshots
- **Rate Limiting**: Respect Browserbase rate limits and quotas

## License

This MCP server wrapper is licensed under the MIT License. The underlying Browserbase service has its own terms of service.
