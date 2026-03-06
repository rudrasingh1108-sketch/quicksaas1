'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw, EyeOff, Activity } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';

// ── ANIMATED CANVAS (network nodes) ──────────────────────────────────────────
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;

    type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number };
    const nodes: Node[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8, pulse: Math.random() * Math.PI * 2,
    }));

    const BASE = '16, 185, 129';

    const draw = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.016;
        if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 170) { ctx.beginPath(); ctx.strokeStyle = `rgba(${BASE},${(1 - d / 170) * 0.2})`; ctx.lineWidth = 0.6; ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
        }
      nodes.forEach(n => { const g = (Math.sin(n.pulse) + 1) / 2; ctx.beginPath(); ctx.arc(n.x, n.y, n.r + g, 0, Math.PI * 2); ctx.fillStyle = `rgba(${BASE},${0.4 + g * 0.5})`; ctx.fill(); });
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    const onResize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ── LIVE TICKER ───────────────────────────────────────────────────────────────
const TICKER = [
  'UPDATE  →  "UI module is 60% complete"',
  'UPDATE  →  "Backend APIs integrated"',
  'UPDATE  →  "Quality review passed — milestone met"',
  'INTERNAL  →  [shift handoff — identity masked]',
  'UPDATE  →  "Deployment preview ready"',
  'UPDATE  →  "Auth module shipped, testing in progress"',
];
function DataTicker() {
  const [idx, setIdx] = useState(0);
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKER.length), 3000);
    const c = setInterval(() => setCursor(v => !v), 500);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);
  return (
    <div className="font-mono text-[11px] tracking-wider text-emerald-400/70 h-5 overflow-hidden transition-all duration-700">
      &gt; {TICKER[idx]}{cursor ? '█' : '\u00A0'}
    </div>
  );
}

// ── SCROLL-REVEAL WORD COMPONENT ──────────────────────────────────────────────
// This replicates Terminal Industries' signature:
//   words start at opacity 0.15 (dim), then sequentially light up to 1
//   as the user's scroll position reaches each word's threshold.
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

