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

  return (
    <AppShell role="freelancer" title="Freelancer Workspace">
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !profile ? (
        <FreelancerOnboarding />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label} className="p-5"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-1 text-2xl font-semibold">{card.value}</p></Card>)}</div>

          {available.length > 0 && (
            <Card className="p-5 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <p className="text-lg font-semibold text-emerald-400">Available to Claim</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {available.map((module) => (
                  <Card key={module.id} className="p-4 border-emerald-500/20 bg-background/50 hover:border-emerald-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">{module.projects?.title || 'Unknown Project'}</p>
                        <p className="font-bold tracking-tight">{module.module_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Budget: ₹{Math.round((module.projects?.total_price || 0) * module.module_weight)}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none">NEW</Badge>
                    </div>
                    <button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-md font-medium text-sm transition-colors"
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
                      Accept Assignment
                    </button>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold tracking-tight">Active Assignments</h2>
                  <Badge variant="outline" className="font-mono text-[10px]">{modules.length} Connected</Badge>
                </div>
                {modules.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {modules.map((module, i) => (
                      <motion.div key={module.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                        <Link href={`/modules/${module.id}`}>
                          <Card className="group h-full p-5 border-border/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <p className="font-bold text-sm tracking-tight">{module.module_name}</p>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase text-[9px] font-black tracking-widest">{module.module_status}</Badge>
                            </div>

                            {module.shift && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                  <span>Shift Relay</span>
                                  <span className="text-emerald-500">{module.shift.status}</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: module.module_status === 'completed' ? '100%' : '0%' }}
                                    className="h-full bg-emerald-500"
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium italic">
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
                  <div className="relative overflow-hidden rounded-2xl border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground text-sm font-medium">No active neural links found.</p>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)]" />
                <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500 mb-6">Neural Activity Feed</h3>
                  <div className="space-y-6">
                    {activity.map((act, i) => (
                      <div key={act.id} className="relative pl-6 border-l border-emerald-500/20">
                        <div className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-mono text-emerald-500/60 uppercase mb-1">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs font-medium text-slate-300 line-clamp-2">{act.public_summary}</p>
                      </div>
                    ))}
                    {!activity.length && <p className="text-xs text-slate-500 font-medium italic">Waiting for telemetry...</p>}
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-4">Neural Status</h3>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-600/70 uppercase">Relay Nodes Synchronized</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell >
  );
}
