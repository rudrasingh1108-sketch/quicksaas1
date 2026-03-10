'use client';

import { useEffect, useState, useMemo } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { History, FileCode, CheckCircle2, Clock, Cpu, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ProjectChat } from '../../../components/project/project-chat';
import { AIProgressEngine } from '@services/ai-progress-engine';

interface ModuleItem { id: string; module_name: string; module_status: string; module_weight: number; budget_inr: number; assigned_freelancer_id?: string; due_at?: string; freelancer?: { full_name: string } }
interface SessionItem { id: string; module_id: string; deployment_url: string; build_url: string; session_status: string; }
interface ProgressLog { id: string; module_id: string; public_summary: string; percent_delta: number; created_at: string; }
interface Snapshot { id: string; module_id: string; public_summary: string; created_at: string; }

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const [project, setProject] = useState<any>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function load() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/projects/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const raw = await res.text();
    const payload = raw ? (JSON.parse(raw) as any) : {};

    if (!res.ok) {
      setLoading(false);
      return;
    }

    setProject(payload.project);
    setModules(payload.modules ?? []);
    setSessions(payload.sessions ?? []);
    setLogs(payload.progressLogs ?? []);
    setSnapshots(payload.workSnapshots ?? []);
    const aiAnalysis = payload.aiAnalysis ?? { progress: 0, summary: "Analysis pending..." };
    // We can store this in a state if we want to show it in the UI
    setProject((prev: any) => ({ ...prev, aiAnalysis }));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('users').select('id').eq('auth_user_id', user.id).single();
      if (profile) setCurrentUserId(profile.id);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();

    const moduleChannel = supabase.channel(`project-modules-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules', filter: `project_id=eq.${params.id}` }, load)
      .subscribe();

    const projectChannel = supabase.channel(`project-status-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${params.id}` }, load)
      .subscribe();

    const logChannel = supabase.channel(`project-logs-${params.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'progress_logs', filter: `project_id=eq.${params.id}` }, load)
      .subscribe();

    return () => {
      void supabase.removeChannel(moduleChannel);
      void supabase.removeChannel(projectChannel);
      void supabase.removeChannel(logChannel);
    };
  }, [params.id]);

  const completion = useMemo(() => AIProgressEngine.calculateProjectProgress(modules), [modules]);

  const latestDeploymentUrl = useMemo(() => {
    const readySession = sessions.find(s => s.deployment_url && (s.session_status === 'ready' || s.session_status === 'deployed'));
    return readySession?.deployment_url || null;
  }, [sessions]);

  return (
    <AppShell role="client" title="Project Detail">
      {loading ? <Skeleton className="h-80 w-full" /> : (
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Project Header */}
          <div className="border-b border-border/50 pb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
              <span className="text-[10px] font-mono tracking-[0.3em] font-bold text-muted-foreground uppercase">Mission Brief</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mb-3">{project?.title}</h1>
            {project?.aiAnalysis?.summary && (
              <div className="mt-4 flex items-start gap-2 p-4 rounded-xl bg-accent/30 border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 font-light leading-relaxed">{project.aiAnalysis.summary}</p>
              </div>
            )}
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-border/60 shadow-sm bg-card">
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Status</p>
              <Badge className="bg-accent text-primary border-none text-[10px] font-mono uppercase tracking-widest px-3 py-1">{project?.status}</Badge>
            </Card>
            <Card className="p-6 border-border/60 shadow-sm bg-card">
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Completion</p>
              <p className="text-3xl font-light text-foreground tracking-tight">{completion}%</p>
            </Card>
            <Card className="p-6 border-border/60 shadow-sm bg-card">
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Total Investment</p>
              <p className="text-3xl font-light text-foreground tracking-tight">₹{Number(project?.total_price || 0).toLocaleString()}</p>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {/* Execution Pipeline */}
              <Card className="p-8 border-border/60 shadow-sm bg-card">
                <div className="flex items-center gap-3 mb-8">
                  <Cpu className="h-4 w-4 text-primary" />
                  <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">Execution Pipeline</h2>
                </div>
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="rounded-xl border border-border/60 p-5 hover:border-primary/30 transition-colors bg-muted/10">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-foreground">{module.module_name}</p>
                          </div>
                          {module.freelancer?.full_name ? (
                            <p className="text-xs text-muted-foreground">
                              Assigned to: <span className="font-medium text-foreground">{module.freelancer.full_name}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Unassigned</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-accent text-primary border-none text-[9px] font-mono uppercase tracking-widest px-2 py-0.5">{module.module_status}</Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ₹{module.budget_inr?.toLocaleString() || Math.round(project?.total_price * module.module_weight).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <Progress value={module.module_status === 'completed' ? 100 : module.module_status === 'in_progress' ? 55 : 20} />
                      </div>
                      {module.due_at && (
                        <p className="text-[9px] text-right font-mono text-muted-foreground tracking-widest uppercase mt-2">ETA: {new Date(module.due_at).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Execution Timeline */}
              <Card className="p-8 border-border/60 shadow-sm bg-card">
                <div className="flex items-center gap-3 mb-8">
                  <History className="h-4 w-4 text-primary" />
                  <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">Execution Timeline</h2>
                </div>
                <div className="space-y-6">
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-muted/10 border border-dashed border-border/50 rounded-xl">
                      <p className="text-sm text-muted-foreground italic">Waiting for first execution update...</p>
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={log.id} className="relative pl-8 border-l-2 border-border/40 pb-6 last:pb-0 hover:border-primary/40 transition-colors">
                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(154,123,79,0.4)]" />
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{new Date(log.created_at).toLocaleString()}</p>
                          {log.percent_delta > 0 && <Badge className="bg-accent text-primary border-none text-[9px] font-mono">+{log.percent_delta}%</Badge>}
                        </div>
                        <p className="text-sm text-foreground font-light leading-relaxed">{log.public_summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              {/* System Output */}
              <Card className="p-6 border-border/60 shadow-sm bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">System Output</h2>
                  <Badge className="bg-accent text-primary border-none text-[9px] font-mono uppercase tracking-widest px-2 py-1">
                    {latestDeploymentUrl ? 'LIVE' : 'SIMULATED'}
                  </Badge>
                </div>
                {latestDeploymentUrl ? (
                  <div className="relative group">
                    <iframe className="h-[400px] w-full rounded-xl border border-border bg-white shadow-sm transition-all group-hover:border-primary/30" src={latestDeploymentUrl} />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="text-[10px] font-mono uppercase tracking-wider bg-card/90 backdrop-blur-sm" onClick={() => window.open(latestDeploymentUrl, '_blank')}>
                        Open External
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-border bg-foreground p-0 font-mono text-[11px] text-primary shadow-sm flex flex-col">
                    {/* Simulated Browser Header */}
                    <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3 shrink-0">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                      </div>
                      <div className="flex-1 flex items-center rounded-md bg-black/30 px-3 py-1.5 text-[10px] text-white/30 border border-white/5">
                        {project?.title?.toLowerCase().replace(/\s+/g, '-') || 'project'}.gigzs.preview
                      </div>
                    </div>
                    {/* Log Stream Terminal */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-1.5">
                      {logs.length === 0 ? (
                        <div className="text-white/30 animate-pulse mt-2">Waiting for execution logs...</div>
                      ) : (
                        [...logs].reverse().map((log) => (
                          <div key={log.id} className="flex gap-3 font-mono leading-relaxed">
                            <span className="text-white/20 shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                            <span className={log.percent_delta > 0 ? "text-primary" : "text-white/50"}>
                              <span className="text-white/40">[sys]</span> {log.public_summary} {log.percent_delta > 0 ? `(+${log.percent_delta}%)` : ''}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Managed Resources */}
              <Card className="p-6 border-border/60 shadow-sm bg-card">
                <h2 className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4">Managed Resources</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:border-primary/20 transition-colors">
                    <span className="text-sm font-light text-foreground">GitHub Repository</span>
                    <a href={project?.github_repo_url || `https://github.com/gigzs-deploy/${project?.id}`} target="_blank" rel="noreferrer" className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:underline">
                      {project?.github_repo_url ? 'View Repo' : 'Pending'}
                    </a>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/10 hover:border-primary/20 transition-colors">
                    <span className="text-sm font-light text-foreground">Cloud Environment</span>
                    {latestDeploymentUrl ? (
                      <a href={latestDeploymentUrl} target="_blank" rel="noreferrer" className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:underline">
                        Open URL
                      </a>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground text-[9px] font-mono uppercase tracking-widest border-none">Pending</Badge>
                    )}
                  </div>
                </div>
              </Card>

              {currentUserId && (
                <ProjectChat projectId={params.id} currentUserId={currentUserId} />
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
