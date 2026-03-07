'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Zap, RefreshCw, BarChart3, Activity, Sparkles } from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

const regions = [
    { id: 'us-east', name: 'US East (N. Virginia)', status: 'active', latency: '24ms' },
    { id: 'eu-west', name: 'EU West (Ireland)', status: 'standby', latency: '82ms' },
    { id: 'ap-south', name: 'Asia Pacific (Mumbai)', status: 'standby', latency: '142ms' },
    { id: 'sa-east', name: 'South America (São Paulo)', status: 'offline', latency: '-' },
];

export default function GlobalCdnOptimizerPage() {
    const [activeRegions, setActiveRegions] = useState(['us-east']);
    const [provisioning, setProvisioning] = useState<string | null>(null);

    const activateRegion = async (id: string) => {
        setProvisioning(id);
        await new Promise(r => setTimeout(r, 2000));
        setActiveRegions(prev => [...prev, id]);
        setProvisioning(null);
    };

    return (
        <AppShell role="freelancer" title="Global CDN Optimizer">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <Card className="relative overflow-hidden p-8 border-none bg-slate-950 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(245,158,11,0.15),transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-amber-400">
                            <Globe className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Multi-Region Mesh Controller</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tight mb-2 uppercase">
                            Global CDN <span className="text-amber-500">Optimizer</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Dynamic asset distribution. Provision edge nodes globally to minimize latency and ensure next-gen performance for your modules.
                        </p>
                    </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 p-0 overflow-hidden bg-slate-900 border-none relative min-h-[400px]">
                        {/* Simulated Map Background */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full max-w-2xl max-h-[300px]">
                                {/* Simulated Pins */}
                                <div className="absolute top-[30%] left-[25%]"><MapPin className={`w-6 h-6 ${activeRegions.includes('us-east') ? 'text-amber-500 fill-amber-500/20' : 'text-slate-600'}`} /></div>
                                <div className="absolute top-[25%] left-[45%]"><MapPin className={`w-6 h-6 ${activeRegions.includes('eu-west') ? 'text-amber-500 fill-amber-500/20' : 'text-slate-600'}`} /></div>
                                <div className="absolute top-[50%] left-[70%]"><MapPin className={`w-6 h-6 ${activeRegions.includes('ap-south') ? 'text-amber-500 fill-amber-500/20' : 'text-slate-600'}`} /></div>
                                <div className="absolute top-[75%] left-[30%]"><MapPin className={`w-6 h-6 ${activeRegions.includes('sa-east') ? 'text-amber-500 fill-amber-500/20' : 'text-slate-600'}`} /></div>
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-6 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Global Mesh Connected</span>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Region Orchestration</h3>
                            <div className="space-y-4">
                                {regions.map((reg) => {
                                    const isActive = activeRegions.includes(reg.id);
                                    const isProvisioning = provisioning === reg.id;
                                    return (
                                        <div key={reg.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-tight italic">{reg.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={`h-4 text-[8px] border-none uppercase font-black ${isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-200 text-gray-400'}`}>
                                                        {isActive ? 'Active' : isProvisioning ? 'Provisioning...' : 'Standby'}
                                                    </Badge>
                                                    {isActive && <span className="text-[10px] font-mono text-slate-400">{reg.latency}</span>}
                                                </div>
                                            </div>
                                            {!isActive && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => activateRegion(reg.id)}
                                                    disabled={!!provisioning}
                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-amber-100 hover:text-amber-600"
                                                >
                                                    {isProvisioning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="p-6 bg-amber-50/50 border-amber-200/50">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-amber-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Mesh Analytics</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-medium text-amber-800/60 uppercase">Egress Efficiency</span>
                                    <span className="text-xs font-black text-amber-800">99.4%</span>
                                </div>
                                <div className="h-1 w-full bg-amber-200/50 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '99.4%' }} className="h-full bg-amber-500" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
