import path from 'path';
import fs from 'fs';
import { Job } from '../../types.js';
import JobStore from '../ingestion/job-store.js';
import ApplicationRunner from '../submission/runner.js';
import ResumeGenerator from '../resume/generator.js';
import ProfileService from '../../services/profile.js';
import Logger from '../../services/logger.js';
import AuditService from '../../services/audit.js';
import supabase from '../../services/supabase.js';
import type { ApplicationRow, QueueCampaignRow } from '../../services/supabase.js';

export type PauseReason = 'captcha' | 'user_takeover' | 'manual' | null;
export type CampaignStatus = 'idle' | 'processing' | 'paused' | 'stopped' | 'completed';

export interface QueueStatus {
    isProcessing: boolean;
    isPaused: boolean;
    pauseReason: PauseReason;
    currentJobId: string | null;
    queuedJobIds: string[];
    completedJobIds: string[];
    failedJobIds: string[];
    totalCount: number;
    campaignId?: string;
}

class QueueProcessor {
    // In-memory state for backward compatibility
    private isProcessing = false;
    private shouldStop = false;
    private isPaused = false;
    private pauseReason: PauseReason = null;
    private currentJobId: string | null = null;
    private queuedJobIds: string[] = [];
    private completedJobIds: string[] = [];
    private failedJobIds: string[] = [];
    private retryMap: Map<string, number> = new Map();

    // Supabase campaign tracking
    private currentCampaignId: string | null = null;
    private currentUserId: string | null = null;

    public stop() {
        if (this.isProcessing) {
            this.shouldStop = true;
            this.pauseReason = 'manual';
            Logger.info('Queue stop signal received. Finishing current job...');

            // Update campaign status in DB
            if (this.currentCampaignId) {
                this.updateCampaignStatus('stopped');
            }
        }
    }

    public pause(reason: PauseReason = 'manual') {
        this.isPaused = true;
        this.pauseReason = reason;
        Logger.warn(`Queue PAUSED. Reason: ${reason}`);

        // Update campaign status in DB
        if (this.currentCampaignId) {
            this.updateCampaignStatus('paused', reason);
        }
    }

