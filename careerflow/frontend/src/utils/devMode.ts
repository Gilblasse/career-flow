/**
 * Development Mode Utilities
 * 
 * When VITE_DEV_MODE=true, this module provides mock data and simulations
 * to enable full frontend testing without requiring the backend server.
 */

import type { UserProfile, Experience, Education, ResumeProfile } from '../types';
import type { QueueStatus, JobListing, PauseReason } from '../components/JobBoard/JobBoardPage';

// =============================================================================
// Dev Mode Detection
// =============================================================================

export const isDevMode = (): boolean => {
    return import.meta.env.VITE_DEV_MODE === 'true';
};

// =============================================================================
// Simulation Utilities
// =============================================================================

/**
 * Simulates network delay for realistic dev mode testing
 */
export const simulateDelay = (minMs: number = 300, maxMs: number = 800): Promise<void> => {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulates random failure for testing error handling
 */
export const simulateRandomFailure = (failureRate: number = 0.1): boolean => {
    return Math.random() < failureRate;
};

// =============================================================================
// Mock Profile Data
// =============================================================================

export const MOCK_EXPERIENCE: Experience[] = [
    {
        id: 'exp-1',
        title: 'Senior Software Engineer',
        company: 'TechVision Inc.',
        location: 'San Francisco, CA',
        startDate: '2022-01',
        current: true,
        description: 'Led development of cloud-native microservices architecture serving 2M+ users. Implemented CI/CD pipelines reducing deployment time by 60%. Mentored team of 5 junior engineers.',
        bullets: [
            'Architected and deployed microservices using Node.js, TypeScript, and Kubernetes',
            'Reduced API latency by 40% through Redis caching and query optimization',
            'Led migration from monolith to microservices serving 2M+ daily active users',
        ],
    },
    {
        id: 'exp-2',
        title: 'Software Engineer',
        company: 'DataFlow Systems',
        location: 'Austin, TX',
        startDate: '2019-06',
        endDate: '2021-12',
        current: false,
        description: 'Built real-time data processing pipelines handling 500K events/second. Developed React-based analytics dashboard used by 200+ enterprise clients.',
        bullets: [
            'Built real-time data pipelines processing 500K+ events per second using Kafka',
            'Developed React dashboard reducing client reporting time by 75%',
            'Implemented automated testing increasing code coverage from 45% to 92%',
        ],
    },
    {
        id: 'exp-3',
        title: 'Junior Developer',
        company: 'StartupHub',
        location: 'Remote',
        startDate: '2017-08',
        endDate: '2019-05',
        current: false,
        description: 'Full-stack development for early-stage fintech startup. Built MVP that secured $2M seed funding.',
        bullets: [
            'Developed full-stack features using React, Node.js, and PostgreSQL',
            'Built payment integration processing $500K+ monthly transactions',
            'Contributed to MVP that helped secure $2M seed funding',
        ],
    },
];

export const MOCK_EDUCATION: Education[] = [
    {
        id: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2013-08',
        endDate: '2017-05',
        description: 'GPA: 3.8/4.0. Dean\'s List. Focus on distributed systems and machine learning.',
    },
];

export const MOCK_SKILLS: string[] = [
    'TypeScript',
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'PostgreSQL',
    'Redis',
    'Kubernetes',
    'Docker',
    'AWS',
    'GraphQL',
    'REST APIs',
    'Git',
    'CI/CD',
    'Agile/Scrum',
];

export const MOCK_RESUME_PROFILES: ResumeProfile[] = [
    {
        id: 'profile-1',
        name: 'full-stack-engineer',
        resumeSnapshot: {
            experience: MOCK_EXPERIENCE,
            education: MOCK_EDUCATION,
            skills: MOCK_SKILLS,
        },
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-28T14:30:00Z',
    },
    {
        id: 'profile-2',
        name: 'backend-specialist',
        resumeSnapshot: {
            experience: MOCK_EXPERIENCE.slice(0, 2),
            education: MOCK_EDUCATION,
            skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'AWS', 'Go'],
        },
        createdAt: '2025-01-20T09:00:00Z',
        updatedAt: '2025-01-25T11:00:00Z',
    },
];

