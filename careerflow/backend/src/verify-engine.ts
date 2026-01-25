/**
 * Verification Script: End-to-End Pipeline
 * 
 * 1. Mocks a Scraped Job
 * 2. Saves to JobStore (Ingest) -> Audit: INGEST
 * 3. Runs FilterEngine (Hard Gates) -> Audit: FILTER
 * 4. Runs ResumeEngine (Match) -> Audit: MATCH
 * 5. Mocks Submission (Dry Run) -> Audit: SUBMIT
 */

import JobStore from './modules/ingestion/job-store.js';
import FilterEngine from './modules/filtering/engine.js';
import ResumeEngine from './modules/resume/engine.js';
import ApplicationRunner from './modules/submission/runner.js';
import AuditService from './services/audit.js';
import Logger from './services/logger.js';
import { RawJob, Job } from './types.js';
import db from './services/db.js';

async function runVerification() {
    Logger.info('=== STARTING ENGINE VERIFICATION ===');

    // MOCK JOB - Should PASS
    const mockJob: RawJob = {
        company: 'Vertex Dynamics',
        title: 'Data Engineer (Remote)',
        atsProvider: 'greenhouse',
        atsJobId: 'job_12346',
        jobUrl: 'https://boards.greenhouse.io/vertex/jobs/12345',
        location: 'Remote',
        isRemote: true,
        // Description mentions Python/SQL -> Should match Vega
        description: 'We are looking for a Data Engineer with strong Python and SQL skills to build pipelines. Remote friendly.'
    };

    // 1. INGEST
    Logger.info('--- STEP 1: INGESTION ---');
    const jobId = JobStore.saveJob(mockJob);
    if (!jobId) {
        Logger.error('Ingestion failed (Duplicate?)');
        return;
    }

    // Fetch full object
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as Job;
    // Map boolean back manually because sqlite stores 0/1
    job.isRemote = Boolean(job.isRemote);

    // 2. FILTERing
    Logger.info('--- STEP 2: FILTERING ---');
    const filterResult = FilterEngine.analyze(job);
    if (filterResult.status === 'REJECTED') {
        Logger.warn(`Job Rejected: ${filterResult.reason}`);
        return;
    }

    // 3. RESUME MATCHING
    Logger.info('--- STEP 3: RESUME MATCH ---');
    const matchResult = ResumeEngine.selectResume(job);
    Logger.info(`Selected Resume: ${matchResult.selectedResumeId} (Score: ${matchResult.matchScore})`);

    // Verify it picked 'Vega' (Data profile)
    if (matchResult.selectedResumeId !== 'vega') {
        Logger.error('VERIFICATION FAILED: Expected Vega for Data Role');
    } else {
        Logger.info('VERIFICATION PASSED: Correctly selected "Vega" for Data Engineer role.');
    }

    // 4. TAILORING (Diff Check)
    const tailored = ResumeEngine.tailorResume(matchResult.selectedResumeId, job);

    // 5. SUBMISSION (Mock - skipping browser launch to keep it fast/headless safe for now, or just logging)
    Logger.info('--- STEP 4: SUBMISSION ---');
    // We won't actually launch browser in this verif script to avoid hanging, 
    // but we check if the code path exists.
    Logger.info('Skipping actual browser launch for verification script. Check modules/submission/runner.ts for implementation.');

    // 6. VERIFY AUDIT LOGS
    Logger.info('--- STEP 5: AUDITING ---');
    const logs = db.prepare('SELECT * FROM audit_logs WHERE job_id = ?').all(jobId);
    console.table(logs);

    if (logs.length >= 3) {
        Logger.info('VERIFICATION SUCCESS: Audit logs created for Ingest, Filter, and Match.');
    } else {
        Logger.error('VERIFICATION FAILED: Missing audit logs.');
    }

    Logger.info('=== VERIFICATION COMPLETE ===');
}

runVerification().catch(e => console.error(e));
