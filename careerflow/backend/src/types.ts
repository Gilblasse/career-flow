export type ATSProvider = 'greenhouse' | 'lever' | 'ashby';

// Resume Profile validation constants
export const RESUME_PROFILE_MAX_LENGTH = 34;
export const RESUME_PROFILE_MAX_COUNT = 5;
export const RESUME_PROFILE_NAME_REGEX = /^[a-z]+(-[a-z]+)*$/;

export interface ResumeProfile {
    id: string;
    name: string; // lowercase, dash-separated, max 34 chars (e.g., "software-engineering")
    resumeSnapshot: {
        experience: Experience[];
        education: Education[];
        skills: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface RawJob {
    company: string;
    title: string;
    atsProvider: ATSProvider;
    atsJobId: string;
    jobUrl: string;
    location?: string;
    isRemote: boolean;
    description: string;
    postedAt?: Date;
}

export interface Job extends RawJob {
    id: number;
    createdAt: Date;
    status: 'pending' | 'analyzed' | 'applied' | 'rejected';
}

/**
 * Database row type for the global jobs table (snake_case for Postgres)
 */
export interface JobRow {
    id: string;
    company: string;
    title: string;
    ats_provider: ATSProvider;
    ats_job_id: string;
    job_url: string;
    location: string | null;
    is_remote: boolean;
    salary_min: number | null;
    salary_max: number | null;
    employment_type: string | null;
    description: string | null;
    logo_url: string | null;
    posted_at: string | null;
    scraped_at: string;
    last_seen_at: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Filters for querying the global jobs table
 */
export interface JobFilters {
    /** Search term for title or company (case-insensitive) */
    search?: string;
    /** Filter by location (case-insensitive partial match) */
    location?: string;
    /** Filter for remote jobs only */
    isRemote?: boolean;
    /** Filter by employment type (full-time, part-time, contract, internship) */
    employmentType?: string;
    /** Filter by ATS provider */
    atsProvider?: ATSProvider;
    /** Filter by company name (exact match) */
    company?: string;
    /** Maximum number of results (default 50) */
    limit?: number;
    /** Offset for pagination (default 0) */
    offset?: number;
}

export interface Experience {
    id?: string;
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description: string;
    bullets?: string[];
}

export interface Education {
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

export interface UserProfile {
    contact: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        linkedin: string;
        github?: string;
        portfolio?: string;
        location: string;
        role?: string;     // Current job title
        company?: string;  // Current company
        bio?: string;      // Professional summary
    };
    experience: Experience[];
    education: Education[];
    preferences: {
        remoteOnly: boolean;
        excludedKeywords: string[];
        maxSeniority: string[];
        locations: string[];
        minSalary?: number;
    };
    skills: string[];
    resumeProfiles: ResumeProfile[];
    lastEditedProfileId?: string;
}
