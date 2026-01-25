export type ATSProvider = 'greenhouse' | 'lever' | 'ashby';

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
    preferences: {
        remoteOnly: boolean;
        excludedKeywords: string[];
        maxSeniority: string[];
        locations: string[];
        minSalary?: number;
    };
    skills: string[];
}
