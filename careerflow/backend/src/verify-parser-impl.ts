import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ResumeParser from './modules/resume/parser.js';
import Logger from './services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyParserImplementation() {
    Logger.info('--- Starting Resume Parser Verification ---');

    // Adjusted path: src -> backend -> careerflow -> root -> Resume Examples
    const examplesDir = path.resolve(__dirname, '../../../Resume Examples');

    // Test Case 1: PDF
    const pdfPath = path.join(examplesDir, 'Resume - Nethelbert Blasse (6).pdf');
    if (fs.existsSync(pdfPath)) {
        Logger.info(`Testing PDF: ${pdfPath}`);
        try {
            const parsed = await ResumeParser.parse(pdfPath, 'application/pdf');
            Logger.info('PDF Parsed Successfully');
            Logger.info(`Length: ${parsed.rawText.length} chars`);
            Logger.info('Metadata:', parsed.metadata);
        } catch (err) {
            Logger.error('PDF Test Failed', err);
        }
    } else {
        Logger.warn('PDF Sample not found, skipping PDF test');
    }

    // Test Case 2: DOCX
    const docxPath = path.join(examplesDir, 'SimeraHailuResume 2025 (1).docx');
    if (fs.existsSync(docxPath)) {
        Logger.info(`Testing DOCX: ${docxPath}`);
        try {
            const parsed = await ResumeParser.parse(docxPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            Logger.info('DOCX Parsed Successfully');
            Logger.info(`Length: ${parsed.rawText.length} chars`);
            Logger.info('Metadata:', parsed.metadata);
        } catch (err) {
            Logger.error('DOCX Test Failed', err);
        }
    } else {
        Logger.warn('DOCX Sample not found, skipping DOCX test');
    }

    // Test Case 3: Sample PDF
    const samplePdfPath = path.join(examplesDir, 'resume-samples.pdf');
    if (fs.existsSync(samplePdfPath)) {
        Logger.info(`Testing Sample PDF: ${samplePdfPath}`);
        try {
            const parsed = await ResumeParser.parse(samplePdfPath, 'application/pdf');
            Logger.info('Sample PDF Parsed Successfully');
            Logger.info(`Length: ${parsed.rawText.length} chars`);
        } catch (err) {
            Logger.error('Sample PDF Test Failed', err);
        }
    }

    Logger.info('--- Verification Complete ---');
}

verifyParserImplementation();
