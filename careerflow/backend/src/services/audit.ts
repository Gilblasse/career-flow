import db from './db.js';
import supabase from './supabase.js';
import Logger from './logger.js';

export type AuditActionType = 'INGEST' | 'FILTER' | 'MATCH' | 'SUBMIT' | 'ERROR' | 'DRY_RUN' | 'AUTH' | 'PROFILE_UPDATE';
export type Verdict = 'ACCEPTED' | 'REJECTED' | 'REVIEW_OPTIONAL' | 'FAILED';

export interface AuditRecord {
    actionType: AuditActionType;
    userId?: string;
    jobId?: string | number | bigint;
    verdict?: Verdict;
    details: any;
    metadata?: any;
}

class AuditService {
    private insertStmt: any;

    constructor() {
        // Legacy SQLite prepared statement
        this.insertStmt = db.prepare(`
            INSERT INTO audit_logs (action_type, job_id, verdict, details, metadata)
            VALUES (@actionType, @jobId, @verdict, @details, @metadata)
        `);
    }

    /**
     * Log an audit record to both SQLite (legacy) and Supabase
     */
    public async log(record: AuditRecord): Promise<void> {
        // Log to Supabase (primary)
        try {
            const { error } = await supabase.from('audit_logs').insert({
                user_id: record.userId || null,
                action_type: record.actionType,
                job_id: typeof record.jobId === 'string' ? record.jobId : null,
                verdict: record.verdict || null,
                details: record.details,
                metadata: record.metadata || {},
            });

            if (error) {
                Logger.warn('[AUDIT] Supabase insert failed:', error.message);
            } else {
                Logger.info(`[AUDIT] Supabase: ${record.actionType} | Verdict: ${record.verdict || 'N/A'}`);
            }
        } catch (error) {
            Logger.warn('[AUDIT] Supabase error:', error);
        }

        // Also log to SQLite for backward compatibility
        try {
            const jobId = typeof record.jobId === 'number' || typeof record.jobId === 'bigint'
                ? record.jobId
                : null;

            this.insertStmt.run({
                actionType: record.actionType,
                jobId: jobId,
                verdict: record.verdict || null,
                details: JSON.stringify(record.details),
                metadata: JSON.stringify(record.metadata || {})
            });
            Logger.debug(`[AUDIT] SQLite: ${record.actionType} logged`);
        } catch (error) {
            Logger.warn('[AUDIT] SQLite insert failed:', error);
        }
    }

    /**
     * Synchronous log for legacy code that can't use async
     * Only logs to SQLite
     */
    public logSync(record: AuditRecord): void {
        try {
            const jobId = typeof record.jobId === 'number' || typeof record.jobId === 'bigint'
                ? record.jobId
                : null;

            const info = this.insertStmt.run({
                actionType: record.actionType,
                jobId: jobId,
                verdict: record.verdict || null,
                details: JSON.stringify(record.details),
                metadata: JSON.stringify(record.metadata || {})
            });
            Logger.info(`[AUDIT] Action: ${record.actionType} | Verdict: ${record.verdict || 'N/A'} | ID: ${info.lastInsertRowid}`);
        } catch (error) {
            Logger.error('Failed to write audit log:', error);
        }
    }

    /**
     * Get audit logs for a specific job from Supabase
     */
    public async getLogsForJob(jobId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('job_id', jobId)
            .order('timestamp', { ascending: false });

        if (error) {
            Logger.error('[AUDIT] Failed to fetch logs for job:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get audit logs for a user from Supabase
     */
    public async getLogsForUser(userId: string, limit: number = 50): Promise<any[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            Logger.error('[AUDIT] Failed to fetch logs for user:', error);
            return [];
        }

        return data || [];
    }
}

export default new AuditService();
