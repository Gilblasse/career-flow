import PDFDocument from 'pdfkit';
import { UserProfile, Job, Experience, Education, ResumeProfile } from '../../types.js';
import Logger from '../../services/logger.js';
import ResumeEngine from './engine.js';

export class ResumeGenerator {

    /**
     * Generates a PDF resume for the given profile, optionally tailored to a job.
     * 
     * Uses the user's actual experience and education data from their profile.
     * If a job is provided, selects the best matching resume profile for tailoring.
     */
    public async generateResume(profile: UserProfile, job?: Job): Promise<Buffer> {
        // Select resume profile if job is provided
        let selectedProfile: ResumeProfile | undefined;
        if (job && profile.resumeProfiles && profile.resumeProfiles.length > 0) {
            const selection = ResumeEngine.selectResumeProfile(job, profile);
            selectedProfile = profile.resumeProfiles.find(p => p.name === selection.selectedProfileName);
        } else if (profile.resumeProfiles && profile.resumeProfiles.length > 0) {
            selectedProfile = profile.resumeProfiles[0];
        }

        // Auto-generate a default profile if none exists
        if (!selectedProfile && (!profile.resumeProfiles || profile.resumeProfiles.length === 0)) {
            selectedProfile = ResumeEngine.generateDefaultProfile(profile);
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            // --- Content Generation --- //

            // 1. Header (Contact Info)
            this.addHeader(doc, profile);

            // 2. Summary (from selected resume profile or generated)
            this.addSummary(doc, profile, job, selectedProfile);

            // 3. Skills
            this.addSkills(doc, profile);

            // 4. Experience (from profile)
            this.addExperience(doc, profile);

            // 5. Education (from profile)
            this.addEducation(doc, profile);

            doc.end();
            Logger.info(`Generated resume PDF using profile: ${selectedProfile?.name || 'default'}`);
        });
    }

    private addHeader(doc: PDFKit.PDFDocument, profile: UserProfile) {
        doc.fontSize(24).font('Helvetica-Bold').text(`${profile.contact.firstName} ${profile.contact.lastName}`, { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        const contactLine = [
            profile.contact.location,
            profile.contact.phone,
            profile.contact.email,
            profile.contact.linkedin,
            profile.contact.portfolio
        ].filter(Boolean).join(' | ');

        doc.text(contactLine, { align: 'center' });
        doc.moveDown(1.5);
        this.addDivider(doc);
    }

    private addSummary(doc: PDFKit.PDFDocument, profile: UserProfile, job?: Job, resumeProfile?: ResumeProfile) {
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        let summary = '';

        // Use resume profile summary if available
        if (resumeProfile?.summary) {
            summary = resumeProfile.summary;
        } else {
            // Generate summary from profile data
            const skills = profile.skills?.slice(0, 3) || [];
            const yearsExp = this.estimateYearsExperience(profile.experience || []);
            
            if (yearsExp > 0 && skills.length > 0) {
                summary = `Experienced professional with ${yearsExp}+ years of expertise in ${skills.join(', ')}. `;
            } else if (skills.length > 0) {
                summary = `Professional with strong expertise in ${skills.join(', ')}. `;
            } else {
                summary = 'Dedicated professional committed to delivering high-quality results. ';
            }
        }

        // Add job-specific tailoring
        if (job) {
            summary += ` Seeking to contribute to ${job.company} as a ${job.title}.`;
        }

        doc.text(summary.trim(), { align: 'justify' });
        doc.moveDown();
    }

    private addSkills(doc: PDFKit.PDFDocument, profile: UserProfile) {
        const skills = profile.skills || [];
        if (skills.length === 0) return;

        doc.fontSize(14).font('Helvetica-Bold').text('TECHNICAL SKILLS');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        // Simple bullet-separated list
        doc.text(skills.join(' • '), { align: 'left' });
        doc.moveDown();
    }

    private addExperience(doc: PDFKit.PDFDocument, profile: UserProfile) {
        const experience = profile.experience || [];
        if (experience.length === 0) return;

        doc.fontSize(14).font('Helvetica-Bold').text('EXPERIENCE');
        doc.moveDown(0.5);

        for (const exp of experience) {
            // Job Title
            doc.fontSize(12).font('Helvetica-Bold').text(exp.title);
            
            // Company and dates
            const dateRange = this.formatDateRange(exp.startDate, exp.endDate, exp.current);
            doc.fontSize(11).font('Helvetica-Oblique').text(`${exp.company} | ${dateRange}`);
            doc.moveDown(0.3);

            // Description
            if (exp.description) {
                doc.fontSize(11).font('Helvetica').text(exp.description);
                doc.moveDown(0.2);
            }

            // Highlights/bullets
            if (exp.highlights && exp.highlights.length > 0) {
                doc.fontSize(11).font('Helvetica').list(exp.highlights);
            }

            doc.moveDown();
        }
    }

    private addEducation(doc: PDFKit.PDFDocument, profile: UserProfile) {
        const education = profile.education || [];
        if (education.length === 0) return;

        doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
        doc.moveDown(0.5);

        for (const edu of education) {
            doc.fontSize(12).font('Helvetica-Bold').text(edu.degree);
            
            let eduLine = edu.school;
            if (edu.graduationYear) {
                eduLine += ` | ${edu.graduationYear}`;
            }
            if (edu.gpa) {
                eduLine += ` | GPA: ${edu.gpa}`;
            }
            
            doc.fontSize(11).font('Helvetica-Oblique').text(eduLine);
            doc.moveDown(0.5);
        }
    }

    private addDivider(doc: PDFKit.PDFDocument) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(0.5);
        doc.strokeColor('black'); // Reset
    }

    private formatDateRange(startDate?: string, endDate?: string | null, current?: boolean): string {
        const start = startDate ? this.formatDate(startDate) : 'N/A';
        
        if (current) {
            return `${start} - Present`;
        }
        
        const end = endDate ? this.formatDate(endDate) : 'Present';
        return `${start} - ${end}`;
    }

    private formatDate(dateStr: string): string {
        // Handle YYYY-MM format
        const [year, month] = dateStr.split('-');
        if (month) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIdx = parseInt(month, 10) - 1;
            if (monthIdx >= 0 && monthIdx < 12) {
                return `${monthNames[monthIdx]} ${year}`;
            }
        }
        return year || dateStr;
    }

    private estimateYearsExperience(experience: Experience[]): number {
        if (experience.length === 0) return 0;

        let totalMonths = 0;
        const now = new Date();

        for (const exp of experience) {
            if (!exp.startDate) continue;

            const start = new Date(exp.startDate);
            const end = exp.current || !exp.endDate ? now : new Date(exp.endDate);
            
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            totalMonths += Math.max(0, months);
        }

        return Math.floor(totalMonths / 12);
    }
}

export default new ResumeGenerator();
