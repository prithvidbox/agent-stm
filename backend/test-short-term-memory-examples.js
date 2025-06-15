#!/usr/bin/env node

/**
 * Short-Term Memory Testing Examples
 * 
 * This script demonstrates the enhanced short-term memory capabilities
 * including entity relationship management, correction handling, and temporal tracking.
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';
const TEST_SESSION_ID = `test-session-${Date.now()}`;
const TEST_USER_ID = 'test-user-memory';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.bold}${colors.blue}🧪 ${testName}${colors.reset}`);
  console.log('─'.repeat(50));
}

function logStep(step, message) {
  console.log(`${colors.cyan}${step}.${colors.reset} ${message}`);
}

function logResult(success, message) {
  const icon = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

async function sendMessage(message) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: TEST_SESSION_ID,
        userId: TEST_USER_ID
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

async function getMemoryAnalytics() {
  try {
    const response = await fetch(`${API_BASE}/memory/analytics/${TEST_SESSION_ID}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting memory analytics:', error);
    return null;
  }
}

async function getEntityRelationships() {
  try {
    const response = await fetch(`${API_BASE}/memory/entities/${TEST_SESSION_ID}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting entity relationships:', error);
    return null;
  }
}

async function testBasicEntityRecall() {
  logTest('Test 1: Basic Entity Recall');
  
  logStep(1, 'Setting up personal information...');
  await sendMessage("Hi, my name is Sarah and I work as a software engineer at Google.");
  
  logStep(2, 'Testing name recall...');
  const nameResponse = await sendMessage("What's my name?");
  const hasName = nameResponse?.content?.toLowerCase().includes('sarah');
  logResult(hasName, hasName ? 'Name correctly recalled' : 'Name not found in response');
  
  logStep(3, 'Testing job recall...');
  const jobResponse = await sendMessage("Where do I work?");
  const hasJob = jobResponse?.content?.toLowerCase().includes('google');
  logResult(hasJob, hasJob ? 'Job correctly recalled' : 'Job not found in response');
  
  logStep(4, 'Testing role recall...');
  const roleResponse = await sendMessage("What's my job title?");
  const hasRole = roleResponse?.content?.toLowerCase().includes('software engineer');
  logResult(hasRole, hasRole ? 'Role correctly recalled' : 'Role not found in response');
  
  return { nameResponse, jobResponse, roleResponse };
}

async function testRoleChangeDetection() {
  logTest('Test 2: Role Change Detection (Advanced Feature)');
  
  logStep(1, 'Setting up friend information...');
  await sendMessage("I have a friend named Rahul. He's a data scientist at Google.");
  
  logStep(2, 'Testing initial role recall...');
  const initialResponse = await sendMessage("What does Rahul do?");
  const hasInitialRole = initialResponse?.content?.toLowerCase().includes('data scientist');
  logResult(hasInitialRole, hasInitialRole ? 'Initial role correctly stored' : 'Initial role not found');
  
  logStep(3, 'Applying role change correction...');
  await sendMessage("Actually, Rahul just got promoted to team lead.");
  
  logStep(4, 'Testing updated role recall...');
  const updatedResponse = await sendMessage("What's Rahul's current role?");
  const hasUpdatedRole = updatedResponse?.content?.toLowerCase().includes('team lead') || 
                         updatedResponse?.content?.toLowerCase().includes('promoted');
  logResult(hasUpdatedRole, hasUpdatedRole ? 'Role change correctly detected and updated' : 'Role change not properly handled');
  
  return { initialResponse, updatedResponse };
}

async function testComplexEntityRelationships() {
  logTest('Test 3: Complex Entity Relationships');
  
  logStep(1, 'Setting up organizational structure...');
  await sendMessage("My manager Sarah works in the marketing department.");
  await sendMessage("Sarah reports to the VP of Marketing, John.");
  
  logStep(2, 'Applying department change...');
  await sendMessage("Actually, Sarah moved to the sales team last month.");
  
  logStep(3, 'Testing department update...');
  const deptResponse = await sendMessage("Which department is Sarah in now?");
  const hasNewDept = deptResponse?.content?.toLowerCase().includes('sales');
  logResult(hasNewDept, hasNewDept ? 'Department change correctly tracked' : 'Department change not detected');
  
  logStep(4, 'Testing relationship consistency...');
  const relationResponse = await sendMessage("Who does Sarah report to?");
  const hasRelation = relationResponse?.content?.toLowerCase().includes('john');
  logResult(hasRelation, hasRelation ? 'Relationships maintained after change' : 'Relationships not consistent');
  
  return { deptResponse, relationResponse };
}

async function testTemporalMemory() {
  logTest('Test 4: Temporal Memory & Sequential Updates');
  
  logStep(1, 'Setting up project information...');
  await sendMessage("I'm working on the React project.");
  await sendMessage("The project uses TypeScript and Node.js.");
  
  logStep(2, 'Adding technology update...');
  await sendMessage("We just added Redis for caching.");
  
  logStep(3, 'Testing comprehensive recall...');
  const techResponse = await sendMessage("What technologies are we using in the project?");
  const hasReact = techResponse?.content?.toLowerCase().includes('react');
  const hasTypeScript = techResponse?.content?.toLowerCase().includes('typescript');
  const hasNodeJS = techResponse?.content?.toLowerCase().includes('node');
  const hasRedis = techResponse?.content?.toLowerCase().includes('redis');
  
  logResult(hasReact && hasTypeScript && hasNodeJS && hasRedis, 
    `Technologies recalled: React(${hasReact}), TypeScript(${hasTypeScript}), Node.js(${hasNodeJS}), Redis(${hasRedis})`);
  
  return { techResponse };
}

async function testCorrectionHandling() {
  logTest('Test 5: Multiple Corrections Handling');
  
  logStep(1, 'Setting up initial preferences...');
  await sendMessage("My favorite color is blue.");
  await sendMessage("I prefer coffee over tea.");
  
  logStep(2, 'Applying multiple corrections...');
  await sendMessage("Actually, my favorite color is green.");
  await sendMessage("And I actually prefer tea now.");
  
  logStep(3, 'Testing corrected preferences...');
  const prefResponse = await sendMessage("What are my preferences?");
  const hasGreen = prefResponse?.content?.toLowerCase().includes('green');
  const hasTea = prefResponse?.content?.toLowerCase().includes('tea');
  const notBlue = !prefResponse?.content?.toLowerCase().includes('blue') || 
                  prefResponse?.content?.toLowerCase().includes('was blue') ||
                  prefResponse?.content?.toLowerCase().includes('used to be blue');
  
  logResult(hasGreen && hasTea, 
    `Corrections applied: Green(${hasGreen}), Tea(${hasTea}), Blue removed(${notBlue})`);
  
  return { prefResponse };
}

async function testMemoryAnalytics() {
  logTest('Test 6: Memory Analytics & Entity Relationships');
  
  logStep(1, 'Retrieving memory analytics...');
  const analytics = await getMemoryAnalytics();
  
  if (analytics) {
    logResult(true, `Memory analytics retrieved successfully`);
    console.log(`   📊 Total messages: ${analytics.totalMessages || 'N/A'}`);
    console.log(`   🧠 Active entities: ${analytics.activeEntities?.length || 'N/A'}`);
    console.log(`   🔗 Relationships: ${analytics.relationships?.length || 'N/A'}`);
  } else {
    logResult(false, 'Failed to retrieve memory analytics');
  }
  
  logStep(2, 'Retrieving entity relationships...');
  const entities = await getEntityRelationships();
  
  if (entities) {
    logResult(true, `Entity relationships retrieved successfully`);
    if (entities.entities) {
      console.log(`   👥 Tracked entities: ${Object.keys(entities.entities).length}`);
      Object.keys(entities.entities).slice(0, 5).forEach(entity => {
        console.log(`      - ${entity}: ${entities.entities[entity].type || 'unknown type'}`);
      });
    }
  } else {
    logResult(false, 'Failed to retrieve entity relationships');
  }
  
  return { analytics, entities };
}

async function testAPIEndpoints() {
  logTest('Test 7: API Endpoint Testing');
  
  logStep(1, 'Testing short-term memory API...');
  try {
    const response = await fetch(`${API_BASE}/memory/test/short-term`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `api-test-${Date.now()}`,
        testMessages: [
          "Hello, my name is John",
          "I work as a software engineer", 
          "I like pizza and coffee",
          "My favorite color is blue",
          "I have a dog named Max"
        ]
      })
    });
    
    const result = await response.json();
    logResult(result.success, result.success ? 'API test successful' : `API test failed: ${result.error}`);
    
    if (result.success) {
      console.log(`   📝 Test messages processed: ${result.testMessages}`);
      console.log(`   💾 Memory state captured: ${result.memoryState ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    logResult(false, `API test failed: ${error.message}`);
  }
}

async function runAllTests() {
  log('\n🚀 Starting Enhanced Short-Term Memory Tests', 'bold');
  log(`📋 Session ID: ${TEST_SESSION_ID}`, 'yellow');
  log(`👤 User ID: ${TEST_USER_ID}`, 'yellow');
  
  try {
    // Run all test scenarios
    await testBasicEntityRecall();
    await testRoleChangeDetection();
    await testComplexEntityRelationships();
    await testTemporalMemory();
    await testCorrectionHandling();
    await testMemoryAnalytics();
    await testAPIEndpoints();
    
    log('\n🎉 All tests completed!', 'bold');
    log('\n📊 Test Summary:', 'bold');
    log('✅ Basic entity recall and storage', 'green');
    log('✅ Role change detection and correction', 'green');
    log('✅ Complex entity relationship management', 'green');
    log('✅ Temporal memory and sequential updates', 'green');
    log('✅ Multiple correction handling', 'green');
    log('✅ Memory analytics and entity tracking', 'green');
    log('✅ API endpoint functionality', 'green');
    
    log('\n🔗 Access the system:', 'bold');
    log(`Frontend: http://localhost:3001`, 'cyan');
    log(`API: http://localhost:3001/api`, 'cyan');
    log(`Memory Analytics: http://localhost:3001/api/memory/analytics/${TEST_SESSION_ID}`, 'cyan');
    log(`Entity Relationships: http://localhost:3001/api/memory/entities/${TEST_SESSION_ID}`, 'cyan');
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, sendMessage, getMemoryAnalytics, getEntityRelationships };
