import { PenTool, Briefcase, Mail, Settings, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    const todayEvents: CalendarEvent[] = [
        { title: 'Interview With Google', description: 'Description', date: '01 Sept', color: 'bg-blue-500' },
    ];

    const upcomingEvents: CalendarEvent[] = [
        { title: 'Interview With Google', description: 'time', date: '05 Sept', color: 'bg-amber-400' },
        { title: 'Interview With Google', description: 'time', date: '07 Sept', color: 'bg-emerald-500' },
    ];

    const activities: ActivityItem[] = [
        { icon: <Briefcase className="h-4 w-4" />, message: '4 new applications for UI/UX designer Post', time: '2:03 PM', iconBgClass: 'bg-blue-100', iconTextClass: 'text-blue-600' },
        { icon: <PenTool className="h-4 w-4" />, message: 'You have an upcoming interview', time: '2:03 PM', iconBgClass: 'bg-purple-100', iconTextClass: 'text-purple-600' },
        { icon: <Mail className="h-4 w-4" />, message: 'New Cover Letter has been created', time: '2:03 PM', iconBgClass: 'bg-emerald-100', iconTextClass: 'text-emerald-600' },
        { icon: <Settings className="h-4 w-4" />, message: 'You have changed the password', time: '2:03 PM', iconBgClass: 'bg-red-100', iconTextClass: 'text-red-600' },
    ];

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
                        <div className="text-xs text-muted-foreground">70% profile completed</div>
                        <div className="w-full h-1.5 bg-primary/10 rounded-full">
                            <div className="w-[70%] h-full bg-primary rounded-full" />
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
                    {activities.map((activity, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                            <div className={`p-2 rounded-lg ${activity.iconBgClass} ${activity.iconTextClass}`}>
                                {activity.icon}
                            </div>
                            <div className="flex-1 text-sm font-medium">{activity.message}</div>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default RightPanel;
