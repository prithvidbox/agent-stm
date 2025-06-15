#!/bin/bash

# Production Startup Script for Chatbot Playground
# This script starts the system with Redis and ChromaDB for production use

echo "🚀 Starting Chatbot Playground in Production Mode..."
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Docker version: $(docker --version)"

# Check if port 3001 is already in use
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is already in use. Please stop the existing service first:"
    echo "   Run: lsof -i :3001 to see what's using the port"
    echo "   Then: kill <PID> to stop the process"
    echo ""
    echo "   Or use a different port by setting PORT environment variable:"
    echo "   PORT=3002 ./start-production.sh"
    exit 1
fi

# Create production environment file if it doesn't exist
if [ ! -f "backend/.env.production" ]; then
    echo "📝 Creating production environment file..."
    cp backend/.env.example backend/.env.production
    
    # Update production settings
    sed -i.bak 's/USE_REDIS_MEMORY=false/USE_REDIS_MEMORY=true/' backend/.env.production
    sed -i.bak 's/USE_CHROMA_RAG=false/USE_CHROMA_RAG=true/' backend/.env.production
    sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' backend/.env.production
    
    echo "✅ Production environment file created"
    echo "⚠️  Please update backend/.env.production with your actual API keys and settings"
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start Docker services
echo "🐳 Starting Docker services (Redis, ChromaDB, PostgreSQL)..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service health with retries
echo "🔍 Checking service health..."

# Check Redis with retries
echo -n "Checking Redis... "
for i in {1..10}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ Redis is not responding after 10 attempts"
    else
        echo -n "."
        sleep 2
    fi
done

# Check ChromaDB with retries
echo -n "Checking ChromaDB... "
for i in {1..15}; do
    if curl -f http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
        echo "✅ ChromaDB is ready"
        break
    elif [ $i -eq 15 ]; then
        echo "❌ ChromaDB is not responding after 15 attempts"
        echo "   This may not affect basic functionality if RAG is not used"
    else
        echo -n "."
        sleep 3
    fi
done

# Check PostgreSQL with retries
echo -n "Checking PostgreSQL... "
for i in {1..10}; do
    if docker-compose exec -T postgres pg_isready -U chatbot_user -d chatbot_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ PostgreSQL is not responding after 10 attempts"
    else
        echo -n "."
        sleep 2
    fi
done

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/uploads
mkdir -p data/logs
echo "✅ Data directories created"

# Start MCP servers
echo "🔧 Starting MCP servers..."
(cd mcp-servers/http-tools && node server.js > ../../data/logs/http-tools.log 2>&1) &
HTTP_TOOLS_PID=$!

(cd mcp-servers/utilities && node server.js > ../../data/logs/utilities.log 2>&1) &
UTILITIES_PID=$!

echo "✅ MCP servers started"
echo "   - HTTP Tools PID: $HTTP_TOOLS_PID"
echo "   - Utilities PID: $UTILITIES_PID"

# Start the main application
echo "🚀 Starting the main application..."
echo "   Frontend: http://localhost:3001"
echo "   API: http://localhost:3001/api"
echo "   Admin Panel: http://localhost:3001/admin.html"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "🔧 Production Services:"
echo "   - Redis: localhost:6379"
echo "   - ChromaDB: http://localhost:8000"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill MCP servers
    if [ ! -z "$HTTP_TOOLS_PID" ]; then
        kill $HTTP_TOOLS_PID 2>/dev/null
    fi
    if [ ! -z "$UTILITIES_PID" ]; then
        kill $UTILITIES_PID 2>/dev/null
    fi
    
    # Stop Docker services
    docker-compose down
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start the Node.js application with production environment
(cd backend && NODE_ENV=production npm start)

# If we get here, the app has stopped, so cleanup
cleanup
