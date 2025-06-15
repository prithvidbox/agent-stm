# Chatbot Playground MCP Server

This is a comprehensive MCP (Model Context Protocol) server designed specifically for the Chatbot Playground project. It provides tools and resources to interact with the project files, analyze the codebase, and perform various utility functions.

## Features

### 🔧 Tools Available

1. **list_files** - List files and directories in the project
2. **read_file** - Read the contents of any file in the project
3. **search_files** - Search for text content across all project files
4. **analyze_project** - Analyze project structure and provide insights
5. **get_file_info** - Get detailed information about files or directories
6. **calculate** - Perform mathematical calculations
7. **generate_report** - Generate various reports about the project

### 📚 Resources Available

1. **Documentation Directory** (`file://docs/`) - Access to all documentation
2. **Backend Source Code** (`file://backend/src/`) - Access to backend code
3. **Frontend Files** (`file://frontend/`) - Access to frontend files
4. **Project Configuration** (`config://project`) - Project settings and info

## Installation

The MCP server dependencies are already installed. To use this server with Cline:

### Option 1: Add to Cline Configuration

Add this configuration to your Cline MCP settings:

```json
{
  "mcpServers": {
    "chatbot-playground": {
      "command": "node",
      "args": ["./chatbot-playground/mcp-server/server.js"],
      "cwd": "/Users/makekarma/Desktop"
    }
  }
}
```

### Option 2: Manual Testing

You can test the MCP server manually:

```bash
cd chatbot-playground/mcp-server
node server.js
```

## Tool Usage Examples

### 1. List Project Files
```json
{
  "tool": "list_files",
  "arguments": {
    "path": ".",
    "recursive": true
  }
}
```

### 2. Read Documentation
```json
{
  "tool": "read_file",
  "arguments": {
    "path": "docs/mcp-protocol-guide.md"
  }
}
```

### 3. Search for Code
```json
{
  "tool": "search_files",
  "arguments": {
    "query": "OpenAI",
    "file_pattern": "*.js"
  }
}
```

### 4. Analyze Project
```json
{
  "tool": "analyze_project",
  "arguments": {
    "analysis_type": "overview"
  }
}
```

### 5. Get File Information
```json
{
  "tool": "get_file_info",
  "arguments": {
    "path": "backend/server.js"
  }
}
```

### 6. Calculate Values
```json
{
  "tool": "calculate",
  "arguments": {
    "expression": "2 + 3 * 4"
  }
}
```

### 7. Generate Reports
```json
{
  "tool": "generate_report",
  "arguments": {
    "report_type": "project_summary"
  }
}
```

## Resource Usage Examples

### 1. Access Documentation
```
Resource URI: file://docs/
```

### 2. Access Backend Code
```
Resource URI: file://backend/src/
```

### 3. Access Project Config
```
Resource URI: config://project
```

## Security Features

- **Path Traversal Protection**: Prevents access to files outside the project directory
- **Safe File Operations**: Only allows read operations, no write/delete capabilities
- **Input Validation**: Validates all tool inputs and parameters
- **Error Handling**: Graceful error handling with informative messages

## Integration with Chatbot Playground

This MCP server is designed to work seamlessly with the Chatbot Playground:

1. **File Analysis**: Analyze project structure and code quality
2. **Documentation Access**: Quick access to all documentation files
3. **Code Search**: Find specific implementations or patterns
4. **Project Insights**: Generate reports and analytics
5. **Development Support**: Assist with debugging and development tasks

## Available Analysis Types

### Project Overview
- File count and distribution
- Technology stack summary
- Key components identification

### Documentation Analysis
- Documentation file statistics
- Content analysis and metrics
- Coverage assessment

### Code Metrics (Future)
- Code complexity analysis
- Dependency mapping
- Quality metrics

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the server has read access to project files
2. **Path Not Found**: Check that file paths are relative to project root
3. **JSON Parse Errors**: Verify tool arguments are properly formatted

### Debug Mode

To run the server with debug output:

```bash
DEBUG=mcp* node server.js
```

## Development

### Adding New Tools

To add a new tool:

1. Add tool definition to `tools/list` handler
2. Implement tool logic in `tools/call` handler
3. Add input validation and error handling
4. Update documentation

### Adding New Resources

To add a new resource:

1. Add resource definition to `resources/list` handler
2. Implement resource access in `resources/read` handler
3. Add appropriate security checks
4. Update documentation

## Contributing

This MCP server is part of the Chatbot Playground project. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see the main project LICENSE file for details.
