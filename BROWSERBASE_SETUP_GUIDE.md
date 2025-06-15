# Browserbase MCP Server Setup Guide

This guide will help you set up the Browserbase MCP server for cloud browser automation in the Agent STM chatbot.

## 🌐 What is Browserbase?

Browserbase provides cloud browser automation capabilities, allowing the AI chatbot to:
- **Navigate websites** and interact with web pages
- **Take screenshots** of any webpage
- **Extract data** from websites automatically
- **Fill forms** and submit information
- **Manage browser sessions** with persistence
- **Use proxies** and stealth mode for enhanced privacy

## 📋 Prerequisites

1. **Browserbase Account**: Sign up at [browserbase.com](https://www.browserbase.com/)
2. **API Credentials**: Get your API key and project ID from the dashboard

## 🚀 Quick Setup

### Step 1: Get Browserbase Credentials

1. **Sign up** at [browserbase.com](https://www.browserbase.com/)
2. **Create a project** in your dashboard
3. **Copy your API key** from the settings page
4. **Copy your project ID** from the project dashboard

### Step 2: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Browserbase Configuration
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
BROWSERBASE_ENABLED=true
```

### Step 3: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd backend
npm start
```

### Step 4: Verify Integration

1. Open the chatbot interface at `http://localhost:3001`
2. Try a command like: **"Take a screenshot of google.com"**
3. The AI should use Browserbase to capture the screenshot

## 🔧 Advanced Configuration

### Optional Environment Variables

```env
# Browser Configuration
BROWSERBASE_BROWSER_WIDTH=1920
BROWSERBASE_BROWSER_HEIGHT=1080

# Feature Flags
BROWSERBASE_PROXIES=true
BROWSERBASE_ADVANCED_STEALTH=true
BROWSERBASE_PERSIST=true

# Server Configuration
BROWSERBASE_MCP_PORT=8932
BROWSERBASE_MCP_HOST=localhost
```

### Feature Explanations

- **BROWSERBASE_PROXIES**: Enable proxy rotation for enhanced privacy
- **BROWSERBASE_ADVANCED_STEALTH**: Bypass detection systems (requires Scale plan)
- **BROWSERBASE_PERSIST**: Maintain browser state across sessions
- **Browser Dimensions**: Set custom viewport size (recommended: 16:9 ratios)

## 💬 Example Usage

Once configured, you can use these commands in the chat:

### Web Screenshots
```
"Take a screenshot of github.com"
"Capture the homepage of reddit.com"
"Show me what apple.com looks like"
```

### Web Scraping
```
"Get the latest news headlines from bbc.com"
"Extract the product prices from amazon.com search for 'laptops'"
"Find the contact information on company-website.com"
```

### Web Interaction
```
"Search for 'AI news' on Google and get the first 5 results"
"Fill out the contact form on example.com with my details"
"Navigate to twitter.com and check trending topics"
```

### Data Extraction
```
"Get all the links from the homepage of wikipedia.org"
"Extract the table data from this financial report page"
"Find all the email addresses mentioned on this page"
```

## 🛠️ Available Browserbase Tools

The integration provides these MCP tools:

### Session Management
- `browserbase_session_create`: Start a new browser session
- `browserbase_session_close`: Close an existing session
- `browserbase_session_list`: List all active sessions

### Navigation & Interaction
- `browserbase_navigate`: Go to a specific URL
- `browserbase_click`: Click on page elements
- `browserbase_type`: Type text into input fields
- `browserbase_scroll`: Scroll the page up/down
- `browserbase_wait`: Wait for elements to load

### Data Extraction
- `browserbase_screenshot`: Capture page screenshots
- `browserbase_get_text`: Extract text from elements
- `browserbase_get_html`: Get HTML source code
- `browserbase_evaluate`: Execute custom JavaScript

### Context Management
- `browserbase_context_create`: Create persistent contexts
- `browserbase_context_delete`: Remove contexts
- `browserbase_context_list`: List available contexts

### Cookie Management
- `browserbase_cookies_add`: Add cookies to session
- `browserbase_cookies_get`: Retrieve session cookies
- `browserbase_cookies_delete`: Remove specific cookies

## 🔍 Troubleshooting

### Common Issues

1. **"Browserbase not available" error**
   - Check that `BROWSERBASE_ENABLED=true` in your .env file
   - Verify your API key and project ID are correct
   - Restart the server after configuration changes

2. **Authentication errors**
   - Verify your Browserbase account is active
   - Check that you have sufficient credits
   - Ensure API key has proper permissions

3. **Session creation failures**
   - Check your Browserbase plan limits
   - Verify network connectivity
   - Review Browserbase dashboard for errors

4. **Slow responses**
   - Browserbase operations can take 5-15 seconds
   - Complex pages may take longer to load
   - Consider using faster browser dimensions

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
BROWSERBASE_DEBUG=true
```

### Check Server Status

Visit the MCP status page in the chatbot interface to verify Browserbase connectivity.

## 💰 Browserbase Pricing

- **Free Tier**: Limited sessions for testing
- **Starter Plan**: $20/month for regular usage
- **Scale Plan**: $100/month with advanced features (stealth mode, etc.)

Check [browserbase.com/pricing](https://www.browserbase.com/pricing) for current pricing.

## 🔒 Security Considerations

- **API Key Protection**: Never commit API keys to version control
- **Session Management**: Always close sessions when done to avoid charges
- **Data Privacy**: Be mindful of sensitive data in screenshots
- **Rate Limiting**: Respect Browserbase rate limits and quotas

## 📚 Additional Resources

- **Browserbase Documentation**: [docs.browserbase.com](https://docs.browserbase.com/)
- **Browserbase Support**: [support.browserbase.com](https://support.browserbase.com/)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## 🎯 Next Steps

1. **Set up your Browserbase account** and get credentials
2. **Configure the environment variables** in your .env file
3. **Restart the server** and test with a simple screenshot command
4. **Explore advanced features** like context persistence and stealth mode
5. **Integrate with your workflows** for automated web tasks

---

**🌐 With Browserbase integrated, your Agent STM chatbot now has powerful web automation capabilities for scraping, testing, and interacting with any website on the internet!**
