'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Sparkles } from 'lucide-react';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { cn } from '../../lib/utils';

const PRODUCT_TYPES = ['web_app', 'mobile_app', 'website', 'platform'] as const;
const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
const FEATURES = [
  'User Auth', 'Payments', 'Dashboard', 'Admin Panel',
  'AI Integration', 'Realtime Chat', 'Search', 'Analytics',
  'File Upload', 'Notifications', 'Mobile Responsive'
];
const INTEGRATIONS = ['Stripe', 'WhatsApp', 'Twilio', 'Mailchimp', 'Shopify', 'HubSpot'];

export default function IntakeForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const { show } = useToast();
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [productType, setProductType] = useState<typeof PRODUCT_TYPES[number]>('web_app');
  const [urgency, setUrgency] = useState<typeof URGENCY_LEVELS[number]>('medium');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [budgets, setBudgets] = useState({
    frontend: '',
    backend: '',
    database: '',
    infrastructure: ''
  });

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const toggleIntegration = (i: string) => {
    setSelectedIntegrations(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !notes || selectedFeatures.length === 0) {
      return show('Validation Error', 'Title, notes, and at least one feature are required.');
    }

    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const intake = {
        productType,
        urgency,
        features: selectedFeatures,
        integrations: selectedIntegrations,
        notes,
      };

      const budgetMap = {
        frontend: budgets.frontend ? parseFloat(budgets.frontend) : 0,
        backend: budgets.backend ? parseFloat(budgets.backend) : 0,
        database: budgets.database ? parseFloat(budgets.database) : 0,
        infrastructure: budgets.infrastructure ? parseFloat(budgets.infrastructure) : 0,
      };

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, intake, budgets: budgetMap }),
      });

      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : {};

      if (!response.ok) throw new Error(payload.error || 'Failed to create project');

      show('Success', 'Project created and modules initialized.');
      router.push(payload.redirectTo);
    } catch (err: any) {
      show('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full bg-background relative selection:bg-primary/30">
      <div className="flex-1 overflow-y-auto pr-2 space-y-12 max-h-[75vh] custom-scrollbar pb-10">
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/60 uppercase ml-1">Project Identifier</label>
            <input
              className="w-full rounded-sm border border-border bg-muted/5 p-5 text-xl font-light tracking-tight focus:border-primary outline-none transition-all placeholder:text-muted-foreground/20"
              placeholder="Assign a title to this vector..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/60 uppercase ml-1">Product Archetype</label>
              <select
                className="w-full rounded-sm border border-border bg-muted/5 p-4 text-sm font-light focus:border-primary outline-none appearance-none cursor-pointer"
                value={productType}
                onChange={e => setProductType(e.target.value as any)}
              >
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/60 uppercase ml-1">Priority Matrix</label>
              <select
                className="w-full rounded-sm border border-border bg-muted/5 p-4 text-sm font-light focus:border-primary outline-none appearance-none cursor-pointer"
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
              >
                {URGENCY_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/60 uppercase ml-1">Required Modules</label>
            <div className="flex flex-wrap gap-2.5">
              {FEATURES.map(f => (
                <button
                  key={f}
                  type="button"
                  className={cn(
                    "px-4 py-2 rounded-sm text-[11px] font-medium tracking-wide transition-all border",
                    selectedFeatures.includes(f)
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/10"
                      : "bg-muted/10 border-border text-muted-foreground hover:border-primary/50"
                  )}
                  onClick={() => toggleFeature(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/60 uppercase ml-1">Logic Briefing</label>
            <textarea
              className="min-h-48 w-full rounded-sm border border-border bg-muted/5 p-5 text-sm font-light focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/20 leading-relaxed"
              placeholder="Describe the desired outcome and technical constraints..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="space-y-8 pt-10 border-t border-border mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <label className="text-[10px] font-mono tracking-[0.4em] text-foreground uppercase">Budget Matrix</label>
              </div>
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Global Telemetry Enabled</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { id: 'frontend', label: 'Client Layer' },
                { id: 'backend', label: 'Logic Core' },
                { id: 'database', label: 'Neural Store' },
                { id: 'infrastructure', label: 'Lattice Layer' }
              ].map((item) => (
                <div key={item.id} className="space-y-2 group">
                  <label className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2 ml-1">
                    <span className="h-1 w-1 bg-primary/40 rounded-full" />
                    {item.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 text-xs font-mono">₹</span>
                    <input
                      type="number"
                      className="w-full rounded-sm border border-border bg-muted/5 pl-8 pr-4 py-3.5 text-sm font-light tracking-tight focus:border-primary outline-none transition-all group-focus-within:bg-muted/10"
                      placeholder="ALLOCATE"
                      value={budgets[item.id as keyof typeof budgets]}
                      onChange={e => setBudgets(prev => ({ ...prev, [item.id]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/[0.03] p-6 rounded-sm flex items-center justify-between border border-primary/10">
              <div className="space-y-1">
                <p className="text-[9px] font-mono tracking-[0.3em] text-primary uppercase">Cumulative Investment</p>
                <p className="text-3xl font-light tracking-tighter text-foreground">
                  ₹{(Object.values(budgets).reduce((acc, v) => acc + (Number(v) || 0), 0) || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[9px] font-mono tracking-[0.3em] text-muted-foreground uppercase">Est. Latency</p>
                <p className="text-sm font-medium text-foreground uppercase tracking-wider">7-12 Cycles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-8 border-t border-border bg-background mt-auto">
        {onCancel && (
          <button
            type="button"
            className="flex-1 py-4 border border-border text-[10px] font-mono uppercase tracking-[0.4em] text-muted-foreground hover:bg-muted/10 transition-all rounded-sm"
            onClick={onCancel}
          >
            Abort
          </button>
        )}
        <button
          type="submit"
          className="flex-[2] py-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:opacity-90 transition-all rounded-sm disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'CALIBRATING...' : 'Initialize Vector'}
        </button>
      </div>
    </form>
  );
}
