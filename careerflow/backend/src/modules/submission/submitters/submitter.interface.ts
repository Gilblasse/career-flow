import { Page } from 'playwright';
import { Job, UserProfile } from '../../../types.js';

export interface ISubmitter {
    name: string;
    submit(page: Page, job: Job, profile: UserProfile, resumePath: string, dryRun?: boolean): Promise<void>;
}
