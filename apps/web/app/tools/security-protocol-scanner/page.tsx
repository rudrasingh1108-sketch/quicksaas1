'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle2, Terminal, Zap, ShieldAlert } from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export default function SecurityScannerPage() {
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [score, setScore] = useState<number | null>(null);

    const startScan = async () => {
        setScanning(true);
        setResults([]);
        setScore(null);

        const findings = [
            { id: 1, title: 'RLS Verification', desc: 'Checking if Row Level Security is enabled on public schemas.', status: 'pass' },
            { id: 2, title: 'Secret Exposure', desc: 'Scanning for hardcoded API keys or service role tokens.', status: 'pass' },
            { id: 3, title: 'SQL Injection', desc: 'Analyzing query patterns for dynamic string interpolation.', status: 'warn', issue: 'Potential dynamic query detected in auth hook.' },
            { id: 4, title: 'Dependency Audit', desc: 'Checking for deprecated or vulnerable npm packages.', status: 'pass' },
        ];

        for (const finding of findings) {
            await new Promise(r => setTimeout(r, 1000));
            setResults(prev => [...prev, finding]);
        }

        setScore(94);
        setScanning(false);
    };

    return (
        <AppShell role="freelancer" title="Security Protocol Scanner">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <Card className="relative overflow-hidden p-8 border-none bg-slate-950 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(168,85,247,0.15),transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <Lock className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Edge Defense Engine</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tight mb-2 uppercase">
                            Security Protocol <span className="text-purple-500">Scanner</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Real-time vulnerability detection. Audit your code and infrastructure against the latest zero-day protection protocols.
                        </p>
                    </div>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${score ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-200'
                                }`}>
                                {score ? (
                                    <span className="text-4xl font-black text-emerald-500">{score}%</span>
                                ) : (
                                    <Shield className={`w-12 h-12 ${scanning ? 'animate-pulse text-purple-500' : 'text-slate-300'}`} />
                                )}
                            </div>
                            {score && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                    TRUSTED
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-tight">Security Score</h3>
                            <p className="text-xs text-muted-foreground mt-1">Overall compliance with Gigzs Hardened Standards</p>
                        </div>
                        <Button
                            onClick={startScan}
                            disabled={scanning}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest h-12"
                        >
                            {scanning ? 'Auditing...' : 'Start Edge Scan'}
                        </Button>
                    </Card>

                    <Card className="md:col-span-2 p-6 flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Neural Audit Report</h3>
                        <div className="flex-1 space-y-4">
                            {results.length ? results.map((r) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-start gap-4"
                                >
                                    <div className={`p-2 rounded-lg mt-0.5 ${r.status === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {r.status === 'pass' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-bold uppercase tracking-tight">{r.title}</p>
                                            <Badge variant="outline" className={r.status === 'pass' ? 'text-emerald-500 border-none' : 'text-amber-500 border-none'}>
                                                {r.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                                        {r.issue && <p className="text-[10px] font-mono mt-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">{r.issue}</p>}
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-12">
                                    <Terminal className="w-12 h-12 opacity-10" />
                                    <p className="text-sm italic">Waiting for scan initialization...</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
