import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
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

// Mock data matching the screenshot curve shapes (Jan 20-31)
const activityData = [
    { date: 'Jan 20', applications: 3, responses: 0 },
    { date: 'Jan 21', applications: 5, responses: 1 },
    { date: 'Jan 22', applications: 4, responses: 1 },
    { date: 'Jan 23', applications: 6, responses: 2 },
    { date: 'Jan 24', applications: 7, responses: 1 },
    { date: 'Jan 25', applications: 4, responses: 3 },
    { date: 'Jan 26', applications: 7, responses: 2 },
    { date: 'Jan 27', applications: 8, responses: 1 },
    { date: 'Jan 28', applications: 6, responses: 2 },
    { date: 'Jan 29', applications: 5, responses: 3 },
    { date: 'Jan 30', applications: 7, responses: 1 },
    { date: 'Jan 31', applications: 8, responses: 2 },
];

const ApplicationActivityChart: React.FC = () => {
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
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100 w-fit flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +24% this week
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-[200px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={activityData}
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
                                domain={[0, 8]}
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
