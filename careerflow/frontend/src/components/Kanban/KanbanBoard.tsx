import { useState } from 'react';
import { MoreHorizontal, Search, Filter, Settings, Calendar as CalendarIcon, ArrowRight, Trash2, List, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import JobDetailModal from './JobDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- Types ---
interface Task {
    id: string;
    company: string;
    role: string;
    description: string;
    date: string; // Display string, e.g. "12 Sept 2023"
    updatedAt: number; // Timestamp
    previousStatus?: string;
    previousDate?: number;
    logo?: string;
    // Extended fields
    jobDescription?: string;
    resumeUrl?: string;
    coverLetterUrl?: string;
    screenshotUrl?: string;
}

type ColumnId = 'applied' | 'screening' | 'interview' | 'offer';
type ViewMode = 'board' | 'table' | 'calendar';

interface Column {
    id: ColumnId;
    title: string;
    color: string;
}

const COLUMNS: Column[] = [
    { id: 'applied', title: 'Applied', color: '#34D399' },
    { id: 'screening', title: 'Screening', color: '#FBBF24' },
    { id: 'interview', title: 'Interview', color: '#60A5FA' },
    { id: 'offer', title: 'Offers', color: '#A78BFA' },
];

const SAMPLE_DESCRIPTION = `We are looking for a highly skilled Software Engineer to join our dynamic team. You will be responsible for developing high-quality applications...

Responsibilities:
- Write clean, maintainable code
- Collaborate with cross-functional teams
- troubleshoot and debug applications

Requirements:
- 3+ years of React experience
- Strong understanding of TypeScript
- Experience with Node.js is a plus`;

// dynamic dates helper
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const getDateTime = (day: number) => new Date(currentYear, currentMonth, day).getTime();
const getDateString = (day: number) => new Date(currentYear, currentMonth, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const INITIAL_TASKS: Record<ColumnId, Task[]> = {
    applied: [
        { id: '1', company: 'Better Uptime', role: 'Lead Engineer', description: 'publishing and graphic design...', date: getDateString(12), updatedAt: getDateTime(12), jobDescription: SAMPLE_DESCRIPTION },
        { id: '2', company: 'Fathom', role: 'React Developer', description: 'publishing and graphic design...', date: getDateString(15), updatedAt: getDateTime(15), jobDescription: SAMPLE_DESCRIPTION },
        { id: '3', company: 'Atlassian', role: 'Senior Software Engineer', description: 'publishing and graphic design...', date: getDateString(18), updatedAt: getDateTime(18), jobDescription: SAMPLE_DESCRIPTION },
    ],
    screening: [
        { id: '4', company: 'Brex', role: 'Test engineer', description: 'publishing and graphic design...', date: getDateString(20), updatedAt: getDateTime(20), jobDescription: SAMPLE_DESCRIPTION },
        { id: '5', company: 'Mapbox', role: 'Senior software developer', description: 'publishing and graphic design...', date: getDateString(22), updatedAt: getDateTime(22), jobDescription: SAMPLE_DESCRIPTION },
    ],
    interview: [
        { id: '6', company: 'my mind', role: 'Software developer', description: 'publishing and graphic design...', date: getDateString(25), updatedAt: getDateTime(25), jobDescription: SAMPLE_DESCRIPTION },
        { id: '7', company: 'HelpScout', role: 'Full Stack Developer', description: 'publishing and graphic design...', date: getDateString(5), updatedAt: getDateTime(5), jobDescription: SAMPLE_DESCRIPTION },
    ],
    offer: [
        { id: '8', company: 'Greenhouse', role: 'Project Leader', description: 'publishing and graphic design...', date: getDateString(28), updatedAt: getDateTime(28), jobDescription: SAMPLE_DESCRIPTION },
    ]
};

const getLogoColor = (name: string) => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const CompanyLogo = ({ name }: { name: string }) => {
    const color = getLogoColor(name);
    const initial = name.charAt(0).toUpperCase();
    return (
        <div 
            className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold"
            style={{ backgroundColor: `${color}20`, color: color }}
        >
            {initial}
        </div>
    );
};

const KanbanBoard: React.FC = () => {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewDate, setViewDate] = useState(new Date());

    const [taskToDelete, setTaskToDelete] = useState<{ task: Task, columnId: ColumnId } | null>(null);
    const [deleteInput, setDeleteInput] = useState('');

    // --- Search Logic ---
    const getFilteredTasks = () => {
        if (!searchQuery.trim()) return tasks;

        const query = searchQuery.toLowerCase();
        const filtered: Record<ColumnId, Task[]> = { ...tasks };

        COLUMNS.forEach(col => {
            filtered[col.id] = tasks[col.id].filter(task =>
                task.role.toLowerCase().includes(query) ||
                task.company.toLowerCase().includes(query)
            );
        });

        return filtered;
    };

    const displayTasks = getFilteredTasks();

    // --- Logic: Drag & Drop ---
    const onDragStart = (e: React.DragEvent, task: Task, sourceColumn: ColumnId) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('sourceColumn', sourceColumn);
    };

    const onDrop = (e: React.DragEvent, targetColumn: ColumnId) => {
        const taskId = e.dataTransfer.getData('taskId');
        const sourceColumn = e.dataTransfer.getData('sourceColumn') as ColumnId;

        if (!sourceColumn || sourceColumn === targetColumn) return;

        const sourceList = [...tasks[sourceColumn]];
        const taskIndex = sourceList.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const [task] = sourceList.splice(taskIndex, 1);

        const now = Date.now();
        const newDateString = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        let updatedTask = { ...task };

        if (task.previousStatus === targetColumn) {
            if (task.previousDate) {
                updatedTask.updatedAt = task.previousDate;
            }
        } else {
            updatedTask.previousStatus = sourceColumn;
            updatedTask.previousDate = task.updatedAt;
            updatedTask.updatedAt = now;
            updatedTask.date = newDateString;
        }

        setTasks(prev => ({
            ...prev,
            [sourceColumn]: sourceList,
            [targetColumn]: [...prev[targetColumn], updatedTask]
        }));
    };

    // --- Logic: Actions ---
    const handleMoveTask = (sourceColumn: ColumnId, targetColumn: ColumnId, taskId: string) => {
        const sourceList = [...tasks[sourceColumn]];
        const taskIndex = sourceList.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        const [task] = sourceList.splice(taskIndex, 1);

        const now = Date.now();
        const newDateString = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        let updatedTask = { ...task };

        if (task.previousStatus === targetColumn) {
            if (task.previousDate) updatedTask.updatedAt = task.previousDate;
        } else {
            updatedTask.previousStatus = sourceColumn;
            updatedTask.previousDate = task.updatedAt;
            updatedTask.updatedAt = now;
            updatedTask.date = newDateString;
        }

        setTasks(prev => ({
            ...prev,
            [sourceColumn]: sourceList,
            [targetColumn]: [...prev[targetColumn], updatedTask]
        }));
    };

    const handleUpdateDate = (columnId: ColumnId, taskId: string, newDate: string) => {
        setTasks(prev => ({
            ...prev,
            [columnId]: prev[columnId].map(t => t.id === taskId ? { ...t, date: newDate } : t)
        }));
    };

    const confirmDelete = () => {
        if (!taskToDelete || deleteInput !== taskToDelete.task.role) return;
        setTasks(prev => ({
            ...prev,
            [taskToDelete.columnId]: prev[taskToDelete.columnId].filter(t => t.id !== taskToDelete.task.id)
        }));
        setTaskToDelete(null);
        setDeleteInput('');
    };

    // --- Render Helpers ---

    const renderBoard = () => (
        <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-5 -mx-4 px-4 lg:mx-0 lg:px-0">
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, column.id)}
                    className="flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[300px] flex flex-col"
                >
                    {/* Column Header */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground">{column.title}</h3>
                                <span className="text-sm text-muted-foreground">{displayTasks[column.id].length}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="w-full h-[3px] rounded-sm" style={{ backgroundColor: column.color }} />
                    </div>

                    {/* Tasks List */}
                    <div className="flex flex-col gap-3">
                        {displayTasks[column.id].map(task => (
                            <motion.div
                                key={task.id}
                                layoutId={task.id}
                                draggable
                                onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task, column.id)}
                                whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            >
                                <Card 
                                    className="cursor-grab border shadow-sm hover:shadow-md transition-shadow"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <CardContent className="p-4">
                                        {/* Header: Logo + Company */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <CompanyLogo name={task.company} />
                                            <span className="text-sm font-bold text-foreground">{task.company}</span>
                                        </div>

                                        {/* Role */}
                                        <h4 className="text-[15px] font-bold text-foreground mb-2">{task.role}</h4>

                                        {/* Description */}
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                                            {task.description}
                                        </p>

                                        {/* Footer */}
                                        <div className="border-t pt-3 flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">{task.date}</span>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-muted-foreground"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                    {COLUMNS.filter(c => c.id !== column.id).map(targetCol => (
                                                        <DropdownMenuItem
                                                            key={targetCol.id}
                                                            onClick={() => handleMoveTask(column.id, targetCol.id, task.id)}
                                                        >
                                                            <ArrowRight className="h-4 w-4 mr-2" /> Move to {targetCol.title}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            const newDate = prompt("Enter new date:", task.date);
                                                            if (newDate) handleUpdateDate(column.id, task.id, newDate);
                                                        }}
                                                    >
                                                        <CalendarIcon className="h-4 w-4 mr-2" /> Change Date
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setTaskToDelete({ task, columnId: column.id })}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTable = () => (
        <Card className="border-0 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Date Applied</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {getAllTasksFlat().map(task => (
                        <TableRow 
                            key={task.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedTask(task)}
                        >
                            <TableCell className="font-medium">{task.role}</TableCell>
                            <TableCell className="text-muted-foreground">{task.company}</TableCell>
                            <TableCell className="text-muted-foreground">{task.date}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant="secondary"
                                    style={{ backgroundColor: `${task.statusColor}20`, color: task.statusColor }}
                                >
                                    {COLUMNS.find(c => c.id === task.status)?.title}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );

    const getAllTasksFlat = () => {
        return COLUMNS.flatMap(col => displayTasks[col.id].map(t => ({ ...t, status: col.id, statusColor: col.color })));
    };

    // --- Calendar Logic ---
    const getMonthData = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay(); // 0 = Sun
        return { year, month, daysInMonth, startDay };
    };

    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const renderCalendar = () => {
        const { year, month, daysInMonth, startDay } = getMonthData(viewDate);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const placeholders = Array.from({ length: startDay }, (_, i) => i);

        const getTasksForDate = (day: number) => {
            return getAllTasksFlat().filter(t => {
                const tDate = new Date(t.updatedAt);
                return tDate.getDate() === day && tDate.getMonth() === month && tDate.getFullYear() === year;
            });
        };

        return (
            <Card className="border-0 shadow-sm p-6">
                <div className="flex justify-between mb-5">
                    <h2 className="text-lg font-bold">
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrevMonth}>&lt;</Button>
                        <Button variant="outline" size="sm" onClick={handleNextMonth}>&gt;</Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 bg-muted/50 font-semibold text-sm text-center">{day}</div>
                    ))}

                    {placeholders.map(i => <div key={`empty-${i}`} className="bg-card h-24" />)}

                    {days.map(day => {
                        const dayTasks = getTasksForDate(day);
                        return (
                            <div key={day} className="bg-card h-24 p-2 overflow-hidden">
                                <div className="text-sm font-medium text-foreground mb-1.5">{day}</div>
                                <div className="flex flex-col gap-1">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate"
                                            style={{ backgroundColor: `${task.statusColor}20`, color: task.statusColor }}
                                        >
                                            {task.role}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[10px] text-muted-foreground pl-0.5">+ {dayTasks.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        );
    };

    return (
        <div className="w-full min-h-[60vh] lg:min-h-[80vh]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                    <h1 className="text-xl lg:text-2xl font-bold">Application Process</h1>
                    <div className="flex bg-muted rounded-lg p-1">
                        <Button 
                            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('board')}
                            className={cn("text-xs sm:text-sm", viewMode === 'board' && 'bg-background shadow-sm')}
                        >
                            <LayoutGrid className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Board</span>
                        </Button>
                        <Button 
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className={cn("text-xs sm:text-sm", viewMode === 'table' && 'bg-background shadow-sm')}
                        >
                            <List className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Table</span>
                        </Button>
                        <Button 
                            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('calendar')}
                            className={cn("text-xs sm:text-sm", viewMode === 'calendar' && 'bg-background shadow-sm')}
                        >
                            <CalendarIcon className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Calendar</span>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full sm:w-40"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Filter className="h-4 w-4 mr-1.5" /> Filter
                    </Button>
                    <Button variant="outline" size="icon" className="sm:hidden h-9 w-9">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Settings className="h-4 w-4 mr-1.5" /> Settings
                    </Button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'board' && renderBoard()}
            {viewMode === 'table' && renderTable()}
            {viewMode === 'calendar' && renderCalendar()}

            {/* Modals */}
            {selectedTask && (
                <JobDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!taskToDelete} onOpenChange={(open: boolean) => !open && setTaskToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Removal</DialogTitle>
                        <DialogDescription>
                            To remove <strong>{taskToDelete?.task.role}</strong>, type the job title below.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder={taskToDelete?.task.role}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDelete}
                            disabled={deleteInput !== taskToDelete?.task.role}
                        >
                            Remove Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KanbanBoard;
