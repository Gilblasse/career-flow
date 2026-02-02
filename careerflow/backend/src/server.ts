import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ProfileService, { validateResumeProfiles } from './services/profile.js';
import authMiddleware, { AuthenticatedRequest, optionalAuthMiddleware } from './services/auth.js';
import ResumeGenerator from './modules/resume/generator.js';
import ResumeParser from './modules/resume/parser.js';
import QueueProcessor from './modules/queue/processor.js';
import JobStore from './modules/ingestion/job-store.js';
import { jobsService } from './services/jobs-service.js';
import JobIngestionService from './modules/ingestion/service.js';
import FilterEngine from './modules/filtering/engine.js';
import { getEnabledTargetUrls, SCRAPE_TARGETS } from './config/scrapeTargets.js';
import db from './services/db.js';
import Logger from './services/logger.js';
import { UserProfile, ResumeProfile, JobRow } from './types.js';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import WordExtractor from 'word-extractor';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============ Validation Helpers ============

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone regex: accepts (XXX) XXX-XXXX USA format
const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/;

/**
 * Formats a phone number to (XXX) XXX-XXXX USA format
 * Strips all non-digits, then formats accordingly
 */
function formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Strip all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // Remove leading 1 if present (country code)
    if (digits.length === 11 && digits.startsWith('1')) {
        digits = digits.slice(1);
    }
    
    // Handle 10 digits
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // Return original if doesn't match expected format
    return phone;
}

interface ValidationError {
    field: string;
    message: string;
}

/**
 * Validates profile data and returns array of errors
 */