// ── STICKY FEATURE PANEL (Terminal Industries' pinned-right pattern) ──────────
const STICKY_ITEMS = [
  { num: '01', title: 'Submit your brief.', body: 'Describe what you need — in plain language. Our system parses it into scoped, modular specs. No technical knowledge required from your side.' },
  { num: '02', title: 'We orchestrate, invisibly.', body: "Specialists are matched and deployed on daily shifts by our platform. You never interact with them directly — that's by design. Anonymous, accountable, continuous execution." },
  { num: '03', title: 'Track progress, not people.', body: 'Your live feed shows milestone updates in plain language. No freelancer names, no technical jargon. Just clear, verified progress toward your deliverable.' },
];
function ProtocolSteps() {
  return (
    <div className="flex flex-col gap-24 px-10 md:px-20 py-10 max-w-7xl mx-auto">
      {STICKY_ITEMS.map((item, i) => (
        <motion.div
          key={item.num}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row gap-10 md:gap-20 items-center border border-white/5 bg-[#070710] p-10 rounded-sm hover:bg-[#0a0a15] transition-colors"
        >
          {/* Text Content */}
          <div className="flex-1">
            <div className="font-mono text-[10px] tracking-[0.2em] text-emerald-500/70 mb-4">
              STEP {item.num}
            </div>
            <h3 className="font-light leading-tight mb-4 tracking-tight text-white text-[clamp(28px,3.5vw,48px)]">
              {item.title}
            </h3>
            <p className="text-white/40 font-light leading-relaxed text-[16px]">
              {item.body}
            </p>
          </div>

          {/* Abstract Visual / Number Node */}
          <div className="flex-1 flex justify-end w-full">
            <div className="relative w-full max-w-sm aspect-video bg-[#050508] border border-white/5 flex items-center justify-center overflow-hidden group">
              {/* Decorative background grid */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 opacity-20 p-2">
                {Array.from({ length: 24 }).map((_, j) => (
                  <div key={j} className="bg-white/5 rounded-sm group-hover:bg-emerald-500/10 transition-colors duration-700 delay-[${j * 20}ms]" />
                ))}
              </div>

              {/* Floating Step Number */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                viewport={{ once: true }}
                className="relative z-10 font-mono text-[80px] font-light text-white/10 tracking-widest select-none group-hover:text-emerald-500/20 transition-colors duration-500"
              >
                {item.num}
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── MOSAIC GRID visual ────────────────────────────────────────────────────────
function MosaicGrid({ activeIndex }: { activeIndex: number }) {
  const colors = ['from-emerald-500/30', 'from-teal-500/30', 'from-cyan-500/30'];
  return (
    <div className="relative w-80 h-80">
      <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full">
        {Array.from({ length: 25 }).map((_, i) => (
          <MosaicCell key={i} delay={i * 0.05} color={colors[activeIndex % colors.length]} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="font-mono text-[80px] font-light text-white/8 tracking-widest select-none transition-all duration-500">
          {String(activeIndex + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

function MosaicCell({ delay, color }: { delay: number; color: string }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setLit(Math.random() > 0.65), 900 + delay * 800);
    return () => clearInterval(id);
  }, [delay]);
  return (
    <div className={`rounded-sm border border-white/5 transition-all duration-700 ${lit ? `bg-gradient-to-br ${color} opacity-80` : 'bg-white/3 opacity-30'}`} />
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
    // Force the dark starbucks theme just for the landing page
    document.documentElement.setAttribute('data-theme', 'starbucks');
    return () => {
      // Clear the theme attribute when leaving the landing page so the app goes light
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], ['0px', '-60px']);

  return (
    <main className="relative bg-[#050508] text-white overflow-hidden font-sans selection:bg-emerald-500/30">

      {/* ════ 1. HERO — dark, cinematic ═══════════════════════════════════════ */}
      <section className="relative h-[110vh] w-full flex items-center justify-center overflow-hidden">
        {/* Network canvas */}
        <div className="absolute inset-0">
          <NetworkCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/55 via-[#050508]/15 to-[#050508]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/80 via-transparent to-[#050508]/60" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 14 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mb-10 px-5 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span className="text-[11px] font-medium tracking-[0.18em] text-white/55 uppercase">Managed Digital Factory · India</span>
          </motion.div>

          {/* Headline — light weight, enormous, tracking tight */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 24 }}
            transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(52px,8vw,110px)] font-light tracking-[-0.04em] leading-[0.9] text-white"
          >
            Order it.<br />
            <span className="text-white/30 italic">We'll build it.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="mt-8 text-base md:text-lg text-white/40 max-w-xl font-light tracking-wide leading-relaxed"
          >
            Submit your requirements. Get live progress updates.<br />
            We handle everything behind the scenes.
          </motion.p>

          {/* Ticker */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 1, delay: 1.0 }}
            className="mt-6 px-4 py-3 border border-white/8 bg-black/25 backdrop-blur rounded-lg w-full max-w-md text-left"
          >
            <div className="text-[9px] font-mono tracking-[0.2em] text-white/20 uppercase mb-1.5">client update feed</div>
            <DataTicker />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 14 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup">
              <button className="group relative px-9 py-4 bg-white text-black font-medium tracking-wide rounded-sm overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                <span className="relative z-10 flex items-center gap-2">Submit Your Brief <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                <div className="absolute inset-0 bg-slate-100 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 z-0" />
              </button>
            </Link>
            <Link href="/login">
              <button className="px-9 py-4 bg-transparent text-white/60 font-medium tracking-wide rounded-sm border border-white/15 transition-all duration-300 hover:bg-white/5 hover:text-white hover:border-white/30">
                Sign In
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
          initial={{ opacity: 0 }} animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ delay: 1.6, duration: 1 }}
          style={{ opacity: heroOpacity }}
        >
          <span className="text-[10px] tracking-[0.24em] uppercase text-white/20 font-mono">Scroll to explore</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>

        {/* Global Trusted By Strip to fill the bottom empty space */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 1.5, delay: 1.8 }}
          className="absolute bottom-0 left-0 w-full border-t border-white/5 bg-black/40 backdrop-blur-md py-4 overflow-hidden z-20 flex flex-col items-center"
        >
          <div className="font-mono text-[9px] tracking-[0.3em] text-white/20 uppercase mb-3 text-center">
            Powering Next-Gen Enterprises
          </div>
          <div className="flex gap-16 md:gap-32 items-center justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700 w-full max-w-7xl px-10">
            {/* Abstract geometric logos to represent clients */}
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white rounded-sm rotate-45"></div><span className="text-white font-bold tracking-widest text-xs uppercase">Aura</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white rounded-full"></div><span className="text-white font-bold tracking-widest text-xs uppercase">Nexus</span></div>
            <div className="flex items-center gap-2 hidden md:flex"><div className="w-4 h-4 bg-white rounded-br-lg"></div><span className="text-white font-bold tracking-widest text-xs uppercase">Stark</span></div>
            <div className="flex items-center gap-2 hidden md:flex"><div className="w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg"></div><span className="text-white font-bold tracking-widest text-xs uppercase">Vanguard</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white rounded-full"></div><span className="text-white font-bold tracking-widest text-xs uppercase">Omicron</span></div>
          </div>
        </motion.div>
      </section>

      {/* ════ 2. "IMAGINE" — light section, giant scroll-reveal text ══════════ */}
      <section className="relative bg-[#f0f1f4] py-24 md:py-32 px-6 md:px-20">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-16 text-[#0d1a2e]/40">
          <div className="w-6 h-[1px] bg-current" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase">The concept</span>
        </div>

        {/* Terminal Industries style: enormous light-weight text that word-by-word reveals */}
        <ScrollRevealText
          text="Imagine commissioning software the same way enterprises procure services. You define the outcome. We deploy specialists. Your product ships — and you never once manage the people who built it."
          className="text-[clamp(28px,4.5vw,68px)] font-light leading-[1.15] tracking-tight text-[#0d1a2e] max-w-5xl"
        />

        {/* Small caption below */}
        <div className="mt-16 ml-1 font-mono text-[11px] tracking-[0.15em] text-[#0d1a2e]/35 uppercase">
          Managed · Anonymous · Continuous
        </div>

        {/* Highlight Metrics */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl border-t border-[#0d1a2e]/10 pt-12">
          <div className="flex flex-col gap-2">
            <span className="text-3xl font-light text-[#0d1a2e]">48h</span>
            <span className="text-sm text-[#0d1a2e]/50 font-light">From brief to first commit.</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-3xl font-light text-[#0d1a2e]">24/7</span>
            <span className="text-sm text-[#0d1a2e]/50 font-light">Continuous delivery cycles.</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-3xl font-light text-[#0d1a2e]">100%</span>
            <span className="text-sm text-[#0d1a2e]/50 font-light">IP ownership transfer.</span>
          </div>
        </div>
      </section>

      {/* ════ 3. STICKY "HOW IT WORKS" — pinned panel ════════════════════════ */}
      <section className="relative bg-[#050508]">
        {/* Section header */}
        <div className="px-10 md:px-20 pt-16 pb-8">
          <div className="flex items-center gap-3 text-white/20 mb-4">
            <div className="w-6 h-[1px] bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Protocol</span>
          </div>
          <h2 className="text-[clamp(32px,5vw,72px)] font-light tracking-tight text-white">Three moves.</h2>
        </div>

        <ProtocolSteps />
      </section>

      {/* ════ 4. MOSAIC BENTO — dark section ══════════════════════════════════ */}
      <section className="relative bg-[#050508] px-4 md:px-12 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-4 text-white/20 mb-5">
              <div className="w-8 h-[1px] bg-white/20" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Execution Engine</span>
            </div>
            <h2 className="text-[clamp(32px,5vw,72px)] font-light tracking-tight text-white mb-5">
              Your delivery engine.<br /><span className="text-emerald-400">Fully managed.</span>
            </h2>
            <p className="text-white/35 max-w-lg font-light leading-relaxed">
              Specialists rotate on daily shifts. Handoffs happen automatically at end of day. You receive continuous progress — with zero team management overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {[
              { id: '01', label: 'THE MODEL', title: 'You never manage the team.', Icon: EyeOff, body: "Define outcomes, not processes. You submit a brief, receive live updates, and accept the final deliverable. Who built it? Our responsibility entirely." },
              { id: '02', label: 'DAILY SHIFTS', title: 'Daily Handoffs. Zero Gaps.', Icon: RotateCcw, body: 'Each specialist works a fixed daily shift. At end of day, work is handed off to the next — your project runs continuously, without interruption.' },
              { id: '03', label: 'CLIENT FEED', title: 'Live Progress. No Noise.', Icon: Activity, body: 'Curated milestone updates, plain language only — no technical jargon, no team details. Just verified, human-readable delivery progress.' },
            ].map(card => (
              <div key={card.id} className="group bg-[#070710] p-10 flex flex-col gap-6 hover:bg-[#0a0a18] transition-colors duration-300">
                <div className="font-mono text-[10px] tracking-[0.2em] text-emerald-500/60">{card.id} // {card.label}</div>
                <card.Icon className="w-8 h-8 text-white/15 group-hover:text-emerald-400 transition-colors duration-400" />
                <div>
                  <h3 className="text-xl font-light text-white mb-3">{card.title}</h3>
                  <p className="text-sm text-white/30 font-light leading-relaxed">{card.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Integration Visual block to fill empty space */}
          <div className="mt-8 border border-white/5 bg-[#070710] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-[0.2em] text-emerald-500/60 mb-4">SYSTEM ARCHITECTURE</div>
              <h3 className="text-2xl font-light text-white mb-4">Plug into our ecosystem.</h3>
              <p className="text-white/30 text-sm leading-relaxed max-w-md font-light">
                Our proprietary orchestration engine integrates directly into your existing CI/CD pipelines. We push commits to your repositories, update your staging environments, and manage the deployment lifecycle autonomously.
              </p>
            </div>

            <div className="flex-1 flex justify-end">
              {/* Abstract Git / CI visual */}
              <div className="relative w-full max-w-xs aspect-video border border-white/10 bg-black/40 rounded-sm overflow-hidden flex items-center justify-center p-6">
                {/* Decorative commit timeline */}
                <div className="absolute left-10 top-0 bottom-0 w-px bg-white/10" />
                <div className="flex flex-col gap-6 w-full relative z-10 pl-6">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <div className="flex-1 h-1 bg-white/5" />
                    <div className="text-[9px] font-mono text-white/30 truncate">Merge branch 'feat/auth'</div>
                  </div>
                  <div className="flex items-center gap-4 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="flex-1 h-1 bg-white/5" />
                    <div className="text-[9px] font-mono text-white/20 truncate">CI Pipeline: Passed</div>
                  </div>
                  <div className="flex items-center gap-4 opacity-40">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="flex-1 h-1 bg-white/5" />
                    <div className="text-[9px] font-mono text-white/20 truncate">Deploy to staging</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ 5. CTA — light background again (dark→light→dark→light rhythm) ═ */}
      <section className="relative bg-[#f0f1f4] py-24 md:py-32 px-6 md:px-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Word-by-word reveal on the CTA copy too */}
          <ScrollRevealText
            text="Define the outcome. We'll ship it."
            className="text-[clamp(36px,5.5vw,80px)] font-light tracking-tight text-[#0d1a2e] leading-tight mb-10 max-w-3xl"
          />
          <p className="text-[#0d1a2e]/45 max-w-md mb-12 font-light text-lg leading-relaxed">
            Join the enterprises that ship digital products on Gigzs — with full delivery transparency and zero team management overhead.
          </p>
          <Link href="/signup">
            <button className="group inline-flex items-center gap-3 px-10 py-5 bg-[#0d1a2e] text-white font-light tracking-wide text-sm transition-all duration-300 hover:bg-[#1a2a3e]">
              Submit Your Brief <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>

      {/* ════ 6. FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-[#030305] py-10 px-4 md:px-12 font-mono text-[11px] text-white/25 flex flex-col md:flex-row justify-between items-center gap-6">
        <div><span className="text-white/55 font-sans font-medium tracking-wide">GIGZS</span> — Managed Digital Factory · Nagpur, India</div>
        <div className="flex gap-8">
          <Link href="/login" className="hover:text-white transition-colors tracking-widest uppercase">Login</Link>
          <Link href="/signup" className="hover:text-white transition-colors tracking-widest uppercase">Sign Up</Link>
          <a href="mailto:info@gigzs.com" className="hover:text-white transition-colors">info@gigzs.com</a>
        </div>
        <div className="tracking-widest text-[10px]">© {new Date().getFullYear()} GIGZS Pvt. Ltd.</div>
      </footer>
    </main>
  );
}
