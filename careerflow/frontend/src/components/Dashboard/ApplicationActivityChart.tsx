import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useApplicationsRealtime } from '@/lib/realtime';
import { useAuth } from '@/components/Auth';

interface ChartDataPoint {
    date: string;
    applications: number;
    responses: number;
}

const ApplicationActivityChart: React.FC = () => {
    const { user } = useAuth();
    const { applications } = useApplicationsRealtime(user?.id);

    // Generate chart data from real applications
    const { chartData, weeklyChange, maxValue } = useMemo(() => {
        // Get last 12 days for the chart
        const days: ChartDataPoint[] = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Count applications created on this date
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayApplications = applications.filter(app => {
                const appDate = new Date(app.created_at);
                return appDate >= dayStart && appDate <= dayEnd;
            }).length;
            
            // Count completed applications (simulating "responses")
            const dayResponses = applications.filter(app => {
                const appDate = new Date(app.completed_at || app.updated_at || app.created_at);
                return appDate >= dayStart && appDate <= dayEnd && app.queue_status === 'completed';
            }).length;
            
            days.push({
                date: dateStr,
                applications: dayApplications,
                responses: dayResponses,
            });
        }

        // Calculate weekly change
        const thisWeek = days.slice(-7).reduce((sum, d) => sum + d.applications, 0);
        const lastWeek = days.slice(0, 5).reduce((sum, d) => sum + d.applications, 0);
        
        let change = 0;
        if (lastWeek > 0) {
            change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
        } else if (thisWeek > 0) {
            change = 100;
        }

        // Find max value for Y-axis
        const max = Math.max(
            ...days.map(d => Math.max(d.applications, d.responses)),
            4 // Minimum max value
        );

        return { chartData: days, weeklyChange: change, maxValue: Math.ceil(max * 1.2) };
    }, [applications]);

    // Determine trend icon and color
    const TrendIcon = weeklyChange > 0 ? TrendingUp : weeklyChange < 0 ? TrendingDown : Minus;
    const trendColor = weeklyChange > 0 
        ? 'bg-emerald-100 text-emerald-700' 
        : weeklyChange < 0 
            ? 'bg-red-100 text-red-700' 
            : 'bg-gray-100 text-gray-700';

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="text-lg font-semibold">Application Activity</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Applications sent and responses received over time
                        </p>
                    </div>
                    <Badge className={`${trendColor} border-0 hover:${trendColor} w-fit flex items-center gap-1`}>
                        <TrendIcon className="h-3 w-3" />
                        {weeklyChange >= 0 ? '+' : ''}{weeklyChange}% this week
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-[200px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                                vertical={true}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, maxValue]}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={false}
                                tickCount={5}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                labelStyle={{ color: '#374151', fontWeight: 600 }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value: string) => (
                                    <span className="text-sm text-muted-foreground ml-1">{value}</span>
                                )}
                            />
                            <Line
                                type="monotone"
                                dataKey="applications"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                name="Applications Sent"
                            />
                            <Line
                                type="monotone"
                                dataKey="responses"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                name="Responses Received"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationActivityChart;
