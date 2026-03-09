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
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[70vh] custom-scrollbar">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Title</label>
            <input
              className="w-full rounded-lg border bg-background p-2.5 mt-1 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="e.g. B2B Delivery Portal"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Product Type</label>
              <select
                className="w-full rounded-lg border bg-background p-2.5 mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                value={productType}
                onChange={e => setProductType(e.target.value as any)}
              >
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Urgency</label>
              <select
                className="w-full rounded-lg border bg-background p-2.5 mt-1 focus:ring-2 focus:ring-primary/20 outline-none"
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
              >
                {URGENCY_LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Core Features</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <Badge
                  key={f}
                  className={`cursor-pointer transition-all ${selectedFeatures.includes(f) ? 'bg-primary text-primary-foreground scale-105 shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  onClick={() => toggleFeature(f)}
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Third-party Integrations</label>
            <div className="flex flex-wrap gap-2">
              {INTEGRATIONS.map(i => (
                <Badge
                  key={i}
                  className={`cursor-pointer transition-all ${selectedIntegrations.includes(i) ? 'bg-primary text-primary-foreground scale-105 shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  onClick={() => toggleIntegration(i)}
                >
                  {i}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Detailed Requirements</label>
            <textarea
              className="min-h-32 w-full rounded-lg border bg-background p-2.5 mt-1 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              placeholder="Describe business logic, user flows, and any specific constraints..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4 pt-6 border-t border-border/50 bg-primary/5 -mx-2 px-2 pb-4 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <label className="text-sm font-bold uppercase tracking-widest text-primary">Pre-Allocate Module Budgets (INR)</label>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-3 mb-4">Leave at ₹0 for auto-calculation based on complexity.</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter block ml-1">Frontend Layer</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border bg-background pl-6 pr-2.5 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                    value={budgets.frontend}
                    onChange={e => setBudgets(prev => ({ ...prev, frontend: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter block ml-1">Backend Core</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border bg-background pl-6 pr-2.5 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                    value={budgets.backend}
                    onChange={e => setBudgets(prev => ({ ...prev, backend: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter block ml-1">Data / DB Scheme</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border bg-background pl-6 pr-2.5 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                    value={budgets.database}
                    onChange={e => setBudgets(prev => ({ ...prev, database: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter block ml-1">Cloud / Infra</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border bg-background pl-6 pr-2.5 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                    value={budgets.infrastructure}
                    onChange={e => setBudgets(prev => ({ ...prev, infrastructure: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-border/50">
        {onCancel && <Button type="button" variant="outline" className="flex-1 font-bold" onClick={onCancel}>Abort</Button>}
        <Button type="submit" className="flex-1 font-bold shadow-lg shadow-primary/20" disabled={loading}>
          {loading ? 'Initializing Engine...' : 'Launch Execution Vector'}
        </Button>
      </div>
    </form>
  );
}
