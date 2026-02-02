/**
 * Database Service
 * 
 * This module now uses Supabase as the primary database.
 * The SQLite implementation is kept for backward compatibility
 * but Supabase is preferred for all new code.
 */

import Database from 'better-sqlite3';
import path from 'path';
import Logger from './logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../data', 'careerflow.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

Logger.info(`Connecting to SQLite database at ${dbPath} (legacy - Supabase preferred)`);
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Tables (legacy SQLite schema)
const initSchema = () => {
    Logger.info('Initializing legacy SQLite schema...');

    // Jobs Table (legacy - use Supabase applications table)
    db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            title TEXT NOT NULL,
            ats_provider TEXT NOT NULL,
            ats_job_id TEXT NOT NULL,
            job_url TEXT NOT NULL,
            location TEXT,
            is_remote BOOLEAN DEFAULT 0,
            description TEXT,
            posted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(company, ats_job_id)
        )
    `);

    // Audit Log Table (legacy - use Supabase audit_logs table)
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            action_type TEXT NOT NULL,
            job_id INTEGER,
            verdict TEXT,
            details TEXT,
            metadata TEXT,
            FOREIGN KEY(job_id) REFERENCES jobs(id)
        )
    `);

    Logger.info('Legacy SQLite schema initialized.');
};

// Export initSchema for testing/verification
export { initSchema };

// Export legacy SQLite db for backward compatibility during migration
export default db;
