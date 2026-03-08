const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://igxidxlfxkrkneahcalx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneGlkeGxmeGtya25lYWhjYWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkwODEwNywiZXhwIjoyMDg3NDg0MTA3fQ.envbJ91ChHsleAxU1sVSJWF_eKWNNVPJMd3PKuIrEeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject() {
    console.log('Checking for project "shivansh"...');
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, status, created_at, deleted_at')
        .ilike('title', '%shivansh%');

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('No project found with title "shivansh".');
        return;
    }

    for (const project of projects) {
        console.log(`\nProject: ${JSON.stringify(project, null, 2)}`);
        const { data: modules, error: modulesError } = await supabase
            .from('project_modules')
            .select('id, module_name, module_status, assigned_freelancer_id, deleted_at')
            .eq('project_id', project.id);

        if (modulesError) {
            console.error('Error fetching modules:', modulesError);
        } else {
            console.log(`Modules count: ${modules.length}`);
            modules.forEach(m => {
                console.log(` - ${m.module_name}: status=${m.module_status}, freelancer=${m.assigned_freelancer_id}, deleted=${m.deleted_at}`);
            });
        }
    }
}

checkProject().catch(console.error);
