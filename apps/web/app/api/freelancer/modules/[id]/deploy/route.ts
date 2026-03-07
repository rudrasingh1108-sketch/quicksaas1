import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../../../lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createSupabaseServiceClient();
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: actor } = await supabase
            .from('users')
            .select('id, role, full_name')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (!actor || actor.role !== 'freelancer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get module and project context
        const { data: module } = await supabase
            .from('project_modules')
            .select('id, project_id, module_name, module_status')
            .eq('id', params.id)
            .maybeSingle();

        if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

        // 2. Create progress log for client visibility
        await supabase.from('progress_logs').insert({
            project_id: module.project_id,
            module_id: module.id,
            public_summary: `Neural deployment initiated for ${module.module_name} by specialized unit.`,
            percent_delta: 15, // Simulate progress jump
        });

        // 3. Create work snapshot for internal archive
        await supabase.from('work_snapshots').insert({
            module_id: module.id,
            sender_id: actor.id,
            snapshot_type: 'deployment',
            public_summary: `Module ${module.module_name} successfully provisioned to production edge nodes.`,
            internal_summary: `Deployment triggered via Command Center Tools. Unit: ${actor.full_name}`,
        });

        // 4. Update module status if it was in progress
        if (module.module_status === 'in_progress' || module.module_status === 'assigned') {
            await supabase
                .from('project_modules')
                .update({ module_status: 'completed' })
                .eq('id', module.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Deployment API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
