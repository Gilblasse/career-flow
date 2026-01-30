import fs from 'fs';
import { createRequire } from 'module';
import Logger from '../../services/logger.js';
import { ParsedResumeData } from './types.js';
import LLMService from '../../services/llm.js';
import { z } from 'zod';
import { Experience, Education } from '../../types.js';
import { analyzeDescriptionPattern, extractBulletsFromDescription } from '../../utils/text-processing.js';

const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

// ============ Phone Formatting Helper ============

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

// --- Zod Schemas ---

const ExperienceSchema = z.object({
    title: z.string().describe("Job title or role"),
    company: z.string().describe("Company or organization name"),
    location: z.string().nullable().describe("City, State or Remote"),
    startDate: z.string().nullable().describe("Start date, e.g. 'Jan 2020' or '2020'"),
    endDate: z.string().nullable().describe("End date, e.g. 'Present', 'Dec 2021'"),
    current: z.boolean().nullable().describe("True if currently working here"),
    description: z.string().describe("Bulleted list of responsibilities and achievements")
});

const EducationSchema = z.object({
    institution: z.string().describe("University or School name"),
    degree: z.string().describe("Degree name, e.g. 'BS Computer Science'"),
    fieldOfStudy: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    description: z.string().nullable()
});

const ProjectSchema = z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()).describe("List of tech used in this project")
});

const ContactSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
    linkedin: z.string(),
    github: z.string().nullable(),
    portfolio: z.string().nullable(),
    location: z.string().describe("City, State/Country")
});

const ResumeExtractionSchema = z.object({
    contact: ContactSchema,
    summary: z.string().nullable().describe("Professional summary, objective statement, or 'About Me' section from the resume"),
    experience: z.array(ExperienceSchema),
    education: z.array(EducationSchema),
    skills: z.array(z.string()).describe("List of technical skills, languages, tools"),
    projects: z.array(ProjectSchema).nullable()
});

export class ResumeParser {

    /**
     * Parses a resume file from a given path.
     * Detects format based on extension/mimeType.
     */
    public async parse(filePath: string, mimeType: string, buffer?: Buffer): Promise<ParsedResumeData> {
        let rawText = '';

        try {
            // Read file if buffer not provided
            const fileBuffer = buffer || fs.readFileSync(filePath);

            if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
                rawText = await this.parsePDF(fileBuffer);
            } else if (
                mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                filePath.toLowerCase().endsWith('.docx')
            ) {
                rawText = await this.parseDOCX(fileBuffer);
            } else if (
                mimeType === 'application/msword' ||
                filePath.toLowerCase().endsWith('.doc')
            ) {
                rawText = await this.parseDOC(filePath);
            } else {
                // Fallback for text
                rawText = fileBuffer.toString('utf-8');
            }

            Logger.info(`Parsed raw text (len: ${rawText.length}). Sending to LLM...`);

            // LLM Extraction
            const extractedData = await LLMService.extractStructuredData(
                rawText,
                ResumeExtractionSchema,
                "ResumeExtraction",
                "You are an expert Resume Parser. Extract the candidate's details into the structured format. Be precise. Normalize dates to 'Mon YYYY' if possible. Fix capitalization. Look for a Professional Summary, Objective, or About Me section for the summary field."
            );

            // Analyze description patterns across all experiences
            const dominantPattern = analyzeDescriptionPattern(extractedData.experience);

            // Debug: Log the extracted summary
            Logger.info(`[Resume Parser] Extracted summary: ${extractedData.summary || '(none)'}`);

            // Map to ParsedResumeData
            const result: ParsedResumeData = {
                rawText: rawText.trim(),
                mimeType,
                contact: {
                    firstName: extractedData.contact.firstName,
                    lastName: extractedData.contact.lastName,
                    email: extractedData.contact.email,
                    phone: formatPhoneNumber(extractedData.contact.phone || ''),
                    linkedin: extractedData.contact.linkedin || '',
                    location: extractedData.contact.location || '',
                    // Use spread to handle optional properties correctly for exactOptionalPropertyTypes
                    ...(extractedData.contact.github ? { github: extractedData.contact.github } : {}),
                    ...(extractedData.contact.portfolio ? { portfolio: extractedData.contact.portfolio } : {})
                },
                // Professional summary/objective extracted from the resume
                summary: extractedData.summary || undefined,
                experience: extractedData.experience.map(e => ({
                    title: e.title,
                    company: e.company,
                    description: e.description,
                    bullets: extractBulletsFromDescription(e.description, dominantPattern),
                    ...(e.location ? { location: e.location } : {}),
                    ...(e.startDate ? { startDate: e.startDate } : {}),
                    ...(e.endDate ? { endDate: e.endDate } : {}),
                    current: e.current || (e.endDate?.toLowerCase() === 'present')
                })),
                education: extractedData.education.map(e => ({
                    institution: e.institution,
                    degree: e.degree,
                    ...(e.fieldOfStudy ? { fieldOfStudy: e.fieldOfStudy } : {}),
                    ...(e.startDate ? { startDate: e.startDate } : {}),
                    ...(e.endDate ? { endDate: e.endDate } : {}),
                    ...(e.description ? { description: e.description } : {})
                })),
                skills: extractedData.skills,
                projects: extractedData.projects || []
            };

            return result;

        } catch (error) {
            Logger.error(`Failed to parse resume at ${filePath}:`, error);
            throw error;
        }
    }

    private async parsePDF(buffer: Buffer): Promise<string> {
        try {
            // Reverting to the logic that was working in server.ts
            // pdf-parse library seems to export a class in the version we are using
            const pdfModule = await import('pdf-parse');
            // @ts-ignore
            const PDFParse = pdfModule.PDFParse || pdfModule.default || pdfModule;

            // Check if it's a class or function
            if (typeof PDFParse === 'function' && PDFParse.prototype && PDFParse.prototype.getText) {
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                return result.text;
            } else if (typeof PDFParse === 'function') {
                // Function style
                const data = await PDFParse(buffer);
                return data.text;
            } else {
                // Fallback: maybe it is the module itself
                if (typeof pdfModule === 'function') {
                    const data = await pdfModule(buffer);
                    return data.text;
                }
                throw new Error("Could not find PDFParse constructor or function");
            }

        } catch (error) {
            Logger.error('PDF parsing error', error);
            // One last desperate try with the original code pattern exactly
            try {
                const { PDFParse } = await import('pdf-parse');
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                return result.text;
            } catch (innerError) {
                Logger.error('PDF parsing fallback error', innerError);
                throw new Error('Failed to parse PDF content');
            }
        }
    }

    private async parseDOCX(buffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ buffer: buffer });
            return result.value;
        } catch (error) {
            Logger.error('DOCX parsing error', error);
            throw new Error('Failed to parse DOCX content');
        }
    }

    private async parseDOC(filePath: string): Promise<string> {
        try {
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(filePath);
            return extracted.getBody();
        } catch (error) {
            Logger.error('DOC parsing error', error);
            throw new Error('Failed to parse DOC content');
        }
    }
}

export default new ResumeParser();
