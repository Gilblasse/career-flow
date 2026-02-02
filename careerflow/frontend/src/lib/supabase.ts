import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

// Client-side Supabase client with anon key (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: ProfileRow;
                Insert: ProfileInsert;
                Update: ProfileUpdate;
            };
            applications: {
                Row: ApplicationRow;
                Insert: ApplicationInsert;
                Update: ApplicationUpdate;
            };
            queue_campaigns: {
                Row: QueueCampaignRow;
                Insert: QueueCampaignInsert;
                Update: QueueCampaignUpdate;
            };
            audit_logs: {
                Row: AuditLogRow;
                Insert: AuditLogInsert;
                Update: AuditLogUpdate;
            };
        };
    };
}

// Profile types
export interface ProfileRow {
    id: string;
    user_id: string;
    contact: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        linkedin: string;
        github?: string;
        portfolio?: string;
        location: string;
        role?: string;
        company?: string;
        bio?: string;
    };
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: string[];
    preferences: {
        remoteOnly: boolean;
        excludedKeywords: string[];
        maxSeniority: string[];
        locations: string[];
        minSalary?: number;
    };
    resume_profiles: ResumeProfileItem[];
    last_edited_profile_id?: string;
    created_at: string;
    updated_at: string;
}

export interface ExperienceItem {
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

export interface EducationItem {
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

export interface ResumeProfileItem {
    id: string;
    name: string;
    resumeSnapshot: {
        experience: ExperienceItem[];
        education: EducationItem[];
        skills: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export type ProfileInsert = Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<ProfileRow, 'id' | 'user_id' | 'created_at'>>;

// Application types (replaces jobs table with queue state)
export type ApplicationStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'paused';
export type ATSProvider = 'greenhouse' | 'lever' | 'ashby';
export type PauseReason = 'captcha' | 'user_takeover' | 'manual' | null;

export interface ApplicationRow {
    id: string;
    user_id: string;
    
    // Job metadata
    company: string;
    title: string;
    ats_provider: ATSProvider;
    ats_job_id: string;
    job_url: string;
    location: string | null;
    is_remote: boolean;
    description: string | null;
    posted_at: string | null;
    
    // Salary and matching
    salary_min: number | null;
    salary_max: number | null;
    match_score: number | null;
    employment_type: string | null;
    
    // Queue state
    queue_status: ApplicationStatus;
    queue_position: number | null;
    queue_batch_id: string | null;
    resume_profile_id: string | null;
    retry_count: number;
    last_error: string | null;
    pause_reason: PauseReason;
    screenshot_path: string | null;
    
    // Timestamps
    created_at: string;
    updated_at: string;
    queued_at: string | null;
    started_at: string | null;
    completed_at: string | null;
}

export type ApplicationInsert = Omit<ApplicationRow, 'id' | 'created_at' | 'updated_at'>;
export type ApplicationUpdate = Partial<Omit<ApplicationRow, 'id' | 'user_id' | 'created_at'>>;

// Queue campaign types
export type CampaignStatus = 'idle' | 'processing' | 'paused' | 'stopped' | 'completed';

export interface QueueCampaignRow {
    id: string;
    user_id: string;
    status: CampaignStatus;
    pause_reason: PauseReason;
    current_job_id: string | null;
    dry_run: boolean;
    limit_count: number | null;
    
    created_at: string;
    started_at: string | null;
    paused_at: string | null;
    completed_at: string | null;
}

export type QueueCampaignInsert = Omit<QueueCampaignRow, 'id' | 'created_at'>;
export type QueueCampaignUpdate = Partial<Omit<QueueCampaignRow, 'id' | 'user_id' | 'created_at'>>;

// Audit log types
export type AuditActionType = 'INGEST' | 'FILTER' | 'MATCH' | 'SUBMIT' | 'DRY_RUN' | 'AUTH' | 'PROFILE_UPDATE';

export interface AuditLogRow {
    id: string;
    user_id: string | null;
    timestamp: string;
    action_type: AuditActionType;
    job_id: string | null;
    verdict: string | null;
    details: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
}

export type AuditLogInsert = Omit<AuditLogRow, 'id' | 'timestamp'>;
export type AuditLogUpdate = Partial<Omit<AuditLogRow, 'id' | 'timestamp'>>;

export default supabase;
