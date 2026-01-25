import JobStore from './modules/ingestion/job-store.js';
import QueueProcessor from './modules/queue/processor.js';
import Logger from './services/logger.js';
import { CaptchaDetectedError } from './errors.js';
import ApplicationRunner from './modules/submission/runner.js';

// Mock ApplicationRunner.submitApplication to throw CAPTCHA error
const originalSubmit = ApplicationRunner.submitApplication;

async function verifyResilience() {
    Logger.info('--- Starting Resilience Verification ---');

    try {
        // Mocking
        ApplicationRunner.submitApplication = async () => {
            throw new CaptchaDetectedError('Simulated CAPTCHA');
        };

        // 1. Force state to processing
        Logger.info('Triggering Queue Processing...');
        // We need a pending job
        // Assume pending jobs exist from previous verify run or we can insert one if needed.
        // Let's assume one exists or we just rely on logic flow test.

        // Actually, let's insert a dummy job just to be safe.
        JobStore.saveJob({
            company: 'TestCorp',
            title: 'Captcha Test Job',
            atsProvider: 'greenhouse',
            atsJobId: 'captcha-test-1',
            jobUrl: 'http://example.com',
            description: 'Test'
        });

        await QueueProcessor.processQueue(1, true);

        // 2. Check status
        const status = QueueProcessor.getStatus();
        Logger.info(`Queue Status: Paused=${status.isPaused}`);

        if (status.isPaused) {
            Logger.info('SUCCESS: Queue paused on CAPTCHA error.');
        } else {
            Logger.error('FAILURE: Queue did not pause.');
        }

        // 3. Resume
        QueueProcessor.resume();
        const statusAfter = QueueProcessor.getStatus();
        if (!statusAfter.isPaused) {
            Logger.info('SUCCESS: Queue resumed.');
        }

    } catch (e) {
        Logger.error('Verification failed', e);
    } finally {
        // Restore
        ApplicationRunner.submitApplication = originalSubmit;
        Logger.info('--- Resilience Verification Complete ---');
    }
}

verifyResilience();
