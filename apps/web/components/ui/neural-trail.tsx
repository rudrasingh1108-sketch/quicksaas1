'use client';

import { useEffect, useRef } from 'react';

export default function NeuralTrail() {
    const pointsRef = useRef<{ x: number, y: number }[]>([]);
    const pathRef = useRef<SVGPathElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);

    useEffect(() => {
        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            pointsRef.current.push({ x: e.clientX, y: e.clientY });
            if (pointsRef.current.length > 20) {
                pointsRef.current.shift();
            }
        };

        const updateTrail = () => {
            if (pathRef.current && pointsRef.current.length > 0) {
                const d = `M ${pointsRef.current.map(p => `${p.x},${p.y}`).join(' L ')}`;
                pathRef.current.setAttribute('d', d);

                if (circleRef.current) {
                    const lastPoint = pointsRef.current[pointsRef.current.length - 1];
                    circleRef.current.setAttribute('cx', lastPoint.x.toString());
                    circleRef.current.setAttribute('cy', lastPoint.y.toString());
                    circleRef.current.style.opacity = '1';
                }
            } else if (circleRef.current) {
                circleRef.current.style.opacity = '0';
            }
            animationFrameId = requestAnimationFrame(updateTrail);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animationFrameId = requestAnimationFrame(updateTrail);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none">
            <svg className="w-full h-full opacity-30 fill-none stroke-primary">
                <path
                    ref={pathRef}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="transition-all duration-300"
                />
                <circle
                    ref={circleRef}
                    r="3"
                    className="fill-primary/40 animate-pulse opacity-0"
                />
            </svg>
        </div>
    );
}
