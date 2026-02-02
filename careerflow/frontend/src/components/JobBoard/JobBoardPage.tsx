import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, 
    MapPin, 
    Building2, 
    DollarSign, 
    Clock, 
    Briefcase,
    Check,
    MessageSquare,
    SlidersHorizontal,
    Play,
    Pause,
    Zap,
    X,
    Loader2,
    AlertTriangle,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Eye,
    Monitor,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/components/Auth';
import {
    isDevMode,
    getMockQueueStatus,
    startMockCampaign,
    resumeMockCampaign,
    stopMockCampaign,
    MOCK_JOBS as DEV_MOCK_JOBS,
} from '@/utils/devMode';

// =============================================================================
// Types
// =============================================================================

export type JobStatus = 'new' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'skipped' | 'applying' | 'queued';
export type WorkType = 'all' | 'remote' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract';
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

export interface JobListing {
    id: string;
    title: string;
    company: string;
    location: string;
    isRemote: boolean;
    salaryMin: number;
    salaryMax: number;
    employmentType: EmploymentType;
    postedAt: string;
    description: string;
    matchScore: number;
    status: JobStatus;
    appliedAt?: string;
    logoUrl?: string;
    logoColor?: string;
    jobUrl?: string;
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_JOBS: JobListing[] = [
    {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        isRemote: true,
        salaryMin: 140000,
        salaryMax: 180000,
        employmentType: 'full-time',
        postedAt: '2 days ago',
        description: 'Looking for experienced software engineer to join our platform team. You will be working on cutting-edge distributed systems, building scalable microservices, and collaborating with cross-functional teams to deliver world-class products.\n\nRequirements:\n- 5+ years of experience in software development\n- Strong proficiency in TypeScript, React, and Node.js\n- Experience with cloud platforms (AWS, GCP, or Azure)\n- Excellent problem-solving skills\n- Strong communication abilities',
        matchScore: 92,
        status: 'new',
        logoColor: '#3B82F6',
        jobUrl: 'https://boards.greenhouse.io/techcorp/jobs/12345',
    },
    {
        id: '2',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        isRemote: true,
        salaryMin: 120000,
        salaryMax: 160000,
        employmentType: 'full-time',
        postedAt: '1 day ago',
        description: 'Build scalable web applications using React and Node.js. Join our fast-growing startup and help shape the future of our product.\n\nWhat you\'ll do:\n- Design and implement new features\n- Write clean, maintainable code\n- Participate in code reviews\n- Collaborate with designers and product managers',
        matchScore: 88,
        status: 'applied',
        appliedAt: '1 day ago',
        logoColor: '#10B981',
        jobUrl: 'https://jobs.lever.co/startupxyz/67890',
    },
    {
        id: '3',
        title: 'Frontend Engineer',
        company: 'DesignCo',
        location: 'New York, NY',
        isRemote: false,
        salaryMin: 130000,
        salaryMax: 170000,
        employmentType: 'full-time',
        postedAt: '3 days ago',
        description: 'Create beautiful user interfaces with modern web technologies. We\'re looking for someone passionate about UI/UX who can bring designs to life.\n\nTech stack:\n- React/Next.js\n- TypeScript\n- Tailwind CSS\n- Framer Motion',
        matchScore: 85,
        status: 'new',
        logoColor: '#F59E0B',
        jobUrl: 'https://jobs.ashbyhq.com/designco/11111',
    },
    {
        id: '4',
        title: 'Backend Engineer',
        company: 'DataFlow Inc',
        location: 'Austin, TX',
        isRemote: true,
        salaryMin: 135000,
        salaryMax: 175000,
        employmentType: 'full-time',
        postedAt: '3 days ago',
        description: 'Build robust backend systems and APIs. Work with our data engineering team to process millions of events per day.\n\nRequirements:\n- Experience with Python or Go\n- Database design (PostgreSQL, Redis)\n- Message queues (Kafka, RabbitMQ)\n- Kubernetes and Docker',
        matchScore: 90,
        status: 'interviewing',
        logoColor: '#8B5CF6',
        jobUrl: 'https://boards.greenhouse.io/dataflow/jobs/22222',
    },
    {
        id: '5',
        title: 'DevOps Engineer',
        company: 'CloudSystems',
        location: 'Seattle, WA',
        isRemote: true,
        salaryMin: 145000,
        salaryMax: 185000,
        employmentType: 'full-time',
        postedAt: '5 days ago',
        description: 'Manage cloud infrastructure and CI/CD pipelines. Help us scale our systems to handle 10x growth.\n\nWhat we\'re looking for:\n- AWS/GCP expertise\n- Terraform, Ansible\n- Kubernetes administration\n- Monitoring and observability',
        matchScore: 78,
        status: 'new',
        logoColor: '#EC4899',
        jobUrl: 'https://jobs.lever.co/cloudsystems/33333',
    },
    {
        id: '6',
        title: 'React Developer',
        company: 'WebAgency',
        location: 'Chicago, IL',
        isRemote: false,
        salaryMin: 100000,
        salaryMax: 140000,
        employmentType: 'contract',
        postedAt: '1 week ago',
        description: '6-month contract for React development work. Build client websites and web applications.',
        matchScore: 72,
        status: 'new',
        logoColor: '#EF4444',
        jobUrl: 'https://webagency.com/careers/react-developer',
    },
    {
        id: '7',
        title: 'Software Engineer II',
        company: 'FinTech Pro',
        location: 'Boston, MA',
        isRemote: true,
        salaryMin: 125000,
        salaryMax: 155000,
        employmentType: 'full-time',
        postedAt: '4 days ago',
        description: 'Join our payments team to build next-generation financial infrastructure.',
        matchScore: 83,
        status: 'new',
        logoColor: '#06B6D4',
        jobUrl: 'https://boards.greenhouse.io/fintechpro/jobs/44444',
    },
    {
        id: '8',
        title: 'Principal Engineer',
        company: 'Enterprise Corp',
        location: 'Denver, CO',
        isRemote: true,
        salaryMin: 180000,
        salaryMax: 220000,
        employmentType: 'full-time',
        postedAt: '2 days ago',
        description: 'Lead technical architecture and mentor engineering teams across the organization.',
        matchScore: 95,
        status: 'new',
        jobUrl: 'https://jobs.lever.co/enterprisecorp/55555',
        logoColor: '#6366F1',
    },
];

// =============================================================================
// Sub-Components
// =============================================================================

interface FiltersState {
    search: string;
    location: string;
    workType: WorkType;
    employmentTypes: EmploymentType[];
    minMatchScore: number;
}

interface FilterPanelProps {
    filters: FiltersState;
    onFiltersChange: (filters: FiltersState) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
    const handleReset = () => {
        onFiltersChange({
            search: '',
            location: '',
            workType: 'all',
            employmentTypes: [],
            minMatchScore: 0,
        });
    };

