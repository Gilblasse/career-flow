import { Job } from '../../types.js';
import AuditService from '../../services/audit.js';
import Logger from '../../services/logger.js';
import { IFilterRule, TechStackRule, RemoteRule, SeniorityRule, FilterResult } from './rules.js';

import ProfileService from '../../services/profile.js';

class FilterEngine {
    private rules: IFilterRule[] = [];

    constructor() {
        const config = ProfileService.getConfig();

        this.rules.push(new TechStackRule(config.preferences.excludedKeywords));
        this.rules.push(new RemoteRule(config.preferences.remoteOnly));
        this.rules.push(new SeniorityRule(config.preferences.maxSeniority));
    }

    public analyze(job: Job): FilterResult {
        Logger.info(`Analyzing Job #${job.id}: ${job.company} - ${job.title}`);

        for (const rule of this.rules) {
            const result = rule.evaluate(job);

            if (result.status === 'REJECTED') {
                this.audit(job, result, rule.name);
                return result; // Fast fail
            }
        }

        const successResult: FilterResult = { status: 'ACCEPTED', reason: 'Passed all hard gates' };
        this.audit(job, successResult, 'All Rules');
        return successResult;
    }

    private audit(job: Job, result: FilterResult, trigger: string) {
        AuditService.log({
            actionType: 'FILTER',
            jobId: job.id,
            verdict: result.status,
            details: {
                reason: result.reason,
                triggerRule: trigger
            },
            metadata: { jobTitle: job.title }
        });
        Logger.info(`Filter Verdict for Job #${job.id}: ${result.status} (${result.reason})`);
    }
}

export default new FilterEngine();
