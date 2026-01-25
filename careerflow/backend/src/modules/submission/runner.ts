import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { Job } from '../../types.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';
import ProfileService from '../../services/profile.js';
import { CaptchaDetectedError } from '../../errors.js';

// Submitters
import { ISubmitter } from './submitters/submitter.interface.js';
import { GreenhouseSubmitter } from './submitters/greenhouse-submitter.js';
import { LeverSubmitter } from './submitters/lever-submitter.js';
import { AshbySubmitter } from './submitters/ashby-submitter.js';

export class ApplicationRunner {
    private browser: Browser | null = null;
    private submitters: ISubmitter[] = [];

    constructor() {
        this.submitters.push(new GreenhouseSubmitter());
        this.submitters.push(new LeverSubmitter());
        this.submitters.push(new AshbySubmitter());
    }

    public async submitApplication(job: Job, resumePath: string, dryRun = true) {
        Logger.info(`Starting submission for Job #${job.id} - ${job.company} (Dry Run: ${dryRun})`);
        const profile = ProfileService.getConfig(); // Still needed for fields

        try {
            this.browser = await chromium.launch({ headless: false }); // Headless: false for visibility
            const context = await this.browser.newContext();
            const page = await context.newPage();

            await page.goto(job.jobUrl);
            await page.waitForLoadState('networkidle');

            // CAPTCHA Detection
            const title = await page.title();
            const content = await page.content();
            if (
                title.includes('Just a moment') ||
                title.includes('Attention Required') ||
                content.includes('cf-turnstile') ||
                content.includes('g-recaptcha')
            ) {
                throw new CaptchaDetectedError(`CAPTCHA detected on ${job.jobUrl}`);
            }

            // Find config for this ATS
            let submitter: ISubmitter | undefined;
            if (job.atsProvider === 'greenhouse') submitter = this.submitters.find(s => s.name === 'Greenhouse');
            else if (job.atsProvider === 'lever') submitter = this.submitters.find(s => s.name === 'Lever');
            else if (job.atsProvider === 'ashby') submitter = this.submitters.find(s => s.name === 'Ashby');

            if (submitter) {
                Logger.info(`Using ${submitter.name} submitter`);
                await submitter.submit(page, job, profile, resumePath, dryRun);
            } else {
                throw new Error(`ATS ${job.atsProvider} not supported for submission`);
            }

            // 2. Upload verification (Screenshot)
            const screenshotPath = `screenshots/job_${job.id}_filled.png`;
            // Ensure dir exists
            const screenshotDir = path.dirname(screenshotPath);
            if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

            await page.screenshot({ path: screenshotPath });

            // 3. Final Review Gate
            AuditService.log({
                actionType: dryRun ? 'DRY_RUN' : 'SUBMIT',
                jobId: job.id,
                verdict: 'REVIEW_OPTIONAL',
                details: { screenshot: screenshotPath, submitter: submitter?.name, dryRun }
            });

            Logger.info(`Form processing complete for Job #${job.id}. Screenshot saved to ${screenshotPath}`);

        } catch (error: any) {
            Logger.error('Submission failed:', error);
            AuditService.log({
                actionType: 'ERROR',
                jobId: job.id,
                details: { error: error.message }
            });
            throw error;
        } finally {
            if (this.browser) await this.browser.close();
        }
    }
}

export default new ApplicationRunner();
