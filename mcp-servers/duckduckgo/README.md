# DuckDuckGo MCP Server

This MCP server provides web search capabilities through DuckDuckGo, with additional features for content fetching and parsing. It runs as a Docker container and exposes HTTP endpoints for the Agent STM chatbot to consume.

## Features

- **Web Search**: Search DuckDuckGo with advanced rate limiting and result formatting
- **Content Fetching**: Retrieve and parse webpage content with intelligent text extraction
- **Rate Limiting**: Built-in protection against rate limits for both search and content fetching
- **Error Handling**: Comprehensive error handling and logging
- **LLM-Friendly Output**: Results formatted specifically for large language model consumption
- **HTTP API**: RESTful API for easy integration with Node.js applications

## Architecture

This implementation wraps the original Python-based DuckDuckGo MCP server in a FastAPI HTTP server, making it accessible to our Node.js chatbot system via REST API calls.

## Available Tools

### 1. Search Tool
- **Endpoint**: `POST /search` or `POST /tools/call`
- **Description**: Performs a web search on DuckDuckGo and returns formatted results
- **Parameters**:
  - `query` (string, required): Search query string
  - `max_results` (integer, optional): Maximum number of results to return (default: 10)

### 2. Content Fetching Tool
- **Endpoint**: `POST /fetch` or `POST /tools/call`
- **Description**: Fetches and parses content from a webpage
- **Parameters**:
  - `url` (string, required): The webpage URL to fetch content from

## Setup and Installation

### Using Docker (Recommended)

1. **Build the Docker image:**
```bash
cd mcp-servers/duckduckgo
docker build -t duckduckgo-mcp-server .
```

2. **Run the container:**
```bash
docker run -p 3004:3004 duckduckgo-mcp-server
```

3. **Or use Docker Compose:**
```bash
# From the project root
docker-compose up duckduckgo-mcp
```

### Manual Installation

1. **Install Python dependencies:**
```bash
cd mcp-servers/duckduckgo
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python server.py
```

## Configuration

### Environment Variables

- `MCP_SERVER_PORT`: Port to run the server on (default: 3004)
- `MCP_SERVER_HOST`: Host to bind to (default: 0.0.0.0)

### Agent STM Integration

The DuckDuckGo MCP server is automatically configured in the Agent STM system:

1. **Enable in environment:**
```bash
# In backend/.env
DUCKDUCKGO_ENABLED=true
DUCKDUCKGO_MCP_URL=http://localhost:3004
```

2. **The MCP Manager will automatically detect and connect to the server**

3. **Available in chat interface for:**
   - Web search queries
   - Content extraction from URLs
   - Research and information gathering

## API Endpoints

### Health Check
```http
GET /health
```
Returns server status and available tools.

### List Tools
```http
GET /tools/list
```
Returns information about available tools.

### Call Tool
```http
POST /tools/call
Content-Type: application/json

{
  "name": "search",
  "arguments": {
    "query": "AI news",
    "max_results": 5
  }
}
```

### Direct Search
```http
POST /search
Content-Type: application/json

{
  "query": "machine learning trends",
  "max_results": 10
}
```

### Direct Content Fetch
```http
POST /fetch
Content-Type: application/json

{
  "url": "https://example.com/article"
}
```

## Usage Examples

### In Chat Interface

Once the server is running, you can use these commands in the Agent STM chat:

```
"Search for the latest AI news"
"What are the top results for 'machine learning trends'?"
"Get the content from this URL: https://example.com/article"
"Search DuckDuckGo for 'Python programming tutorials'"
```

### Direct API Usage

```bash
# Search example
curl -X POST http://localhost:3004/search \
  -H "Content-Type: application/json" \
  -d '{"query": "AI news", "max_results": 5}'

# Content fetch example
curl -X POST http://localhost:3004/fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Rate Limiting

- **Search**: Limited to 30 requests per minute
- **Content Fetching**: Limited to 20 requests per minute
- Automatic queue management and wait times
- Graceful degradation on rate limits

## Error Handling

- Comprehensive error catching and reporting
- Detailed logging through FastAPI
- Graceful degradation on timeouts or failures
- Structured error responses for easy debugging

## Integration with Agent STM

The DuckDuckGo MCP server integrates seamlessly with the Agent STM system:

- **Semantic Memory**: Search results are stored in semantic memory for context
- **Multi-turn Conversations**: Can reference previous searches and build on them
- **Context Awareness**: Understands search intent from conversation context
- **Error Recovery**: Handles failures gracefully with fallback strategies

## Troubleshooting

### Common Issues

1. **Server not starting**
   - Check that port 3004 is available
   - Verify Python dependencies are installed
   - Check Docker container logs

2. **Search failures**
   - Verify internet connectivity
   - Check for rate limiting (wait and retry)
   - Review server logs for specific errors

3. **Content fetch timeouts**
   - Some websites may be slow or block requests
   - Increase timeout values if needed
   - Check if the URL is accessible

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export PYTHONUNBUFFERED=1
export LOG_LEVEL=DEBUG
```

### Health Check

Check server status:
```bash
curl http://localhost:3004/health
```

## Security Considerations

- **No API Keys Required**: DuckDuckGo doesn't require authentication
- **Rate Limiting**: Built-in protection against abuse
- **Content Filtering**: Basic filtering of malicious content
- **Network Security**: Runs in isolated Docker container

## Contributing

Areas for potential improvement:
- Additional search parameters (region, language, etc.)
- Enhanced content parsing options
- Caching layer for frequently accessed content
- Additional rate limiting strategies
- Support for image and video search

## License

This project is licensed under the MIT License, same as the original DuckDuckGo MCP server.

## Credits

Based on the excellent [DuckDuckGo MCP Server](https://github.com/nickclyde/duckduckgo-mcp-server) by @nickclyde.
