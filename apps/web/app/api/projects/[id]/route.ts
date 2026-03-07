import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseServiceClient();
    const userRes = await supabase.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });

    const { data: actor } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .maybeSingle();

    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let projectQuery = supabase.from('projects').select('id, title, status, complexity_score, total_price, created_at').eq('id', params.id);

    if (actor.role === 'client') {
      projectQuery = projectQuery.eq('client_id', actor.id);
    }

    const { data: project, error } = await projectQuery.maybeSingle();
    if (error || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: modules, error: modulesError } = await supabase
      .from('project_modules')
      .select('id, module_key, module_name, module_status, structured_progress, module_weight, updated_at, definition_of_done, due_at, assigned_freelancer_id, freelancer:users(full_name)')
      .eq('project_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (modulesError) throw modulesError;

    const moduleIds = (modules ?? []).map(m => m.id);

    let sessionsData: any[] = [];
    if (moduleIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('airobuilder_sessions')
        .select('id, module_id, deployment_url, build_url, session_status, external_session_id')
        .in('module_id', moduleIds);

      if (sessionsError) throw sessionsError;
      sessionsData = sessions ?? [];
    }

    const { data: progressLogs, error: logsError } = await supabase
      .from('progress_logs')
      .select('id, module_id, public_summary, percent_delta, created_at')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    const riskLogs = actor.role === 'admin'
      ? await supabase
        .from('risk_logs')
        .select('id, module_id, risk_score, trigger_type, action_taken, created_at')
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20)
      : { data: [] as any[] };

    return NextResponse.json({
      project,
      modules: modules ?? [],
      sessions: sessionsData,
      progressLogs: progressLogs ?? [],
      risks: riskLogs.data ?? []
    });
  } catch (error) {
    console.error('Error in project detail API:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