function validateProfile(profile: UserProfile): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Required fields
    if (!profile.contact?.firstName?.trim()) {
        errors.push({ field: 'firstName', message: 'First name is required' });
    }
    if (!profile.contact?.lastName?.trim()) {
        errors.push({ field: 'lastName', message: 'Last name is required' });
    }
    if (!profile.contact?.email?.trim()) {
        errors.push({ field: 'email', message: 'Email is required' });
    } else if (!EMAIL_REGEX.test(profile.contact.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    // Phone validation (if provided)
    if (profile.contact?.phone?.trim()) {
        const digits = profile.contact.phone.replace(/\D/g, '');
        if (digits.length !== 10) {
            errors.push({ field: 'phone', message: 'Phone must be 10 digits' });
        }
    }
    
    return errors;
}

// GET /
app.get('/', (req, res) => {
    res.send('Hello world');
});

// GET /api/profile
app.get('/api/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const profile = await ProfileService.getProfileByUserId(userId);
        res.json(profile);
    } catch (error) {
        Logger.error('API Error: GET /api/profile', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/profile
app.post('/api/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const incomingData = req.body;
        const skipContactValidation = req.query.skipContactValidation === 'true';
        
        // Get current profile to merge with
        const currentProfile = await ProfileService.getProfileByUserId(userId);
        
        // Merge incoming data with current profile (for partial updates)
        const newProfile: UserProfile = {
            ...currentProfile,
            ...incomingData,
            contact: incomingData.contact ? { ...currentProfile.contact, ...incomingData.contact } : currentProfile.contact,
            preferences: incomingData.preferences ? { ...currentProfile.preferences, ...incomingData.preferences } : currentProfile.preferences,
            // Handle resume profiles - use incoming if provided, otherwise keep current
            resumeProfiles: incomingData.resumeProfiles !== undefined ? incomingData.resumeProfiles : (currentProfile.resumeProfiles || []),
            lastEditedProfileId: incomingData.lastEditedProfileId !== undefined ? incomingData.lastEditedProfileId : currentProfile.lastEditedProfileId,
        };
        
        // Basic structure validation (only if contact/preferences are in the request)
        if (incomingData.contact && (!newProfile.contact || !newProfile.preferences)) {
            res.status(400).json({ error: 'Invalid profile data', errors: [{ field: 'profile', message: 'Missing contact or preferences' }] });
            return;
        }

        // Validate required fields and formats (skip contact validation if flag is set)
        if (!skipContactValidation && incomingData.contact) {
            const validationErrors = validateProfile(newProfile);
            if (validationErrors.length > 0) {
                res.status(400).json({ 
                    error: 'Validation failed', 
                    errors: validationErrors 
                });
                return;
            }
        }
        
        // Validate resume profiles if provided
        if (incomingData.resumeProfiles !== undefined) {
            const profileErrors = validateResumeProfiles(newProfile.resumeProfiles || []);
            if (profileErrors.length > 0) {
                res.status(400).json({
                    error: 'Resume profile validation failed',
                    errors: profileErrors
                });
                return;
            }
        }

        // Auto-format phone number before saving
        if (newProfile.contact.phone) {
            newProfile.contact.phone = formatPhoneNumber(newProfile.contact.phone);
        }

        await ProfileService.saveProfileByUserId(userId, newProfile);
        res.json({ success: true, message: 'Profile saved' });
    } catch (error) {
        Logger.error('API Error: POST /api/profile', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// POST /api/profile/reset - Dev mode only, bypasses validation
app.post('/api/profile/reset', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        await ProfileService.resetProfileByUserId(userId);
        Logger.info(`Profile reset for user ${userId} (Dev Mode)`);
        res.json({ success: true, message: 'Profile reset successfully' });
    } catch (error) {
        Logger.error('API Error: POST /api/profile/reset', error);
        res.status(500).json({ error: 'Failed to reset profile' });
    }
});

// POST /api/resume/preview
app.post('/api/resume/preview', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const { jobDescription } = req.body;
        const profile = await ProfileService.getProfileByUserId(userId);

        // Mock Job if description provided
        let job: any = undefined;
        if (jobDescription) {
            job = { company: 'Preview Company', title: 'Preview Role', description: jobDescription };
        }

        const pdfBuffer = await ResumeGenerator.generateResume(profile, job);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume-preview.pdf');
        res.send(pdfBuffer);

    } catch (error) {
        Logger.error('API Error: POST /api/resume/preview', error);
        res.status(500).json({ error: 'Failed to generate resume' });
    }
});

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/resume/parse
app.post('/api/resume/parse', authMiddleware, upload.single('resume'), async (req: AuthenticatedRequest, res) => {
    try {
        const fileRequest = req as any;
        if (!fileRequest.file) {
            res.status(400).json({ error: 'No resume file uploaded' });
            return;
        }

        const buffer = fileRequest.file.buffer;
        const mime = fileRequest.file.mimetype;
        const originalName = fileRequest.file.originalname;

        Logger.info(`[Resume Parse] Processing via LLM: ${originalName} (Mime: ${mime})`);

        // Use the centralized LLM-based parser
        // We pass originalName as filePath to help with extension detection if needed
        const parsedData = await ResumeParser.parse(originalName, mime, buffer);

        // Log what data is being returned for debugging
        Logger.info('[Resume Parse] Returning data:', {
            hasContact: !!parsedData.contact,
            contactName: `${parsedData.contact?.firstName || ''} ${parsedData.contact?.lastName || ''}`.trim() || 'N/A',
            hasSummary: !!parsedData.summary,
            experienceCount: parsedData.experience?.length || 0,
            educationCount: parsedData.education?.length || 0,
            skillsCount: parsedData.skills?.length || 0,
            projectsCount: parsedData.projects?.length || 0,
        });

        res.json(parsedData);

    } catch (error) {
        Logger.error('API Error: POST /api/resume/parse', error);
        res.status(500).json({ error: 'Failed to parse resume' });
    }
});

// Import AI Resume Service
import AIResumeService from './modules/resume/ai-service.js';

// POST /api/resume/enhance-bullet
// Enhances a single bullet point using AI
app.post('/api/resume/enhance-bullet', async (req, res) => {
    try {
        const { bullet, context } = req.body;

        Logger.info(`[API] Enhance bullet request. Length: ${bullet?.length}, Context: ${!!context}`);

        if (!bullet || typeof bullet !== 'string') {
            res.status(400).json({ error: 'Missing or invalid bullet parameter' });
            return;
        }

        const enhanced = await AIResumeService.enhanceBullet(bullet, context);
        res.json({ original: bullet, enhanced });

    } catch (error) {
        Logger.error('API Error: POST /api/resume/enhance-bullet', error);
        res.status(500).json({ error: 'Failed to enhance bullet point' });
    }
});

// POST /api/resume/tailor
// Tailors resume bullets for a specific job description
app.post('/api/resume/tailor', async (req, res) => {
    try {
        const { jobDescription, bullets, skills } = req.body;

        if (!jobDescription || typeof jobDescription !== 'string') {
            res.status(400).json({ error: 'Missing or invalid jobDescription parameter' });
            return;
        }

        // Get job fit analysis
        const analysis = await AIResumeService.analyzeJobFit(
            jobDescription,
            bullets || [],
            skills || []
        );

        // Optionally tailor bullets if provided
        let tailoredBullets: string[] = [];
        if (bullets && bullets.length > 0) {
            tailoredBullets = await AIResumeService.tailorBullets(jobDescription, bullets);
        }

        res.json({
            analysis,
            tailoredBullets
        });

    } catch (error) {
        Logger.error('API Error: POST /api/resume/tailor', error);
        res.status(500).json({ error: 'Failed to tailor resume' });
    }
});

// POST /api/queue/resume
app.post('/api/queue/resume', authMiddleware, (req, res) => {
    QueueProcessor.resume();
    res.json({ success: true, message: 'Queue resumed.' });
});

// POST /api/queue/start
app.post('/api/queue/start', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const { limit = 1, dryRun = true } = req.body;
        const userId = req.userId!;
        // Run in background, don't await
        QueueProcessor.processQueueForUser(userId, limit, dryRun);
        res.json({ success: true, message: 'Queue processing started' });
    } catch (error) {
        Logger.error('API Error: POST /api/queue/start', error);
        res.status(500).json({ error: 'Failed to start queue' });
    }
});

