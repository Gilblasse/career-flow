export type ColumnId = 'applied' | 'screening' | 'interview' | 'offer';

export interface Task {
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

export interface DragItem {
    id: string;
    column: ColumnId;
}

export interface Column {
    id: ColumnId;
    title: string;
    color: string;
}

export type TaskWithStatus = Task & { status: ColumnId; statusColor: string };
