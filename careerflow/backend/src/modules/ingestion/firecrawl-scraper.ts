import axios from 'axios';
import { IScraper } from './scrapers.js';
import { RawJob } from '../../types.js';
import Logger from '../../services/logger.js';

export class FireCrawlScraper implements IScraper {
    name = 'FireCrawl';
    // Using the key provided in mcp_config.json
    private apiKey = process.env.FIRECRAWL_API_KEY || 'fc-bf034141948047d089d112beb8fb2305';

    async scrape(targetUrl: string): Promise<RawJob[]> {
        Logger.info(`Scraping with FireCrawl: ${targetUrl}`);
        const jobs: RawJob[] = [];

        try {
            // Basic implementation: Scrape and check for links.
            // In a real generic scraper, we'd use LLM extraction or FireCrawl's features more deeply.
            // For now, this serves as a placeholder/basic integration.
            const response = await axios.post(
                'https://api.firecrawl.dev/v0/scrape',
                { url: targetUrl, formats: ['markdown', 'links'] },
                { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
            );

            if (response.data && response.data.success) {
                Logger.info('FireCrawl scrape successful', {
                    metadata: response.data.metadata,
                    linksCount: response.data.links?.length
                });

                // TODO: Implement generic parsing logic here.
                // For now, we return empty to avoid polluting with invalid jobs.
            }
        } catch (error) {
            Logger.error('FireCrawl error:', error);
        }

        return jobs;
    }
}
