import path from 'path';
import fs from 'fs';
import { Job } from '../../types.js';
import JobStore from '../ingestion/job-store.js';
import ApplicationRunner from '../submission/runner.js';
import ResumeGenerator from '../resume/generator.js';
import ProfileService from '../../services/profile.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';

export type PauseReason = 'captcha' | 'user_takeover' | 'manual' | null;

export interface QueueStatus {
    isProcessing: boolean;
    isPaused: boolean;
    pauseReason: PauseReason;
    currentJobId: number | null;
    queuedJobIds: number[];
    completedJobIds: number[];
    failedJobIds: number[];
    totalCount: number;
}

class QueueProcessor {
    private isProcessing = false;
    private shouldStop = false;
    private isPaused = false;
    private pauseReason: PauseReason = null;
    private currentJobId: number | null = null;
    private queuedJobIds: number[] = [];
    private completedJobIds: number[] = [];
    private failedJobIds: number[] = [];
    private retryMap: Map<number, number> = new Map();

    public stop() {
        if (this.isProcessing) {
            this.shouldStop = true;
            this.pauseReason = 'manual';
            Logger.info('Queue stop signal received. Finishing current job...');
        }
    }

    public pause(reason: PauseReason = 'manual') {
        this.isPaused = true;
        this.pauseReason = reason;
        Logger.warn(`Queue PAUSED. Reason: ${reason}`);
    }

    public resume() {
        this.isPaused = false;
        this.pauseReason = null;
        Logger.info('Queue resumed.');
    }

    public getStatus(): QueueStatus {
        return {
            isProcessing: this.isProcessing,
            isPaused: this.isPaused,
            pauseReason: this.pauseReason,
            currentJobId: this.currentJobId,
            queuedJobIds: [...this.queuedJobIds],
            completedJobIds: [...this.completedJobIds],
            failedJobIds: [...this.failedJobIds],
            totalCount: this.queuedJobIds.length + this.completedJobIds.length + this.failedJobIds.length + (this.currentJobId ? 1 : 0),
        };
    }

    private resetCampaignState() {
        this.currentJobId = null;
        this.queuedJobIds = [];
        this.completedJobIds = [];
        this.failedJobIds = [];
        this.pauseReason = null;
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
        this.resetCampaignState();
        Logger.info(`Starting queue processing. Limit: ${limit}, DryRun: ${dryRun}`);

        try {
            // 1. Fetch Pending Jobs
            const pendingJobs = JobStore.getPendingJobs(limit);
            if (pendingJobs.length === 0) {
                Logger.info('No pending jobs found.');
                return;
            }

            // Initialize queue state
            this.queuedJobIds = pendingJobs.map(j => j.id);

            const profile = ProfileService.getConfig();

            for (const job of pendingJobs) {
                if (this.shouldStop || this.isPaused) {
                    Logger.info('Queue processing stopped.');
                    break;
                }

                // Move job from queued to current
                this.queuedJobIds = this.queuedJobIds.filter(id => id !== job.id);
                this.currentJobId = job.id;

                await this.processJob(job, profile, dryRun);

                // Move job from current to completed/failed (handled in processJob)
                this.currentJobId = null;

                // Safety delay
                if (limit > 1) {
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

        } catch (error) {
            Logger.error('Queue processing failed', error);
        } finally {
            this.isProcessing = false;
            this.currentJobId = null;
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
            if (!dryRun) {
                JobStore.updateStatus(job.id, 'applied');
            }
            
            // Mark as completed
            this.completedJobIds.push(job.id);
            
            // Clear retry count on success
            this.retryMap.delete(job.id);

        } catch (error: any) {
            Logger.error(`Failed to process Job #${job.id}`, error);

            if (error.name === 'CaptchaDetectedError') {
                this.pause('captcha');
                AuditService.log({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: 'CAPTCHA Detected - Queue Paused' }
                });
                return;
            }

            if (error.name === 'UserTakeoverError') {
                this.pause('user_takeover');
                AuditService.log({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: 'User takeover detected - Queue Paused' }
                });
                return;
            }

            // Simple Retry Logic (1 retry)
            const attempts = this.retryMap.get(job.id) || 0;
            if (attempts < 1) {
                Logger.info(`Retrying Job #${job.id} (Attempt ${attempts + 1})`);
                this.retryMap.set(job.id, attempts + 1);
            } else {
                JobStore.updateStatus(job.id, 'failed');
                this.failedJobIds.push(job.id);
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