    return (
        <Card className="h-fit sticky top-5">
            <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Filters</h3>
                </div>

                {/* Search */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Job title or company"
                            value={filters.search}
                            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="City or state"
                            value={filters.location}
                            onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Work Type */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Work Type</Label>
                    <div className="space-y-2">
                        {(['all', 'remote', 'onsite'] as WorkType[]).map((type) => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="workType"
                                    checked={filters.workType === type}
                                    onChange={() => onFiltersChange({ ...filters, workType: type })}
                                    className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm">
                                    {type === 'all' ? 'All' : type === 'remote' ? 'Remote Only' : 'On-site Only'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Employment Type */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Employment Type</Label>
                    <div className="space-y-2">
                        {(['full-time', 'part-time', 'contract'] as EmploymentType[]).map((type) => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.employmentTypes.includes(type)}
                                    onChange={() => {
                                        const current = filters.employmentTypes;
                                        const updated = current.includes(type)
                                            ? current.filter(t => t !== type)
                                            : [...current, type];
                                        onFiltersChange({ ...filters, employmentTypes: updated });
                                    }}
                                    className="w-4 h-4 rounded text-primary"
                                />
                                <span className="text-sm capitalize">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Match Score Slider */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Minimum Match Score</Label>
                    <div className="space-y-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.minMatchScore}
                            onChange={(e) => onFiltersChange({ ...filters, minMatchScore: Number(e.target.value) })}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="text-primary font-medium">{filters.minMatchScore}%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                {/* Reset Button */}
                <Button variant="outline" className="w-full" onClick={handleReset}>
                    Reset Filters
                </Button>
            </CardContent>
        </Card>
    );
};

// Match Score Badge Component
const MatchScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const getColor = () => {
        if (score >= 90) return 'border-green-500 text-green-600';
        if (score >= 80) return 'border-blue-500 text-blue-600';
        if (score >= 70) return 'border-yellow-500 text-yellow-600';
        return 'border-gray-400 text-gray-500';
    };

    return (
        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 ${getColor()}`}>
            <span className="text-xs text-muted-foreground">Match</span>
            <span className="text-xl font-bold">{score}%</span>
        </div>
    );
};

// Status Badge Component
interface JobStatusBadgeProps {
    status: JobStatus;
    isAutoApplyEnabled?: boolean;
}

const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, isAutoApplyEnabled = false }) => {
    const config: Record<JobStatus, { label: string; className: string; icon?: React.ReactNode }> = {
        new: { label: 'New', className: 'bg-gray-100 text-gray-700' },
        applied: { 
            label: 'Applied', 
            className: 'bg-green-100 text-green-700',
            icon: <Check className="h-3 w-3 mr-1" />
        },
        interviewing: { 
            label: 'Interviewing', 
            className: 'bg-purple-100 text-purple-700',
            icon: <MessageSquare className="h-3 w-3 mr-1" />
        },
        offer: { label: 'Offer', className: 'bg-blue-100 text-blue-700' },
        rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
        skipped: { label: 'Skipped', className: 'bg-gray-100 text-gray-500' },
        applying: { 
            label: 'Applying...', 
            className: 'bg-blue-100 text-blue-700 animate-pulse',
            icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        },
        queued: { 
            label: 'Queued', 
            className: 'bg-yellow-100 text-yellow-700'
        },
    };

    const { label, className, icon } = config[status];

    if (status === 'new') return null;
    // Only show skipped badge when auto-apply is enabled
    if (status === 'skipped' && !isAutoApplyEnabled) return null;

    return (
        <Badge variant="secondary" className={`${className} font-medium flex items-center`}>
            {icon}
            {label}
        </Badge>
    );
};

// Campaign Status Banner Component
interface CampaignStatusBannerProps {
    isRunning: boolean;
    isPaused: boolean;
    pauseReason: PauseReason;
    appliedCount: number;
    totalCount: number;
    currentJobTitle?: string;
    currentJobId?: number | null;
    dryRun: boolean;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onDryRunChange: (dryRun: boolean) => void;
}

// Mock AI decision data for preview
interface AIDecision {
    ruleBreakdown: { ruleName: string; passed: boolean; reason: string }[];
    matchedSkills: string[];
    missingSkills: string[];
}

const MOCK_AI_DECISION: AIDecision = {
    ruleBreakdown: [
        { ruleName: 'Excluded Technology', passed: true, reason: 'Tech stack compatible' },
        { ruleName: 'Remote Policy', passed: true, reason: 'Remote position' },
        { ruleName: 'Seniority Match', passed: true, reason: 'Seniority level acceptable' },
    ],
    matchedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    missingSkills: ['Go'],
};

// Mock screenshot SVG for browser preview (simulates ATS form)
const MOCK_SCREENSHOT_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjZTVlN2ViIi8+PHJlY3QgeD0iMzAiIHk9IjMwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwIiByeD0iMiIgZmlsbD0iI2U1ZTdlYiIvPjxyZWN0IHg9IjIwIiB5PSI3MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSIxNjAiIHJ4PSI0IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNlNWU3ZWIiLz48cmVjdCB4PSIzMCIgeT0iODAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTIiIHJ4PSIyIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMzAiIHk9IjEwMCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyNCIgcng9IjQiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2U1ZTdlYiIvPjxyZWN0IHg9IjMwIiB5PSIxMzQiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTIiIHJ4PSIyIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMzAiIHk9IjE1NCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyNCIgcng9IjQiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2U1ZTdlYiIvPjxyZWN0IHg9IjMwIiB5PSIxODgiIHdpZHRoPSIxNTAiIGhlaWdodD0iMzIiIHJ4PSI0IiBmaWxsPSIjMjU2M2ViIi8+PHRleHQgeD0iMTA1IiB5PSIyMDkiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFwcGx5PC90ZXh0PjxyZWN0IHg9IjIxMCIgeT0iNzAiIHdpZHRoPSIxNzAiIGhlaWdodD0iMTYwIiByeD0iNCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjZTVlN2ViIi8+PHJlY3QgeD0iMjIwIiB5PSI4MCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxMiIgcng9IjIiIGZpbGw9IiNlNWU3ZWIiLz48cmVjdCB4PSIyMjAiIHk9IjEwMCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSI0MCIgcng9IjQiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2U1ZTdlYiIvPjxyZWN0IHg9IjIyMCIgeT0iMTUwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEyIiByeD0iMiIgZmlsbD0iI2U1ZTdlYiIvPjxyZWN0IHg9IjIyMCIgeT0iMTcwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjZTVlN2ViIi8+PC9zdmc+';

const CampaignStatusBanner: React.FC<CampaignStatusBannerProps> = ({ 
    isRunning,
    isPaused,
    pauseReason,
    appliedCount, 
    totalCount,
    currentJobTitle,
    currentJobId,
    dryRun,
    onStart,
    onPause,
    onResume,
    onDryRunChange
}) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);
    const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
    const needsHumanAction = pauseReason === 'captcha';

    // Fetch AI decision data when current job changes
    useEffect(() => {
        const fetchAIDecision = async () => {
            if (!currentJobId) {
                setAiDecision(null);
                return;
            }
            
            if (isDevMode()) {
                setAiDecision(MOCK_AI_DECISION);
                return;
            }

            try {
                const res = await fetch(`http://localhost:3001/api/audit/${currentJobId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Parse audit data into AI decision format
                    const filterEntry = data.find((e: any) => e.actionType === 'FILTER');
                    if (filterEntry?.details) {
                        setAiDecision({
                            ruleBreakdown: filterEntry.details.ruleBreakdown || [],
                            matchedSkills: filterEntry.details.matchedSkills || [],
                            missingSkills: filterEntry.details.missingSkills || [],
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch AI decision:', err);
            }
        };
        
        fetchAIDecision();
    }, [currentJobId]);

    // Fetch screenshot when processing
    useEffect(() => {
        if (currentJobId && (isRunning || isPaused)) {
            if (isDevMode()) {
                setScreenshotUrl(MOCK_SCREENSHOT_URL);
                return;
            }
            setScreenshotUrl(`http://localhost:3001/screenshots/job_${currentJobId}_filled.png`);
        } else {
            setScreenshotUrl(null);
        }
    }, [currentJobId, isRunning, isPaused]);
    
    return (
        <div className="space-y-2 mb-6">
            <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${
                needsHumanAction
                    ? 'bg-amber-50 border border-amber-300'
                    : isRunning && !isPaused
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50 border border-gray-200'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                        needsHumanAction 
                            ? 'bg-amber-500'
                            : isRunning && !isPaused 
                                ? 'bg-green-500 animate-pulse' 
                                : 'bg-gray-400'
                    }`} />
                    <div>
                        <span className="font-medium text-foreground">
                            {needsHumanAction 
                                ? 'Human Action Required'
                                : isRunning && !isPaused 
                                    ? 'Auto Apply Running' 
                                    : isPaused 
                                        ? 'Auto Apply Paused'
                                        : 'Auto Apply Ready'}
                        </span>
                        {currentJobTitle && isRunning && !isPaused && (
                            <span className="text-muted-foreground text-sm ml-2">
                                • Processing: {currentJobTitle}
                            </span>
                        )}
                    </div>
                    <span className="text-muted-foreground text-sm">
                        {appliedCount}/{totalCount} completed
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {needsHumanAction && (
                        <div className="flex items-center gap-1.5 text-amber-700 text-sm mr-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>CAPTCHA detected</span>
                        </div>
                    )}
                    
                    {/* Auto Apply Preview Popover */}
                    <Popover open={previewOpen} onOpenChange={setPreviewOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Preview
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[600px] p-0" align="end" sideOffset={8}>
                            <div className="border-b p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Auto Apply Preview</span>
                                    </div>
                                    <Badge variant={dryRun ? 'secondary' : 'destructive'} className="text-xs">
                                        {dryRun ? 'Preview Only' : 'Live'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-3">
                                {/* Left Column - Browser Preview */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                        Browser Preview
                                    </p>
                                    <div className="rounded-lg border bg-muted/30 overflow-hidden aspect-[4/3] flex items-center justify-center">
                                        {screenshotUrl ? (
                                            <img 
                                                src={screenshotUrl} 
                                                alt="ATS Form Preview" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Monitor className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                                <p className="text-xs text-muted-foreground">
                                                    {isRunning ? 'Loading preview...' : 'No active form'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {currentJobTitle && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {currentJobTitle}
                                        </p>
                                    )}
                                </div>

                                {/* Right Column - AI Decisions */}
                                <div className="space-y-3">
                                    {/* Current Status */}
                                    {!currentJobTitle && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            {totalCount > 0 ? 'Ready to process' : 'No jobs in queue'}
                                        </p>
                                    )}

                                    {/* AI Decision Summary */}
                                    {aiDecision && currentJobTitle && (
                                        <>
                                            {/* Filter Rules */}
                                            {aiDecision.ruleBreakdown.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                                                        Filter Rules
                                                    </p>
                                                    <div className="space-y-1">
                                                        {aiDecision.ruleBreakdown.map((rule, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                                {rule.passed ? (
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                                ) : (
                                                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                                )}
                                                                <span className={rule.passed ? '' : 'text-muted-foreground'}>
                                                                    {rule.ruleName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Skills Match */}
                                            {(aiDecision.matchedSkills.length > 0 || aiDecision.missingSkills.length > 0) && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                                                        Skills Analysis
                                                    </p>
                                                    {aiDecision.matchedSkills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                            {aiDecision.matchedSkills.slice(0, 4).map((skill, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                            {aiDecision.matchedSkills.length > 4 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    +{aiDecision.matchedSkills.length - 4}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                    {aiDecision.missingSkills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {aiDecision.missingSkills.slice(0, 3).map((skill, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Preview Mode Toggle */}
                                    <div className="pt-2 border-t space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="preview-mode-toggle" className="text-sm cursor-pointer">
                                                Preview Mode
                                            </Label>
                                            <Switch
                                                id="preview-mode-toggle"
                                                checked={dryRun}
                                                onCheckedChange={onDryRunChange}
                                                disabled={isRunning}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {dryRun 
                                                ? 'Forms filled without submitting' 
                                                : '⚠ Applications will be submitted'}
                                        </p>
                                    </div>

                                    {/* Resume button when paused */}
                                    {isPaused && (
                                        <Button 
                                            onClick={() => { onResume(); setPreviewOpen(false); }}
                                            className="w-full gap-2"
                                            size="sm"
                                        >
                                            <Play className="h-4 w-4" />
                                            {pauseReason === 'captcha' ? 'Resume After CAPTCHA' : 'Resume'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {!isRunning && !isPaused ? (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onStart}
                            className="gap-2"
                        >
                            <Play className="h-4 w-4" />
                            Start Campaign
                        </Button>
                    ) : isPaused ? (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onResume}
                            className="gap-2"
                        >
                            <Play className="h-4 w-4" />
                            Resume
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPause}
                            className="gap-2"
                        >
                            <Pause className="h-4 w-4" />
                            Pause
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Job Card Component
interface JobCardProps {
    job: JobListing;
    onApply: (job: JobListing) => void;
    onSkip: (job: JobListing) => void;
    onClick: (job: JobListing) => void;
    isSelected?: boolean;
    isAutoApplyEnabled?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onSkip, onClick, isSelected = false, isAutoApplyEnabled = false }) => {
    const formatSalary = (min: number, max: number) => {
        return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
    };

    return (
        <Card 
            className={`hover:shadow-md transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onClick(job)}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    {/* Left: Job Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                                {job.title}
                            </h3>
                            <JobStatusBadge status={job.status} isAutoApplyEnabled={isAutoApplyEnabled} />
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Building2 className="h-4 w-4" />
                            <span className="text-sm">{job.company}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {job.location}
                                </span>
                                {job.isRemote && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                        Remote
                                    </Badge>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <DollarSign className="h-4 w-4" />
                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4" />
                                    <span className="capitalize">{job.employmentType}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {job.postedAt}
                                </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {job.description.split('\n')[0]}
                            </p>

                            {job.status === 'applied' && job.appliedAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Applied {job.appliedAt}
                                </p>
                            )}
                    </div>

                    {/* Right: Match Score & Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <MatchScoreBadge score={job.matchScore} />
                        
                        {job.status === 'new' && (
                            <div className="flex items-center gap-2">
                                {isAutoApplyEnabled && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSkip(job);
                                        }}
                                    >
                                        Skip
                                    </Button>
                                )}
                                <Button 
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApply(job);
                                    }}
                                >
                                    Quick Apply
                                </Button>
                            </div>
                        )}
                        {job.status === 'applying' && (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Applying...</span>
                            </div>
                        )}
                        {job.status === 'queued' && (
                            <span className="text-sm text-muted-foreground">Queued</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Job Detail Drawer Component (Right-side panel)
interface JobDetailDrawerProps {
    job: JobListing;
    onClose: () => void;
    onApply: (job: JobListing) => void;
    onSkip: (job: JobListing) => void;
    isAutoApplyEnabled?: boolean;
}

const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({ job, onClose, onApply, onSkip, isAutoApplyEnabled = false }) => {
    const formatSalary = (min: number, max: number) => {
        return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
    };

    // Get company initials for logo
    const getCompanyInitials = (company: string) => {
        return company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[480px] bg-background h-full flex flex-col z-50 shadow-xl border-l">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Company Logo */}
                        {job.logoUrl ? (
                            <img 
                                src={job.logoUrl}
                                alt={`${job.company} logo`}
                                className="w-12 h-12 rounded-xl object-contain shrink-0 bg-muted"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-sm ${job.logoUrl ? 'hidden' : ''}`}
                            style={{ backgroundColor: job.logoColor || '#6B7280' }}
                        >
                            {getCompanyInitials(job.company)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-semibold mb-1 truncate">
                                {job.title}
                            </h2>
                            <p className="text-muted-foreground">
                                at <span className="font-medium text-foreground">{job.company}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <MatchScoreBadge score={job.matchScore} />
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                    </span>
                    {job.isRemote && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Remote
                        </Badge>
                    )}
                    <span className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        <span className="capitalize">{job.employmentType}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {job.postedAt}
                    </span>
                    <JobStatusBadge status={job.status} isAutoApplyEnabled={isAutoApplyEnabled} />
                </div>

                {/* Job URL Link */}
                {job.jobUrl && (
                    <a 
                        href={job.jobUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View Original Job Posting
                    </a>
                )}
            </div>

            {/* Content */}
            <Tabs defaultValue="description" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-6">
                    <TabsTrigger 
                        value="description" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-4"
                    >
                        Job Description
                    </TabsTrigger>
                    <TabsTrigger 
                        value="company"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-4"
                    >
                        Company Info
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="description" className="m-0 p-6">
                        <div className="prose prose-sm max-w-none">
                            <h3 className="text-lg font-semibold mb-4">About the Role</h3>
                            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="company" className="m-0 p-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">About {job.company}</h3>
                            <p className="text-muted-foreground">
                                Company information will be displayed here. This could include company size, 
                                industry, founding date, and other relevant details.
                            </p>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Footer Actions */}
            {job.status === 'new' && (
                <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
                    {isAutoApplyEnabled && (
                        <Button variant="outline" onClick={() => onSkip(job)}>
                            Skip
                        </Button>
                    )}
                    <Button onClick={() => onApply(job)}>
                        Quick Apply
                    </Button>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

interface JobBoardPageProps {
    onNavigate?: (view: string, data?: any) => void;
}

/**
 * Map API job response to frontend JobListing format
 */
function mapApiJobToListing(apiJob: any): JobListing {
    // Calculate relative time for postedAt
    const postedDate = apiJob.posted_at ? new Date(apiJob.posted_at) : new Date(apiJob.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    let postedAt = 'Just now';
    if (diffDays === 1) postedAt = '1 day ago';
    else if (diffDays > 1 && diffDays < 7) postedAt = `${diffDays} days ago`;
    else if (diffDays >= 7 && diffDays < 14) postedAt = '1 week ago';
    else if (diffDays >= 14) postedAt = `${Math.floor(diffDays / 7)} weeks ago`;

    // Generate a consistent color based on company name
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4', '#6366F1'];
    const colorIndex = apiJob.company.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;

    return {
        id: apiJob.id,
        title: apiJob.title,
        company: apiJob.company,
        location: apiJob.location || 'Location not specified',
        isRemote: apiJob.is_remote || false,
        salaryMin: apiJob.salary_min || 0,
        salaryMax: apiJob.salary_max || 0,
        employmentType: (apiJob.employment_type as EmploymentType) || 'full-time',
        postedAt,
        description: apiJob.description || 'No description available.',
        matchScore: apiJob.matchScore || 50,
        status: 'new' as JobStatus,
        logoUrl: apiJob.logo_url || undefined,
        logoColor: colors[colorIndex],
        jobUrl: apiJob.job_url,
    };
}

const JobBoardPage: React.FC<JobBoardPageProps> = ({ onNavigate: _onNavigate }) => {
    const { session } = useAuth();
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
    const [dryRun, setDryRun] = useState(true);
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
    const [filters, setFilters] = useState<FiltersState>({
        search: '',
        location: '',
        workType: 'all',
        employmentTypes: [],
        minMatchScore: 0,
    });

    // Fetch jobs from the API
    const fetchJobs = useCallback(async () => {
        // Use mock data in dev mode
        if (isDevMode()) {
            console.log('%c[JobBoard] Dev mode active - using mock data', 'color: #10B981;');
            setJobs(DEV_MOCK_JOBS);
            setLoading(false);
            return;
        }

        if (!session?.access_token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Build query params from filters
            const params = new URLSearchParams();
            if (filters.search) params.set('search', filters.search);
            if (filters.location) params.set('location', filters.location);
            if (filters.workType === 'remote') params.set('isRemote', 'true');
            if (filters.employmentTypes.length > 0) {
                params.set('employmentType', filters.employmentTypes[0]); // API supports single type for now
            }
            params.set('limit', '50');

            const res = await fetch(`http://localhost:3001/api/jobs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch jobs: ${res.status}`);
            }

            const data = await res.json();
            const mappedJobs = (data.jobs || []).map(mapApiJobToListing);
            
            // Apply client-side filters that API doesn't support
            let filteredJobs = mappedJobs;
            
            // Filter by work type (onsite)
            if (filters.workType === 'onsite') {
                filteredJobs = filteredJobs.filter((j: JobListing) => !j.isRemote);
            }
            
            // Filter by min match score
            if (filters.minMatchScore > 0) {
                filteredJobs = filteredJobs.filter((j: JobListing) => j.matchScore >= filters.minMatchScore);
            }

            setJobs(filteredJobs);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
            // Fall back to mock data on error
            setJobs(MOCK_JOBS);
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, filters.search, filters.location, filters.workType, filters.employmentTypes, filters.minMatchScore]);

    // Fetch jobs on mount and when filters change (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchJobs();
        }, 300); // Debounce filter changes

        return () => clearTimeout(timeoutId);
    }, [fetchJobs]);

