'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Wrench,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Rocket,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const roleHome = {
  client: '/client',
  freelancer: '/freelancer',
  admin: '/admin',
} as const;

const navByRole = {
  client: [
    { href: '/client', label: 'Overview', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  freelancer: [
    { href: '/freelancer', label: 'Workspace', icon: LayoutDashboard },
    { href: '/tools/airobuilder', label: 'AiroBuilder', icon: Rocket },
    { href: '/tools', label: 'Tools', icon: Wrench },
    { href: '/history', label: 'Previous Work', icon: History },
    { href: '/security', label: 'Security', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { href: '/admin', label: 'Control Center', icon: LayoutDashboard },
    { href: '/admin#risk', label: 'Risk', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
} as const;

export function AppShell({
  role,
  title,
  children,
}: {
  role: 'client' | 'freelancer' | 'admin';
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mini, setMini] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const payload = (await res.json()) as any;
        if (payload?.profile?.full_name) setName(payload.profile.full_name);
        if (payload?.profile?.avatar_url) setAvatarUrl(payload.profile.avatar_url);
      } catch { /* ignore */ }
    })();

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--proximity-x', `${x}%`);
      document.documentElement.style.setProperty('--proximity-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const initials = (name ?? 'Gigzs')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 hidden h-screen border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground transition-all duration-300 lg:flex flex-col z-50',
          mini ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-5 py-6 mb-2', mini && 'justify-center px-0')}>
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[inset_0_0_10px_rgba(154,123,79,0.1)]">
            <span className="text-primary font-bold text-lg">G</span>
          </div>
          {!mini && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-foreground font-medium tracking-tight">Gigzs</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">Delivery OS</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navByRole[role].map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={mini ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg transition-all duration-300 group relative',
                  mini ? 'justify-center p-3' : 'px-3 py-3 mb-1',
                  isActive
                    ? 'bg-accent/50 text-primary shadow-sm border border-primary/10'
                    : 'text-foreground/70 hover:bg-accent/30 hover:text-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
                )}
                <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', !mini && 'mr-4')} />
                {!mini && (
                  <span className="text-sm font-medium tracking-wide">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Minimise toggle */}
        <button
          onClick={() => setMini(!mini)}
          className="absolute -right-3 top-[72px] h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-sm z-50 hover:scale-110"
        >
          {mini ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Bottom user section */}
        <div className={cn('p-4 border-t border-border mt-auto', mini && 'flex justify-center')}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={cn(
                'flex items-center gap-3 rounded-lg p-2 w-full hover:bg-accent/50 transition-colors group',
                mini && 'justify-center'
              )}>
                <Avatar.Root className="h-9 w-9 overflow-hidden rounded-lg shrink-0 border border-border shadow-sm">
                  {avatarUrl ? (
                    <Avatar.Image className="h-full w-full object-cover" src={avatarUrl} alt="Profile" />
                  ) : null}
                  <Avatar.Fallback className="bg-primary/5 text-primary font-medium text-xs flex h-full w-full items-center justify-center">
                    {initials || 'GZ'}
                  </Avatar.Fallback>
                </Avatar.Root>
                {!mini && (
                  <div className="flex flex-col items-start text-left leading-none min-w-0">
                    <span className="text-sm font-medium text-foreground truncate max-w-[130px]">{name || 'Guest'}</span>
                    <span className="text-[10px] mt-1 font-mono uppercase tracking-[0.2em] text-muted-foreground">{role}</span>
                  </div>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              side="right"
              align="end"
              className="ml-2 w-52 rounded-xl border border-border bg-card text-card-foreground p-1.5 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Signed in as</p>
                <p className="text-sm text-foreground truncate">{name || 'Guest User'}</p>
              </div>
              <DropdownMenu.Item asChild>
                <Link href={roleHome[role]} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Home
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/settings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </Link>
              </DropdownMenu.Item>
              <div className="h-px bg-border my-1" />
              <DropdownMenu.Item asChild>
                <button
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                  onClick={async () => {
                    const res = await fetch('/api/auth/logout', { method: 'POST' });
                    if (res.ok) window.location.href = '/login';
                  }}
                >
                  Logout
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className={cn('transition-all duration-300 min-h-screen flex flex-col', mini ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-8 max-w-7xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-light text-foreground tracking-tight">{title}</h1>
              <div className="flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(154,123,79,0.5)]" />
                <span className="font-mono text-[9px] tracking-[0.3em] font-bold text-primary uppercase">System Tracking Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
