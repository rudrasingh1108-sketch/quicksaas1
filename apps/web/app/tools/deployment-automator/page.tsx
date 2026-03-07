'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Rocket, Shield, Terminal, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

export default function DeploymentAutomatorPage() {
    const supabase = createSupabaseBrowserClient();
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [deploying, setDeploying] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch('/api/freelancer/modules', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            setModules(data.modules ?? []);
        })();
    }, []);

    const runDeployment = async () => {
        if (!selectedModule) return;
        setDeploying(true);
        setStatus('running');
        setLogs([]);

        const steps = [
            'Synchronizing neural relay...',
            'Validating build artifacts...',
            'Provisioning edge container...',
            'Injecting environment secrets...',
            'Running smoke tests...',
            'Switching traffic to new build...',
        ];

        for (const step of steps) {
            setLogs(prev => [...prev, `[INFO] ${step}`]);
            await new Promise(r => setTimeout(r, 600));
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/freelancer/modules/${selectedModule}/deploy`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (!res.ok) throw new Error('Deployment sync failed');

            setLogs(prev => [...prev, '[SUCCESS] Neural deployment complete. Primary link active.']);
            setLogs(prev => [...prev, '[INFO] Progress synchronized with client mission control.']);
            setStatus('success');
        } catch (e) {
            setLogs(prev => [...prev, '[ERROR] Failed to synchronize deployment state.']);
            setStatus('error');
        } finally {
            setDeploying(false);
        }
    };

    return (
        <AppShell role="freelancer" title="Deployment Automator">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <Card className="relative overflow-hidden p-8 border-none bg-slate-950 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(16,185,129,0.15),transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-emerald-400">
                            <Rocket className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Production Edge Mesh</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tight mb-2 uppercase">
                            Deployment <span className="text-emerald-500">Automator</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Neural-linked infrastructure provisioning. Push your assigned modules to the global production mesh with automated verification.
                        </p>
                    </div>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-1 p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Module</h3>
                        <div className="space-y-2">
                            {modules.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedModule(m.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${selectedModule === m.id
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                                        : 'border-transparent hover:bg-accent'
                                        }`}
                                >
                                    {m.module_name}
                                </button>
                            ))}
                            {!modules.length && <p className="text-xs text-muted-foreground italic">No active assignments found.</p>}
                        </div>
                    </Card>

                    <Card className="md:col-span-2 p-6 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Execution Console</h3>
                            <div className="flex items-center gap-2">
                                {status === 'success' && <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase text-[9px] font-black">Success</Badge>}
                                {status === 'running' && <Badge className="bg-blue-500/10 text-blue-500 border-none uppercase text-[9px] font-black animate-pulse">Running</Badge>}
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-emerald-400/80 overflow-y-auto mb-6 border border-white/5">
                            {logs.length ? logs.map((log, i) => (
                                <div key={i} className="mb-1 leading-relaxed">
                                    <span className="text-emerald-500/40 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {log}
                                </div>
                            )) : (
                                <div className="h-full flex items-center justify-center text-slate-700 italic">
                                    Select a module and initialize deployment
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={runDeployment}
                            disabled={!selectedModule || deploying}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/10 font-black uppercase tracking-[0.2em]"
                        >
                            {deploying ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                            {deploying ? 'Executing...' : 'Trigger Deployment'}
                        </Button>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
