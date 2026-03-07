'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Trash2, Code, Terminal, Sparkles, Copy, Check } from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';

export default function SqlSchemaArchitectPage() {
    const [tableName, setTableName] = useState('orders');
    const [columns, setColumns] = useState([
        { name: 'id', type: 'uuid', primary: true },
        { name: 'created_at', type: 'timestamp', primary: false },
        { name: 'user_id', type: 'uuid', primary: false },
    ]);
    const [sql, setSql] = useState('');
    const [copied, setCopied] = useState(false);

    const addColumn = () => {
        setColumns([...columns, { name: 'new_column', type: 'text', primary: false }]);
    };

    const removeColumn = (index: number) => {
        setColumns(columns.filter((_, i) => i !== index));
    };

    const updateColumn = (index: number, field: string, value: string | boolean) => {
        const newCols = [...columns];
        (newCols[index] as any)[field] = value;
        setColumns(newCols);
    };

    const generateSql = () => {
        let query = `CREATE TABLE public.${tableName} (\n`;
        const colLines = columns.map(c =>
            `  ${c.name} ${c.type}${c.primary ? ' PRIMARY KEY DEFAULT gen_random_uuid()' : ''}${c.name === 'created_at' ? ' DEFAULT now()' : ''}`
        );
        query += colLines.join(',\n');
        query += `\n);\n\n`;
        query += `-- Enable RLS\nALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
        query += `-- Policy Placeholder\nCREATE POLICY "Allow public read" ON public.${tableName}\n  FOR SELECT USING (true);`;
        setSql(query);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AppShell role="freelancer" title="SQL Schema Architect">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <Card className="relative overflow-hidden p-8 border-none bg-slate-950 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-20%,rgba(59,130,246,0.15),transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                            <Database className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Neural Data Modeler</span>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tight mb-2 uppercase">
                            SQL Schema <span className="text-blue-500">Architect</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            AI-driven relational mapping. Design your table architecture and generate production-ready Supabase SQL with RLS policies.
                        </p>
                    </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Configuration</h3>
                                <Button variant="outline" size="sm" onClick={addColumn} className="h-8 rounded-lg border-dashed">
                                    <Plus className="w-3 h-3 mr-1" /> Add Column
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 block">Table Name</label>
                                    <Input
                                        value={tableName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableName(e.target.value)}
                                        className="h-12 bg-gray-50/50 border-gray-200"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Columns</label>
                                    {columns.map((col, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <Input
                                                value={col.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColumn(i, 'name', e.target.value)}
                                                className="h-10 bg-white"
                                                placeholder="Column name"
                                            />
                                            <select
                                                value={col.type}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateColumn(i, 'type', e.target.value)}
                                                className="h-10 rounded-lg border border-border bg-white px-2 text-xs outline-none"
                                            >
                                                <option value="uuid">UUID</option>
                                                <option value="text">TEXT</option>
                                                <option value="timestamp">TIMESTAMP</option>
                                                <option value="integer">INTEGER</option>
                                                <option value="boolean">BOOLEAN</option>
                                                <option value="jsonb">JSONB</option>
                                            </select>
                                            <button
                                                onClick={() => removeColumn(i)}
                                                className="p-2 text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={generateSql}
                                className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white h-12 font-black uppercase tracking-widest"
                            >
                                <Sparkles className="w-4 h-4 mr-2" /> Generate SQL
                            </Button>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-0 overflow-hidden bg-slate-950 border-none shadow-2xl flex flex-col h-full min-h-[500px]">
                            <div className="bg-slate-900 border-b border-white/5 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-blue-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supabase SQL Output</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    className="h-8 text-slate-400 hover:text-white"
                                >
                                    {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <div className="flex-1 p-6 font-mono text-[11px] text-blue-400/80 leading-relaxed overflow-auto">
                                {sql ? (
                                    <pre className="whitespace-pre-wrap">{sql}</pre>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                                        <Terminal className="w-12 h-12 opacity-20" />
                                        <p className="italic">Telemetry data pending generation</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
