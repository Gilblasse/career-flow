/**
 * Jobs Service
 * 
 * Manages the global jobs catalog in Supabase.
 * Handles upsert, query, and lifecycle management of scraped jobs.
 */

import { supabase } from './supabase.js';
import Logger from './logger.js';
import type { RawJob, ATSProvider, JobRow, JobFilters } from '../types.js';

/**
 * Input type for upserting a job (without generated fields)
 */
export type JobInsert = Omit<JobRow, 'id' | 'scraped_at' | 'last_seen_at' | 'is_active' | 'created_at' | 'updated_at'>;

/**
 * Result type for paginated queries
 */
export interface JobQueryResult {
    jobs: JobRow[];
    total: number;
    hasMore: boolean;
}

/**
 * Jobs Service - manages the global jobs catalog
 */
export class JobsService {
    private static readonly TABLE_NAME = 'jobs';

    /**
     * Upsert a job from scraping
     * 
     * Uses onConflict on (ats_provider, ats_job_id) to handle duplicates.
     * Always updates last_seen_at and sets is_active=true on conflict.
     */
    async upsertJob(rawJob: RawJob): Promise<JobRow | null> {
        try {
            const jobData: JobInsert = {
                company: rawJob.company,
                title: rawJob.title,
                ats_provider: rawJob.atsProvider,
                ats_job_id: rawJob.atsJobId,
                job_url: rawJob.jobUrl,
                location: rawJob.location || null,
                is_remote: rawJob.isRemote,
                salary_min: null,
                salary_max: null,
                employment_type: null,
                description: rawJob.description || null,
                logo_url: null,
                posted_at: rawJob.postedAt?.toISOString() || null,
            };

            const { data, error } = await supabase
                .from(JobsService.TABLE_NAME)
                .upsert(
                    {
                        ...jobData,
                        last_seen_at: new Date().toISOString(),
                        is_active: true,
                    },
                    {
                        onConflict: 'ats_provider,ats_job_id',
                        ignoreDuplicates: false,
                    }
                )
                .select()
                .single();

            if (error) {
                Logger.error(`Failed to upsert job: ${error.message}`);
                throw error;
            }

            Logger.debug(`Upserted job: ${rawJob.company} - ${rawJob.title}`);
            return data as JobRow;
        } catch (error) {
            Logger.error(`Error in upsertJob: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Upsert multiple jobs in a batch
     */
    async upsertJobs(rawJobs: RawJob[]): Promise<{ inserted: number; updated: number; failed: number }> {
        let inserted = 0;
        let updated = 0;
        let failed = 0;

        for (const rawJob of rawJobs) {
            try {
                // Check if job already exists
                const { data: existing } = await supabase
                    .from(JobsService.TABLE_NAME)
                    .select('id')
                    .eq('ats_provider', rawJob.atsProvider)
                    .eq('ats_job_id', rawJob.atsJobId)
                    .single();

                await this.upsertJob(rawJob);

                if (existing) {
                    updated++;
                } else {
                    inserted++;
                }
            } catch (error) {
                Logger.warn(`Failed to upsert job ${rawJob.atsJobId}: ${error instanceof Error ? error.message : String(error)}`);
                failed++;
            }
        }

        Logger.info(`Batch upsert complete: ${inserted} inserted, ${updated} updated, ${failed} failed`);
        return { inserted, updated, failed };
    }

    /**
     * Get active jobs with optional filtering and pagination
     */
    async getActiveJobs(filters: JobFilters = {}): Promise<JobQueryResult> {
        try {
            const {
                search,
                location,
                isRemote,
                employmentType,
                atsProvider,
                company,
                limit = 50,
                offset = 0,
            } = filters;

            // Build the query
            let query = supabase
                .from(JobsService.TABLE_NAME)
                .select('*', { count: 'exact' })
                .eq('is_active', true);

            // Apply search filter (title or company)
            if (search) {
                query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
            }

            // Apply location filter
            if (location) {
                query = query.ilike('location', `%${location}%`);
            }

            // Apply remote filter
            if (isRemote !== undefined) {
                query = query.eq('is_remote', isRemote);
            }

            // Apply employment type filter
            if (employmentType) {
                query = query.eq('employment_type', employmentType);
            }

            // Apply ATS provider filter
            if (atsProvider) {
                query = query.eq('ats_provider', atsProvider);
            }

            // Apply company filter
            if (company) {
                query = query.eq('company', company);
            }

            // Apply pagination and ordering
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                Logger.error(`Failed to get active jobs: ${error.message}`);
                throw error;
            }

            const jobs = (data || []) as JobRow[];
            const total = count || 0;

            return {
                jobs,
                total,
                hasMore: offset + jobs.length < total,
            };
        } catch (error) {
            Logger.error(`Error in getActiveJobs: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get a single job by ID
     */
    async getJobById(id: string): Promise<JobRow | null> {
        try {
            const { data, error } = await supabase
                .from(JobsService.TABLE_NAME)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                Logger.error(`Failed to get job by ID: ${error.message}`);
                throw error;
            }

            return data as JobRow;
        } catch (error) {
            Logger.error(`Error in getJobById: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Mark jobs as inactive if they haven't been seen recently
     * 
     * @param staleDays Number of days without being seen before marking inactive
     * @returns Number of jobs marked inactive
     */
    async markStaleJobsInactive(staleDays: number = 7): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - staleDays);

            const { data, error } = await supabase
                .from(JobsService.TABLE_NAME)
                .update({ is_active: false })
                .eq('is_active', true)
                .lt('last_seen_at', cutoffDate.toISOString())
                .select('id');

            if (error) {
                Logger.error(`Failed to mark stale jobs inactive: ${error.message}`);
                throw error;
            }

            const count = data?.length || 0;
            Logger.info(`Marked ${count} stale jobs as inactive (not seen in ${staleDays} days)`);
            return count;
        } catch (error) {
            Logger.error(`Error in markStaleJobsInactive: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Permanently delete old inactive jobs
     * 
     * @param purgeDays Number of days since last_seen_at before purging
     * @returns Number of jobs purged
     */
    async purgeOldJobs(purgeDays: number = 90): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - purgeDays);

            const { data, error } = await supabase
                .from(JobsService.TABLE_NAME)
                .delete()
                .eq('is_active', false)
                .lt('last_seen_at', cutoffDate.toISOString())
                .select('id');

            if (error) {
                Logger.error(`Failed to purge old jobs: ${error.message}`);
                throw error;
            }

            const count = data?.length || 0;
            Logger.info(`Purged ${count} old inactive jobs (not seen in ${purgeDays} days)`);
            return count;
        } catch (error) {
            Logger.error(`Error in purgeOldJobs: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get job statistics
     */
    async getStats(): Promise<{
        totalJobs: number;
        activeJobs: number;
        inactiveJobs: number;
        byProvider: Record<ATSProvider, number>;
    }> {
        try {
            const { count: totalJobs, error: totalError } = await supabase
                .from(JobsService.TABLE_NAME)
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            const { count: activeJobs, error: activeError } = await supabase
                .from(JobsService.TABLE_NAME)
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (activeError) throw activeError;

            const byProvider: Record<ATSProvider, number> = {
                greenhouse: 0,
                lever: 0,
                ashby: 0,
            };

            for (const provider of ['greenhouse', 'lever', 'ashby'] as ATSProvider[]) {
                const { count, error } = await supabase
                    .from(JobsService.TABLE_NAME)
                    .select('*', { count: 'exact', head: true })
                    .eq('ats_provider', provider)
                    .eq('is_active', true);

                if (error) throw error;
                byProvider[provider] = count || 0;
            }

            return {
                totalJobs: totalJobs || 0,
                activeJobs: activeJobs || 0,
                inactiveJobs: (totalJobs || 0) - (activeJobs || 0),
                byProvider,
            };
        } catch (error) {
            Logger.error(`Error in getStats: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}

// Export singleton instance
export const jobsService = new JobsService();

export default jobsService;