export const MOCK_PROFILE: UserProfile = {
    contact: {
        firstName: 'Alex',
        lastName: 'Developer',
        email: 'alex.developer@email.com',
        phone: '(555) 123-4567',
        linkedin: 'https://linkedin.com/in/alexdeveloper',
        github: 'https://github.com/alexdev',
        portfolio: 'https://alexdev.io',
        location: 'San Francisco, CA',
    },
    experience: MOCK_EXPERIENCE,
    education: MOCK_EDUCATION,
    preferences: {
        remoteOnly: false,
        excludedKeywords: ['blockchain', 'crypto', 'web3'],
        maxSeniority: ['senior', 'lead', 'staff'],
        locations: ['San Francisco, CA', 'Remote', 'Austin, TX'],
        minSalary: 150000,
    },
    skills: MOCK_SKILLS,
    resumeProfiles: MOCK_RESUME_PROFILES,
    lastEditedProfileId: 'profile-1',
};

// =============================================================================
// Mock Queue Simulation State
// =============================================================================

interface MockQueueState {
    isProcessing: boolean;
    isPaused: boolean;
    pauseReason: PauseReason;
    currentJobIndex: number;
    queuedJobIds: number[];
    completedJobIds: number[];
    failedJobIds: number[];
    intervalId: ReturnType<typeof setInterval> | null;
    onStatusChange?: (status: QueueStatus) => void;
}

let mockQueueState: MockQueueState = {
    isProcessing: false,
    isPaused: false,
    pauseReason: null,
    currentJobIndex: -1,
    queuedJobIds: [],
    completedJobIds: [],
    failedJobIds: [],
    intervalId: null,
    onStatusChange: undefined,
};

/**
 * Gets the current mock queue status
 */
export const getMockQueueStatus = (): QueueStatus => {
    return {
        isProcessing: mockQueueState.isProcessing,
        isPaused: mockQueueState.isPaused,
        pauseReason: mockQueueState.pauseReason,
        currentJobId: mockQueueState.queuedJobIds[mockQueueState.currentJobIndex] ?? null,
        queuedJobIds: mockQueueState.queuedJobIds.slice(mockQueueState.currentJobIndex + 1),
        completedJobIds: [...mockQueueState.completedJobIds],
        failedJobIds: [...mockQueueState.failedJobIds],
        totalCount: mockQueueState.queuedJobIds.length,
    };
};

/**
 * Simulates processing the next job in the queue
 */
const processNextMockJob = () => {
    if (mockQueueState.isPaused || !mockQueueState.isProcessing) {
        return;
    }

    mockQueueState.currentJobIndex++;

    // Check if we've processed all jobs
    if (mockQueueState.currentJobIndex >= mockQueueState.queuedJobIds.length) {
        // Campaign complete
        mockQueueState.isProcessing = false;
        mockQueueState.currentJobIndex = -1;
        if (mockQueueState.intervalId) {
            clearInterval(mockQueueState.intervalId);
            mockQueueState.intervalId = null;
        }
        mockQueueState.onStatusChange?.(getMockQueueStatus());
        console.log('[DevMode] Auto-apply campaign completed!');
        return;
    }

    const currentJobId = mockQueueState.queuedJobIds[mockQueueState.currentJobIndex];
    console.log(`[DevMode] Processing job ${currentJobId}...`);

    // Simulate occasional captcha (10% chance after first 2 jobs)
    if (mockQueueState.currentJobIndex > 1 && Math.random() < 0.1) {
        mockQueueState.isPaused = true;
        mockQueueState.pauseReason = 'captcha';
        console.log('[DevMode] CAPTCHA detected! Pausing campaign...');
        mockQueueState.onStatusChange?.(getMockQueueStatus());
        return;
    }

    // Simulate job completion after a delay
    setTimeout(() => {
        if (!mockQueueState.isProcessing || mockQueueState.isPaused) return;

        // 90% success rate
        if (Math.random() < 0.9) {
            mockQueueState.completedJobIds.push(currentJobId);
            console.log(`[DevMode] Successfully applied to job ${currentJobId}`);
        } else {
            mockQueueState.failedJobIds.push(currentJobId);
            console.log(`[DevMode] Failed to apply to job ${currentJobId}`);
        }

        mockQueueState.onStatusChange?.(getMockQueueStatus());
    }, 1500 + Math.random() * 1000); // 1.5-2.5s per job
};

