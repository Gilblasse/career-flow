import { Send, Clock, Monitor, XCircle } from 'lucide-react';
import { StatCard } from '@/components/shared';
import type { ReactNode } from 'react';

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
    const stats: StatItem[] = [
        {
            title: 'Total Applied',
            value: '24',
            change: '+10% from last week',
            icon: <Send className="h-5 w-5" />,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'In Queue',
            value: '8',
            change: '+5% from last week',
            icon: <Clock className="h-5 w-5" />,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100',
        },
        {
            title: 'Interview',
            value: '6',
            change: '+15% from last week',
            icon: <Monitor className="h-5 w-5" />,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Rejected',
            value: '4',
            change: '-20% from last week',
            icon: <XCircle className="h-5 w-5" />,
            iconColor: 'text-red-500',
            iconBgColor: 'bg-red-100',
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="text-muted-foreground text-sm mb-2">Job application of this month</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat) => (
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
