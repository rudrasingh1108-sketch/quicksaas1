'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function NeuralTrail() {
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPoints(prev => {
                const newPoints = [...prev, { x: e.clientX, y: e.clientY }];
                if (newPoints.length > 20) return newPoints.slice(1);
                return newPoints;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={containerRef} className="fixed inset-0 z-[60] pointer-events-none pointer-events-none">
            <svg className="w-full h-full opacity-30 fill-none stroke-primary">
                <path
                    d={points.length > 0 ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` : ''}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="transition-all duration-300"
                />
                {points.length > 0 && (
                    <circle
                        cx={points[points.length - 1].x}
                        cy={points[points.length - 1].y}
                        r="3"
                        className="fill-primary/40 animate-pulse"
                    />
                )}
            </svg>
        </div>
    );
}
