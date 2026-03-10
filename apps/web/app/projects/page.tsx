'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import { useToast } from '../../lib/hooks/use-toast';
import { Button } from '../../components/ui/button';

export default function ProjectsPage() {
  const supabase = createSupabaseBrowserClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { show } = useToast();

  async function load() {
    setLoading(true);
    setError(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
    const raw = await res.text();
    const payload = raw ? (JSON.parse(raw) as any) : {};

    if (!res.ok) {
      setLoading(false);
      setError(payload.error ?? 'Failed to load projects');
      return;
    }

    setProjects(payload.projects ?? []);
    setLoading(false);
  }

  async function deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project? This will also cancel all associated modules.')) return;

    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to delete project');
      show('Success', 'Project deleted successfully');
      load();
    } catch (e: any) {
      show('Error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell role="client" title="Projects">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-12 border-b border-border/50 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
            <span className="text-[10px] font-mono tracking-[0.3em] font-bold text-muted-foreground uppercase">Project Overview</span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-foreground">Active Missions</h1>
        </header>

        <Card className="p-8 border-border/60 shadow-sm bg-card">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border/50 rounded-xl">
              <p className="text-sm font-light text-muted-foreground italic">No active missions initialized.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b border-border/60">
                    <th className="pb-4 font-mono text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground">Title</th>
                    <th className="pb-4 font-mono text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground">Status</th>
                    <th className="pb-4 font-mono text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground">Investment</th>
                    <th className="pb-4 font-mono text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground">Created</th>
                    <th className="pb-4 font-mono text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors group">
                      <td className="py-5 font-medium text-foreground">
                        <Link className="hover:text-primary transition-colors flex items-center gap-2" href={`/projects/${p.id}`}>
                          {p.title}
                          <ArrowUpRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-5">
                        <Badge className="bg-accent text-primary border-none text-[9px] font-mono uppercase tracking-widest px-2 py-0.5">{p.status}</Badge>
                      </td>
                      <td className="py-5 text-foreground font-light tracking-tight">₹{Number(p.total_price ?? 0).toLocaleString()}</td>
                      <td className="py-5 text-muted-foreground font-light italic">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
                      <td className="py-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProject(p.id)}
                          disabled={deletingId === p.id}
                          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors h-8 w-8 p-0"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
