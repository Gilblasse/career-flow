import { Page } from 'playwright';
import { BaseSubmitter } from './base-submitter.js';
import { Job, UserProfile } from '../../../types.js';

export class LeverSubmitter extends BaseSubmitter {
    name = 'Lever';

    async submit(page: Page, job: Job, profile: UserProfile, resumePath: string, dryRun = true): Promise<void> {
        // Lever forms are usually straightforward
        await this.fillField(page, ['input[name="name"]', 'input[name="fullName"]'], `${profile.contact.firstName} ${profile.contact.lastName}`, 'Full Name');
        await this.fillField(page, ['input[name="email"]'], profile.contact.email, 'Email');
        await this.fillField(page, ['input[name="phone"]'], profile.contact.phone, 'Phone');
        await this.fillField(page, ['input[name="org"]', 'input[name="company"]'], 'Current Employer', 'Current Company');

        // URLs
        // Lever often uses name="urls[LinkedIn]"
        if (profile.contact.linkedin) {
            await this.fillField(page, ['input[name="urls[LinkedIn]"]'], profile.contact.linkedin, 'LinkedIn');
        }
        if (profile.contact.portfolio) {
            await this.fillField(page, ['input[name="urls[Portfolio]"]'], profile.contact.portfolio, 'Portfolio');
        }

        // Resume
        await this.uploadResume(page, ['input[type="file"]'], resumePath);

        if (!dryRun) {
            // await page.click('button.postings-btn');
            // await page.waitForNavigation();
            console.log('Would click Submit Application here!');
        }
    }
}
