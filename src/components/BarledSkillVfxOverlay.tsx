import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface BarledSkillVfxOverlayProps {
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
  shape?: 'circle' | 'star' | 'diamond';
}

interface FaerieBoltSpec {
  delayMs: number;
  startBottomPct: number;
  arcY: number;
  angleDeg: number;
  scale: number;
  widthPx: number;
}

interface MelodyRibbonSpec {
  delayMs: number;
  leftPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  scaleX?: number;
}

const FAERIE_BOLTS_T1: readonly FaerieBoltSpec[] = [
  { delayMs: 0, startBottomPct: 40, arcY: -4, angleDeg: -2, scale: 1.0, widthPx: 146 },
];

const FAERIE_BOLTS_T2: readonly FaerieBoltSpec[] = [
  { delayMs: 0, startBottomPct: 44, arcY: -18, angleDeg: -7, scale: 0.96, widthPx: 138 },
  { delayMs: 110, startBottomPct: 37, arcY: 12, angleDeg: 5, scale: 1.04, widthPx: 148 },
];

const FAERIE_BOLTS_T3: readonly FaerieBoltSpec[] = [
  { delayMs: 0, startBottomPct: 45, arcY: -22, angleDeg: -8, scale: 0.94, widthPx: 136 },
  { delayMs: 80, startBottomPct: 39, arcY: 2, angleDeg: 0, scale: 1.02, widthPx: 146 },
  { delayMs: 160, startBottomPct: 34, arcY: 20, angleDeg: 7, scale: 1.08, widthPx: 154 },
];

const INSPIRACION_RIBBONS_T1: readonly MelodyRibbonSpec[] = [
  { delayMs: 0, leftPct: 6, bottomPct: 18, widthPx: 176, rotateDeg: -4 },
];

const INSPIRACION_RIBBONS_T2: readonly MelodyRibbonSpec[] = [
  { delayMs: 0, leftPct: 5, bottomPct: 16, widthPx: 182, rotateDeg: -6 },
  { delayMs: 130, leftPct: 12, bottomPct: 24, widthPx: 164, rotateDeg: 8, scaleX: -1 },
];

const INSPIRACION_RIBBONS_T3: readonly MelodyRibbonSpec[] = [
  { delayMs: 0, leftPct: 4, bottomPct: 15, widthPx: 188, rotateDeg: -8 },
  { delayMs: 100, leftPct: 13, bottomPct: 24, widthPx: 170, rotateDeg: 10, scaleX: -1 },
  { delayMs: 210, leftPct: 8, bottomPct: 30, widthPx: 196, rotateDeg: -2 },
];

