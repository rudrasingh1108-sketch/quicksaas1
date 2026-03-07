'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, History as HistoryIcon, ShieldCheck, Zap, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { Badge } from '../../components/ui/badge';

export default function HistoryPage() {
  const supabase = createSupabaseBrowserClient();
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('freelancer');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const actorRes = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (actorRes.data?.role) setRole(actorRes.data.role);

      const actorId = actorRes.data?.id;
      if (!actorId) {
        setLoading(false);
        return;
      }

      const assignments = await supabase
        .from('project_module_assignments')
        .select('module_id')
        .eq('freelancer_id', actorId)
        .is('deleted_at', null);

      const moduleIds = (assignments.data ?? []).map((a: any) => a.module_id);
      if (!moduleIds.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const snapshots = await supabase
        .from('work_snapshots')
        .select('id, module_id, snapshot_type, public_summary, created_at')
        .in('module_id', moduleIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      setRows(snapshots.data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell role={role} title="Execution Archive">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <Card className="relative overflow-hidden p-10 border-none bg-slate-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Database className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Neural History Log</span>
            </div>
            <h1 className="text-4xl font-black italic tracking-tight mb-4 uppercase">
              Execution <span className="text-emerald-500">Archive</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Comprehensive immutable record of all neural-linked executions, check-ins, and shift relay handoffs.
            </p>
          </div>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Loading Telemetry...</p>
          </div>
        ) : rows.length ? (
          <div className="space-y-4">
            {rows.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 bg-white border-border shadow-sm hover:border-emerald-500/30 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-primary uppercase tracking-tight italic">{r.snapshot_type.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-50 border-gray-100 text-[10px] font-bold py-1 px-3">VERIFIED</Badge>
                  </div>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed mb-6">{r.public_summary || 'No summary provided.'}</p>
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Hash ID: {r.id.slice(0, 12)}</p>
                    </div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Module: {r.module_id.slice(0, 8)}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950 p-20 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <HistoryIcon className="h-12 w-12 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mb-4 uppercase italic">Archive Empty</h3>
              <p className="text-emerald-500/60 max-w-sm mx-auto mb-10 font-mono text-xs uppercase tracking-[0.3em] leading-relaxed">
                Immutable ledger is active. Records will manifest upon your first neural-linked execution.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
