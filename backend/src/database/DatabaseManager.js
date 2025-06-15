import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || join(__dirname, '../../data/chatbot.db');
    
    // Ensure data directory exists
    const dataDir = dirname(this.dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.setupTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async setupTables() {
    const tables = [
      // Chat sessions table
      `CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )`,
      
      // Messages table for chat history
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
      )`,
      
      // Long-term memory table
      `CREATE TABLE IF NOT EXISTS long_term_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        content TEXT NOT NULL,
        importance_score REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 0,
        metadata TEXT
      )`,
      
      // Document chunks for RAG
      `CREATE TABLE IF NOT EXISTS document_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding_vector TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Documents metadata
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT FALSE,
        metadata TEXT
      )`,
      
      // MCP tool usage logs
      `CREATE TABLE IF NOT EXISTS mcp_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        tool_name TEXT NOT NULL,
        parameters TEXT,
        response TEXT,
        success BOOLEAN DEFAULT TRUE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time REAL
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_long_term_memory_user_id ON long_term_memory(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_long_term_memory_importance ON long_term_memory(importance_score DESC)',
      'CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id)',
      'CREATE INDEX IF NOT EXISTS idx_mcp_logs_session_id ON mcp_logs(session_id)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  // Promisify database methods
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Chat session methods
  async createSession(sessionId, userId, metadata = {}) {
    return this.run(
      'INSERT INTO chat_sessions (id, user_id, metadata) VALUES (?, ?, ?)',
      [sessionId, userId, JSON.stringify(metadata)]
    );
  }

  async getSession(sessionId) {
    return this.get(
      'SELECT * FROM chat_sessions WHERE id = ?',
      [sessionId]
    );
  }

  async updateSessionTimestamp(sessionId) {
    return this.run(
      'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sessionId]
    );
  }

  // Message methods
  async saveMessage(sessionId, role, content, metadata = {}) {
    return this.run(
      'INSERT INTO messages (session_id, role, content, metadata) VALUES (?, ?, ?, ?)',
      [sessionId, role, content, JSON.stringify(metadata)]
    );
  }

  async getMessages(sessionId, limit = 50) {
    return this.all(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
      [sessionId, limit]
    );
  }

  async getRecentMessages(sessionId, count = 10) {
    return this.all(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
      [sessionId, count]
    );
  }

  // Long-term memory methods
  async saveLongTermMemory(userId, memoryType, content, importanceScore = 0.0, metadata = {}) {
    return this.run(
      'INSERT INTO long_term_memory (user_id, memory_type, content, importance_score, metadata) VALUES (?, ?, ?, ?, ?)',
      [userId, memoryType, content, importanceScore, JSON.stringify(metadata)]
    );
  }

  async getLongTermMemories(userId, limit = 20) {
    return this.all(
      'SELECT * FROM long_term_memory WHERE user_id = ? ORDER BY importance_score DESC, last_accessed DESC LIMIT ?',
      [userId, limit]
    );
  }

  async updateMemoryAccess(memoryId) {
    return this.run(
      'UPDATE long_term_memory SET last_accessed = CURRENT_TIMESTAMP, access_count = access_count + 1 WHERE id = ?',
      [memoryId]
    );
  }

  // Document methods
  async saveDocument(documentId, filename, fileType, fileSize, metadata = {}) {
    return this.run(
      'INSERT INTO documents (id, filename, file_type, file_size, metadata) VALUES (?, ?, ?, ?, ?)',
      [documentId, filename, fileType, fileSize, JSON.stringify(metadata)]
    );
  }

  async saveDocumentChunk(documentId, chunkIndex, content, embeddingVector = null, metadata = {}) {
    return this.run(
      'INSERT INTO document_chunks (document_id, chunk_index, content, embedding_vector, metadata) VALUES (?, ?, ?, ?, ?)',
      [documentId, chunkIndex, content, embeddingVector, JSON.stringify(metadata)]
    );
  }

  async getDocumentChunks(documentId) {
    return this.all(
      'SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index',
      [documentId]
    );
  }

  async getAllDocuments() {
    return this.all('SELECT * FROM documents ORDER BY upload_date DESC');
  }

  async markDocumentProcessed(documentId) {
    return this.run(
      'UPDATE documents SET processed = TRUE WHERE id = ?',
      [documentId]
    );
  }

  // MCP logging methods
  async logMCPUsage(sessionId, toolName, parameters, response, success = true, executionTime = 0) {
    return this.run(
      'INSERT INTO mcp_logs (session_id, tool_name, parameters, response, success, execution_time) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, toolName, JSON.stringify(parameters), JSON.stringify(response), success, executionTime]
    );
  }

  async getMCPLogs(sessionId = null, limit = 100) {
    if (sessionId) {
      return this.all(
        'SELECT * FROM mcp_logs WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
        [sessionId, limit]
      );
    } else {
      return this.all(
        'SELECT * FROM mcp_logs ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
    }
  }

  // Analytics methods
  async getSessionStats() {
    const stats = await this.get(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT user_id) as unique_users,
        AVG((julianday('now') - julianday(created_at)) * 24 * 60) as avg_session_duration_minutes
      FROM chat_sessions
    `);
    
    const messageStats = await this.get(`
      SELECT 
        COUNT(*) as total_messages,
        AVG(LENGTH(content)) as avg_message_length
      FROM messages
    `);
    
    return { ...stats, ...messageStats };
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('Database connection closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
