import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../../../lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseServiceClient();
    const userRes = await supabase.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actor } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', userRes.data.user.id)
        .maybeSingle();

    if (!actor || actor.role !== 'freelancer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Verify the module is still queued
    const { data: moduleData, error: moduleError } = await supabase
        .from('project_modules')
        .select('id, module_status')
        .eq('id', params.id)
        .is('assigned_freelancer_id', null)
        .single();

    if (moduleError || !moduleData || moduleData.module_status !== 'queued') {
        return NextResponse.json({ error: 'Module not available for claiming' }, { status: 400 });
    }

    // Assign to freelancer
    const { error: updateError } = await supabase
        .from('project_modules')
        .update({
            assigned_freelancer_id: actor.id,
            module_status: 'assigned',
            started_at: new Date().toISOString()
        })
        .eq('id', params.id);

    if (updateError) return NextResponse.json({ error: 'Failed to claim module' }, { status: 500 });

    // Create an assignment record
    const shiftStart = new Date();
    const shiftEnd = new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000); // 8-hour shift default
    await supabase.from('project_module_assignments').insert({
        module_id: params.id,
        freelancer_id: actor.id,
        assignment_role: 'primary',
        shift_start: shiftStart.toISOString(),
        shift_end: shiftEnd.toISOString(),
        status: 'active'
    });

    return NextResponse.json({ success: true });
}
