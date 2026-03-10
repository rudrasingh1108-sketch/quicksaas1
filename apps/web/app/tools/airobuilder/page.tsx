'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import Image from 'next/image';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { useToast } from '../../../lib/hooks/use-toast';
import AiroBuilderWorkspace from '../../../components/freelancer/airobuilder-workspace';

export default function AiroBuilderToolsPage() {
  const supabase = createSupabaseBrowserClient();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('freelancer');
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const actorRes = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        if (actorRes.data?.role) setRole(actorRes.data.role);

        const res = await fetch('/api/freelancer/modules', { headers: { Authorization: `Bearer ${token}` } });
        const raw = await res.json();
        if (!res.ok) throw new Error(raw.error ?? 'Failed to load modules');
        setModules(raw.modules ?? []);
      } catch (e: any) {
        show('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell role={role} title="AiroBuilder">
      <div className="space-y-8">
        <Card className="p-8 text-foreground bg-white border-border shadow-md">
          <div className="flex items-center gap-6">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center overflow-hidden p-1">
              <Image src="/images/airo-builder-logo.png" alt="Airo Builder" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <p className="text-2xl font-black text-primary italic underline decoration-accent decoration-4 underline-offset-8">Provision workspaces</p>
              <p className="mt-3 text-lg text-muted-foreground font-medium">
                Launch AiroBuilder sessions for your assigned modules.
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : modules.length ? (
          <div className="space-y-10">
            {modules.map((m) => (
              <div key={m.id} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <p className="text-xl font-black text-primary uppercase tracking-tight italic">{m.module_name}</p>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1">Assignment ID: {m.id}</p>
                  </div>
                </div>
                <AiroBuilderWorkspace moduleId={m.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950 p-16 text-center shadow-2xl">
            {/* Background Neural Grid */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_30px_rgba(124,58,237,0.1)] overflow-hidden p-2"
              >
                <Image src="/images/airo-builder-logo.png" alt="Airo Builder" width={80} height={80} className="object-contain" />
              </motion.div>

              <h3 className="text-3xl font-black tracking-tight text-white mb-4 uppercase italic">
                AI Builder <span className="text-emerald-500">Synchronizing</span>
              </h3>
              <p className="text-emerald-500/60 max-w-sm mx-auto mb-10 font-mono text-xs uppercase tracking-[0.3em] leading-relaxed">
                The GoDaddy-powered neural engine is active. Your assignments will manifest here once the match engine completes orchestration.
              </p>

              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400/70 font-mono uppercase">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Orchestrator Online
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-400/70 font-mono uppercase">
                  <Zap className="h-3 w-3" />
                  Neural Link Ready
                </div>
              </div>
            </div>

            {/* Scanning line */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-20 w-full animate-wave opacity-30" style={{ animationDuration: '5s' }} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
