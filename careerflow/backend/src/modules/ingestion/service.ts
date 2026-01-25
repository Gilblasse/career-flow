import Logger from '../../services/logger.js';
import JobStore from './job-store.js';
import { IScraper } from './scrapers.js';
import { GreenhouseScraper } from './greenhouse-scraper.js';
import { LeverScraper } from './lever-scraper.js';
import { AshbyScraper } from './ashby-scraper.js';
import { FireCrawlScraper } from './firecrawl-scraper.js';

class JobIngestionService {
    private scrapers: IScraper[] = [];

    constructor() {
        // Register Scrapers
        this.scrapers.push(new GreenhouseScraper());
        this.scrapers.push(new LeverScraper());
        this.scrapers.push(new AshbyScraper());
        this.scrapers.push(new FireCrawlScraper());
    }

    public async run(targets: string[]) {
        Logger.info('Starting Job Ingestion Cycle...');

        for (const target of targets) {
            let handler: IScraper | undefined;
            let scrapeTarget = target;

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

            if (handler) {
                try {
                    const jobs = await handler.scrape(scrapeTarget);
                    let savedCount = 0;

                    for (const job of jobs) {
                        const id = JobStore.saveJob(job);
                        if (id) savedCount++;
                    }

                    Logger.info(`Ingested ${savedCount} new jobs from ${scrapeTarget}`);
                } catch (err) {
                    Logger.error(`Error ingesting from ${scrapeTarget}`, err);
                }
            } else {
                Logger.warn(`No scraper found for target: ${target}`);
            }
        }

        Logger.info('Job Ingestion Cycle Complete.');
    }
}

export default new JobIngestionService();