// POST /api/queue/stop
app.post('/api/queue/stop', authMiddleware, (req, res) => {
    QueueProcessor.stop();
    res.json({ success: true, message: 'Queue stopping...' });
});

// GET /api/queue/status
app.get('/api/queue/status', authMiddleware, (req, res) => {
    try {
        const status = QueueProcessor.getStatus();
        res.json(status);
    } catch (error) {
        Logger.error('API Error: GET /api/queue/status', error);
        res.status(500).json({ error: 'Failed to fetch queue status' });
    }
});

// GET /api/audit/:jobId - Get audit logs for a specific job
app.get('/api/audit/:jobId', (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId, 10);
        if (isNaN(jobId)) {
            res.status(400).json({ error: 'Invalid job ID' });
            return;
        }

        const stmt = db.prepare(`
            SELECT id, timestamp, action_type as actionType, verdict, details, metadata
            FROM audit_logs
            WHERE job_id = ?
            ORDER BY timestamp DESC
        `);
        const rows = stmt.all(jobId) as any[];

        const auditEntries = rows.map((row) => ({
            id: row.id,
            timestamp: row.timestamp,
            actionType: row.actionType,
            verdict: row.verdict,
            details: JSON.parse(row.details || '{}'),
            metadata: JSON.parse(row.metadata || '{}'),
        }));

        res.json(auditEntries);
    } catch (error) {
        Logger.error('API Error: GET /api/audit/:jobId', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// GET /api/stats (legacy - no auth for backward compatibility)
app.get('/api/stats', (req, res) => {
    try {
        const stats = JobStore.getJobStats();
        res.json(stats);
    } catch (error) {
        Logger.error('API Error: GET /api/stats', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ============ Applications API (Supabase-backed) ============

// GET /api/applications - List applications for the authenticated user
app.get('/api/applications', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const { status, limit = 50, offset = 0 } = req.query;

        const applications = await JobStore.getApplications(userId, {
            status: status as string | undefined,
            limit: Number(limit),
            offset: Number(offset),
        });

        res.json(applications);
    } catch (error) {
        Logger.error('API Error: GET /api/applications', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// GET /api/applications/stats - Get application statistics for the user
app.get('/api/applications/stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const stats = await JobStore.getApplicationStats(userId);
        res.json(stats);
    } catch (error) {
        Logger.error('API Error: GET /api/applications/stats', error);
        res.status(500).json({ error: 'Failed to fetch application stats' });
    }
});

// GET /api/applications/:id - Get a single application
app.get('/api/applications/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const applicationId = req.params.id;

        const application = await JobStore.getApplication(applicationId);

        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }

        // Verify ownership
        if (application.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json(application);
    } catch (error) {
        Logger.error('API Error: GET /api/applications/:id', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

// PATCH /api/applications/:id - Update application status
app.patch('/api/applications/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const applicationId = req.params.id;
        const { queue_status, notes } = req.body;

        // Verify ownership first
        const application = await JobStore.getApplication(applicationId);
        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        if (application.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Update the application
        const updates: any = {};
        if (queue_status) updates.queue_status = queue_status;
        if (notes !== undefined) updates.notes = notes;

        await JobStore.updateApplicationStatus(applicationId, queue_status, updates);

        res.json({ success: true, message: 'Application updated' });
    } catch (error) {
        Logger.error('API Error: PATCH /api/applications/:id', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// POST /api/applications - Create a new application (manual add)
app.post('/api/applications', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const { company, title, job_url, ats_provider, location, is_remote, description } = req.body;

        if (!company || !title || !job_url) {
            res.status(400).json({ error: 'company, title, and job_url are required' });
            return;
        }

        const application = await JobStore.saveApplication({
            user_id: userId,
            company,
            title,
            job_url,
            ats_provider: ats_provider || 'greenhouse',
            ats_job_id: `manual-${Date.now()}`,
            location: location || null,
            is_remote: is_remote || false,
            description: description || null,
            queue_status: 'pending',
            created_at: new Date().toISOString(),
        });

        res.json(application);
    } catch (error) {
        Logger.error('API Error: POST /api/applications', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// DELETE /api/applications/:id - Delete an application
app.delete('/api/applications/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const applicationId = req.params.id;

        // Verify ownership first
        const application = await JobStore.getApplication(applicationId);
        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        if (application.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Delete using Supabase
        const supabase = (await import('./services/supabase.js')).default;
        const { error } = await supabase
            .from('applications')
            .delete()
            .eq('id', applicationId);

        if (error) throw error;

        res.json({ success: true, message: 'Application deleted' });
    } catch (error) {
        Logger.error('API Error: DELETE /api/applications/:id', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

// ============ Global Jobs Catalog API ============

// GET /api/jobs - Get all active jobs from the global catalog with optional filtering
app.get('/api/jobs', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.userId!;
        const {
            search,
            location,
            isRemote,
            employmentType,
            atsProvider,
            company,
            limit = '50',
            offset = '0',
        } = req.query;

        // Build filters
        const filters = {
            search: search as string | undefined,
            location: location as string | undefined,
            isRemote: isRemote === 'true' ? true : isRemote === 'false' ? false : undefined,
            employmentType: employmentType as string | undefined,
            atsProvider: atsProvider as 'greenhouse' | 'lever' | 'ashby' | undefined,
            company: company as string | undefined,
            limit: Math.min(parseInt(limit as string) || 50, 100),
            offset: parseInt(offset as string) || 0,
        };

        // Fetch active jobs from global catalog
        const result = await jobsService.getActiveJobs(filters);

        // Load user profile for match score calculation
        const supabase = (await import('./services/supabase.js')).default;
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Calculate match scores for each job
        let jobsWithScores: (JobRow & { matchScore: number })[] = [];

        if (profileData) {
            const userProfile: UserProfile = {
                contact: {
                    firstName: profileData.first_name || '',
                    lastName: profileData.last_name || '',
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    linkedin: profileData.linkedin || '',
                    github: profileData.github || '',
                    portfolio: profileData.portfolio || '',
                    location: profileData.location || '',
                    role: profileData.role || '',
                    company: profileData.company || '',
                    bio: profileData.bio || '',
                },
                experience: profileData.experience || [],
                education: profileData.education || [],
                preferences: profileData.preferences || {
                    remoteOnly: false,
                    excludedKeywords: [],
                    maxSeniority: [],
                    locations: [],
                },
                skills: profileData.skills || [],
                resumeProfiles: profileData.resume_profiles || [],
            };

            const matchScores = FilterEngine.calculateMatchScores(result.jobs, userProfile);
            jobsWithScores = result.jobs.map(job => ({
                ...job,
                matchScore: matchScores.get(job.id)?.total || 50,
            }));
        } else {
            // No profile, default score
            jobsWithScores = result.jobs.map(job => ({
                ...job,
                matchScore: 50,
            }));
        }

        // Sort by match score (highest first)
        jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

        res.json({
            jobs: jobsWithScores,
            total: result.total,
            hasMore: result.hasMore,
        });
    } catch (error) {
        Logger.error('API Error: GET /api/jobs', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// GET /api/jobs/:id - Get a single job by ID
app.get('/api/jobs/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const jobId = req.params.id;
        const job = await jobsService.getJobById(jobId);

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        res.json(job);
    } catch (error) {
        Logger.error('API Error: GET /api/jobs/:id', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

// GET /api/jobs/stats - Get job catalog statistics
app.get('/api/jobs-stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const stats = await jobsService.getStats();
        res.json(stats);
    } catch (error) {
        Logger.error('API Error: GET /api/jobs-stats', error);
        res.status(500).json({ error: 'Failed to fetch job stats' });
    }
});

// ============ Admin Endpoints ============

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// Middleware to check admin API key
function adminAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const apiKey = req.headers['x-admin-api-key'] as string;
    
    if (!ADMIN_API_KEY) {
        Logger.warn('ADMIN_API_KEY not configured - admin endpoints disabled');
        res.status(503).json({ error: 'Admin endpoints not configured' });
        return;
    }

    if (apiKey !== ADMIN_API_KEY) {
        res.status(401).json({ error: 'Invalid admin API key' });
        return;
    }

    next();
}

// POST /api/admin/scrape - Trigger job scraping (admin only)
app.post('/api/admin/scrape', adminAuthMiddleware, async (req, res) => {
    try {
        const { targets } = req.body;
        const scrapeTargets = targets && Array.isArray(targets) ? targets : getEnabledTargetUrls();

        Logger.info(`Admin triggered scrape for ${scrapeTargets.length} targets`);
        
        // Run ingestion
        const report = await JobIngestionService.run(scrapeTargets);

        res.json({
            success: true,
            report,
        });
    } catch (error) {
        Logger.error('API Error: POST /api/admin/scrape', error);
        res.status(500).json({ error: 'Failed to run scrape' });
    }
});

// POST /api/admin/cleanup - Run job cleanup (mark stale, purge old)
app.post('/api/admin/cleanup', adminAuthMiddleware, async (req, res) => {
    try {
        const { staleDays = 7, purgeDays = 90 } = req.body;

        Logger.info(`Admin triggered cleanup (stale: ${staleDays}d, purge: ${purgeDays}d)`);
        
        const result = await JobIngestionService.runCleanup(staleDays, purgeDays);

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        Logger.error('API Error: POST /api/admin/cleanup', error);
        res.status(500).json({ error: 'Failed to run cleanup' });
    }
});

// GET /api/admin/scrape-targets - Get configured scrape targets and their health
app.get('/api/admin/scrape-targets', adminAuthMiddleware, async (req, res) => {
    try {
        res.json({
            targets: SCRAPE_TARGETS,
            enabledCount: getEnabledTargetUrls().length,
        });
    } catch (error) {
        Logger.error('API Error: GET /api/admin/scrape-targets', error);
        res.status(500).json({ error: 'Failed to fetch scrape targets' });
    }
});

// Start Server
const isMainModule = process.argv[1]?.includes('server');
if (isMainModule) {
    const server = app.listen(PORT, () => {
        Logger.info(`Backend API Server running on port ${PORT}`);
    });
    
    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            Logger.error(`Port ${PORT} is already in use`);
        } else {
            Logger.error('Server error:', err);
        }
        process.exit(1);
    });
}

export default app;
