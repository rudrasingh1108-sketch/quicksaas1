const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://igxidxlfxkrkneahcalx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneGlkeGxmeGtya25lYWhjYWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkwODEwNywiZXhwIjoyMDg3NDg0MTA3fQ.envbJ91ChHsleAxU1sVSJWF_eKWNNVPJMd3PKuIrEeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOrder() {
    console.log('Fetching top 5 available modules...');
    const { data, error } = await supabase
        .from('project_modules')
        .select('module_name, created_at, project_id, projects(title)')
        .eq('module_status', 'queued')
        .is('deleted_at', null)
        .is('assigned_freelancer_id', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach((m, i) => {
        console.log(`${i + 1}. ${m.module_name} (Project: ${m.projects.title}, Created: ${m.created_at})`);
    });
}

verifyOrder().catch(console.error);
