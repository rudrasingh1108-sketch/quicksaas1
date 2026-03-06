import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createSupabaseServiceClient();
        const userRes = await supabase.auth.getUser(token);
        if (!userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: actor, error: actorError } = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_user_id', userRes.data.user.id)
            .maybeSingle();

        if (actorError || !actor || actor.role !== 'client') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, title, status, total_price, deadline_at')
            .eq('client_id', actor.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (projectsError) {
            return NextResponse.json({ error: projectsError.message }, { status: 500 });
        }

        return NextResponse.json({ projects: projects ?? [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
