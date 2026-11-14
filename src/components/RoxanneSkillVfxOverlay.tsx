import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface RoxanneSkillVfxOverlayProps {
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
  shape?: 'circle' | 'star' | 'diamond' | 'heart';
}

interface MelodyRibbonSpec {
  delayMs: number;
  leftPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  scaleX?: number;
}

interface CharmBurstSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  sizePx: number;
  rotateDeg: number;
}

interface SonicThrustSpec {
  delayMs: number;
  leftPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  scaleY?: number;
}

interface TshkOnoSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

const INSPIRACION_RIBBONS_T1: readonly MelodyRibbonSpec[] = [
  { delayMs: 0, leftPct: 6, bottomPct: 19, widthPx: 184, rotateDeg: -5 },
];

const INSPIRACION_RIBBONS_T2: readonly MelodyRibbonSpec[] = [
  { delayMs: 0, leftPct: 5, bottomPct: 17, widthPx: 188, rotateDeg: -7 },
  { delayMs: 130, leftPct: 12, bottomPct: 26, widthPx: 172, rotateDeg: 8, scaleX: -1 },
];

const INSPIRACION_RIBBONS_T3: readonly MelodyRibbonSpec[] = [
  { delayMs: 0, leftPct: 4, bottomPct: 16, widthPx: 194, rotateDeg: -8 },
  { delayMs: 100, leftPct: 13, bottomPct: 25, widthPx: 176, rotateDeg: 10, scaleX: -1 },
  { delayMs: 210, leftPct: 8, bottomPct: 32, widthPx: 202, rotateDeg: -2 },
];

const VELADA_CHARMS_T1: readonly CharmBurstSpec[] = [
  { delayMs: 110, rightPct: 6.5, bottomPct: 27, sizePx: 148, rotateDeg: -5 },
];

const VELADA_CHARMS_T2: readonly CharmBurstSpec[] = [
  { delayMs: 90, rightPct: 8.5, bottomPct: 31, sizePx: 142, rotateDeg: -10 },
  { delayMs: 220, rightPct: 4.5, bottomPct: 24, sizePx: 158, rotateDeg: 8 },
];

const VELADA_CHARMS_T3: readonly CharmBurstSpec[] = [
  { delayMs: 75, rightPct: 9.5, bottomPct: 33, sizePx: 138, rotateDeg: -14 },
  { delayMs: 185, rightPct: 4.5, bottomPct: 27, sizePx: 150, rotateDeg: 12 },
  { delayMs: 300, rightPct: 6.5, bottomPct: 24, sizePx: 176, rotateDeg: -2 },
];

const ESTOCADA_THRUSTS_T1: readonly SonicThrustSpec[] = [
  { delayMs: 35, leftPct: 28, bottomPct: 37, widthPx: 228, rotateDeg: -3 },
];

const ESTOCADA_THRUSTS_T2: readonly SonicThrustSpec[] = [
  { delayMs: 25, leftPct: 27, bottomPct: 41, widthPx: 224, rotateDeg: -9 },
  { delayMs: 165, leftPct: 29, bottomPct: 33, widthPx: 238, rotateDeg: 7, scaleY: -1 },
];

const ESTOCADA_THRUSTS_T3: readonly SonicThrustSpec[] = [
  { delayMs: 20, leftPct: 26, bottomPct: 43, widthPx: 220, rotateDeg: -11 },
  { delayMs: 125, leftPct: 28, bottomPct: 33, widthPx: 226, rotateDeg: 9, scaleY: -1 },
  { delayMs: 235, leftPct: 27, bottomPct: 38, widthPx: 236, rotateDeg: -4 },
  { delayMs: 365, leftPct: 28, bottomPct: 35, widthPx: 264, rotateDeg: 1 },
];

const ESTOCADA_ONOS_T1: readonly TshkOnoSpec[] = [
  { delayMs: 85, rightPct: 6, bottomPct: 49, widthPx: 112, rotateDeg: -8 },
];

