'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Message {
    id: string;
    project_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender_name?: string;
    sender_role?: string;
}

export function ProjectChat({ projectId, currentUserId }: { projectId: string; currentUserId: string }) {
    const supabase = createSupabaseBrowserClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial load
        async function loadMessages() {
            const { data, error } = await supabase
                .from('project_messages')
                .select('*, sender:users(full_name, role)')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data.map(m => ({
                    ...m,
                    sender_name: m.sender?.full_name,
                    sender_role: m.sender?.role
                })));
            }
        }

        loadMessages();

        // Real-time subscription
        const channel = supabase
            .channel(`project-chat-${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'project_messages',
                filter: `project_id=eq.${projectId}`
            }, async (payload) => {
                // Fetch sender info for the new message
                const { data: sender } = await supabase
                    .from('users')
                    .select('full_name, role')
                    .eq('id', payload.new.sender_id)
                    .single();

                const newMessage = {
                    ...payload.new as Message,
                    sender_name: sender?.full_name,
                    sender_role: sender?.role
                };

                setMessages(prev => [...prev, newMessage]);
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [projectId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;
        setLoading(true);

        const { error } = await supabase.from('project_messages').insert({
            project_id: projectId,
            sender_id: currentUserId,
            content: input.trim()
        });

        if (!error) {
            setInput('');
        }
        setLoading(false);
    }

    return (
        <Card className="flex flex-col h-[500px] overflow-hidden border-border bg-card">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Project Collaboration</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground italic text-sm">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMe = m.sender_id === currentUserId;
                            return (
                                <div key={m.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {!isMe && <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{m.sender_role}</span>}
                                        <span className="text-[11px] text-muted-foreground">{m.sender_name || 'User'}</span>
                                    </div>
                                    <div className={cn(
                                        "rounded-2xl px-4 py-2 text-sm shadow-sm",
                                        isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none border border-border"
                                    )}>
                                        {m.content}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground mt-1 opacity-50">
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/10">
                <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex gap-2"
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                    <Button size="sm" disabled={!input.trim() || loading} type="submit">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
