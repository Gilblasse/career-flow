import { Send, CheckCircle, Monitor, Star } from 'lucide-react';
import { StatCard } from '@/components/shared';
import type { ReactNode } from 'react';

interface StatItem {
    title: string;
    value: string;
    change: string;
    icon: ReactNode;
    iconColor: string;
    iconBgColor: string;
}

const OverviewStats: React.FC = () => {
    const stats: StatItem[] = [
        {
            title: 'Total Apply',
            value: '24',
            change: '+10% from last week',
            icon: <Send className="h-5 w-5" />,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'In Review',
            value: '24',
            change: '+10% from last week',
            icon: <CheckCircle className="h-5 w-5" />,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100',
        },
        {
            title: 'Interview',
            value: '24',
            change: '+10% from last week',
            icon: <Monitor className="h-5 w-5" />,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Offers',
            value: '0',
            change: '-90% from last week',
            icon: <Star className="h-5 w-5" />,
            iconColor: 'text-amber-500',
            iconBgColor: 'bg-amber-100',
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
                    />
                ))}
            </div>
        </div>
    );
};

export default OverviewStats;
