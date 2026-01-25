import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper } from './scrapers.js';
import { RawJob } from '../../types.js';
import Logger from '../../services/logger.js';

export class LeverScraper implements IScraper {
    name = 'Lever';

    async scrape(boardUrl: string): Promise<RawJob[]> {
        Logger.info(`Scraping Lever board: ${boardUrl}`);
        const jobs: RawJob[] = [];

        try {
            const response = await axios.get(boardUrl);
            const $ = cheerio.load(response.data);
            const companyName = $('title').text().split(' - ')[0] || 'Unknown Company'; // Lever titles usually "Company Name - jobs" or similar

            $('.posting').each((_, element) => {
                const title = $(element).find('[data-qa="posting-title"]').text().trim() || $(element).find('h5').text().trim();
                const anchor = $(element).find('a.posting-title');
                const relativeUrl = anchor.attr('href');
                const location = $(element).find('.sort-by-location').text().trim();
                const workType = $(element).find('.sort-by-commitment').text().trim();

                if (title && relativeUrl) {
                    const jobUrl = relativeUrl; // Lever usually provides absolute URLs
                    const atsJobId = relativeUrl.split('/').pop() || '';

                    if (atsJobId) {
                        jobs.push({
                            company: companyName,
                            title,
                            atsProvider: 'lever',
                            atsJobId,
                            jobUrl,
                            location,
                            isRemote: location.toLowerCase().includes('remote') || workType.toLowerCase().includes('remote'),
                            description: '',
                            postedAt: new Date()
                        });
                    }
                }
            });

            Logger.info(`Found ${jobs.length} jobs on ${boardUrl}`);
        } catch (error) {
            Logger.error(`Error scraping Lever board ${boardUrl}:`, error);
        }

        return jobs;
    }
}
