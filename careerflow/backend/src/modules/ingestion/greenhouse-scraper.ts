import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper } from './scrapers.js';
import { RawJob } from '../../types.js';
import Logger from '../../services/logger.js';

export class GreenhouseScraper implements IScraper {
    name = 'Greenhouse';

    async scrape(boardUrl: string): Promise<RawJob[]> {
        Logger.info(`Scraping Greenhouse board: ${boardUrl}`);
        const jobs: RawJob[] = [];

        try {
            const response = await axios.get(boardUrl);
            const $ = cheerio.load(response.data);
            const companyName = $('title').text().split(' at ')[1] || 'Unknown Company';

            // Greenhouse boards typically have .opening elements
            $('.opening').each((_, element) => {
                const title = $(element).find('a').text().trim();
                const relativeUrl = $(element).find('a').attr('href');
                const location = $(element).find('.location').text().trim();

                if (title && relativeUrl) {
                    const jobUrl = `https://boards.greenhouse.io${relativeUrl}`;
                    const atsJobId = relativeUrl.split('/').pop() || '';

                    if (atsJobId) {
                        jobs.push({
                            company: companyName.trim(),
                            title,
                            atsProvider: 'greenhouse',
                            atsJobId,
                            jobUrl,
                            location,
                            isRemote: location.toLowerCase().includes('remote'),
                            description: '', // Detailed description requires visiting the job page
                            postedAt: new Date() // Greenhouse main boards don't usually show date
                        });
                    }
                }
            });

            Logger.info(`Found ${jobs.length} jobs on ${boardUrl}`);
        } catch (error) {
            Logger.error(`Error scraping Greenhouse board ${boardUrl}:`, error);
        }

        return jobs;
    }
}
