import React, { useMemo } from 'react';

interface AshDisintegrationEffectProps {
  active: boolean;
  width?: number;
  height?: number;
}

interface ParticleConfig {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  color: string;
}

export const AshDisintegrationEffect: React.FC<AshDisintegrationEffectProps> = ({
  active,
  width = 156,
  height = 268,
}) => {
  const particles = useMemo<ParticleConfig[]>(() => {
    const list: ParticleConfig[] = [];
    const colors = [
      '#f97316', // orange ember
      '#ef4444', // red ember
      '#fbbf24', // golden spark
      '#78716c', // dark ash
      '#a8a29e', // light ash
      '#44403c', // charcoal
    ];

    for (let i = 0; i < 32; i++) {
      list.push({
        id: i,
        left: 10 + Math.random() * 80,
        top: 20 + Math.random() * 75,
        size: 3 + Math.random() * 5,
        duration: 1.2 + Math.random() * 1.0,
        delay: Math.random() * 0.6,
        driftX: (Math.random() - 0.45) * 60,
        driftY: -(40 + Math.random() * 80),
        color: colors[i % colors.length],
      });
    }
    return list;
  }, []);

  if (!active) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-visible select-none"
      style={{ width, height }}
    >
      <style>{`
        @keyframes ashParticleFloat {
          0% {
            opacity: 1;
            transform: translate(0px, 0px) scale(1);
          }
          60% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translate(var(--drift-x), var(--drift-y)) scale(0.3);
          }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: p.color.startsWith('#f') ? `0 0 6px ${p.color}` : 'none',
              borderRadius: '50%',
              animation: `ashParticleFloat ${p.duration}s cubic-bezier(0.2, 0.8, 0.4, 1) ${p.delay}s forwards`,
              '--drift-x': `${p.driftX}px`,
              '--drift-y': `${p.driftY}px`,
            } as React.CSSProperties
          }
          className="absolute"
        />
      ))}
    </div>
  );
};
