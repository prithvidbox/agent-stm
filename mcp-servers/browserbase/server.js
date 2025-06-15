#!/usr/bin/env node

/**
 * Browserbase MCP Server Wrapper
 * 
 * This server provides cloud browser automation capabilities using Browserbase.
 * It acts as a wrapper around the official @browserbasehq/mcp package.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const config = {
  // Browserbase configuration from environment variables
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  
  // Server configuration
  port: process.env.BROWSERBASE_MCP_PORT || 8932,
  host: process.env.BROWSERBASE_MCP_HOST || 'localhost',
  
  // Browser configuration
  browserWidth: process.env.BROWSERBASE_BROWSER_WIDTH || 1024,
  browserHeight: process.env.BROWSERBASE_BROWSER_HEIGHT || 768,
  
  // Feature flags
  proxies: process.env.BROWSERBASE_PROXIES === 'true',
  advancedStealth: process.env.BROWSERBASE_ADVANCED_STEALTH === 'true',
  persist: process.env.BROWSERBASE_PERSIST !== 'false', // default true
  
  // Optional configuration
  contextId: process.env.BROWSERBASE_CONTEXT_ID,
  cookies: process.env.BROWSERBASE_COOKIES
};

/**
 * Validate required configuration
 */
function validateConfig() {
  const errors = [];
  
  if (!config.apiKey) {
    errors.push('BROWSERBASE_API_KEY is required');
  }
  
  if (!config.projectId) {
    errors.push('BROWSERBASE_PROJECT_ID is required');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n💡 Please set the required environment variables:');
    console.error('   export BROWSERBASE_API_KEY="your_api_key"');
    console.error('   export BROWSERBASE_PROJECT_ID="your_project_id"');
    process.exit(1);
  }
}

/**
 * Build command arguments for the Browserbase MCP server
 */
function buildArgs() {
  const args = ['@browserbasehq/mcp'];
  
  // Add feature flags
  if (config.proxies) {
    args.push('--proxies');
  }
  
  if (config.advancedStealth) {
    args.push('--advancedStealth');
  }
  
  if (config.contextId) {
    args.push('--contextId', config.contextId);
  }
  
  if (!config.persist) {
    args.push('--persist', 'false');
  }
  
  // Add browser dimensions
  args.push('--browserWidth', config.browserWidth.toString());
  args.push('--browserHeight', config.browserHeight.toString());
  
  // Add cookies if provided
  if (config.cookies) {
    args.push('--cookies', config.cookies);
  }
  
  return args;
}

/**
 * Start the Browserbase MCP server
 */
function startServer() {
  console.log('🌐 Starting Browserbase MCP Server...');
  console.log('=====================================');
  
  // Validate configuration
  validateConfig();
  
  // Build command arguments
  const args = buildArgs();
  
  console.log('📋 Configuration:');
  console.log(`   API Key: ${config.apiKey.substring(0, 8)}...`);
  console.log(`   Project ID: ${config.projectId}`);
  console.log(`   Browser Size: ${config.browserWidth}x${config.browserHeight}`);
  console.log(`   Proxies: ${config.proxies ? 'enabled' : 'disabled'}`);
  console.log(`   Advanced Stealth: ${config.advancedStealth ? 'enabled' : 'disabled'}`);
  console.log(`   Persist Context: ${config.persist ? 'enabled' : 'disabled'}`);
  
  if (config.contextId) {
    console.log(`   Context ID: ${config.contextId}`);
  }
  
  console.log('\n🚀 Starting server with command:');
  console.log(`   npx ${args.join(' ')}`);
  console.log('');
  
  // Set up environment variables for the child process
  const env = {
    ...process.env,
    BROWSERBASE_API_KEY: config.apiKey,
    BROWSERBASE_PROJECT_ID: config.projectId
  };
  
  // Spawn the Browserbase MCP server
  const child = spawn('npx', args, {
    stdio: 'inherit',
    env: env
  });
  
  // Handle process events
  child.on('error', (error) => {
    console.error('❌ Failed to start Browserbase MCP server:', error.message);
    process.exit(1);
  });
  
  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`\n🛑 Browserbase MCP server terminated by signal: ${signal}`);
    } else {
      console.log(`\n🛑 Browserbase MCP server exited with code: ${code}`);
    }
    process.exit(code || 0);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    child.kill('SIGTERM');
  });
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  config
};
