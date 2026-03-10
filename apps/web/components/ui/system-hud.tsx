'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function SystemHUD() {
    const { scrollY } = useScroll();
    const [time, setTime] = useState('');
    const [scrollPos, setScrollPos] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
        }, 1000);

        const unsubscribe = scrollY.on('change', (v) => setScrollPos(Math.round(v)));

        return () => {
            clearInterval(timer);
            unsubscribe();
        };
    }, [scrollY]);

    if (!mounted) return null;

    return (
        <div className="fixed bottom-10 left-10 z-[100] hidden lg:block pointer-events-none select-none">
            <div className="flex flex-col gap-4 font-mono text-[9px] tracking-widest text-primary/40 uppercase">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" />
                    <span className="text-white/60">System Active</span>
                    <span className="opacity-30">// {time}</span>
                </div>

                <div className="glass-panel-heavy px-4 py-3 border-white/5 bg-black/40 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/20 animate-scanline" />
                    <div className="space-y-1">
                        <div className="flex justify-between gap-8">
                            <span className="opacity-40">Vector_Pos</span>
                            <span className="text-primary/60 tabular-nums">{scrollPos}PX</span>
                        </div>
                        <div className="flex justify-between gap-8">
                            <span className="opacity-40">Neural_Link</span>
                            <span className="text-primary/60">CONNECTED</span>
                        </div>
                        <div className="flex justify-between gap-8">
                            <span className="opacity-40">Uplink_Node</span>
                            <span className="text-primary/60">NGP_044</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 opacity-20">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                            className="w-0.5 bg-primary/80"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
