/**
 * Seed Script - Populate Supabase with sample data for testing
 * 
 * Usage: npx ts-node --esm src/scripts/seed.ts [userId]
 * 
 * If userId is not provided, will prompt or use a default test user.
 */

import 'dotenv/config';
import supabase from '../services/supabase.js';
import type { ApplicationInsert } from '../services/supabase.js';

const SAMPLE_COMPANIES = [
    { name: 'Stripe', domain: 'stripe.com' },
    { name: 'Figma', domain: 'figma.com' },
    { name: 'Notion', domain: 'notion.so' },
    { name: 'Vercel', domain: 'vercel.com' },
    { name: 'Linear', domain: 'linear.app' },
    { name: 'Supabase', domain: 'supabase.com' },
    { name: 'Anthropic', domain: 'anthropic.com' },
    { name: 'OpenAI', domain: 'openai.com' },
    { name: 'Databricks', domain: 'databricks.com' },
    { name: 'Airbnb', domain: 'airbnb.com' },
    { name: 'Spotify', domain: 'spotify.com' },
    { name: 'Discord', domain: 'discord.com' },
    { name: 'Slack', domain: 'slack.com' },
    { name: 'Twitch', domain: 'twitch.tv' },
    { name: 'Coinbase', domain: 'coinbase.com' },
    { name: 'Plaid', domain: 'plaid.com' },
    { name: 'Ramp', domain: 'ramp.com' },
    { name: 'Deel', domain: 'deel.com' },
    { name: 'Retool', domain: 'retool.com' },
    { name: 'Airtable', domain: 'airtable.com' },
];

const JOB_TITLES = [
    'Senior Software Engineer',
    'Staff Software Engineer',
    'Full Stack Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Platform Engineer',
    'DevOps Engineer',
    'ML Engineer',
    'Data Engineer',
    'Product Engineer',
];

const LOCATIONS = [
    'San Francisco, CA',
    'New York, NY',
    'Seattle, WA',
    'Austin, TX',
    'Remote',
    'Los Angeles, CA',
    'Boston, MA',
    'Denver, CO',
    'Chicago, IL',
    'Miami, FL',
];

const ATS_PROVIDERS: ('greenhouse' | 'lever' | 'ashby')[] = ['greenhouse', 'lever', 'ashby'];

const STATUSES: ('pending' | 'completed' | 'failed')[] = ['pending', 'completed', 'failed'];

function randomElement<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomDate(daysBack: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
}

function generateJobId(): string {
    return Math.random().toString(36).substring(2, 15);
}

function generateDescription(company: string, title: string): string {
    return `${company} is looking for a ${title} to join our growing team. 
You will work on challenging problems and help shape the future of our product.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in TypeScript and React
- Experience with cloud platforms (AWS, GCP, or Azure)
- Excellent communication skills

Nice to have:
- Experience with distributed systems
- Open source contributions
- Startup experience`;
}

async function createSampleApplications(userId: string, count: number = 25): Promise<void> {
    console.log(`Creating ${count} sample applications for user ${userId}...`);

    const applications: ApplicationInsert[] = [];

    for (let i = 0; i < count; i++) {
        const company = randomElement(SAMPLE_COMPANIES);
        const title = randomElement(JOB_TITLES);
        const location = randomElement(LOCATIONS);
        const atsProvider = randomElement(ATS_PROVIDERS);
        const status = randomElement(STATUSES);
        const isRemote = location === 'Remote';

        const createdAt = randomDate(30);
        const completedAt = status !== 'pending' ? randomDate(7) : null;

        applications.push({
            user_id: userId,
            company: company.name,
            title,
            job_url: `https://jobs.${atsProvider}.io/${company.domain}/${generateJobId()}`,
            ats_provider: atsProvider,
            ats_job_id: generateJobId(),
            location,
            is_remote: isRemote,
            description: generateDescription(company.name, title),
            queue_status: status,
            started_at: status !== 'pending' ? createdAt : null,
            completed_at: completedAt,
            queued_at: status !== 'pending' ? createdAt : null,
            posted_at: randomDate(14),
            last_error: status === 'failed' ? 'Connection timeout' : null,
            retry_count: status === 'failed' ? 1 : 0,
            queue_batch_id: null,
            pause_reason: null,
            match_score: Math.floor(Math.random() * 40) + 60, // 60-100 range
            resume_profile_id: null,
            salary_min: null,
            salary_max: null,
            employment_type: 'Full-time',
            queue_position: null,
            screenshot_path: null,
        });
    }

    const { data, error } = await supabase
        .from('applications')
        .insert(applications)
        .select('id, company, title');

    if (error) {
        console.error('Failed to insert applications:', error);
        throw error;
    }

    console.log(`✓ Created ${data?.length || 0} applications:`);
    data?.slice(0, 5).forEach(app => {
        console.log(`  - ${app.company}: ${app.title}`);
    });
    if ((data?.length || 0) > 5) {
        console.log(`  ... and ${(data?.length || 0) - 5} more`);
    }
}

