# 🧪 Complete MCP Server Testing Guide - Step by Step

This guide will walk you through testing the MCP (Model Context Protocol) server system with detailed steps and examples.

## 📋 **Prerequisites - Check These First**

### 1. Verify All Servers Are Running
```bash
# Check if all 3 servers are running
ps aux | grep "node server.js"
```
You should see 3 processes:
- Main backend server (port 3001)
- HTTP Tools MCP server (port 3002) 
- Utilities MCP server (port 3003)

### 2. Quick Health Check
```bash
# Test main server
curl http://localhost:3001/health

# Test MCP servers
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 🎯 **Method 1: Main Chatbot Interface Testing (Easiest)**

### Step 1: Open the Main Interface
```
http://localhost:3001
```

### Step 2: Navigate to MCP Tab
1. Click on the **"MCP"** tab in the navigation
2. You should see three sections:
   - **MCP Status**
   - **Available Tools** 
   - **Available Resources**

### Step 3: Check MCP Status
The MCP Status should show:
```json
{
  "enabled": true,
  "message": "MCP Admin System Active",
  "servers": 2,
  "healthyServers": 2,
  "totalTools": 11
}
```

### Step 4: Verify Available Tools
You should see **11 tools** listed:

**HTTP Tools (6 tools):**
- echo - Echo back the input text
- add_numbers - Add two numbers together
- get_time - Get the current time
- reverse_text - Reverse the input text
- generate_uuid - Generate a random UUID
- hash_text - Generate SHA-256 hash of text

**Utilities (5 tools):**
- generate_qr_code - Generate QR code for text or URL
- password_generator - Generate a secure password
- color_converter - Convert colors between different formats
- text_analyzer - Analyze text for word count, character count, etc.
- url_shortener - Create a shortened URL (mock implementation)

### Step 5: Test a Tool
1. Scroll down to **"Test Tool"** section
2. Select a tool from the dropdown (e.g., "echo")
3. Enter test parameters in JSON format:
   ```json
   {"text": "Hello MCP!"}
   ```
4. Click **"Execute Tool"**
5. Check the results below

### Step 6: Test Different Tools
Try these examples:

**Echo Tool:**
```json
{"text": "Testing MCP system!"}
```

**Add Numbers:**
```json
{"a": 25, "b": 17}
```

**Password Generator:**
```json
{"length": 16, "includeSymbols": true}
```

**Get Time:**
```json
{}
```

**Generate UUID:**
```json
{}
```

---

## 🔧 **Method 2: Admin Dashboard Testing (Most Comprehensive)**

### Step 1: Open Admin Dashboard
```
http://localhost:3001/admin.html
```

### Step 2: Overview Tab
1. Click **"Overview"** tab
2. Verify you see:
   - **2 Total Servers**
   - **2 Enabled Servers** 
   - **11 Total Tools**
   - **2 Healthy Servers**

### Step 3: Servers Tab
1. Click **"Servers"** tab
2. You should see 2 servers:
   - **http-tools** (Basic HTTP tools)
   - **utilities** (Advanced utility tools)
3. Both should show **"Enabled"** status
4. Try toggling a server off/on to test control

### Step 4: Tools Tab
1. Click **"Tools"** tab
2. You should see all 11 tools listed
3. Try searching for specific tools
4. Test enabling/disabling individual tools

### Step 5: Testing Tab (Quick Tests)
1. Click **"Testing"** tab
2. Use the **Quick Test Buttons**:
   - **Echo Test** - Tests basic text echo
   - **Math Test** - Tests adding 5 + 3
   - **Time Test** - Gets current time
   - **UUID Test** - Generates a unique ID
   - **Password Test** - Generates a 16-character password

### Step 6: Custom Tool Testing
1. In the Testing tab, scroll to **"Custom Tool Testing"**
2. Select **Server**: Choose "http-tools" or "utilities"
3. Select **Tool**: Choose any tool from dropdown
4. Enter **Arguments** in JSON format
5. Click **"Test Tool"**

**Example Custom Tests:**

**Color Converter:**
```json
{"color": "#FF5733", "from": "hex", "to": "rgb"}
```

**Text Analyzer:**
```json
{"text": "The quick brown fox jumps over the lazy dog"}
```

**QR Code Generator:**
```json
{"text": "https://example.com", "size": 200}
```

**Reverse Text:**
```json
{"text": "Hello World"}
```

**Hash Text:**
```json
{"text": "password123"}
```

---

## ⚡ **Method 3: Direct API Testing (Advanced)**

### Step 1: Test Individual Tools via API

**Echo Tool:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/echo/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"text": "Hello from API!"}}'
```

**Expected Result:**
```json
{"success":true,"result":"Echo: Hello from API!","toolName":"echo"}
```

**Add Numbers:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/add_numbers/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"a": 15, "b": 27}}'
```

**Expected Result:**
```json
{"success":true,"result":"15 + 27 = 42","toolName":"add_numbers"}
```

**Password Generator:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/utilities/password_generator/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"length": 20, "includeSymbols": true}}'
```

