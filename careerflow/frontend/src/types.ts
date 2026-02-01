// Resume Variant validation constants (renamed from "Profile" to "Variant")
export const RESUME_VARIANT_MAX_LENGTH = 34;
export const RESUME_VARIANT_MAX_COUNT = 3;
export const RESUME_VARIANT_NAME_REGEX = /^[a-z]+(-[a-z]+)*$/;

// Backward compatibility aliases
export const RESUME_PROFILE_MAX_LENGTH = RESUME_VARIANT_MAX_LENGTH;
export const RESUME_PROFILE_MAX_COUNT = RESUME_VARIANT_MAX_COUNT;
export const RESUME_PROFILE_NAME_REGEX = RESUME_VARIANT_NAME_REGEX;

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
