import express from 'express';
import cors from 'cors';
import ProfileService from './services/profile.js';
import ResumeGenerator from './modules/resume/generator.js';
import QueueProcessor from './modules/queue/processor.js';
import JobStore from './modules/ingestion/job-store.js';
import Logger from './services/logger.js';
import { UserProfile } from './types.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
        const newProfile = req.body as UserProfile;
        // Basic validation logic could go here
        if (!newProfile.contact || !newProfile.preferences) {
            res.status(400).json({ error: 'Invalid profile data' });
            return
        }

        ProfileService.saveConfig(newProfile);
        res.json({ success: true, message: 'Profile saved' });
    } catch (error) {
        Logger.error('API Error: POST /api/profile', error);
        res.status(500).json({ error: 'Failed to save profile' });
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
        let text = '';

        if (fileRequest.file.mimetype === 'application/pdf') {
            // pdf-parse v2 exports PDFParse class
            const { PDFParse } = await import('pdf-parse');
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            text = result.text;
        } else {
            // Fallback for text files or future DOCX support
            text = buffer.toString('utf-8');
        }

        // Basic Regex Parsing Logic

        // 1. Email
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        const emailMatch = text.match(emailRegex);
        const email = emailMatch ? emailMatch[0] : '';

        // 2. Phone
        const phoneRegex = /(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
        const phoneMatch = text.match(phoneRegex);
        const phone = phoneMatch ? phoneMatch[0] : '';

        // 3. Name (Heuristic: First line or capital words at top)
        // Very basic: take first non-empty line
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const name = (lines.length > 0 ? lines[0] : '') || '';
        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        // 4. Extract Sections (Experience, Education, Skills) logic
        // We look for keywords "Experience", "Education", "Skills" and take content between them.

        const experience: any[] = [];
        const education: any[] = [];
        const skills: string[] = [];

        const normalizedText = text; // Keep case for extraction but lower for search might be safer?

        // Helper to find index of section headers
        const findSectionStart = (keyword: string) => {
            const regex = new RegExp(`^${keyword}`, 'im');
            // Simple approach: indexOf might be enough if we assume standard headers
            return normalizedText.toLowerCase().indexOf(keyword.toLowerCase());
        };

        const expIndex = findSectionStart('Experience');
        const eduIndex = findSectionStart('Education');
        const skillsIndex = findSectionStart('Skills');

        // Sort indices to know which section comes first/next
        const sections = [
            { name: 'experience', index: expIndex },
            { name: 'education', index: eduIndex },
            { name: 'skills', index: skillsIndex }
        ].filter(s => s.index !== -1).sort((a, b) => a.index - b.index);

        // Extract content logic (Simplified)
        sections.forEach((section, i) => {
            const start = section.index;
            const nextSection = sections[i + 1];
            const end = nextSection ? nextSection.index : normalizedText.length;

            // +10 to skip the header itself loosely
            let content = normalizedText.substring(start, end).replace(new RegExp(section.name, 'i'), '').trim();

            if (section.name === 'experience') {
                // Try to split by date patterns or newlines to guess items
                // For now, put a placeholder if content exists.
                if (content.length > 50) {
                    experience.push({
                        title: "Parsed Role (Review Required)",
                        company: "Parsed Company",
                        description: content.substring(0, 500) + "..." // Truncate
                    });
                }
            } else if (section.name === 'education') {
                if (content.length > 20) {
                    education.push({
                        institution: "Parsed Institution",
                        degree: "Parsed Degree",
                        description: content.substring(0, 200)
                    });
                }
            } else if (section.name === 'skills') {
                // Split by commas or bullets
                const extracted = content.split(/,|•|\n/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30);
                skills.push(...extracted);
            }
        });

        res.json({
            contact: {
                firstName,
                lastName,
                email,
                phone
            },
            experience,
            education,
            skills
        });

    } catch (error) {
        Logger.error('API Error: POST /api/resume/parse', error);
        res.status(500).json({ error: 'Failed to parse resume' });
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
