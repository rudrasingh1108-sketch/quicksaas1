'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw, EyeOff, Activity } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, useVelocity, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import NeuralFlux from '../components/ui/neural-flux';
import SystemHUD from '../components/ui/system-hud';
import NeuralTrail from '../components/ui/neural-trail';

// ── CLIENT ONLY WRAPPER ──────────────────────────────────────────────────────
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

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

function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "start 0.2"]
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        return (
          <span key={i} className="inline-block mr-2 overflow-hidden">
            <motion.span
              style={{
                opacity: useTransform(scrollYProgress, [start, end], [0, 1]),
                y: useTransform(scrollYProgress, [start, end], [20, 0])
              }}
              className="inline-block"
            >
              {w}
            </motion.span>
          </span>
        );
      })}
    </div>
  );
}

function MagneticButton({ children, className, ...props }: any) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ── PROTOCOL STEPS ───────────────────────────────────────────────────────────
const STICKY_ITEMS = [
  { num: '01', title: 'Submit your brief.', body: 'Define your outcome in plain language. Our system orchestrates the technical execution silently.', tech: 'VECTOR_INIT // 0xFA42' },
  { num: '02', title: 'Managed execution.', body: 'Specialists rotate on daily shifts. Handoffs are automated. Continuous progress is guaranteed.', tech: 'NEURAL_LINK // ACTIVE' },
  { num: '03', title: 'Track outcomes.', body: 'Receive human-readable milestone updates. No jargon, just verified delivery telemetry.', tech: 'TELEMETRY_SYNC // 100%' },
];

function NeuralDataOverlay() {
  const [text, setText] = useState('');
  useEffect(() => {
    const chars = '01ABCDEF';
    const interval = setInterval(() => {
      let str = '';
      for (let i = 0; i < 8; i++) str += chars[Math.floor(Math.random() * chars.length)];
      setText(str);
    }, 150);
    return () => clearInterval(interval);
  }, []);
  return <span className="font-mono text-[8px] opacity-20">{text}</span>;
}

function ProtocolSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const dialRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <div ref={containerRef} className="relative flex flex-col md:flex-row gap-20 px-6 md:px-20 py-32 max-w-7xl mx-auto">
      {/* Structural Visual Bridge */}
      <div className="hidden md:block absolute left-[33.333%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent z-0 ml-[-40px]" />

      {/* Sticky Scrub Area */}
      <div className="md:sticky md:top-24 md:h-[calc(100vh-120px)] md:w-1/3 z-10 flex flex-col justify-between py-10">
        <div className="relative">
          <div className="absolute -inset-10 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
          <h3 className="text-[10px] font-mono font-black tracking-[0.5em] text-primary/50 uppercase mb-12 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            System Protocol
          </h3>

          <div className="relative w-32 h-32 mb-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray="283"
                style={{ strokeDashoffset: useTransform(scrollYProgress, [0, 1], [283, 0]) }}
                className="text-primary"
              />
            </svg>
            <motion.div
              style={{ rotate: dialRotate }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-0.5 h-16 bg-gradient-to-t from-primary/60 to-transparent absolute top-0 rounded-full" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center font-serif italic text-4xl text-primary/20">
              <ClientOnly>{STICKY_ITEMS[activeStep].num}</ClientOnly>
            </div>
          </div>

          <div className="space-y-6">
            {STICKY_ITEMS.map((item, i) => (
              <motion.div
                key={item.num}
                className={cn(
                  "transition-all duration-1000 cursor-pointer group relative py-4 pl-6 border-l",
                  activeStep === i
                    ? "border-primary opacity-100 translate-x-4 bg-primary/[0.03]"
                    : "border-white/5 opacity-20 hover:opacity-40 hover:border-white/20"
                )}
                onClick={() => {
                  const element = document.getElementById(`step-${i}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono tracking-[0.3em] uppercase font-bold text-white/90">{item.title}</span>
                  <div className="flex gap-4 items-center mt-2">
                    <ClientOnly><NeuralDataOverlay /></ClientOnly>
                    {activeStep === i && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-1"
                      >
                        {[1, 2, 3].map(dot => (
                          <div key={dot} className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${dot * 0.1}s` }} />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto pt-12 border-t border-white/5 hidden md:block">
            <div className="font-mono text-[9px] text-white/20 space-y-3 uppercase tracking-widest">
              <div className="flex justify-between items-center text-[10px] text-primary/40 font-bold mb-2">
                <span>Sync Status</span>
                <span className="animate-pulse">Active</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                <ClientOnly>
                  {Array.from({ length: 15 }).map((_, j) => (
                    <div key={j} className={cn("h-1 rounded-[1px]", j < (activeStep + 1) * 5 ? "bg-primary/30" : "bg-white/5")} />
                  ))}
                </ClientOnly>
              </div>
              <div className="flex justify-between">
                <span>Node 0x{STICKY_ITEMS[activeStep].num}</span>
                <ClientOnly><NeuralDataOverlay /></ClientOnly>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 space-y-[60vh] pb-[20vh] pt-10">
        {STICKY_ITEMS.map((item, i) => (
          <motion.div
            key={item.num}
            id={`step-${i}`}
            onViewportEnter={() => setActiveStep(i)}
            initial={{ opacity: 0.2, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-25%" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="group relative"
          >
            <div className="absolute -inset-16 bg-primary/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[120px] pointer-events-none" />

            <div className="relative glass-panel rounded-[2.5rem] p-16 md:p-24 border-white/5 hover:border-primary/40 transition-all duration-1000 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {/* Massive Phase Indicator Background */}
              <div className="absolute -top-10 -right-10 font-mono text-[180px] text-white/[0.02] pointer-events-none select-none font-black leading-none uppercase italic">
                {item.num}
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="font-mono text-[12px] tracking-[0.8em] text-primary/80 mb-14 uppercase flex items-center gap-6"
              >
                <div className="w-12 h-px bg-primary/50" />
                {item.tech}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-6xl md:text-8xl font-light tracking-tighter text-white mb-14 leading-[0.8] drop-shadow-2xl"
              >
                {item.title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-white/40 font-light leading-relaxed text-2xl max-w-xl mb-16"
              >
                {item.body}
              </motion.p>

              <div className="flex items-center justify-between border-t border-white/5 pt-12">
                <div className="flex items-center gap-8">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map(j => (
                      <div key={j} className="w-9 h-9 rounded-full border border-white/10 bg-[#0A0908] flex items-center justify-center font-mono text-[10px] text-white/40 backdrop-blur-xl shadow-lg">
                        {j}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] font-mono text-white/30 uppercase tracking-[0.3em] font-bold">Vector Shifting</div>
                </div>
                <div className="font-mono text-[11px] tracking-[0.5em] text-primary/50 font-bold uppercase">
                  <ClientOnlyHex />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ClientOnlyHex() {
  const [hex, setHex] = useState('0x000000');
  useEffect(() => {
    setHex(`0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`);
  }, []);
  return <>{hex}</>;
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
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--proximity-x', `${x}%`);
      document.documentElement.style.setProperty('--proximity-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.documentElement.removeAttribute('data-theme');
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <main className="relative bg-[#080705] text-white font-sans selection:bg-primary/30">
      <ClientOnly>
        <SystemHUD />
        <NeuralTrail />
        <NeuralFlux />
      </ClientOnly>

      {/* ════ 1. HERO — Minimalist ═════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center px-6 md:px-20 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(154,123,79,0.05),transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Neural Sculpture centerpiece */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none select-none">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full border border-primary/20 bg-gradient-to-tr from-primary/10 to-transparent blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360, x: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-20 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-[inset_0_0_100px_rgba(255,255,255,0.05)]"
          />
        </div>

        <motion.div
          className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl mx-auto"
          style={{ y: parallaxY, opacity: heroOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 mb-12 px-5 py-2 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-xl proximity-glow"
          >
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.8)]" />
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-white/50 uppercase">Neural Link Synchronized</span>
          </motion.div>

          <motion.h1 className="text-[clamp(48px,9vw,120px)] font-light tracking-[-0.07em] leading-[0.85] text-white mb-10">
            <motion.span
              initial={{ clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="block"
            >
              Order your software.
            </motion.span>
            <motion.span
              initial={{ clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="block text-primary italic font-serif mt-2"
            >
              We'll handle the rest.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-white/40 text-lg md:text-xl max-w-xl font-light tracking-wide leading-relaxed mb-16"
          >
            Managed specialists. Continuous execution. Transparent outcomes.<br />
            Your digital factory, operating silently in the background.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <Link href="/signup">
              <MagneticButton className="px-12 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary hover:text-white shadow-2xl">
                Initiate Vector
              </MagneticButton>
            </Link>
            <Link href="/login">
              <MagneticButton className="px-12 py-5 bg-transparent border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-white/5 backdrop-blur-xl">
                Launch Brief
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-20"
        >
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
          <span className="text-[8px] font-mono tracking-[0.5em] uppercase">Scroll</span>
        </motion.div>
      </section>

      {/* ════ 2. THE CONCEPT — DARK MODE ═══════════════════════════════════════ */}
      <section className="relative z-30 bg-[#080705] py-40 px-6 md:px-20 border-t border-white/5 overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          <ScrollRevealText
            text="Commission digital products with zero management overhead. You define the brief. We deploy the specialists. Your solution ships continuously while you focus on the vision."
            className="text-[clamp(28px,4.5vw,64px)] font-light leading-[1.05] tracking-tighter text-white max-w-5xl mb-32"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'ANONYMOUS', label: 'Team identity abstracted.', tech: 'ID_MASK: ENABLED' },
              { title: 'MANAGED', label: 'Shift-based orchestration.', tech: 'OPS_SYNC: ACTIVE' },
              { title: 'CONTINUOUS', label: '24/7 Execution cycles.', tech: 'THROUGHPUT: 100%' }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="group p-10 glass-panel rounded-3xl border-white/5 hover:border-primary/40 transition-all duration-700 relative overflow-hidden"
              >
                <div className="absolute -bottom-10 -right-10 font-mono text-8xl text-white/[0.02] group-hover:text-primary/[0.05] transition-colors duration-700 font-black italic select-none">
                  {i + 1}
                </div>
                <div className="font-mono text-[9px] text-primary/40 mb-12 tracking-[0.5em]">{item.tech}</div>
                <h4 className="text-4xl font-light text-white tracking-tighter mb-4 group-hover:translate-x-2 transition-transform duration-700">{item.title}</h4>
                <p className="text-white/40 text-sm font-light leading-relaxed tracking-wide group-hover:text-white/60 transition-colors duration-700">{item.label}</p>
                <div className="mt-12 h-px w-full bg-gradient-to-r from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.div>
            ))}
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
          <div className="md:text-right">
            <p className="mb-4">© {new Date().getFullYear()} GIGZS PVT. LTD.</p>
            <p className="tracking-widest">NAGPUR // INDIA // 440010</p>
          </div>
        </div>
      </footer>
    </main >
  );
}
