# 🧪 MCP Testing Guide - Step-by-Step Examples

This guide shows you exactly how to test the MCP (Model Context Protocol) system with real examples.

## 🎯 Quick Test Overview

You have **3 ways** to test MCP tools:
1. **Admin Dashboard** - Direct tool testing
2. **Main Chatbot** - AI-powered tool suggestions  
3. **API Commands** - Direct API calls

---

## 🔧 Method 1: Admin Dashboard Testing (Easiest)

### Step 1: Open Admin Dashboard
```
http://localhost:3001/admin.html
```

### Step 2: Go to "Testing" Tab
Click the "Testing" tab in the admin dashboard.

### Step 3: Use Quick Test Buttons
Click any of these pre-configured test buttons:

- **Echo Test** - Tests basic text echo
- **Math Test** - Tests adding 5 + 3
- **Time Test** - Gets current time
- **UUID Test** - Generates a unique ID
- **Password Test** - Generates a 16-character password

### Step 4: Custom Tool Testing
1. Select a server from dropdown (http-tools or utilities)
2. Select a tool from dropdown
3. Enter JSON arguments in the text field
4. Click "Test Tool"

**Example Custom Tests:**
```json
// Password Generator (16 chars with symbols)
{"length": 16, "includeSymbols": true}

// Color Converter (hex to rgb)
{"color": "#FF5733", "from": "hex", "to": "rgb"}

// Text Analyzer
{"text": "Hello world! This is a test message."}

// QR Code Generator
{"text": "https://example.com", "size": 200}
```

---

## 🤖 Method 2: Main Chatbot Testing (Most Fun)

### Step 1: Open Main Chatbot
```
http://localhost:3001
```

### Step 2: Ask Questions That Trigger Tools

**🕐 Time-related questions:**
- "What time is it?"
- "Can you tell me the current time?"
- "What's the time right now?"

**🔢 Math questions:**
- "Add 15 and 27"
- "What's 42 plus 58?"
- "Calculate 123 + 456"

**🔐 Password questions:**
- "Generate a secure password"
- "Create a random password for me"
- "I need a strong password"

**🎨 Color questions:**
- "Convert #FF5733 to RGB"
- "What's the RGB value of red?"
- "Convert this hex color to RGB: #00FF00"

**📱 QR Code questions:**
- "Create a QR code for my website"
- "Generate a QR code for 'Hello World'"
- "Make a QR code for this URL: https://example.com"

**🔄 Text manipulation:**
- "Reverse this text: Hello World"
- "Can you reverse 'OpenAI'?"
- "Flip this text backwards: 'Testing'"

**🆔 ID generation:**
- "Generate a UUID"
- "Create a unique identifier"
- "I need a random ID"

**📊 Text analysis:**
- "Analyze this text: 'The quick brown fox jumps over the lazy dog'"
- "Count words in: 'Hello world this is a test'"
- "Get statistics for this text: 'Testing 123'"

### Step 3: Watch for Tool Suggestions
The AI will mention available tools in its responses and may automatically use them.

---

## ⚡ Method 3: Direct API Testing

### Test Individual Tools via API

**Echo Tool:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/echo/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"text": "Hello MCP!"}}'
```

**Add Numbers:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/add_numbers/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"a": 25, "b": 17}}'
```

**Get Time:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/get_time/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {}}'
```

**Generate Password:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/utilities/password_generator/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"length": 20, "includeSymbols": true}}'
```

**Generate QR Code:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/utilities/generate_qr_code/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"text": "https://github.com", "size": 300}}'
```

**Color Converter:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/utilities/color_converter/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"color": "#FF5733", "from": "hex", "to": "rgb"}}'
```

**Text Analyzer:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/utilities/text_analyzer/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"text": "The quick brown fox jumps over the lazy dog"}}'
```

---

## 🎮 Interactive Testing Scenarios

### Scenario 1: Password Security Test
1. **Admin Dashboard**: Test password generator with different lengths
2. **Chatbot**: Ask "Generate 3 different passwords with different security levels"
3. **API**: Test with various parameters

### Scenario 2: Developer Workflow Test
1. **Generate UUID** for a new project
2. **Create QR code** for project URL
3. **Hash some text** for verification
4. **Get current time** for timestamps

### Scenario 3: Text Processing Pipeline
1. **Analyze text** to get statistics
2. **Reverse the text** for fun
3. **Generate hash** of the text
4. **Create QR code** containing the text

### Scenario 4: Admin Control Test
1. **Disable utilities server** in admin panel
2. **Try using password generator** in chatbot (should fail)
3. **Re-enable utilities server**
4. **Try again** (should work)

---

## 🔍 Monitoring & Debugging

### Check System Health
```bash
curl http://localhost:3001/api/mcp/health
```

### View All Available Tools
```bash
curl http://localhost:3001/api/mcp/dashboard
```

### Check Server Status
```bash
curl http://localhost:3001/api/mcp/servers
```

### View Usage Statistics
```bash
curl http://localhost:3001/api/mcp/stats/usage
```

---

## 🚨 Troubleshooting

### If Tools Don't Appear:
1. Check servers are running: `http://localhost:3002/health` and `http://localhost:3003/health`
2. Discover tools: `curl -X POST http://localhost:3001/api/mcp/servers/http-tools/discover`
3. Enable servers in admin dashboard

### If Chatbot Doesn't Suggest Tools:
1. Use more specific keywords that match tool patterns
2. Check admin dashboard to ensure tools are enabled
3. Try direct tool testing first

### If API Calls Fail:
1. Verify server URLs and ports
2. Check JSON syntax in arguments
3. Ensure tools are discovered and enabled

---

## 🎯 Expected Results

### Successful Tool Calls Return:
```json
{
  "success": true,
  "result": "Tool output here",
  "toolName": "tool_name",
  "executionTime": 1234567890
}
```

### Failed Tool Calls Return:
```json
{
  "success": false,
  "error": "Error description",
  "toolName": "tool_name"
}
```

---

## 🏆 Advanced Testing

### Load Testing
Run multiple tool calls simultaneously to test performance.

### Error Testing
Try invalid parameters to test error handling.

### Integration Testing
Test the full workflow from admin panel changes to chatbot behavior.

### Custom Tool Testing
Add your own MCP server and test the discovery process.

---

**🎉 Happy Testing!** 

Start with the admin dashboard quick tests, then try chatbot interactions, and finally explore the API for advanced usage.
