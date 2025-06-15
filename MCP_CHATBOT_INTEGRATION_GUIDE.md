# 🤖 MCP Chatbot Integration Guide - Claude Desktop Style

This guide shows how to use MCP tools directly in the chatbot conversation, similar to Claude Desktop's tool integration.

## 🎯 **How It Works**

The chatbot now automatically:
1. **Detects** when MCP tools can help with your request
2. **Suggests** relevant tools based on your message
3. **Executes** tools when appropriate using the `[TOOL_USE:tool_name:parameters]` format
4. **Displays** tool results directly in the chat interface

## 🔧 **Available Tools (11 Total)**

### **HTTP Tools Server (6 tools):**
- `echo` - Echo back text
- `add_numbers` - Add two numbers together
- `get_time` - Get current time
- `reverse_text` - Reverse text
- `generate_uuid` - Generate unique ID
- `hash_text` - Generate SHA-256 hash

### **Utilities Server (5 tools):**
- `generate_qr_code` - Generate QR codes
- `password_generator` - Generate secure passwords
- `color_converter` - Convert color formats
- `text_analyzer` - Analyze text statistics
- `url_shortener` - Create shortened URLs

## 💬 **How to Use MCP Tools in Chat**

### **Method 1: Natural Language (Automatic)**
Just ask naturally and the chatbot will detect when tools can help:

**Examples:**
```
"Can you add 25 and 17 for me?"
→ Chatbot automatically uses add_numbers tool

"What time is it right now?"
→ Chatbot automatically uses get_time tool

"Generate a secure password for me"
→ Chatbot automatically uses password_generator tool

"Create a QR code for https://github.com"
→ Chatbot automatically uses generate_qr_code tool
```

### **Method 2: Direct Tool Request**
You can explicitly request tool usage:

**Examples:**
```
"Use the echo tool to repeat 'Hello World'"
"Please use add_numbers to calculate 42 + 58"
"Can you use the password_generator to make a 16-character password?"
"Use generate_uuid to create a unique identifier"
```

### **Method 3: Advanced Tool Format (For Developers)**
The chatbot uses this format internally:
```
[TOOL_USE:tool_name:{"parameter":"value"}]
```

## 🎨 **Chat Interface Features**

### **Tool Execution Display**
When tools are used, you'll see:

```
🔧 Tools Used:

┌─ add_numbers ✅
│  Parameters: {"a": 25, "b": 17}
│  Result: 25 + 17 = 42
└─

┌─ generate_uuid ✅
│  Parameters: {}
│  Result: Generated UUID: 123e4567-e89b-12d3-a456-426614174000
└─
```

### **Context Information**
Each message shows:
- 📚 **RAG**: Documents used
- 🔧 **MCP**: Tools executed
- 🧠 **Memory**: Conversation context

## 🚀 **Example Conversations**

### **Example 1: Math and Time**
```
You: "What's 15 + 27 and what time is it?"
