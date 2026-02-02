import db from '../../services/db.js';
import supabase from '../../services/supabase.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';
import { RawJob, Job } from '../../types.js';
import type { ApplicationRow, ApplicationInsert } from '../../services/supabase.js';

class JobStore {
    private insertStmt: any;
    private checkStmt: any;

    constructor() {
        // Prepare statements for legacy SQLite
        this.insertStmt = db.prepare(`
            INSERT INTO jobs (
                company, title, ats_provider, ats_job_id, job_url, 
                location, is_remote, description, posted_at, status
            ) VALUES (
                @company, @title, @atsProvider, @atsJobId, @jobUrl,
                @location, @isRemote, @description, @postedAt, 'pending'
            )
        `);

        this.checkStmt = db.prepare(`
            SELECT id FROM jobs WHERE company = ? AND ats_job_id = ?
        `);
    }

    // ============ SUPABASE METHODS (Primary) ============

    /**
     * Save a job/application to Supabase
     * Returns the application ID if new, null if duplicate
     */
    public async saveApplication(userId: string, job: RawJob): Promise<string | null> {
        // Check for duplicate
        const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('user_id', userId)
            .eq('company', job.company)
            .eq('ats_job_id', job.atsJobId)
            .single();

        if (existing) {
            Logger.warn(`Duplicate Job: ${job.company} - ${job.title} (${job.atsJobId})`);
            return null;
        }

        // Insert new application
        const { data, error } = await supabase
            .from('applications')
            .insert({
                user_id: userId,
                company: job.company,
                title: job.title,
                ats_provider: job.atsProvider,
                ats_job_id: job.atsJobId,
                job_url: job.jobUrl,
                location: job.location || null,
                is_remote: job.isRemote || false,
                description: job.description,
                posted_at: job.postedAt ? job.postedAt.toISOString() : null,
                queue_status: 'pending',
                retry_count: 0,
            } as ApplicationInsert)
            .select('id')
            .single();

        if (error) {
            Logger.error('Failed to save application:', error);
            throw error;
        }

        const newId = data.id;

        // Audit log
        await AuditService.log({
            actionType: 'INGEST',
            userId,
            jobId: newId,
            verdict: 'ACCEPTED',
            details: {
                source: 'scraper',
                company: job.company,
                title: job.title,
            },
        });

        Logger.info(`Saved Application: ${newId} ${job.company} - ${job.title}`);
        return newId;
    }

    /**
     * Get an application by ID from Supabase
     */
    public async getApplication(applicationId: string): Promise<ApplicationRow | null> {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (error) {
            Logger.error('Failed to get application:', error);
            return null;
        }

        return data;
    }

    /**
     * Get pending applications for a user from Supabase
     */
    public async getPendingApplications(userId: string, limit: number = 10): Promise<ApplicationRow[]> {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', userId)
            .eq('queue_status', 'pending')
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            Logger.error('Failed to get pending applications:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Update application status in Supabase
     */
    public async updateApplicationStatus(
        applicationId: string,
        status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'paused',
        additionalFields?: Partial<ApplicationRow>
    ): Promise<void> {
        const { error } = await supabase
            .from('applications')
            .update({
                queue_status: status,
                ...additionalFields,
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId);

        if (error) {
            Logger.error('Failed to update application status:', error);
            throw error;
        }
    }

    /**
     * Get applications for a user with optional filters
     */
    public async getApplications(
        userId: string,
        options: {
            status?: string;
            limit?: number;
            offset?: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        } = {}
    ): Promise<{ applications: ApplicationRow[]; total: number }> {
        const { status, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;

        let query = supabase
            .from('applications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        if (status && status !== 'all') {
            query = query.eq('queue_status', status);
        }

        query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);

        const { data, count, error } = await query;

        if (error) {
            Logger.error('Failed to get applications:', error);
            return { applications: [], total: 0 };
        }

        return { applications: data || [], total: count || 0 };
    }

    /**
     * Get stats for a user from Supabase
     */
    public async getApplicationStats(userId: string): Promise<Record<string, number>> {
        const { data, error } = await supabase
            .from('applications')
            .select('queue_status')
            .eq('user_id', userId);

        if (error) {
            Logger.error('Failed to get application stats:', error);
            return { total: 0, pending: 0, completed: 0, failed: 0 };
        }

        const stats: Record<string, number> = {
            total: data?.length || 0,
            pending: 0,
            queued: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            paused: 0,
        };

        data?.forEach((row) => {
            const status = row.queue_status;
            if (stats[status] !== undefined) {
                stats[status]++;
            }
        });

        return stats;
    }

    // ============ LEGACY SQLITE METHODS (for backward compatibility) ============

    /**
     * Legacy: Save job to SQLite
     * @deprecated Use saveApplication() instead
     */
    public saveJob(job: RawJob): number | null {
        const request = this.checkStmt.get(job.company, job.atsJobId);

        if (request) {
            Logger.warn(`Duplicate Job Detected: ${job.company} - ${job.title} (${job.atsJobId})`);
            return null;
        }

        try {
            const info = this.insertStmt.run({
                company: job.company,
                title: job.title,
                atsProvider: job.atsProvider,
                atsJobId: job.atsJobId,
                jobUrl: job.jobUrl,
                location: job.location || null,
                isRemote: job.isRemote ? 1 : 0,
                description: job.description,
                postedAt: job.postedAt ? job.postedAt.toISOString() : null,
            });

            const newJobId = info.lastInsertRowid as number;

            AuditService.logSync({
                actionType: 'INGEST',
                jobId: newJobId,
                verdict: 'ACCEPTED',
                details: {
                    source: 'scraper',
                    company: job.company,
                    title: job.title,
                },
            });

            Logger.info(`Saved New Job: #${newJobId} ${job.company} - ${job.title}`);
            return newJobId;
        } catch (error: any) {
            Logger.error('Failed to save job:', error);
            AuditService.logSync({
                actionType: 'ERROR',
                details: { error: error.message, jobContext: job },
            });
            throw error;
        }
    }

    public updateStatus(id: number | bigint, status: 'pending' | 'applied' | 'rejected' | 'failed') {
        const stmt = db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(status, id);
    }

    public getJob(id: number): Job | null {
        const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
        const row = stmt.get(id) as any;
        if (!row) return null;
        return this.mapRowToJob(row);
    }

    public getPendingJobs(limit: number = 10): Job[] {
        const stmt = db.prepare("SELECT * FROM jobs WHERE status = 'pending' LIMIT ?");
        const rows = stmt.all(limit) as any[];
        return rows.map((r) => this.mapRowToJob(r));
    }

    public getJobStats(): Record<string, number> {
        const stmt = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status');
        const rows = stmt.all() as { status: string; count: number }[];

        const stats: Record<string, number> = {
            total: 0,
            pending: 0,
            applied: 0,
            rejected: 0,
            failed: 0,
        };

        rows.forEach((row) => {
            stats[row.status] = row.count;
            stats.total = (stats.total || 0) + row.count;
        });

        return stats;
    }

    private mapRowToJob(row: any): Job {
        return {
            id: row.id,
            company: row.company,
            title: row.title,
            atsProvider: row.ats_provider,
            atsJobId: row.ats_job_id,
            jobUrl: row.job_url,
            location: row.location,
            isRemote: row.is_remote === 1,
            description: row.description,
            postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
            createdAt: new Date(row.created_at),
            status: row.status,
        };
    }
}

export default new JobStore();
