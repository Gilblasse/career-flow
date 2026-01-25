import ApplicationRunner from './modules/submission/runner.js';
import JobStore from './modules/ingestion/job-store.js';
import { RESUME_INVENTORY } from './modules/resume/inventory.js';
import Logger from './services/logger.js';
import { Job } from './types.js';

async function runSubmissionVerification() {
    Logger.info('--- Starting Browser Submission Verification ---');

    // 1. Get a Job
    let jobs = JobStore.getPendingJobs(1);
    let job: Job;

    if (jobs.length === 0) {
        Logger.info('No pending jobs found in DB from ingestion. Creating a mock job.');
        // Create a mock Greenhouse job for testing (using a real URL if possible or a safe test one)
        // Figma or similar usually has open roles.
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
        job = jobs[0];
        Logger.info(`Using existing job #${job.id}: ${job.company} - ${job.title}`);
    }

    // 2. Select a Resume (Mock Selection)
    const resume = RESUME_INVENTORY.find(r => r.id === 'lyra'); // General resume
    if (!resume) throw new Error('Resume inventory empty');

    // 3. Run Submission (Dry Run logic in Submitters)
    // Note: ApplicationRunner launches browser headless: false
    try {
        await ApplicationRunner.submitApplication(job, resume);
        Logger.info('Submission flow completed (Dry Run). check screenshots/');
    } catch (error) {
        Logger.error('Submission Verification Failed:', error);
    }

    Logger.info('--- Submission Verification End ---');
}

runSubmissionVerification();
