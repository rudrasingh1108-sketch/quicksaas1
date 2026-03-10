'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import FreelancerOnboarding from '../../components/freelancer/onboarding-form';

interface ModuleCard {
  id: string;
  module_name: string;
  module_status: string;
  shift?: {
    status: string;
    shift_start: string;
    shift_end: string;
  } | null;
}

export default function FreelancerDashboard() {
  const supabase = createSupabaseBrowserClient();
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token || !session.user) {
        setLoading(false);
        return;
      }

      const { data: actor } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      const actorId = actor?.id;

      const { data: profileData } = actorId
        ? await supabase
          .from('freelancer_profiles')
          .select('*')
          .eq('user_id', actorId)
          .maybeSingle()
        : { data: null as any };

      setProfile(profileData);

      const res = await fetch('/api/freelancer/modules', { headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json();
      setModules(payload.modules ?? []);
      setAvailable(payload.available ?? []);

      const { data: activityData } = await supabase
        .from('work_snapshots')
        .select('*, sender:users(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      setActivity(activityData ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('freelancer-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_module_assignments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules' }, load)
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, []);

  const cards = [
    { label: 'Reliability', value: profile?.reliability_score ? Number(profile.reliability_score).toFixed(2) : '-' },
    { label: 'Total Earnings', value: profile?.total_earnings_inr ? `₹${Number(profile.total_earnings_inr).toLocaleString()}` : '₹0' },
    { label: 'Active Modules', value: String(modules.filter(m => !['completed', 'cancelled'].includes(m.module_status)).length) },
    { label: 'Completion Rate', value: profile?.total_modules_completed ? `${Math.round((profile.total_modules_completed / (profile.total_modules_completed + (profile.total_modules_failed || 0))) * 100)}%` : '-' },
  ];

  const groupedAvailable = useMemo(() => {
    const groups: Record<string, { title: string, modules: any[] }> = {};
    available.forEach(m => {
      const pId = m.project_id;
      if (!groups[pId]) {
        groups[pId] = { title: m.projects?.title || 'Unknown Project', modules: [] };
      }
      groups[pId].modules.push(m);
    });
    return Object.entries(groups);
  }, [available]);

  return (
    <AppShell role="freelancer" title="Freelancer Workspace">
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !profile ? (
        <FreelancerOnboarding />
      ) : (
        <div className="space-y-10">
          {/* KPI Grid */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label} className="p-6 border-border/60 shadow-sm bg-card hover:border-primary/30 transition-colors">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">{card.label}</p>
                <p className="text-3xl font-light text-foreground tracking-tight">{card.value}</p>
              </Card>
            ))}
          </div>

          {available.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">Available Tasks</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {groupedAvailable.map(([pId, project]) => (
                  <Card key={pId} className="p-6 border-primary/15 bg-accent/20 flex flex-col gap-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                      <h3 className="font-mono font-bold text-primary uppercase tracking-[0.2em] text-[10px]">{project.title}</h3>
                      <Badge className="bg-accent text-primary border-none text-[9px] font-mono uppercase tracking-widest">{project.modules.length} TASKS</Badge>
                    </div>

                    <div className="space-y-3">
                      {project.modules.map((module: any) => (
                        <div key={module.id} className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
                          <div className="flex justify-between items-start mb-3">
                            <p className="font-medium text-sm text-foreground">{module.module_name}</p>
                            <span className="text-primary font-mono font-bold text-sm">₹{module.budget_inr?.toLocaleString() || '0'}</span>
                          </div>
                          <button
                            className="w-full bg-foreground hover:bg-primary text-background py-2 rounded-md font-mono font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm"
                            onClick={async () => {
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                await fetch(`/api/freelancer/modules/${module.id}/claim`, {
                                  method: 'POST',
                                  headers: { Authorization: `Bearer ${session?.access_token}` }
                                });
                                load();
                              } catch (e) { console.error(e); }
                            }}
                          >
                            Claim Task
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card className="p-8 border-border/60 shadow-sm bg-card">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">Active Assignments</h2>
                  <Badge className="bg-accent text-primary border-none text-[9px] font-mono uppercase tracking-widest">{modules.length} Connected</Badge>
                </div>
                {modules.length ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {modules.map((module, i) => (
                      <motion.div key={module.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                        <Link href={`/modules/${module.id}`}>
                          <Card className="group h-full p-5 border-border/60 hover:border-primary/30 hover:shadow-md transition-all bg-card">
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent text-primary">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <p className="font-medium text-sm tracking-tight text-foreground">{module.module_name}</p>
                              </div>
                              <Badge className="bg-accent text-primary border-none uppercase text-[9px] font-mono tracking-widest">{module.module_status}</Badge>
                            </div>

                            {module.shift && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-[0.2em]">
                                  <span>Shift Relay</span>
                                  <span className="text-primary">{module.shift.status}</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: module.module_status === 'completed' ? '100%' : '0%' }}
                                    className="h-full bg-primary"
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-light italic">
                                  Shift ends {new Date(module.shift.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 p-16 text-center bg-muted/10">
                    <p className="text-muted-foreground text-sm font-light italic">No active neural links found.</p>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-8">
              {/* Neural Activity Feed */}
              <Card className="p-6 bg-foreground text-background border-none shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(154,123,79,0.1),transparent_70%)]" />
                <div className="relative z-10">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-primary mb-8">Neural Activity Feed</h3>
                  <div className="space-y-6">
                    {activity.map((act, i) => (
                      <div key={act.id} className="relative pl-6 border-l border-primary/20">
                        <div className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
                        <p className="text-[9px] font-mono text-primary/60 uppercase tracking-widest mb-1">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs font-light text-white/70 line-clamp-2">{act.public_summary}</p>
                      </div>
                    ))}
                    {!activity.length && <p className="text-xs text-white/30 font-light italic">Waiting for telemetry...</p>}
                  </div>
                </div>
              </Card>

              {/* Neural Status */}
              <Card className="p-6 border-primary/15 bg-accent/20">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-primary mb-4">Neural Status</h3>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
                  <span className="text-[10px] font-mono text-primary/70 uppercase tracking-wider">Relay Nodes Synchronized</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