    // Helper to update job statuses based on queue state
    const updateJobStatuses = useCallback((status: QueueStatus) => {
        setJobs(prev => prev.map(job => {
            const jobIdNum = parseInt(job.id, 10);
            if (status.currentJobId === jobIdNum) {
                return { ...job, status: 'applying' as JobStatus };
            }
            if (status.queuedJobIds.includes(jobIdNum)) {
                return { ...job, status: 'queued' as JobStatus };
            }
            if (status.completedJobIds.includes(jobIdNum)) {
                return { ...job, status: 'applied' as JobStatus, appliedAt: 'Just now' };
            }
            // Reset to 'new' if not in any queue state and was applying/queued
            if ((job.status === 'applying' || job.status === 'queued') && 
                !status.isProcessing) {
                return { ...job, status: 'new' as JobStatus };
            }
            return job;
        }));
    }, []);

    // Fetch queue status
    const fetchQueueStatus = useCallback(async () => {
        // Use mock queue in dev mode
        if (isDevMode()) {
            const status = getMockQueueStatus();
            setQueueStatus(status);
            updateJobStatuses(status);
            return;
        }

        // Production: fetch from backend
        try {
            const res = await fetch('http://localhost:3001/api/queue/status');
            if (res.ok) {
                const status: QueueStatus = await res.json();
                setQueueStatus(status);
                updateJobStatuses(status);
            }
        } catch (error) {
            console.error('Failed to fetch queue status:', error);
        }
    }, [updateJobStatuses]);

