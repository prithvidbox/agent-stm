#!/bin/bash

# ================================
# GIT SETUP SCRIPT - SECURE INITIALIZATION
# ================================
# This script safely initializes Git with security measures

echo "🔒 Setting up Git repository with security measures..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================
# 1. CRITICAL SECURITY CHECK
# ================================
echo -e "${RED}🚨 CRITICAL SECURITY CHECK${NC}"
echo "Before initializing Git, we need to ensure no sensitive data will be committed."
echo ""

# Check for exposed API keys (excluding this script itself)
echo -e "${BLUE}🔍 Scanning for exposed API keys...${NC}"
EXPOSED_KEYS=$(grep -r "sk-proj-" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.example" --exclude="*.md" --exclude="git-setup.sh" 2>/dev/null)

if [ ! -z "$EXPOSED_KEYS" ]; then
    echo -e "${RED}❌ CRITICAL: Exposed API keys found!${NC}"
    echo "$EXPOSED_KEYS"
    echo ""
    echo -e "${RED}🛑 STOPPING: Cannot proceed with Git setup until API keys are secured.${NC}"
    echo ""
    echo -e "${YELLOW}📋 To fix this:${NC}"
    echo "1. Move all API keys to environment variables"
    echo "2. Ensure .env files are in .gitignore"
    echo "3. Use .env.example for templates"
    echo "4. Run this script again"
    exit 1
else
    echo -e "${GREEN}✅ No exposed API keys found${NC}"
fi

# ================================
# 2. INITIALIZE GIT REPOSITORY
# ================================
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📁 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${GREEN}✅ Git repository already exists${NC}"
fi

# ================================
# 3. SETUP SECURITY HOOKS
# ================================
echo -e "${BLUE}🪝 Installing security hooks...${NC}"

# Copy pre-commit hook
if [ -f ".git-hooks/pre-commit" ]; then
    cp .git-hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Pre-commit security hook installed${NC}"
else
    echo -e "${RED}❌ Pre-commit hook not found${NC}"
fi

# ================================
# 4. VERIFY GITIGNORE
# ================================
echo -e "${BLUE}📋 Verifying .gitignore...${NC}"

if [ -f ".gitignore" ]; then
    # Check if critical patterns are in .gitignore
    CRITICAL_PATTERNS=(".env" "*.db" "node_modules" "*.log")
    MISSING_PATTERNS=()
    
    for pattern in "${CRITICAL_PATTERNS[@]}"; do
        if ! grep -q "$pattern" .gitignore; then
            MISSING_PATTERNS+=("$pattern")
        fi
    done
    
    if [ ${#MISSING_PATTERNS[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ .gitignore contains all critical patterns${NC}"
    else
        echo -e "${YELLOW}⚠️ Missing patterns in .gitignore:${NC}"
        printf '%s\n' "${MISSING_PATTERNS[@]}"
    fi
else
    echo -e "${RED}❌ .gitignore file not found${NC}"
    exit 1
fi

# ================================
# 5. STAGE SAFE FILES ONLY
# ================================
echo -e "${BLUE}📦 Staging safe files for initial commit...${NC}"

# Add safe files explicitly
SAFE_FILES=(
    ".gitignore"
    "README.md"
    "SECURITY.md"
    "MEMORY_MANAGEMENT_ARCHITECTURE.md"
    "GIT_SECURITY_SETUP.md"
    "package.json"
    "backend/package.json"
    "backend/.env.example"
    "frontend/"
    "docs/"
    "mcp-servers/"
    "backend/src/"
    "backend/server.js"
    "start.sh"
    "setup-security.sh"
    "git-setup.sh"
    ".git-hooks/"
)

for file in "${SAFE_FILES[@]}"; do
    if [ -e "$file" ]; then
        git add "$file"
        echo -e "${GREEN}✅ Added: $file${NC}"
    fi
done

# ================================
# 6. FINAL SECURITY CHECK
# ================================
echo -e "${BLUE}🔍 Final security check on staged files...${NC}"

# Check staged files for secrets
STAGED_SECRETS=$(git diff --cached | grep -i "sk-proj\|api_key.*=.*[^example]" | grep -v "your-.*-here")
if [ ! -z "$STAGED_SECRETS" ]; then
    echo -e "${RED}❌ CRITICAL: Secrets found in staged files!${NC}"
    echo "$STAGED_SECRETS"
    echo -e "${RED}🛑 Aborting commit${NC}"
    git reset
    exit 1
fi

# ================================
# 7. CREATE INITIAL COMMIT
# ================================
echo -e "${BLUE}📝 Creating initial commit...${NC}"

git commit -m "Initial commit: Agent STM - Semantic Memory Chatbot Playground

✅ Features:
- Advanced semantic memory with vector embeddings
- Session isolation and context management
- MCP (Model Context Protocol) integration
- Comprehensive security measures
- Memory management architecture

🔒 Security:
- Comprehensive .gitignore for sensitive files
- Pre-commit hooks for secret detection
- Environment variable templates
- Security documentation and guidelines

🧠 Memory System:
- Short-term and long-term memory layers
- Semantic similarity search with OpenAI embeddings
- Entity relationship tracking
- Context fusion (temporal + semantic)
- Automatic memory promotion and cleanup

🔧 Technical Stack:
- Node.js backend with Express
- SQLite database with vector storage
- OpenAI GPT-4 Turbo integration
- WebSocket real-time communication
- Comprehensive testing framework

🔒 No sensitive data included in this commit"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Initial commit created successfully${NC}"
else
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi

# ================================
# 8. SETUP REMOTE (OPTIONAL)
# ================================
echo ""
echo -e "${YELLOW}📡 Remote Repository Setup${NC}"
echo "To push to a remote repository:"
echo ""
echo "1. Create a new repository on GitHub/GitLab"
echo "2. Add the remote:"
echo "   git remote add origin <your-repo-url>"
echo "3. Push the initial commit:"
echo "   git push -u origin main"
echo ""

# ================================
# 9. FINAL INSTRUCTIONS
# ================================
echo -e "${GREEN}🎉 Git repository setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 What was done:${NC}"
echo "✅ Git repository initialized"
echo "✅ Security hooks installed"
echo "✅ Safe files committed"
echo "✅ Sensitive files protected"
echo ""
echo -e "${YELLOW}⚠️ IMPORTANT REMINDERS:${NC}"
echo "• Never commit .env files"
echo "• Always run security checks before pushing"
echo "• Keep API keys in environment variables"
echo "• Review SECURITY.md for guidelines"
echo ""
echo -e "${GREEN}🔒 Your repository is secure and ready for collaboration!${NC}"
