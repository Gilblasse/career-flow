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
