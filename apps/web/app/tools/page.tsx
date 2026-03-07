'use client';

import Link from 'next/link';
import { AppShell } from '../../components/layout/app-shell';
import { Card } from '../../components/ui/card';
import { motion } from 'framer-motion';
import { Cpu, Database, Zap, Shield, Globe, Terminal, Box, Sparkles, Rocket } from 'lucide-react';

const tools = [
  {
    title: 'Deployment Automator',
    desc: 'Neural-linked infrastructure provisioning for production edge mesh.',
    icon: Rocket,
    color: 'from-emerald-500 to-teal-600',
    status: 'OPTIMIZED',
    stats: 'Edge Sync active'
  },
  {
    title: 'SQL Schema Architect',
    desc: 'AI-driven relational mapping and Supabase bridge generator.',
    icon: Database,
    color: 'from-blue-500 to-indigo-600',
    status: 'ACTIVE',
    stats: '99.9% integrity'
  },
  {
    title: 'Security Protocol Scanner',
    desc: 'Real-time vulnerability detection and edge-security hardening.',
    icon: Shield,
    color: 'from-purple-500 to-pink-600',
    status: 'READY',
    stats: 'Zero-day protection'
  },
  {
    title: 'Global CDN Optimizer',
    desc: 'Multi-region asset distribution and smart-caching engine.',
    icon: Globe,
    color: 'from-amber-500 to-orange-600',
    status: 'STANDBY',
    stats: 'Global mesh'
  }
];

export default function ToolsPage() {
  return (
    <AppShell role="freelancer" title="Command Center Tools">
      <div className="space-y-8 pb-20">
        {/* Majestic Header Card */}
        <Card className="relative overflow-hidden p-10 border-none bg-slate-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(16,185,129,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.8),transparent)]" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Advanced Utility Suite</span>
            </div>
            <h1 className="text-4xl font-black italic tracking-tight mb-4 uppercase">
              Neural <span className="text-emerald-500">Toolkit</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Proprietary execution utilities engineered for the modern digital factory.
              Accelerate your workflow with AI-orchestrated infrastructure.
            </p>
          </div>

          {/* Animated Background Element */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-20 hidden lg:block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div className="w-64 h-64 rounded-full border border-emerald-500/30 border-dashed" />
              <div className="absolute inset-4 rounded-full border border-emerald-500/20 border-dotted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Box className="w-12 h-12 text-emerald-500" />
              </div>
            </motion.div>
          </div>
        </Card>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/tools/${tool.title.toLowerCase().replace(/ /g, '-')}`}>
                <Card className="group relative overflow-hidden p-8 border border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-all cursor-pointer shadow-xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${tool.color} shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-emerald-500 tracking-widest">{tool.status}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{tool.stats}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                      {tool.desc}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3 h-3 text-emerald-500/50" />
                        <span className="text-[10px] text-slate-500 font-mono">v4.2.0-stable</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <span className="text-xs font-black uppercase">Initialize</span>
                        <Sparkles className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
