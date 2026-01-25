import axios from 'axios';
import { IScraper } from './scrapers.js';
import { RawJob } from '../../types.js';
import Logger from '../../services/logger.js';

export class AshbyScraper implements IScraper {
    name = 'Ashby';

    async scrape(boardUrl: string): Promise<RawJob[]> {
        Logger.info(`Scraping Ashby board: ${boardUrl}`);
        const jobs: RawJob[] = [];

        // Extract company slug
        // Expected format: https://jobs.ashbyhq.com/company-name
        let companySlug = '';
        try {
            const urlObj = new URL(boardUrl);
            const parts = urlObj.pathname.split('/').filter(p => p);
            if (parts.length > 0) {
                // If it's jobs.ashbyhq.com/company, slug is parts[0]
                // If the user provided the company name directly, we might need to handle that, but assuming URL for now.
                companySlug = parts[0] || '';
            }
        } catch (e) {
            Logger.error('Invalid Ashby URL', { url: boardUrl });
            return [];
        }

        if (!companySlug) {
            Logger.warn(`Could not extract company slug from ${boardUrl}`);
            return [];
        }

        try {
            const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (data && data.jobs) {
                for (const job of data.jobs) {
                    jobs.push({
                        company: companySlug,
                        title: job.title,
                        atsProvider: 'ashby',
                        atsJobId: job.id,
                        jobUrl: job.jobUrl,
                        location: job.location,
                        isRemote: job.isRemote,
                        description: '',
                        postedAt: new Date(job.publishedAt)
                    });
                }
            }
            Logger.info(`Found ${jobs.length} jobs on ${boardUrl}`);
        } catch (error) {
            Logger.error(`Error scraping Ashby board ${boardUrl}:`, error);
        }
        return jobs;
    }
}
