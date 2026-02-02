import Logger from '../../services/logger.js';
import JobStore from './job-store.js';
import { jobsService } from '../../services/jobs-service.js';
import { IScraper } from './scrapers.js';
import { GreenhouseScraper } from './greenhouse-scraper.js';
import { LeverScraper } from './lever-scraper.js';
import { AshbyScraper } from './ashby-scraper.js';
import { FireCrawlScraper } from './firecrawl-scraper.js';
import { 
    SCRAPE_TARGETS, 
    getTargetByUrl, 
    recordSuccess, 
    recordError,
    type ScrapeTarget 
} from '../../config/scrapeTargets.js';

export interface ScrapeResult {
    target: string;
    company: string;
    success: boolean;
    jobsFound: number;
    jobsInserted: number;
    jobsUpdated: number;
    error?: string;
}

export interface IngestionReport {
    startTime: Date;
    endTime: Date;
    duration: number;
    totalTargets: number;
    successfulTargets: number;
    failedTargets: number;
    totalJobsFound: number;
    totalJobsInserted: number;
    totalJobsUpdated: number;
    results: ScrapeResult[];
}

class JobIngestionService {
    private scrapers: IScraper[] = [];

    constructor() {
        // Register Scrapers
        this.scrapers.push(new GreenhouseScraper());
        this.scrapers.push(new LeverScraper());
        this.scrapers.push(new AshbyScraper());
        this.scrapers.push(new FireCrawlScraper());
    }

    /**
     * Run ingestion for configured scrape targets
     * Upserts jobs to the global jobs table
     */
    public async run(targets: string[]): Promise<IngestionReport> {
        const startTime = new Date();
        Logger.info('Starting Job Ingestion Cycle...');

        const results: ScrapeResult[] = [];
        let totalJobsFound = 0;
        let totalJobsInserted = 0;
        let totalJobsUpdated = 0;

        for (const target of targets) {
            const result = await this.scrapeTarget(target);
            results.push(result);

            if (result.success) {
                totalJobsFound += result.jobsFound;
                totalJobsInserted += result.jobsInserted;
                totalJobsUpdated += result.jobsUpdated;
            }
        }

        const endTime = new Date();
        const report: IngestionReport = {
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            totalTargets: targets.length,
            successfulTargets: results.filter(r => r.success).length,
            failedTargets: results.filter(r => !r.success).length,
            totalJobsFound,
            totalJobsInserted,
            totalJobsUpdated,
            results,
        };

        Logger.info(`Job Ingestion Complete: ${report.successfulTargets}/${report.totalTargets} targets, ${totalJobsInserted} inserted, ${totalJobsUpdated} updated`);
        return report;
    }

    /**
     * Scrape a single target and upsert jobs to the global catalog
     */
    private async scrapeTarget(target: string): Promise<ScrapeResult> {
        let handler: IScraper | undefined;
        let scrapeTarget = target;
        const targetConfig = getTargetByUrl(target);
        const company = targetConfig?.name || 'Unknown';

        if (target.includes('greenhouse.io')) {
            handler = this.scrapers.find(s => s.name === 'Greenhouse');
        } else if (target.includes('lever.co')) {
            handler = this.scrapers.find(s => s.name === 'Lever');
        } else if (target.includes('ashbyhq.com')) {
            handler = this.scrapers.find(s => s.name === 'Ashby');
        } else if (target.startsWith('fc:')) {
            handler = this.scrapers.find(s => s.name === 'FireCrawl');
            if (handler) {
                scrapeTarget = target.slice(3);
            }
        }

        if (!handler) {
            Logger.warn(`No scraper found for target: ${target}`);
            return {
                target,
                company,
                success: false,
                jobsFound: 0,
                jobsInserted: 0,
                jobsUpdated: 0,
                error: 'No scraper found for target URL',
            };
        }

        try {
            Logger.info(`Scraping ${company} (${target})...`);
            const jobs = await handler.scrape(scrapeTarget);
            
            // Upsert to global jobs table
            const { inserted, updated, failed } = await jobsService.upsertJobs(jobs);

            // Also save to legacy SQLite store for backwards compatibility
            let legacySaved = 0;
            for (const job of jobs) {
                const id = JobStore.saveJob(job);
                if (id) legacySaved++;
            }

            // Update health tracking
            if (targetConfig) {
                recordSuccess(targetConfig);
            }

            Logger.info(`Scraped ${company}: ${jobs.length} jobs found, ${inserted} inserted, ${updated} updated`);
            
            return {
                target,
                company,
                success: true,
                jobsFound: jobs.length,
                jobsInserted: inserted,
                jobsUpdated: updated,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            Logger.error(`Error scraping ${company}: ${errorMessage}`);
            
            // Update health tracking
            if (targetConfig) {
                recordError(targetConfig);
            }

            return {
                target,
                company,
                success: false,
                jobsFound: 0,
                jobsInserted: 0,
                jobsUpdated: 0,
                error: errorMessage,
            };
        }
    }

    /**
     * Run staleness cleanup - mark old jobs as inactive
     */
    public async runCleanup(staleDays: number = 7, purgeDays: number = 90): Promise<{ staleMarked: number; purged: number }> {
        Logger.info('Running job cleanup...');
        const staleMarked = await jobsService.markStaleJobsInactive(staleDays);
        const purged = await jobsService.purgeOldJobs(purgeDays);
        Logger.info(`Cleanup complete: ${staleMarked} marked inactive, ${purged} purged`);
        return { staleMarked, purged };
    }
}

export default new JobIngestionService();