    public resume() {
        this.isPaused = false;
        this.pauseReason = null;
        Logger.info('Queue resumed.');

        // Update campaign status in DB
        if (this.currentCampaignId) {
            this.updateCampaignStatus('processing');
        }
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
            campaignId: this.currentCampaignId || undefined,
        };
    }

    private resetCampaignState() {
        this.currentJobId = null;
        this.queuedJobIds = [];
        this.completedJobIds = [];
        this.failedJobIds = [];
        this.pauseReason = null;
        this.currentCampaignId = null;
    }

    /**
     * Update campaign status in Supabase
     */
    private async updateCampaignStatus(
        status: CampaignStatus,
        pauseReason?: PauseReason
    ): Promise<void> {
        if (!this.currentCampaignId) return;

        try {
            const update: any = { status };

            if (pauseReason !== undefined) {
                update.pause_reason = pauseReason;
            }

            if (status === 'paused') {
                update.paused_at = new Date().toISOString();
            } else if (status === 'completed' || status === 'stopped') {
                update.completed_at = new Date().toISOString();
                update.completed_jobs = this.completedJobIds.length;
                update.failed_jobs = this.failedJobIds.length;
            }

            await supabase
                .from('queue_campaigns')
                .update(update)
                .eq('id', this.currentCampaignId);

        } catch (error) {
            Logger.error('Failed to update campaign status:', error);
        }
    }

    /**
     * Create a new campaign in Supabase
     */
    private async createCampaign(userId: string, limit: number, dryRun: boolean): Promise<string> {
        const { data, error } = await supabase
            .from('queue_campaigns')
            .insert({
                user_id: userId,
                status: 'processing',
                dry_run: dryRun,
                limit_count: limit,
                started_at: new Date().toISOString(),
                total_jobs: 0,
                completed_jobs: 0,
                failed_jobs: 0,
            })
            .select('id')
            .single();

        if (error) {
            Logger.error('Failed to create campaign:', error);
            throw error;
        }

        return data.id;
    }

    /**
     * Process queue for a specific user (Supabase-backed)
     */
    public async processQueueForUser(userId: string, limit = 1, dryRun = true) {
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
        this.currentUserId = userId;
        this.resetCampaignState();
        Logger.info(`Starting queue processing for user ${userId}. Limit: ${limit}, DryRun: ${dryRun}`);

        try {
            // Create campaign in Supabase
            this.currentCampaignId = await this.createCampaign(userId, limit, dryRun);
            Logger.info(`Created campaign: ${this.currentCampaignId}`);

            // Fetch pending applications from Supabase
            const pendingApps = await JobStore.getPendingApplications(userId, limit);
            if (pendingApps.length === 0) {
                Logger.info('No pending applications found.');
                await this.updateCampaignStatus('completed');
                return;
            }

            // Update campaign with total jobs
            await supabase
                .from('queue_campaigns')
                .update({ total_jobs: pendingApps.length })
                .eq('id', this.currentCampaignId);

            // Initialize queue state
            this.queuedJobIds = pendingApps.map(a => a.id);

            // Mark all jobs as queued
            for (const app of pendingApps) {
                await JobStore.updateApplicationStatus(app.id, 'queued', {
                    queue_batch_id: this.currentCampaignId,
                    queued_at: new Date().toISOString(),
                });
            }

            // Get user profile
            const profile = await ProfileService.getProfileByUserId(userId);

            for (const app of pendingApps) {
                if (this.shouldStop || this.isPaused) {
                    Logger.info('Queue processing stopped.');
                    break;
                }

                // Move job from queued to current
                this.queuedJobIds = this.queuedJobIds.filter(id => id !== app.id);
                this.currentJobId = app.id;

                // Update current job in campaign
                await supabase
                    .from('queue_campaigns')
                    .update({ current_job_id: app.id })
                    .eq('id', this.currentCampaignId);

                await this.processApplication(app, profile, dryRun);

                this.currentJobId = null;

                // Safety delay between jobs
                if (limit > 1) {
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

            // Mark campaign as completed
            if (!this.isPaused && !this.shouldStop) {
                await this.updateCampaignStatus('completed');
            }

        } catch (error) {
            Logger.error('Queue processing failed', error);
            await this.updateCampaignStatus('stopped');
        } finally {
            this.isProcessing = false;
            this.currentJobId = null;
            this.currentUserId = null;
            Logger.info('Queue processing finished.');
        }
    }

    /**
     * Process a single application
     */
    private async processApplication(app: ApplicationRow, profile: any, dryRun: boolean) {
        Logger.info(`Processing Application ${app.id} - ${app.company}`);
        const resumePath = path.resolve(`temp/resume_${app.id}.pdf`);

        try {
            // Update status to processing
            await JobStore.updateApplicationStatus(app.id, 'processing', {
                started_at: new Date().toISOString(),
            });

            // Ensure temp dir exists
            const tempDir = path.dirname(resumePath);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            // Convert ApplicationRow to Job format for existing runner
            const job: Job = {
                id: 0, // Not used by runner
                company: app.company,
                title: app.title,
                atsProvider: app.ats_provider,
                atsJobId: app.ats_job_id,
                jobUrl: app.job_url,
                location: app.location || undefined,
                isRemote: app.is_remote,
                description: app.description || undefined,
                postedAt: app.posted_at ? new Date(app.posted_at) : undefined,
                createdAt: new Date(app.created_at),
                status: app.queue_status,
            };

            // Generate resume
            const pdfBuffer = await ResumeGenerator.generateResume(profile, job);
            fs.writeFileSync(resumePath, pdfBuffer);

            // Submit application
            await ApplicationRunner.submitApplication(job, resumePath, dryRun);

            // Update status to completed
            await JobStore.updateApplicationStatus(app.id, 'completed', {
                completed_at: new Date().toISOString(),
            });

            this.completedJobIds.push(app.id);
            this.retryMap.delete(app.id);

            // Audit log
            await AuditService.log({
                actionType: dryRun ? 'DRY_RUN' : 'SUBMIT',
                userId: this.currentUserId || undefined,
                jobId: app.id,
                verdict: 'ACCEPTED',
                details: { company: app.company, title: app.title },
            });

        } catch (error: any) {
            Logger.error(`Failed to process Application ${app.id}`, error);

            if (error.name === 'CaptchaDetectedError') {
                this.pause('captcha');
                await JobStore.updateApplicationStatus(app.id, 'paused', {
                    pause_reason: 'captcha',
                    last_error: 'CAPTCHA Detected',
                });
                await AuditService.log({
                    actionType: 'ERROR',
                    userId: this.currentUserId || undefined,
                    jobId: app.id,
                    details: { error: 'CAPTCHA Detected - Queue Paused' },
                });
                return;
            }

            if (error.name === 'UserTakeoverError') {
                this.pause('user_takeover');
                await JobStore.updateApplicationStatus(app.id, 'paused', {
                    pause_reason: 'user_takeover',
                    last_error: 'User takeover detected',
                });
                await AuditService.log({
                    actionType: 'ERROR',
                    userId: this.currentUserId || undefined,
                    jobId: app.id,
                    details: { error: 'User takeover detected - Queue Paused' },
                });
                return;
            }

            // Retry logic
            const attempts = this.retryMap.get(app.id) || 0;
            if (attempts < 1) {
                Logger.info(`Retrying Application ${app.id} (Attempt ${attempts + 1})`);
                this.retryMap.set(app.id, attempts + 1);
                // Re-queue for retry
                await JobStore.updateApplicationStatus(app.id, 'pending', {
                    retry_count: attempts + 1,
                });
            } else {
                await JobStore.updateApplicationStatus(app.id, 'failed', {
                    last_error: error.message,
                    completed_at: new Date().toISOString(),
                });
                this.failedJobIds.push(app.id);
                await AuditService.log({
                    actionType: 'ERROR',
                    userId: this.currentUserId || undefined,
                    jobId: app.id,
                    verdict: 'FAILED',
                    details: { error: error.message, stage: 'QueueProcessor' },
                });
                this.retryMap.delete(app.id);
            }
        } finally {
            // Cleanup resume file
            if (fs.existsSync(resumePath)) {
                fs.unlinkSync(resumePath);
            }
        }
    }

    // ============ LEGACY METHODS (for backward compatibility) ============

    /**
     * Legacy: Process queue without user context
     * @deprecated Use processQueueForUser() instead
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
        Logger.info(`Starting legacy queue processing. Limit: ${limit}, DryRun: ${dryRun}`);

        try {
            // Fetch pending jobs from SQLite
            const pendingJobs = JobStore.getPendingJobs(limit);
            if (pendingJobs.length === 0) {
                Logger.info('No pending jobs found.');
                return;
            }

            // Initialize queue state (cast to string[] for compatibility)
            this.queuedJobIds = pendingJobs.map(j => String(j.id));

            // Get profile from file (legacy)
            let profile;
            try {
                // Try to get from first user in Supabase, fallback to empty profile
                profile = {
                    contact: { firstName: '', lastName: '', email: '', phone: '', linkedin: '', location: '' },
                    experience: [],
                    education: [],
                    preferences: { remoteOnly: false, excludedKeywords: [], maxSeniority: [], locations: [] },
                    skills: [],
                    resumeProfiles: [],
                };
            } catch {
                profile = {
                    contact: { firstName: '', lastName: '', email: '', phone: '', linkedin: '', location: '' },
                    experience: [],
                    education: [],
                    preferences: { remoteOnly: false, excludedKeywords: [], maxSeniority: [], locations: [] },
                    skills: [],
                    resumeProfiles: [],
                };
            }

            for (const job of pendingJobs) {
                if (this.shouldStop || this.isPaused) {
                    Logger.info('Queue processing stopped.');
                    break;
                }

                this.queuedJobIds = this.queuedJobIds.filter(id => id !== String(job.id));
                this.currentJobId = String(job.id);

                await this.processJobLegacy(job, profile, dryRun);

                this.currentJobId = null;

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

    private async processJobLegacy(job: Job, profile: any, dryRun: boolean) {
        Logger.info(`Processing Job #${job.id} - ${job.company}`);
        const resumePath = path.resolve(`temp/resume_${job.id}.pdf`);

        try {
            const tempDir = path.dirname(resumePath);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const pdfBuffer = await ResumeGenerator.generateResume(profile, job);
            fs.writeFileSync(resumePath, pdfBuffer);

            await ApplicationRunner.submitApplication(job, resumePath, dryRun);

            if (!dryRun) {
                JobStore.updateStatus(job.id, 'applied');
            }

            this.completedJobIds.push(String(job.id));
            this.retryMap.delete(String(job.id));

        } catch (error: any) {
            Logger.error(`Failed to process Job #${job.id}`, error);

            if (error.name === 'CaptchaDetectedError') {
                this.pause('captcha');
                AuditService.logSync({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: 'CAPTCHA Detected - Queue Paused' },
                });
                return;
            }

            if (error.name === 'UserTakeoverError') {
                this.pause('user_takeover');
                AuditService.logSync({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: 'User takeover detected - Queue Paused' },
                });
                return;
            }

            const attempts = this.retryMap.get(String(job.id)) || 0;
            if (attempts < 1) {
                Logger.info(`Retrying Job #${job.id} (Attempt ${attempts + 1})`);
                this.retryMap.set(String(job.id), attempts + 1);
            } else {
                JobStore.updateStatus(job.id, 'failed');
                this.failedJobIds.push(String(job.id));
                AuditService.logSync({
                    actionType: 'ERROR',
                    jobId: job.id,
                    details: { error: error.message, stage: 'QueueProcessor' },
                });
                this.retryMap.delete(String(job.id));
            }
        } finally {
            if (fs.existsSync(resumePath)) {
                fs.unlinkSync(resumePath);
            }
        }
    }
}

export default new QueueProcessor();
