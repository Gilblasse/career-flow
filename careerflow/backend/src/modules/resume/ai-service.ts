import LLMService from '../../services/llm.js';
import Logger from '../../services/logger.js';

/**
 * AI-powered resume enhancement service.
 * Provides bullet point enhancement and job tailoring capabilities.
 */
class AIResumeService {

    /**
     * Enhances a single bullet point to be more impactful and professional.
     * 
     * @param bullet - The original bullet point text
     * @param context - Optional context about the role/company
     * @returns Enhanced bullet point
     */
    async enhanceBullet(bullet: string, context?: string): Promise<string> {
        const systemPrompt = `You are an expert resume writer who transforms ordinary job descriptions into compelling, quantified achievement statements.

Rules:
- Use strong action verbs (Led, Spearheaded, Architected, Drove, Optimized)
- Include metrics and percentages when plausible (infer reasonable estimates)
- Keep the same core meaning but make it more impactful
- Write in past tense for previous roles
- Be concise (1-2 lines max)
- NO hyphens in compound modifiers
- Do NOT use generic phrases like "leveraged best practices" or "utilized synergies"
- Sound human and conversational, not robotic

Return ONLY the enhanced bullet point, nothing else.`;

        const userPrompt = context
            ? `Original bullet: "${bullet}"\n\nContext about this role: ${context}\n\nEnhance this bullet point.`
            : `Original bullet: "${bullet}"\n\nEnhance this bullet point.`;

        try {
            const enhanced = await LLMService.generateCompletion(userPrompt, systemPrompt);
            Logger.info(`[AI Resume] Enhanced bullet: "${bullet.substring(0, 30)}..." -> "${enhanced.substring(0, 30)}..."`);
            return enhanced;
        } catch (error) {
            Logger.error('[AI Resume] Bullet enhancement failed:', error);
            throw error;
        }
    }

    /**
     * Analyzes a job description and suggests how to tailor the resume.
     * 
     * @param jobDescription - The job description text
     * @param bullets - Array of existing bullet points
     * @param skills - Array of existing skills
     * @returns Tailoring suggestions
     */
    async analyzeJobFit(
        jobDescription: string,
        bullets: string[],
        skills: string[]
    ): Promise<{
        keyRequirements: string[];
        matchedSkills: string[];
        missingSkills: string[];
        bulletReorderSuggestion: number[];
        summaryRecommendation: string;
    }> {
        const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and resume strategist.
Analyze the job description and the candidate's existing content to provide tailoring recommendations.

Respond in JSON format exactly matching this structure:
{
    "keyRequirements": ["requirement1", "requirement2", ...],
    "matchedSkills": ["skill1", "skill2", ...],
    "missingSkills": ["skill1", "skill2", ...],
    "bulletReorderSuggestion": [0, 2, 1, 3, ...],
    "summaryRecommendation": "A brief recommendation for the professional summary"
}`;

        const userPrompt = `Job Description:
${jobDescription}

Candidate's Current Skills:
${skills.join(', ')}

Candidate's Current Bullet Points:
${bullets.map((b, i) => `${i}. ${b}`).join('\n')}

Analyze the job fit and provide tailoring recommendations.`;

        try {
            const response = await LLMService.generateCompletion(userPrompt, systemPrompt);

            // Parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse LLM response as JSON');
            }

            const result = JSON.parse(jsonMatch[0]);
            Logger.info('[AI Resume] Job analysis completed successfully');
            return result;

        } catch (error) {
            Logger.error('[AI Resume] Job analysis failed:', error);
            throw error;
        }
    }

    /**
     * Rewrites multiple bullet points to better match a job description.
     * 
     * @param jobDescription - The target job description
     * @param bullets - Array of original bullet points
     * @returns Array of tailored bullet points
     */
    async tailorBullets(
        jobDescription: string,
        bullets: string[]
    ): Promise<string[]> {
        const systemPrompt = `You are an expert resume writer specializing in ATS optimization.
Your task is to rewrite bullet points to better match a specific job description while maintaining truthfulness.

Rules:
- Keep the core facts/achievements intact
- Emphasize keywords and skills mentioned in the job description
- Use strong action verbs
- Include metrics where present
- NO hyphens in compound modifiers
- Sound human and professional

Return a JSON array of rewritten bullets in the same order as provided.`;

        const userPrompt = `Job Description:
${jobDescription}

Original Bullet Points:
${JSON.stringify(bullets)}

Rewrite these bullets to better match the job description. Return ONLY a JSON array of strings.`;

        try {
            const response = await LLMService.generateCompletion(userPrompt, systemPrompt);

            // Parse JSON array response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Failed to parse LLM response as JSON array');
            }

            const tailoredBullets = JSON.parse(jsonMatch[0]);
            Logger.info(`[AI Resume] Tailored ${tailoredBullets.length} bullets for job`);
            return tailoredBullets;

        } catch (error) {
            Logger.error('[AI Resume] Bullet tailoring failed:', error);
            throw error;
        }
    }
}

export default new AIResumeService();
