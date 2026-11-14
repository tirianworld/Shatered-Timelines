import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface EdacornSkillVfxOverlayProps {
  skillType: string | null;
  tier?: 1 | 2 | 3;
  vfxKey?: number;
  isStealthed?: boolean;
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
  shape?: 'circle' | 'star' | 'diamond';
}

interface DaggerCutSpec {
  delayMs: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
}

interface OnoPopupSpec {
  delayMs: number;
  kind: 'slash' | 'slosh';
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

const DAGGER_CUTS_TIER1: readonly DaggerCutSpec[] = [
  { delayMs: 0, x: -14, y: -12, angle: -28, scale: 0.9, flipX: false, flipY: false },
  { delayMs: 115, x: 8, y: 6, angle: 26, scale: 0.94, flipX: true, flipY: true },
  { delayMs: 230, x: -4, y: -2, angle: -10, scale: 1.0, flipX: false, flipY: true },
];

const DAGGER_CUTS_TIER2: readonly DaggerCutSpec[] = [
  { delayMs: 0, x: -16, y: -16, angle: -34, scale: 0.88, flipX: false, flipY: false },
  { delayMs: 80, x: 10, y: -8, angle: 32, scale: 0.9, flipX: true, flipY: true },
  { delayMs: 160, x: -12, y: 12, angle: -16, scale: 0.94, flipX: false, flipY: true },
  { delayMs: 240, x: 10, y: 14, angle: 42, scale: 0.92, flipX: true, flipY: false },
  { delayMs: 320, x: -12, y: -4, angle: 12, scale: 0.98, flipX: false, flipY: false },
  { delayMs: 400, x: 2, y: 2, angle: -36, scale: 1.04, flipX: true, flipY: true },
];

const DAGGER_CUTS_TIER3: readonly DaggerCutSpec[] = [
  { delayMs: 0, x: -18, y: -20, angle: -38, scale: 0.9, flipX: false, flipY: false },
  { delayMs: 52, x: 10, y: -16, angle: 30, scale: 0.88, flipX: true, flipY: true },
  { delayMs: 104, x: -14, y: 10, angle: -14, scale: 0.94, flipX: false, flipY: true },
  { delayMs: 156, x: 8, y: 16, angle: 48, scale: 0.9, flipX: true, flipY: false },
  { delayMs: 208, x: -18, y: -4, angle: -54, scale: 0.92, flipX: false, flipY: false },
  { delayMs: 260, x: 6, y: -20, angle: 18, scale: 0.95, flipX: true, flipY: true },
  { delayMs: 312, x: -8, y: 18, angle: 60, scale: 0.94, flipX: false, flipY: true },
  { delayMs: 364, x: 12, y: 0, angle: -24, scale: 0.98, flipX: true, flipY: false },
  { delayMs: 416, x: -10, y: -10, angle: 36, scale: 1.02, flipX: false, flipY: true },
  { delayMs: 478, x: -2, y: -2, angle: -30, scale: 1.1, flipX: false, flipY: false },
];

const DAGGER_CUTS_RIPOSTE: readonly DaggerCutSpec[] = [
  { delayMs: 0, x: -12, y: -10, angle: -32, scale: 0.92, flipX: false, flipY: false },
  { delayMs: 85, x: 8, y: 6, angle: 28, scale: 0.96, flipX: true, flipY: true },
  { delayMs: 170, x: -2, y: -2, angle: -18, scale: 1.02, flipX: false, flipY: true },
];

const ONO_TIER1: readonly OnoPopupSpec[] = [
  { delayMs: 45, kind: 'slash', rightPct: 14, bottomPct: 55, widthPx: 112, rotateDeg: -10 },
  { delayMs: 215, kind: 'slosh', rightPct: 2, bottomPct: 42, widthPx: 116, rotateDeg: 8 },
];

const ONO_TIER2: readonly OnoPopupSpec[] = [
  { delayMs: 40, kind: 'slash', rightPct: 15, bottomPct: 57, widthPx: 114, rotateDeg: -12 },
  { delayMs: 190, kind: 'slosh', rightPct: 1.5, bottomPct: 46, widthPx: 120, rotateDeg: 10 },
  { delayMs: 350, kind: 'slash', rightPct: 10, bottomPct: 33, widthPx: 126, rotateDeg: -6 },
];

const ONO_TIER3: readonly OnoPopupSpec[] = [
  { delayMs: 30, kind: 'slash', rightPct: 16, bottomPct: 59, widthPx: 112, rotateDeg: -14 },
  { delayMs: 165, kind: 'slosh', rightPct: 1.5, bottomPct: 51, widthPx: 118, rotateDeg: 11 },
  { delayMs: 305, kind: 'slash', rightPct: 14, bottomPct: 34, widthPx: 122, rotateDeg: -8 },
  { delayMs: 450, kind: 'slosh', rightPct: 4, bottomPct: 45, widthPx: 144, rotateDeg: 5 },
];

const ONO_RIPOSTE: readonly OnoPopupSpec[] = [
  { delayMs: 40, kind: 'slash', rightPct: 7, bottomPct: 52, widthPx: 124, rotateDeg: -8 },
];

export const EdacornSkillVfxOverlay: React.FC<EdacornSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
  isStealthed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredCuts, setTriggeredCuts] = useState<number[]>([]);
  const [triggeredOnos, setTriggeredOnos] = useState<number[]>([]);

  const isAttackSkill = skillType === 'ataque_furtivo' || skillType === 'edacorn_riposte';
  const isActiveSkill =
    skillType === 'ataque_furtivo' ||
    skillType === 'contraataque' ||
    skillType === 'sigilo' ||
    skillType === 'edacorn_riposte';

  const activeCuts: readonly DaggerCutSpec[] =
    skillType === 'edacorn_riposte'
      ? DAGGER_CUTS_RIPOSTE
      : tier === 3
      ? DAGGER_CUTS_TIER3
      : tier === 2
      ? DAGGER_CUTS_TIER2
      : DAGGER_CUTS_TIER1;

  const activeOnos: readonly OnoPopupSpec[] =
    skillType === 'edacorn_riposte'
      ? ONO_RIPOSTE
      : tier === 3
      ? ONO_TIER3
      : tier === 2
      ? ONO_TIER2
      : ONO_TIER1;

  // Staggered timer-driven curved dagger cuts & SLASH!/SLOSH! comic popups
  useEffect(() => {
    setTriggeredCuts([]);
    setTriggeredOnos([]);
    if (!isAttackSkill) return;

    const timers: number[] = [];
    activeCuts.forEach((cut, idx) => {
      const id = window.setTimeout(() => {
        setTriggeredCuts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }, cut.delayMs);
      timers.push(id);
    });

    activeOnos.forEach((ono, idx) => {
      const id = window.setTimeout(() => {
        setTriggeredOnos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }, ono.delayMs);
      timers.push(id);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isAttackSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Emerald Dagger Impact Sparks, Emerald Counter Stance Waves, Stealth Smoke Motes
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

    const heroX = width * 0.255;
    const heroY = height * 0.62;
    const { enemyX, enemyY } = resolveEnemyVfxFrame(enemyFrame, width, height);
    const countMult = tier === 3 ? 1.55 : tier === 2 ? 1.25 : 1.0;

    const particles: CanvasParticle[] = [];

    if (skillType === 'ataque_furtivo' || skillType === 'edacorn_riposte') {
      const palette = ['#10b981', '#34d399', '#a7f3d0', '#4ade80'];
      const count = skillType === 'edacorn_riposte' ? 20 : Math.round(22 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.8 + Math.random() * (4.4 + tier * 0.75);
        particles.push({
          x: enemyX - 6 + (Math.random() - 0.5) * 58,
          y: enemyY + (Math.random() - 0.5) * 74,
          vx: Math.cos(angle) * speed * 0.85,
          vy: Math.sin(angle) * speed * 0.75,
          size: 2.1 + Math.random() * 2.8,
          life: -Math.random() * (tier === 3 ? 22 : 12),
          maxLife: 18 + Math.random() * 14,
          color: palette[i % palette.length],
          trail: i % 2 === 0,
          shape: i % 2 === 0 ? 'diamond' : 'star',
        });
      }
    } else if (skillType === 'contraataque') {
      const emeraldPalette = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 84,
          y: heroY + 62 + (Math.random() - 0.5) * 32,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -(1.9 + Math.random() * (2.6 + tier * 0.5)),
          size: 2.1 + Math.random() * 3.1,
          life: -Math.random() * 12,
          maxLife: 28 + Math.random() * 16,
          color: emeraldPalette[i % emeraldPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'star',
        });
      }
    } else if (skillType === 'sigilo') {
      const stealthPalette = ['#34d399', '#10b981', '#94a3b8', '#a7f3d0'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        particles.push({
          x: heroX + (Math.random() - 0.5) * 54,
          y: heroY + 72 + (Math.random() - 0.5) * 18,
          vx: dir * (1.2 + Math.random() * 2.4),
          vy: -(0.7 + Math.random() * (2.1 + tier * 0.45)),
          size: 2.0 + Math.random() * 3.2,
          life: -Math.random() * 8,
          maxLife: 26 + Math.random() * 18,
          color: stealthPalette[i % stealthPalette.length],
          trail: false,
          shape: i % 3 === 0 ? 'star' : 'circle',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 980;

    const drawFourPointStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r * 1.45 : r * 0.36;
        const a = (i * Math.PI) / 4;
        const sx = cx + Math.cos(a) * rad;
        const sy = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (skillType === 'ataque_furtivo' || skillType === 'edacorn_riposte') {
        if (progress < 0.72) {
          const fp = progress / 0.72;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.58 + tier * 0.09);
          const impactX = enemyX - 8;
          const impactY = enemyY - 4;
          const radius = 44 + tier * 14;

          ctx.save();
          const grad = ctx.createRadialGradient(impactX, impactY, 2, impactX, impactY, radius);
          grad.addColorStop(0, `rgba(167, 243, 208, ${flashAlpha})`);
          grad.addColorStop(0.45, `rgba(16, 185, 129, ${flashAlpha * 0.6})`);
          grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(impactX, impactY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (tier >= 2 && progress > 0.05 && progress < 0.85) {
          const p = (progress - 0.05) / 0.8;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            18 + p * (56 + tier * 10),
            6 + p * (16 + tier * 2.5),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(52, 211, 153, ${(1 - p) * 0.72})`;
          ctx.lineWidth = 2.5 * (1 - p * 0.45);
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'contraataque') {
        const floorRings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < floorRings; r++) {
          const start = 0.04 + r * 0.13;
          const span = 0.76;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              heroX,
              heroY + 76,
              24 + p * (56 + tier * 10),
              7 + p * (16 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(16, 185, 129, ${(1 - p) * 0.82})`
                : `rgba(167, 243, 208, ${(1 - p) * 0.7})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        // Sharp counter-guard diamond perimeter pulse
        if (progress > 0.06 && progress < 0.86) {
          const p = (progress - 0.06) / 0.8;
          const alpha = Math.sin(p * Math.PI) * (0.62 + tier * 0.1);
          const rx = 44 + Math.sin(p * Math.PI * 0.8) * (14 + tier * 4);
          const ry = 66 + Math.sin(p * Math.PI * 0.8) * (18 + tier * 5);
          const cy = heroY - 6;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(heroX, cy - ry);
          ctx.lineTo(heroX + rx, cy);
          ctx.lineTo(heroX, cy + ry);
          ctx.lineTo(heroX - rx, cy);
          ctx.closePath();
          ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
          ctx.lineWidth = tier === 3 ? 2.8 : 2.1;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 16;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'sigilo') {
        if (progress < 0.82) {
          const p = progress / 0.82;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            heroX,
            heroY + 76,
            26 + p * (64 + tier * 10),
            8 + p * (18 + tier * 3),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(52, 211, 153, ${(1 - p) * 0.72})`;
          ctx.lineWidth = 2.4 * (1 - p * 0.45);
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      }

      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;
        pt.x += pt.vx;
        pt.y += pt.vy;

        if (skillType === 'contraataque') {
          pt.x += Math.sin(pt.life * 0.24) * 0.5;
        } else {
          pt.vx *= 0.94;
          pt.vy *= 0.94;
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

        if (pt.shape === 'star') {
          drawFourPointStar(pt.x, pt.y, pt.size * 0.9);
        } else if (pt.shape === 'diamond') {
          const r = pt.size * 0.9;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.35);
          ctx.lineTo(pt.x + r * 0.78, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.35);
          ctx.lineTo(pt.x - r * 0.78, pt.y);
          ctx.closePath();
          ctx.fill();
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

  const corteShaderFilter =
    tier === 3
      ? 'url(#edacorn-corte-t3-shader)'
      : tier === 2
      ? 'url(#edacorn-corte-t2-shader)'
      : 'url(#edacorn-corte-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. ATAQUE FURTIVO: Shaders para cortes curvos de dagas + SLASH/SLOSH */}
          <filter id="edacorn-corte-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.08" numOctaves="1" seed="3" result="windNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.12; 0.02 0.06" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="livingCut" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#10b981" floodOpacity="0.88" result="emeraldGlow" />
            <feMerge>
              <feMergeNode in="emeraldGlow" />
              <feMergeNode in="livingCut" />
            </feMerge>
          </filter>

          <filter id="edacorn-corte-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.09" numOctaves="1" seed="7" result="windNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.055 0.14; 0.024 0.07" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingCut" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#10b981" floodOpacity="0.94" result="emeraldGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#a7f3d0" floodOpacity="0.82" result="mintRim" />
            <feMerge>
              <feMergeNode in="emeraldGlow" />
              <feMergeNode in="mintRim" />
              <feMergeNode in="livingCut" />
            </feMerge>
          </filter>

          <filter id="edacorn-corte-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.1" numOctaves="1" seed="11" result="windNoise">
              <animate attributeName="baseFrequency" values="0.026 0.08; 0.062 0.16; 0.026 0.08" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="livingCut" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#10b981" floodOpacity="0.98" result="emeraldGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#d1fae5" floodOpacity="0.92" result="brightMintRim" />
            <feMerge>
              <feMergeNode in="emeraldGlow" />
              <feMergeNode in="brightMintRim" />
              <feMergeNode in="livingCut" />
            </feMerge>
          </filter>

          <filter id="edacorn-corte-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.35 0.9 0.55 0 0.12
                      0.85 1.45 0.95 0 0.28
                      0.55 1.15 0.85 0 0.18
                      0    0    0    0.95 0"
              result="hotEmerald"
            />
            <feGaussianBlur in="hotEmerald" stdDeviation="1.8" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotEmerald" />
            </feMerge>
          </filter>

          <filter id="edacorn-ono-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#10b981" floodOpacity="0.94" result="emeraldGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#a7f3d0" floodOpacity="0.95" result="mintRim" />
            <feMerge>
              <feMergeNode in="emeraldGlow" />
              <feMergeNode in="mintRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2. CONTRAATAQUE: Shaders Verde Esmeralda sobre el sprite de Edacorn */}
          <filter id="edacorn-counter-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.07" numOctaves="2" seed="4" result="counterNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.044 0.11; 0.02 0.06" dur="0.36s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="counterNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#10b981" floodOpacity="0.92" result="emeraldColor" />
            <feComposite in="emeraldColor" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="3.6" result="emeraldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#a7f3d0" floodOpacity="0.78" result="crispRim" />
            <feMerge>
              <feMergeNode in="emeraldCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="edacorn-counter-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.08" numOctaves="2" seed="9" result="counterNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.052 0.13; 0.024 0.07" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="counterNoise" scale="5.6" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#10b981" floodOpacity="0.96" result="emeraldColor" />
            <feComposite in="emeraldColor" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="5.0" result="emeraldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.7" floodColor="#6ee7b7" floodOpacity="0.9" result="mintRim" />
            <feMerge>
              <feMergeNode in="emeraldCorona" />
              <feMergeNode in="mintRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="edacorn-counter-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.034 0.092" numOctaves="3" seed="14" result="counterNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.065 0.16; 0.028 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="counterNoise" scale="7.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#059669" floodOpacity="1" result="deepEmerald" />
            <feComposite in="deepEmerald" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="6.8" result="outerCorona" />
            <feFlood floodColor="#a7f3d0" floodOpacity="0.96" result="innerMintColor" />
            <feComposite in="innerMintColor" in2="dilated" operator="in" result="innerRim" />
            <feGaussianBlur in="innerRim" stdDeviation="1.6" result="innerRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="innerRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="edacorn-counter-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="17" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.32s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#a7f3d0" floodOpacity="0.96" result="mintFlood" />
            <feComposite in="mintFlood" in2="rippledRim" operator="in" result="mintRim" />
            <feGaussianBlur in="mintRim" stdDeviation="1.6" result="mintBloom" />
            <feMerge>
              <feMergeNode in="mintBloom" />
              <feMergeNode in="mintRim" />
            </feMerge>
          </filter>

          <filter id="edacorn-counter-armed-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.075" numOctaves="2" seed="21" result="guardNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.036 0.1; 0.02 0.065" dur="0.8s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="guardNoise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="wavyGuard" />
            <feFlood floodColor="#10b981" floodOpacity="0.82" result="emeraldGuard" />
            <feComposite in="emeraldGuard" in2="wavyGuard" operator="in" result="guardSilhouette" />
            <feGaussianBlur in="guardSilhouette" stdDeviation="3.2" result="guardAura" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#6ee7b7" floodOpacity="0.72" result="guardRim" />
            <feMerge>
              <feMergeNode in="guardAura" />
              <feMergeNode in="guardRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3. SIGILO ESMERALDA: Shader de Stealth Fantasmal + Humo en los pies */}
          <filter id="edacorn-stealth-hero-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.085" numOctaves="2" seed="13" result="cloakNoise">
              <animate attributeName="baseFrequency" values="0.02 0.07; 0.042 0.135; 0.02 0.07" dur="0.95s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="cloakNoise" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="phasedSprite" />
            <feColorMatrix
              in="phasedSprite"
              type="matrix"
              values="0.58 0.08 0.06 0 0
                      0.14 0.92 0.18 0 0.04
                      0.10 0.34 0.72 0 0.02
                      0    0    0    0.46 0"
              result="spectralBody"
            />
            <feMorphology in="SourceAlpha" operator="erode" radius="2.6" result="innerMask" />
            <feComposite in="SourceAlpha" in2="innerMask" operator="out" result="cloakEdge" />
            <feDisplacementMap in="cloakEdge" in2="cloakNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="wavyEdge" />
            <feFlood floodColor="#34d399" floodOpacity="0.9" result="emeraldEdgeColor" />
            <feComposite in="emeraldEdgeColor" in2="wavyEdge" operator="in" result="emeraldRim" />
            <feGaussianBlur in="emeraldRim" stdDeviation="2.2" result="emeraldGlowRim" />
            <feMerge>
              <feMergeNode in="emeraldGlowRim" />
              <feMergeNode in="spectralBody" />
              <feMergeNode in="emeraldRim" />
            </feMerge>
          </filter>

          <filter id="edacorn-stealth-cast-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.11" numOctaves="2" seed="29" result="vanishNoise">
              <animate attributeName="baseFrequency" values="0.025 0.08; 0.068 0.18; 0.025 0.08" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="vanishNoise" scale="6.5" xChannelSelector="R" yChannelSelector="G" result="warpedBody" />
            <feColorMatrix
              in="warpedBody"
              type="matrix"
              values="0.48 0.10 0.06 0 0
                      0.16 0.96 0.22 0 0.06
                      0.10 0.36 0.74 0 0.03
                      0    0    0    0.58 0"
              result="ghostBody"
            />
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.8" result="dilated" />
            <feFlood floodColor="#10b981" floodOpacity="0.88" result="emeraldMist" />
            <feComposite in="emeraldMist" in2="dilated" operator="in" result="mistSilhouette" />
            <feGaussianBlur in="mistSilhouette" stdDeviation="4.4" result="mistHalo" />
            <feMerge>
              <feMergeNode in="mistHalo" />
              <feMergeNode in="ghostBody" />
            </feMerge>
          </filter>

          <filter id="edacorn-smoke-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="1" seed="5" result="smokeNoise">
              <animate attributeName="baseFrequency" values="0.018 0.04; 0.032 0.07; 0.018 0.04" dur="1.4s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="smokeNoise" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="softSmoke" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#10b981" floodOpacity="0.45" result="stealthGlow" />
            <feMerge>
              <feMergeNode in="stealthGlow" />
              <feMergeNode in="softSmoke" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Persistent Stealth Smoke Clouds at Edacorn's feet while isStealthed is active */}
      {isStealthed && skillType !== 'sigilo' && (
        <div className="absolute inset-0 pointer-events-none z-[18] overflow-hidden select-none">
          <style>{`
            @keyframes edacornStealthFeetDrift {
              0% { transform: translateX(-4px) scale(0.96); opacity: 0.72; }
              50% { transform: translateX(6px) scale(1.04); opacity: 0.88; }
              100% { transform: translateX(-4px) scale(0.96); opacity: 0.72; }
            }
          `}</style>
          <div className="absolute left-[1.5%] bottom-[2%] w-[215px] h-[74px] flex items-end justify-center pointer-events-none">
            <img
              src="/assets/combat/edacorn_vfx_humo.png"
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain animate-[edacornStealthFeetDrift_2.4s_ease-in-out_infinite]"
              style={{ filter: 'url(#edacorn-smoke-shader)' }}
            />
          </div>
        </div>
      )}

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`edacorn-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. CORTES CURVOS DE DAGAS (ataque_furtivo & riposte): sprite íntegro sin recortes de clip-path */
            @keyframes edacornDaggerCutSlice {
              0% {
                transform: translateX(-16px) scaleX(0.45) scaleY(0.76);
                opacity: 0;
              }
              24% {
                transform: translateX(2px) scaleX(1.06) scaleY(1.04);
                opacity: 1;
              }
              64% {
                transform: translateX(6px) scaleX(1.0) scaleY(0.98);
                opacity: 0.94;
              }
              100% {
                transform: translateX(12px) scaleX(1.08) scaleY(0.84);
                opacity: 0;
              }
            }

            @keyframes edacornDaggerSweep {
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

            /* Comic SLASH! / SLOSH! Pop Onomatopeya */
            @keyframes edacornOnoPopCartoony {
              0% {
                transform: scale(0.26) rotate(-14deg);
                opacity: 0;
              }
              24% {
                transform: scale(1.16) rotate(4deg);
                opacity: 1;
              }
              44% {
                transform: scale(0.96) rotate(-2deg);
                opacity: 1;
              }
              76% {
                transform: scale(1.03) rotate(1deg);
                opacity: 0.95;
              }
              100% {
                transform: translateY(-10px) scale(1.1) rotate(5deg);
                opacity: 0;
              }
            }

            /* 2. CONTRAATAQUE: Pilar/Aura Esmeralda de Guardia */
            @keyframes edacornCounterAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.05); opacity: 0.95; }
              62% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.86; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }

            /* 3. SIGILO: Nubes de humo expandiéndose a los pies */
            @keyframes edacornSmokeBillowMain {
              0% { transform: translateY(8px) scale(0.35); opacity: 0; }
              20% { transform: translateY(0px) scale(1.08); opacity: 0.96; }
              68% { transform: translateY(-2px) scale(1.14); opacity: 0.9; }
              100% { transform: translateY(-4px) scale(1.22); opacity: 0.72; }
            }

            @keyframes edacornSmokeBillowSide {
              0% { transform: translateX(0px) scale(0.3) scaleX(-1); opacity: 0; }
              24% { transform: translateX(-14px) scale(1.04) scaleX(-1); opacity: 0.88; }
              72% { transform: translateX(-22px) scale(1.12) scaleX(-1); opacity: 0.72; }
              100% { transform: translateX(-28px) scale(1.2) scaleX(-1); opacity: 0; }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* ================================================================= */}
          {/* 1. ATAQUE FURTIVO & RIPOSTE: Cortes curvos escalados por tier     */}
          {/*    + Onomatopeyas SLASH! y SLOSH!                                 */}
          {/* ================================================================= */}
          {isAttackSkill && (
            <>
              <div className="absolute right-[7.5%] bottom-[22%] w-[188px] h-[165px] flex items-center justify-center pointer-events-none z-15 overflow-visible">
                {triggeredCuts.map((idx) => {
                  const cut = activeCuts[idx];
                  if (!cut) return null;
                  const flipTransform = `${cut.flipX ? 'scaleX(-1)' : ''} ${cut.flipY ? 'scaleY(-1)' : ''}`.trim();
                  return (
                    <div
                      key={`edacorn-dagger-cut-${vfxKey}-${idx}`}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
                      style={{
                        transform: `translate(${cut.x}px, ${cut.y}px) rotate(${cut.angle}deg) scale(${cut.scale}) ${flipTransform}`,
                      }}
                    >
                      <div className="relative w-[144px] h-[72px] flex items-center justify-center overflow-visible animate-[edacornDaggerCutSlice_0.36s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                        <img
                          src="/assets/combat/edacorn_vfx_corte.png"
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          style={{ filter: corteShaderFilter }}
                        />
                        <img
                          src="/assets/combat/edacorn_vfx_corte.png"
                          alt=""
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          style={{
                            mixBlendMode: 'screen',
                            filter: 'url(#edacorn-corte-sweep-shader)',
                            WebkitMaskImage:
                              'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                            maskImage:
                              'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                            WebkitMaskSize: '230% 100%',
                            maskSize: '230% 100%',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            animation: 'edacornDaggerSweep 0.34s ease-out forwards',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {triggeredOnos.map((idx) => {
                const ono = activeOnos[idx];
                if (!ono) return null;
                return (
                  <div
                    key={`edacorn-ono-${vfxKey}-${idx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20"
                    style={{
                      right: `${ono.rightPct}%`,
                      bottom: `${ono.bottomPct}%`,
                      width: `${ono.widthPx}px`,
                      height: `${Math.round(ono.widthPx * 0.52)}px`,
                      transform: `rotate(${ono.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src={
                        ono.kind === 'slosh'
                          ? '/assets/combat/edacorn_vfx_slosh.png'
                          : '/assets/combat/edacorn_vfx_slash.png'
                      }
                      alt={ono.kind === 'slosh' ? 'SLOSH!' : 'SLASH!'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[edacornOnoPopCartoony_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#edacorn-ono-shader)' }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 2. CONTRAATAQUE: Aura Esmeralda detrás del sprite                 */}
          {/* ================================================================= */}
          {skillType === 'contraataque' && (
            <div
              className="absolute left-[4.5%] bottom-[4%] w-[205px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[edacornCounterAuraBloom_0.96s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    tier === 3
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(167,243,208,0.52) 0%, rgba(16,185,129,0.34) 40%, rgba(5,150,105,0.16) 66%, transparent 78%)'
                      : tier === 2
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(110,231,183,0.42) 0%, rgba(16,185,129,0.28) 40%, transparent 76%)'
                      : 'radial-gradient(ellipse at 50% 64%, rgba(52,211,153,0.36) 0%, rgba(5,150,105,0.18) 44%, transparent 72%)',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. SIGILO ESMERALDA: Nubes de humo cartoony a los pies de Edacorn */}
          {/* ================================================================= */}
          {skillType === 'sigilo' && (
            <>
              <div className="absolute left-[0.5%] bottom-[1.5%] w-[230px] h-[82px] flex items-end justify-center pointer-events-none z-20">
                <img
                  src="/assets/combat/edacorn_vfx_humo.png"
                  alt="Humo de Sigilo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[edacornSmokeBillowMain_0.92s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                  style={{ filter: 'url(#edacorn-smoke-shader)' }}
                />
              </div>
              <div className="absolute left-[4%] bottom-[3.5%] w-[195px] h-[68px] flex items-end justify-center pointer-events-none z-15">
                <img
                  src="/assets/combat/edacorn_vfx_humo.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[edacornSmokeBillowSide_0.88s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                  style={{ filter: 'url(#edacorn-smoke-shader)' }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
