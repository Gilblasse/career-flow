/**
 * Keyword Configuration
 * 
 * These keywords are used for job-to-resume matching and filtering.
 * Users can define their own keywords in their profile preferences.
 */

export interface KeywordCategory {
    name: string;
    keywords: string[];
}

/**
 * Default keyword categories for resume profile types
 */
export const KEYWORD_CATEGORIES: KeywordCategory[] = [
    {
        name: 'Engineering',
        keywords: [
            'javascript', 'typescript', 'react', 'node', 'nodejs', 'python',
            'java', 'c++', 'c#', 'golang', 'rust', 'ruby',
            'aws', 'gcp', 'azure', 'docker', 'kubernetes',
            'microservices', 'api', 'backend', 'frontend', 'fullstack',
            'software engineer', 'developer', 'architect',
        ],
    },
    {
        name: 'Data',
        keywords: [
            'sql', 'python', 'pandas', 'numpy', 'tableau', 'power bi',
            'analytics', 'machine learning', 'ml', 'ai', 'data science',
            'etl', 'data pipeline', 'spark', 'hadoop', 'snowflake',
            'statistics', 'visualization', 'modeling',
        ],
    },
    {
        name: 'Finance',
        keywords: [
            'accounting', 'finance', 'excel', 'forecasting', 'reporting',
            'budgeting', 'financial analysis', 'cpa', 'cfa',
            'investment', 'banking', 'audit', 'compliance', 'gaap',
        ],
    },
    {
        name: 'Admin',
        keywords: [
            'operations', 'scheduling', 'management', 'coordination',
            'administrative', 'office', 'executive assistant',
            'project coordination', 'calendar', 'travel',
        ],
    },
    {
        name: 'Marketing',
        keywords: [
            'marketing', 'seo', 'sem', 'content', 'social media',
            'branding', 'campaigns', 'analytics', 'copywriting',
            'digital marketing', 'growth', 'product marketing',
        ],
    },
    {
        name: 'Design',
        keywords: [
            'design', 'figma', 'sketch', 'adobe', 'ui', 'ux',
            'user experience', 'user interface', 'prototype',
            'wireframe', 'visual design', 'interaction design',
        ],
    },
    {
        name: 'Product',
        keywords: [
            'product manager', 'product owner', 'roadmap', 'agile',
            'scrum', 'requirements', 'stakeholder', 'prd',
            'user stories', 'prioritization', 'metrics', 'kpi',
        ],
    },
    {
        name: 'General',
        keywords: [
            'communication', 'project management', 'writing', 'collaboration',
            'leadership', 'teamwork', 'problem solving', 'analytical',
            'organization', 'multitasking', 'attention to detail',
        ],
    },
];

/**
 * Exclusion keywords - jobs containing these should be filtered out
 */
export const DEFAULT_EXCLUSION_KEYWORDS = [
    'security clearance required',
    'us citizenship required',
    'must be able to obtain clearance',
    'top secret',
];

/**
 * Seniority levels for filtering
 */
export const SENIORITY_LEVELS = [
    'intern',
    'junior',
    'associate',
    'mid',
    'senior',
    'staff',
    'principal',
    'lead',
    'manager',
    'director',
    'vp',
    'executive',
] as const;

export type SeniorityLevel = typeof SENIORITY_LEVELS[number];

/**
 * Find the best matching category for a job description
 */
export function findBestCategory(jobText: string): KeywordCategory {
    const text = jobText.toLowerCase();
    let bestMatch: KeywordCategory = KEYWORD_CATEGORIES.find(c => c.name === 'General')!;
    let highestScore = 0;

    for (const category of KEYWORD_CATEGORIES) {
        let score = 0;
        for (const keyword of category.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                score++;
            }
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = category;
        }
    }

    return bestMatch;
}

/**
 * Calculate keyword overlap score between job text and keywords
 */
export function calculateKeywordScore(jobText: string, keywords: string[]): number {
    const text = jobText.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
            score++;
        }
    }

    return score;
}
