import ProfileService from './services/profile.js';
import FilterEngine from './modules/filtering/engine.js';
import JobStore from './modules/ingestion/job-store.js';
import { Job } from './types.js';
import Logger from './services/logger.js';

// Mock Job Helper
function createMockJob(title: string, description: string, isRemote: boolean = true): Job {
    const rawJob = {
        company: 'Mock Corp',
        title,
        description,
        isRemote,
        atsProvider: 'greenhouse' as const,
        atsJobId: `test-${Math.floor(Math.random() * 100000)}`,
        jobUrl: 'http://mock.url',
        location: 'Remote',
        postedAt: new Date()
    };

    // Save to DB to get ID and ensure FK integrity for Audit
    const id = JobStore.saveJob(rawJob);

    if (!id) throw new Error('Failed to save mock job (duplicate?)');

    return {
        ...rawJob,
        id,
        createdAt: new Date(),
        status: 'pending'
    };
}

async function runProfileVerification() {
    Logger.info('--- Starting Profile Rules Verification ---');

    // Load config to see what we are testing against
    const config = ProfileService.getConfig();
    Logger.info(`Loaded Profile for: ${config.contact.firstName} ${config.contact.lastName}`);
    Logger.info(`Excluded Keywords: ${config.preferences.excludedKeywords.join(', ')}`);
    Logger.info(`Max Seniority (Excluded): ${config.preferences.maxSeniority.join(', ')}`);

    // Test 1: Excluded Tech (Java)
    // Profile defaults exclude "Java"
    try {
        const javaJob = createMockJob('Backend Engineer', 'We use Java and Spring Boot.');
        const result1 = FilterEngine.analyze(javaJob);
        Logger.info(`Test 1 (Java Job): ${result1.status} - ${result1.reason}`);

        if (result1.status !== 'REJECTED') {
            Logger.error('FAILED: Java job should have been rejected.');
        }
    } catch (e) {
        Logger.error('Test 1 Exception', e);
    }

    // Test 2: Seniority (Staff)
    // Profile defaults exclude "Staff"
    try {
        const staffJob = createMockJob('Staff Engineer', 'High level role.');
        const result2 = FilterEngine.analyze(staffJob);
        Logger.info(`Test 2 (Staff Job): ${result2.status} - ${result2.reason}`);

        if (result2.status !== 'REJECTED') {
            Logger.error('FAILED: Staff job should have been rejected.');
        }
    } catch (e) {
        Logger.error('Test 2 Exception', e);
    }

    // Test 3: Valid Job (TypeScript)
    try {
        const tsJob = createMockJob('Frontend Engineer', 'We use TypeScript and React.');
        const result3 = FilterEngine.analyze(tsJob);
        Logger.info(`Test 3 (TS Job): ${result3.status} - ${result3.reason}`);

        if (result3.status !== 'ACCEPTED') {
            Logger.error('FAILED: TypeScript job should have been accepted.');
        }
    } catch (e) {
        Logger.error('Test 3 Exception', e);
    }

    Logger.info('--- Profile Verification Complete ---');
}

runProfileVerification();
