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
