import { PenTool, Briefcase, Mail, Settings, Edit2, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApplicationsRealtime } from '@/lib/realtime';
import { useAuth } from '@/components/Auth';
import { useMemo } from 'react';

interface CalendarEvent {
    title: string;
    description: string;
    date: string;
    color: string;
}

interface ActivityItem {
    icon: React.ReactNode;
    message: string;
    time: string;
    iconBgClass: string;
    iconTextClass: string;
}

const RightPanel: React.FC = () => {
    const { user } = useAuth();
    const { applications } = useApplicationsRealtime(user?.id);

    // Generate calendar events from applications (simulating interviews for completed apps)
    const { todayEvents, upcomingEvents } = useMemo(() => {
        const today: CalendarEvent[] = [];
        const upcoming: CalendarEvent[] = [];
        
        // Get completed applications as potential "interview" candidates
        const completedApps = applications
            .filter(app => app.queue_status === 'completed')
            .slice(0, 3);
        
        completedApps.forEach((app, idx) => {
            const colors = ['bg-blue-500', 'bg-amber-400', 'bg-emerald-500'];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (idx + 1) * 2);
            
            const event: CalendarEvent = {
                title: `Follow up: ${app.company}`,
                description: app.title,
                date: futureDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
                color: colors[idx % colors.length],
            };
            
            if (idx === 0) {
                today.push(event);
            } else {
                upcoming.push(event);
            }
        });

        // Default placeholder if no completed apps
        if (today.length === 0 && upcoming.length === 0) {
            today.push({
                title: 'No upcoming events',
                description: 'Apply to jobs to see follow-ups here',
                date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
                color: 'bg-gray-300',
            });
        }

        return { todayEvents: today, upcomingEvents: upcoming };
    }, [applications]);

    // Generate recent activity from applications
    const activities: ActivityItem[] = useMemo(() => {
        const recentApps = [...applications]
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 4);

        return recentApps.map(app => {
            const time = new Date(app.updated_at || app.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            });

            switch (app.queue_status) {
                case 'completed':
                    return {
                        icon: <CheckCircle className="h-4 w-4" />,
                        message: `Applied to ${app.company} - ${app.title}`,
                        time,
                        iconBgClass: 'bg-emerald-100',
                        iconTextClass: 'text-emerald-600',
                    };
                case 'failed':
                    return {
                        icon: <XCircle className="h-4 w-4" />,
                        message: `Failed: ${app.company} - ${app.last_error || 'Error'}`,
                        time,
                        iconBgClass: 'bg-red-100',
                        iconTextClass: 'text-red-600',
                    };
                case 'processing':
                    return {
                        icon: <Send className="h-4 w-4" />,
                        message: `Processing: ${app.company}`,
                        time,
                        iconBgClass: 'bg-blue-100',
                        iconTextClass: 'text-blue-600',
                    };
                case 'pending':
                default:
                    return {
                        icon: <Clock className="h-4 w-4" />,
                        message: `Queued: ${app.company} - ${app.title}`,
                        time,
                        iconBgClass: 'bg-amber-100',
                        iconTextClass: 'text-amber-600',
                    };
            }
        });
    }, [applications]);

    // Calculate profile completion based on what data exists
    const profileCompletion = useMemo(() => {
        // Simplified - in a real app, this would check the actual profile data
        const hasApplications = applications.length > 0;
        return hasApplications ? 70 : 30;
    }, [applications]);

    return (
        <div className="flex flex-col gap-6">
            {/* Complete Profile Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Complete Profile</CardTitle>
                        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1 h-auto p-0">
                            Edit <Edit2 className="h-3 w-3" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h4 className="font-semibold">Add Portfolio and skills to attract more employer</h4>

                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">{profileCompletion}% profile completed</div>
                        <div className="w-full h-1.5 bg-primary/10 rounded-full">
                            <div className={`h-full bg-primary rounded-full`} style={{ width: `${profileCompletion}%` }} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar / Upcoming Interviews */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Calendar</CardTitle>
                        <Button variant="link" size="sm" className="text-muted-foreground text-xs h-auto p-0">
                            See all &gt;
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* TODAY Section */}
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-4">TODAY</div>
                        {todayEvents.map((event, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className={`w-0.5 h-10 ${event.color} rounded-full`} />
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">{event.title}</div>
                                    <div className="text-xs text-muted-foreground">{event.description}</div>
                                </div>
                                <div className="text-xs font-semibold">{event.date}</div>
                            </div>
                        ))}
                    </div>

                    {/* UPCOMING Section */}
                    {upcomingEvents.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-4">UPCOMING</div>
                            <div className="space-y-5">
                                {upcomingEvents.map((event, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className={`w-0.5 h-10 ${event.color} rounded-full`} />
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold">{event.title}</div>
                                            <div className="text-xs text-muted-foreground">{event.description}</div>
                                        </div>
                                        <div className="text-xs font-semibold">{event.date}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm flex-1">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Recent Activity</CardTitle>
                        <Button variant="link" size="sm" className="text-muted-foreground text-xs h-auto p-0">
                            See all &gt;
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {activities.length > 0 ? (
                        activities.map((activity, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <div className={`p-2 rounded-lg ${activity.iconBgClass} ${activity.iconTextClass}`}>
                                    {activity.icon}
                                </div>
                                <div className="flex-1 text-sm font-medium">{activity.message}</div>
                                <span className="text-xs text-muted-foreground">{activity.time}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            No recent activity
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RightPanel;
