import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface RagnavaldrSkillVfxOverlayProps {
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

interface SpearThrustSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  angleDeg: number;
  scale: number;
  widthPx: number;
  flipY?: boolean;
}

interface SpearImpactOnoSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

interface IceKnifeSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

interface FrostBurstSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  sizePx: number;
  rotateDeg: number;
}

const SPEAR_THRUSTS_T1: readonly SpearThrustSpec[] = [
  { delayMs: 0, rightPct: 8, bottomPct: 33, angleDeg: -10, scale: 1.0, widthPx: 172 },
  { delayMs: 95, rightPct: 6, bottomPct: 24, angleDeg: 8, scale: 1.06, widthPx: 180, flipY: true },
];

const SPEAR_THRUSTS_T2: readonly SpearThrustSpec[] = [
  { delayMs: 0, rightPct: 9, bottomPct: 35, angleDeg: -12, scale: 0.98, widthPx: 170 },
  { delayMs: 90, rightPct: 6.5, bottomPct: 23, angleDeg: 10, scale: 1.04, widthPx: 178, flipY: true },
  { delayMs: 185, rightPct: 5, bottomPct: 28, angleDeg: -2, scale: 1.12, widthPx: 194 },
];

const SPEAR_THRUSTS_T3: readonly SpearThrustSpec[] = [
  { delayMs: 0, rightPct: 9.5, bottomPct: 36, angleDeg: -14, scale: 0.96, widthPx: 168 },
  { delayMs: 80, rightPct: 6, bottomPct: 22, angleDeg: 12, scale: 1.02, widthPx: 176, flipY: true },
  { delayMs: 160, rightPct: 8.5, bottomPct: 29, angleDeg: -5, scale: 1.08, widthPx: 186 },
  { delayMs: 245, rightPct: 4.5, bottomPct: 26, angleDeg: 2, scale: 1.18, widthPx: 208 },
];

const SPEAR_ONOS_T1: readonly SpearImpactOnoSpec[] = [
  { delayMs: 65, rightPct: 7, bottomPct: 50, widthPx: 106, rotateDeg: -10 },
];

const SPEAR_ONOS_T2: readonly SpearImpactOnoSpec[] = [
  { delayMs: 55, rightPct: 13, bottomPct: 55, widthPx: 106, rotateDeg: -14 },
  { delayMs: 210, rightPct: 3, bottomPct: 43, widthPx: 118, rotateDeg: 9 },
];

const SPEAR_ONOS_T3: readonly SpearImpactOnoSpec[] = [
  { delayMs: 50, rightPct: 14, bottomPct: 56, widthPx: 106, rotateDeg: -15 },
  { delayMs: 180, rightPct: 2, bottomPct: 46, widthPx: 116, rotateDeg: 11 },
  { delayMs: 285, rightPct: 6, bottomPct: 36, widthPx: 138, rotateDeg: -4 },
];

const ICE_KNIVES_T1: readonly IceKnifeSpec[] = [
  { delayMs: 0, rightPct: 8, bottomPct: 29, widthPx: 112, rotateDeg: 2 },
];

const ICE_KNIVES_T2: readonly IceKnifeSpec[] = [
  { delayMs: 0, rightPct: 11, bottomPct: 31, widthPx: 104, rotateDeg: -10 },
  { delayMs: 115, rightPct: 5, bottomPct: 27, widthPx: 118, rotateDeg: 9 },
];

const ICE_KNIVES_T3: readonly IceKnifeSpec[] = [
  { delayMs: 0, rightPct: 13, bottomPct: 33, widthPx: 100, rotateDeg: -14 },
  { delayMs: 90, rightPct: 3.5, bottomPct: 31, widthPx: 104, rotateDeg: 14 },
  { delayMs: 185, rightPct: 7.5, bottomPct: 26, widthPx: 132, rotateDeg: 0 },
];

const FROST_BURSTS_T1: readonly FrostBurstSpec[] = [
  { delayMs: 170, rightPct: 6, bottomPct: 24, sizePx: 144, rotateDeg: -6 },
];

const FROST_BURSTS_T2: readonly FrostBurstSpec[] = [
  { delayMs: 165, rightPct: 9, bottomPct: 27, sizePx: 142, rotateDeg: -12 },
  { delayMs: 270, rightPct: 4.5, bottomPct: 22, sizePx: 162, rotateDeg: 14 },
];