/**
 * Starts a mock auto-apply campaign
 */
export const startMockCampaign = async (
    jobIds: number[],
    onStatusChange?: (status: QueueStatus) => void
): Promise<QueueStatus> => {
    await simulateDelay(200, 500);

    // Reset state
    mockQueueState = {
        isProcessing: true,
        isPaused: false,
        pauseReason: null,
        currentJobIndex: -1,
        queuedJobIds: [...jobIds],
        completedJobIds: [],
        failedJobIds: [],
        intervalId: null,
        onStatusChange,
    };

    console.log(`[DevMode] Starting auto-apply campaign with ${jobIds.length} jobs...`);

    // Start processing interval (every 2 seconds)
    mockQueueState.intervalId = setInterval(processNextMockJob, 2000);
    
    // Process first job immediately
    processNextMockJob();

    return getMockQueueStatus();
};

/**
 * Pauses the mock auto-apply campaign
 */
export const pauseMockCampaign = async (): Promise<QueueStatus> => {
    await simulateDelay(100, 300);

    if (mockQueueState.isProcessing) {
        mockQueueState.isPaused = true;
        mockQueueState.pauseReason = 'manual';
        console.log('[DevMode] Campaign paused by user');
    }

    return getMockQueueStatus();
};

/**
 * Resumes the mock auto-apply campaign
 */
export const resumeMockCampaign = async (): Promise<QueueStatus> => {
    await simulateDelay(100, 300);

    if (mockQueueState.isPaused) {
        mockQueueState.isPaused = false;
        mockQueueState.pauseReason = null;
        console.log('[DevMode] Campaign resumed');
        
        // Resume processing
        if (!mockQueueState.intervalId) {
            mockQueueState.intervalId = setInterval(processNextMockJob, 2000);
        }
        processNextMockJob();
    }

    return getMockQueueStatus();
};

/**
 * Stops the mock auto-apply campaign
 */
export const stopMockCampaign = async (): Promise<QueueStatus> => {
    await simulateDelay(100, 300);

    if (mockQueueState.intervalId) {
        clearInterval(mockQueueState.intervalId);
        mockQueueState.intervalId = null;
    }
    
    mockQueueState.isProcessing = false;
    mockQueueState.isPaused = false;
    mockQueueState.pauseReason = null;
    console.log('[DevMode] Campaign stopped');

    return getMockQueueStatus();
};

/**
 * Registers a callback for queue status changes
 */
export const onMockQueueStatusChange = (callback: (status: QueueStatus) => void) => {
    mockQueueState.onStatusChange = callback;
};

// =============================================================================
// Mock Job Board Data
// =============================================================================

