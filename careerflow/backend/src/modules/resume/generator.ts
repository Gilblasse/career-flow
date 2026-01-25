import PDFDocument from 'pdfkit';
import { UserProfile, Job } from '../../types.js';
import Logger from '../../services/logger.js';

export class ResumeGenerator {

    /**
     * Generates a PDF resume for the given profile, optionally tailored to a job.
     */
    public async generateResume(profile: UserProfile, job?: Job): Promise<Buffer> {
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

            // 2. Summary
            this.addSummary(doc, profile, job);

            // 3. Skills
            this.addSkills(doc, profile);

            // 4. Experience (Static for now, or TODO Add to Profile)
            this.addExperience(doc);

            // 5. Education (Static for now)
            this.addEducation(doc);

            doc.end();
            Logger.info('Generated resume PDF.');
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

    private addSummary(doc: PDFKit.PDFDocument, profile: UserProfile, job?: Job) {
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        let summary = `Experienced professional with strong expertise in ${profile.skills.slice(0, 3).join(', ')}. `;

        if (job) {
            summary += `Seeking to leverage skills in ${job.title} role at ${job.company}. `;
        } else {
            summary += `Passionate about building scalable solutions and delivering high-quality software. `;
        }

        doc.text(summary, { align: 'justify' });
        doc.moveDown();
    }

    private addSkills(doc: PDFKit.PDFDocument, profile: UserProfile) {
        doc.fontSize(14).font('Helvetica-Bold').text('TECHNICAL SKILLS');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        // Simple comma separated list
        doc.text(profile.skills.join(' • '), { align: 'left' });
        doc.moveDown();
    }

    private addExperience(doc: PDFKit.PDFDocument) {
        doc.fontSize(14).font('Helvetica-Bold').text('EXPERIENCE');
        doc.moveDown(0.5);

        // Placeholder 1
        doc.fontSize(12).font('Helvetica-Bold').text('Senior Software Engineer');
        doc.fontSize(11).font('Helvetica-Oblique').text('Tech Corp Inc. | 2020 - Present');
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').list([
            'Led development of microservices architecture serving 1M+ users.',
            'Optimized database queries reducing latency by 40%.',
            'Mentored junior developers and established code quality standards.'
        ]);
        doc.moveDown();

        // Placeholder 2
        doc.fontSize(12).font('Helvetica-Bold').text('Software Developer');
        doc.fontSize(11).font('Helvetica-Oblique').text('Startup Solutions | 2017 - 2020');
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').list([
            'Developed full-stack features using React and Node.js.',
            'Collaborated with product team to define requirements and user flows.'
        ]);
        doc.moveDown();
    }

    private addEducation(doc: PDFKit.PDFDocument) {
        doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
        doc.moveDown(0.5);

        doc.fontSize(12).font('Helvetica-Bold').text('Bachelor of Science in Computer Science');
        doc.fontSize(11).font('Helvetica-Oblique').text('University of Tech | 2013 - 2017');
    }

    private addDivider(doc: PDFKit.PDFDocument) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(0.5);
        doc.strokeColor('black'); // Reset
    }
}

export default new ResumeGenerator();
