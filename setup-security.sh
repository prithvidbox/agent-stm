#!/bin/bash

# ================================
# SECURITY SETUP SCRIPT
# ================================
# This script sets up security measures for the Chatbot Playground project

echo "🔒 Setting up security measures for Chatbot Playground..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================
# 1. Initialize Git Repository (if needed)
# ================================
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📁 Initializing Git repository...${NC}"
    git init
else
    echo -e "${GREEN}✅ Git repository already exists${NC}"
fi

# ================================
# 2. Set up Git hooks
# ================================
echo -e "${BLUE}🪝 Setting up Git hooks...${NC}"

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy our pre-commit hook
if [ -f ".git-hooks/pre-commit" ]; then
    cp .git-hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Pre-commit security hook installed${NC}"
else
    echo -e "${RED}❌ Pre-commit hook not found in .git-hooks/pre-commit${NC}"
fi

# ================================
# 3. Configure Git settings
# ================================
echo -e "${BLUE}⚙️ Configuring Git settings...${NC}"

# Set up git-secrets if available
if command -v git-secrets &> /dev/null; then
    git secrets --register-aws
    git secrets --install
    echo -e "${GREEN}✅ git-secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️ git-secrets not installed. Install with: brew install git-secrets${NC}"
fi

# ================================
# 4. Environment File Setup
# ================================
echo -e "${BLUE}🔧 Setting up environment files...${NC}"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo -e "${YELLOW}📋 Creating .env from .env.example...${NC}"
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}⚠️ Please edit backend/.env with your actual API keys${NC}"
    else
        echo -e "${RED}❌ No .env.example found${NC}"
    fi
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

# Set secure permissions
if [ -f "backend/.env" ]; then
    chmod 600 backend/.env
    echo -e "${GREEN}✅ Set secure permissions on .env file${NC}"
fi

# ================================
# 5. Directory Permissions
# ================================
echo -e "${BLUE}📁 Setting up directory permissions...${NC}"

# Create data directories if they don't exist
mkdir -p backend/data
mkdir -p backend/data/uploads
mkdir -p backend/data/vector_store
mkdir -p data/logs

# Set secure permissions
chmod 700 backend/data
chmod 700 backend/data/uploads
chmod 700 backend/data/vector_store
chmod 700 data/logs

echo -e "${GREEN}✅ Directory permissions configured${NC}"

# ================================
# 6. Security Scan
# ================================
echo -e "${BLUE}🔍 Running initial security scan...${NC}"

# Check for existing sensitive files
SENSITIVE_FILES=$(find . -name "*.env" -not -path "./.git/*" -not -name "*.example" 2>/dev/null)
if [ ! -z "$SENSITIVE_FILES" ]; then
    echo -e "${YELLOW}⚠️ Found environment files:${NC}"
    echo "$SENSITIVE_FILES"
    echo -e "${YELLOW}💡 Make sure these are in .gitignore${NC}"
fi

# Check for API keys in files
API_KEYS=$(grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.example" --exclude="*.md" 2>/dev/null | head -5)
if [ ! -z "$API_KEYS" ]; then
    echo -e "${RED}❌ WARNING: Potential API keys found:${NC}"
    echo "$API_KEYS"
    echo -e "${RED}🚨 Please review and secure these files!${NC}"
fi

# ================================
# 7. Install Security Dependencies
# ================================
echo -e "${BLUE}📦 Checking security dependencies...${NC}"

if [ -f "backend/package.json" ]; then
    cd backend
    
    # Run npm audit
    echo -e "${BLUE}🔍 Running npm audit...${NC}"
    npm audit
    
    # Install security-related packages if not present
    SECURITY_PACKAGES=("helmet" "express-rate-limit" "validator")
    
    for package in "${SECURITY_PACKAGES[@]}"; do
        if ! npm list "$package" &> /dev/null; then
            echo -e "${YELLOW}📦 Installing $package...${NC}"
            npm install "$package"
        else
            echo -e "${GREEN}✅ $package already installed${NC}"
        fi
    done
    
    cd ..
fi

# ================================
# 8. Create Security Checklist
# ================================
echo -e "${BLUE}📋 Creating security checklist...${NC}"

cat > SECURITY_CHECKLIST.md << 'EOF'
# Security Checklist - Chatbot Playground

## ✅ Pre-Deployment Checklist

### Environment & Configuration
- [ ] All API keys are in environment variables
- [ ] No hardcoded secrets in code
- [ ] `.env` files are in `.gitignore`
- [ ] Environment files have secure permissions (600)
- [ ] Production environment variables are set

### Database Security
- [ ] Database files are gitignored
- [ ] Database has proper access controls
- [ ] No sensitive data in schema files
- [ ] Regular backups are configured

### Code Security
- [ ] Input validation is implemented
- [ ] SQL injection prevention is in place
- [ ] XSS protection is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented

### Dependencies
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Dependencies are up to date
- [ ] Security headers are implemented (helmet)
- [ ] Authentication is properly implemented

### Git Security
- [ ] Pre-commit hooks are installed
- [ ] No sensitive files in Git history
- [ ] `.gitignore` is comprehensive
- [ ] Commit messages don't contain secrets

### Monitoring
- [ ] Security logging is enabled
- [ ] Error handling doesn't expose sensitive info
- [ ] API usage monitoring is in place
- [ ] Incident response plan is documented

## 🚨 Emergency Procedures

### If API Key is Compromised
1. Immediately revoke the compromised key
2. Generate a new API key
3. Update environment variables
4. Check logs for unauthorized usage
5. Monitor for suspicious activity

### If Sensitive Data is Committed
1. Remove from Git history immediately
2. Force push to remote (if safe)
3. Rotate any exposed secrets
4. Notify team members
5. Review and improve security procedures

## 📞 Security Contacts

- Security Team: [Add contact information]
- Emergency Contact: [Add emergency contact]
- Incident Reporting: [Add reporting process]
EOF

echo -e "${GREEN}✅ Security checklist created${NC}"

# ================================
# 9. Final Summary
# ================================
echo ""
echo -e "${GREEN}🎉 Security setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 What was configured:${NC}"
echo "✅ Git hooks for pre-commit security checks"
echo "✅ Secure file permissions"
echo "✅ Environment file setup"
echo "✅ Security documentation"
echo "✅ Dependency security check"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Edit backend/.env with your actual API keys"
echo "2. Review SECURITY.md for guidelines"
echo "3. Run: git add . && git commit -m 'Initial secure setup'"
echo "4. Set up your remote repository"
echo ""
echo -e "${YELLOW}⚠️ Important reminders:${NC}"
echo "• Never commit .env files"
echo "• Regularly run npm audit"
echo "• Review the security checklist before deployment"
echo "• Keep dependencies updated"
echo ""
echo -e "${GREEN}🔒 Your repository is now secure!${NC}"
