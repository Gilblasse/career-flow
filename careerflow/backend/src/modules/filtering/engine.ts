import { Job, JobRow, UserProfile } from '../../types.js';
import AuditService from '../../services/audit.js';
import Logger from '../../services/logger.js';
import { IFilterRule, TechStackRule, RemoteRule, SeniorityRule, FilterResult } from './rules.js';

interface RuleResult {
    ruleName: string;
    passed: boolean;
    reason: string;
}

/**
 * Match score breakdown for transparency
 */
export interface MatchScoreBreakdown {
    total: number;
    remote: number;
    location: number;
    skills: number;
    seniority: number;
    keywords: number;
}

class FilterEngine {
    private rules: IFilterRule[] = [];
    private initialized: boolean = false;

    constructor() {
        // Lazy initialization - rules will be set when analyze() is called with a profile
    }

    /**
     * Initialize rules with a user profile (called when needed)
     */
    private initializeRules(profile: UserProfile): void {
        this.rules = [];
        this.rules.push(new TechStackRule(profile.preferences.excludedKeywords));
        this.rules.push(new RemoteRule(profile.preferences.remoteOnly));
        this.rules.push(new SeniorityRule(profile.preferences.maxSeniority));
        this.initialized = true;
    }

    public analyze(job: Job, profile?: UserProfile): FilterResult {
        Logger.info(`Analyzing Job #${job.id}: ${job.company} - ${job.title}`);

        // Initialize rules if profile provided and not yet initialized
        if (profile && !this.initialized) {
            this.initializeRules(profile);
        } else if (!this.initialized) {
            // Use default empty preferences if no profile
            this.initializeRules({
                contact: { firstName: '', lastName: '', email: '', phone: '', linkedin: '', location: '', role: '', company: '', bio: '' },
                experience: [],
                education: [],
                skills: [],
                preferences: { remoteOnly: false, excludedKeywords: [], maxSeniority: [], locations: [] },
                resumeProfiles: [],
            });
        }

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

    /**
     * Calculate a numeric match score (0-100) for a job based on user profile
     * Higher score = better match
     */
    public calculateMatchScore(job: JobRow, profile: UserProfile): MatchScoreBreakdown {
        let score = 50; // Base score
        const breakdown: MatchScoreBreakdown = {
            total: 0,
            remote: 0,
            location: 0,
            skills: 0,
            seniority: 0,
            keywords: 0,
        };

        const jobText = `${job.title} ${job.description || ''} ${job.company}`.toLowerCase();
        const userSkills = profile.skills.map(s => s.toLowerCase());

        // 1. Remote preference match (0-15 points)
        if (profile.preferences.remoteOnly) {
            if (job.is_remote) {
                breakdown.remote = 15;
            } else {
                breakdown.remote = -10; // Penalty for non-remote when user prefers remote
            }
        } else {
            // User is open to non-remote, slight bonus for remote jobs
            breakdown.remote = job.is_remote ? 5 : 0;
        }
        score += breakdown.remote;

        // 2. Location match (0-10 points)
        if (job.location && profile.preferences.locations.length > 0) {
            const jobLocation = job.location.toLowerCase();
            const locationMatch = profile.preferences.locations.some(loc => 
                jobLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLocation)
            );
            breakdown.location = locationMatch ? 10 : 0;
        } else if (job.is_remote) {
            breakdown.location = 5; // Remote jobs get some location points
        }
        score += breakdown.location;

        // 3. Skills match (0-25 points)
        if (userSkills.length > 0) {
            let skillMatches = 0;
            for (const skill of userSkills) {
                if (jobText.includes(skill)) {
                    skillMatches++;
                }
            }
            // Scale based on percentage of skills matched
            const matchRatio = Math.min(skillMatches / Math.max(userSkills.length, 1), 1);
            breakdown.skills = Math.round(matchRatio * 25);
        }
        score += breakdown.skills;

        // 4. Seniority check (-20 to 0 points)
        const titleLower = job.title.toLowerCase();
        const excludedSeniority = profile.preferences.maxSeniority.map(s => s.toLowerCase());
        const seniorityPenalty = excludedSeniority.some(level => titleLower.includes(level));
        breakdown.seniority = seniorityPenalty ? -20 : 0;
        score += breakdown.seniority;

        // 5. Excluded keywords check (-30 to 0 points)
        const excludedKeywords = profile.preferences.excludedKeywords.map(k => k.toLowerCase());
        const keywordPenalty = excludedKeywords.some(keyword => jobText.includes(keyword));
        breakdown.keywords = keywordPenalty ? -30 : 0;
        score += breakdown.keywords;

        // Clamp score to 0-100
        breakdown.total = Math.max(0, Math.min(100, score));

        return breakdown;
    }

    /**
     * Calculate match scores for multiple jobs
     */
    public calculateMatchScores(jobs: JobRow[], profile: UserProfile): Map<string, MatchScoreBreakdown> {
        const scores = new Map<string, MatchScoreBreakdown>();
        for (const job of jobs) {
            scores.set(job.id, this.calculateMatchScore(job, profile));
        }
        return scores;
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
