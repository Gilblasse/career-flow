import { Page } from 'playwright';
import { BaseSubmitter } from './base-submitter.js';
import { Job, UserProfile } from '../../../types.js';

export class AshbySubmitter extends BaseSubmitter {
    name = 'Ashby';

    async submit(page: Page, job: Job, profile: UserProfile, resumePath: string, dryRun = true): Promise<void> {
        // Ashby forms often use name attributes or labels
        await this.fillField(page, ['input[name="name"]'], `${profile.contact.firstName} ${profile.contact.lastName}`, 'Full Name');
        await this.fillField(page, ['input[name="email"]'], profile.contact.email, 'Email');
        await this.fillField(page, ['input[name="phoneNumber"]', 'input[type="tel"]'], profile.contact.phone, 'Phone');

        // Resume
        // Ashby's resume upload is usually an input[type="file"]
        await this.uploadResume(page, ['input[type="file"]'], resumePath);

        if (!dryRun) {
            // await page.click('button[type="submit"]');
            console.log('Would click submit here!');
        }
    }
}
