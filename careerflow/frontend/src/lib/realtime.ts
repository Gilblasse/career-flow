/**
 * Supabase Real-time Hooks
 * 
 * These hooks provide real-time subscriptions to database changes
 * for live updates without polling.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Application {
    id: string;
    user_id: string;
    company: string;
    title: string;
    job_url: string;
    ats_provider: string;
    ats_job_id: string;
    location?: string;
    is_remote: boolean;
    description?: string;
    queue_status: string;
    match_score?: number;
    created_at: string;
    updated_at?: string;
    completed_at?: string;
    last_error?: string;
}

export interface QueueCampaign {
    id: string;
    user_id: string;
    status: string;
    dry_run: boolean;
    limit_count: number;
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    started_at?: string;
    completed_at?: string;
    current_job_id?: string;
    pause_reason?: string;
}

/**
 * Hook to subscribe to real-time application updates
 */
export function useApplicationsRealtime(userId: string | undefined) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch initial data
    const fetchApplications = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        fetchApplications();

        // Subscribe to real-time updates
        const channel: RealtimeChannel = supabase
            .channel(`applications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'applications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    setApplications((prev) => {
                        switch (eventType) {
                            case 'INSERT':
                                return [newRecord as Application, ...prev];
                            case 'UPDATE':
                                return prev.map((app) =>
                                    app.id === (newRecord as Application).id
                                        ? (newRecord as Application)
                                        : app
                                );
                            case 'DELETE':
                                return prev.filter(
                                    (app) => app.id !== (oldRecord as Application).id
                                );
                            default:
                                return prev;
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchApplications]);

    return { applications, loading, error, refetch: fetchApplications };
}

/**
 * Hook to subscribe to queue campaign updates
 */
export function useQueueCampaignRealtime(userId: string | undefined) {
    const [campaign, setCampaign] = useState<QueueCampaign | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch the latest active campaign
    const fetchCampaign = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('queue_campaigns')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['processing', 'paused'])
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows returned, which is fine
                console.error('Error fetching campaign:', error);
            }
            setCampaign(data || null);
        } catch (err) {
            console.error('Error fetching campaign:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        fetchCampaign();

        // Subscribe to real-time updates
        const channel: RealtimeChannel = supabase
            .channel(`queue_campaigns:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue_campaigns',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const { eventType, new: newRecord } = payload;

                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const record = newRecord as QueueCampaign;
                        // Only track active campaigns
                        if (record.status === 'processing' || record.status === 'paused') {
                            setCampaign(record);
                        } else {
                            setCampaign(null);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchCampaign]);

    return { campaign, loading, refetch: fetchCampaign };
}

/**
 * Hook to get application statistics with real-time updates
 */
export function useApplicationStats(userId: string | undefined) {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        thisWeek: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);

            // Get counts by status
            const { data, error } = await supabase
                .from('applications')
                .select('queue_status, created_at')
                .eq('user_id', userId);

            if (error) throw error;

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const counts = {
                total: data?.length || 0,
                pending: 0,
                completed: 0,
                failed: 0,
                thisWeek: 0,
            };

            data?.forEach((app) => {
                if (app.queue_status === 'pending' || app.queue_status === 'queued') {
                    counts.pending++;
                } else if (app.queue_status === 'completed') {
                    counts.completed++;
                } else if (app.queue_status === 'failed') {
                    counts.failed++;
                }

                if (new Date(app.created_at) >= weekAgo) {
                    counts.thisWeek++;
                }
            });

            setStats(counts);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchStats();

        // Refetch stats when applications change
        if (!userId) return;

        const channel = supabase
            .channel(`stats:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'applications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Refetch stats on any change
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchStats]);

    return { stats, loading, refetch: fetchStats };
}