export const BarledSkillVfxOverlay: React.FC<BarledSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredBolts, setTriggeredBolts] = useState<number[]>([]);
  const [triggeredRibbons, setTriggeredRibbons] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'barled_inspiracion' ||
    skillType === 'barled_fuego_feerico' ||
    skillType === 'barled_curacion';

  const activeBolts: readonly FaerieBoltSpec[] =
    tier === 3 ? FAERIE_BOLTS_T3 : tier === 2 ? FAERIE_BOLTS_T2 : FAERIE_BOLTS_T1;

  const activeRibbons: readonly MelodyRibbonSpec[] =
    tier === 3
      ? INSPIRACION_RIBBONS_T3
      : tier === 2
      ? INSPIRACION_RIBBONS_T2
      : INSPIRACION_RIBBONS_T1;

  useEffect(() => {
    setTriggeredBolts([]);
    setTriggeredRibbons([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'barled_fuego_feerico') {
      activeBolts.forEach((b, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBolts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, b.delayMs);
        timers.push(id);
      });
    } else if (skillType === 'barled_inspiracion') {
      activeRibbons.forEach((r, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredRibbons((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, r.delayMs);
        timers.push(id);
      });
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Oud Harmonic Rings, Emerald Healing Motes & Violet Faerie Fire Stars
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
    const countMult = tier === 3 ? 1.55 : tier === 2 ? 1.25 : 1.0;

    const particles: CanvasParticle[] = [];

    if (skillType === 'barled_inspiracion') {
      const palette = ['#fde047', '#fbbf24', '#f59e0b', '#fef9c3'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 92,
          y: heroY + 46 + (Math.random() - 0.5) * 44,
          vx: (Math.random() - 0.5) * 1.1,
          vy: -(1.6 + Math.random() * (2.5 + tier * 0.5)),
          size: 2.1 + Math.random() * 2.9,
          life: -Math.random() * 12,
          maxLife: 28 + Math.random() * 16,
          color: palette[i % palette.length],
          trail: true,
          shape: i % 2 === 0 ? 'star' : 'diamond',
        });
      }
    } else if (skillType === 'barled_curacion') {
      const healPalette = ['#6ee7b7', '#34d399', '#10b981', '#fef08a'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 96,
          y: heroY + 48 + (Math.random() - 0.5) * 48,
          vx: (Math.random() - 0.5) * 1.0,
          vy: -(1.8 + Math.random() * (2.7 + tier * 0.5)),
          size: 2.1 + Math.random() * 3.0,
          life: -Math.random() * 12,
          maxLife: 28 + Math.random() * 16,
          color: healPalette[i % healPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'star' : 'circle',
        });
      }
    } else if (skillType === 'barled_fuego_feerico') {
      const faeriePalette = ['#e879f9', '#c084fc', '#f472b6', '#fde047'];
      const count = Math.round(28 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.6 + Math.random() * (3.6 + tier * 0.8);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 62,
          y: enemyY + 8 + (Math.random() - 0.5) * 56,
          vx: Math.cos(angle) * speed * 0.65,
          vy: -(1.2 + Math.random() * 2.4) + Math.sin(angle) * 0.8,
          size: 2.2 + Math.random() * 3.0,
          life: -6 - Math.random() * 12,
          maxLife: 24 + Math.random() * 16,
          color: faeriePalette[i % faeriePalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'star' : 'diamond',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 960;

    const drawFourPointStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r * 1.48 : r * 0.34;
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

      if (skillType === 'barled_inspiracion' || skillType === 'barled_curacion') {
        const isHeal = skillType === 'barled_curacion';
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.04 + r * 0.14;
          const span = 0.74;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              heroX,
              heroY + 74,
              24 + p * (60 + tier * 10),
              7 + p * (17 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = isHeal
              ? r % 2 === 0
                ? `rgba(52, 211, 153, ${(1 - p) * 0.84})`
                : `rgba(254, 240, 138, ${(1 - p) * 0.72})`
              : r % 2 === 0
              ? `rgba(251, 191, 36, ${(1 - p) * 0.84})`
              : `rgba(254, 249, 195, ${(1 - p) * 0.74})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.42);
            ctx.shadowColor = isHeal ? '#10b981' : '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'barled_fuego_feerico') {
        if (progress > 0.08 && progress < 0.88) {
          const p = (progress - 0.08) / 0.8;
          const ringAlpha = Math.sin(p * Math.PI) * (0.76 + tier * 0.08);

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(enemyX, enemyY + 48, 28 + tier * 12 + p * 26, 9 + tier * 3 + p * 8, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(232, 121, 249, ${ringAlpha})`;
          ctx.lineWidth = 2.8;
          ctx.shadowColor = '#c026d3';
          ctx.shadowBlur = 16;
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(enemyX, enemyY + 48, 20 + tier * 8 + p * 18, 6 + tier * 2 + p * 5, 0, 0, Math.PI * 2);
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = -p * 50;
          ctx.strokeStyle = `rgba(245, 208, 254, ${ringAlpha * 0.9})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.setLineDash([]);

          const grad = ctx.createRadialGradient(enemyX, enemyY, 4, enemyX, enemyY, 48 + tier * 14);
          grad.addColorStop(0, `rgba(245, 208, 254, ${ringAlpha * 0.6})`);
          grad.addColorStop(0.5, `rgba(192, 132, 252, ${ringAlpha * 0.4})`);
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX, enemyY, 48 + tier * 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;
        pt.x += pt.vx + Math.sin(pt.life * 0.24) * 0.55;
        pt.y += pt.vy;

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
          ctx.moveTo(prevX - pt.vx * 1.25, prevY - pt.vy * 1.25);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.62;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (pt.shape === 'star') {
          drawFourPointStar(pt.x, pt.y, pt.size * 0.92);
        } else if (pt.shape === 'diamond') {
          const r = pt.size * 0.88;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.3);
          ctx.lineTo(pt.x + r * 0.76, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.3);
          ctx.lineTo(pt.x - r * 0.76, pt.y);
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

  const inspiracionFilter =
    tier === 3
      ? 'url(#barled-inspiracion-t3-shader)'
      : tier === 2
      ? 'url(#barled-inspiracion-t2-shader)'
      : 'url(#barled-inspiracion-t1-shader)';

  const feericoFilter =
    tier === 3
      ? 'url(#barled-feerico-t3-shader)'
      : tier === 2
      ? 'url(#barled-feerico-t2-shader)'
      : 'url(#barled-feerico-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. INSPIRACIÓN BÁRDICA: Notas Doradas del Oud */}
          <filter id="barled-inspiracion-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#f59e0b" floodOpacity="0.92" result="goldGlow" />
            <feMerge>
              <feMergeNode in="goldGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-inspiracion-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.075" numOctaves="1" seed="5" result="chordNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.046 0.125; 0.02 0.06" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="chordNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingNotes" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#f59e0b" floodOpacity="0.96" result="amberGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="amberGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="livingNotes" />
            </feMerge>
          </filter>

          <filter id="barled-inspiracion-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.09" numOctaves="2" seed="11" result="chordNoise">
              <animate attributeName="baseFrequency" values="0.024 0.075; 0.056 0.15; 0.024 0.075" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="chordNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="livingNotes" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.4" floodColor="#d97706" floodOpacity="0.98" result="amberCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fef9c3" floodOpacity="0.95" result="brightGold" />
            <feMerge>
              <feMergeNode in="amberCorona" />
              <feMergeNode in="brightGold" />
              <feMergeNode in="livingNotes" />
            </feMerge>
          </filter>

          {/* 2. FUEGO FEÉRICO: Destellos y Vórtice Violeta-Magenta */}
          <filter id="barled-destello-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#c026d3" floodOpacity="0.94" result="magentaGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#f5d0fe" floodOpacity="0.88" result="lavenderRim" />
            <feMerge>
              <feMergeNode in="magentaGlow" />
              <feMergeNode in="lavenderRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-feerico-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.075" numOctaves="2" seed="3" result="faerieNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.048 0.14; 0.02 0.06" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="faerieNoise" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="livingFaerie" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#a855f7" floodOpacity="0.94" result="violetGlow" />
            <feMerge>
              <feMergeNode in="violetGlow" />
              <feMergeNode in="livingFaerie" />
            </feMerge>
          </filter>

          <filter id="barled-feerico-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.09" numOctaves="2" seed="9" result="faerieNoise">
              <animate attributeName="baseFrequency" values="0.024 0.075; 0.056 0.155; 0.024 0.075" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="faerieNoise" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="livingFaerie" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.2" floodColor="#c026d3" floodOpacity="0.96" result="magentaGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f5d0fe" floodOpacity="0.9" result="lavenderRim" />
            <feMerge>
              <feMergeNode in="magentaGlow" />
              <feMergeNode in="lavenderRim" />
              <feMergeNode in="livingFaerie" />
            </feMerge>
          </filter>

          <filter id="barled-feerico-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.1" numOctaves="2" seed="16" result="faerieNoise">
              <animate attributeName="baseFrequency" values="0.028 0.085; 0.068 0.18; 0.028 0.085" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="faerieNoise" scale="4.6" xChannelSelector="R" yChannelSelector="G" result="livingFaerie" />
            <feDropShadow dx="0" dy="0" stdDeviation="5.0" floodColor="#a855f7" floodOpacity="0.98" result="purpleCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fdf4ff" floodOpacity="0.94" result="hotRim" />
            <feMerge>
              <feMergeNode in="purpleCorona" />
              <feMergeNode in="hotRim" />
              <feMergeNode in="livingFaerie" />
            </feMerge>
          </filter>

          <filter id="barled-feerico-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.35 0.55 1.35 0 0.2
                      0.45 0.95 1.15 0 0.1
                      1.15 0.85 1.65 0 0.26
                      0    0    0    0.92 0"
              result="hotFaerie"
            />
            <feGaussianBlur in="hotFaerie" stdDeviation="2.0" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotFaerie" />
            </feMerge>
          </filter>

          {/* SHADERS DEL SPRITE DE BARLED */}
          <filter id="barled-inspiracion-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.075" numOctaves="2" seed="4" result="oudNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.12; 0.02 0.06" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="oudNoise" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.92" result="amberColor" />
            <feComposite in="amberColor" in2="wavyAura" operator="in" result="amberAura" />
            <feGaussianBlur in="amberAura" stdDeviation="3.4" result="amberCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fef08a" floodOpacity="0.78" result="crispRim" />
            <feMerge>
              <feMergeNode in="amberCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-inspiracion-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.082" numOctaves="2" seed="9" result="oudNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.054 0.135; 0.024 0.07" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="oudNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.95" result="amberColor" />
            <feComposite in="amberColor" in2="wavyAura" operator="in" result="amberAura" />
            <feGaussianBlur in="amberAura" stdDeviation="4.6" result="amberCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef9c3" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="amberCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-inspiracion-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.034 0.092" numOctaves="3" seed="14" result="oudNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.066 0.16; 0.028 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="oudNoise" scale="6.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#d97706" floodOpacity="1" result="deepGold" />
            <feComposite in="deepGold" in2="wavyAura" operator="in" result="goldAura" />
            <feGaussianBlur in="goldAura" stdDeviation="6.2" result="outerCorona" />
            <feFlood floodColor="#fef9c3" floodOpacity="0.95" result="brightGold" />
            <feComposite in="brightGold" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-curacion-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.026 0.08" numOctaves="2" seed="17" result="healNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.052 0.14; 0.022 0.07" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="healNoise" scale="5.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#10b981" floodOpacity="0.94" result="emeraldColor" />
            <feComposite in="emeraldColor" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="4.5" result="emeraldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef08a" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="emeraldCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-feerico-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.0" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.026 0.08" numOctaves="2" seed="19" result="faerieNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.052 0.14; 0.022 0.07" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="faerieNoise" scale="4.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#c026d3" floodOpacity="0.94" result="faerieColor" />
            <feComposite in="faerieColor" in2="wavyAura" operator="in" result="faerieAura" />
            <feGaussianBlur in="faerieAura" stdDeviation="4.5" result="faerieCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f5d0fe" floodOpacity="0.88" result="lavenderRim" />
            <feMerge>
              <feMergeNode in="faerieCorona" />
              <feMergeNode in="lavenderRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="barled-gold-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="21" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fef08a" floodOpacity="0.96" result="goldFlood" />
            <feComposite in="goldFlood" in2="rippledRim" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldBloom" />
            <feMerge>
              <feMergeNode in="goldBloom" />
              <feMergeNode in="goldRim" />
            </feMerge>
          </filter>

          <filter id="barled-emerald-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="23" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
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

          <filter id="barled-faerie-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="25" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#f5d0fe" floodOpacity="0.96" result="lavenderFlood" />
            <feComposite in="lavenderFlood" in2="rippledRim" operator="in" result="lavenderRim" />
            <feGaussianBlur in="lavenderRim" stdDeviation="1.6" result="lavenderBloom" />
            <feMerge>
              <feMergeNode in="lavenderBloom" />
              <feMergeNode in="lavenderRim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`barled-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1 & 3. INSPIRACIÓN BÁRDICA & CURACIÓN EN MASA: Ondas del Oud ascendiendo */
            @keyframes barledMelodyRise {
              0% {
                transform: translateY(22px) scale(0.45) rotate(var(--mel-rot, 0deg));
                opacity: 0;
              }
              24% {
                transform: translateY(-4px) scale(1.06) rotate(var(--mel-rot, 0deg));
                opacity: 1;
              }
              68% {
                transform: translateY(-16px) scale(1.0) rotate(calc(var(--mel-rot, 0deg) + 4deg));
                opacity: 0.92;
              }
              100% {
                transform: translateY(-30px) scale(1.1) rotate(calc(var(--mel-rot, 0deg) + 8deg));
                opacity: 0;
              }
            }

            /* 2. FUEGO FEÉRICO: Destellos desde la lanza + vórtice feérico sobre el enemigo */
            @keyframes barledFaerieBoltFly {
              0% {
                transform: translate(0px, 0px) scale(0.5);
                opacity: 0;
              }
              16% {
                transform: translate(32px, calc(var(--arc-y, 0px) * 0.25)) scale(1.05);
                opacity: 1;
              }
              74% {
                transform: translate(185px, var(--arc-y, 0px)) scale(1.0);
                opacity: 1;
              }
              100% {
                transform: translate(222px, var(--arc-y, 0px)) scale(0.84);
                opacity: 0;
              }
            }

            @keyframes barledFaerieVortexErupt {
              0% {
                transform: translateY(22px) scaleX(0.42) scaleY(0.28);
                opacity: 0;
              }
              22% {
                transform: translateY(-4px) scaleX(1.08) scaleY(1.08);
                opacity: 1;
              }
              58% {
                transform: translateY(-8px) scaleX(1.0) scaleY(1.02);
                opacity: 0.96;
              }
              84% {
                transform: translateY(-14px) scaleX(1.05) scaleY(0.98);
                opacity: 0.8;
              }
              100% {
                transform: translateY(-22px) scaleX(0.92) scaleY(1.1);
                opacity: 0;
              }
            }

            @keyframes barledFaerieEnergySweep {
              0% {
                opacity: 0;
                -webkit-mask-position: 0% 120%;
                mask-position: 0% 120%;
              }
              24% {
                opacity: 1;
              }
              76% {
                opacity: 0.85;
              }
              100% {
                opacity: 0;
                -webkit-mask-position: 0% -35%;
                mask-position: 0% -35%;
              }
            }

            @keyframes barledAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.05); opacity: 0.95; }
              62% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.86; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Halo del Oud / Lanza Feérica bajo Barled */}
          <div
            className="absolute left-[4.5%] bottom-[4%] w-[205px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[barledAuraBloom_0.94s_cubic-bezier(0.22,1,0.36,1)_forwards]"
            style={{ mixBlendMode: 'screen' }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  skillType === 'barled_curacion'
                    ? 'radial-gradient(ellipse at 50% 62%, rgba(167,243,208,0.48) 0%, rgba(16,185,129,0.32) 42%, rgba(254,240,138,0.14) 66%, transparent 78%)'
                    : skillType === 'barled_fuego_feerico'
                    ? 'radial-gradient(ellipse at 50% 62%, rgba(245,208,254,0.44) 0%, rgba(192,38,211,0.28) 42%, transparent 74%)'
                    : 'radial-gradient(ellipse at 50% 62%, rgba(254,240,138,0.5) 0%, rgba(245,158,11,0.32) 42%, transparent 76%)',
              }}
            />
          </div>

          {/* ================================================================= */}
          {/* 1. INSPIRACIÓN BÁRDICA: Ondas musicales del Oud                   */}
          {/* (Curación en Masa mantiene únicamente el aura y anillos en canvas) */}
          {/* ================================================================= */}
          {skillType === 'barled_inspiracion' &&
            triggeredRibbons.map((idx) => {
              const r = activeRibbons[idx];
              if (!r) return null;
              return (
                <div
                  key={`barled-ribbon-${vfxKey}-${idx}`}
                  className="absolute pointer-events-none z-20 overflow-visible"
                  style={{
                    left: `${r.leftPct}%`,
                    bottom: `${r.bottomPct}%`,
                    width: `${r.widthPx}px`,
                    height: `${r.widthPx}px`,
                    transform: r.scaleX ? `scaleX(${r.scaleX})` : undefined,
                  }}
                >
                  <img
                    src="/assets/combat/barled_vfx_inspiracion.png"
                    alt="Inspiración del Oud"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--mel-rot': `${r.rotateDeg}deg`,
                        filter: inspiracionFilter,
                        animation: 'barledMelodyRise 0.72s cubic-bezier(0.22,1,0.36,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* ================================================================= */}
          {/* 2. FUEGO FEÉRICO: Destellos de lanza + vórtice feérico en enemigo */}
          {/* ================================================================= */}
          {skillType === 'barled_fuego_feerico' && (
            <>
              {triggeredBolts.map((idx) => {
                const b = activeBolts[idx];
                if (!b) return null;
                return (
                  <div
                    key={`barled-destello-${vfxKey}-${idx}`}
                    className="absolute left-[21%] pointer-events-none z-20 overflow-visible"
                    style={{
                      bottom: `${b.startBottomPct}%`,
                      width: `${b.widthPx}px`,
                      height: `${Math.round(b.widthPx * 0.34)}px`,
                      transform: `rotate(${b.angleDeg}deg) scale(${b.scale})`,
                    }}
                  >
                    <img
                      src="/assets/combat/barled_vfx_destello.png"
                      alt="Destello Feérico"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      style={
                        {
                          '--arc-y': `${b.arcY}px`,
                          filter: 'url(#barled-destello-shader)',
                          animation: 'barledFaerieBoltFly 0.4s cubic-bezier(0.18,0.9,0.3,1) forwards',
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}

              {/* Vórtice de Fuego Feérico envolviendo al enemigo */}
              <div
                className={`absolute flex items-end justify-center pointer-events-none z-20 overflow-visible ${
                  tier === 3
                    ? 'right-[5%] bottom-[16%] w-[198px] h-[242px]'
                    : tier === 2
                    ? 'right-[6%] bottom-[17%] w-[172px] h-[214px]'
                    : 'right-[7%] bottom-[19%] w-[148px] h-[186px]'
                }`}
              >
                <img
                  src="/assets/combat/barled_vfx_feerico.png"
                  alt="Fuego Feérico"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain origin-bottom animate-[barledFaerieVortexErupt_0.9s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: feericoFilter }}
                />
                <img
                  src="/assets/combat/barled_vfx_feerico.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain origin-bottom pointer-events-none"
                  style={{
                    mixBlendMode: 'screen',
                    filter: 'url(#barled-feerico-sweep-shader)',
                    WebkitMaskImage:
                      'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 82%)',
                    maskImage:
                      'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 82%)',
                    WebkitMaskSize: '100% 240%',
                    maskSize: '100% 240%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation:
                      'barledFaerieVortexErupt 0.9s cubic-bezier(0.16,1,0.3,1) forwards, barledFaerieEnergySweep 0.9s cubic-bezier(0.22,1,0.36,1) forwards',
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
