'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Sparkles } from 'lucide-react';
import { useToast } from '../../lib/hooks/use-toast';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

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
    <form onSubmit={onSubmit} className="flex flex-col h-full bg-background relative">
      <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 z-50">V2.0-BUDGETS-LIVE</div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 max-h-[70vh] custom-scrollbar pb-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Operation Title</label>
            <input
              className="w-full rounded-xl border border-border/50 bg-background/50 p-4 text-lg font-bold tracking-tight focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30"
              placeholder="e.g. Project 'Phoenix' SaaS"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Vector Type</label>
              <select
                className="w-full rounded-xl border border-border/50 bg-background/50 p-3.5 font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer"
                value={productType}
                onChange={e => setProductType(e.target.value as any)}
              >
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Priority</label>
              <select
                className="w-full rounded-xl border border-border/50 bg-background/50 p-3.5 font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer"
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
              >
                {URGENCY_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Operational Modules</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <button
                  key={f}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${selectedFeatures.includes(f) ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'}`}
                  onClick={() => toggleFeature(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Execution Objectives</label>
            <textarea
              className="min-h-40 w-full rounded-xl border border-border/50 bg-background/50 p-4 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/30 leading-relaxed"
              placeholder="Define the core logic architecture, user journeys, and critical success factors..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="space-y-6 pt-8 border-t border-border/50 bg-gradient-to-b from-primary/5 to-transparent -mx-4 px-4 pb-8 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Budget Allocation Relay</label>
              </div>
              <Badge variant="outline" className="font-mono text-[9px] border-primary/20 text-primary bg-primary/5 px-2 py-0.5">INR (₹)</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'frontend', label: 'Client Interface', color: 'blue' },
                { id: 'backend', label: 'Logic Core', color: 'purple' },
                { id: 'database', label: 'Neural Store', color: 'emerald' },
                { id: 'infrastructure', label: 'Cloud Lattice', color: 'orange' }
              ].map((item) => (
                <div key={item.id} className="space-y-2 group">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    {item.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border/50 bg-background/50 pl-8 pr-4 py-3 text-sm font-bold tracking-tight focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-transform group-focus-within:scale-[1.02]"
                      placeholder="SET MANUALLY"
                      value={budgets[item.id as keyof typeof budgets]}
                      onChange={e => setBudgets(prev => ({ ...prev, [item.id]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 p-4 rounded-xl flex items-center justify-between border border-primary/20 mt-4">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">TOTAL PROJECTED INVESTMENT</p>
                <p className="text-2xl font-black tracking-tighter">
                  ₹{(Object.values(budgets).reduce((acc, v) => acc + (Number(v) || 0), 0) || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">EST. COMPLETION</p>
                <p className="text-sm font-bold">≈ 7-12 DAYS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-border/50 bg-background">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1 font-black uppercase tracking-widest text-[10px] h-12" onClick={onCancel}>
            Abort Vector
          </Button>
        )}
        <Button type="submit" className="flex-[2] font-black uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-primary/20" disabled={loading}>
          {loading ? 'CALIBRATING ENGINES...' : 'Initiate Execution Stream'}
        </Button>
      </div>
    </form>
  );
}
