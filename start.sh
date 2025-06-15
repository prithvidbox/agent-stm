#!/bin/bash

# Chatbot Playground Startup Script

echo "🤖 Starting Chatbot Playground..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to backend directory
cd backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your OpenAI API key and other settings."
    echo "   Required: OPENAI_API_KEY"
    echo "   Optional: MCP_SERVER_URL, MCP_ENABLED"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/uploads
mkdir -p data/vector_store
echo "✅ Data directories created"

# Check if OpenAI API key is set (without exposing the pattern)
if ! grep -q "OPENAI_API_KEY=" .env 2>/dev/null || grep -q "OPENAI_API_KEY=$" .env 2>/dev/null; then
    echo "⚠️  OpenAI API key not found in .env file"
    echo "   Please add your OpenAI API key to the .env file:"
    echo "   OPENAI_API_KEY=your_api_key_here"
    echo ""
    read -p "Press Enter to continue anyway (some features may not work)..."
fi

echo ""
echo "🚀 Starting the server..."
echo "   Frontend: http://localhost:3001"
echo "   API: http://localhost:3001/api"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
