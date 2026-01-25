import { Page } from 'playwright';
import Logger from '../../../services/logger.js';
import { ISubmitter } from './submitter.interface.js';
import { Job, UserProfile } from '../../../types.js';

export abstract class BaseSubmitter implements ISubmitter {
    abstract name: string;

    abstract submit(page: Page, job: Job, profile: UserProfile, resumePath: string, dryRun?: boolean): Promise<void>;

    protected async fillField(page: Page, selectors: string[], value: string, fieldName: string) {
        let filled = false;
        for (const selector of selectors) {
            try {
                const locator = page.locator(selector).first();
                if (await locator.isVisible()) {
                    await locator.fill(value);
                    Logger.info(`Filled ${fieldName} using selector: ${selector}`);
                    filled = true;
                    break;
                }
            } catch (e) {
                // Ignore and try next
            }
        }
        if (!filled) {
            Logger.warn(`Could not fill field: ${fieldName}`);
        }
    }

    protected async uploadResume(page: Page, selectors: string[], filePath: string) {
        for (const selector of selectors) {
            try {
                const input = page.locator(selector).first();
                // Check if it exists in DOM, even if hidden (file inputs often hidden)
                if (await input.count() > 0) {
                    await input.setInputFiles(filePath);
                    Logger.info(`Uploaded resume using selector: ${selector}`);
                    return;
                }
            } catch (e) {
                Logger.warn(`Failed to upload resume with selector ${selector}: ${e}`);
            }
        }
        Logger.warn('Could not find resume upload field.');
    }
}
