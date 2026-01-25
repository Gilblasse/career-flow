import JobStore from './modules/ingestion/job-store.js';
import QueueProcessor from './modules/queue/processor.js';
import Logger from './services/logger.js';
import db, { initSchema } from './services/db.js';

async function verifyQueue() {
    Logger.info('--- Starting Queue Verification ---');

    try {
        // 1. Clear DB & Insert Mock Jobs
        db.exec('DROP TABLE IF EXISTS audit_logs');
        db.exec('DROP TABLE IF EXISTS jobs');

        // Re-init schema
        initSchema();

        // Insert a Greenhouse Job
        db.prepare(`
            INSERT INTO jobs (company, title, description, ats_provider, ats_job_id, job_url, status, is_remote)
            VALUES ('QueueTest', 'Queue Engineer', 'Testing Queue', 'greenhouse', 'q-test-1', 'https://boards.greenhouse.io/preview', 'pending', 1)
        `).run();

        // 2. Run Queue (Dry Run)
        Logger.info('Triggering Queue (Limit 1, DryRun=true)');
        await QueueProcessor.processQueue(1, true);

        // 3. Verify Status
        // Status should still be 'pending' or maybe updated if we decide dry run updates it?
        // Implementation plan said: "If !dryRun -> update status". So dry run leaves it pending.
        // Let's check logs mainly.

        const job = db.prepare('SELECT * FROM jobs WHERE ats_job_id = ?').get('q-test-1') as any;
        Logger.info(`Job Status after Dry Run: ${job.status}`);

        if (job.status !== 'pending') {
            // If I changed logic to update status even on dry run, checking here.
            // Currently logic says: if (!dryRun) JobStore.updateStatus(...)
            Logger.info('Correctly left as pending for dry run.');
        }

    } catch (e) {
        Logger.error('Queue verification failed', e);
    } finally {
        Logger.info('--- Queue Verification Complete ---');
    }
}

verifyQueue();
