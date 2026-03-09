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
        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-2xl font-semibold">{project?.title}</p>
            {project?.aiAnalysis?.summary && (
              <p className="mt-2 text-xs text-primary font-medium bg-primary/5 p-2 rounded border border-primary/10">
                <Sparkles className="h-3 w-3 inline mr-1 -mt-0.5" />
                AI Analysis: {project.aiAnalysis.summary}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">Live execution pipeline</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-2">{project?.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Completion</p><p className="mt-2 text-lg font-medium">{completion}%</p></div>
              <div><p className="text-xs text-muted-foreground">Payment summary</p><p className="mt-2 text-lg font-medium">₹{project?.total_price}</p></div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <Card className="p-6">
                <p className="font-semibold mb-4">Live execution pipeline</p>
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">{module.module_name}</p>
                          </div>
                          {module.freelancer?.full_name ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              Assigned to: <span className="font-medium text-foreground">{module.freelancer.full_name}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Unassigned</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge>{module.module_status}</Badge>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            Budget: <span className="font-medium">₹{module.budget_inr?.toLocaleString() || Math.round(project?.total_price * module.module_weight).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <Progress value={module.module_status === 'completed' ? 100 : module.module_status === 'in_progress' ? 55 : 20} />
                      </div>
                      {module.due_at && (
                        <p className="text-[10px] text-right text-muted-foreground tracking-wider uppercase">ETA: {new Date(module.due_at).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Execution Timeline</p>
                </div>
                <div className="space-y-6">
                  {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Waiting for first execution update...</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={log.id} className="relative pl-6 border-l border-border pb-6 last:pb-0">
                        <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                          {log.percent_delta > 0 && <Badge className="bg-emerald-500/10 text-emerald-500 border-none">+{log.percent_delta}% progress</Badge>}
                        </div>
                        <p className="text-sm">{log.public_summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500">System Output</p>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none animate-pulse px-3 py-1 font-mono text-[10px]">
                    {latestDeploymentUrl ? 'LIVE_PRODUCTION' : 'SIMULATED_ENVIRONMENT'}
                  </Badge>
                </div>
                {latestDeploymentUrl ? (
                  <div className="relative group">
                    <iframe className="h-[480px] w-full rounded-xl border-2 border-border bg-white shadow-2xl transition-all group-hover:border-primary/30" src={latestDeploymentUrl} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => window.open(latestDeploymentUrl, '_blank')}>
                        Open External
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-[480px] w-full overflow-hidden rounded-xl border-2 border-slate-800 bg-slate-950 p-0 font-mono text-[11px] text-emerald-400 shadow-2xl flex flex-col">
                    {/* Simulated Browser Header */}
                    <div className="flex items-center gap-3 border-b border-white/5 bg-slate-900/50 px-4 py-3 shrink-0">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500/40" />
                        <div className="h-3 w-3 rounded-full bg-amber-500/40" />
                        <div className="h-3 w-3 rounded-full bg-emerald-500/40" />
                      </div>
                      <div className="flex-1 flex items-center rounded-lg bg-black/40 px-3 py-1.5 text-[10px] text-emerald-500/40 border border-white/5">
                        {project?.title?.toLowerCase().replace(/\s+/g, '-') || 'project'}.gigzs.preview
                      </div>
                    </div>

                    {/* Log Stream Terminal */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-1.5">
                      {logs.length === 0 ? (
                        <div className="text-emerald-500/50 animate-pulse mt-2">Waiting for execution logs...</div>
                      ) : (
                        [...logs].reverse().map((log) => (
                          <div key={log.id} className="flex gap-3 font-mono leading-relaxed">
                            <span className="text-emerald-500/40 shrink-0">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                            <span className={log.percent_delta > 0 ? "text-emerald-400" : "text-emerald-500/80"}>
                              <span className="text-white/70">[system]</span> {log.public_summary} {log.percent_delta > 0 ? `(+${log.percent_delta}%)` : ''}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <p className="text-sm font-medium mb-3">Managed Resources</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border border-border bg-card/50">
                    <span className="text-xs">GitHub Repository</span>
                    <a href={project?.github_repo_url || `https://github.com/gigzs-deploy/${project?.id}`} target="_blank" rel="noreferrer" className="text-[10px] hover:underline flex items-center gap-1 text-primary">
                      {project?.github_repo_url ? 'View Live Repo' : 'View Repo (Pending)'}
                    </a>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-border bg-card/50">
                    <span className="text-xs">Cloud Environment</span>
                    {latestDeploymentUrl ? (
                      <a href={latestDeploymentUrl} target="_blank" rel="noreferrer" className="text-[10px] hover:underline flex items-center gap-1 text-primary">
                        Open URL
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">PENDING LOGS</Badge>
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
