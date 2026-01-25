import { Job } from '../../types.js';

export interface FilterResult {
    status: 'ACCEPTED' | 'REJECTED' | 'REVIEW_OPTIONAL';
    reason: string;
}

export interface IFilterRule {
    name: string;
    evaluate(job: Job): FilterResult;
}

// Rule 1: Excluded Technologies
export class TechStackRule implements IFilterRule {
    name = 'Excluded Technology';
    private excludedKeywords: string[];

    constructor(excludedKeywords: string[] = []) {
        this.excludedKeywords = excludedKeywords.map(k => k.toLowerCase());
    }

    evaluate(job: Job): FilterResult {
        const text = (job.title + ' ' + job.description).toLowerCase();
        for (const keyword of this.excludedKeywords) {
            // Simple keyword match, could be improved with regex boundary checks
            if (text.includes(keyword)) {
                return { status: 'REJECTED', reason: `Contains excluded technology: ${keyword}` };
            }
        }
        return { status: 'ACCEPTED', reason: 'Tech stack compatible' };
    }
}

// Rule 2: Remote Policy
export class RemoteRule implements IFilterRule {
    name = 'Remote Policy';
    private remoteOnly: boolean;

    constructor(remoteOnly: boolean = true) {
        this.remoteOnly = remoteOnly;
    }

    evaluate(job: Job): FilterResult {
        // If not strictly remote-only, accept unless there's a strong reason not to? 
        // For now, if remoteOnly is false, we just accept everything on this rule, 
        // or we could check for location mismatch if we had preferred locations.
        if (!this.remoteOnly) {
            return { status: 'ACCEPTED', reason: 'Remote not required' };
        }

        // Hard requirement: Must be remote
        if (!job.isRemote) {
            // Check if title mentions 'remote' as fallback since isRemote flag comes from scraper
            if (!job.title.toLowerCase().includes('remote')) {
                return { status: 'REJECTED', reason: 'Position is not marked as remote' };
            }
        }
        return { status: 'ACCEPTED', reason: 'Remote position' };
    }
}

// Rule 3: Seniority
export class SeniorityRule implements IFilterRule {
    name = 'Seniority Mismatch';
    private excludedLevels: string[];

    constructor(excludedLevels: string[] = []) {
        this.excludedLevels = excludedLevels.map(l => l.toLowerCase());
    }

    evaluate(job: Job): FilterResult {
        const title = job.title.toLowerCase();
        for (const level of this.excludedLevels) {
            if (title.includes(level)) {
                return { status: 'REJECTED', reason: `Seniority level too high: ${level}` };
            }
        }
        return { status: 'ACCEPTED', reason: 'Seniority level acceptable' };
    }
}
