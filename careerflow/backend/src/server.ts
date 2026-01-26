import express from 'express';
import cors from 'cors';
import ProfileService from './services/profile.js';
import ResumeGenerator from './modules/resume/generator.js';
import QueueProcessor from './modules/queue/processor.js';
import JobStore from './modules/ingestion/job-store.js';
import Logger from './services/logger.js';
import { UserProfile } from './types.js';
import fs from 'fs';
import path from 'path';

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

        const normalizedText = text;

        // Debug Logging
        console.log("=== PARSING START ===");
        console.log(`Total Text Length: ${normalizedText.length}`);
        fs.writeFileSync(path.resolve('parser_debug.log'), `=== PARSE AT ${new Date().toISOString()} ===\n${normalizedText}\n\n`);

        // Helper to find index of section headers
        // Robust Regex: Start of line, optional whitespace, Keyword, optional max 30 chars (to prevent long sentences), End of line or close to it.
        const findSectionIndex = (keywords: string[]) => {
            const pattern = new RegExp(`^[\\s]*(${keywords.join('|')}).{0,30}$`, 'im');
            const match = normalizedText.match(pattern);
            return match ? match.index : -1;
        };

        const expIndex = findSectionIndex(['Experience', 'Work History', 'Employment']);
        const eduIndex = findSectionIndex(['Education', 'Academic', 'Qualifications', 'University']);
        const skillsIndex = findSectionIndex(['Skills', 'Technical Skills', 'Core Competencies', 'Technologies']);

        console.log(`[Parser] Indices - Exp: ${expIndex}, Edu: ${eduIndex}, Skills: ${skillsIndex}`);

        // Sort indices to know which section comes first/next
        const sections = [
            { name: 'experience', index: expIndex },
            { name: 'education', index: eduIndex },
            { name: 'skills', index: skillsIndex }
        ].filter(s => s.index !== undefined && s.index !== -1).sort((a, b) => (a.index!) - (b.index!));

        // Extract content logic (Simplified)
        sections.forEach((section, i) => {
            const start = section.index!;
            const nextSection = sections[i + 1];
            const end = nextSection ? nextSection.index : normalizedText.length;

            // Get content and remove the header line
            const sectionRaw = normalizedText.substring(start, end);
            const firstNewLine = sectionRaw.indexOf('\n');
            let content = (firstNewLine !== -1 ? sectionRaw.substring(firstNewLine) : sectionRaw).trim();

            console.log(`[Parser] Section ${section.name} detected. Length: ${content.length}`);

            if (section.name === 'experience') {
                // Heuristic Parsing for Experience
                // 1. Split by lines
                const safeContent = content || "";
                const lines = safeContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                // 2. Regex for Dates
                const dateRangeRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{1,2}\/\d{4}|\d{4}|Present|Current|Now)/i;

                let currentRole: any = null;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line || !line.trim()) continue;

                    if (dateRangeRegex.test(line)) {
                        // If we found a date line, the PREVIOUS lines might be the description of the *previous* role
                        // and this line starts a NEW role.

                        // Save previous role if exists
                        if (currentRole) {
                            experience.push(currentRole);
                        }

                        let title = "Unknown Role";
                        let company = "Unknown Company";
                        const match = line.match(dateRangeRegex);
                        const dateStr = match ? match[0] : "";
                        const startDate = match?.[1] || "";
                        const endDate = match?.[2] || "";

                        // Strategy 1: Check if the current line contains Title/Company info (Single line format)
                        // Example: "Company – Title Dates" or "Title | Company | Dates"
                        const textWithoutDate = line.replace(dateStr, "").trim();

                        // If significant text remains (> 5 chars), assume Single Line Format
                        if (textWithoutDate.length > 5) {
                            // Try to split
                            const separators = [/—/, /–/, /\|/, / - /, /•/];
                            let parts: string[] = [textWithoutDate];

                            for (const sep of separators) {
                                if (textWithoutDate.split(sep).length > 1) {
                                    parts = textWithoutDate.split(sep).map(s => s.trim()).filter(s => s.length > 0);
                                    break;
                                }
                            }

                            if (parts.length >= 2) {
                                title = parts[parts.length - 1] || "Unknown Role";
                                company = parts[0] || "Unknown Company";
                            } else {
                                if (textWithoutDate.includes(' at ')) {
                                    const parts = textWithoutDate.split(' at ');
                                    title = parts[0] || "Unknown Role";
                                    company = parts[1] || "Unknown Company";
                                } else {
                                    company = textWithoutDate;
                                }
                            }
                        }
                        // Strategy 2: Look at previous lines (Multi-line format)
                        else if (i > 0) {
                            const prevLine = lines[i - 1];
                            if (prevLine) {
                                if (prevLine.includes(' at ')) {
                                    const parts = prevLine.split(' at ');
                                    title = parts[0] || "Unknown Role";
                                    company = parts[1] || "Unknown Company";
                                } else if (prevLine.includes(' | ')) {
                                    const parts = prevLine.split(' | ');
                                    title = parts[0] || "Unknown Role";
                                    company = parts[1] || "Unknown Company";
                                } else {
                                    const parts = prevLine.split(',');
                                    if (parts.length > 1) {
                                        title = parts[0] || "Unknown Role";
                                        company = parts[1] || "Unknown Company";
                                    } else {
                                        title = prevLine;
                                        if (i > 1) {
                                            const prevPrevLine = lines[i - 2];
                                            if (prevPrevLine) {
                                                company = prevPrevLine;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        currentRole = {
                            title: title.trim(),
                            company: company.trim(),
                            startDate,
                            endDate,
                            description: ""
                        };

                    } else if (currentRole) {
                        currentRole.description += line + "\n";
                    }
                }

                // Push last role
                if (currentRole) {
                    experience.push(currentRole);
                }
            } else if (section.name === 'education') {
                // Heuristic Parsing for Education
                const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                // Keywords for Degrees
                const degreeKeywords = ['bachelor', 'master', 'phd', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'mba', 'associate', 'degree', 'computer science', 'bba'];

                let currentEdu: any = null;

                for (const line of lines) {
                    const lower = line.toLowerCase();
                    // If line contains degree keyword, it's likely a degree or same block
                    const hasDegree = degreeKeywords.some(k => lower.includes(k));

                    if (hasDegree) {
                        // If we already have one, push it
                        if (currentEdu) education.push(currentEdu);

                        currentEdu = {
                            institution: "University (Parsed)", // Placeholder or strict extract
                            degree: line,
                            description: ""
                        };
                    } else if (currentEdu) {
                        currentEdu.description += line + "\n";
                    } else {
                        // Maybe this is the university name appearing BEFORE the degree?
                        // Treat as start of potential block if it doesn't look like a degree
                        currentEdu = {
                            institution: line,
                            degree: "Degree Unknown",
                            description: ""
                        };
                    }
                }
                if (currentEdu) education.push(currentEdu);

            } else if (section.name === 'skills') {
                // Skills Heuristic: Strict Filtering

                const KNOWN_SKILLS = new Set([
                    // Languages
                    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin', 'php', 'html', 'css', 'sql', 'nosql', 'bash', 'shell',
                    // Frontend
                    'react', 'reactjs', 'vue', 'vuejs', 'angular', 'svelte', 'next.js', 'nuxt', 'redux', 'mobx', 'tailwind', 'sass', 'less', 'webpack', 'vite', 'graphql',
                    // Backend
                    'node', 'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'rails', 'spring', 'spring boot', '.net', 'asp.net',
                    // Data / Cloud / Tools
                    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'jira', 'confluence', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
                    // Concepts
                    'rest', 'api', 'ci/cd', 'agile', 'scrum', 'oop', 'mvc', 'microservices', 'serverless'
                ]);

                const STOP_PHRASES = [
                    'skills', 'experience', 'working', 'knowledge', 'proficient', 'familiar', 'technologies', 'tools', 'languages', 'frameworks',
                    'solutions', 'scalable', 'complicated', 'simple', 'clean', 'efficient', 'maintainable', 'robust'
                ];

                // Split by common separators
                // \n, ",", "•", "|", "·"
                const rawTokens = content.split(/[\n,•|·]/);

                const validSkills = new Set<string>();

                for (const token of rawTokens) {
                    const cleanToken = token.trim();
                    const lowerToken = cleanToken.toLowerCase();

                    // 1. Hard Rejects
                    if (cleanToken.length < 2) continue; // "C" is rare alone, usually "C++" which is > 2, but "R" exists. Heuristic: Skip 1 char for now unless specific whitelist.
                    if (cleanToken.length > 30) continue; // Too long -> Sentence

                    // Email/Phone/Zip Check (Basic)
                    if (/@/.test(cleanToken)) continue; // Email
                    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(cleanToken)) continue; // Phone
                    if (/\b\d{5}\b/.test(cleanToken)) continue; // Zip code like 75089
                    if (/^\d+$/.test(cleanToken)) continue; // Just numbers

                    // 2. Stop Phrase Check
                    if (STOP_PHRASES.some(stop => lowerToken.includes(stop))) continue;

                    // 3. Whitelist Check (Prioritize)
                    if (KNOWN_SKILLS.has(lowerToken)) {
                        validSkills.add(cleanToken);
                        continue;
                    }
                }

                skills.push(...Array.from(validSkills));
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
