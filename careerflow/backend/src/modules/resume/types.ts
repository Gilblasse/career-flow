import { Experience, Education } from '../../types.js';

export interface ResumeMetadata {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
}

export interface Project {
    name: string;
    description: string;
    technologies: string[];
}

export interface ParsedResumeData {
    rawText: string;
    mimeType: string;

    // Structured Data
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
    summary?: string;  // Professional summary/objective from the resume
    experience: Experience[];
    education: Education[];
    skills: string[];
    projects: Project[];
    metadata?: ResumeMetadata; // Keep for backward compat if needed, but 'contact' covers it
}
