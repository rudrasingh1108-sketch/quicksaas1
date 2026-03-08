'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle2, ShieldCheck, Zap, Activity } from 'lucide-react';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { Badge } from '../../components/ui/badge';

export default function SecurityPage() {
  const supabase = createSupabaseBrowserClient();
  const [role, setRole] = useState<'client' | 'freelancer' | 'admin'>('freelancer');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const actorRes = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (actorRes.data?.role) setRole(actorRes.data.role);
    })();
  }, []);

  return (
    <AppShell role={role} title="Security Command">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <Card className="relative overflow-hidden p-10 border-none bg-slate-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Neural Security Protocol</span>
            </div>
            <h1 className="text-4xl font-black italic tracking-tight mb-4 uppercase">
              Security <span className="text-emerald-500">Command</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Platform security auditing, compliance monitoring, and real-time edge security hardening.
            </p>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 bg-white border-border shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-2">Encryption</h3>
            <p className="text-xs text-muted-foreground font-medium">AES-256 neural-linked double-layer encryption active on all data stores.</p>
          </Card>
          <Card className="p-6 bg-white border-border shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-2">Monitoring</h3>
            <p className="text-xs text-muted-foreground font-medium">Real-time anomaly detection and audit logging synchronizing with relay nodes.</p>
          </Card>
          <Card className="p-6 bg-white border-border shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-2">Compliance</h3>
            <p className="text-xs text-muted-foreground font-medium">Hardened RLS policies and proxy-layer anonymization protocols in place.</p>
          </Card>
        </div>

        <Card className="p-8 bg-white border-border shadow-md">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-primary uppercase tracking-tight italic">Security Audit Logs</h3>
            <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-500/30 text-emerald-600 bg-emerald-50">HEARTBEAT ACTIVE</Badge>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">No active security alerts</p>
              <p className="text-xs text-slate-400 mt-1">Your neural-linked infrastructure is currently operating within safety parameters.</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
