'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock3, FolderKanban, ShieldCheck, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { calculateDynamicPrice } from '../../../../services/pricing-engine';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import IntakeForm from '../../components/project/intake-form';
import { useToast } from '../../lib/hooks/use-toast';

export default function ClientDashboard() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setPageLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/client/overview', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setPageLoading(false);
      }
    }
    fetchDashboard();
  }, [supabase]);

  const preview = useMemo(() => {
    const complexity = Math.min(100, Math.max(10, Math.floor(requirement.length / 20)));
    return calculateDynamicPrice({ complexityScore: complexity, baseRate: 1200, urgencyMultiplier: requirement.toLowerCase().includes('urgent') ? 15000 : 6000, resourceLoadFactor: 5000, integrationWeight: 7000, activeProjects: 1250, capacityThreshold: 1000 });
  }, [requirement]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    if (!accessToken) return;
    const response = await fetch('/api/projects/create', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title, rawRequirement: requirement }) });
    const raw = await response.text();
    const payload = raw ? (JSON.parse(raw) as any) : {};
    setLoading(false);
    if (!response.ok) return show('Project creation failed', payload.error);
    show('Project created', 'Execution modules initialized.');
    router.push(payload.redirectTo);
  };

  const totalSpend = useMemo(() => {
    return projects.reduce((acc, p) => acc + (Number(p.total_price) || 0), 0);
  }, [projects]);

  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes(p.status)).length;

  const kpis = [
    { label: 'Active Projects', value: String(activeProjects), icon: FolderKanban },
    { label: 'Total Spend', value: `₹${totalSpend.toLocaleString()}`, icon: Sparkles },
    { label: 'Avg Delivery', value: projects.length > 0 ? '5.2 days' : '-', icon: Clock3 },
    { label: 'Reliability', value: projects.length > 0 ? '98.4%' : '-', icon: ShieldCheck },
  ];

  return (
    <AppShell role="client" title="Client Command Center">
      {pageLoading ? (
        <div className="flex items-center justify-center p-20 text-muted-foreground animate-pulse">Loading execution space...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="group p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
                  <kpi.icon className="mb-4 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Project pipeline</p>
                <p className="text-sm text-muted-foreground">Execution visibility across all modules.</p>
              </div>
              <Modal trigger={<Button>Create Project</Button>} title="Launch New Project">
                <IntakeForm />
              </Modal>
            </div>
            <div className="overflow-x-auto">
              {projects.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground border border-dashed rounded-lg">
                  No projects launched yet. Submit your first brief.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="pb-3">Project</th><th className="pb-3">Status</th><th className="pb-3">Deadline</th><th className="pb-3">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((row) => (
                      <tr key={row.id} className="border-t border-border/70">
                        <td className="py-3 font-medium">{row.title}</td>
                        <td className="py-3"><Badge variant="outline">{row.status}</Badge></td>
                        <td className="py-3">{row.deadline_at ? new Date(row.deadline_at).toLocaleDateString() : 'TBD'}</td>
                        <td className="py-3">{row.completion_pct || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
