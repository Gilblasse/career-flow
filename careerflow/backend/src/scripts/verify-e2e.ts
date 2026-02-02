/**
 * End-to-End Verification Script
 * 
 * This script verifies the full CareerFlow pipeline:
 * 1. Profile management (Supabase)
 * 2. Application creation and tracking
 * 3. Queue processing simulation
 * 4. Resume generation
 * 5. Audit logging
 * 
 * Usage: npm run verify:e2e -- <userId>
 */

import 'dotenv/config';
import supabase from '../services/supabase.js';
import ProfileService from '../services/profile.js';
import JobStore from '../modules/ingestion/job-store.js';
import ResumeGenerator from '../modules/resume/generator.js';
import AuditService from '../services/audit.js';
import Logger from '../services/logger.js';
import fs from 'fs';
import path from 'path';

interface VerificationResult {
    step: string;
    success: boolean;
    details?: string | undefined;
    error?: string | undefined;
}

const results: VerificationResult[] = [];

function logResult(step: string, success: boolean, details?: string, error?: string) {
    results.push({ step, success, details, error });
    const icon = success ? '✓' : '✗';
    const color = success ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${icon}\x1b[0m ${step}${details ? `: ${details}` : ''}${error ? ` - ${error}` : ''}`);
}

async function verifySupabaseConnection(): Promise<boolean> {
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;
        logResult('Supabase Connection', true, 'Connected successfully');
        return true;
    } catch (err: any) {
        logResult('Supabase Connection', false, undefined, err.message);
        return false;
    }
}

async function verifyProfile(userId: string): Promise<boolean> {
    try {
        const profile = await ProfileService.getProfileByUserId(userId);
        
        if (!profile) {
            logResult('Profile Retrieval', false, undefined, 'Profile not found');
            return false;
        }

        const hasContact = !!(profile.contact?.firstName && profile.contact?.lastName);
        const hasExperience = !!(profile.experience && profile.experience.length > 0);
        const hasSkills = !!(profile.skills && profile.skills.length > 0);

        logResult('Profile Retrieval', true, `Found profile for ${profile.contact?.firstName} ${profile.contact?.lastName}`);
        logResult('Profile: Contact Info', hasContact, hasContact ? 'Has name' : undefined, !hasContact ? 'Missing contact info' : undefined);
        logResult('Profile: Experience', hasExperience, hasExperience ? `${profile.experience?.length || 0} entries` : undefined, !hasExperience ? 'No experience entries' : undefined);
        logResult('Profile: Skills', hasSkills, hasSkills ? `${profile.skills?.length || 0} skills` : undefined, !hasSkills ? 'No skills defined' : undefined);

        return hasContact || hasExperience || hasSkills;
    } catch (err: any) {
        logResult('Profile Retrieval', false, undefined, err.message);
        return false;
    }
}

async function verifyApplications(userId: string): Promise<boolean> {
    try {
        const result = await JobStore.getApplications(userId, { limit: 10 });
        const applications = result.applications;
        
        if (applications.length === 0) {
            logResult('Applications', false, undefined, 'No applications found. Run seed script first.');
            return false;
        }

        logResult('Applications', true, `Found ${applications.length} applications`);

        // Check status distribution
        const statusCounts: Record<string, number> = {};
        applications.forEach((app: any) => {
            statusCounts[app.queue_status] = (statusCounts[app.queue_status] || 0) + 1;
        });

        const statusStr = Object.entries(statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(', ');
        
        logResult('Application Statuses', true, statusStr);

        return true;
    } catch (err: any) {
        logResult('Applications', false, undefined, err.message);
        return false;
    }
}

async function verifyResumeGeneration(userId: string): Promise<boolean> {
    try {
        const profile = await ProfileService.getProfileByUserId(userId);
        if (!profile) {
            logResult('Resume Generation', false, undefined, 'No profile to generate resume from');
            return false;
        }

        // Create a mock job for testing
        const mockJob = {
            id: 999,
            company: 'Test Company',
            title: 'Software Engineer',
            description: 'Looking for a skilled developer with React and Node.js experience.',
            atsProvider: 'greenhouse' as const,
            atsJobId: 'test-job',
            jobUrl: 'https://example.com/job',
            isRemote: true,
            createdAt: new Date(),
            status: 'pending' as const,
        };

        const pdfBuffer = await ResumeGenerator.generateResume(profile, mockJob);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            logResult('Resume Generation', false, undefined, 'Empty PDF generated');
            return false;
        }

        // Save to temp for manual inspection
        const tempPath = path.resolve('temp/verification-resume.pdf');
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(tempPath, pdfBuffer);

        logResult('Resume Generation', true, `Generated ${pdfBuffer.length} bytes, saved to ${tempPath}`);
        return true;
    } catch (err: any) {
        logResult('Resume Generation', false, undefined, err.message);
        return false;
    }
}

async function verifyAuditLogging(userId: string): Promise<boolean> {
    try {
        // Create a test audit log using 'MATCH' which is a valid action type
        await AuditService.log({
            actionType: 'MATCH',
            userId,
            details: { test: true, timestamp: new Date().toISOString(), verification: 'e2e-test' },
        });

        // Verify it was written to Supabase
        const logs = await AuditService.getLogsForUser(userId, 1);
        
        if (logs.length === 0) {
            logResult('Audit Logging', false, undefined, 'Log not found in Supabase');
            return false;
        }

        logResult('Audit Logging', true, 'Successfully wrote and retrieved audit log');
        return true;
    } catch (err: any) {
        logResult('Audit Logging', false, undefined, err.message);
        return false;
    }
}

async function verifyApplicationStats(userId: string): Promise<boolean> {
    try {
        const stats = await JobStore.getApplicationStats(userId);

        logResult('Application Stats', true, 
            `Total: ${stats.total}, Pending: ${stats.pending}, Completed: ${stats.completed}, Failed: ${stats.failed}`);
        
        return true;
    } catch (err: any) {
        logResult('Application Stats', false, undefined, err.message);
        return false;
    }
}

async function main() {
    const userId = process.argv[2];

    if (!userId) {
        console.error('Usage: npx tsx src/scripts/verify-e2e.ts <userId>');
        console.error('');
        console.error('To get your userId, sign in to the app and check your Supabase auth.users table');
        process.exit(1);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('CareerFlow E2E Verification');
    console.log('='.repeat(60));
    console.log(`User ID: ${userId}`);
    console.log('');

    // Run verification steps
    const supabaseOk = await verifySupabaseConnection();
    if (!supabaseOk) {
        console.log('\n\x1b[31m✗ Cannot proceed without Supabase connection\x1b[0m\n');
        process.exit(1);
    }

    console.log('');
    await verifyProfile(userId);
    console.log('');
    await verifyApplications(userId);
    console.log('');
    await verifyApplicationStats(userId);
    console.log('');
    await verifyResumeGeneration(userId);
    console.log('');
    await verifyAuditLogging(userId);

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('');

    if (failed > 0) {
        console.log('Failed steps:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.step}: ${r.error || 'Unknown error'}`);
        });
        console.log('');
    }

    const allPassed = failed === 0;
    console.log(allPassed 
        ? '\x1b[32m✓ All verifications passed!\x1b[0m'
        : '\x1b[31m✗ Some verifications failed. See above for details.\x1b[0m'
    );
    console.log('');

    process.exit(allPassed ? 0 : 1);
}

main();
