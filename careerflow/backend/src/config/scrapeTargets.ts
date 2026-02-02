/**
 * Scrape Targets Configuration
 * 
 * Defines the career pages to scrape for job listings.
 * Each target includes the URL, ATS provider, and health tracking fields.
 */

import { ATSProvider } from '../types.js';

/**
 * Interface for a scrape target
 */
export interface ScrapeTarget {
    /** Unique identifier for the target */
    id: string;
    /** Company name */
    name: string;
    /** Career page URL */
    url: string;
    /** ATS provider type */
    atsProvider: ATSProvider;
    /** Whether this target is enabled for scraping */
    enabled: boolean;
    /** Health tracking: last successful scrape timestamp */
    lastSuccessAt: Date | null;
    /** Health tracking: last error timestamp */
    lastErrorAt: Date | null;
    /** Health tracking: consecutive error count */
    errorCount: number;
    /** Optional description or notes */
    notes?: string;
}

/**
 * Create a new scrape target with default health values
 */
function createTarget(
    id: string,
    name: string,
    url: string,
    atsProvider: ATSProvider,
    enabled: boolean = true,
    notes?: string
): ScrapeTarget {
    const target: ScrapeTarget = {
        id,
        name,
        url,
        atsProvider,
        enabled,
        lastSuccessAt: null,
        lastErrorAt: null,
        errorCount: 0,
    };
    if (notes !== undefined) {
        target.notes = notes;
    }
    return target;
}

/**
 * Initial scrape targets for job discovery
 * 
 * These are real company career pages using supported ATS providers.
 * Add new targets here as we expand our job catalog.
 */
export const SCRAPE_TARGETS: ScrapeTarget[] = [
    // Greenhouse ATS
    createTarget(
        'figma',
        'Figma',
        'https://boards.greenhouse.io/figma',
        'greenhouse',
        true,
        'Design collaboration platform'
    ),
    createTarget(
        'stripe',
        'Stripe',
        'https://boards.greenhouse.io/stripe',
        'greenhouse',
        true,
        'Payment infrastructure'
    ),
    createTarget(
        'vercel',
        'Vercel',
        'https://boards.greenhouse.io/vercel',
        'greenhouse',
        true,
        'Frontend deployment platform'
    ),
    createTarget(
        'notion',
        'Notion',
        'https://boards.greenhouse.io/notion',
        'greenhouse',
        true,
        'Productivity and notes app'
    ),
    createTarget(
        'anthropic',
        'Anthropic',
        'https://boards.greenhouse.io/anthropic',
        'greenhouse',
        true,
        'AI safety research'
    ),
    createTarget(
        'openai',
        'OpenAI',
        'https://boards.greenhouse.io/openai',
        'greenhouse',
        true,
        'AI research and deployment'
    ),
    
    // Lever ATS
    createTarget(
        'duolingo',
        'Duolingo',
        'https://jobs.lever.co/duolingo',
        'lever',
        true,
        'Language learning platform'
    ),
    createTarget(
        'netflix',
        'Netflix',
        'https://jobs.lever.co/netflix',
        'lever',
        true,
        'Streaming entertainment'
    ),
    
    // Ashby ATS
    createTarget(
        'linear',
        'Linear',
        'https://jobs.ashbyhq.com/linear',
        'ashby',
        true,
        'Project management tool'
    ),
    createTarget(
        'ramp',
        'Ramp',
        'https://jobs.ashbyhq.com/ramp',
        'ashby',
        true,
        'Corporate cards and spend management'
    ),
];

/**
 * Get all enabled scrape targets
 */
export function getEnabledTargets(): ScrapeTarget[] {
    return SCRAPE_TARGETS.filter(target => target.enabled);
}

/**
 * Get target URLs for enabled targets
 */
export function getEnabledTargetUrls(): string[] {
    return getEnabledTargets().map(target => target.url);
}

/**
 * Get targets by ATS provider
 */
export function getTargetsByProvider(provider: ATSProvider): ScrapeTarget[] {
    return SCRAPE_TARGETS.filter(target => target.atsProvider === provider && target.enabled);
}

/**
 * Get a target by ID
 */
export function getTargetById(id: string): ScrapeTarget | undefined {
    return SCRAPE_TARGETS.find(target => target.id === id);
}

/**
 * Get a target by URL
 */
export function getTargetByUrl(url: string): ScrapeTarget | undefined {
    return SCRAPE_TARGETS.find(target => target.url === url);
}

/**
 * Update target health after successful scrape
 */
export function recordSuccess(target: ScrapeTarget): void {
    target.lastSuccessAt = new Date();
    target.errorCount = 0;
}

/**
 * Update target health after failed scrape
 */
export function recordError(target: ScrapeTarget): void {
    target.lastErrorAt = new Date();
    target.errorCount += 1;
}

/**
 * Check if a target is healthy (no errors or recovered)
 */
export function isHealthy(target: ScrapeTarget): boolean {
    if (target.errorCount === 0) return true;
    if (!target.lastSuccessAt || !target.lastErrorAt) return target.errorCount === 0;
    return target.lastSuccessAt > target.lastErrorAt;
}

/**
 * Get targets that need attention (high error count)
 */
export function getUnhealthyTargets(errorThreshold: number = 3): ScrapeTarget[] {
    return SCRAPE_TARGETS.filter(target => target.errorCount >= errorThreshold);
}

export default SCRAPE_TARGETS;
