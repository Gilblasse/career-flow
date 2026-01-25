import path from 'path';
import fs from 'fs';
import { Job } from '../../types.js';
import JobStore from '../ingestion/job-store.js';
import ApplicationRunner from '../submission/runner.js';
import ResumeGenerator from '../resume/generator.js';
import ProfileService from '../../services/profile.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';

class QueueProcessor {
    private isProcessing = false;
    private shouldStop = false;
    private isPaused = false;
    private retryMap: Map<number, number> = new Map(); // jobId -> attemptCount

    public stop() {
        if (this.isProcessing) {
            this.shouldStop = true;
            Logger.info('Queue stop signal received. Finishing current job...');
        }
    }

    public pause() {
        this.isPaused = true;
        Logger.warn('Queue PAUSED due to critical error (e.g. CAPTCHA).');
    }

    public resume() {
        this.isPaused = false;
        Logger.info('Queue resumed.');
    }

    public getStatus() {
        return {
            isProcessing: this.isProcessing,
            isPaused: this.isPaused
        };
    }

    /**
     * Processes a batch of pending jobs.
     * @param limit Number of jobs to process
     * @param dryRun Whether to perform a dry run (default true)
     */
    public async processQueue(limit = 1, dryRun = true) {
        if (this.isProcessing) {
            Logger.warn('Queue is already processing.');
            return;
        }

        if (this.isPaused) {
            Logger.warn('Queue is PAUSED. Resume to continue.');
            return;
        }

        this.isProcessing = true;
        this.shouldStop = false;
        Logger.info(`Starting queue processing. Limit: ${limit}, DryRun: ${dryRun}`);

        try {
            // 1. Fetch Pending Jobs
            const pendingJobs = JobStore.getPendingJobs(limit);
            if (pendingJobs.length === 0) {
                Logger.info('No pending jobs found.');
                return;
            }

            const profile = ProfileService.getConfig();

            for (const job of pendingJobs) {
                if (this.shouldStop || this.isPaused) {
                    Logger.info('Queue processing stopped.');
                    break;
                }

                await this.processJob(job, profile, dryRun);
                // Safety delay
                if (limit > 1) {
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

        } catch (error) {
            Logger.error('Queue processing failed', error);
        } finally {
            this.isProcessing = false;
            Logger.info('Queue processing finished.');
        }
    }

    private async processJob(job: Job, profile: any, dryRun: boolean) {
        Logger.info(`Processing Job #${job.id} - ${job.company}`);
        const resumePath = path.resolve(`temp/resume_${job.id}.pdf`);

        try {
            // Ensure temp dir exists
            const tempDir = path.dirname(resumePath);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            // 1. Generate Resume
            const pdfBuffer = await ResumeGenerator.generateResume(profile, job);
            fs.writeFileSync(resumePath, pdfBuffer);

            // 2. Apply
            await ApplicationRunner.submitApplication(job, resumePath, dryRun);

            // 3. Update Status
            // If dryRun, we might not want to mark as APPLIED essentially, 
            // but for tracking flow we can mark as PROCESSED or leave as PENDING?
            // Let's mark as 'applied' if not dry run, or maybe separate status.
            // For now, if Dry Run succeeds, we leave it PENDING or update to a new status 'REVIEWED'?
            // Let's assume we update to 'applied' if not dry run.

            if (!dryRun) {
                JobStore.updateStatus(job.id, 'applied');
            }
            // Clear retry count on success
            this.retryMap.delete(job.id);

        } catch (error: any) {
            Logger.error(`Failed to process Job #${job.id}`, error);

            if (error.name === 'CaptchaDetectedError') {
                this.pause();
                AuditService.log({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: 'CAPTCHA Detected - Queue Paused' }
                });
                return; // Stop processing this job, queue is paused for next loop check
            }

            // Should also catch TransientError here if we implement it in runner...
            // For now assuming all other errors are failed attempts.

            // Simple Retry Logic (1 retry)
            const attempts = this.retryMap.get(job.id) || 0;
            if (attempts < 1) {
                Logger.info(`Retrying Job #${job.id} (Attempt ${attempts + 1})`);
                this.retryMap.set(job.id, attempts + 1);
                // We don't mark as failed yet, it will be picked up next run (still pending)
                // But wait, if we processPending, we pick it up again.
                // We should probably just return and let the queue loop pick it up next time?
                // Or recursively call processJob? No, dangerous recursion.
                // Just keeping it 'pending' allows next queue run to pick it up.
            } else {
                JobStore.updateStatus(job.id, 'failed');
                AuditService.log({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: error.message, stage: 'QueueProcessor' }
                });
                this.retryMap.delete(job.id);
            }
        } finally {
            // Cleanup Resume
            if (fs.existsSync(resumePath)) {
                fs.unlinkSync(resumePath);
            }
        }
    }
}

export default new QueueProcessor();