    // Poll queue status when campaign is running
    useEffect(() => {
        if (queueStatus.isProcessing || queueStatus.isPaused) {
            const interval = setInterval(fetchQueueStatus, 2000);
            return () => clearInterval(interval);
        }
    }, [queueStatus.isProcessing, queueStatus.isPaused, fetchQueueStatus]);

    // Count applied jobs
    const appliedCount = jobs.filter(j => j.status === 'applied').length;
    const completedCount = queueStatus.completedJobIds.length;
    const totalEligible = jobs.filter(j => ['new', 'applying', 'queued', 'applied'].includes(j.status)).length;

    // Get current job title
    const currentJobTitle = queueStatus.currentJobId 
        ? jobs.find(j => parseInt(j.id, 10) === queueStatus.currentJobId)?.title
        : undefined;

    // Filter jobs based on current filters - auto-filter out applied jobs from main list
    const filteredJobs = jobs.filter(job => {
        // Auto-filter: hide applied jobs from the job list
        if (job.status === 'applied') return false;

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
                job.title.toLowerCase().includes(searchLower) ||
                job.company.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Location filter
        if (filters.location) {
            const locationLower = filters.location.toLowerCase();
            if (!job.location.toLowerCase().includes(locationLower)) return false;
        }

        // Work type filter
        if (filters.workType === 'remote' && !job.isRemote) return false;
        if (filters.workType === 'onsite' && job.isRemote) return false;

        // Employment type filter
        if (filters.employmentTypes.length > 0) {
            if (!filters.employmentTypes.includes(job.employmentType)) return false;
        }

        // Match score filter
        if (job.matchScore < filters.minMatchScore) return false;

        return true;
    });

