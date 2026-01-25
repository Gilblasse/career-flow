import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
    const pdfParseDefault = await import('pdf-parse');
    console.log('Import Default:', pdfParseDefault);
    console.log('Import Default.default:', pdfParseDefault.default);
} catch (e) {
    console.error('Import failed:', e);
}

try {
    const pdfParseReq = require('pdf-parse');
    console.log('Require:', pdfParseReq);
} catch (e) {
    console.error('Require failed:', e);
}
