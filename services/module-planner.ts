export interface PlannedModule {
  module_key: string;
  module_name: string;
  module_type: string;
  module_weight: number;
  required_skills_vector: Record<string, number>;
  definition_of_done: Record<string, unknown>;
}

export function planModulesForProject(projectId: string, structured: any, totalPrice: number, manualBudgets?: Record<string, number>): Array<Record<string, any>> {
  const base = [
    {
      project_id: projectId,
      module_key: 'frontend',
      module_name: 'Frontend',
      module_type: 'frontend',
      module_weight: 0.25,
      budget_inr: (manualBudgets?.frontend !== undefined && Number(manualBudgets.frontend) > 0) ? Number(manualBudgets.frontend) : Math.round(totalPrice * 0.25),
      required_skills_vector: { react: 0.9, ui: 0.8 },
      module_status: 'queued',
      definition_of_done: { checklist: ['Client UI', 'Auth', 'Dashboards'] },
    },
    {
      project_id: projectId,
      module_key: 'backend',
      module_name: 'Backend',
      module_type: 'backend',
      module_weight: 0.35,
      budget_inr: (manualBudgets?.backend !== undefined && Number(manualBudgets.backend) > 0) ? Number(manualBudgets.backend) : Math.round(totalPrice * 0.35),
      required_skills_vector: { node: 0.9, postgres: 0.8, rls: 0.8 },
      module_status: 'queued',
      definition_of_done: { checklist: ['APIs', 'RLS', 'Realtime'] },
    },
    {
      project_id: projectId,
      module_key: 'integrations',
      module_name: 'Integrations',
      module_type: 'integrations',
      module_weight: 0.25,
      budget_inr: (manualBudgets?.database !== undefined && Number(manualBudgets.database) > 0) ? Number(manualBudgets.database) : Math.round(totalPrice * 0.25),
      required_skills_vector: { integrations: 0.8, webhooks: 0.6 },
      module_status: 'queued',
      definition_of_done: { integrations: structured.integrations ?? [] },
    },
    {
      project_id: projectId,
      module_key: 'deployment',
      module_name: 'Deployment',
      module_type: 'deployment',
      module_weight: 0.15,
      budget_inr: (manualBudgets?.infrastructure !== undefined && Number(manualBudgets.infrastructure) > 0) ? Number(manualBudgets.infrastructure) : Math.round(totalPrice * 0.15),
      required_skills_vector: { devops: 0.7, deployment: 0.9 },
      module_status: 'queued',
      definition_of_done: { checklist: ['AiroBuilder deployment URL', 'Handover notes'] },
    },
  ];

  return base;
}
