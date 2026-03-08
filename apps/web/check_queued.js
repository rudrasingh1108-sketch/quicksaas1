const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://igxidxlfxkrkneahcalx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneGlkeGxmeGtya25lYWhjYWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkwODEwNywiZXhwIjoyMDg3NDg0MTA3fQ.envbJ91ChHsleAxU1sVSJWF_eKWNNVPJMd3PKuIrEeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueued() {
    console.log('Counting queued modules...');
    const { data, count, error } = await supabase
        .from('project_modules')
        .select('id, module_name, module_status, project_id', { count: 'exact' })
        .eq('module_status', 'queued')
        .is('deleted_at', null)
        .is('assigned_freelancer_id', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Summary: Total available queued modules = ${count}`);
    if (data) {
        for (const m of data) {
            console.log(` - Module: ${m.module_name}, ProjectID: ${m.project_id}`);
        }
    }
}

checkQueued().catch(console.error);
