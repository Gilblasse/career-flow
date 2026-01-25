import db from './db.js';
import Logger from './logger.js';

export type AuditActionType = 'INGEST' | 'FILTER' | 'MATCH' | 'SUBMIT' | 'ERROR' | 'DRY_RUN';
export type Verdict = 'ACCEPTED' | 'REJECTED' | 'REVIEW_OPTIONAL' | 'FAILED';

export interface AuditRecord {
    actionType: AuditActionType;
    jobId?: number | bigint;
    verdict?: Verdict;
    details: any;
    metadata?: any;
}

class AuditService {
    private insertStmt: any;

    constructor() {
        this.insertStmt = db.prepare(`
            INSERT INTO audit_logs (action_type, job_id, verdict, details, metadata)
            VALUES (@actionType, @jobId, @verdict, @details, @metadata)
        `);
    }

    public log(record: AuditRecord) {
        try {
            const info = this.insertStmt.run({
                actionType: record.actionType,
                jobId: record.jobId || null,
                verdict: record.verdict || null,
                details: JSON.stringify(record.details),
                metadata: JSON.stringify(record.metadata || {})
            });
            Logger.info(`[AUDIT] Action: ${record.actionType} | Verdict: ${record.verdict || 'N/A'} | ID: ${info.lastInsertRowid}`);
        } catch (error) {
            Logger.error('Failed to write audit log:', error);
            // Critical fail: If we can't audit, we should arguably crash or alert, 
            // but for now we log the failure to the file logger.
        }
    }
}

export default new AuditService();
