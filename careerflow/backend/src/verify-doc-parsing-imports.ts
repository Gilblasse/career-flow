import Logger from './services/logger.js';

async function verifyImports() {
    Logger.info('--- Verifying Doc/Docx Dependencies ---');

    try {
        // @ts-ignore
        const mammoth = await import('mammoth');
        Logger.info('SUCCESS: mammoth imported successfully.');
    } catch (e) {
        Logger.error('FAILURE: mammoth import failed', e);
    }

    try {
        // @ts-ignore
        const WordExtractor = await import('word-extractor');
        Logger.info('SUCCESS: word-extractor imported successfully.');
    } catch (e) {
        Logger.error('FAILURE: word-extractor import failed', e);
    }

    Logger.info('--- Verification Complete ---');
}

verifyImports();
