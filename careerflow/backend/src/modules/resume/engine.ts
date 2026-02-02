import { Job, ResumeProfile, UserProfile } from '../../types.js';
import { KEYWORD_CATEGORIES, calculateKeywordScore, findBestCategory } from '../../config/keywords.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';

export interface SelectionResult {
    selectedProfileName: string;
    matchScore: number;
    reason: string;
}

export class ResumeEngine {

    /**
     * Selects the best resume profile for a given job based on user's resume profiles.
     * 
     * @param job - The job to match against
     * @param profile - The user's profile containing resumeProfiles
     * @returns Selection result with the chosen profile name and match score
     */
    public selectResumeProfile(job: Job, profile: UserProfile): SelectionResult {
        const resumeProfiles = profile.resumeProfiles || [];
        const jobText = (job.title + ' ' + (job.description || '')).toLowerCase();

        // If no resume profiles defined, use the 'default' or first available
        if (resumeProfiles.length === 0) {
            Logger.warn(`User has no resume profiles defined, using default`);
            return {
                selectedProfileName: 'default',
                matchScore: 0,
                reason: 'No resume profiles defined, using default',
            };
        }

        // Find best matching category for the job
        const bestCategory = findBestCategory(jobText);
        
        let bestMatch: ResumeProfile = resumeProfiles[0];
        let highestScore = -1;

        for (const resumeProfile of resumeProfiles) {
            // Score based on targetRoles alignment
            let score = 0;

            // Check if job title matches any target roles
            const jobTitle = job.title.toLowerCase();
            for (const targetRole of resumeProfile.targetRoles || []) {
                if (jobTitle.includes(targetRole.toLowerCase())) {
                    score += 5; // Strong match
                }
            }

            // Add score for category keyword matches
            const categoryKeywords = bestCategory.keywords;
            score += calculateKeywordScore(jobText, categoryKeywords);

            // Add user skills that appear in job
            const userSkills = profile.skills || [];
            score += calculateKeywordScore(jobText, userSkills);

            if (score > highestScore) {
                highestScore = score;
                bestMatch = resumeProfile;
            }
        }

        const result: SelectionResult = {
            selectedProfileName: bestMatch.name,
            matchScore: highestScore,
            reason: `Best match for ${bestCategory.name} role with score ${highestScore}`,
        };

        // Audit the selection
        AuditService.log({
            actionType: 'MATCH',
            jobId: job.id,
            verdict: 'ACCEPTED',
            details: result,
            metadata: { profileName: bestMatch.name, category: bestCategory.name },
        });

        return result;
    }

    /**
     * Auto-generates a default resume profile based on user's profile data.
     * Called when user has no resume profiles defined.
     */
    public generateDefaultProfile(profile: UserProfile): ResumeProfile {
        const contact = profile.contact;
        const experience = profile.experience || [];
        const skills = profile.skills || [];

        // Build summary from experience
        let summary = '';
        if (experience.length > 0) {
            const latestJob = experience[0];
            const yearsExp = experience.length * 2; // Rough estimate
            summary = `${latestJob.title} with ${yearsExp}+ years of experience. `;
            
            if (skills.length > 0) {
                summary += `Skilled in ${skills.slice(0, 5).join(', ')}.`;
            }
        } else {
            summary = 'Professional seeking new opportunities.';
        }

        // Derive target roles from experience
        const targetRoles = experience.slice(0, 3).map(exp => exp.title);

        return {
            name: 'default',
            summary,
            targetRoles: targetRoles.length > 0 ? targetRoles : ['Software Engineer'],
        };
    }

    /**
     * @deprecated Use selectResumeProfile() instead
     * Legacy method for backward compatibility with old code
     */
    public selectResume(job: Job): SelectionResult {
        // Return a default result - this should be migrated to use selectResumeProfile
        Logger.warn('Using deprecated selectResume() - migrate to selectResumeProfile()');
        return {
            selectedProfileName: 'default',
            matchScore: 0,
            reason: 'Legacy fallback - no profile context',
        };
    }

    /**
     * @deprecated Legacy method - resume tailoring now happens in generator.ts
     */
    public tailorResume(resumeId: string, job: Job): string {
        Logger.warn('Using deprecated tailorResume() - use ResumeGenerator instead');
        return '';
    }
}

export default new ResumeEngine();
