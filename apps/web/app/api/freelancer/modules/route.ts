import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: `Unauthorized: ${authError?.message || 'Invalid session token'}` }, { status: 401 });

  const { data: actor } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!actor || actor.role !== 'freelancer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const assignments = await supabase
    .from('project_module_assignments')
    .select('id, module_id, assignment_role, shift_start, shift_end, status')
    .eq('freelancer_id', actor.id)
    .is('deleted_at', null)
    .in('status', ['scheduled', 'active']);

  const moduleIds = (assignments.data ?? []).map((a: any) => a.module_id);

  const modules = moduleIds.length
    ? await supabase
      .from('project_modules')
      .select('id, project_id, module_key, module_name, module_status, due_at, updated_at, budget_inr')
      .in('id', moduleIds)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
    : { data: [] as any[] };

  const snapshots = moduleIds.length
    ? await supabase
      .from('work_snapshots')
      .select('id, module_id, snapshot_type, public_summary, internal_summary, created_at')
      .in('module_id', moduleIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    : { data: [] as any[] };

  const latestSnapshotByModule = new Map<string, any>();
  for (const s of snapshots.data ?? []) {
    if (!latestSnapshotByModule.has(s.module_id)) latestSnapshotByModule.set(s.module_id, s);
  }

  const assignmentByModule = new Map<string, any>();
  for (const a of assignments.data ?? []) {
    assignmentByModule.set(a.module_id, a);
  }

  const result = (modules.data ?? []).map((m: any) => {
    const a = assignmentByModule.get(m.id);
    return {
      ...m,
      shift: a
        ? {
          assignment_id: a.id,
          role: a.assignment_role,
          status: a.status,
          shift_start: a.shift_start,
          shift_end: a.shift_end,
        }
        : null,
      latest_snapshot: latestSnapshotByModule.get(m.id) ?? null,
    };
  });

  const queuedModules = await supabase
    .from('project_modules')
    .select('id, project_id, module_key, module_name, module_status, due_at, updated_at, module_weight, budget_inr, projects(title, total_price)')
    .eq('module_status', 'queued')
    .is('deleted_at', null)
    .is('assigned_freelancer_id', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    modules: result,
    available: queuedModules.data ?? []
  });
}
