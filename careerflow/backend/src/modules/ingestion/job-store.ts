import db from '../../services/db.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';
import { RawJob, Job } from '../../types.js';

class JobStore {
    private insertStmt: any;
    private checkStmt: any;

    constructor() {
        // Prepare statements for performance
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

    /**
     * Attempts to save a job. Returns the Job ID if valid and new.
     * Throws or returns null if duplicate.
     */
    public saveJob(job: RawJob): number | null {
        // 1. Deduplication Check (Memory/DB)
        const request = this.checkStmt.get(job.company, job.atsJobId);

        if (request) {
            Logger.warn(`Duplicate Job Detected: ${job.company} - ${job.title} (${job.atsJobId})`);
            // We do NOT log an audit record for every duplicate to save noise, 
            // unless we want to track how many dupes we hit.
            return null;
        }

        // 2. Insert
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
                postedAt: job.postedAt ? job.postedAt.toISOString() : null
            });

            const newJobId = info.lastInsertRowid as number;

            // 3. Audit Log
            AuditService.log({
                actionType: 'INGEST',
                jobId: newJobId,
                verdict: 'ACCEPTED', // Accepted for processing
                details: {
                    source: 'scraper',
                    company: job.company,
                    title: job.title
                }
            });

            Logger.info(`Saved New Job: #${newJobId} ${job.company} - ${job.title}`);
            return newJobId;

        } catch (error: any) {
            Logger.error('Failed to save job:', error);
            AuditService.log({
                actionType: 'ERROR',
                details: { error: error.message, jobContext: job }
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
        return rows.map(r => this.mapRowToJob(r));
    }

    public getJobStats(): Record<string, number> {
        const stmt = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status');
        const rows = stmt.all() as { status: string, count: number }[];

        const stats: Record<string, number> = {
            total: 0,
            pending: 0,
            applied: 0,
            rejected: 0,
            failed: 0
        };

        rows.forEach(row => {
            stats[row.status] = row.count;
            stats.total = (stats.total || 0) + row.count;
        });

        // Add total explicitly via count all query if we want to include statuses not in default list?? 
        // No, summing rows is fine unless there are statuses we don't track.

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
            // Ensure valid Date or undefined
            postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
            createdAt: new Date(row.created_at),
            status: row.status
        };
    }
}

export default new JobStore();
