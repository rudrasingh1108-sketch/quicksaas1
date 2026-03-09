'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw, EyeOff, Activity } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, useVelocity, useAnimationFrame } from 'framer-motion';

// ── LIVE TICKER ───────────────────────────────────────────────────────────────
const TICKER = [
  'UPDATE  →  "Logic core synchronized"',
  'UPDATE  →  "Infrastructure layer ready"',
  'UPDATE  →  "Security handshake complete"',
  'INTERNAL  →  [shift handoff — system integrity high]',
  'UPDATE  →  "Operational milestone reached"',
];
function DataTicker() {
  const [idx, setIdx] = useState(0);
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKER.length), 4000);
    const c = setInterval(() => setCursor(v => !v), 530);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);
  return (
    <div className="font-mono text-[11px] tracking-wider text-primary/70 h-5 overflow-hidden transition-all duration-700">
      &gt; {TICKER[idx]}{cursor ? '█' : '\u00A0'}
    </div>
  );
}

// ── SCROLL-REVEAL WORD COMPONENT ──────────────────────────────────────────────
function Word({ children, progress, range }: { children: React.ReactNode, progress: any, range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <motion.span style={{ opacity, display: 'inline' }}>{children}</motion.span>;
}

function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "start 0.2"]
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        return (
          <span key={i}>
            <Word progress={scrollYProgress} range={[start, end]}>
              {w}
            </Word>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
}

