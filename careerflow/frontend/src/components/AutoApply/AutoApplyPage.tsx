import React, { useState, useEffect, useCallback } from 'react';
import {
    Play,
    Pause,
    Zap,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronRight,
    Trash2,
    Building2,
    MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    isDevMode,
    getMockQueueStatus,
    startMockCampaign,
    resumeMockCampaign,
    pauseMockCampaign,
} from '@/utils/devMode';

// =============================================================================
// Types
// =============================================================================

type PauseReason = 'captcha' | 'user_takeover' | 'manual' | null;

interface QueueStatus {
    isProcessing: boolean;
    isPaused: boolean;
    pauseReason: PauseReason;
    currentJobId: number | null;
    queuedJobIds: number[];
    completedJobIds: number[];
    failedJobIds: number[];
    totalCount: number;
}

interface JobInfo {
    id: number;
    title: string;
    company: string;
    location?: string;
    matchScore?: number;
}

interface AuditEntry {
    id: number;
    timestamp: string;
    actionType: string;
    verdict: string;
    details: {
        reason?: string;
        triggerRule?: string;
        ruleBreakdown?: { ruleName: string; passed: boolean; reason: string }[];
        matchedSkills?: string[];
        missingSkills?: string[];
    };
}

// =============================================================================
// Mock data for dev mode
// =============================================================================

const MOCK_JOBS_INFO: Record<number, JobInfo> = {
    1: { id: 1, title: 'Senior Software Engineer', company: 'TechCorp', location: 'San Francisco, CA', matchScore: 92 },
    2: { id: 2, title: 'Full Stack Developer', company: 'StartupXYZ', location: 'Remote', matchScore: 88 },
    3: { id: 3, title: 'Frontend Engineer', company: 'DesignCo', location: 'New York, NY', matchScore: 85 },
    4: { id: 4, title: 'Backend Engineer', company: 'DataFlow Inc', location: 'Austin, TX', matchScore: 90 },
    5: { id: 5, title: 'DevOps Engineer', company: 'CloudScale', location: 'Remote', matchScore: 78 },
};

const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
    {
        id: 1,
        timestamp: new Date().toISOString(),
        actionType: 'FILTER',
        verdict: 'ACCEPTED',
        details: {
            reason: 'Passed all hard gates',
            ruleBreakdown: [
                { ruleName: 'Excluded Technology', passed: true, reason: 'Tech stack compatible' },
                { ruleName: 'Remote Policy', passed: true, reason: 'Remote position' },
                { ruleName: 'Seniority Mismatch', passed: true, reason: 'Seniority level acceptable' },
            ],
            matchedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
            missingSkills: ['Go'],
        },
    },
];

// =============================================================================
// Component
// =============================================================================

