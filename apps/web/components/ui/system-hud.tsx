'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useMotionValue, useAnimationFrame } from 'framer-motion';

export default function SystemHUD() {
    const { scrollY } = useScroll();
    const [time, setTime] = useState('');
    const [mounted, setMounted] = useState(false);

    // Performance: Use MotionValue for scroll pos to avoid React re-renders
    const scrollPosValue = useMotionValue(0);
    const scrollPosRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
        }, 5000); // Reduce clock update frequency

        const unsubscribe = scrollY.on('change', (v) => {
            scrollPosValue.set(Math.round(v));
        });

        return () => {
            clearInterval(timer);
            unsubscribe();
        };
    }, [scrollY, scrollPosValue]);

    // Update the DOM directly for the scroll position text
    useAnimationFrame(() => {
        if (scrollPosRef.current) {
            scrollPosRef.current.textContent = `${scrollPosValue.get()}PX`;
        }
    });

    if (!mounted) return null;

    return (
        <div className="fixed bottom-10 left-10 z-[100] hidden lg:block pointer-events-none select-none">
            <div className="flex flex-col gap-4 font-mono text-[9px] tracking-widest text-primary/50 uppercase">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse" />
                    <span className="text-[#080705]/50">System Active</span>
                    <span className="opacity-30">// {time}</span>
                </div>

                <div className="px-4 py-3 rounded-xl bg-white/70 border border-[#080705]/8 backdrop-blur-md relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/20 animate-scanline" />
                    <div className="space-y-1">
                        <div className="flex justify-between gap-8">
                            <span className="opacity-40">Vector_Pos</span>
                            <span ref={scrollPosRef} className="text-primary tabular-nums">0PX</span>
                        </div>
                        <div className="flex justify-between gap-8">
                            <span className="opacity-40">Neural_Link</span>
                            <span className="text-primary">CONNECTED</span>
                        </div>
                        <div className="flex justify-between gap-8">
                            <span className="opacity-40">Uplink_Node</span>
                            <span className="text-primary">NGP_044</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 opacity-30">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-0.5 bg-primary animate-pulse"
                            style={{
                                height: '8px',
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '1.5s'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