**Expected Result:**
```json
{"success":true,"result":"Generated password: Xy9#mK$pL@3nR&8qZ!","toolName":"password_generator"}
```

**Get Time:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/get_time/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {}}'
```

**Generate QR Code:**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/utilities/generate_qr_code/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"text": "https://github.com", "size": 300}}'
```

### Step 2: Test System Endpoints

**Check All Available Tools:**
```bash
curl http://localhost:3001/api/mcp/debug/tools
```

**Check Server Health:**
```bash
curl http://localhost:3001/api/mcp/health
```

**Check Server List:**
```bash
curl http://localhost:3001/api/mcp/servers
```

**Get Dashboard Data:**
```bash
curl http://localhost:3001/api/mcp/dashboard
```

---

## 🎮 **Method 4: Interactive Testing Scenarios**

### Scenario 1: Developer Workflow Test
1. **Generate UUID** for a new project
2. **Get current time** for timestamps
3. **Create QR code** for project URL
4. **Generate password** for database
5. **Hash the password** for security

### Scenario 2: Text Processing Pipeline
1. **Analyze text** to get word count
2. **Reverse the text** for fun
3. **Generate hash** of the text
4. **Create QR code** containing the text

### Scenario 3: Admin Control Test
1. **Disable utilities server** in admin panel
2. **Try using password generator** (should fail)
3. **Re-enable utilities server**
4. **Try password generator again** (should work)

### Scenario 4: Load Testing
Run multiple tool calls simultaneously:
```bash
# Run these in parallel
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/echo/call -H "Content-Type: application/json" -d '{"arguments": {"text": "Test 1"}}' &
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/echo/call -H "Content-Type: application/json" -d '{"arguments": {"text": "Test 2"}}' &
curl -X POST http://localhost:3001/api/mcp/tools/http-tools/echo/call -H "Content-Type: application/json" -d '{"arguments": {"text": "Test 3"}}' &
wait
```

---

## 🔍 **Troubleshooting Guide**

### Problem: "No MCP tools available"
**Solution:**
1. Check if MCP servers are running: `ps aux | grep "node server.js"`
2. Restart MCP servers if needed
3. Refresh the browser page
4. Check browser console for errors

### Problem: "Tool execution failed"
**Solution:**
1. Verify JSON syntax in parameters
2. Check if the tool requires specific parameters
3. Test the tool via admin dashboard first
4. Check server logs for errors

### Problem: "Server not responding"
**Solution:**
1. Check server health: `curl http://localhost:3002/health`
2. Restart the specific server
3. Check if ports are available
4. Verify firewall settings

### Problem: Tools not showing in dropdown
**Solution:**
1. Go to admin dashboard
2. Click "Servers" tab
3. Click "Discover Tools" for each server
4. Refresh the main interface

---

## 📊 **Expected Results Summary**

### ✅ **Successful Test Results:**

**Echo Tool:**
- Input: `{"text": "Hello"}`
- Output: `"Echo: Hello"`

**Math Tool:**
- Input: `{"a": 5, "b": 3}`
- Output: `"5 + 3 = 8"`

**Password Tool:**
- Input: `{"length": 12}`
- Output: `"Generated password: aB3$xY9#mK2@"`

**Time Tool:**
- Input: `{}`
- Output: `"Current time: 2025-06-15T10:22:30.123Z"`

**UUID Tool:**
- Input: `{}`
- Output: `"Generated UUID: 123e4567-e89b-12d3-a456-426614174000"`

### ✅ **System Health Indicators:**
- **2 servers** running and healthy
- **11 tools** discovered and available
- **All API endpoints** responding correctly
- **Admin dashboard** fully functional
- **Real-time monitoring** working

---

## 🚀 **Quick Start Testing Checklist**

### 5-Minute Quick Test:
1. ✅ Open http://localhost:3001/admin.html
2. ✅ Click "Testing" tab
3. ✅ Click "Echo Test" button → Should see result
4. ✅ Click "Math Test" button → Should see "5 + 3 = 8"
5. ✅ Click "Password Test" button → Should see generated password
6. ✅ Open http://localhost:3001
7. ✅ Go to MCP tab → Should see 11 tools
8. ✅ Test any tool from dropdown → Should work

### 15-Minute Comprehensive Test:
1. ✅ Run all quick tests above
2. ✅ Test 5 different tools via admin dashboard
3. ✅ Test 3 tools via main interface
4. ✅ Run 2 API commands via terminal
5. ✅ Toggle a server off/on in admin
6. ✅ Verify tools disappear/reappear

---

## 🎉 **Success Criteria**

Your MCP system is working correctly if:

✅ **Admin dashboard shows 2 servers, 11 tools**  
✅ **All quick test buttons work**  
✅ **Main interface shows all 11 tools in dropdown**  
✅ **API calls return successful results**  
✅ **Server health endpoints respond correctly**  
✅ **Tools can be enabled/disabled**  
✅ **Real-time monitoring shows live data**  

**🎊 Congratulations! Your MCP server system is fully operational!**

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all servers are running
3. Check browser console for errors
4. Test via admin dashboard first
5. Try API calls directly to isolate issues

**Happy Testing! 🚀**
