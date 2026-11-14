import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface SmurphSkillVfxOverlayProps {
  skillType: string | null;
  tier?: 1 | 2 | 3;
  vfxKey?: number;
  enemyFrame?: EnemyVfxFrame;
}

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  trail: boolean;
  shape?: 'circle' | 'spark' | 'diamond';
  gravity?: number;
}

interface FireballSpec {
  delayMs: number;
  startLeftPct: number;
  startBottomPct: number;
  arcY: number;
  angleDeg: number;
  scale: number;
  widthPx: number;
}

interface BoomSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  sizePx: number;
  rotateDeg: number;
}

interface ZapSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

const FIREBALLS_T1: readonly FireballSpec[] = [
  { delayMs: 0, startLeftPct: 20, startBottomPct: 45, arcY: -12, angleDeg: -5, scale: 0.98, widthPx: 148 },
  { delayMs: 115, startLeftPct: 21, startBottomPct: 39, arcY: 8, angleDeg: 4, scale: 1.06, widthPx: 160 },
];

const FIREBALLS_T2: readonly FireballSpec[] = [
  { delayMs: 0, startLeftPct: 20, startBottomPct: 48, arcY: -24, angleDeg: -8, scale: 0.94, widthPx: 144 },
  { delayMs: 95, startLeftPct: 21, startBottomPct: 41, arcY: 2, angleDeg: 0, scale: 1.04, widthPx: 158 },
  { delayMs: 190, startLeftPct: 20, startBottomPct: 35, arcY: 16, angleDeg: 6, scale: 1.12, widthPx: 170 },
];

const FIREBALLS_T3: readonly FireballSpec[] = [
  { delayMs: 0, startLeftPct: 20, startBottomPct: 50, arcY: -28, angleDeg: -10, scale: 0.92, widthPx: 142 },
  { delayMs: 70, startLeftPct: 21, startBottomPct: 44, arcY: -10, angleDeg: -4, scale: 0.98, widthPx: 152 },
  { delayMs: 140, startLeftPct: 20, startBottomPct: 37, arcY: 16, angleDeg: 6, scale: 1.02, widthPx: 158 },
  { delayMs: 210, startLeftPct: 21, startBottomPct: 46, arcY: -16, angleDeg: -6, scale: 1.08, widthPx: 166 },
  { delayMs: 285, startLeftPct: 21, startBottomPct: 41, arcY: 4, angleDeg: 2, scale: 1.2, widthPx: 184 },
];

const FIRE_BOOMS_T1: readonly BoomSpec[] = [
  { delayMs: 185, rightPct: 6, bottomPct: 28, sizePx: 114, rotateDeg: -6 },
];

const FIRE_BOOMS_T2: readonly BoomSpec[] = [
  { delayMs: 175, rightPct: 9, bottomPct: 33, sizePx: 110, rotateDeg: -10 },
  { delayMs: 295, rightPct: 4, bottomPct: 24, sizePx: 128, rotateDeg: 8 },
];

const FIRE_BOOMS_T3: readonly BoomSpec[] = [
  { delayMs: 170, rightPct: 11, bottomPct: 36, sizePx: 106, rotateDeg: -12 },
  { delayMs: 270, rightPct: 4, bottomPct: 26, sizePx: 120, rotateDeg: 10 },
  { delayMs: 385, rightPct: 5.5, bottomPct: 29, sizePx: 148, rotateDeg: -3 },
];

const LIGHTNING_ZAPS_T1: readonly ZapSpec[] = [
  { delayMs: 110, rightPct: 7, bottomPct: 49, widthPx: 106, rotateDeg: -8 },
];

const LIGHTNING_ZAPS_T2: readonly ZapSpec[] = [
  { delayMs: 95, rightPct: 12, bottomPct: 54, widthPx: 104, rotateDeg: -14 },
  { delayMs: 245, rightPct: 3, bottomPct: 43, widthPx: 118, rotateDeg: 10 },
];

const LIGHTNING_ZAPS_T3: readonly ZapSpec[] = [
  { delayMs: 85, rightPct: 14, bottomPct: 56, widthPx: 104, rotateDeg: -16 },
  { delayMs: 205, rightPct: 2, bottomPct: 46, widthPx: 116, rotateDeg: 12 },
  { delayMs: 325, rightPct: 6, bottomPct: 36, widthPx: 136, rotateDeg: -4 },
];

