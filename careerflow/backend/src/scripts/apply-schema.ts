/**
 * Apply Supabase Schema
 * 
 * This script applies the schema.sql to your Supabase database using raw PostgreSQL.
 */

import 'dotenv/config';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Use the direct database password from Supabase Dashboard > Settings > Database
const DATABASE_URL = process.env.DATABASE_URL;

async function applySchema() {
    if (!DATABASE_URL) {
        console.error('ERROR: DATABASE_URL environment variable is required.');
        console.log('');
        console.log('Get your database URL from:');
        console.log('  Supabase Dashboard > Project Settings > Database > Connection string (URI)');
        console.log('');
        console.log('Add to your .env file:');
        console.log('  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres');
        console.log('');
        process.exit(1);
    }

    console.log('Connecting to PostgreSQL...');
    
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected successfully!');
        console.log('');

        // Read the schema file
        const schemaPath = path.resolve('supabase/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        console.log('Executing schema.sql...');
        console.log('');

        // Execute the entire schema as one transaction
        await client.query(schema);

        console.log('✅ Schema applied successfully!');
        console.log('');
        console.log('Tables created:');
        console.log('  - profiles');
        console.log('  - applications');
        console.log('  - queue_campaigns');
        console.log('  - audit_logs');
        console.log('');
        console.log('RLS policies enabled for all tables.');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Sign up at http://localhost:5173');
        console.log('  2. Run: npm run seed -- <your-user-id>');
        console.log('  3. Run: npm run verify:e2e -- <your-user-id>');

    } catch (err: any) {
        console.error('❌ Error applying schema:', err.message);
        
        if (err.message.includes('already exists')) {
            console.log('');
            console.log('Some objects already exist. This is OK if you\'re re-running.');
        } else if (err.message.includes('connection')) {
            console.log('');
            console.log('Connection failed. Check your DATABASE_URL.');
            console.log('Make sure to use the direct connection string, not the pooler.');
        }
        
        process.exit(1);
    } finally {
        await client.end();
    }
}

applySchema().catch(console.error);
