-- CareerFlow Supabase Schema
-- Run this in Supabase SQL Editor to create all tables with RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact information (JSONB for flexibility)
    contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Experience, education, skills arrays
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    education JSONB NOT NULL DEFAULT '[]'::jsonb,
    skills TEXT[] NOT NULL DEFAULT '{}',
    
    -- Preferences
    preferences JSONB NOT NULL DEFAULT '{
        "remoteOnly": false,
        "excludedKeywords": [],
        "maxSeniority": [],
        "locations": []
    }'::jsonb,
    
    -- Resume profiles
    resume_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_edited_profile_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Each user can only have one profile
    UNIQUE(user_id)
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- APPLICATIONS TABLE (Jobs with Queue State)
-- =============================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Job metadata
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    ats_provider TEXT NOT NULL CHECK (ats_provider IN ('greenhouse', 'lever', 'ashby')),
    ats_job_id TEXT NOT NULL,
    job_url TEXT NOT NULL,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    description TEXT,
    posted_at TIMESTAMPTZ,
    
    -- Salary and matching
    salary_min INTEGER,
    salary_max INTEGER,
    match_score REAL,
    employment_type TEXT,
    
    -- Queue state
    queue_status TEXT DEFAULT 'pending' 
        CHECK (queue_status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'paused')),
    queue_position INTEGER,
    queue_batch_id UUID,
    resume_profile_id TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    pause_reason TEXT CHECK (pause_reason IS NULL OR pause_reason IN ('captcha', 'user_takeover', 'manual')),
    screenshot_path TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    queued_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Prevent duplicate job applications per user
    UNIQUE(user_id, company, ats_job_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_queue_status ON applications(queue_status);
CREATE INDEX IF NOT EXISTS idx_applications_queue_batch ON applications(queue_batch_id);
CREATE INDEX IF NOT EXISTS idx_applications_queue_position ON applications(queue_position);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_match_score ON applications(match_score);

-- RLS for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
    ON applications FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- QUEUE CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS queue_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'idle' 
        CHECK (status IN ('idle', 'processing', 'paused', 'stopped', 'completed')),
    pause_reason TEXT CHECK (pause_reason IS NULL OR pause_reason IN ('captcha', 'user_takeover', 'manual')),
    current_job_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    dry_run BOOLEAN DEFAULT true,
    limit_count INTEGER,
    
    -- Stats
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queue_campaigns_user_id ON queue_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_campaigns_status ON queue_campaigns(status);

-- RLS for queue_campaigns
ALTER TABLE queue_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
    ON queue_campaigns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
    ON queue_campaigns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
    ON queue_campaigns FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
    ON queue_campaigns FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    action_type TEXT NOT NULL CHECK (action_type IN ('INGEST', 'FILTER', 'MATCH', 'SUBMIT', 'DRY_RUN', 'AUTH', 'PROFILE_UPDATE')),
    job_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    verdict TEXT,
    details JSONB,
    metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_job_id ON audit_logs(job_id);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Auto-create profile on user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, contact)
    VALUES (
        NEW.id,
        jsonb_build_object(
            'firstName', COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            'lastName', COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            'email', NEW.email,
            'phone', '',
            'linkedin', '',
            'location', ''
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_campaigns;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
