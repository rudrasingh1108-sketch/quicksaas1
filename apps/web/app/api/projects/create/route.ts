import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicPrice } from '@services/pricing-engine';
import { createSupabaseServiceClient } from '../../../../lib/supabase/server';
import { validateIntake, intakeToStructuredRequirements, structuredToGml } from '@services/intake-mapper';
import { planModulesForProject } from '@services/module-planner';
import { planAssignmentsForModule } from '@services/assignment-engine';

interface CreateProjectBody {
  title: string;
  rawRequirement?: string;
  intake?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProjectBody;
    const supabase = createSupabaseServiceClient();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createSupabaseServiceClient();
    const userRes = await authClient.auth.getUser(token);
    if (!userRes.data.user) return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userRes.data.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (actorError) {
      return NextResponse.json({ error: actorError.message }, { status: 400 });
    }

    if (!actor || actor.role !== 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.title) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const intake = body.intake ?? null;
    const missing = intake ? validateIntake(intake) : ['intake'];
    if (missing.length) {
      return NextResponse.json({ error: `Missing intake fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const structured = intakeToStructuredRequirements(intake);
    const gml = structuredToGml(structured);

    const pricing = calculateDynamicPrice({
      complexityScore: structured.complexityScore,
      baseRate: 1200,
      urgencyMultiplier: structured.urgency === 'high' ? 15000 : structured.urgency === 'medium' ? 6000 : 3000,
      resourceLoadFactor: 5000,
      integrationWeight: structured.integrations.length * 3500,
      activeProjects: 1250,
      capacityThreshold: 1000,
    });

    const projectInsert = await supabase
      .from('projects')
      .insert({
        client_id: actor.id,
        title: body.title,
        raw_requirement: body.rawRequirement ?? intake.notes,
        structured_requirements: structured,
        gml_spec: gml,
        sla_policy: { shifts: ['A', 'B', 'C'], timezone: 'Asia/Kolkata' },
        complexity_score: structured.complexityScore,
        pricing_breakdown: pricing,
        urgency: structured.urgency,
        total_price: pricing.total,
        status: 'active',
      })
      .select('id, title, status, complexity_score, total_price')
      .single();

    if (projectInsert.error || !projectInsert.data) {
      return NextResponse.json({ error: projectInsert.error?.message ?? 'Project creation failed' }, { status: 400 });
    }

    await supabase.from('project_intake').upsert({ project_id: projectInsert.data.id, intake }, { onConflict: 'project_id' });

    const modulesPayload = planModulesForProject(projectInsert.data.id, structured);
    const modulesInsert = await supabase
      .from('project_modules')
      .insert(modulesPayload)
      .select('id, module_key, module_name, module_status, module_weight, project_id, module_vector, required_skills_vector');

    if (modulesInsert.error || !modulesInsert.data) {
      return NextResponse.json({ error: modulesInsert.error?.message ?? 'Module creation failed' }, { status: 400 });
    }

    // For real-data testing, we will NOT auto-assign freelancers. 
    // They must claim modules from the pool on the freelancer dashboard.
    const safeModules = modulesInsert.data.map((m) => ({
      id: m.id,
      module_key: m.module_key,
      module_name: m.module_name,
      module_status: m.module_status,
      module_weight: m.module_weight,
    }));

    return NextResponse.json({
      project: projectInsert.data,
      modules: safeModules,
      redirectTo: `/projects/${projectInsert.data.id}`,
    });
  } catch (error: any) {
    console.error("DEBUG FATAL API ERROR:", error);
    const message = error?.message || error?.details || error?.hint || String(error);
    return NextResponse.json({ error: message, full: error }, { status: 500 });
  }
}
