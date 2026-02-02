/**
 * Create a confirmed test user
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

async function createUser() {
    const email = 'emmanuel@careerflow.dev';
    const password = 'CareerFlow2026!';
    
    console.log('Creating user:', email);
    
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Emmanuel',
            last_name: 'Blasse'
        }
    });
    
    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
    
    console.log('');
    console.log('✅ User created successfully!');
    console.log('');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Password:', password);
    console.log('');
    console.log('You can now sign in at http://localhost:5173');
}

createUser();
