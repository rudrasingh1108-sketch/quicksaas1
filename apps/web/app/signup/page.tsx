'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer'>('client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) return setError(payload.error ?? 'Signup failed');
    // Go directly to dashboard (or /login if auto-sign-in failed)
    router.push(payload.redirectTo ?? '/login');
    router.refresh();
  };

  return (
    <main className="relative min-h-screen bg-[#080705] flex items-center justify-center px-4 py-16 overflow-hidden font-sans selection:bg-primary/30">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(154,123,79,0.05) 0%, transparent 70%)' }} />

      {/* Back to landing */}
      <Link href="/" className="absolute top-8 left-8 font-mono text-[11px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors">
        ← GIGZS
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">Registration</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2 underline decoration-primary/30 underline-offset-8">Start your project.</h1>
          <p className="text-white/35 font-light text-sm mt-4">Define what you need. We handle everything else.</p>
        </div>

        {/* Role toggle */}
        <div className="mb-6 flex border border-white/5 rounded-sm overflow-hidden bg-white/[0.01]">
          {(['client', 'freelancer'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-3 text-[10px] font-mono tracking-[0.2em] uppercase transition-all duration-300 ${role === r
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-white/20 hover:text-white/40'
                }`}
            >
              {r === 'client' ? 'Client' : 'Freelancer'}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="border border-white/5 bg-white/[0.01] backdrop-blur-md rounded-sm p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 ml-1">Identity</label>
              <input
                required
                className="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-all duration-300"
                placeholder="Full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 ml-1">Access Channel</label>
              <input
                type="email"
                required
                className="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-all duration-300"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 ml-1">Secure Key</label>
              <input
                type="password"
                required
                className="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3.5 text-sm text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-all duration-300"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-[10px] text-red-400/60 font-mono border border-red-500/10 bg-red-500/[0.02] rounded-sm px-4 py-3 uppercase tracking-wider">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full mt-4 relative py-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm overflow-hidden transition-all duration-500 hover:scale-[1.01] disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'CALIBRATING…' : (<>Initialize account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>)}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
              Existing link?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors border-b border-primary/20 pb-0.5">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/10 font-mono text-[9px] tracking-[0.5em] mt-8 uppercase">
          Gigzs · Neural Factory
        </p>
      </div>
    </main>
  );
}
