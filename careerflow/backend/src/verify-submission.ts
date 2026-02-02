import ApplicationRunner from './modules/submission/runner.js';
import JobStore from './modules/ingestion/job-store.js';
import Logger from './services/logger.js';
import { Job } from './types.js';
import path from 'path';
import fs from 'fs';

async function runSubmissionVerification() {
    Logger.info('--- Starting Browser Submission Verification ---');

    // 1. Get a Job
    let jobs = JobStore.getPendingJobs(1);
    let job: Job;

    if (jobs.length === 0) {
        Logger.info('No pending jobs found in DB from ingestion. Creating a mock job.');
        // Create a mock Greenhouse job for testing (using a real URL if possible or a safe test one)
        const mockJob = {
            company: 'Figma',
            title: 'Software Engineer',
            description: 'Test Job',
            isRemote: true,
            atsProvider: 'greenhouse' as const,
            atsJobId: `test-sub-${Date.now()}`,
            jobUrl: 'https://boards.greenhouse.io/figma/jobs/4060868004', // Example URL, might be stale.
            location: 'Remote',
            postedAt: new Date()
        };
        const id = JobStore.saveJob(mockJob);
        if (id) {
            job = JobStore.getJob(id)!;
        } else {
            throw new Error('Failed to create mock job');
        }
    } else {
        job = jobs[0]!;
        Logger.info(`Using existing job #${job.id}: ${job.company} - ${job.title}`);
    }

    // 2. Create a test resume path (or use an existing one)
    const testResumePath = path.resolve('temp/test-resume.pdf');
    
    // Check if test resume exists, if not skip submission
    if (!fs.existsSync(testResumePath)) {
        Logger.warn(`Test resume not found at ${testResumePath}. Skipping actual submission.`);
        Logger.info('To test submission, place a resume PDF at: temp/test-resume.pdf');
        return;
    }

    // 3. Run Submission (Dry Run logic in Submitters)
    // Note: ApplicationRunner launches browser headless: false
    try {
        await ApplicationRunner.submitApplication(job, testResumePath, true);
        Logger.info('Submission flow completed (Dry Run). check screenshots/');
    } catch (error) {
        Logger.error('Submission Verification Failed:', error);
    }

    Logger.info('--- Submission Verification End ---');
}

runSubmissionVerification();
