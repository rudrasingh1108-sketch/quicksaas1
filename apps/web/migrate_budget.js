const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
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
    console.log('Attempting to add budget_inr column to project_modules...');

    // Using a trick to run SQL if rpc is not available or just try to insert and catch
    // Since I can't run raw SQL easily without a pre-defined RPC, 
    // I'll check if it exists first.

    const { error: selectError } = await supabase
        .from('project_modules')
        .select('budget_inr')
        .limit(1);

    if (selectError && selectError.code === '42703') { // Column does not exist
        console.log('Column budget_inr does not exist. Please run the following SQL in your Supabase dashboard:');
        console.log('ALTER TABLE public.project_modules ADD COLUMN budget_inr numeric(14,2) not null default 0;');

        // Try to run it via a common RPC if it exists, though it's unlikely
        console.log('\nTrying to run migration via RPC if available...');
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE public.project_modules ADD COLUMN budget_inr numeric(14,2) not null default 0;' });

        if (rpcError) {
            console.error('Migration failed via RPC (expected if exec_sql is missing):', rpcError.message);
        } else {
            console.log('Migration successful!');
        }
    } else if (selectError) {
        console.error('Unexpected error:', selectError.message);
    } else {
        console.log('Column budget_inr already exists.');
    }
}

migrate();