// ── PROTOCOL STEPS ───────────────────────────────────────────────────────────
const STICKY_ITEMS = [
  { num: '01', title: 'Submit your brief.', body: 'Define your outcome in plain language. Our system orchestrates the technical execution silently.' },
  { num: '02', title: 'Managed execution.', body: 'Specialists rotate on daily shifts. Handoffs are automated. Continuous progress is guaranteed.' },
  { num: '03', title: 'Track outcomes.', body: 'Receive human-readable milestone updates. No jargon, just verified delivery telemetry.' },
];
function ProtocolSteps() {
  return (
    <div className="flex flex-col gap-16 px-6 md:px-20 py-20 max-w-7xl mx-auto">
      {STICKY_ITEMS.map((item, i) => (
        <motion.div
          key={item.num}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row gap-8 items-start border-l border-primary/20 pl-8 py-4 bg-transparent transition-colors"
        >
          <div className="flex-1">
            <div className="font-mono text-[9px] tracking-[0.3em] text-primary mb-3">
              PHASE {item.num}
            </div>
            <h3 className="font-light leading-tight mb-4 tracking-tight text-white text-[32px]">
              {item.title}
            </h3>
            <p className="text-white/40 font-light leading-relaxed text-sm max-w-md">
              {item.body}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const parallaxY = useTransform(heroProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'minimalist');
    return () => document.documentElement.removeAttribute('data-theme');
  }, []);

  return (
    <main className="relative bg-[#080705] text-white overflow-hidden font-sans selection:bg-primary/30">
      {/* ════ 1. HERO — Minimalist ═══════════════════════════════════════ */}
      <div ref={heroRef} className="relative h-[120vh] w-full flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(154,123,79,0.08),transparent_70%)]" />
        </div>

        <motion.div
          className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl"
          style={{ y: parallaxY, opacity: heroOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <div className="flex items-center gap-2 mb-12 px-4 py-1 rounded-sm border border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">GIGZS // SYSTEM ONLINE</span>
          </div>

          <h1 className="text-[clamp(40px,7vw,90px)] font-light tracking-[-0.05em] leading-[0.9] text-white mb-8">
            Order your software.<br />
            <span className="text-primary italic font-serif">We'll handle the rest.</span>
          </h1>

          <p className="text-white/30 text-base md:text-lg max-w-xl font-light tracking-wide leading-relaxed mb-12">
            Managed specialists. Continuous execution. Transparent outcomes.<br />
            Your digital factory, operating silently in the background.
          </p>

          <div className="w-full max-w-md bg-white/[0.02] border border-white/10 p-4 mb-12 text-left">
            <div className="text-[8px] font-mono tracking-[0.3em] text-white/20 uppercase mb-2">TELEMETRY RELAY</div>
            <DataTicker />
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <Link href="/signup">
              <button className="px-10 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded-sm transition-all hover:bg-white/90">
                Launch Brief
              </button>
            </Link>
            <Link href="/login">
              <button className="px-10 py-4 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-[0.2em] rounded-sm transition-all hover:bg-white/5 hover:text-white">
                Sign In
              </button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ════ 2. THE CONCEPT ═══════════════════════════════════════ */}
      <section className="relative z-30 bg-white py-32 px-6 md:px-20 border-t border-white/10">
        <ScrollRevealText
          text="Commission digital products with zero management overhead. You define the brief. We deploy the specialists. Your solution ships continuously while you focus on the vision."
          className="text-[clamp(24px,4vw,56px)] font-light leading-[1.1] tracking-tighter text-black max-w-6xl mb-24"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl border-t border-black/5 pt-16">
          <div className="space-y-2">
            <p className="text-4xl font-light text-black tracking-tighter">ANONYMOUS</p>
            <p className="text-xs text-black/40 uppercase font-mono tracking-widest">Team identity abstracted.</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-light text-black tracking-tighter">MANAGED</p>
            <p className="text-xs text-black/40 uppercase font-mono tracking-widest">Shift-based orchestration.</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-light text-black tracking-tighter">CONTINUOUS</p>
            <p className="text-xs text-black/40 uppercase font-mono tracking-widest">24/7 Execution cycles.</p>
          </div>
        </div>
      </section>

      {/* ════ 3. PROTOCOL ═══════════════════════════════════════ */}
      <section className="bg-[#080705] border-t border-white/5">
        <div className="px-6 md:px-20 pt-24">
          <h2 className="text-[clamp(32px,5vw,72px)] font-light tracking-tight text-white border-b border-white/5 pb-10">
            The Gigzs Protocol.
          </h2>
        </div>
        <ProtocolSteps />
      </section>

      {/* ════ 4. CTA ═══════════════════════════════════════ */}
      <section className="bg-white py-32 px-6 md:px-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[clamp(36px,5.5vw,80px)] font-light tracking-tighter text-black leading-tight mb-12">
            Define the outcome.<br />
            <span className="text-primary italic font-serif">We'll deploy the execution.</span>
          </h2>
          <Link href="/signup">
            <button className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-black/90 shadow-2xl">
              Initiate Vector
            </button>
          </Link>
        </div>
      </section>

      {/* ════ 5. FOOTER ═══════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-[#080705] py-16 px-6 md:px-20 flex flex-col md:flex-row justify-between items-start gap-12 font-mono text-[10px] text-white/20">
        <div>
          <p className="text-white/40 font-sans font-bold tracking-widest text-base mb-4 uppercase">Gigzs</p>
          <p className="max-w-xs leading-relaxed tracking-wider">Managed Digital Factory for high-fidelity execution. Operating across continents, abstracts management, guarantees outcomes.</p>
        </div>
        <div className="flex gap-16">
          <div className="flex flex-col gap-3">
            <p className="text-white/40 tracking-[0.3em] uppercase mb-1">Navigation</p>
            <Link href="/login" className="hover:text-primary transition-colors">LOGIN</Link>
            <Link href="/signup" className="hover:text-primary transition-colors">REGISTER</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-white/40 tracking-[0.3em] uppercase mb-1">Contact</p>
            <a href="mailto:ops@gigzs.io" className="hover:text-primary transition-colors">OPS@GIGZS.IO</a>
          </div>
        </div>
        <div className="md:text-right">
          <p className="mb-4">© {new Date().getFullYear()} GIGZS PVT. LTD.</p>
          <p className="tracking-widest">NAGPUR // INDIA // 440010</p>
        </div>
      </footer>
    </main>
  );
}
