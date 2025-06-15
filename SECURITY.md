# Security Guidelines - Chatbot Playground

## 🔒 Security Overview

This document outlines security best practices and guidelines for the Chatbot Playground project. Please read and follow these guidelines to ensure the security of the application and protect sensitive data.

## 🚨 Critical Security Requirements

### 1. Environment Variables & API Keys

**❌ NEVER commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- Any file containing API keys or secrets

**✅ DO:**
- Use `.env.example` as a template
- Store actual secrets in `.env` (which is gitignored)
- Use environment variables for all sensitive configuration
- Rotate API keys regularly

**🔑 API Key Management:**
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit with your actual values
nano backend/.env
```

### 2. Database Security

**Protected Files:**
- `*.db` files (SQLite databases)
- `backend/data/chatbot.db`
- Database backups and dumps

**Best Practices:**
- Database files are automatically gitignored
- Use proper database permissions in production
- Regular backups with encryption
- No sensitive data in database schema files

### 3. Uploaded Files & User Data

**Protected Directories:**
- `backend/data/uploads/`
- `data/uploads/`
- `backend/data/vector_store/`

**Guidelines:**
- All user uploads are gitignored
- Implement file type validation
- Scan uploads for malware in production
- Limit file sizes and types

## 📋 Pre-Commit Security Checklist

Before committing code, ensure:

- [ ] No `.env` files are staged
- [ ] No API keys in code comments
- [ ] No hardcoded passwords or secrets
- [ ] No database files staged
- [ ] No log files with sensitive data
- [ ] No uploaded user files staged

## 🔍 Security Scanning

### Check for Exposed Secrets

```bash
# Check for potential secrets in staged files
git diff --cached | grep -i "api_key\|password\|secret\|token"

# Check for .env files
git status | grep "\.env"

# Scan for common secret patterns
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git
```

### Automated Security Checks

```bash
# Install security audit tools
npm audit

# Check for vulnerable dependencies
npm audit fix

# Use git-secrets (install separately)
git secrets --scan
```

## 🛡️ Production Security

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

### Security Headers

The application should implement:
- CORS restrictions
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

### Monitoring

- Log security events
- Monitor API usage
- Track failed authentication attempts
- Set up alerts for suspicious activity

## 🔐 API Security

### OpenAI API Key Protection

**Current Implementation:**
- API key stored in environment variables
- Never logged or exposed in responses
- Used only for authorized requests

**Best Practices:**
- Implement API key rotation
- Monitor API usage and costs
- Set usage limits and alerts
- Use least-privilege access

### MCP (Model Context Protocol) Security

- MCP servers run in isolated processes
- No direct file system access
- Validate all MCP tool inputs
- Log MCP tool usage

## 📊 Data Privacy

### User Data Handling

**Memory System:**
- Session data is isolated
- No cross-user data leakage
- Automatic session cleanup
- No persistent user tracking

**Conversation Data:**
- Short-term memory cleared on session end
- Long-term memory for system improvement only
- No personal information stored permanently
- Vector embeddings are session-scoped

### GDPR Compliance

- Users can request data deletion
- No personal data stored without consent
- Clear data retention policies
- Audit trail for data access

## 🚨 Incident Response

### If Secrets Are Exposed

1. **Immediate Actions:**
   ```bash
   # Remove from Git history
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch backend/.env' \
   --prune-empty --tag-name-filter cat -- --all
   
   # Force push (if safe to do so)
   git push origin --force --all
   ```

2. **Rotate Compromised Secrets:**
   - Generate new OpenAI API key
   - Update environment variables
   - Monitor for unauthorized usage

3. **Notify Team:**
   - Document the incident
   - Review access logs
   - Update security procedures

### Security Contact

For security issues, please:
- Do not create public GitHub issues
- Contact the maintainers directly
- Provide detailed information about the vulnerability

## 🔧 Development Security

### Local Development

```bash
# Secure local setup
chmod 600 backend/.env
chmod 700 backend/data/

# Regular security updates
npm update
npm audit fix
```

### Code Review Security

**Review Checklist:**
- [ ] No hardcoded secrets
- [ ] Proper input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Authentication checks
- [ ] Authorization validation

## 📚 Security Resources

### Tools & Libraries

- **git-secrets**: Prevent secrets in Git
- **npm audit**: Vulnerability scanning
- **helmet**: Security headers for Express
- **rate-limiter-flexible**: Rate limiting
- **validator**: Input validation

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [OpenAI API Security](https://platform.openai.com/docs/guides/safety-best-practices)

## 🔄 Security Updates

This security document should be:
- Reviewed monthly
- Updated with new threats
- Aligned with security best practices
- Communicated to all team members

## ⚠️ Known Security Considerations

### Current Limitations

1. **Session Management**: Currently using in-memory sessions
2. **Rate Limiting**: Basic implementation, needs enhancement
3. **Input Validation**: Relies on OpenAI's content filtering
4. **Audit Logging**: Limited security event logging

### Planned Improvements

1. **Enhanced Authentication**: User authentication system
2. **Advanced Rate Limiting**: Per-user and per-IP limits
3. **Security Monitoring**: Comprehensive logging and alerting
4. **Penetration Testing**: Regular security assessments

---

**Remember: Security is everyone's responsibility. When in doubt, ask for a security review.**