    const handleApply = (job: JobListing) => {
        setJobs(prev => prev.map(j => 
            j.id === job.id 
                ? { ...j, status: 'applied' as JobStatus, appliedAt: 'Just now' }
                : j
        ));
        setSelectedJob(null);
    };

    const handleSkip = (job: JobListing) => {
        setJobs(prev => prev.map(j => 
            j.id === job.id 
                ? { ...j, status: 'skipped' as JobStatus }
                : j
        ));
        setSelectedJob(null);
    };

    const handleStartCampaign = async () => {
        try {
            const eligibleJobs = jobs.filter(j => j.status === 'new');
            const jobIds = eligibleJobs.map(j => parseInt(j.id, 10));

            // Use mock campaign in dev mode
            if (isDevMode()) {
                console.log('[DevMode] Starting simulated auto-apply campaign...');
                const status = await startMockCampaign(jobIds, (newStatus) => {
                    setQueueStatus(newStatus);
                    updateJobStatuses(newStatus);
                });
                setQueueStatus(status);
                updateJobStatuses(status);
                return;
            }

            // Production: call backend
            await fetch('http://localhost:3001/api/queue/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    limit: eligibleJobs.length, 
                    dryRun: dryRun 
                }),
            });
            await fetchQueueStatus();
        } catch (error) {
            console.error('Failed to start campaign:', error);
        }
    };

    const handlePauseCampaign = async () => {
        try {
            // Use mock pause in dev mode
            if (isDevMode()) {
                const status = await stopMockCampaign();
                setQueueStatus(status);
                updateJobStatuses(status);
                return;
            }

            // Production: call backend
            await fetch('http://localhost:3001/api/queue/stop', { method: 'POST' });
            await fetchQueueStatus();
        } catch (error) {
            console.error('Failed to pause campaign:', error);
        }
    };

    const handleResumeCampaign = async () => {
        try {
            // Use mock resume in dev mode
            if (isDevMode()) {
                const status = await resumeMockCampaign();
                setQueueStatus(status);
                updateJobStatuses(status);
                return;
            }

            // Production: call backend
            await fetch('http://localhost:3001/api/queue/resume', { method: 'POST' });
            await fetchQueueStatus();
        } catch (error) {
            console.error('Failed to resume campaign:', error);
        }
    };

    const isAutoApplyEnabled = queueStatus.isProcessing || queueStatus.isPaused;

    return (
        <div className="flex h-full">
            {/* Left: Filters */}
            <div className="w-[300px] shrink-0 hidden lg:block pr-6">
                <FilterPanel filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Center: Job Listings */}
            <div className="flex-1 min-w-0 overflow-y-auto pr-6">
                {/* Campaign Status Banner */}
                <CampaignStatusBanner
                    isRunning={queueStatus.isProcessing}
                    isPaused={queueStatus.isPaused}
                    pauseReason={queueStatus.pauseReason}
                    appliedCount={completedCount}
                    totalCount={queueStatus.totalCount || totalEligible}
                    currentJobTitle={currentJobTitle}
                    currentJobId={queueStatus.currentJobId}
                    dryRun={dryRun}
                    onStart={handleStartCampaign}
                    onPause={handlePauseCampaign}
                    onResume={handleResumeCampaign}
                    onDryRunChange={setDryRun}
                />

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-muted-foreground">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading jobs...
                            </span>
                        ) : (
                            <>
                                Showing <span className="font-medium text-foreground">{filteredJobs.length}</span> jobs
                                {appliedCount > 0 && (
                                    <span className="ml-2 text-green-600">• {appliedCount} applied</span>
                                )}
                            </>
                        )}
                    </p>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchJobs}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <Card className="mb-6 border-amber-200 bg-amber-50">
                        <CardContent className="p-4 flex items-center gap-3 text-amber-800">
                            <AlertTriangle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Failed to load jobs</p>
                                <p className="text-sm">{error}. Showing cached data.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchJobs} className="ml-auto">
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {loading && jobs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Loading jobs from catalog...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredJobs.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                            <p className="text-muted-foreground mb-4">
                                {jobs.length === 0 
                                    ? 'The job catalog is empty. Jobs are updated periodically via automated scraping.'
                                    : 'Try adjusting your filters to see more results.'}
                            </p>
                            {jobs.length > 0 && (
                                <Button variant="outline" onClick={() => setFilters({
                                    search: '',
                                    location: '',
                                    workType: 'all',
                                    employmentTypes: [],
                                    minMatchScore: 0,
                                })}>
                                    Clear Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Job Cards */}
                {!loading && filteredJobs.length > 0 && (
                    <div className="space-y-4">
                        {filteredJobs.map(job => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onApply={handleApply}
                                onSkip={handleSkip}
                                onClick={setSelectedJob}
                                isSelected={selectedJob?.id === job.id}
                                isAutoApplyEnabled={isAutoApplyEnabled}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Job Detail Drawer */}
            {selectedJob && (
                <JobDetailDrawer
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onApply={handleApply}
                    onSkip={handleSkip}
                    isAutoApplyEnabled={isAutoApplyEnabled}
                />
            )}
        </div>
    );
};

export default JobBoardPage;