export const MOCK_JOBS: JobListing[] = [
    {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        isRemote: true,
        salaryMin: 140000,
        salaryMax: 180000,
        employmentType: 'full-time',
        postedAt: '2 days ago',
        description: 'Looking for experienced software engineer to join our platform team. You will be working on cutting-edge distributed systems, building scalable microservices, and collaborating with cross-functional teams to deliver world-class products.\n\nRequirements:\n- 5+ years of experience in software development\n- Strong proficiency in TypeScript, React, and Node.js\n- Experience with cloud platforms (AWS, GCP, or Azure)\n- Excellent problem-solving skills\n- Strong communication abilities',
        matchScore: 92,
        status: 'new',
        logoColor: '#3B82F6',
    },
    {
        id: '2',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        isRemote: true,
        salaryMin: 120000,
        salaryMax: 160000,
        employmentType: 'full-time',
        postedAt: '1 day ago',
        description: 'Build scalable web applications using React and Node.js. Join our fast-growing startup and help shape the future of our product.\n\nWhat you\'ll do:\n- Design and implement new features\n- Write clean, maintainable code\n- Participate in code reviews\n- Collaborate with designers and product managers',
        matchScore: 88,
        status: 'new',
        logoColor: '#10B981',
    },
    {
        id: '3',
        title: 'Frontend Engineer',
        company: 'DesignCo',
        location: 'New York, NY',
        isRemote: false,
        salaryMin: 130000,
        salaryMax: 170000,
        employmentType: 'full-time',
        postedAt: '3 days ago',
        description: 'Create beautiful user interfaces with modern web technologies. We\'re looking for someone passionate about UI/UX who can bring designs to life.\n\nTech stack:\n- React/Next.js\n- TypeScript\n- Tailwind CSS\n- Framer Motion',
        matchScore: 85,
        status: 'new',
        logoColor: '#F59E0B',
    },
    {
        id: '4',
        title: 'Backend Engineer',
        company: 'DataFlow Inc',
        location: 'Austin, TX',
        isRemote: true,
        salaryMin: 135000,
        salaryMax: 175000,
        employmentType: 'full-time',
        postedAt: '3 days ago',
        description: 'Build robust backend systems and APIs. Work with our data engineering team to process millions of events per day.\n\nRequirements:\n- Experience with Python or Go\n- Database design (PostgreSQL, Redis)\n- Message queues (Kafka, RabbitMQ)\n- Kubernetes and Docker',
        matchScore: 90,
        status: 'new',
        logoColor: '#8B5CF6',
    },
    {
        id: '5',
        title: 'DevOps Engineer',
        company: 'CloudSystems',
        location: 'Seattle, WA',
        isRemote: true,
        salaryMin: 145000,
        salaryMax: 185000,
        employmentType: 'full-time',
        postedAt: '5 days ago',
        description: 'Manage cloud infrastructure and CI/CD pipelines. Help us scale our systems to handle 10x growth.\n\nWhat we\'re looking for:\n- AWS/GCP expertise\n- Terraform, Ansible\n- Kubernetes administration\n- Monitoring and observability',
        matchScore: 78,
        status: 'new',
        logoColor: '#EC4899',
    },
    {
        id: '6',
        title: 'React Developer',
        company: 'WebAgency',
        location: 'Chicago, IL',
        isRemote: false,
        salaryMin: 100000,
        salaryMax: 140000,
        employmentType: 'contract',
        postedAt: '1 week ago',
        description: '6-month contract for React development work. Build client websites and web applications.',
        matchScore: 72,
        status: 'new',
        logoColor: '#EF4444',
    },
    {
        id: '7',
        title: 'Software Engineer II',
        company: 'FinTech Pro',
        location: 'Boston, MA',
        isRemote: true,
        salaryMin: 125000,
        salaryMax: 155000,
        employmentType: 'full-time',
        postedAt: '4 days ago',
        description: 'Join our payments team to build next-generation financial infrastructure.',
        matchScore: 83,
        status: 'new',
        logoColor: '#06B6D4',
    },
    {
        id: '8',
        title: 'Principal Engineer',
        company: 'Enterprise Corp',
        location: 'Denver, CO',
        isRemote: true,
        salaryMin: 180000,
        salaryMax: 220000,
        employmentType: 'full-time',
        postedAt: '2 days ago',
        description: 'Lead technical architecture and mentor engineering teams across the organization.',
        matchScore: 95,
        status: 'new',
        logoColor: '#6366F1',
    },
];

// =============================================================================
// Console Logging for Dev Mode
// =============================================================================

export const logDevModeStatus = () => {
    if (isDevMode()) {
        console.log('%c🔧 DEV MODE ENABLED', 'color: #10B981; font-weight: bold; font-size: 14px;');
        console.log('%cUsing mock data and simulated API responses.', 'color: #6B7280;');
        console.log('%cTo disable, set VITE_DEV_MODE=false in .env', 'color: #6B7280;');
    }
};
