
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Verifying Schema & Data ---');

    // 1. Check if budget_inr exists
    const { data: cols, error: colError } = await supabase.rpc('get_column_info', { table_name: 'project_modules' });
    // If rpc doesn't exist, we'll just try a select

    const { data: moduleData, error: moduleError } = await supabase
        .from('project_modules')
        .select('id, module_name, budget_inr, project_id, projects(title)')
        .limit(5);

    if (moduleError) {
        console.error('Error fetching modules:', moduleError.message);
    } else {
        console.log('Successfully fetched modules with budget_inr:');
        moduleData.forEach(m => {
            console.log(`- ${m.projects.title} | ${m.module_name}: ₹${m.budget_inr}`);
        });
    }
}

verify();
