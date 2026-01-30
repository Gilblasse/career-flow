/**
 * Text processing utilities for resume parsing (frontend fallback)
 * Mirrors backend logic for backward compatibility
 */

const BULLET_MARKER_REGEX = /^\s*[●•\-–*]\s*/;

export function hasBulletMarker(line: string): boolean {
    return BULLET_MARKER_REGEX.test(line);
}

export function hasBulletMarkers(description: string): boolean {
    if (!description) return false;
    const lines = description.split('\n').filter(l => l.trim().length > 0);
    return lines.some(line => hasBulletMarker(line));
}

export function isDescriptionParagraph(description: string): boolean {
    if (!description || !description.trim()) return false;
    return !hasBulletMarkers(description);
}

export type DescriptionPattern = 'bullets' | 'paragraphs' | 'mixed';

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
    if (bulletsCount / total >= 0.5) return 'bullets';
    if (bulletsCount === 0) return 'paragraphs';
    return 'mixed';
}

export function extractBulletsFromDescription(
    description: string,
    dominantPattern: DescriptionPattern = 'bullets'
): string[] {
    if (!description || !description.trim()) return [];

    if (hasBulletMarkers(description)) {
        return description
            .split('\n')
            .map(line => line.replace(BULLET_MARKER_REGEX, '').trim())
            .filter(line => line.length > 0);
    }

    if (dominantPattern === 'paragraphs') {
        return [description.trim()];
    }

    const lines = description
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length > 1) {
        return lines;
    }

    return [description.trim()];
}

/**
 * Normalizes a bullets array - handles malformed data where bullets
 * are stored as a single-element array containing newline-separated text
 * or text with bullet markers.
 */
export function normalizeBullets(bullets: string[] | undefined, description?: string): string[] {
    if (!bullets || bullets.length === 0) {
        // No bullets, try to extract from description
        if (description) {
            return extractBulletsFromDescription(description, 'bullets');
        }
        return [];
    }
    
    // Check if bullets is malformed (single element with newlines or bullet markers)
    if (bullets.length === 1 && bullets[0]) {
        const singleBullet = bullets[0];
        // If the single bullet contains newlines or bullet markers, split it
        if (singleBullet.includes('\n') || BULLET_MARKER_REGEX.test(singleBullet)) {
            return extractBulletsFromDescription(singleBullet, 'bullets');
        }
    }
    
    // Clean up any remaining bullet markers from individual bullets
    return bullets.map(bullet => 
        bullet.replace(BULLET_MARKER_REGEX, '').trim()
    ).filter(bullet => bullet.length > 0);
}
