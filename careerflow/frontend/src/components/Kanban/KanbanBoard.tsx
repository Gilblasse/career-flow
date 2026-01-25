import React, { useState } from 'react';
import { MoreHorizontal, Search, Filter, Settings, Calendar as CalendarIcon, ArrowRight, Trash2, List, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import JobDetailModal from './JobDetailModal';

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
        <div style={{
            width: '20px', height: '20px', borderRadius: '4px',
            backgroundColor: `${color}20`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 'bold'
        }}>
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

    // Actions State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
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
        setActiveMenuId(null);
    };

    const handleUpdateDate = (columnId: ColumnId, taskId: string, newDate: string) => {
        setTasks(prev => ({
            ...prev,
            [columnId]: prev[columnId].map(t => t.id === taskId ? { ...t, date: newDate } : t)
        }));
        setActiveMenuId(null);
    };

    const confirmDelete = () => {
        if (!taskToDelete || deleteInput !== taskToDelete.task.role) return;
        setTasks(prev => ({
            ...prev,
            [taskToDelete.columnId]: prev[taskToDelete.columnId].filter(t => t.id !== taskToDelete.task.id)
        }));
        setTaskToDelete(null);
    };

    // --- Render Helpers ---

    const renderBoard = () => (
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px' }}>
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, column.id)}
                    style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Column Header */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: 0 }}>{column.title}</h3>
                                <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{displayTasks[column.id].length}</span>
                            </div>
                            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                        <div style={{ width: '100%', height: '3px', backgroundColor: column.color, borderRadius: '2px' }}></div>
                    </div>

                    {/* Tasks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayTasks[column.id].map(task => (
                            <motion.div
                                key={task.id}
                                layoutId={task.id}
                                draggable
                                onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task, column.id)}
                                onClick={() => setSelectedTask(task)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    cursor: 'grab',
                                    border: '1px solid #E5E7EB',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            >
                                {/* Header: Logo + Company */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <CompanyLogo name={task.company} />
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{task.company}</span>
                                </div>

                                {/* Role */}
                                <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>{task.role}</h4>

                                {/* Description */}
                                <p style={{
                                    fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0',
                                    lineHeight: '1.4',
                                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                }}>
                                    {task.description}
                                </p>

                                {/* Footer: Separator + Date + Menu */}
                                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{task.date}</span>

                                    <div style={{ position: 'relative' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === task.id ? null : task.id);
                                            }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {activeMenuId === task.id && (
                                            <div style={{
                                                position: 'absolute', right: 0, bottom: '100%',
                                                backgroundColor: 'white', borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                border: '1px solid #E5E7EB', zIndex: 10, minWidth: '160px', overflow: 'hidden',
                                                marginBottom: '8px'
                                            }} onClick={e => e.stopPropagation()}>
                                                <div style={{ padding: '4px' }}>
                                                    {COLUMNS.filter(c => c.id !== column.id).map(targetCol => (
                                                        <button
                                                            key={targetCol.id}
                                                            onClick={() => handleMoveTask(column.id, targetCol.id, task.id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                                padding: '8px', fontSize: '13px', textAlign: 'left',
                                                                border: 'none', background: 'transparent', cursor: 'pointer',
                                                                color: '#374151'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <ArrowRight size={14} /> Move to {targetCol.title}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const newDate = prompt("Enter new date:", task.date);
                                                            if (newDate) handleUpdateDate(column.id, task.id, newDate);
                                                        }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                            padding: '8px', fontSize: '13px', textAlign: 'left',
                                                            border: 'none', background: 'transparent', cursor: 'pointer',
                                                            color: '#374151'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <CalendarIcon size={14} /> Change Date
                                                    </button>
                                                    <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '4px 0' }} />
                                                    <button
                                                        onClick={() => setTaskToDelete({ task, columnId: column.id })}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                            padding: '8px', fontSize: '13px', textAlign: 'left',
                                                            border: 'none', background: 'transparent', cursor: 'pointer',
                                                            color: '#EF4444'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTable = () => (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <tr>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Role</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Company</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Date Applied</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#6B7280' }}>Status</th>
                        <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#6B7280' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {getAllTasksFlat().map(task => (
                        <tr key={task.id} style={{ borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                            <td style={{ padding: '16px', fontWeight: '500', color: '#111827' }}>{task.role}</td>
                            <td style={{ padding: '16px', color: '#6B7280' }}>{task.company}</td>
                            <td style={{ padding: '16px', color: '#6B7280' }}>{task.date}</td>
                            <td style={{ padding: '16px' }}>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500',
                                    backgroundColor: `${task.statusColor}20`, color: task.statusColor
                                }}>
                                    {COLUMNS.find(c => c.id === task.status)?.title}
                                </span>
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                    <MoreHorizontal size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
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
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handlePrevMonth} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', background: 'transparent', cursor: 'pointer' }}>&lt;</button>
                        <button onClick={handleNextMonth} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', background: 'transparent', cursor: 'pointer' }}>&gt;</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#E5E7EB', border: '1px solid #E5E7EB' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ padding: '12px', backgroundColor: '#F9FAFB', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>{day}</div>
                    ))}

                    {placeholders.map(i => <div key={`empty-${i}`} style={{ backgroundColor: 'white', height: '100px' }} />)}

                    {days.map(day => {
                        const dayTasks = getTasksForDate(day);
                        return (
                            <div key={day} style={{ backgroundColor: 'white', height: '100px', padding: '8px', overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>{day}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            style={{
                                                fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                backgroundColor: `${task.statusColor}20`, color: task.statusColor,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                cursor: 'pointer'
                                            }}>
                                            {task.role}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div style={{ fontSize: '10px', color: '#9CA3AF', paddingLeft: '2px' }}>+ {dayTasks.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const headerButtonStyle = (mode: ViewMode) => ({
        padding: '6px 12px',
        backgroundColor: viewMode === mode ? 'white' : 'transparent',
        borderRadius: '6px',
        border: 'none',
        boxShadow: viewMode === mode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
        fontSize: '14px',
        fontWeight: '500',
        color: viewMode === mode ? '#111827' : '#6B7280',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    });

    return (
        <div style={{ padding: '0px', width: '100%', minHeight: '80vh' }} onClick={() => setActiveMenuId(null)}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Application Process</h1>
                    <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '4px' }}>
                        <button onClick={() => setViewMode('board')} style={headerButtonStyle('board')}>
                            <Grid size={14} /> Board
                        </button>
                        <button onClick={() => setViewMode('table')} style={headerButtonStyle('table')}>
                            <List size={14} /> Table
                        </button>
                        <button onClick={() => setViewMode('calendar')} style={headerButtonStyle('calendar')}>
                            <CalendarIcon size={14} /> Calendar
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px', color: '#6B7280', fontSize: '14px',
                        backgroundColor: 'white', padding: '6px 12px', borderRadius: '6px', border: '1px solid #E5E7EB'
                    }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#374151', width: '150px' }}
                        />
                    </div>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                        backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px',
                        color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
                    }}>
                        <Filter size={16} /> Filter
                    </button>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                        backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px',
                        color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
                    }}>
                        <Settings size={16} /> Settings
                    </button>
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

            {taskToDelete && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => setTaskToDelete(null)}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, fontWeight: 'bold', fontSize: '18px' }}>Confirm Removal</h3>
                        <p style={{ color: '#4B5563', marginBottom: '20px' }}>To remove <strong>{taskToDelete.task.role}</strong>, type job title.</p>
                        <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder={taskToDelete.task.role}
                            style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '20px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setTaskToDelete(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white' }}>Cancel</button>
                            <button onClick={confirmDelete} disabled={deleteInput !== taskToDelete.task.role}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: deleteInput === taskToDelete.task.role ? '#EF4444' : '#F3F4F6', color: deleteInput === taskToDelete.task.role ? 'white' : '#9CA3AF' }}>Remove Application</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
