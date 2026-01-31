import { useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Job {
    position: string;
    level: string;
    company: string;
    type: string;
    location: string;
    date: string;
}

const JobsTable: React.FC = () => {
    const tabs = ['Total Apply', 'Review Phase', 'Interview', 'Total Reject'];
    const [activeTab, setActiveTab] = useState('Total Apply');

    const jobs: Job[] = [
        { position: 'Product Designer', level: 'Senior Level', company: 'Google', type: 'On-Site', location: 'Berlin', date: '02 Sep 23' },
        { position: 'User Interface Designer', level: 'Senior Level', company: 'Apple', type: 'Remote', location: 'Frankfurt', date: '15 Aug 23' },
        { position: 'UX/UI designer', level: 'Mid Level', company: 'Microsoft', type: 'Flexible', location: 'Hamburg', date: '01 Sep 23' },
        { position: 'UX/UI designer', level: 'Senior Level', company: 'Tesla', type: 'On-Site', location: 'Munich', date: '01 Aug 23' },
    ];

    return (
        <Card className="border-0 shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">My Jobs</CardTitle>
                    <Button variant="ghost" className="text-muted-foreground gap-1">
                        <Plus className="h-4 w-4" /> Apply New Job
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col pt-4">
                {/* Tabs */}
                <div className="flex gap-8 mb-6 border-b border-border">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                                activeTab === tab
                                    ? "text-foreground font-bold border-primary"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold text-foreground w-[25%]">
                                    <div className="flex items-center gap-1.5">
                                        Job Position <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">
                                    <div className="flex items-center gap-1.5">
                                        Experience Level <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">Company Name</TableHead>
                                <TableHead className="font-semibold text-foreground">Onsite/Remote</TableHead>
                                <TableHead className="font-semibold text-foreground">Location</TableHead>
                                <TableHead className="font-semibold text-foreground text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        Apply Date <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.map((job, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{job.position}</TableCell>
                                    <TableCell className="text-muted-foreground">{job.level}</TableCell>
                                    <TableCell className="text-muted-foreground">{job.company}</TableCell>
                                    <TableCell className="text-muted-foreground">{job.type}</TableCell>
                                    <TableCell className="text-muted-foreground">{job.location}</TableCell>
                                    <TableCell className="text-muted-foreground text-right">{job.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center mt-auto pt-8 text-muted-foreground text-sm">
                    Total 03 page &nbsp;&nbsp;
                    <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-6 h-6 flex items-center justify-center border border-primary rounded text-primary font-semibold text-xs">
                            1
                        </span>
                        <span className="px-1">2</span>
                        <span className="px-1">...</span>
                        <span className="px-1">3</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default JobsTable;