const ESTOCADA_ONOS_T2: readonly TshkOnoSpec[] = [
  { delayMs: 75, rightPct: 12, bottomPct: 54, widthPx: 108, rotateDeg: -12 },
  { delayMs: 215, rightPct: 2.5, bottomPct: 43, widthPx: 120, rotateDeg: 8 },
];

const ESTOCADA_ONOS_T3: readonly TshkOnoSpec[] = [
  { delayMs: 70, rightPct: 13, bottomPct: 55, widthPx: 108, rotateDeg: -14 },
  { delayMs: 205, rightPct: 2, bottomPct: 46, widthPx: 116, rotateDeg: 10 },
  { delayMs: 405, rightPct: 5.5, bottomPct: 36, widthPx: 140, rotateDeg: -4 },
];

export const RoxanneSkillVfxOverlay: React.FC<RoxanneSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredRibbons, setTriggeredRibbons] = useState<number[]>([]);
  const [triggeredCharms, setTriggeredCharms] = useState<number[]>([]);
  const [triggeredThrusts, setTriggeredThrusts] = useState<number[]>([]);
  const [triggeredOnos, setTriggeredOnos] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'roxanne_inspiracion' ||
    skillType === 'roxanne_velada' ||
    skillType === 'roxanne_estocada';

  const activeRibbons: readonly MelodyRibbonSpec[] =
    tier === 3
      ? INSPIRACION_RIBBONS_T3
      : tier === 2
      ? INSPIRACION_RIBBONS_T2
      : INSPIRACION_RIBBONS_T1;

  const activeCharms: readonly CharmBurstSpec[] =
    tier === 3 ? VELADA_CHARMS_T3 : tier === 2 ? VELADA_CHARMS_T2 : VELADA_CHARMS_T1;

  const activeThrusts: readonly SonicThrustSpec[] =
    tier === 3 ? ESTOCADA_THRUSTS_T3 : tier === 2 ? ESTOCADA_THRUSTS_T2 : ESTOCADA_THRUSTS_T1;

  const activeOnos: readonly TshkOnoSpec[] =
    tier === 3 ? ESTOCADA_ONOS_T3 : tier === 2 ? ESTOCADA_ONOS_T2 : ESTOCADA_ONOS_T1;

  useEffect(() => {
    setTriggeredRibbons([]);
    setTriggeredCharms([]);
    setTriggeredThrusts([]);
    setTriggeredOnos([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'roxanne_inspiracion') {
      activeRibbons.forEach((r, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredRibbons((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, r.delayMs);
        timers.push(id);
      });
    } else if (skillType === 'roxanne_velada') {
      activeCharms.forEach((c, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredCharms((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, c.delayMs);
        timers.push(id);
      });
    } else if (skillType === 'roxanne_estocada') {
      activeThrusts.forEach((t, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredThrusts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, t.delayMs);
        timers.push(id);
      });
      activeOnos.forEach((o, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredOnos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, o.delayMs);
        timers.push(id);
      });
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Rose-Gold Lyric Rings, Hypnotic Charm Hearts & Sonic Rapier Sparks
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

    if (skillType === 'roxanne_inspiracion') {
      const palette = ['#f472b6', '#ec4899', '#fde047', '#fbcfe8'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 98,
          y: heroY + 48 + (Math.random() - 0.5) * 44,
          vx: (Math.random() - 0.5) * 1.15,
          vy: -(1.7 + Math.random() * (2.6 + tier * 0.5)),
          size: 2.2 + Math.random() * 2.9,
          life: -Math.random() * 12,
          maxLife: 28 + Math.random() * 16,
          color: palette[i % palette.length],
          trail: true,
          shape: i % 4 === 0 ? 'heart' : i % 2 === 0 ? 'star' : 'diamond',
        });
      }
    } else if (skillType === 'roxanne_velada') {
      const charmPalette = ['#f472b6', '#e879f9', '#fb7185', '#fde68a'];
      const count = Math.round(28 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.1 + Math.random() * (2.6 + tier * 0.6);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 66,
          y: enemyY + 8 + (Math.random() - 0.5) * 58,
          vx: Math.cos(angle) * speed * 0.6,
          vy: -(1.3 + Math.random() * 2.2) + Math.sin(angle) * 0.6,
          size: 2.4 + Math.random() * 3.1,
          life: -4 - Math.random() * 12,
          maxLife: 26 + Math.random() * 16,
          color: charmPalette[i % charmPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'heart' : i % 2 === 0 ? 'star' : 'circle',
        });
      }
    } else if (skillType === 'roxanne_estocada') {
      const sonicPalette = ['#f472b6', '#ec4899', '#fdf2f8', '#fde047'];
      const count = Math.round(32 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * 1.65;
        const speed = 4.2 + Math.random() * (6.2 + tier * 1.4);
        particles.push({
          x: enemyX - 18 + (Math.random() - 0.5) * 28,
          y: enemyY + (Math.random() - 0.5) * 52,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.65,
          size: 2.0 + Math.random() * 2.8,
          life: -3 - Math.random() * 14,
          maxLife: 18 + Math.random() * 13,
          color: sonicPalette[i % sonicPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'star' : 'diamond',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = tier === 3 ? 960 : 880;

    const drawFourPointStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r * 1.45 : r * 0.34;
        const a = (i * Math.PI) / 4;
        const sx = cx + Math.cos(a) * rad;
        const sy = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawMiniHeart = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      const topCurveHeight = r * 0.45;
      ctx.moveTo(cx, cy + topCurveHeight);
      ctx.bezierCurveTo(cx, cy, cx - r, cy, cx - r, cy + topCurveHeight);
      ctx.bezierCurveTo(cx - r, cy + r * 0.95, cx, cy + r * 1.25, cx, cy + r * 1.55);
      ctx.bezierCurveTo(cx, cy + r * 1.25, cx + r, cy + r * 0.95, cx + r, cy + topCurveHeight);
      ctx.bezierCurveTo(cx + r, cy, cx, cy, cx, cy + topCurveHeight);
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (skillType === 'roxanne_inspiracion') {
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
              24 + p * (62 + tier * 10),
              7 + p * (18 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(244, 114, 182, ${(1 - p) * 0.86})`
                : `rgba(253, 224, 71, ${(1 - p) * 0.76})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.42);
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'roxanne_velada') {
        if (progress > 0.08 && progress < 0.9) {
          const p = (progress - 0.08) / 0.82;
          const ringAlpha = Math.sin(p * Math.PI) * (0.78 + tier * 0.07);

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            28 + tier * 12 + p * 28,
            9 + tier * 3 + p * 9,
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(244, 114, 182, ${ringAlpha})`;
          ctx.lineWidth = 2.8;
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 16;
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            19 + tier * 8 + p * 18,
            6 + tier * 2 + p * 6,
            0,
            0,
            Math.PI * 2
          );
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = -p * 48;
          ctx.strokeStyle = `rgba(251, 207, 232, ${ringAlpha * 0.92})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.setLineDash([]);

          const grad = ctx.createRadialGradient(enemyX, enemyY, 4, enemyX, enemyY, 50 + tier * 14);
          grad.addColorStop(0, `rgba(251, 207, 232, ${ringAlpha * 0.56})`);
          grad.addColorStop(0.5, `rgba(236, 72, 153, ${ringAlpha * 0.38})`);
          grad.addColorStop(1, 'rgba(219, 39, 119, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX, enemyY, 50 + tier * 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (skillType === 'roxanne_estocada') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.08 + r * 0.14;
          const span = 0.54;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY,
              12 + p * (22 + tier * 5),
              22 + p * (48 + tier * 9),
              0.12 * (r % 2 === 0 ? 1 : -1),
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(244, 114, 182, ${(1 - p) * 0.88})`
                : `rgba(253, 242, 248, ${(1 - p) * 0.82})`;
            ctx.lineWidth = (3.1 - r * 0.4) * (1 - p * 0.45);
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 15;
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
        pt.x += pt.vx + (skillType === 'roxanne_estocada' ? 0 : Math.sin(pt.life * 0.24) * 0.55);
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
          ctx.lineWidth = pt.size * 0.58;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (pt.shape === 'heart') {
          drawMiniHeart(pt.x, pt.y - pt.size * 0.8, pt.size * 1.15);
        } else if (pt.shape === 'star') {
          drawFourPointStar(pt.x, pt.y, pt.size * 1.1);
        } else if (pt.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - pt.size * 1.25);
          ctx.lineTo(pt.x + pt.size * 0.95, pt.y);
          ctx.lineTo(pt.x, pt.y + pt.size * 1.25);
          ctx.lineTo(pt.x - pt.size * 0.95, pt.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 0.88, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [isActiveSkill, skillType, tier, vfxKey]);

  const ribbonFilter =
    tier === 3
      ? 'url(#roxanne-ribbon-t3-shader)'
      : tier === 2
      ? 'url(#roxanne-ribbon-t2-shader)'
      : 'url(#roxanne-ribbon-t1-shader)';

  const charmFilter =
    tier === 3
      ? 'url(#roxanne-charm-t3-shader)'
      : tier === 2
      ? 'url(#roxanne-charm-t2-shader)'
      : 'url(#roxanne-charm-t1-shader)';

  const thrustFilter =
    tier === 3
      ? 'url(#roxanne-thrust-t3-shader)'
      : tier === 2
      ? 'url(#roxanne-thrust-t2-shader)'
      : 'url(#roxanne-thrust-t1-shader)';

  return (
    <>
      {/* SVG Filters Permanentes para Shaders de Roxanne (Lira Rosada, Encanto y Estocada) */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. Cintas de Melodía Rosada / Oro (Inspiración Bárdica & Velada) */}
          <filter id="roxanne-ribbon-t1-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="alphaBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.82" result="pinkGlow" />
            <feComposite in="pinkGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-ribbon-t2-shader" x="-24%" y="-24%" width="148%" height="148%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.4" result="alphaBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.92" result="pinkGlow" />
            <feComposite in="pinkGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feColorMatrix in="SourceGraphic" type="saturate" values="1.18" result="richRibbon" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="richRibbon" />
            </feMerge>
          </filter>

          <filter id="roxanne-ribbon-t3-shader" x="-28%" y="-28%" width="156%" height="156%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="2" seed="14" result="waveNoise">
              <animate attributeName="baseFrequency" values="0.015 0.05; 0.032 0.095; 0.015 0.05" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="waveNoise" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="flutterRibbon" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="4.4" result="alphaBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.96" result="pinkGlow" />
            <feComposite in="pinkGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="flutterRibbon" />
            </feMerge>
          </filter>

          {/* 2. Velada Encantadora (Corazones Hipnóticos sobre el Enemigo) */}
          <filter id="roxanne-charm-t1-shader" x="-24%" y="-24%" width="148%" height="148%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.0" result="alphaBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.88" result="charmGlow" />
            <feComposite in="charmGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-charm-t2-shader" x="-28%" y="-28%" width="156%" height="156%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4.0" result="alphaBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.94" result="charmGlow" />
            <feComposite in="charmGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feColorMatrix in="SourceGraphic" type="saturate" values="1.22" result="vividCharm" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="vividCharm" />
            </feMerge>
          </filter>

          <filter id="roxanne-charm-t3-shader" x="-32%" y="-32%" width="164%" height="164%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.045" numOctaves="2" seed="29" result="hypnoNoise">
              <animate attributeName="baseFrequency" values="0.018 0.04; 0.036 0.085; 0.018 0.04" dur="0.36s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="hypnoNoise" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="shimmerCharm" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="5.2" result="alphaBlur" />
            <feFlood floodColor="#db2777" floodOpacity="0.98" result="charmGlow" />
            <feComposite in="charmGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="shimmerCharm" />
            </feMerge>
          </filter>

          {/* 3. Estocada Sonora (Rapier Sónico Perforante) */}
          <filter id="roxanne-thrust-t1-shader" x="-18%" y="-26%" width="136%" height="152%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="alphaBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.88" result="sonicGlow" />
            <feComposite in="sonicGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-thrust-t2-shader" x="-22%" y="-30%" width="144%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.6" result="alphaBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.94" result="sonicGlow" />
            <feComposite in="sonicGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feColorMatrix in="SourceGraphic" type="saturate" values="1.2" result="richThrust" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="richThrust" />
            </feMerge>
          </filter>

          <filter id="roxanne-thrust-t3-shader" x="-26%" y="-34%" width="152%" height="168%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.08" numOctaves="2" seed="41" result="sonicNoise">
              <animate attributeName="baseFrequency" values="0.02 0.08; 0.045 0.14; 0.02 0.08" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="sonicNoise" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="vibrantThrust" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="4.8" result="alphaBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.98" result="sonicGlow" />
            <feComposite in="sonicGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="vibrantThrust" />
            </feMerge>
          </filter>

          {/* 4. Shaders directamente sobre el Sprite de Roxanne */}
          <filter id="roxanne-inspiracion-hero-shader" x="-18%" y="-18%" width="136%" height="136%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="3.6" result="glowBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.88" result="pinkFlood" />
            <feComposite in="pinkFlood" in2="glowBlur" operator="in" result="pinkAura" />
            <feMerge>
              <feMergeNode in="pinkAura" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-velada-hero-shader" x="-18%" y="-18%" width="136%" height="136%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="3.8" result="glowBlur" />
            <feFlood floodColor="#e879f9" floodOpacity="0.9" result="veladaFlood" />
            <feComposite in="veladaFlood" in2="glowBlur" operator="in" result="veladaAura" />
            <feMerge>
              <feMergeNode in="veladaAura" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-estocada-hero-shader-t1" x="-16%" y="-16%" width="132%" height="132%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.0" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="3.0" result="glowBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.85" result="estocadaFlood" />
            <feComposite in="estocadaFlood" in2="glowBlur" operator="in" result="estocadaAura" />
            <feMerge>
              <feMergeNode in="estocadaAura" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-estocada-hero-shader-t2" x="-18%" y="-18%" width="136%" height="136%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="3.6" result="glowBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.92" result="estocadaFlood" />
            <feComposite in="estocadaFlood" in2="glowBlur" operator="in" result="estocadaAura" />
            <feMerge>
              <feMergeNode in="estocadaAura" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-estocada-hero-shader-t3" x="-22%" y="-22%" width="144%" height="144%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feGaussianBlur in="dilated" stdDeviation="4.4" result="glowBlur" />
            <feFlood floodColor="#fde047" floodOpacity="0.96" result="goldFlood" />
            <feComposite in="goldFlood" in2="glowBlur" operator="in" result="goldRim" />
            <feMerge>
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="roxanne-pink-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.12" numOctaves="2" seed="18" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.018 0.1; 0.04 0.19; 0.018 0.1" dur="0.32s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fbcfe8" floodOpacity="0.94" result="pinkFlood" />
            <feComposite in="pinkFlood" in2="rippledRim" operator="in" result="pinkRim" />
            <feGaussianBlur in="pinkRim" stdDeviation="1.6" result="pinkBloom" />
            <feMerge>
              <feMergeNode in="pinkBloom" />
              <feMergeNode in="pinkRim" />
            </feMerge>
          </filter>

          <filter id="roxanne-tshk-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="alphaBlur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.92" result="pinkGlow" />
            <feComposite in="pinkGlow" in2="alphaBlur" operator="in" result="outerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`roxanne-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            @keyframes roxanneRibbonSweep {
              0% {
                transform: translate(-10px, 16px) scale(0.55) rotate(-8deg);
                opacity: 0;
              }
              24% {
                transform: translate(6px, -6px) scale(1.08) rotate(2deg);
                opacity: 1;
              }
              74% {
                transform: translate(16px, -18px) scale(1.02) rotate(5deg);
                opacity: 0.94;
              }
              100% {
                transform: translate(26px, -30px) scale(1.12) rotate(8deg);
                opacity: 0;
              }
            }

            @keyframes roxanneMelodyFly {
              0% {
                transform: translate(0px, 6px) scale(0.52) rotate(-10deg);
                opacity: 0;
              }
              20% {
                transform: translate(45px, -8px) scale(1.02) rotate(-2deg);
                opacity: 1;
              }
              76% {
                transform: translate(185px, -4px) scale(1.06) rotate(4deg);
                opacity: 0.95;
              }
              100% {
                transform: translate(225px, -12px) scale(0.84) rotate(8deg);
                opacity: 0;
              }
            }

            @keyframes roxanneCharmPop {
              0% {
                transform: scale(0.28) rotate(-12deg);
                opacity: 0;
              }
              24% {
                transform: scale(1.16) rotate(4deg);
                opacity: 1;
              }
              58% {
                transform: scale(0.98) rotate(-2deg);
                opacity: 0.96;
              }
              100% {
                transform: scale(1.14) rotate(5deg);
                opacity: 0;
              }
            }

            @keyframes roxanneSonicThrust {
              0% {
                transform: translateX(-28px) scaleX(0.24) scaleY(0.76);
                opacity: 0;
              }
              18% {
                transform: translateX(18px) scaleX(1.06) scaleY(1.08);
                opacity: 1;
              }
              62% {
                transform: translateX(30px) scaleX(1.02) scaleY(0.98);
                opacity: 0.96;
              }
              100% {
                transform: translateX(46px) scaleX(0.94) scaleY(0.42);
                opacity: 0;
              }
            }

            /* AURA DE APOYO (Inspiración Bárdica / Velada Encantadora) */
            @keyframes roxanneAuraPillarBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              22% { transform: scaleX(1.06) scaleY(1.04); opacity: 0.95; }
              58% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.85; }
              100% { transform: scaleX(1.18) scaleY(1.1); opacity: 0; }
            }

            @keyframes roxanneAuraFeel {
              0%, 100% { opacity: 0.75; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.04); }
            }

            @keyframes roxanneTshkPop {
              0% {
                transform: scale(0.24) rotate(-14deg);
                opacity: 0;
              }
              24% {
                transform: scale(1.18) rotate(3deg);
                opacity: 1;
              }
              46% {
                transform: scale(0.95) rotate(-2deg);
                opacity: 1;
              }
              78% {
                transform: scale(1.02) rotate(1deg);
                opacity: 0.94;
              }
              100% {
                transform: scale(1.12) rotate(4deg);
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
          {/* 0. AURA DE APOYO: Inspiración Bárdica / Velada Encantadora        */}
          {/*    (rosa para inspirar, magenta encantador; más intensa por tier) */}
          {/* ================================================================= */}
          {(skillType === 'roxanne_inspiracion' || skillType === 'roxanne_velada') && (
            <div
              className="absolute left-[3.5%] bottom-[3%] w-[212px] h-[296px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[roxanneAuraPillarBloom_0.98s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full animate-[roxanneAuraFeel_1.6s_ease-in-out_infinite]"
                style={{
                  background:
                    skillType === 'roxanne_velada'
                      ? tier === 3
                        ? 'radial-gradient(ellipse at 50% 62%, rgba(253,224,241,0.6) 0%, rgba(232,121,199,0.4) 36%, rgba(192,38,211,0.16) 64%, transparent 80%)'
                        : tier === 2
                        ? 'radial-gradient(ellipse at 50% 62%, rgba(253,224,241,0.46) 0%, rgba(232,121,199,0.3) 36%, rgba(192,38,211,0.11) 62%, transparent 78%)'
                        : 'radial-gradient(ellipse at 50% 64%, rgba(232,121,199,0.36) 0%, rgba(192,38,211,0.18) 40%, transparent 74%)'
                      : tier === 3
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(255,228,238,0.62) 0%, rgba(244,114,182,0.42) 36%, rgba(219,39,119,0.16) 64%, transparent 80%)'
                      : tier === 2
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(255,228,238,0.48) 0%, rgba(244,114,182,0.3) 36%, rgba(219,39,119,0.11) 62%, transparent 78%)'
                      : 'radial-gradient(ellipse at 50% 64%, rgba(244,114,182,0.36) 0%, rgba(219,39,119,0.18) 40%, transparent 74%)',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. INSPIRACIÓN BÁRDICA (roxanne_inspiracion)                       */}
          {/* ================================================================= */}
          {skillType === 'roxanne_inspiracion' && (
            <>
              {triggeredRibbons.map((rbIdx) => {
                const rb = activeRibbons[rbIdx];
                if (!rb) return null;
                return (
                  <div
                    key={`roxanne-ribbon-${vfxKey}-${rbIdx}`}
                    className="absolute pointer-events-none z-20 overflow-visible"
                    style={{
                      left: `${rb.leftPct}%`,
                      bottom: `${rb.bottomPct}%`,
                      width: `${rb.widthPx}px`,
                      height: `${Math.round(rb.widthPx * 0.62)}px`,
                      transform: `rotate(${rb.rotateDeg}deg) scaleX(${rb.scaleX ?? 1})`,
                    }}
                  >
                    <img
                      src="/assets/combat/roxanne_vfx_melodia.png"
                      alt="Inspiración Bárdica"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[roxanneRibbonSweep_0.74s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                      style={{ filter: ribbonFilter }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 2. VELADA ENCANTADORA (roxanne_velada)                            */}
          {/* ================================================================= */}
          {skillType === 'roxanne_velada' && (
            <>
              <div
                className="absolute left-[18%] bottom-[38%] w-[166px] h-[104px] pointer-events-none z-20 overflow-visible"
              >
                <img
                  src="/assets/combat/roxanne_vfx_melodia.png"
                  alt="Onda Encantadora"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[roxanneMelodyFly_0.48s_cubic-bezier(0.2,0.85,0.3,1)_forwards]"
                  style={{ filter: ribbonFilter }}
                />
              </div>

              {triggeredCharms.map((chIdx) => {
                const ch = activeCharms[chIdx];
                if (!ch) return null;
                return (
                  <div
                    key={`roxanne-charm-${vfxKey}-${chIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${ch.rightPct}%`,
                      bottom: `${ch.bottomPct}%`,
                      width: `${ch.sizePx}px`,
                      height: `${ch.sizePx}px`,
                      transform: `rotate(${ch.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src="/assets/combat/roxanne_vfx_encanto.png"
                      alt="Velada Encantadora"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[roxanneCharmPop_0.54s_cubic-bezier(0.22,1.25,0.36,1)_forwards]"
                      style={{ filter: charmFilter }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 3. ESTOCADA SONORA (roxanne_estocada)                             */}
          {/* ================================================================= */}
          {skillType === 'roxanne_estocada' && (
            <>
              {triggeredThrusts.map((thIdx) => {
                const th = activeThrusts[thIdx];
                if (!th) return null;
                return (
                  <div
                    key={`roxanne-thrust-${vfxKey}-${thIdx}`}
                    className="absolute pointer-events-none z-20 overflow-visible origin-left"
                    style={{
                      left: `${th.leftPct}%`,
                      bottom: `${th.bottomPct}%`,
                      width: `${th.widthPx}px`,
                      height: `${Math.round(th.widthPx * 0.4)}px`,
                      transform: `rotate(${th.rotateDeg}deg) scaleY(${th.scaleY ?? 1})`,
                    }}
                  >
                    <img
                      src="/assets/combat/roxanne_vfx_estocada.png"
                      alt="Estocada Sonora"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[roxanneSonicThrust_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                      style={{ filter: thrustFilter }}
                    />
                  </div>
                );
              })}

              {triggeredOnos.map((onoIdx) => {
                const ono = activeOnos[onoIdx];
                if (!ono) return null;
                return (
                  <div
                    key={`roxanne-tshk-${vfxKey}-${onoIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-[24] overflow-visible"
                    style={{
                      right: `${ono.rightPct}%`,
                      bottom: `${ono.bottomPct}%`,
                      width: `${ono.widthPx}px`,
                      height: `${Math.round(ono.widthPx * 0.56)}px`,
                      transform: `rotate(${ono.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src="/assets/combat/roxanne_vfx_tshk.png"
                      alt="¡TSHK!"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[roxanneTshkPop_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#roxanne-tshk-shader)' }}
                    />
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
