import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ProfileService, { validateResumeProfiles } from './services/profile.js';
import ResumeGenerator from './modules/resume/generator.js';
import ResumeParser from './modules/resume/parser.js';
import QueueProcessor from './modules/queue/processor.js';
import JobStore from './modules/ingestion/job-store.js';
import db from './services/db.js';
import Logger from './services/logger.js';
import { UserProfile, ResumeProfile } from './types.js';
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
app.get('/api/profile', (req, res) => {
    try {
        const profile = ProfileService.getConfig();
        res.json(profile);
    } catch (error) {
        Logger.error('API Error: GET /api/profile', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/profile
app.post('/api/profile', (req, res) => {
    try {
        const incomingData = req.body;
        const skipContactValidation = req.query.skipContactValidation === 'true';
        
        // Get current profile to merge with
        const currentProfile = ProfileService.getConfig();
        
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

        ProfileService.saveConfig(newProfile);
        res.json({ success: true, message: 'Profile saved' });
    } catch (error) {
        Logger.error('API Error: POST /api/profile', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// POST /api/profile/reset - Dev mode only, bypasses validation
app.post('/api/profile/reset', (req, res) => {
    try {
        const emptyProfile: UserProfile = {
            contact: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                linkedin: '',
                location: '',
            },
            experience: [],
            education: [],
            preferences: {
                remoteOnly: false,
                excludedKeywords: [],
                maxSeniority: [],
                locations: [],
            },
            skills: [],
            resumeProfiles: [],
        };

        ProfileService.saveConfig(emptyProfile);
        Logger.info('Profile reset to empty state (Dev Mode)');
        res.json({ success: true, message: 'Profile reset successfully' });
    } catch (error) {
        Logger.error('API Error: POST /api/profile/reset', error);
        res.status(500).json({ error: 'Failed to reset profile' });
    }
});

// POST /api/resume/preview
app.post('/api/resume/preview', async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const profile = ProfileService.getConfig();

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
app.post('/api/resume/parse', upload.single('resume'), async (req, res) => {
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
app.post('/api/queue/resume', (req, res) => {
    QueueProcessor.resume();
    res.json({ success: true, message: 'Queue resumed.' });
});

// POST /api/queue/start
app.post('/api/queue/start', async (req, res) => {
    try {
        const { limit = 1, dryRun = true } = req.body;
        // Run in background, don't await
        QueueProcessor.processQueue(limit, dryRun);
        res.json({ success: true, message: 'Queue processing started' });
    } catch (error) {
        Logger.error('API Error: POST /api/queue/start', error);
        res.status(500).json({ error: 'Failed to start queue' });
    }
});

// POST /api/queue/stop
app.post('/api/queue/stop', (req, res) => {
    QueueProcessor.stop();
    res.json({ success: true, message: 'Queue stopping...' });
});

// GET /api/queue/status
app.get('/api/queue/status', (req, res) => {
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
    } catch (error) {
        Logger.error('API Error: GET /api/queue/status', error);
        res.status(500).json({ error: 'Failed to fetch queue status' });
    }
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
    try {
        const stats = JobStore.getJobStats();
        res.json(stats);
    } catch (error) {
        Logger.error('API Error: GET /api/stats', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Start Server
if (process.argv[1] === import.meta.filename) {
    app.listen(PORT, () => {
        Logger.info(`Backend API Server running on port ${PORT}`);
    });
}

export default app;
