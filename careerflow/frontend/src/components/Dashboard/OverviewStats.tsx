import { Send, Clock, Monitor, XCircle, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/shared';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/Auth';
import { useApplicationStats } from '@/lib/realtime';

export type JobFilterType = 'Total Applied' | 'In Queue' | 'Interview' | 'Rejected';

interface StatItem {
    title: JobFilterType;
    value: string;
    change: string;
    icon: ReactNode;
    iconColor: string;
    iconBgColor: string;
}

interface OverviewStatsProps {
    selectedFilter: JobFilterType;
    onFilterChange: (filter: JobFilterType) => void;
}

const OverviewStats: React.FC<OverviewStatsProps> = ({ selectedFilter, onFilterChange }) => {
    const { user } = useAuth();
    const { stats, loading } = useApplicationStats(user?.id);

    // Calculate change text based on this week's data
    const getChangeText = (current: number, total: number): string => {
        if (total === 0) return 'No data yet';
        const percentage = Math.round((stats.thisWeek / total) * 100);
        return `${percentage}% this week`;
    };

    const statItems: StatItem[] = [
        {
            title: 'Total Applied',
            value: loading ? '-' : String(stats.completed),
            change: loading ? '' : getChangeText(stats.thisWeek, stats.total),
            icon: <Send className="h-5 w-5" />,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'In Queue',
            value: loading ? '-' : String(stats.pending),
            change: loading ? '' : `${stats.pending} pending`,
            icon: <Clock className="h-5 w-5" />,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100',
        },
        {
            title: 'Interview',
            value: loading ? '-' : '0', // TODO: Add interview tracking
            change: loading ? '' : 'Coming soon',
            icon: <Monitor className="h-5 w-5" />,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Rejected',
            value: loading ? '-' : String(stats.failed),
            change: loading ? '' : `${stats.failed} failed`,
            icon: <XCircle className="h-5 w-5" />,
            iconColor: 'text-red-500',
            iconBgColor: 'bg-red-100',
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="text-muted-foreground text-sm mb-2">
                {loading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading stats...
                    </span>
                ) : (
                    `Job applications: ${stats.total} total`
                )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statItems.map((stat) => (
                    <StatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        change={stat.change}
                        iconClassName={`${stat.iconColor} ${stat.iconBgColor}`}
                        onClick={() => onFilterChange(stat.title)}
                        isSelected={selectedFilter === stat.title}
                    />
                ))}
            </div>
        </div>
    );
};

export default OverviewStats;
