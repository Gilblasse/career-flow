import { Page } from 'playwright';
import { BaseSubmitter } from './base-submitter.js';
import { Job, UserProfile } from '../../../types.js';

export class GreenhouseSubmitter extends BaseSubmitter {
    name = 'Greenhouse';

    async submit(page: Page, job: Job, profile: UserProfile, resumePath: string, dryRun = true): Promise<void> {
        // 1. Personal Info
        await this.fillField(page, ['#first_name'], profile.contact.firstName, 'First Name');
        await this.fillField(page, ['#last_name'], profile.contact.lastName, 'Last Name');
        await this.fillField(page, ['#email'], profile.contact.email, 'Email');
        await this.fillField(page, ['#phone'], profile.contact.phone, 'Phone');

        // 2. URLs
        if (profile.contact.linkedin) {
            await this.fillField(page, ['input[name*="linkedin" i]', 'label:has-text("LinkedIn") + input'], profile.contact.linkedin, 'LinkedIn');
        }
        if (profile.contact.portfolio) {
            await this.fillField(page, ['input[name*="website" i]', 'label:has-text("Website") + input'], profile.contact.portfolio, 'Portfolio');
        }

        // 3. Location (ATS specific)
        // Greenhouse often has a location dropdown or autocomplete.
        // await this.fillField(page, ['#job_application_location'], profile.contact.location, 'Location');

        // 4. Resume
        await this.uploadResume(page, ['#resume_fieldset input[type="file"]', '[data-source="attach"]', 'input[type="file"]'], resumePath);

        // 5. Custom Questions - Detect but don't guess?
        // Inherited from BaseSubmitter or specific logic if needed.
    }
}