const FROST_BURSTS_T3: readonly FrostBurstSpec[] = [
  { delayMs: 160, rightPct: 10, bottomPct: 29, sizePx: 140, rotateDeg: -16 },
  { delayMs: 245, rightPct: 4, bottomPct: 24, sizePx: 158, rotateDeg: 16 },
  { delayMs: 335, rightPct: 6, bottomPct: 21, sizePx: 188, rotateDeg: -4 },
];

export const RagnavaldrSkillVfxOverlay: React.FC<RagnavaldrSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredSpears, setTriggeredSpears] = useState<number[]>([]);
  const [triggeredOnos, setTriggeredOnos] = useState<number[]>([]);
  const [triggeredKnives, setTriggeredKnives] = useState<number[]>([]);
  const [triggeredBursts, setTriggeredBursts] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'ragnavaldr_doble_lanza' ||
    skillType === 'ragnavaldr_furia' ||
    skillType === 'ragnavaldr_cuchillo_hielo';

  const activeSpears: readonly SpearThrustSpec[] =
    tier === 3 ? SPEAR_THRUSTS_T3 : tier === 2 ? SPEAR_THRUSTS_T2 : SPEAR_THRUSTS_T1;

  const activeOnos: readonly SpearImpactOnoSpec[] =
    tier === 3 ? SPEAR_ONOS_T3 : tier === 2 ? SPEAR_ONOS_T2 : SPEAR_ONOS_T1;

  const activeKnives: readonly IceKnifeSpec[] =
    tier === 3 ? ICE_KNIVES_T3 : tier === 2 ? ICE_KNIVES_T2 : ICE_KNIVES_T1;

  const activeBursts: readonly FrostBurstSpec[] =
    tier === 3 ? FROST_BURSTS_T3 : tier === 2 ? FROST_BURSTS_T2 : FROST_BURSTS_T1;

  useEffect(() => {
    setTriggeredSpears([]);
    setTriggeredOnos([]);
    setTriggeredKnives([]);
    setTriggeredBursts([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'ragnavaldr_doble_lanza') {
      activeSpears.forEach((sp, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredSpears((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, sp.delayMs);
        timers.push(id);
      });
      activeOnos.forEach((ono, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredOnos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, ono.delayMs);
        timers.push(id);
      });
    } else if (skillType === 'ragnavaldr_cuchillo_hielo') {
      activeKnives.forEach((kn, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredKnives((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, kn.delayMs);
        timers.push(id);
      });
      activeBursts.forEach((b, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBursts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, b.delayMs);
        timers.push(id);
      });
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Twin Flint Spear Shockwaves, Primal Druidic Fury Flames, Glacial Frost Shards
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
    const countMult = tier === 3 ? 1.6 : tier === 2 ? 1.25 : 0.92;

    if (skillType === 'ragnavaldr_doble_lanza') {
      const palette = ['#4ade80', '#22c55e', '#f97316', '#fde047'];
      const count = Math.round(30 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.6;
        const speed = 2.6 + Math.random() * (5.2 + tier * 1.0);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 38,
          y: enemyY + (Math.random() - 0.5) * 44,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          size: 2.0 + Math.random() * 2.8,
          life: -6 - Math.random() * 14,
          maxLife: 21 + Math.random() * 14,
          color: palette[i % palette.length],
          trail: true,
          shape: i % 2 === 0 ? 'spark' : 'diamond',
          gravity: 0.15,
        });
      }
    } else if (skillType === 'ragnavaldr_furia') {
      const furiaPalette = ['#a3e635', '#22c55e', '#f97316', '#fde047'];
      const count = Math.round(28 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 96,
          y: heroY + 46 + (Math.random() - 0.5) * 44,
          vx: (Math.random() - 0.5) * 1.25,
          vy: -(1.9 + Math.random() * (2.8 + tier * 0.55)),
          size: 2.2 + Math.random() * 3.0,
          life: -Math.random() * 12,
          maxLife: 26 + Math.random() * 16,
          color: furiaPalette[i % furiaPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'spark',
        });
      }
    } else if (skillType === 'ragnavaldr_cuchillo_hielo') {
      const icePalette = ['#38bdf8', '#bae6fd', '#0ea5e9', '#f0f9ff'];
      const count = Math.round(32 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * (5.2 + tier * 1.1);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 34,
          y: enemyY + (Math.random() - 0.5) * 34,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0,
          size: 2.2 + Math.random() * 3.0,
          life: -10 - Math.random() * 14,
          maxLife: 22 + Math.random() * 15,
          color: icePalette[i % icePalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'spark' : 'diamond',
          gravity: 0.14,
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 960;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (skillType === 'ragnavaldr_doble_lanza') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.12 + r * 0.13;
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
                ? `rgba(74, 222, 128, ${(1 - p) * 0.86})`
                : `rgba(163, 230, 53, ${(1 - p) * 0.78})`;
            ctx.lineWidth = (3.2 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'ragnavaldr_furia') {
        const floorRings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < floorRings; r++) {
          const start = 0.04 + r * 0.14;
          const span = 0.74;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              heroX,
              heroY + 74,
              24 + p * (62 + tier * 10),
              7 + p * (17 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(163, 230, 53, ${(1 - p) * 0.86})`
                : `rgba(249, 115, 22, ${(1 - p) * 0.78})`;
            ctx.lineWidth = (3.0 - r * 0.35) * (1 - p * 0.42);
            ctx.shadowColor = r % 2 === 0 ? '#84cc16' : '#f97316';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'ragnavaldr_cuchillo_hielo') {
        // Overhead glacial conjuration flash before/during dive
        if (progress < 0.46) {
          const fp = progress / 0.46;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.72 + tier * 0.08);
          ctx.save();
          const grad = ctx.createRadialGradient(enemyX, enemyY - 76, 2, enemyX, enemyY - 76, 44 + tier * 12);
          grad.addColorStop(0, `rgba(224, 242, 254, ${flashAlpha})`);
          grad.addColorStop(0.45, `rgba(56, 189, 248, ${flashAlpha * 0.65})`);
          grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX, enemyY - 76, 44 + tier * 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Frost shatter shockwaves on impact
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.18 + r * 0.12;
          const span = 0.48;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 46,
              24 + p * (60 + tier * 11),
              8 + p * (18 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(56, 189, 248, ${(1 - p) * 0.88})`
                : `rgba(186, 230, 253, ${(1 - p) * 0.78})`;
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
        if (skillType === 'ragnavaldr_furia') {
          pt.x += Math.sin(pt.life * 0.25) * 0.6;
        }
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

  const spearFilter =
    tier === 3
      ? 'url(#ragnavaldr-spear-t3-shader)'
      : tier === 2
      ? 'url(#ragnavaldr-spear-t2-shader)'
      : 'url(#ragnavaldr-spear-t1-shader)';

  const iceKnifeFilter =
    tier === 3
      ? 'url(#ragnavaldr-ice-t3-shader)'
      : tier === 2
      ? 'url(#ragnavaldr-ice-t2-shader)'
      : 'url(#ragnavaldr-ice-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. ESTOCADA DE LANZAS GEMELAS (Flint Spear Thrusts) */}
          <filter id="ragnavaldr-spear-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#f97316" floodOpacity="0.92" result="emberGlow" />
            <feMerge>
              <feMergeNode in="emberGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-spear-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.6" floodColor="#ea580c" floodOpacity="0.96" result="emberGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fde047" floodOpacity="0.86" result="goldRim" />
            <feMerge>
              <feMergeNode in="emberGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-spear-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.08" numOctaves="1" seed="8" result="furyNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.05 0.135; 0.02 0.065" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="furyNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingSpear" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#dc2626" floodOpacity="0.98" result="bloodCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fef08a" floodOpacity="0.9" result="goldRim" />
            <feMerge>
              <feMergeNode in="bloodCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="livingSpear" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-primal-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.55 0.6 0.25 0 0.22
                      0.85 0.9 0.25 0 0.1
                      0.25 0.2 0.35 0 0.02
                      0    0   0    0.92 0"
              result="hotEmber"
            />
            <feGaussianBlur in="hotEmber" stdDeviation="1.9" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotEmber" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-amber-slash-text-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.35 1.1  0.15 0 0.08
                      0.2  0.55 0.15 0 0.04
                      0.1  0.12 0.18 0 0
                      0    0    0    1 0"
              result="emberText"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#f97316" floodOpacity="0.94" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="emberText" />
            </feMerge>
          </filter>

          {/* 3. CUCHILLO DE HIELO (Glacial Dive + Frost Shatter) */}
          <filter id="ragnavaldr-ice-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#38bdf8" floodOpacity="0.94" result="frostGlow" />
            <feMerge>
              <feMergeNode in="frostGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-ice-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#0ea5e9" floodOpacity="0.96" result="frostGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#e0f2fe" floodOpacity="0.9" result="iceRim" />
            <feMerge>
              <feMergeNode in="frostGlow" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-ice-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.085" numOctaves="2" seed="15" result="frostNoise">
              <animate attributeName="baseFrequency" values="0.02 0.07; 0.048 0.14; 0.02 0.07" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="frostNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingIce" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.8" floodColor="#0284c7" floodOpacity="0.98" result="deepFrost" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.0" floodColor="#f0f9ff" floodOpacity="0.95" result="arcticCore" />
            <feMerge>
              <feMergeNode in="deepFrost" />
              <feMergeNode in="arcticCore" />
              <feMergeNode in="livingIce" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-frost-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.55 0.85 1.35 0 0.12
                      0.85 1.25 1.45 0 0.2
                      1.2  1.45 1.85 0 0.35
                      0    0    0    0.92 0"
              result="arcticBloom"
            />
            <feGaussianBlur in="arcticBloom" stdDeviation="1.8" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="arcticBloom" />
            </feMerge>
          </filter>

          {/* SHADERS DEL SPRITE DE RAGNAVALDR */}
          <filter id="ragnavaldr-furia-hero-shader" x="-32%" y="-32%" width="164%" height="164%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.026 0.08" numOctaves="2" seed="21" result="furiaNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.052 0.14; 0.02 0.065" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="furiaNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#84cc16" floodOpacity="0.94" result="limeColor" />
            <feComposite in="limeColor" in2="wavyAura" operator="in" result="limeAura" />
            <feGaussianBlur in="limeAura" stdDeviation="4.6" result="limeCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.7" floodColor="#f97316" floodOpacity="0.88" result="flameRim" />
            <feMerge>
              <feMergeNode in="limeCorona" />
              <feMergeNode in="flameRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-furia-armed-shader" x="-24%" y="-24%" width="148%" height="148%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="dilated" />
            <feFlood floodColor="#84cc16" floodOpacity="0.72" result="furiaColor" />
            <feComposite in="furiaColor" in2="dilated" operator="in" result="furiaRim" />
            <feGaussianBlur in="furiaRim" stdDeviation="2.8" result="furiaGlow" />
            <feMerge>
              <feMergeNode in="furiaGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-ice-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.0" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.075" numOctaves="2" seed="25" result="frostNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.048 0.135; 0.02 0.065" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="frostNoise" scale="4.4" xChannelSelector="R" yChannelSelector="G" result="wavyFrost" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.94" result="cyanColor" />
            <feComposite in="cyanColor" in2="wavyFrost" operator="in" result="cyanAura" />
            <feGaussianBlur in="cyanAura" stdDeviation="4.2" result="cyanCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#e0f2fe" floodOpacity="0.9" result="iceRim" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-furia-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="31" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#bef264" floodOpacity="0.96" result="limeFlood" />
            <feComposite in="limeFlood" in2="rippledRim" operator="in" result="limeRim" />
            <feGaussianBlur in="limeRim" stdDeviation="1.6" result="limeBloom" />
            <feMerge>
              <feMergeNode in="limeBloom" />
              <feMergeNode in="limeRim" />
            </feMerge>
          </filter>

          <filter id="ragnavaldr-ice-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="35" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#bae6fd" floodOpacity="0.96" result="iceFlood" />
            <feComposite in="iceFlood" in2="rippledRim" operator="in" result="iceRim" />
            <feGaussianBlur in="iceRim" stdDeviation="1.6" result="iceBloom" />
            <feMerge>
              <feMergeNode in="iceBloom" />
              <feMergeNode in="iceRim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`ragnavaldr-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. ESTOCADA DE LANZAS GEMELAS: Estocada cuerpo a cuerpo (melé) directo en el objetivo */
            @keyframes ragnavaldrMeleeThrustPierce {
              0% {
                transform: translateX(-30px) scaleX(0.38) scaleY(0.78);
                opacity: 0;
              }
              22% {
                transform: translateX(4px) scaleX(1.08) scaleY(1.05);
                opacity: 1;
              }
              62% {
                transform: translateX(10px) scaleX(1.0) scaleY(0.98);
                opacity: 0.94;
              }
              100% {
                transform: translateX(18px) scaleX(1.08) scaleY(0.84);
                opacity: 0;
              }
            }

            @keyframes ragnavaldrPrimalEnergySweep {
              0% {
                opacity: 0;
                -webkit-mask-position: 120% 0%;
                mask-position: 120% 0%;
              }
              22% {
                opacity: 1;
              }
              76% {
                opacity: 0.85;
              }
              100% {
                opacity: 0;
                -webkit-mask-position: -30% 0%;
                mask-position: -30% 0%;
              }
            }

            @keyframes ragnavaldrOnoPop {
              0% {
                transform: scale(0.28) rotate(-14deg);
                opacity: 0;
              }
              26% {
                transform: scale(1.16) rotate(4deg);
                opacity: 1;
              }
              46% {
                transform: scale(0.96) rotate(-2deg);
                opacity: 1;
              }
              76% {
                transform: scale(1.02) rotate(1deg);
                opacity: 0.9;
              }
              100% {
                transform: scale(1.12) rotate(3deg);
                opacity: 0;
              }
            }

            /* 2. FURIA DRUÍDICA PRIMORDIAL: Aura verde-ígnea detrás del héroe */
            @keyframes ragnavaldrFuriaAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.06); opacity: 0.94; }
              64% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.84; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }

            /* 3. CUCHILLO DE HIELO: Caída glacial en picado + estallido de escarcha */
            @keyframes ragnavaldrIceKnifeDive {
              0% {
                transform: translateY(-155px) scale(0.75) rotate(var(--kn-rot, 0deg));
                opacity: 0;
              }
              18% {
                transform: translateY(-110px) scale(1.05) rotate(var(--kn-rot, 0deg));
                opacity: 1;
              }
              46% {
                transform: translateY(8px) scale(1.08) rotate(var(--kn-rot, 0deg));
                opacity: 1;
              }
              64% {
                transform: translateY(2px) scale(1.0) rotate(var(--kn-rot, 0deg));
                opacity: 0.94;
              }
              100% {
                transform: translateY(10px) scale(0.92) rotate(var(--kn-rot, 0deg));
                opacity: 0;
              }
            }

            @keyframes ragnavaldrFrostShatterPop {
              0% {
                transform: scale(0.3) rotate(-10deg);
                opacity: 0;
              }
              22% {
                transform: scale(1.18) rotate(4deg);
                opacity: 1;
              }
              58% {
                transform: scale(1.0) rotate(8deg);
                opacity: 0.9;
              }
              100% {
                transform: scale(1.2) rotate(14deg);
                opacity: 0;
              }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Aura druídica verde-ámbar sólo al activar Furia Druídica Primordial (sin sprites extra) */}
          {skillType === 'ragnavaldr_furia' && (
            <div
              className="absolute left-[4%] bottom-[4%] w-[212px] h-[294px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[ragnavaldrFuriaAuraBloom_0.94s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    tier === 3
                      ? 'radial-gradient(ellipse at 50% 60%, rgba(217,249,157,0.5) 0%, rgba(132,204,22,0.34) 40%, rgba(249,115,22,0.18) 66%, transparent 78%)'
                      : tier === 2
                      ? 'radial-gradient(ellipse at 50% 60%, rgba(190,242,100,0.42) 0%, rgba(132,204,22,0.28) 42%, rgba(249,115,22,0.12) 64%, transparent 76%)'
                      : 'radial-gradient(ellipse at 50% 62%, rgba(163,230,53,0.36) 0%, rgba(34,197,94,0.22) 44%, transparent 74%)',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. ESTOCADA DE LANZAS GEMELAS (ragnavaldr_doble_lanza)            */}
          {/* ================================================================= */}
          {skillType === 'ragnavaldr_doble_lanza' && (
            <>
              {triggeredSpears.map((spIdx) => {
                const sp = activeSpears[spIdx];
                if (!sp) return null;
                return (
                  <div
                    key={`ragnavaldr-spear-${vfxKey}-${spIdx}`}
                    className="absolute pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${sp.rightPct}%`,
                      bottom: `${sp.bottomPct}%`,
                      width: `${sp.widthPx}px`,
                      height: `${Math.round(sp.widthPx * 0.48)}px`,
                      transform: `rotate(${sp.angleDeg}deg) scale(${sp.scale})${sp.flipY ? ' scaleY(-1)' : ''}`,
                    }}
                  >
                    <div
                      className="relative w-full h-full overflow-visible origin-left"
                      style={{
                        animation: 'ragnavaldrMeleeThrustPierce 0.42s cubic-bezier(0.16,1,0.3,1) forwards',
                      }}
                    >
                      <img
                        src="/assets/combat/ragnavaldr_vfx_lanza.png"
                        alt="Estocada de Lanzas Gemelas"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        style={{ filter: spearFilter }}
                      />
                      <img
                        src="/assets/combat/ragnavaldr_vfx_lanza.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          mixBlendMode: 'screen',
                          filter: 'url(#ragnavaldr-primal-sweep-shader)',
                          WebkitMaskImage:
                            'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                          maskImage:
                            'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                          WebkitMaskSize: '230% 100%',
                          maskSize: '230% 100%',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          animation: 'ragnavaldrPrimalEnergySweep 0.36s ease-out forwards',
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {triggeredOnos.map((onoIdx) => {
                const ono = activeOnos[onoIdx];
                if (!ono) return null;
                return (
                  <div
                    key={`ragnavaldr-ono-${vfxKey}-${onoIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${ono.rightPct}%`,
                      bottom: `${ono.bottomPct}%`,
                      width: `${ono.widthPx}px`,
                      height: `${Math.round(ono.widthPx * 0.54)}px`,
                      transform: `rotate(${ono.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src="/assets/combat/edacorn_vfx_slash.png"
                      alt="SLASH!"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[ragnavaldrOnoPop_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#ragnavaldr-amber-slash-text-shader)' }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 2. FURIA DRUÍDICA PRIMORDIAL (ragnavaldr_furia): Solo aura/canvas */}
          {/* ================================================================= */}

          {/* ================================================================= */}
          {/* 3. CUCHILLO DE HIELO (ragnavaldr_cuchillo_hielo)                  */}
          {/* ================================================================= */}
          {skillType === 'ragnavaldr_cuchillo_hielo' && (
            <>
              {triggeredKnives.map((knIdx) => {
                const kn = activeKnives[knIdx];
                if (!kn) return null;
                return (
                  <div
                    key={`ragnavaldr-knife-${vfxKey}-${knIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${kn.rightPct}%`,
                      bottom: `${kn.bottomPct}%`,
                      width: `${kn.widthPx}px`,
                      height: `${Math.round(kn.widthPx * 1.7)}px`,
                    }}
                  >
                    <img
                      src="/assets/combat/ragnavaldr_vfx_cuchillo_hielo.png"
                      alt="Fragmentos de Hielo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      style={
                        {
                          '--kn-rot': `${kn.rotateDeg}deg`,
                          filter: iceKnifeFilter,
                          animation: 'ragnavaldrIceKnifeDive 0.58s cubic-bezier(0.18,0.9,0.28,1) forwards',
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}

              {triggeredBursts.map((bIdx) => {
                const b = activeBursts[bIdx];
                if (!b) return null;
                return (
                  <div
                    key={`ragnavaldr-frost-${vfxKey}-${bIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${b.rightPct}%`,
                      bottom: `${b.bottomPct}%`,
                      width: `${b.sizePx}px`,
                      height: `${b.sizePx}px`,
                      transform: `rotate(${b.rotateDeg}deg)`,
                    }}
                  >
                    <div
                      className="relative w-full h-full overflow-visible"
                      style={{
                        animation: 'ragnavaldrFrostShatterPop 0.46s cubic-bezier(0.16,1,0.3,1) forwards',
                      }}
                    >
                      <img
                        src="/assets/combat/ragnavaldr_vfx_escarcha.png"
                        alt="Estallido Glacial"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        style={{ filter: iceKnifeFilter }}
                      />
                      <img
                        src="/assets/combat/ragnavaldr_vfx_escarcha.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          mixBlendMode: 'screen',
                          filter: 'url(#ragnavaldr-frost-sweep-shader)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
};
