-- Migration 001: Create global jobs table
-- This table stores all scraped jobs from various ATS platforms
-- Jobs are shared across all users (no user_id) for global job discovery

-- =============================================
-- JOBS TABLE (Global Job Catalog)
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company and job details
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    ats_provider TEXT NOT NULL CHECK (ats_provider IN ('greenhouse', 'lever', 'ashby')),
    ats_job_id TEXT NOT NULL,
    job_url TEXT NOT NULL,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    
    -- Salary information
    salary_min INTEGER,
    salary_max INTEGER,
    
    -- Job classification
    employment_type TEXT,
    
    -- Job content
    description TEXT,
    logo_url TEXT,
    
    -- Timestamps
    posted_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint for deduplication across ATS providers
    CONSTRAINT jobs_ats_provider_ats_job_id_unique UNIQUE (ats_provider, ats_job_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for filtering active jobs
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);

-- Index for stale job detection
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at);

-- Index for job search by company
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);

-- Index for job search by title
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);

-- Index for filtering by location
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);

-- Index for filtering by remote status
CREATE INDEX IF NOT EXISTS idx_jobs_is_remote ON jobs(is_remote);

-- Index for filtering by employment type
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);

-- Index for filtering by created date
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read jobs (global catalog)
CREATE POLICY "Authenticated users can view all jobs"
    ON jobs FOR SELECT
    TO authenticated
    USING (true);

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE jobs IS 'Global job catalog scraped from various ATS platforms';
COMMENT ON COLUMN jobs.ats_provider IS 'ATS platform: greenhouse, lever, or ashby';
COMMENT ON COLUMN jobs.ats_job_id IS 'Unique job ID from the ATS platform';
COMMENT ON COLUMN jobs.is_active IS 'Whether the job is still active (not stale)';
COMMENT ON COLUMN jobs.last_seen_at IS 'Last time the job was seen during scraping';
COMMENT ON COLUMN jobs.scraped_at IS 'When the job was first scraped';
