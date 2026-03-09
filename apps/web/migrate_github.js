const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Attempting to add GitHub columns...');

    const sql = `
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_repo_url text;
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_repo_full_name text;
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS github_username text;
    `;

    console.log('Trying to run migration via RPC exec_sql...');
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql });

    if (rpcError) {
        console.error('Migration failed via RPC:', rpcError.message);
        console.log('\nPlease run the following SQL manually in your Supabase SQL Editor:');
        console.log(sql);
    } else {
        console.log('Migration successful!');
    }
}

migrate();
