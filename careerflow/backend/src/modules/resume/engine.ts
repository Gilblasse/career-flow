import { Job } from '../../types.js';
import { RESUME_INVENTORY, Resume } from './inventory.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';

import ProfileService from '../../services/profile.js';

export interface SelectionResult {
    selectedResumeId: string;
    matchScore: number;
    reason: string;
}

export class ResumeEngine {

    /**
     * Selects the single best resume from the inventory for a given job.
     */
    public selectResume(job: Job): SelectionResult {
        const config = ProfileService.getConfig();
        const userSkills = config.skills || [];

        let bestMatch: Resume | null = null;
        let highestScore = -1;
        const jobText = (job.title + ' ' + job.description).toLowerCase();

        for (const resume of RESUME_INVENTORY) {
            // Simple keyword overlap score
            let score = 0;
            for (const keyword of resume.keywords) {
                if (jobText.includes(keyword.toLowerCase())) {
                    score++;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = resume;
            }
        }

        if (!bestMatch) {
            // Fallback to 'Lyra' (General) or error if strict
            bestMatch = RESUME_INVENTORY.find(r => r.id === 'lyra')!;
            Logger.warn(`No strong match for job ${job.id}, defaulting to Lyra.`);
        }

        const result: SelectionResult = {
            selectedResumeId: bestMatch.id,
            matchScore: highestScore,
            reason: `Highest keyword overlap (${highestScore}) with profile ${bestMatch.type}`
        };

        // Audit the selection
        AuditService.log({
            actionType: 'MATCH',
            jobId: job.id,
            verdict: 'ACCEPTED',
            details: result,
            metadata: { resumeName: bestMatch.name }
        });

        return result;
    }

    /**
     * Tailors the resume content. 
     * STRICT RULE: Only reloads/mirrors existing keywords. No fabrication.
     */
    public tailorResume(resumeId: string, job: Job): string {
        const resume = RESUME_INVENTORY.find(r => r.id === resumeId);
        if (!resume) throw new Error('Resume not found');

        // Logic to "mirror" keywords would go here.
        // For now, we simulate safe optimization by ensuring high-priority keywords are present top-of-list if strictly allowed.
        // Since we cannot "add" tools not listed, we only highlight what exists.

        const tailoredContent = resume.content;
        // In a real impl, this would rewrite the summary or skills section 
        // using ONLY the intersection of resume.keywords AND job description words.

        Logger.info(`Tailored resume ${resume.name} for Job #${job.id}`);

        // Log Diff (Simulated)
        AuditService.log({
            actionType: 'MATCH', // or separate TAILOR action
            jobId: job.id,
            details: { action: 'tailor', originalLength: resume.content.length, newLength: tailoredContent.length }
        });

        return tailoredContent;
    }
}

export default new ResumeEngine();
