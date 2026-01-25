export interface Experience {
    id?: string;
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description: string;
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
    experience?: Experience[];
    education?: Education[];
    preferences: {
        remoteOnly: boolean;
        excludedKeywords: string[];
        maxSeniority: string[];
        locations: string[];
        minSalary?: number;
    };
    skills: string[];
}
