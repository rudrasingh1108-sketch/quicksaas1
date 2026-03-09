'use client';

import Link from 'next/link';
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {kpis.slice(0, 2).map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 relative overflow-hidden group">
                    <div className="absolute right-[-10%] top-[-10%] opacity-5 group-hover:scale-110 transition-transform">
                      <kpi.icon size={120} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary/60">{kpi.label}</p>
                    <p className="mt-2 text-4xl font-black tracking-tighter">{kpi.value}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <FolderKanban className="text-primary h-5 w-5" />
                Active Operations
              </h2>
              <Modal trigger={<Button size="sm" className="font-bold shadow-lg shadow-primary/20">Launch New Vector</Button>} title="Launch New Project">
                <IntakeForm />
              </Modal>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {projects.length === 0 ? (
                <Card className="md:col-span-2 py-12 text-center text-muted-foreground border-dashed bg-transparent border-border/50">
                  <p className="font-medium italic">No active neural links. Initiate a briefed project to begin.</p>
                </Card>
              ) : (
                projects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/projects/${p.id}`}>
                      <Card className="group p-5 border-border/50 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h3 className="font-bold tracking-tight group-hover:text-primary transition-colors">{p.title}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">ID: {p.id.slice(0, 8)}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">{p.status}</Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Investment</span>
                            <span className="font-bold">₹{Number(p.total_price).toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${p.completion_pct || 15}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] items-center">
                            <span className="text-muted-foreground italic">Projected: {p.deadline_at ? new Date(p.deadline_at).toLocaleDateString() : 'TBD'}</span>
                            <span className="font-mono text-primary">{p.completion_pct || 0}% SYNC</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden h-[600px] flex flex-col">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Live Activity Relay</h3>
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
                  {projects.slice(0, 5).map((p) => (
                    <div key={p.id} className="relative pl-6 border-l border-primary/20">
                      <div className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-[10px] font-mono text-primary/60 uppercase mb-1">Status Update</p>
                      <p className="text-xs font-medium text-slate-300">Project <span className="text-white">"{p.title}"</span> transition to <span className="text-primary">{p.status}</span> state.</p>
                      <p className="text-[9px] text-slate-500 mt-1 font-mono">{new Date().toLocaleTimeString()}</p>
                    </div>
                  ))}
                  {!projects.length && <p className="text-xs text-slate-500 font-medium italic">Scanning for telemetry...</p>}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Integrity</span>
                    <span className="text-[10px] font-mono text-primary">OPTIONAL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-black">Reliability</p>
                      <p className="text-xs font-bold text-slate-200">99.8%</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-black">Uptime</p>
                      <p className="text-xs font-bold text-slate-200">100%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
