import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { AIProgressEngine } from '../../../../../../services/ai-progress-engine';

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

    let projectQuery = supabase.from('projects').select('id, title, status, complexity_score, total_price, created_at, github_repo_url, github_repo_full_name').eq('id', params.id);

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

    // Get AI Progress Analysis
    const aiAnalysis = await AIProgressEngine.getAIProgressAnalysis(project.title, modules ?? []);

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
      risks: riskLogs.data ?? [],
      aiAnalysis // New field
    });
  } catch (error) {
    console.error('Error in project detail API:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!actor || actor.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden. Only clients can delete projects.' }, { status: 403 });
    }

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.id)
      .eq('client_id', actor.id)
      .maybeSingle();

    if (!project) return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });

    const now = new Date().toISOString();

    // Soft delete modules first
    await supabase
      .from('project_modules')
      .update({ deleted_at: now })
      .eq('project_id', params.id);

    // Soft delete project
    const { error: deleteError } = await supabase
      .from('projects')
      .update({ deleted_at: now, status: 'cancelled' })
      .eq('id', params.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
