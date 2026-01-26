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
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import WordExtractor from 'word-extractor';

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

        const mime = fileRequest.file.mimetype;
        const ext = path.extname(fileRequest.file.originalname).toLowerCase();

        Logger.info(`[Resume Parse] Processing: ${fileRequest.file.originalname} (Mime: ${mime}, Ext: ${ext})`);

        if (mime === 'application/pdf' || ext === '.pdf') {
            // pdf-parse v2 exports PDFParse class
            const { PDFParse } = await import('pdf-parse');
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            text = result.text;
        } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
            // DOCX parsing with mammoth
            const result = await mammoth.extractRawText({ buffer: buffer });
            text = result.value;
        } else if (mime === 'application/msword' || ext === '.doc') {
            // DOC parsing with word-extractor
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(buffer);
            text = extracted.getBody();
        } else {
            // Fallback for text files
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
        const projects: any[] = [];

        const normalizedText = text;

        // Debug Logging
        console.log("=== PARSING START ===");
        console.log(`Total Text Length: ${normalizedText.length}`);
        fs.writeFileSync(path.resolve('parser_debug.log'), `=== PARSE AT ${new Date().toISOString()} ===\n${normalizedText}\n\n`);

        // Helper to find index of section headers
        // Update: Allow prefix words like "Professional" (max 20 chars before keyword)
        const findSectionIndex = (keywords: string[]) => {
            // Look for lines that contain the keyword, are relatively short (header-like), 
            // and allow some prefix (e.g. "Professional Experience")
            const pattern = new RegExp(`^.{0,20}\\b(${keywords.join('|')})\\b.{0,30}$`, 'im');
            const match = normalizedText.match(pattern);
            return match ? match.index : -1;
        };

        const expIndex = findSectionIndex(['Experience', 'Work History', 'Employment']);
        const eduIndex = findSectionIndex(['Education', 'Academic', 'Qualifications', 'University']);
        const skillsIndex = findSectionIndex(['Skills', 'Technical Skills', 'Core Competencies', 'Technologies']);
        const projectsIndex = findSectionIndex(['Projects', 'Personal Projects', 'Side Projects', 'Portfolio']);

        console.log(`[Parser] Indices - Exp: ${expIndex}, Edu: ${eduIndex}, Skills: ${skillsIndex}, Projects: ${projectsIndex}`);

        // Sort indices to know which section comes first/next
        const sections = [
            { name: 'experience', index: expIndex },
            { name: 'education', index: eduIndex },
            { name: 'skills', index: skillsIndex },
            { name: 'projects', index: projectsIndex }
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
                // Approach: Detect potential job/role entries by looking for:
                // 1. Lines with date ranges (e.g., "2015 - Present")
                // 2. Lines that look like role titles (contain keywords like "Engineer", "Developer", etc.)
                // 3. Lines that look like company names (short lines, possibly with location indicators)

                const safeContent = content || "";
                const lines = safeContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                // Date detection regex - more flexible
                const monthNames = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
                const datePartsPattern = `(${monthNames}\\s*\\d{4}|\\d{4}\\s*${monthNames}|\\d{1,2}/\\d{4}|\\d{4})`;
                const dateRangeRegex = new RegExp(`${datePartsPattern}\\s*[-–\\sto]+\\s*(${datePartsPattern}|Present|Current|Now|present)`, 'i');

                // Role title keywords
                const roleTitleKeywords = ['engineer', 'developer', 'architect', 'manager', 'lead', 'director', 'analyst', 'consultant', 'specialist', 'coordinator', 'administrator', 'designer', 'intern'];

                const isRoleTitle = (line: string) => {
                    const lower = line.toLowerCase();
                    return roleTitleKeywords.some(k => lower.includes(k)) && line.length < 80;
                };

                let currentRole: any = null;
                let lastCompanyLine: string | null = null;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line || !line.trim()) continue;

                    const hasDateRange = dateRangeRegex.test(line);
                    const looksLikeRoleTitle = isRoleTitle(line);

                    // Check if this line starts a new entry (has date or is a role title)
                    if (hasDateRange || looksLikeRoleTitle) {
                        // Save previous role if exists
                        if (currentRole) {
                            experience.push(currentRole);
                        }

                        let title = "Unknown Role";
                        let company = "Unknown Company";
                        let startDate = "";
                        let endDate = "";

                        // Extract dates if present
                        const dateMatch = line.match(dateRangeRegex);
                        if (dateMatch) {
                            startDate = dateMatch[1] || "";
                            endDate = dateMatch[2] || "";
                        }

                        // Remove date string from line to get title/company
                        const textWithoutDate = dateMatch ? line.replace(dateMatch[0], '').trim() : line;
                        // Clean up parentheses that were part of date formatting
                        const cleanedText = textWithoutDate.replace(/[()]+$/, '').replace(/^[()]+/, '').trim();

                        if (looksLikeRoleTitle) {
                            // This line is a role title
                            title = cleanedText || line;
                            // Look for company in previous line if it's not a role title and doesn't have dates
                            if (i > 0 && lastCompanyLine) {
                                company = lastCompanyLine;
                            } else if (i > 0) {
                                const prevLine = lines[i - 1];
                                if (prevLine && !isRoleTitle(prevLine) && !dateRangeRegex.test(prevLine)) {
                                    company = prevLine;
                                }
                            }
                        } else if (hasDateRange && cleanedText.length > 5) {
                            // Line has dates and other text - could be "Company 2015 - Present" or "Role 2020 - 2023"
                            if (isRoleTitle(cleanedText)) {
                                title = cleanedText;
                                if (lastCompanyLine) company = lastCompanyLine;
                            } else {
                                // Assume it's a company line with dates
                                company = cleanedText;
                                // Check next line for role title
                                if (i + 1 < lines.length && isRoleTitle(lines[i + 1])) {
                                    // Skip processing this as a full entry, save company for next iteration
                                    lastCompanyLine = cleanedText;
                                    currentRole = null;
                                    continue;
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
                        lastCompanyLine = null; // Reset

                    } else {
                        // This line is either a company name or description
                        // Check if it looks like a company name (short, possibly with location)
                        const looksLikeCompany = line.length < 80 && !line.startsWith('•') && !line.startsWith('-') &&
                            (line.includes('(') || line.includes('Inc') || line.includes('LLC') ||
                                line.includes('Corp') || line.includes('Department') || line.includes('Agency') ||
                                line.includes('U.S.') || line.includes('University'));

                        if (looksLikeCompany && !currentRole) {
                            // Save as potential company for the next role
                            lastCompanyLine = line;
                        } else if (currentRole) {
                            // It's description text - preserve as bullet points
                            // Check if line already starts with a bullet marker
                            const hasBullet = /^[•\-\*\u2022\u25E6\u25AA]/.test(line);
                            if (hasBullet) {
                                currentRole.description += line + "\n";
                            } else if (line.length > 10) {
                                // Add bullet for substantial description lines
                                currentRole.description += "• " + line + "\n";
                            }
                        }
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

                // Date extraction pattern
                const monthPattern = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
                const eduDateRangeRegex = new RegExp(`(${monthPattern}\\s*\\d{4}|\\d{4})\\s*[-–to]+\\s*(${monthPattern}\\s*\\d{4}|\\d{4}|Present)`, 'i');

                let currentEdu: any = null;

                for (const line of lines) {
                    const lower = line.toLowerCase();
                    // If line contains degree keyword, it's likely a degree or same block
                    const hasDegree = degreeKeywords.some(k => lower.includes(k));

                    if (hasDegree) {
                        // Extract dates FIRST before stripping them
                        let startDate = "";
                        let endDate = "";
                        const dateMatch = line.match(eduDateRangeRegex);
                        if (dateMatch) {
                            startDate = dateMatch[1] || "";
                            endDate = dateMatch[2] || "";
                        }

                        // Now strip date-like patterns for degree/institution extraction
                        const dateRangePattern = /\|?\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*\d{4}\s*[-–to]*\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\s*\d{4}|Present)?/gi;

                        let cleanedLine = line.replace(dateRangePattern, '').trim();
                        cleanedLine = cleanedLine.replace(/\b\d{4}\b/g, '').trim();
                        cleanedLine = cleanedLine.replace(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/gi, '').trim();

                        // Split to find degree and institution
                        const separators = [/ – /, / - /, /,/];
                        let parsedDegree = cleanedLine;
                        let parsedInstitution = "University (Parsed)";

                        for (const sep of separators) {
                            const parts = cleanedLine.split(sep).map(p => p.trim()).filter(p => p.length > 0);
                            if (parts.length > 1) {
                                const degreePartIndex = parts.findIndex(p => degreeKeywords.some(k => p.toLowerCase().includes(k)));
                                if (degreePartIndex !== -1) {
                                    parsedDegree = parts[degreePartIndex].trim();
                                    parsedInstitution = parts.filter((_, i) => i !== degreePartIndex).join(', ').trim();
                                    parsedInstitution = parsedInstitution.replace(/[|–-]+/g, '').replace(/\s{2,}/g, ' ').trim();
                                    parsedInstitution = parsedInstitution.replace(/^[,\s]+|[,\s]+$/g, '').trim();
                                    break;
                                }
                            }
                        }

                        parsedDegree = parsedDegree.replace(/[|]+/g, '').trim();

                        if (currentEdu) education.push(currentEdu);

                        currentEdu = {
                            institution: parsedInstitution,
                            degree: parsedDegree,
                            startDate,
                            endDate
                        };
                    } else if (currentEdu) {
                        // Ignore additional description lines for education
                    } else {
                        currentEdu = {
                            institution: line,
                            degree: "Degree Unknown",
                            startDate: "",
                            endDate: ""
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
            } else if (section.name === 'projects') {
                // Heuristic Parsing for Projects
                const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                // Project name patterns: Short lines, possibly with links, or lines before bullet points
                let currentProject: any = null;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Check if line looks like a project title (short, no bullet, not a description)
                    const isBullet = /^[•\-\*]/.test(line);
                    const isShortTitle = line.length < 60 && !isBullet;
                    const hasLink = line.includes('http') || line.includes('github');

                    if (isShortTitle && !isBullet) {
                        // Likely a project title
                        if (currentProject) {
                            projects.push(currentProject);
                        }
                        currentProject = {
                            name: line,
                            description: "",
                            technologies: []
                        };
                    } else if (currentProject) {
                        // It's a description line
                        const hasBullet = /^[•\-\*]/.test(line);
                        if (hasBullet) {
                            currentProject.description += line + "\n";
                        } else if (line.length > 10) {
                            currentProject.description += "• " + line + "\n";
                        }
                    }
                }
                if (currentProject) {
                    projects.push(currentProject);
                }
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
            skills,
            projects
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
