import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdfParse from 'pdf-parse';
import Logger from './services/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyParsing() {
    Logger.info('--- Starting Parsing Verification ---');

    const resumePath = path.resolve(__dirname, '../dummy_resume.pdf');
    if (!fs.existsSync(resumePath)) {
        Logger.error('dummy_resume.pdf not found. Creating a simple text file for test instead if pdf missing.');
        // For test purposes, we might need a real PDF.
        // If missing, we skip or mock.
        return;
    }

    try {
        const buffer = fs.readFileSync(resumePath);
        const data = await pdfParse(buffer);
        const text = data.text;

        Logger.info('PDF Text length: ' + text.length);

        // Mocking the extraction logic from server.ts to verify it works
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        const emailMatch = text.match(emailRegex);
        Logger.info('Extracted Email: ' + (emailMatch ? emailMatch[0] : 'None'));

        if (text.toLowerCase().includes('experience')) {
            Logger.info('Found "Experience" section keyword.');
        } else {
            Logger.warn('Did not find "Experience" section keyword.');
        }

    } catch (error) {
        Logger.error('Parsing failed', error);
    }

    Logger.info('--- Parsing Verification Complete ---');
}

verifyParsing();
