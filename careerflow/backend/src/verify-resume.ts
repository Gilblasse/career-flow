import ResumeGenerator from './modules/resume/generator.js';
import ProfileService from './services/profile.js';
import Logger from './services/logger.js';
import fs from 'fs';
import path from 'path';

async function verifyResumeGen() {
    Logger.info('--- Starting Resume Generation Verification ---');

    try {
        const profile = ProfileService.getConfig();
        const job = {
            id: 999,
            company: 'Test Corp',
            title: 'Senior Test Engineer',
            description: 'We need a tester.',
            isRemote: true,
            atsProvider: 'greenhouse' as const,
            atsJobId: 'test-gen',
            jobUrl: 'http://test.com',
            createdAt: new Date(),
            status: 'pending' as const
        };

        const buffer = await ResumeGenerator.generateResume(profile, job);

        const outputPath = path.resolve('test-resume.pdf');
        fs.writeFileSync(outputPath, buffer);

        Logger.info(`Resume generated successfully at: ${outputPath}`);
        Logger.info(`Size: ${buffer.length} bytes`);

        if (buffer.length < 1000) {
            throw new Error('PDF seems too small to be valid');
        }

    } catch (e) {
        Logger.error('Resume verification failed', e);
    }

    Logger.info('--- Resume Generation Verification Complete ---');
}

verifyResumeGen();
