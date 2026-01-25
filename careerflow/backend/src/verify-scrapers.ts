import JobIngestionService from './modules/ingestion/service.js';
import Logger from './services/logger.js';

// Targets to verify
const targets = [
    'https://boards.greenhouse.io/figma',       // Greenhouse
    'https://jobs.lever.co/duolingo',          // Lever
    'https://jobs.ashbyhq.com/linear',         // Ashby
    'fc:https://news.ycombinator.com'          // FireCrawl (Simple test)
];

async function runVerification() {
    Logger.info('--- Starting Scraper Verification ---');
    try {
        await JobIngestionService.run(targets);
    } catch (error) {
        Logger.error('Verification Failed:', error);
    }
    Logger.info('--- Verification Complete ---');
}

runVerification();
