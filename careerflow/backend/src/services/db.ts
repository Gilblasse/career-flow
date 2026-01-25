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

Logger.info(`Connecting to database at ${dbPath}`);
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Tables
const initSchema = () => {
    Logger.info('Initializing database schema...');

    // Jobs Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            title TEXT NOT NULL,
            ats_provider TEXT NOT NULL, -- 'greenhouse' | 'lever' | 'ashby'
            ats_job_id TEXT NOT NULL,
            job_url TEXT NOT NULL,
            location TEXT,
            is_remote BOOLEAN DEFAULT 0,
            description TEXT,
            posted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending', -- 'pending', 'analyzed', 'applied', 'rejected'
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(company, ats_job_id)
        )
    `);

    // Audit Log Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            action_type TEXT NOT NULL, -- 'INGEST', 'FILTER', 'MATCH', 'SUBMIT'
            job_id INTEGER,
            verdict TEXT, -- 'ACCEPTED', 'REJECTED', 'REVIEW_OPTIONAL'
            details TEXT, -- JSON blob of context
            metadata TEXT, -- JSON blob for Resume ID, etc.
            FOREIGN KEY(job_id) REFERENCES jobs(id)
        )
    `);

    Logger.info('Database schema initialized.');
};

// Export initSchema for testing/verification
export { initSchema };

export default db;
