const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://igxidxlfxkrkneahcalx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneGlkeGxmeGtya25lYWhjYWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkwODEwNywiZXhwIjoyMDg3NDg0MTA3fQ.envbJ91ChHsleAxU1sVSJWF_eKWNNVPJMd3PKuIrEeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Starting cleanup of old test data...');

    // Find all projects EXCEPT 'shivansh'
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title')
        .not('title', 'ilike', '%shivansh%')
        .is('deleted_at', null);

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    console.log(`Found ${projects.length} projects to cleanup.`);
    const now = new Date().toISOString();

    for (const project of projects) {
        console.log(`Cleaning up: ${project.title} (${project.id})`);

        // Soft delete modules
        await supabase
            .from('project_modules')
            .update({ deleted_at: now })
            .eq('project_id', project.id);

        // Soft delete project
        await supabase
            .from('projects')
            .update({ deleted_at: now, status: 'cancelled' })
            .eq('id', project.id);
    }

    console.log('Cleanup complete.');
}

cleanup().catch(console.error);
