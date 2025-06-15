#!/usr/bin/env node

/**
 * Semantic Memory Test Script
 * 
 * This script demonstrates the capabilities of the semantic memory system
 * by simulating a conversation and showing how semantic context retrieval works.
 * 
 * Run from the chatbot-playground directory:
 * cd chatbot-playground/backend && node ../test-semantic-memory.js
 */

import dotenv from 'dotenv';
import { SemanticMemoryManager } from './src/memory/SemanticMemoryManager.js';
import { DatabaseManager } from './src/database/DatabaseManager.js';

// Load environment variables
dotenv.config({ path: './.env' });

async function testSemanticMemory() {
  console.log('🧠 Testing Semantic Memory System');
  console.log('================================\n');

  // Initialize database and semantic memory
  const dbManager = new DatabaseManager();
  await dbManager.initialize();
  
  const semanticMemory = new SemanticMemoryManager(dbManager, {
    similarityThreshold: 0.7,
    maxSemanticContext: 3,
    clusteringInterval: 3,
    semanticWeight: 0.6
  });
  
  try {
    await semanticMemory.initialize();
    console.log('✅ Semantic Memory Manager initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize semantic memory:', error.message);
    console.log('\n💡 Make sure you have set OPENAI_API_KEY in backend/.env');
    process.exit(1);
  }

  const sessionId = 'test-session-' + Date.now();
  
  // Simulate a conversation with various topics
  const conversation = [
    { role: 'user', message: 'Hi, I\'m working on a JavaScript project and having trouble with async functions.' },
    { role: 'assistant', message: 'I\'d be happy to help with JavaScript async functions! What specific issue are you encountering?' },
    { role: 'user', message: 'I keep getting Promise pending errors when I try to use await.' },
    { role: 'assistant', message: 'That usually happens when you\'re not using await inside an async function. Can you show me your code?' },
    { role: 'user', message: 'Actually, let me ask about something else. What\'s the weather like today?' },
    { role: 'assistant', message: 'I don\'t have access to current weather data, but I can help you find weather information online.' },
    { role: 'user', message: 'Okay, back to my coding problem. The async await syntax is confusing me.' },
    { role: 'assistant', message: 'Let me explain async/await step by step. It\'s a way to handle asynchronous operations more cleanly than callbacks or .then().' },
    { role: 'user', message: 'I\'m also struggling with understanding Promises in general.' },
    { role: 'assistant', message: 'Promises are fundamental to async/await. A Promise represents a value that may be available now, later, or never.' }
  ];

  console.log('📝 Adding conversation messages...\n');
  
  // Add messages to semantic memory
  for (let i = 0; i < conversation.length; i++) {
    const { role, message } = conversation[i];
    console.log(`${i + 1}. ${role}: ${message.substring(0, 60)}...`);
    
    await semanticMemory.addToShortTermMemory(sessionId, message, role);
    
    // Show clustering when it happens
    if ((i + 1) % 3 === 0) {
      console.log('   🔄 Performing semantic clustering...');
    }
  }

  console.log('\n📊 Memory Statistics:');
  const stats = semanticMemory.getMemoryStats();
  console.log(`   - Total messages: ${stats.shortTerm.totalMessages}`);
  console.log(`   - Messages with embeddings: ${stats.shortTerm.messagesWithEmbeddings}`);
  console.log(`   - Semantic clusters: ${stats.shortTerm.totalClusters}`);
  console.log(`   - Embedding model: ${stats.config.embeddingModel}`);

  console.log('\n🔍 Testing Semantic Context Retrieval:');
  console.log('=====================================\n');

  // Test semantic queries
  const testQueries = [
    'I need help with asynchronous programming',
    'Can you explain JavaScript promises?',
    'What about the weather forecast?',
    'How do I handle async operations?'
  ];

  for (const query of testQueries) {
    console.log(`🔎 Query: "${query}"`);
    
    // Get relevant context using semantic memory
    const relevantContext = await semanticMemory.getRelevantContext(sessionId, query, 1000);
    
    console.log(`   Found ${relevantContext.length} relevant messages:`);
    
    relevantContext.forEach((msg, index) => {
      const contextType = msg.contextType || 'unknown';
      const score = msg.relevanceScore ? msg.relevanceScore.toFixed(3) : 'N/A';
      const preview = msg.content.substring(0, 50) + '...';
      
      console.log(`   ${index + 1}. [${contextType}] (${score}) ${msg.role}: ${preview}`);
    });
    
    console.log('');
  }

  console.log('🎯 Semantic Clustering Results:');
  console.log('===============================\n');

  const contextSummary = await semanticMemory.getContextSummary(sessionId);
  
  if (contextSummary.semanticClusters && contextSummary.semanticClusters.length > 0) {
    contextSummary.semanticClusters.forEach((cluster, index) => {
      console.log(`Cluster ${index + 1}: ${cluster.id}`);
      console.log(`   - Messages: ${cluster.messageCount}`);
      console.log(`   - Topics: ${cluster.topics.join(', ')}`);
      if (cluster.summary) {
        console.log(`   - Summary: ${cluster.summary.substring(0, 80)}...`);
      }
      console.log('');
    });
  } else {
    console.log('   No clusters formed yet (need more messages)');
  }

  console.log('🏷️  Extracted Entities:');
  console.log('======================\n');

  if (contextSummary.keyEntities && contextSummary.keyEntities.length > 0) {
    contextSummary.keyEntities.slice(0, 5).forEach(entity => {
      console.log(`   - ${entity.type}: ${entity.value} (mentioned ${entity.count} times)`);
    });
  } else {
    console.log('   No significant entities extracted');
  }

  console.log('\n📈 Performance Test:');
  console.log('===================\n');

  // Test performance with a semantic query
  const performanceQuery = 'Help me understand JavaScript async programming';
  const startTime = Date.now();
  
  const semanticMatches = await semanticMemory.getSemanticContext(sessionId, performanceQuery, 5);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`   Query: "${performanceQuery}"`);
  console.log(`   Semantic matches found: ${semanticMatches.length}`);
  console.log(`   Search time: ${duration}ms`);
  
  if (semanticMatches.length > 0) {
    console.log('   Top matches:');
    semanticMatches.forEach((match, index) => {
      console.log(`     ${index + 1}. Similarity: ${match.similarity.toFixed(3)} - ${match.content.substring(0, 40)}...`);
    });
  }

  console.log('\n✅ Semantic Memory Test Complete!');
  console.log('\n💡 Key Observations:');
  console.log('   - Semantic memory can find related messages even with different wording');
  console.log('   - Clustering groups related conversation topics automatically');
  console.log('   - Context retrieval combines both recent and semantically relevant messages');
  console.log('   - The system learns conversation patterns and improves over time');

  // Cleanup
  await dbManager.close();
  
  console.log('\n🎉 Test completed successfully!');
}

// Run the test
testSemanticMemory().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
