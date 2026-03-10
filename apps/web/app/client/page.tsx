'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock3,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  Activity,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import IntakeForm from '../../components/project/intake-form';
import { useToast } from '../../lib/hooks/use-toast';
import { cn } from '../../lib/utils';

interface Project {
  id: string;
  title: string;
  status: string;
  total_price: number;
  completion_pct?: number;
  deadline_at?: string;
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/projects/${project.id}`}>
        <Card className="group p-6 border-border/50 bg-card hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-light tracking-tight text-foreground group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                REF: {project.id.slice(0, 8)}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-mono uppercase tracking-widest px-2 py-0.5">
              {project.status}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Total Investment</p>
                <p className="text-xl font-light text-foreground">₹{Number(project.total_price).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Timeline</p>
                <p className="text-xs text-foreground font-light italic">
                  {project.deadline_at ? new Date(project.deadline_at).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase text-muted-foreground">
                <span>Synchronizing</span>
                <span className="text-primary">{project.completion_pct || 0}%</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.completion_pct || 15}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function ClientDashboard() {
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setLoading(false);
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
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [supabase]);

  const totalSpend = useMemo(() => {
    return projects.reduce((acc, p) => acc + (Number(p.total_price) || 0), 0);
  }, [projects]);

  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes(p.status)).length;

  return (
    <AppShell role="client" title="Mission Control">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-border/50 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
              <span className="text-[10px] font-mono tracking-[0.3em] font-bold text-muted-foreground uppercase">System: Operational</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">Command Center</h1>
            <p className="text-muted-foreground font-light text-base max-w-xl leading-relaxed">
              Orchestrate your product engineering through our managed execution cycles.
              High-fidelity outcomes, delivered continuously.
            </p>
          </div>

          <Modal trigger={
            <button className="group relative px-10 py-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.3em] rounded-md transition-all hover:bg-primary shadow-xl hover:shadow-2xl">
              <span className="relative z-10 flex items-center gap-3">Initiate Vector <Plus className="w-4 h-4" /></span>
            </button>
          } title="Initialize New Brief">
            <IntakeForm />
          </Modal>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Active Links', value: String(activeProjects), icon: FolderKanban, trend: '+12%' },
            { label: 'Neural Spend', value: `₹${totalSpend.toLocaleString()}`, icon: Sparkles, trend: '+5%' },
            { label: 'Reliability', value: '99.8%', icon: ShieldCheck, trend: 'Stable' },
            { label: 'Cycle Speed', value: '4.2d', icon: Clock3, trend: '-0.5d' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 border-border/60 bg-card hover:border-primary/30 transition-colors shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-2 rounded-lg bg-accent text-primary">
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-primary bg-accent px-2 py-1 rounded-sm uppercase tracking-wider">
                    <TrendingUp className="w-3 h-3" /> {kpi.trend}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                  <p className="text-3xl font-light text-foreground tracking-tight">{kpi.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <h2 className="text-xs font-mono tracking-[0.4em] text-muted-foreground uppercase">Active Intelligence</h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse border border-border/30" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/50 rounded-xl bg-muted/5">
                <p className="text-muted-foreground font-light italic mb-8">No active execution vectors detected in your session.</p>
                <Modal trigger={
                  <button className="text-[10px] font-mono border-b border-primary text-primary tracking-[0.3em] uppercase hover:text-primary/70 transition-colors pb-1">
                    Initialize first briefing →
                  </button>
                } title="Launch New Project">
                  <IntakeForm />
                </Modal>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>

          {/* Activity Relay */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-2xl bg-accent/20 border border-border shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-12">
                <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">Session Relay</h2>
                <Activity className="w-4 h-4 text-primary" />
              </div>

              <div className="space-y-10 relative flex-1">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border group-hover:bg-primary/20 transition-colors" />

                {[
                  { time: 'T-0m', title: 'System Heartbeat', desc: 'Secure handshake complete. Dashboard linked.', status: 'processing' },
                  { time: 'T-45m', title: 'Specialist Shift', desc: 'Shift rotation complete. Global engineering active.', status: 'complete' },
                  { time: 'T-3h', title: 'Neural Update', desc: 'Project "Titan Flow" specifications synchronized.', status: 'complete' }
                ].map((item, i) => (
                  <div key={i} className="relative pl-10 group">
                    <div className={cn(
                      "absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-card z-10 transition-all duration-300",
                      item.status === 'processing' ? "bg-primary shadow-[0_0_10px_rgba(154,123,79,0.3)]" : "bg-muted-foreground/30 group-hover:bg-primary"
                    )} />
                    <div className="space-y-1.5 -mt-0.5">
                      <p className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest mb-1">{item.time}</p>
                      <p className="text-sm font-medium text-foreground tracking-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-10 py-4 rounded-md border border-border bg-card text-[10px] font-bold font-mono uppercase tracking-[0.3em] text-foreground hover:bg-primary hover:text-white transition-all shadow-sm">
                Full Telemetry Stream
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