const AutoApplyPage: React.FC = () => {
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({
        isProcessing: false,
        isPaused: false,
        pauseReason: null,
        currentJobId: null,
        queuedJobIds: [],
        completedJobIds: [],
        failedJobIds: [],
        totalCount: 0,
    });
    const [dryRun, setDryRun] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [aiDecisionsOpen, setAiDecisionsOpen] = useState(false);
    const [currentJobAudit, setCurrentJobAudit] = useState<AuditEntry[]>([]);

    // Fetch queue status
    const fetchQueueStatus = useCallback(async () => {
        try {
            if (isDevMode()) {
                setQueueStatus(getMockQueueStatus());
                return;
            }
            const res = await fetch('http://localhost:3001/api/queue/status');
            if (res.ok) {
                const data = await res.json();
                setQueueStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch queue status:', err);
        }
    }, []);

    // Fetch audit entries for current job
    const fetchCurrentJobAudit = useCallback(async (jobId: number) => {
        try {
            if (isDevMode()) {
                setCurrentJobAudit(MOCK_AUDIT_ENTRIES);
                return;
            }
            const res = await fetch(`http://localhost:3001/api/audit/${jobId}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentJobAudit(data);
            }
        } catch (err) {
            console.error('Failed to fetch audit:', err);
        }
    }, []);

    // Poll status when processing
    useEffect(() => {
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 2000);
        return () => clearInterval(interval);
    }, [fetchQueueStatus]);

    // Fetch audit when current job changes
    useEffect(() => {
        if (queueStatus.currentJobId) {
            fetchCurrentJobAudit(queueStatus.currentJobId);
        } else {
            setCurrentJobAudit([]);
        }
    }, [queueStatus.currentJobId, fetchCurrentJobAudit]);

    // Handle start campaign
    const handleStart = async () => {
        setIsLoading(true);
        try {
            if (isDevMode()) {
                const jobIds = [1, 2, 3, 4, 5];
                await startMockCampaign(jobIds, setQueueStatus);
            } else {
                await fetch('http://localhost:3001/api/queue/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: 10, dryRun }),
                });
            }
            await fetchQueueStatus();
        } finally {
            setIsLoading(false);
        }
    };

    // Handle pause
    const handlePause = async () => {
        setIsLoading(true);
        try {
            if (isDevMode()) {
                await pauseMockCampaign();
            } else {
                await fetch('http://localhost:3001/api/queue/stop', { method: 'POST' });
            }
            await fetchQueueStatus();
        } finally {
            setIsLoading(false);
        }
    };

    // Handle resume
    const handleResume = async () => {
        setIsLoading(true);
        try {
            if (isDevMode()) {
                await resumeMockCampaign();
            } else {
                await fetch('http://localhost:3001/api/queue/resume', { method: 'POST' });
            }
            await fetchQueueStatus();
        } finally {
            setIsLoading(false);
        }
    };

    // Get job info (mock or real)
    const getJobInfo = (jobId: number): JobInfo => {
        if (isDevMode()) {
            return MOCK_JOBS_INFO[jobId] || { id: jobId, title: `Job #${jobId}`, company: 'Unknown' };
        }
        // In production, you'd fetch this from state or API
        return { id: jobId, title: `Job #${jobId}`, company: 'Loading...' };
    };

    const currentJob = queueStatus.currentJobId ? getJobInfo(queueStatus.currentJobId) : null;
    const completedCount = queueStatus.completedJobIds.length;
    const failedCount = queueStatus.failedJobIds.length;
    const totalProcessed = completedCount + failedCount;
    const progressPercent = queueStatus.totalCount > 0 ? (totalProcessed / queueStatus.totalCount) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Zap className="h-6 w-6 text-primary" />
                        Auto Apply Preview
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor and control automated job applications
                    </p>
                </div>
            </div>

            {/* Control Bar */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left: Controls */}
                        <div className="flex items-center gap-4">
                            {!queueStatus.isProcessing ? (
                                <Button onClick={handleStart} disabled={isLoading} className="gap-2">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    Start Campaign
                                </Button>
                            ) : (
                                <Button onClick={handlePause} disabled={isLoading} variant="secondary" className="gap-2">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                                    Pause
                                </Button>
                            )}

                            {/* Preview Mode Toggle */}
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="preview-mode"
                                    checked={dryRun}
                                    onCheckedChange={setDryRun}
                                    disabled={queueStatus.isProcessing}
                                />
                                <Label htmlFor="preview-mode" className="text-sm cursor-pointer">
                                    Preview Mode
                                </Label>
                                <Badge variant={dryRun ? 'secondary' : 'destructive'} className="text-xs">
                                    {dryRun ? 'Preview Only' : 'Live'}
                                </Badge>
                            </div>
                        </div>

                        {/* Right: Progress */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>{completedCount}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span>{failedCount}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {totalProcessed} of {queueStatus.totalCount} jobs
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {queueStatus.totalCount > 0 && (
                        <Progress value={progressPercent} className="mt-4 h-2" />
                    )}
                </CardContent>
            </Card>

            {/* Current Job Preview */}
            <Card className={queueStatus.isPaused && queueStatus.pauseReason === 'captcha' ? 'border-amber-500' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Current Job</span>
                        {queueStatus.isProcessing && !queueStatus.isPaused && (
                            <Badge variant="default" className="bg-green-500 gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Processing
                            </Badge>
                        )}
                        {queueStatus.isPaused && queueStatus.pauseReason === 'captcha' && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                CAPTCHA Detected
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentJob ? (
                        <div className="space-y-4">
                            {/* Job Info */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{currentJob.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-4 w-4" />
                                            {currentJob.company}
                                        </span>
                                        {currentJob.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {currentJob.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {currentJob.matchScore && (
                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                        {currentJob.matchScore}% Match
                                    </Badge>
                                )}
                            </div>

                            {/* Resume Button when paused */}
                            {queueStatus.isPaused && (
                                <Button onClick={handleResume} disabled={isLoading} className="w-full gap-2">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    {queueStatus.pauseReason === 'captcha' ? 'Resume After CAPTCHA' : 'Resume Campaign'}
                                </Button>
                            )}

                            {/* AI Decisions Collapsible */}
                            <Collapsible open={aiDecisionsOpen} onOpenChange={setAiDecisionsOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                                        <span className="text-sm font-medium">AI Decision Summary</span>
                                        {aiDecisionsOpen ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3 pt-2">
                                    {currentJobAudit.length > 0 ? (
                                        currentJobAudit.map((entry) => (
                                            <div key={entry.id} className="space-y-2">
                                                {/* Rule Breakdown */}
                                                {entry.details.ruleBreakdown && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Filter Rules</p>
                                                        <div className="grid gap-1">
                                                            {entry.details.ruleBreakdown.map((rule, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                                    {rule.passed ? (
                                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                    ) : (
                                                                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                                    )}
                                                                    <span className={rule.passed ? 'text-foreground' : 'text-muted-foreground'}>
                                                                        {rule.ruleName}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">— {rule.reason}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skills Match */}
                                                {entry.details.matchedSkills && entry.details.matchedSkills.length > 0 && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Matched Skills</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.details.matchedSkills.map((skill, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {entry.details.missingSkills && entry.details.missingSkills.length > 0 && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Missing Skills</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.details.missingSkills.map((skill, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No AI decisions logged yet.</p>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {queueStatus.isProcessing ? (
                                <p>Waiting for next job...</p>
                            ) : (
                                <p>No active campaign. Click "Start Campaign" to begin.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Queued Jobs List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                        Queued Jobs ({queueStatus.queuedJobIds.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {queueStatus.queuedJobIds.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {queueStatus.queuedJobIds.map((jobId) => {
                                const job = getJobInfo(jobId);
                                return (
                                    <div
                                        key={jobId}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{job.title}</p>
                                            <p className="text-xs text-muted-foreground">{job.company}</p>
                                        </div>
                                        {job.matchScore && (
                                            <Badge variant="outline" className="text-xs mr-2">
                                                {job.matchScore}%
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            title="Remove from queue"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center py-6 text-muted-foreground">
                            No jobs in queue
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AutoApplyPage;
