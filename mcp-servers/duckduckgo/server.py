#!/usr/bin/env python3
"""
DuckDuckGo MCP Server HTTP Wrapper

This script creates an HTTP wrapper around the DuckDuckGo MCP server
to make it accessible via REST API for the Agent STM chatbot.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the DuckDuckGo MCP server components
try:
    from duckduckgo_mcp_server import search, fetch_content
except ImportError:
    print("Error: duckduckgo-mcp-server not installed. Run: pip install duckduckgo-mcp-server")
    exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="DuckDuckGo MCP Server",
    description="HTTP wrapper for DuckDuckGo MCP server providing web search capabilities",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10

class FetchContentRequest(BaseModel):
    url: str

class ToolCallRequest(BaseModel):
    name: str
    arguments: Dict[str, Any]

class ToolResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    tools: List[str]

class ToolInfo(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]

# Available tools
AVAILABLE_TOOLS = [
    {
        "name": "search",
        "description": "Search DuckDuckGo for web results",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query string"
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default: 10)",
                    "default": 10
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "fetch_content",
        "description": "Fetch and parse content from a webpage",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The webpage URL to fetch content from"
                }
            },
            "required": ["url"]
        }
    }
]

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        tools=[tool["name"] for tool in AVAILABLE_TOOLS]
    )

@app.get("/tools/list")
async def list_tools():
    """List available tools"""
    return {
        "success": True,
        "tools": AVAILABLE_TOOLS
    }

@app.post("/tools/call", response_model=ToolResponse)
async def call_tool(request: ToolCallRequest):
    """Call a specific tool"""
    try:
        tool_name = request.name
        args = request.arguments
        
        logger.info(f"Calling tool: {tool_name} with args: {args}")
        
        if tool_name == "search":
            query = args.get("query")
            max_results = args.get("max_results", 10)
            
            if not query:
                raise HTTPException(status_code=400, detail="Query parameter is required")
            
            result = await search(query, max_results)
            
            return ToolResponse(
                success=True,
                result=result,
                timestamp=datetime.now().isoformat()
            )
            
        elif tool_name == "fetch_content":
            url = args.get("url")
            
            if not url:
                raise HTTPException(status_code=400, detail="URL parameter is required")
            
            result = await fetch_content(url)
            
            return ToolResponse(
                success=True,
                result=result,
                timestamp=datetime.now().isoformat()
            )
            
        else:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
            
    except Exception as e:
        logger.error(f"Error calling tool {tool_name}: {str(e)}")
        return ToolResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )

@app.post("/search", response_model=ToolResponse)
async def search_endpoint(request: SearchRequest):
    """Direct search endpoint"""
    try:
        result = await search(request.query, request.max_results)
        return ToolResponse(
            success=True,
            result=result,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return ToolResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )

@app.post("/fetch", response_model=ToolResponse)
async def fetch_endpoint(request: FetchContentRequest):
    """Direct fetch content endpoint"""
    try:
        result = await fetch_content(request.url)
        return ToolResponse(
            success=True,
            result=result,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Fetch error: {str(e)}")
        return ToolResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )

@app.get("/")
async def root():
    """Root endpoint with server info"""
    return {
        "name": "DuckDuckGo MCP Server",
        "description": "HTTP wrapper for DuckDuckGo MCP server providing web search capabilities",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "tools": "/tools/list",
            "call_tool": "/tools/call",
            "search": "/search",
            "fetch": "/fetch"
        },
        "tools": [tool["name"] for tool in AVAILABLE_TOOLS]
    }

if __name__ == "__main__":
    port = int(os.getenv("MCP_SERVER_PORT", 3004))
    host = os.getenv("MCP_SERVER_HOST", "0.0.0.0")
    
    logger.info(f"Starting DuckDuckGo MCP Server on {host}:{port}")
    logger.info(f"Available tools: {[tool['name'] for tool in AVAILABLE_TOOLS]}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