async function createSampleProfile(userId: string): Promise<void> {
    console.log(`Creating sample profile for user ${userId}...`);

    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (existing) {
        console.log('✓ Profile already exists, updating...');
    }

    const profile = {
        user_id: userId,
        contact: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '(555) 123-4567',
            linkedin: 'https://linkedin.com/in/johndoe',
            location: 'San Francisco, CA',
        },
        experience: [
            {
                title: 'Senior Software Engineer',
                company: 'TechCorp',
                startDate: '2020-01',
                endDate: null,
                current: true,
                description: 'Led development of microservices architecture serving 10M+ users',
                highlights: [
                    'Reduced API latency by 40% through caching optimization',
                    'Mentored team of 5 junior engineers',
                    'Implemented CI/CD pipeline reducing deployment time by 60%',
                ],
            },
            {
                title: 'Software Engineer',
                company: 'StartupXYZ',
                startDate: '2017-06',
                endDate: '2019-12',
                current: false,
                description: 'Full-stack development with React and Node.js',
                highlights: [
                    'Built real-time collaboration features using WebSockets',
                    'Developed payment integration processing $2M+ monthly',
                ],
            },
        ],
        education: [
            {
                degree: 'B.S. Computer Science',
                school: 'University of California, Berkeley',
                graduationYear: '2017',
                gpa: '3.8',
            },
        ],
        skills: [
            'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL',
            'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'Redis',
        ],
        preferences: {
            remoteOnly: false,
            excludedKeywords: ['PHP', 'WordPress', 'Drupal'],
            maxSeniority: ['senior', 'staff', 'principal'],
            locations: ['San Francisco, CA', 'New York, NY', 'Remote'],
            targetRoles: ['Software Engineer', 'Full Stack Engineer', 'Backend Engineer'],
            minSalary: 150000,
        },
        resume_profiles: [
            {
                name: 'default',
                summary: 'Full-stack engineer with 7+ years of experience building scalable web applications.',
                targetRoles: ['Senior Software Engineer', 'Staff Engineer'],
            },
            {
                name: 'backend-focused',
                summary: 'Backend engineer specializing in distributed systems and API design.',
                targetRoles: ['Backend Engineer', 'Platform Engineer'],
            },
        ],
    };

    const { error } = await supabase
        .from('profiles')
        .upsert({
            ...profile,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Failed to upsert profile:', error);
        throw error;
    }

    console.log('✓ Profile created/updated successfully');
}

async function clearUserData(userId: string): Promise<void> {
    console.log(`Clearing existing data for user ${userId}...`);

    // Clear applications
    const { error: appError } = await supabase
        .from('applications')
        .delete()
        .eq('user_id', userId);

    if (appError) {
        console.error('Failed to clear applications:', appError);
    }

    // Clear queue campaigns
    const { error: campError } = await supabase
        .from('queue_campaigns')
        .delete()
        .eq('user_id', userId);

    if (campError) {
        console.error('Failed to clear campaigns:', campError);
    }

    // Clear audit logs
    const { error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .eq('user_id', userId);

    if (auditError) {
        console.error('Failed to clear audit logs:', auditError);
    }

    console.log('✓ User data cleared');
}

async function main(): Promise<void> {
    const userId = process.argv[2];

    if (!userId) {
        console.error('Usage: npx ts-node --esm src/scripts/seed.ts <userId>');
        console.error('');
        console.error('To get your userId, sign in to the app and check your Supabase auth.users table');
        console.error('or use: supabase auth list-users');
        process.exit(1);
    }

    console.log('='.repeat(50));
    console.log('CareerFlow Seed Script');
    console.log('='.repeat(50));
    console.log('');

    try {
        // Clear existing data
        await clearUserData(userId);

        // Create sample profile
        await createSampleProfile(userId);

        // Create sample applications
        await createSampleApplications(userId, 25);

        console.log('');
        console.log('='.repeat(50));
        console.log('✓ Seed completed successfully!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

main();
