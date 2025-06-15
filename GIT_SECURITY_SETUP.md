# Git Security Setup Guide - Chatbot Playground

## 🚨 CRITICAL: Read Before Pushing to Git

This guide ensures you safely push the Chatbot Playground to Git without exposing sensitive data like API keys, databases, or user uploads.

## 🔒 Security Files Created

### 1. `.gitignore` - Comprehensive Protection
- **Environment files**: `.env`, `.env.local`, `.env.production`, etc.
- **API keys and secrets**: `*.key`, `*.pem`, `secrets/`
- **Databases**: `*.db`, `*.sqlite`, `chatbot.db`
- **User uploads**: `uploads/`, `*.pdf`, `*.doc`
- **Logs**: `*.log`, `logs/`
- **Vector stores**: `vector_store/`, `*.embeddings`
- **Node.js**: `node_modules/`, build artifacts
- **System files**: `.DS_Store`, `Thumbs.db`

### 2. `backend/.env.example` - Safe Template
- Template for environment variables
- No actual API keys included
- Clear instructions for setup

### 3. `SECURITY.md` - Security Guidelines
- Comprehensive security best practices
- Incident response procedures
- Development security checklist

### 4. `.git-hooks/pre-commit` - Automated Security Checks
- Scans for API keys and secrets
- Blocks commits with sensitive data
- Validates file types and sizes

## 🛡️ Security Measures Implemented

### Automatic Protection
- **Pre-commit hooks**: Scan every commit for secrets
- **File exclusion**: Comprehensive .gitignore patterns
- **Permission setting**: Secure file permissions (600 for .env)
- **Pattern detection**: Multiple secret detection algorithms

### Manual Verification
- **Security scripts**: Automated setup and verification
- **Documentation**: Clear guidelines and procedures
- **Checklists**: Pre-deployment security validation

## 🚀 Safe Git Setup Process

### Step 1: Run Security Setup
```bash
# Make scripts executable
chmod +x setup-security.sh
chmod +x git-setup.sh

# Run security setup
./setup-security.sh
```

### Step 2: Verify Environment Files
```bash
# Check that .env is gitignored
git check-ignore backend/.env
# Should output: backend/.env

# Verify no secrets in staged files
git diff --cached | grep -i "sk-"
# Should return nothing
```

### Step 3: Initialize Git Safely
```bash
# Run the secure Git setup
./git-setup.sh
```

This script will:
- ✅ Scan for exposed API keys
- ✅ Install security hooks
- ✅ Verify .gitignore patterns
- ✅ Stage only safe files
- ✅ Create secure initial commit

### Step 4: Add Remote and Push
```bash
# Add your remote repository
git remote add origin https://github.com/yourusername/chatbot-playground.git

# Push securely
git push -u origin main
```

## ⚠️ CRITICAL WARNINGS

### 🚨 NEVER Commit These Files:
- `backend/.env` (contains real API keys)
- `backend/.env.production` (production secrets)
- `*.db` files (may contain user data)
- `backend/data/uploads/` (user uploaded files)
- `data/logs/` (may contain sensitive logs)

### 🔍 Before Every Commit:
```bash
# Check for secrets in staged files
git diff --cached | grep -i "api_key\|secret\|password\|token"

# Verify .env files are not staged
git status | grep "\.env"

# Run security scan
grep -r "sk-proj" . --exclude-dir=node_modules --exclude-dir=.git
```

## 🔧 Manual Security Verification

### Check Current Status
```bash
# List all .env files (should be gitignored)
find . -name "*.env" -not -path "./.git/*"

# Check for API keys in files
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.example"

# Verify gitignore is working
git status --ignored
```

### Fix Exposed Secrets
If you accidentally committed secrets:

```bash
# Remove from Git history (DANGEROUS - use carefully)
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch backend/.env' \
--prune-empty --tag-name-filter cat -- --all

# Force push (only if repository is private and you're sure)
git push origin --force --all

# Rotate the compromised API key immediately
```

## 📋 Security Checklist

### Before First Push:
- [ ] `.gitignore` file is comprehensive
- [ ] No `.env` files in Git status
- [ ] Pre-commit hooks are installed
- [ ] Security scan shows no exposed keys
- [ ] `backend/.env.example` exists with templates
- [ ] All scripts are executable

### Before Every Push:
- [ ] Run `git diff --cached` to review changes
- [ ] No sensitive data in commit
- [ ] Commit message doesn't contain secrets
- [ ] Pre-commit hook passed successfully

### Regular Maintenance:
- [ ] Update dependencies (`npm audit fix`)
- [ ] Review security documentation
- [ ] Rotate API keys periodically
- [ ] Monitor repository for security issues

## 🆘 Emergency Procedures

### If API Key is Exposed:
1. **Immediately** revoke the exposed key
2. Generate a new API key
3. Update local `.env` file
4. Remove from Git history if committed
5. Force push to overwrite history (if safe)
6. Monitor for unauthorized usage

### If Database is Committed:
1. Remove database from Git history
2. Check if database contains sensitive user data
3. Notify affected users if necessary
4. Implement additional database security

## 📞 Support

### Security Issues:
- **DO NOT** create public GitHub issues for security problems
- Contact maintainers directly
- Use private communication channels

### Getting Help:
- Review `SECURITY.md` for detailed guidelines
- Check `MEMORY_MANAGEMENT_ARCHITECTURE.md` for technical details
- Run `./setup-security.sh` for automated setup

## ✅ Verification Commands

### Quick Security Check:
```bash
# All-in-one security verification
echo "🔍 Security Check Results:"
echo "=========================="
echo "1. Checking for .env files in Git:"
git ls-files | grep "\.env$" || echo "✅ No .env files tracked"
echo ""
echo "2. Scanning for API keys:"
git log --all -p | grep -i "sk-proj" | head -3 || echo "✅ No API keys in history"
echo ""
echo "3. Verifying .gitignore:"
git check-ignore backend/.env && echo "✅ .env is gitignored" || echo "❌ .env not gitignored"
echo ""
echo "4. Pre-commit hook status:"
[ -x .git/hooks/pre-commit ] && echo "✅ Pre-commit hook installed" || echo "❌ Pre-commit hook missing"
```

## 🎯 Final Reminders

1. **Security is everyone's responsibility**
2. **When in doubt, don't commit**
3. **Use environment variables for all secrets**
4. **Regularly audit your repository**
5. **Keep security documentation updated**

---

**🔒 Following this guide ensures your Chatbot Playground repository is secure and ready for collaboration without exposing sensitive data.**
