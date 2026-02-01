import { useEffect, useState } from 'react';
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
import type { JobFilterType } from './OverviewStats';

interface Job {
    position: string;
    level: string;
    company: string;
    type: string;
    salary: string;
    date: string;
}

interface JobsTableProps {
    activeFilter: JobFilterType;
    onFilterChange: (filter: JobFilterType) => void;
}

// Mock data for different job states
const allJobs: Job[] = [
    { position: 'Product Designer', level: 'Senior Level', company: 'Google', type: 'On-Site', salary: '$145,000', date: '02 Sep 23' },
    { position: 'User Interface Designer', level: 'Senior Level', company: 'Apple', type: 'Remote', salary: '$160,000', date: '15 Aug 23' },
    { position: 'UX/UI designer', level: 'Mid Level', company: 'Microsoft', type: 'Flexible', salary: '$115,000', date: '01 Sep 23' },
    { position: 'UX/UI designer', level: 'Senior Level', company: 'Tesla', type: 'On-Site', salary: '$140,000', date: '01 Aug 23' },
];

const queuedJobs: Job[] = [
    { position: 'Frontend Developer', level: 'Mid Level', company: 'Stripe', type: 'Remote', salary: '$130,000', date: '28 Jan 26' },
    { position: 'React Engineer', level: 'Senior Level', company: 'Vercel', type: 'Remote', salary: '$175,000', date: '27 Jan 26' },
    { position: 'Full Stack Developer', level: 'Senior Level', company: 'Shopify', type: 'Flexible', salary: '$155,000', date: '26 Jan 26' },
];

const interviewJobs: Job[] = [
    { position: 'Software Engineer', level: 'Senior Level', company: 'Meta', type: 'On-Site', salary: '$185,000', date: '30 Jan 26' },
    { position: 'DevOps Engineer', level: 'Mid Level', company: 'Netflix', type: 'Remote', salary: '$145,000', date: '29 Jan 26' },
];

const rejectedJobs: Job[] = [
    { position: 'Backend Developer', level: 'Junior Level', company: 'Amazon', type: 'On-Site', salary: '$95,000', date: '20 Jan 26' },
    { position: 'Data Engineer', level: 'Mid Level', company: 'Uber', type: 'Flexible', salary: '$125,000', date: '18 Jan 26' },
];

const tabs: JobFilterType[] = ['Total Applied', 'In Queue', 'Interview', 'Rejected'];

const JobsTable: React.FC<JobsTableProps> = ({ activeFilter, onFilterChange }) => {
    const [jobs, setJobs] = useState<Job[]>(allJobs);

    useEffect(() => {
        switch (activeFilter) {
            case 'Total Applied':
                setJobs(allJobs);
                break;
            case 'In Queue':
                setJobs(queuedJobs);
                break;
            case 'Interview':
                setJobs(interviewJobs);
                break;
            case 'Rejected':
                setJobs(rejectedJobs);
                break;
            default:
                setJobs(allJobs);
        }
    }, [activeFilter]);

    return (
        <Card className="border-0 shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-0 px-4 md:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <CardTitle className="text-lg">My Jobs</CardTitle>
                    <Button variant="ghost" className="text-muted-foreground gap-1 -ml-3 sm:ml-0">
                        <Plus className="h-4 w-4" /> Apply New Job
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col pt-4 px-4 md:px-6">
                {/* Tabs - horizontally scrollable on mobile */}
                <div className="flex gap-4 md:gap-8 mb-6 border-b border-border overflow-x-auto pb-px -mx-4 px-4 md:mx-0 md:px-0">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => onFilterChange(tab)}
                            className={cn(
                                "pb-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                                activeFilter === tab
                                    ? "text-foreground font-bold border-primary"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Table with horizontal scroll on mobile */}
                <div className="rounded-xl overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="min-w-[600px]">
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
                                <TableHead className="font-semibold text-foreground">Salary</TableHead>
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
                                    <TableCell className="text-muted-foreground">{job.salary}</TableCell>
                                    <TableCell className="text-muted-foreground text-right">{job.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-center md:justify-end items-center mt-auto pt-6 md:pt-8 text-muted-foreground text-sm">
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
