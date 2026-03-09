'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Terminal, Shield, Zap, Activity, Globe, Cpu, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

// ── COMPONENTS ─────────────────────────────────────────────────────────────

function GlitchText({ text }: { text: string }) {
  return (
    <div className="relative inline-block group">
      <span className="relative z-10">{text}</span>
      <span
        className="absolute top-0 left-0 -z-10 text-[#00FFB2] opacity-0 group-hover:opacity-70 group-hover:animate-glitch select-none"
        style={{ clipPath: 'inset(40% 0 61% 0)', animationDuration: '0.2s' }}
      >
        {text}
      </span>
      <span
        className="absolute top-0 left-0 -z-10 text-[#4DFFFF] opacity-0 group-hover:opacity-70 group-hover:animate-glitch select-none"
        style={{ clipPath: 'inset(18% 0 82% 0)', animationDuration: '0.3s', animationDirection: 'reverse' }}
      >
        {text}
      </span>
    </div>
  );
}

function LiveTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const fullLines = useMemo(() => [
    "> Initialize Gigzs Protocol...",
    "> Scoping requirements...",
    "> Deploying specialist unit...",
    "> Handoff complete ✓",
    "> Milestone verified ✓",
    "> All systems operational."
  ], []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setLines(prev => {
        const next = [...prev, fullLines[i]];
        return next.slice(-4);
      });
      i = (i + 1) % fullLines.length;
    }, 2000);
    return () => clearInterval(interval);
  }, [fullLines]);

  return (
    <div className="w-full max-w-lg mx-auto mt-12 font-mono text-xs bg-black/60 border border-primary/20 p-5 rounded-sm shadow-[0_0_30px_rgba(0,255,178,0.1)] backdrop-blur-xl">
      <div className="flex gap-1.5 mb-4 border-b border-primary/10 pb-3">
        <div className="w-2 h-2 rounded-full bg-primary/40" />
        <div className="w-2 h-2 rounded-full bg-primary/20" />
        <div className="w-2 h-2 rounded-full bg-primary/10" />
      </div>
      <div className="space-y-2 min-h-[100px]">
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-3 items-start animate-slide-up">
            <span className="text-primary/40 mt-0.5">$</span>
            <span className="text-primary/90 leading-tight">{line}</span>
          </div>
        ))}
        <div className="flex gap-3">
          <span className="text-primary/40 mt-0.5">$</span>
          <span className="w-1.5 h-4 bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const target = parseInt(value);
      let start = 0;
      const duration = 2000;
      const increment = target / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="group py-10 px-6 border-l border-primary/10 last:border-r hover:bg-primary/[0.02] transition-colors">
      <div className="text-5xl font-black tracking-tighter text-primary mb-2 flex items-baseline">
        {count}{value.includes('+') ? '+' : ''}
        <span className="text-sm font-mono ml-2 opacity-50">{value.includes('%') ? '%' : ''}</span>
      </div>
      <div className="text-[9px] font-mono tracking-[0.4em] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function ProtocolCard({ index, title, desc, icon: Icon }: { index: string; title: string; desc: string; icon: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: parseInt(index) * 0.1 }}
      className="group relative p-10 bg-white/[0.01] border border-primary/10 backdrop-blur-2xl rounded-sm hover:border-primary transition-all duration-500 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      <div className="absolute -top-6 -left-6 font-mono text-6xl font-black text-primary/[0.03] group-hover:text-primary/5 select-none transition-colors">
        {index}
      </div>
      <div className="mb-10 w-fit p-4 bg-primary/5 group-hover:bg-primary/10 transition-colors">
        <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
      </div>
      <h3 className="text-2xl font-light tracking-tight text-white mb-6 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground font-light leading-relaxed text-lg">{desc}</p>
    </motion.div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-theme', 'cyberpunk');

    const moveCursor = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', moveCursor);
    return () => {
      document.documentElement.removeAttribute('data-theme');
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  const { scrollYProgress } = useScroll();
  const timelineHeight = useTransform(scrollYProgress, [0.4, 0.9], ["0%", "100%"]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-primary/30 cursor-none">
      <div className="grain-overlay" />

      {/* Custom Crosshair Cursor */}
      <div
        className={cn("custom-cursor", isHovering && "hover")}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-10 py-8 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-primary rotate-45 animate-pulse" />
          <span className="font-mono text-xs tracking-[0.4em] font-black uppercase text-primary">GIGZS_CORE</span>
        </div>
        <div className="flex gap-12 font-mono text-[9px] tracking-[0.4em] text-white/40 uppercase">
          <Link href="/pricing" className="hover:text-primary transition-colors" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>Protocol</Link>
          <Link href="/tools" className="hover:text-primary transition-colors" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>Terminal</Link>
          <Link href="/login" className="px-6 py-2 border border-primary/20 hover:border-primary transition-all text-primary" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>Account</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                <circle cx="0" cy="0" r="1" className="fill-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" className="animate-pulse" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-3 mb-12 px-6 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[8px] tracking-[0.4em] text-primary uppercase">Managed Neural Factory Operational</span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white mb-10 leading-[0.85] uppercase">
            <GlitchText text="Order software." />
            <br />
            <span className="text-primary/40 italic">We execute.</span>
          </h1>

          <p className="text-muted-foreground font-light text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed mb-16 tracking-wide">
            The world's first industrial-grade digital factory.
            Abstracted management. 24/7 continuous cycles. Verifiable outcomes.
          </p>

          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <Link href="/signup" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
              <button className="relative px-16 py-6 border-2 border-primary bg-primary text-black text-xs font-black uppercase tracking-[0.5em] hover:shadow-[0_0_80px_rgba(0,255,178,0.5)] transition-all duration-500 overflow-hidden group">
                <span className="relative z-10">Launch Brief</span>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-white transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </Link>
            <Link href="/login" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
              <button className="px-16 py-6 border-2 border-primary/10 text-primary text-xs font-black uppercase tracking-[0.5em] hover:bg-primary/5 transition-all">
                Enter Terminal
              </button>
            </Link>
          </div>

          <LiveTerminal />
        </motion.div>
      </section>

      {/* Marquee */}
      <div className="w-full overflow-hidden bg-primary py-5 border-y border-white/10 rotate-[-1deg] scale-[1.02] mt-[-2vh] relative z-20">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-24 px-12 items-center">
              <span className="text-[11px] font-mono font-black text-black tracking-[0.5em] uppercase italic">
                E-COMMERCE // FINTECH // SAAS // MARKETPLACES // AI TOOLS // DEFI // CORE // NODE_RED
              </span>
              <Activity className="w-4 h-4 text-black animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <section className="bg-black/80 px-10 border-b border-primary/10">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 lg:grid-cols-4">
          <StatItem value="47" label="Systems Deployed" />
          <StatItem value="3" label="Continents Synced" />
          <StatItem value="100" label="Async Success" />
          <StatItem value="168" label="Hrs/Week Capacity" />
        </div>
      </section>

      {/* The Protocol Section */}
      <section className="relative py-48 px-10 max-w-screen-2xl mx-auto">
        <div className="text-center mb-40 space-y-6">
          <div className="font-mono text-[10px] tracking-[0.5em] text-primary uppercase animate-pulse">Protocol Lifecyle</div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic">Neural_Handoff</h2>
        </div>

        {/* Timeline Connector */}
        <div className="absolute left-[50%] top-96 bottom-40 w-[1px] bg-primary/10 hidden lg:block">
          <motion.div
            style={{ height: timelineHeight }}
            className="w-full bg-primary shadow-[0_0_20px_rgba(0,255,178,1)]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 lg:gap-y-64">
          <div className="lg:pt-20">
            <ProtocolCard
              index="01"
              title="Intelligence Scoping"
              desc="Deep architectural scan of mission objectives. Requirements are mutated into machine-readable execution vectors."
              icon={Terminal}
            />
          </div>
          <div className="lg:mt-80 lg:text-right flex justify-end">
            <div className="max-w-xl">
              <ProtocolCard
                index="02"
                title="Specialist Rotation"
                desc="Elite engineers from the global cohort execute in 24/7 shifts. Automated handoffs ensure zero momentum loss."
                icon={Cpu}
              />
            </div>
          </div>
          <div className="lg:-mt-20">
            <ProtocolCard
              index="03"
              title="Telemetry Verified"
              desc="Continuous health checks and milestone telemetry. Every byte is verified via automated protocol testing."
              icon={Shield}
            />
          </div>
          <div className="lg:mt-60 lg:text-right flex justify-end">
            <div className="max-w-xl">
              <ProtocolCard
                index="04"
                title="Vector Deployment"
                desc="Platform initialization with full documentation and source relay. Post-deployment monitoring active."
                icon={Zap}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black pt-64 pb-20 px-10 overflow-hidden border-t border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,255,178,0.05),transparent_70%)]" />

        {/* Large ASCII Wordmark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-[30vw] text-primary/[0.015] tracking-tighter select-none pointer-events-none uppercase italic">
          GIGZS_
        </div>

        <div className="max-w-screen-2xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-24 mb-40">
          <div className="lg:col-span-2 space-y-16">
            <div className="flex items-center gap-5">
              <div className="w-8 h-8 bg-primary rounded-sm" />
              <span className="font-mono text-3xl font-black tracking-widest text-primary">GIGZS_PROTO</span>
            </div>
            <p className="text-muted-foreground font-light text-xl max-w-xl leading-relaxed italic">
              "The factory never sleeps. The protocol never fails. Order software, receive certainty."
            </p>
            <div className="flex items-center gap-5 px-6 py-3 border border-primary/20 w-fit bg-primary/[0.02]">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(0,255,178,1)]" />
              <span className="font-mono text-[10px] tracking-[0.4em] text-primary uppercase font-bold">NODE_01: ONLINE // SYNC_LOCK</span>
            </div>
          </div>

          <div className="space-y-10">
            <h4 className="font-mono text-[11px] tracking-[0.5em] text-white uppercase font-black">Directory</h4>
            <nav className="flex flex-col gap-5 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              <Link href="#" className="hover:text-primary transition-colors hover:translate-x-2 transition-transform">01_Briefing</Link>
              <Link href="#" className="hover:text-primary transition-colors hover:translate-x-2 transition-transform">02_Terminal</Link>
              <Link href="#" className="hover:text-primary transition-colors hover:translate-x-2 transition-transform">03_Protocols</Link>
              <Link href="#" className="hover:text-primary transition-colors hover:translate-x-2 transition-transform">04_Nodes</Link>
            </nav>
          </div>

          <div className="space-y-10 text-right lg:text-left">
            <h4 className="font-mono text-[11px] tracking-[0.5em] text-white uppercase font-black">Uptime_Stats</h4>
            <div className="space-y-5 font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
              <div className="flex justify-between lg:justify-start lg:gap-10"><span>Core_Load:</span> <span className="text-primary">12.4%</span></div>
              <div className="flex justify-between lg:justify-start lg:gap-10"><span>Nodes:</span> <span className="text-primary">472/472</span></div>
              <div className="flex justify-between lg:justify-start lg:gap-10"><span>Sync:</span> <span className="text-primary">100%</span></div>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10 pt-12 border-t border-white/5 text-[9px] font-mono tracking-[0.6em] text-muted-foreground uppercase">
          <div>© GIGZS_RELAY_FACTORY_2026 // ALL_RIGHTS_RESERVED</div>
          <div className="flex gap-12 mt-6 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">SEC_PROTOCOL</a>
            <a href="#" className="hover:text-primary transition-colors">TOS_LINK</a>
          </div>
        </div>
      </footer>

      {/* Frame Elements */}
      <div className="fixed inset-0 pointer-events-none z-[80] border-[1px] border-primary/5 m-6" />
      <div className="fixed top-0 left-0 w-full h-[1px] bg-primary/30 blur-[2px] pointer-events-none z-[90]" />
    </div>
  );
}
