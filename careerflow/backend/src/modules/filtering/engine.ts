import { Job } from '../../types.js';
import AuditService from '../../services/audit.js';
import Logger from '../../services/logger.js';
import { IFilterRule, TechStackRule, RemoteRule, SeniorityRule, FilterResult } from './rules.js';

import ProfileService from '../../services/profile.js';

interface RuleResult {
    ruleName: string;
    passed: boolean;
    reason: string;
}

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

        const ruleBreakdown: RuleResult[] = [];
        let finalResult: FilterResult = { status: 'ACCEPTED', reason: 'Passed all hard gates' };

        for (const rule of this.rules) {
            const result = rule.evaluate(job);
            ruleBreakdown.push({
                ruleName: rule.name,
                passed: result.status !== 'REJECTED',
                reason: result.reason,
            });

            if (result.status === 'REJECTED' && finalResult.status !== 'REJECTED') {
                finalResult = result;
            }
        }

        // Log with full rule breakdown
        this.audit(job, finalResult, ruleBreakdown);
        return finalResult;
    }

    private audit(job: Job, result: FilterResult, ruleBreakdown: RuleResult[]) {
        AuditService.log({
            actionType: 'FILTER',
            jobId: job.id,
            verdict: result.status,
            details: {
                reason: result.reason,
                ruleBreakdown,
            },
            metadata: { jobTitle: job.title }
        });
        Logger.info(`Filter Verdict for Job #${job.id}: ${result.status} (${result.reason})`);
    }
}

export default new FilterEngine();
