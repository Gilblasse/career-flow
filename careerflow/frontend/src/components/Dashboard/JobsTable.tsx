import { useEffect, useState, useMemo } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/components/Auth';
import { useApplicationsRealtime, type Application } from '@/lib/realtime';

interface JobsTableProps {
    activeFilter: JobFilterType;
    onFilterChange: (filter: JobFilterType) => void;
}

const tabs: JobFilterType[] = ['Total Applied', 'In Queue', 'Interview', 'Rejected'];

// Map our queue_status to display-friendly tabs
const statusToTab = (status: string): JobFilterType => {
    switch (status) {
        case 'pending':
        case 'queued':
        case 'processing':
            return 'In Queue';
        case 'completed':
            return 'Total Applied';
        case 'failed':
            return 'Rejected';
        case 'interview':
            return 'Interview';
        default:
            return 'Total Applied';
    }
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
};

const JobsTable: React.FC<JobsTableProps> = ({ activeFilter, onFilterChange }) => {
    const { user } = useAuth();
    const { applications, loading } = useApplicationsRealtime(user?.id);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter applications based on active tab
    const filteredApplications = useMemo(() => {
        if (activeFilter === 'Total Applied') {
            // Show all completed applications
            return applications.filter(app => app.queue_status === 'completed');
        }
        return applications.filter(app => statusToTab(app.queue_status) === activeFilter);
    }, [applications, activeFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const paginatedApplications = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredApplications.slice(start, start + itemsPerPage);
    }, [filteredApplications, currentPage]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
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

                {/* Loading state */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p>No applications found</p>
                        <p className="text-sm">Start applying to jobs to see them here</p>
                    </div>
                ) : (
                    <>
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
                                        <TableHead className="font-semibold text-foreground">Company</TableHead>
                                        <TableHead className="font-semibold text-foreground">Location</TableHead>
                                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                                        <TableHead className="font-semibold text-foreground text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                Date <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedApplications.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">{app.title}</TableCell>
                                            <TableCell className="text-muted-foreground">{app.company}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {app.is_remote ? 'Remote' : app.location || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    app.queue_status === 'completed' && "bg-green-500/10 text-green-500",
                                                    app.queue_status === 'pending' && "bg-yellow-500/10 text-yellow-500",
                                                    app.queue_status === 'queued' && "bg-blue-500/10 text-blue-500",
                                                    app.queue_status === 'processing' && "bg-purple-500/10 text-purple-500",
                                                    app.queue_status === 'failed' && "bg-red-500/10 text-red-500",
                                                )}>
                                                    {app.queue_status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right">
                                                {formatDate(app.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center md:justify-end items-center mt-auto pt-6 md:pt-8 text-muted-foreground text-sm">
                            Total {String(totalPages).padStart(2, '0')} page{totalPages !== 1 ? 's' : ''} &nbsp;&nbsp;
                            <div className="flex items-center gap-1.5">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "w-6 h-6 flex items-center justify-center rounded text-xs",
                                                currentPage === pageNum
                                                    ? "border border-primary text-primary font-semibold"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 3 && <span className="px-1">...</span>}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default JobsTable;