export const SmurphSkillVfxOverlay: React.FC<SmurphSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredFireballs, setTriggeredFireballs] = useState<number[]>([]);
  const [triggeredBooms, setTriggeredBooms] = useState<number[]>([]);
  const [triggeredZaps, setTriggeredZaps] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'smurph_aterrizaje_heroico' ||
    skillType === 'smurph_landing_impact' ||
    skillType === 'smurph_bolas_fuego' ||
    skillType === 'smurph_aliento_rayo';

  const activeFireballs: readonly FireballSpec[] =
    tier === 3 ? FIREBALLS_T3 : tier === 2 ? FIREBALLS_T2 : FIREBALLS_T1;

  const activeFireBooms: readonly BoomSpec[] =
    tier === 3 ? FIRE_BOOMS_T3 : tier === 2 ? FIRE_BOOMS_T2 : FIRE_BOOMS_T1;

  const activeZaps: readonly ZapSpec[] =
    tier === 3 ? LIGHTNING_ZAPS_T3 : tier === 2 ? LIGHTNING_ZAPS_T2 : LIGHTNING_ZAPS_T1;

  useEffect(() => {
    setTriggeredFireballs([]);
    setTriggeredBooms([]);
    setTriggeredZaps([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'smurph_bolas_fuego') {
      activeFireballs.forEach((fb, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredFireballs((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, fb.delayMs);
        timers.push(id);
      });
      activeFireBooms.forEach((bm, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBooms((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, bm.delayMs);
        timers.push(id);
      });
    } else if (skillType === 'smurph_aliento_rayo') {
      activeZaps.forEach((zp, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredZaps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, zp.delayMs);
        timers.push(id);
      });
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Sonic Takeoff Streaks, Seismic Slam Crater Rings, Dragon Fire Embers, Voltaic Arcs
  useEffect(() => {
    if (!isActiveSkill || !skillType) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 407;
    const height = container.clientHeight || 380;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const heroX = width * 0.245;
    const heroY = height * 0.62;
    const { enemyX, enemyY } = resolveEnemyVfxFrame(enemyFrame, width, height);

    const particles: CanvasParticle[] = [];
    const countMult = tier === 3 ? 1.58 : tier === 2 ? 1.24 : 0.94;

    if (skillType === 'smurph_aterrizaje_heroico') {
      const takeoffPalette = ['#38bdf8', '#bae6fd', '#fbbf24', '#f0f9ff'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 84,
          y: heroY + 46 + (Math.random() - 0.5) * 38,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -(4.2 + Math.random() * 5.8),
          size: 2.2 + Math.random() * 2.8,
          life: -Math.random() * 6,
          maxLife: 18 + Math.random() * 12,
          color: takeoffPalette[i % takeoffPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'spark' : 'diamond',
        });
      }
    } else if (skillType === 'smurph_landing_impact') {
      const slamPalette = ['#38bdf8', '#0ea5e9', '#fde047', '#e0f2fe'];
      const count = Math.round(38 * countMult);
      for (let i = 0; i < count; i++) {
        const originX = i % 2 === 0 ? enemyX : heroX + 22;
        const originY = i % 2 === 0 ? enemyY + 34 : heroY + 58;
        const angle = -Math.PI * (0.1 + Math.random() * 0.8);
        const speed = 3.0 + Math.random() * (5.6 + tier * 1.1);
        particles.push({
          x: originX + (Math.random() - 0.5) * 40,
          y: originY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 2.2 + Math.random() * 3.0,
          life: -Math.random() * 6,
          maxLife: 20 + Math.random() * 14,
          color: slamPalette[i % slamPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'spark',
          gravity: 0.19,
        });
      }
    } else if (skillType === 'smurph_bolas_fuego') {
      const firePalette = ['#f97316', '#fbbf24', '#ef4444', '#fed7aa'];
      const count = Math.round(32 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * (5.0 + tier * 1.0);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 40,
          y: enemyY + (Math.random() - 0.5) * 44,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.9,
          size: 2.2 + Math.random() * 3.0,
          life: -8 - Math.random() * 16,
          maxLife: 22 + Math.random() * 14,
          color: firePalette[i % firePalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'spark',
          gravity: 0.12,
        });
      }
    } else if (skillType === 'smurph_aliento_rayo') {
      const voltPalette = ['#38bdf8', '#22d3ee', '#fef08a', '#e0f2fe'];
      const count = Math.round(34 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.75;
        const speed = 2.8 + Math.random() * (5.8 + tier * 1.1);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 34,
          y: enemyY + (Math.random() - 0.5) * 46,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.0 + Math.random() * 2.8,
          life: -4 - Math.random() * 14,
          maxLife: 18 + Math.random() * 14,
          color: voltPalette[i % voltPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'spark' : 'diamond',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = skillType === 'smurph_aterrizaje_heroico' ? 520 : 940;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (skillType === 'smurph_aterrizaje_heroico') {
        for (let r = 0; r < 2; r++) {
          const start = r * 0.14;
          const span = 0.72;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              heroX,
              heroY + 72 - p * 36,
              22 + p * 54,
              7 + p * 15,
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r === 0
                ? `rgba(56, 189, 248, ${(1 - p) * 0.88})`
                : `rgba(250, 204, 21, ${(1 - p) * 0.72})`;
            ctx.lineWidth = (3.0 - r * 0.5) * (1 - p * 0.4);
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'smurph_landing_impact') {
        const rings = tier === 3 ? 3 : 2;
        for (let r = 0; r < rings; r++) {
          const start = r * 0.11;
          const span = 0.62;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            // Enemy crater shockwave
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 46,
              28 + p * (72 + tier * 12),
              9 + p * (22 + tier * 4),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(56, 189, 248, ${(1 - p) * 0.9})`
                : `rgba(253, 224, 71, ${(1 - p) * 0.8})`;
            ctx.lineWidth = (3.6 - r * 0.4) * (1 - p * 0.4);
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();

            // Hero landing fist shockwave
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              heroX + 18,
              heroY + 74,
              26 + p * (62 + tier * 10),
              8 + p * (18 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(125, 211, 252, ${(1 - p) * 0.85})`;
            ctx.lineWidth = (3.2 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'smurph_bolas_fuego') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.14 + r * 0.14;
          const span = 0.48;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 46,
              24 + p * (58 + tier * 10),
              8 + p * (18 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(249, 115, 22, ${(1 - p) * 0.88})`
                : `rgba(251, 191, 36, ${(1 - p) * 0.8})`;
            ctx.lineWidth = (3.2 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'smurph_aliento_rayo') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.08 + r * 0.14;
          const span = 0.52;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 46,
              26 + p * (62 + tier * 11),
              8 + p * (19 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(56, 189, 248, ${(1 - p) * 0.9})`
                : `rgba(254, 240, 138, ${(1 - p) * 0.78})`;
            ctx.lineWidth = (3.2 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.gravity) {
          pt.vy += pt.gravity;
        }

        const lifeFrac = pt.life / pt.maxLife;
        const pAlpha = Math.sin(lifeFrac * Math.PI);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, pAlpha * 0.94));
        ctx.strokeStyle = pt.color;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 10;

        if (pt.trail) {
          ctx.beginPath();
          ctx.moveTo(prevX - pt.vx * 1.4, prevY - pt.vy * 1.4);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.65;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (pt.shape === 'diamond') {
          const r = pt.size * 0.92;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.32);
          ctx.lineTo(pt.x + r * 0.76, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.32);
          ctx.lineTo(pt.x - r * 0.76, pt.y);
          ctx.closePath();
          ctx.fill();
        } else if (pt.shape === 'spark') {
          const r = pt.size * 1.1;
          ctx.beginPath();
          ctx.moveTo(pt.x - r, pt.y);
          ctx.lineTo(pt.x + r, pt.y);
          ctx.moveTo(pt.x, pt.y - r);
          ctx.lineTo(pt.x, pt.y + r);
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < totalDurationMs) {
        frameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [isActiveSkill, skillType, tier, vfxKey]);

  const fireballFilter =
    tier === 3
      ? 'url(#smurph-fireball-t3-shader)'
      : tier === 2
      ? 'url(#smurph-fireball-t2-shader)'
      : 'url(#smurph-fireball-t1-shader)';

  const lightningFilter =
    tier === 3
      ? 'url(#smurph-lightning-t3-shader)'
      : tier === 2
      ? 'url(#smurph-lightning-t2-shader)'
      : 'url(#smurph-lightning-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. BOLAS DE FUEGO DRACÓNICAS */}
          <filter id="smurph-fireball-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#f97316" floodOpacity="0.94" result="fireGlow" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-fireball-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.6" floodColor="#ea580c" floodOpacity="0.96" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#fde047" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-fireball-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.08" numOctaves="2" seed="11" result="blazeNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.048 0.135; 0.02 0.065" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="blazeNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingFlame" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.6" floodColor="#dc2626" floodOpacity="0.98" result="crimsonCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fef08a" floodOpacity="0.94" result="solarCore" />
            <feMerge>
              <feMergeNode in="crimsonCorona" />
              <feMergeNode in="solarCore" />
              <feMergeNode in="livingFlame" />
            </feMerge>
          </filter>

          <filter id="smurph-fire-boom-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.25 0.25 0.05 0 0.08
                      0.45 0.95 0.12 0 0.04
                      0.1  0.15 0.35 0 0
                      0    0    0    1 0"
              result="hotBoom"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#f97316" floodOpacity="0.95" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="hotBoom" />
            </feMerge>
          </filter>

          {/* 2. ALIENTO DE RAYO DRACÓNICO */}
          <filter id="smurph-lightning-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#38bdf8" floodOpacity="0.94" result="voltGlow" />
            <feMerge>
              <feMergeNode in="voltGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-lightning-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#0ea5e9" floodOpacity="0.96" result="voltGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#e0f2fe" floodOpacity="0.92" result="plasmaRim" />
            <feMerge>
              <feMergeNode in="voltGlow" />
              <feMergeNode in="plasmaRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-lightning-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.09" numOctaves="2" seed="17" result="arcNoise">
              <animate attributeName="baseFrequency" values="0.022 0.075; 0.055 0.155; 0.022 0.075" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="arcNoise" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="cracklingBeam" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.8" floodColor="#0284c7" floodOpacity="0.98" result="deepVolt" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.0" floodColor="#fef9c3" floodOpacity="0.94" result="whiteArc" />
            <feMerge>
              <feMergeNode in="deepVolt" />
              <feMergeNode in="whiteArc" />
              <feMergeNode in="cracklingBeam" />
            </feMerge>
          </filter>

          <filter id="smurph-volt-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.55 0.9  1.45 0 0.15
                      0.9  1.35 1.65 0 0.25
                      1.35 1.65 2.0  0 0.42
                      0    0    0    0.94 0"
              result="electricSweep"
            />
            <feGaussianBlur in="electricSweep" stdDeviation="1.8" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="electricSweep" />
            </feMerge>
          </filter>

          <filter id="smurph-zap-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.45 0.65 1.25 0 0.12
                      0.85 1.25 1.45 0 0.22
                      1.15 1.45 1.65 0 0.28
                      0    0    0    1 0"
              result="voltZap"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#38bdf8" floodOpacity="0.96" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="voltZap" />
            </feMerge>
          </filter>

          {/* 3. ATERRIZAJE HEROICO */}
          <filter id="smurph-impact-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="4.4" floodColor="#0ea5e9" floodOpacity="0.96" result="shockGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#f0f9ff" floodOpacity="0.92" result="coreGlow" />
            <feMerge>
              <feMergeNode in="shockGlow" />
              <feMergeNode in="coreGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-cyan-boom-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.35 0.75 1.35 0 0.1
                      0.85 1.2  1.5  0 0.2
                      1.2  1.45 1.75 0 0.3
                      0    0    0    1 0"
              result="cyanBoom"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#38bdf8" floodOpacity="0.95" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="cyanBoom" />
            </feMerge>
          </filter>

          {/* SHADERS DEL SPRITE DE SMURPH DRACO */}
          <filter id="smurph-fire-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.075" numOctaves="2" seed="5" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.048 0.13; 0.02 0.06" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="fireNoise" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f97316" floodOpacity="0.94" result="fireColor" />
            <feComposite in="fireColor" in2="wavyAura" operator="in" result="fireAura" />
            <feGaussianBlur in="fireAura" stdDeviation="3.4" result="fireCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fde047" floodOpacity="0.8" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-fire-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.085" numOctaves="2" seed="10" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.056 0.145; 0.024 0.07" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="fireNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#ea580c" floodOpacity="0.96" result="fireColor" />
            <feComposite in="fireColor" in2="wavyAura" operator="in" result="fireAura" />
            <feGaussianBlur in="fireAura" stdDeviation="4.5" result="fireCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef08a" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-fire-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.034 0.095" numOctaves="3" seed="14" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.066 0.165; 0.028 0.08" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="fireNoise" scale="6.4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#dc2626" floodOpacity="1" result="crimsonColor" />
            <feComposite in="crimsonColor" in2="wavyAura" operator="in" result="crimsonAura" />
            <feGaussianBlur in="crimsonAura" stdDeviation="5.8" result="outerCorona" />
            <feFlood floodColor="#fbbf24" floodOpacity="0.94" result="goldEdge" />
            <feComposite in="goldEdge" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.5" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-lightning-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.08" numOctaves="2" seed="19" result="voltNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.05 0.14; 0.02 0.065" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="voltNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.94" result="voltColor" />
            <feComposite in="voltColor" in2="wavyAura" operator="in" result="voltAura" />
            <feGaussianBlur in="voltAura" stdDeviation="3.4" result="voltCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#e0f2fe" floodOpacity="0.86" result="iceRim" />
            <feMerge>
              <feMergeNode in="voltCorona" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-lightning-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.09" numOctaves="2" seed="23" result="voltNoise">
              <animate attributeName="baseFrequency" values="0.024 0.075; 0.058 0.155; 0.024 0.075" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="voltNoise" scale="5.4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#0ea5e9" floodOpacity="0.96" result="voltColor" />
            <feComposite in="voltColor" in2="wavyAura" operator="in" result="voltAura" />
            <feGaussianBlur in="voltAura" stdDeviation="4.6" result="voltCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef9c3" floodOpacity="0.9" result="sparkRim" />
            <feMerge>
              <feMergeNode in="voltCorona" />
              <feMergeNode in="sparkRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-lightning-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.036 0.1" numOctaves="3" seed="27" result="voltNoise">
              <animate attributeName="baseFrequency" values="0.028 0.085; 0.068 0.175; 0.028 0.085" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="voltNoise" scale="6.4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#0284c7" floodOpacity="1" result="cobaltColor" />
            <feComposite in="cobaltColor" in2="wavyAura" operator="in" result="cobaltAura" />
            <feGaussianBlur in="cobaltAura" stdDeviation="5.8" result="outerCorona" />
            <feFlood floodColor="#f0f9ff" floodOpacity="0.94" result="whiteArc" />
            <feComposite in="whiteArc" in2="dilated" operator="in" result="arcRim" />
            <feGaussianBlur in="arcRim" stdDeviation="1.5" result="arcRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="arcRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-landing-hero-shader" x="-32%" y="-32%" width="164%" height="164%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.026 0.08" numOctaves="2" seed="31" result="slamNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.052 0.145; 0.02 0.065" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="slamNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.96" result="cyanColor" />
            <feComposite in="cyanColor" in2="wavyAura" operator="in" result="cyanAura" />
            <feGaussianBlur in="cyanAura" stdDeviation="4.6" result="cyanCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.7" floodColor="#fde047" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="smurph-fire-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="33" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fed7aa" floodOpacity="0.96" result="amberFlood" />
            <feComposite in="amberFlood" in2="rippledRim" operator="in" result="amberRim" />
            <feGaussianBlur in="amberRim" stdDeviation="1.6" result="amberBloom" />
            <feMerge>
              <feMergeNode in="amberBloom" />
              <feMergeNode in="amberRim" />
            </feMerge>
          </filter>

          <filter id="smurph-volt-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="37" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#bae6fd" floodOpacity="0.96" result="voltFlood" />
            <feComposite in="voltFlood" in2="rippledRim" operator="in" result="voltRim" />
            <feGaussianBlur in="voltRim" stdDeviation="1.6" result="voltBloom" />
            <feMerge>
              <feMergeNode in="voltBloom" />
              <feMergeNode in="voltRim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`smurph-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. BOLAS DE FUEGO DRACÓNICAS */
            @keyframes smurphFireballFly {
              0% {
                transform: translate(0px, 0px) scale(0.5);
                opacity: 0;
              }
              15% {
                transform: translate(28px, calc(var(--arc-y, 0px) * 0.25)) scale(1.06);
                opacity: 1;
              }
              76% {
                transform: translate(192px, var(--arc-y, 0px)) scale(1.02);
                opacity: 1;
              }
              100% {
                transform: translate(224px, var(--arc-y, 0px)) scale(0.75);
                opacity: 0;
              }
            }

            @keyframes smurphComicPop {
              0% {
                transform: scale(0.26) rotate(-14deg);
                opacity: 0;
              }
              24% {
                transform: scale(1.18) rotate(4deg);
                opacity: 1;
              }
              46% {
                transform: scale(0.95) rotate(-2deg);
                opacity: 1;
              }
              78% {
                transform: scale(1.02) rotate(1deg);
                opacity: 0.92;
              }
              100% {
                transform: scale(1.14) rotate(4deg);
                opacity: 0;
              }
            }

            /* 2. ALIENTO DE RAYO DRACÓNICO: Haz continuo desde las fauces */
            @keyframes smurphLightningBeamBlast {
              0% {
                transform: scaleX(0.18) scaleY(0.55);
                opacity: 0;
              }
              16% {
                transform: scaleX(1.04) scaleY(1.12);
                opacity: 1;
              }
              36% {
                transform: scaleX(1.0) scaleY(0.96);
                opacity: 1;
              }
              58% {
                transform: scaleX(1.03) scaleY(1.08);
                opacity: 0.96;
              }
              82% {
                transform: scaleX(1.0) scaleY(0.86);
                opacity: 0.78;
              }
              100% {
                transform: scaleX(0.94) scaleY(0.35);
                opacity: 0;
              }
            }

            @keyframes smurphVoltBeamSweep {
              0% {
                opacity: 0;
                -webkit-mask-position: 120% 0%;
                mask-position: 120% 0%;
              }
              20% {
                opacity: 1;
              }
              75% {
                opacity: 0.9;
              }
              100% {
                opacity: 0;
                -webkit-mask-position: -35% 0%;
                mask-position: -35% 0%;
              }
            }

            /* 3. ATERRIZAJE HEROICO: Estallido sísmico eléctrico */
            @keyframes smurphSeismicImpactPop {
              0% {
                transform: scale(0.28) rotate(-8deg);
                opacity: 0;
              }
              20% {
                transform: scale(1.2) rotate(4deg);
                opacity: 1;
              }
              60% {
                transform: scale(1.02) rotate(7deg);
                opacity: 0.92;
              }
              100% {
                transform: scale(1.22) rotate(12deg);
                opacity: 0;
              }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* ================================================================= */}
          {/* 1. BOLAS DE FUEGO DRACÓNICAS (smurph_bolas_fuego)                 */}
          {/* ================================================================= */}
          {skillType === 'smurph_bolas_fuego' && (
            <>
              {triggeredFireballs.map((fbIdx) => {
                const fb = activeFireballs[fbIdx];
                if (!fb) return null;
                return (
                  <div
                    key={`smurph-fb-${vfxKey}-${fbIdx}`}
                    className="absolute pointer-events-none z-20 overflow-visible"
                    style={{
                      left: `${fb.startLeftPct}%`,
                      bottom: `${fb.startBottomPct}%`,
                      width: `${fb.widthPx}px`,
                      height: `${Math.round(fb.widthPx * 0.42)}px`,
                      transform: `rotate(${fb.angleDeg}deg) scale(${fb.scale})`,
                    }}
                  >
                    <img
                      src="/assets/combat/smurph_vfx_fireball.png"
                      alt="Bola de Fuego Dracónica"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      style={
                        {
                          '--arc-y': `${fb.arcY}px`,
                          filter: fireballFilter,
                          animation: 'smurphFireballFly 0.36s cubic-bezier(0.16,0.92,0.28,1) forwards',
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}

              {triggeredBooms.map((bmIdx) => {
                const bm = activeFireBooms[bmIdx];
                if (!bm) return null;
                return (
                  <div
                    key={`smurph-boom-${vfxKey}-${bmIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${bm.rightPct}%`,
                      bottom: `${bm.bottomPct}%`,
                      width: `${bm.sizePx}px`,
                      height: `${Math.round(bm.sizePx * 0.78)}px`,
                      transform: `rotate(${bm.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src="/assets/combat/prometeo_vfx_boom.png"
                      alt="BOOM!"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[smurphComicPop_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#smurph-fire-boom-shader)' }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 2. ALIENTO DE RAYO DRACÓNICO (smurph_aliento_rayo)                */}
          {/* ================================================================= */}
          {skillType === 'smurph_aliento_rayo' && (
            <>
              <div
                className={`absolute left-[18.5%] pointer-events-none z-20 overflow-visible origin-left ${
                  tier === 3
                    ? 'bottom-[34%] w-[72%] h-[118px]'
                    : tier === 2
                    ? 'bottom-[36%] w-[71%] h-[102px]'
                    : 'bottom-[37%] w-[70%] h-[88px]'
                }`}
                style={{
                  animation: 'smurphLightningBeamBlast 0.72s cubic-bezier(0.16,1,0.3,1) forwards',
                }}
              >
                <img
                  src="/assets/combat/smurph_vfx_rayo.png"
                  alt="Aliento de Rayo Dracónico"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-fill"
                  style={{ filter: lightningFilter }}
                />
                <img
                  src="/assets/combat/smurph_vfx_rayo.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  style={{
                    mixBlendMode: 'screen',
                    filter: 'url(#smurph-volt-sweep-shader)',
                    WebkitMaskImage:
                      'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                    maskImage:
                      'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                    WebkitMaskSize: '230% 100%',
                    maskSize: '230% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation: 'smurphVoltBeamSweep 0.62s ease-out forwards',
                  }}
                />
              </div>

              {/* Estallido voltaico en el impacto del enemigo */}
              <div
                className={`absolute flex items-center justify-center pointer-events-none z-20 overflow-visible ${
                  tier === 3
                    ? 'right-[4%] bottom-[21%] w-[166px] h-[166px]'
                    : tier === 2
                    ? 'right-[5%] bottom-[23%] w-[144px] h-[144px]'
                    : 'right-[6%] bottom-[25%] w-[124px] h-[124px]'
                }`}
              >
                <img
                  src="/assets/combat/smurph_vfx_impacto.png"
                  alt="Descarga Voltaica"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[smurphSeismicImpactPop_0.54s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: lightningFilter }}
                />
              </div>

              {triggeredZaps.map((zpIdx) => {
                const zp = activeZaps[zpIdx];
                if (!zp) return null;
                return (
                  <div
                    key={`smurph-zap-${vfxKey}-${zpIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${zp.rightPct}%`,
                      bottom: `${zp.bottomPct}%`,
                      width: `${zp.widthPx}px`,
                      height: `${Math.round(zp.widthPx * 0.56)}px`,
                      transform: `rotate(${zp.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src="/assets/combat/giovani_vfx_zap.png"
                      alt="ZAP!"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[smurphComicPop_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#smurph-zap-shader)' }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 3. ATERRIZAJE HEROICO: IMPACTO SÍSMICO (smurph_landing_impact)    */}
          {/* ================================================================= */}
          {skillType === 'smurph_landing_impact' && (
            <>
              {/* Onda sísmica bajo Smurph al estrellar el puño */}
              <div
                className={`absolute left-[11%] bottom-[11%] pointer-events-none z-15 flex items-center justify-center ${
                  tier === 3 ? 'w-[186px] h-[112px]' : 'w-[162px] h-[98px]'
                }`}
              >
                <img
                  src="/assets/combat/smurph_vfx_impacto.png"
                  alt="Impacto Sísmico"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[smurphSeismicImpactPop_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: 'url(#smurph-impact-shader)', transform: 'scaleY(0.62)' }}
                />
              </div>

              {/* Explosión eléctrica sobre el enemigo */}
              <div
                className={`absolute flex items-center justify-center pointer-events-none z-20 overflow-visible ${
                  tier === 3
                    ? 'right-[3.5%] bottom-[19%] w-[196px] h-[196px]'
                    : tier === 2
                    ? 'right-[4.5%] bottom-[21%] w-[176px] h-[176px]'
                    : 'right-[5.5%] bottom-[23%] w-[154px] h-[154px]'
                }`}
              >
                <img
                  src="/assets/combat/smurph_vfx_impacto.png"
                  alt="Colapso Dracónico"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[smurphSeismicImpactPop_0.62s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: 'url(#smurph-impact-shader)' }}
                />
              </div>

              <div
                className={`absolute flex items-center justify-center pointer-events-none z-20 overflow-visible ${
                  tier === 3
                    ? 'right-[4.5%] bottom-[47%] w-[144px] h-[108px]'
                    : 'right-[6%] bottom-[48%] w-[124px] h-[94px]'
                }`}
              >
                <img
                  src="/assets/combat/prometeo_vfx_boom.png"
                  alt="BOOM!"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[smurphComicPop_0.54s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                  style={{ filter: 'url(#smurph-cyan-boom-shader)' }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
