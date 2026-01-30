/**
 * Text processing utilities for resume parsing
 * Handles bullet point vs paragraph detection consistently
 */

// Bullet marker pattern: -, –, •, *
const BULLET_MARKER_REGEX = /^\s*[-–•*]\s/;

/**
 * Checks if a single line starts with a bullet marker
 */
export function hasBulletMarker(line: string): boolean {
    return BULLET_MARKER_REGEX.test(line);
}

/**
 * Checks if a description contains any bullet markers
 */
export function hasBulletMarkers(description: string): boolean {
    if (!description) return false;
    const lines = description.split('\n').filter(l => l.trim().length > 0);
    return lines.some(line => hasBulletMarker(line));
}

/**
 * Determines if a description is a paragraph (no bullet markers)
 */
export function isDescriptionParagraph(description: string): boolean {
    if (!description || !description.trim()) return false;
    return !hasBulletMarkers(description);
}

export type DescriptionPattern = 'bullets' | 'paragraphs' | 'mixed';

/**
 * Analyzes all experience descriptions to determine the dominant pattern.
 * - If ≥50% have bullet markers → 'bullets'
 * - If <50% have bullet markers and none are single sentences → 'paragraphs'
 * - If mixed (some bullets, some single sentences) → 'mixed' (will default to bullets)
 */
export function analyzeDescriptionPattern(experiences: Array<{ description?: string }>): DescriptionPattern {
    if (!experiences || experiences.length === 0) return 'bullets';

    let bulletsCount = 0;
    let paragraphsCount = 0;

    for (const exp of experiences) {
        if (!exp.description || !exp.description.trim()) continue;
        
        if (hasBulletMarkers(exp.description)) {
            bulletsCount++;
        } else {
            paragraphsCount++;
        }
    }

    const total = bulletsCount + paragraphsCount;
    if (total === 0) return 'bullets';

    // If ≥50% have bullet markers, dominant is bullets
    if (bulletsCount / total >= 0.5) return 'bullets';
    
    // If all are paragraphs (no bullet markers anywhere)
    if (bulletsCount === 0) return 'paragraphs';
    
    // Mixed case
    return 'mixed';
}

/**
 * Extracts bullets from a description string.
 * 
 * @param description - The raw description text
 * @param dominantPattern - The pattern detected from all experiences
 * @returns Array of bullet strings
 * 
 * Logic:
 * - If description has bullet markers: always extract as bullets
 * - If description is paragraph/single-sentence with no markers:
 *   - If dominantPattern is 'paragraphs': keep as single "bullet"
 *   - If dominantPattern is 'bullets' or 'mixed': split by sentences or keep as single bullet
 */
export function extractBulletsFromDescription(
    description: string,
    dominantPattern: DescriptionPattern = 'bullets'
): string[] {
    if (!description || !description.trim()) return [];

    // If has bullet markers, always extract as bullets
    if (hasBulletMarkers(description)) {
        return description
            .split('\n')
            .map(line => line.replace(BULLET_MARKER_REGEX, '').trim())
            .filter(line => line.length > 0);
    }

    // No bullet markers - use dominant pattern
    if (dominantPattern === 'paragraphs') {
        // Keep as single item (paragraph)
        return [description.trim()];
    }

    // For 'bullets' or 'mixed' pattern with no markers:
    // Split by newlines first, then if still single line, keep as one bullet
    const lines = description
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length > 1) {
        return lines;
    }

    // Single line/paragraph - keep as one bullet
    return [description.trim()];
}
