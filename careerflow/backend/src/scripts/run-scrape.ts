/**
 * Job Scraping Runner Script
 * 
 * This script is designed to be run by external cron jobs (GitHub Actions, 
 * Supabase Edge Functions, or node-cron) to scrape jobs and perform cleanup.
 * 
 * Usage:
 *   npm run scrape            # Run full scrape + cleanup
 *   npm run scrape -- --scrape-only    # Run scrape only
 *   npm run scrape -- --cleanup-only   # Run cleanup only
 * 
 * Environment Variables:
 *   OPENAI_API_KEY - Required for some scrapers
 *   FIRECRAWL_API_KEY - Required for FireCrawl scraper
 */

import 'dotenv/config';
import JobIngestionService from '../modules/ingestion/service.js';
import { getEnabledTargetUrls, getEnabledTargets, getUnhealthyTargets } from '../config/scrapeTargets.js';
import Logger from '../services/logger.js';

const STALE_DAYS = 7;  // Mark jobs inactive after 7 days
const PURGE_DAYS = 90; // Delete inactive jobs after 90 days

async function runScrape() {
    const targets = getEnabledTargetUrls();
    Logger.info(`Starting scheduled scrape for ${targets.length} targets...`);
    
    const report = await JobIngestionService.run(targets);
    
    // Log summary
    Logger.info('=== Scrape Summary ===');
    Logger.info(`Duration: ${report.duration}ms`);
    Logger.info(`Targets: ${report.successfulTargets}/${report.totalTargets} successful`);
    Logger.info(`Jobs: ${report.totalJobsFound} found, ${report.totalJobsInserted} new, ${report.totalJobsUpdated} updated`);
    
    // Log any failures
    const failures = report.results.filter(r => !r.success);
    if (failures.length > 0) {
        Logger.warn(`Failed targets (${failures.length}):`);
        for (const failure of failures) {
            Logger.warn(`  - ${failure.company}: ${failure.error}`);
        }
    }

    // Check for unhealthy targets
    const unhealthy = getUnhealthyTargets(3);
    if (unhealthy.length > 0) {
        Logger.warn(`Unhealthy targets (${unhealthy.length} with 3+ consecutive errors):`);
        for (const target of unhealthy) {
            Logger.warn(`  - ${target.name}: ${target.errorCount} errors`);
        }
    }

    return report;
}

async function runCleanup() {
    Logger.info('Starting scheduled cleanup...');
    
    const result = await JobIngestionService.runCleanup(STALE_DAYS, PURGE_DAYS);
    
    Logger.info('=== Cleanup Summary ===');
    Logger.info(`Marked inactive: ${result.staleMarked} jobs (not seen in ${STALE_DAYS} days)`);
    Logger.info(`Purged: ${result.purged} jobs (inactive for ${PURGE_DAYS}+ days)`);
    
    return result;
}

async function main() {
    const args = process.argv.slice(2);
    const scrapeOnly = args.includes('--scrape-only');
    const cleanupOnly = args.includes('--cleanup-only');

    Logger.info('====================================');
    Logger.info('CareerFlow Job Scraping Runner');
    Logger.info(`Started at: ${new Date().toISOString()}`);
    Logger.info('====================================');

    try {
        if (cleanupOnly) {
            await runCleanup();
        } else if (scrapeOnly) {
            await runScrape();
        } else {
            // Run both: scrape first, then cleanup
            await runScrape();
            await runCleanup();
        }

        Logger.info('====================================');
        Logger.info('Job Scraping Runner completed successfully');
        Logger.info(`Finished at: ${new Date().toISOString()}`);
        Logger.info('====================================');
        
        process.exit(0);
    } catch (error) {
        Logger.error('Job Scraping Runner failed:', error);
        process.exit(1);
    }
}

// Always run when executed via tsx
main();

export { runScrape, runCleanup };
