import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface RaxxarSkillVfxOverlayProps {
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

interface CrimsonSlashSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  flipX?: boolean;
  flipY?: boolean;
}

interface BloodBoltSpec {
  delayMs: number;
  startLeftPct: number;
  startBottomPct: number;
  angleDeg: number;
  widthPx: number;
  heightPx: number;
}

interface BoltOnoSpec {
  delayMs: number;
  src: string;
  alt: string;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

interface ImpactBurstSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  sizePx: number;
  rotateDeg: number;
}

interface SlashOnoSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

const ESPADA_SLASHES_T1: readonly CrimsonSlashSpec[] = [
  { delayMs: 0, rightPct: 6, bottomPct: 21, widthPx: 174, rotateDeg: -14 },
];

const ESPADA_SLASHES_T2: readonly CrimsonSlashSpec[] = [
  { delayMs: 0, rightPct: 8, bottomPct: 24, widthPx: 172, rotateDeg: -22 },
  { delayMs: 130, rightPct: 5, bottomPct: 19, widthPx: 184, rotateDeg: 24, flipX: true },
];

const ESPADA_SLASHES_T3: readonly CrimsonSlashSpec[] = [
  { delayMs: 0, rightPct: 8.5, bottomPct: 26, widthPx: 170, rotateDeg: -28 },
  { delayMs: 95, rightPct: 5.5, bottomPct: 23, widthPx: 176, rotateDeg: 28, flipX: true },
  { delayMs: 190, rightPct: 8, bottomPct: 17, widthPx: 182, rotateDeg: -8, flipY: true },
  { delayMs: 300, rightPct: 4.5, bottomPct: 20, widthPx: 206, rotateDeg: 14 },
];

const ESPADA_ONOS_T1: readonly SlashOnoSpec[] = [
  { delayMs: 55, rightPct: 7, bottomPct: 50, widthPx: 110, rotateDeg: -10 },
];

const ESPADA_ONOS_T2: readonly SlashOnoSpec[] = [
  { delayMs: 45, rightPct: 13, bottomPct: 55, widthPx: 108, rotateDeg: -14 },
  { delayMs: 175, rightPct: 3, bottomPct: 44, widthPx: 120, rotateDeg: 9 },
];

const ESPADA_ONOS_T3: readonly SlashOnoSpec[] = [
  { delayMs: 40, rightPct: 14, bottomPct: 56, widthPx: 108, rotateDeg: -15 },
  { delayMs: 165, rightPct: 2, bottomPct: 47, widthPx: 116, rotateDeg: 11 },
  { delayMs: 330, rightPct: 5.5, bottomPct: 37, widthPx: 142, rotateDeg: -4 },
];

const BLOOD_BOLTS_T1: readonly BloodBoltSpec[] = [
  { delayMs: 15, startLeftPct: 24, startBottomPct: 44, angleDeg: 2, widthPx: 248, heightPx: 68 },
];

const BLOOD_BOLTS_T2: readonly BloodBoltSpec[] = [
  { delayMs: 10, startLeftPct: 24, startBottomPct: 47, angleDeg: -2, widthPx: 244, heightPx: 64 },
  { delayMs: 165, startLeftPct: 24, startBottomPct: 41, angleDeg: 4, widthPx: 254, heightPx: 72 },
];

const BLOOD_BOLTS_T3: readonly BloodBoltSpec[] = [
  { delayMs: 10, startLeftPct: 24, startBottomPct: 48, angleDeg: -4, widthPx: 242, heightPx: 64 },
  { delayMs: 135, startLeftPct: 24, startBottomPct: 42, angleDeg: 4, widthPx: 248, heightPx: 68 },
  { delayMs: 265, startLeftPct: 23.5, startBottomPct: 43, angleDeg: 0, widthPx: 268, heightPx: 82 },
];

const BOLT_ONOS_T1: readonly BoltOnoSpec[] = [
  {
    delayMs: 70,
    src: '/assets/combat/raxxar_vfx_zap.png',
    alt: '¡ZAP!',
    rightPct: 6,
    bottomPct: 49,
    widthPx: 118,
    rotateDeg: -8,
  },
];

const BOLT_ONOS_T2: readonly BoltOnoSpec[] = [
  {
    delayMs: 65,
    src: '/assets/combat/raxxar_vfx_zap.png',
    alt: '¡ZAP!',
    rightPct: 12.5,
    bottomPct: 55,
    widthPx: 112,
    rotateDeg: -12,
  },
  {
    delayMs: 215,
    src: '/assets/combat/raxxar_vfx_zzzt.png',
    alt: '¡ZZZT!',
    rightPct: 2.5,
    bottomPct: 43,
    widthPx: 128,
    rotateDeg: 8,
  },
];

const BOLT_ONOS_T3: readonly BoltOnoSpec[] = [
  {
    delayMs: 60,
    src: '/assets/combat/raxxar_vfx_zap.png',
    alt: '¡ZAP!',
    rightPct: 14,
    bottomPct: 57,
    widthPx: 108,
    rotateDeg: -14,
  },
  {
    delayMs: 185,
    src: '/assets/combat/raxxar_vfx_zzzt.png',
    alt: '¡ZZZT!',
    rightPct: 2,
    bottomPct: 47,
    widthPx: 124,
    rotateDeg: 10,
  },
  {
    delayMs: 315,
    src: '/assets/combat/raxxar_vfx_tzzzk.png',
    alt: '¡TZZZK!',
    rightPct: 5.5,
    bottomPct: 36,
    widthPx: 148,
    rotateDeg: -4,
  },
];

const BOLT_IMPACTS_T1: readonly ImpactBurstSpec[] = [
  { delayMs: 65, rightPct: 6.5, bottomPct: 26, sizePx: 142, rotateDeg: -8 },
];

const BOLT_IMPACTS_T2: readonly ImpactBurstSpec[] = [
  { delayMs: 60, rightPct: 8.5, bottomPct: 30, sizePx: 134, rotateDeg: -14 },
  { delayMs: 210, rightPct: 5, bottomPct: 23, sizePx: 152, rotateDeg: 12 },
];

const BOLT_IMPACTS_T3: readonly ImpactBurstSpec[] = [
  { delayMs: 55, rightPct: 9.5, bottomPct: 32, sizePx: 132, rotateDeg: -18 },
  { delayMs: 180, rightPct: 5.5, bottomPct: 25, sizePx: 146, rotateDeg: 14 },
  { delayMs: 310, rightPct: 6.5, bottomPct: 22, sizePx: 176, rotateDeg: -4 },
];

export const RaxxarSkillVfxOverlay: React.FC<RaxxarSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredSlashes, setTriggeredSlashes] = useState<number[]>([]);
  const [triggeredOnos, setTriggeredOnos] = useState<number[]>([]);
  const [triggeredBolts, setTriggeredBolts] = useState<number[]>([]);
  const [triggeredBoltOnos, setTriggeredBoltOnos] = useState<number[]>([]);
  const [triggeredImpacts, setTriggeredImpacts] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'raxxar_espada' ||
    skillType === 'raxxar_escudo' ||
    skillType === 'raxxar_lanza';

  const activeSlashes: readonly CrimsonSlashSpec[] =
    tier === 3 ? ESPADA_SLASHES_T3 : tier === 2 ? ESPADA_SLASHES_T2 : ESPADA_SLASHES_T1;

  const activeOnos: readonly SlashOnoSpec[] =
    tier === 3 ? ESPADA_ONOS_T3 : tier === 2 ? ESPADA_ONOS_T2 : ESPADA_ONOS_T1;

  const activeBolts: readonly BloodBoltSpec[] =
    tier === 3 ? BLOOD_BOLTS_T3 : tier === 2 ? BLOOD_BOLTS_T2 : BLOOD_BOLTS_T1;

  const activeBoltOnos: readonly BoltOnoSpec[] =
    tier === 3 ? BOLT_ONOS_T3 : tier === 2 ? BOLT_ONOS_T2 : BOLT_ONOS_T1;

  const activeImpacts: readonly ImpactBurstSpec[] =
    tier === 3 ? BOLT_IMPACTS_T3 : tier === 2 ? BOLT_IMPACTS_T2 : BOLT_IMPACTS_T1;

  useEffect(() => {
    setTriggeredSlashes([]);
    setTriggeredOnos([]);
    setTriggeredBolts([]);
    setTriggeredBoltOnos([]);
    setTriggeredImpacts([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'raxxar_espada') {
      activeSlashes.forEach((s, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredSlashes((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, s.delayMs);
        timers.push(id);
      });
      activeOnos.forEach((o, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredOnos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, o.delayMs);
        timers.push(id);
      });
    } else if (skillType === 'raxxar_lanza') {
      activeBolts.forEach((b, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBolts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, b.delayMs);
        timers.push(id);
      });
      activeBoltOnos.forEach((o, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBoltOnos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, o.delayMs);
        timers.push(id);
      });
      activeImpacts.forEach((imp, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredImpacts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, imp.delayMs);
        timers.push(id);
      });
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Runic Crimson Shockwaves, Blood Sparks & Riot Shield Pulse
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

    const heroX = width * 0.235;
    const heroY = height * 0.62;
    const { enemyX, enemyY } = resolveEnemyVfxFrame(enemyFrame, width, height);

    const particles: CanvasParticle[] = [];
    const countMult = tier === 3 ? 1.65 : tier === 2 ? 1.25 : 0.9;

    if (skillType === 'raxxar_espada') {
      const palette = ['#ef4444', '#dc2626', '#fbbf24', '#fecaca'];
      const count = Math.round(28 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.5;
        const speed = 2.6 + Math.random() * (4.8 + tier * 1.1);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 44,
          y: enemyY + (Math.random() - 0.5) * 44,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          size: 2.0 + Math.random() * 2.8,
          life: -Math.random() * 14,
          maxLife: 20 + Math.random() * 14,
          color: palette[i % palette.length],
          trail: true,
          shape: i % 2 === 0 ? 'spark' : 'diamond',
          gravity: 0.14,
        });
      }
    } else if (skillType === 'raxxar_escudo') {
      const shieldPalette = ['#ef4444', '#fbbf24', '#f87171', '#fde68a'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 94,
          y: heroY + 42 + (Math.random() - 0.5) * 44,
          vx: (Math.random() - 0.5) * 1.1,
          vy: -(1.7 + Math.random() * (2.6 + tier * 0.5)),
          size: 2.1 + Math.random() * 2.9,
          life: -Math.random() * 12,
          maxLife: 26 + Math.random() * 16,
          color: shieldPalette[i % shieldPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'spark',
        });
      }
    } else if (skillType === 'raxxar_lanza') {
      const spearPalette = ['#dc2626', '#ef4444', '#fca5a5', '#f59e0b'];
      const count = Math.round(30 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * (5.0 + tier * 1.0);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 34,
          y: enemyY + (Math.random() - 0.5) * 38,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          size: 2.2 + Math.random() * 2.9,
          life: -7 - Math.random() * 14,
          maxLife: 22 + Math.random() * 14,
          color: spearPalette[i % spearPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'spark' : 'circle',
          gravity: 0.16,
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 960;

    const drawHexagon = (cx: number, cy: number, radius: number, rotationRad: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = rotationRad + (i * Math.PI) / 3;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (skillType === 'raxxar_espada') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.05 + r * 0.14;
          const span = 0.48;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 46,
              26 + p * (58 + tier * 10),
              9 + p * (19 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(239, 68, 68, ${(1 - p) * 0.85})`
                : `rgba(251, 191, 36, ${(1 - p) * 0.72})`;
            ctx.lineWidth = (3.2 - r * 0.4) * (1 - p * 0.4);
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'raxxar_escudo') {
        const floorRings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < floorRings; r++) {
          const start = 0.04 + r * 0.13;
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
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(239, 68, 68, ${(1 - p) * 0.84})`
                : `rgba(251, 191, 36, ${(1 - p) * 0.74})`;
            ctx.lineWidth = (3.0 - r * 0.35) * (1 - p * 0.42);
            ctx.shadowColor = r % 2 === 0 ? '#ef4444' : '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (progress > 0.05 && progress < 0.88) {
          const p = (progress - 0.05) / 0.83;
          const hexAlpha = Math.sin(p * Math.PI) * (0.6 + tier * 0.12);
          const hexRadius = 46 + Math.sin(p * Math.PI * 0.8) * (18 + tier * 5);

          ctx.save();
          drawHexagon(heroX, heroY - 10, hexRadius, p * 0.45);
          ctx.strokeStyle = `rgba(239, 68, 68, ${hexAlpha})`;
          ctx.lineWidth = tier === 3 ? 3.2 : 2.3;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 16;
          ctx.stroke();

          if (tier >= 2) {
            drawHexagon(heroX, heroY - 10, hexRadius * 0.72, -p * 0.55);
            ctx.strokeStyle = `rgba(251, 191, 36, ${hexAlpha * 0.82})`;
            ctx.lineWidth = 1.9;
            ctx.shadowColor = '#f59e0b';
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (skillType === 'raxxar_lanza') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.14 + r * 0.12;
          const span = 0.46;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 46,
              24 + p * (56 + tier * 10),
              8 + p * (18 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(220, 38, 38, ${(1 - p) * 0.88})`
                : `rgba(252, 165, 165, ${(1 - p) * 0.75})`;
            ctx.lineWidth = (3.2 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#ef4444';
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
          const r = pt.size * 0.9;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.3);
          ctx.lineTo(pt.x + r * 0.76, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.3);
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

  const slashFilter =
    tier === 3
      ? 'url(#raxxar-slash-t3-shader)'
      : tier === 2
      ? 'url(#raxxar-slash-t2-shader)'
      : 'url(#raxxar-slash-t1-shader)';

  const spearFilter =
    tier === 3
      ? 'url(#raxxar-spear-t3-shader)'
      : tier === 2
      ? 'url(#raxxar-spear-t2-shader)'
      : 'url(#raxxar-spear-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. TAJO DE ESPADA RÚNICA (Crimson Slash Arcs + Crimson Comic SLASH!) */}
          <filter id="raxxar-slash-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#dc2626" floodOpacity="0.94" result="crimsonGlow" />
            <feMerge>
              <feMergeNode in="crimsonGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-slash-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.08" numOctaves="1" seed="6" result="bloodNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.048 0.13; 0.02 0.065" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="bloodNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingSlash" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.6" floodColor="#dc2626" floodOpacity="0.96" result="crimsonGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fca5a5" floodOpacity="0.88" result="hotRim" />
            <feMerge>
              <feMergeNode in="crimsonGlow" />
              <feMergeNode in="hotRim" />
              <feMergeNode in="livingSlash" />
            </feMerge>
          </filter>

          <filter id="raxxar-slash-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.095" numOctaves="2" seed="13" result="bloodNoise">
              <animate attributeName="baseFrequency" values="0.024 0.08; 0.06 0.16; 0.024 0.08" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="bloodNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="livingSlash" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.6" floodColor="#b91c1c" floodOpacity="0.98" result="bloodCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fde047" floodOpacity="0.82" result="goldRim" />
            <feMerge>
              <feMergeNode in="bloodCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="livingSlash" />
            </feMerge>
          </filter>

          <filter id="raxxar-crimson-slash-text-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.25 1.05 0.1  0 0
                      0.18 0.16 0.2  0 0
                      0.15 0.12 0.22 0 0
                      0    0    0    1 0"
              result="crimsonText"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#ef4444" floodOpacity="0.92" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="crimsonText" />
            </feMerge>
          </filter>

          {/* 3. RAYOS DE MAGIA SANGRIENTA (Blood Lightning Bolts + ¡ZAP!/¡ZZZT!/¡TZZZK!) */}
          <filter id="raxxar-spear-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.0" floodColor="#dc2626" floodOpacity="0.96" result="bloodGlow" />
            <feMerge>
              <feMergeNode in="bloodGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-spear-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#ef4444" floodOpacity="0.98" result="bloodGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#fecaca" floodOpacity="0.9" result="coralRim" />
            <feMerge>
              <feMergeNode in="bloodGlow" />
              <feMergeNode in="coralRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-spear-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.08" numOctaves="2" seed="33" result="boltNoise">
              <animate attributeName="baseFrequency" values="0.02 0.07; 0.05 0.14; 0.02 0.07" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="boltNoise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="cracklingBolt" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.8" floodColor="#b91c1c" floodOpacity="0.98" result="bloodCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fde047" floodOpacity="0.88" result="goldRim" />
            <feMerge>
              <feMergeNode in="bloodCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="cracklingBolt" />
            </feMerge>
          </filter>

          <filter id="raxxar-bolt-ono-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#ef4444" floodOpacity="0.96" result="bloodGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#fef2f2" floodOpacity="0.82" result="hotEdge" />
            <feMerge>
              <feMergeNode in="bloodGlow" />
              <feMergeNode in="hotEdge" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-impact-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#dc2626" floodOpacity="0.96" result="crimsonGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef2f2" floodOpacity="0.92" result="hotCore" />
            <feMerge>
              <feMergeNode in="crimsonGlow" />
              <feMergeNode in="hotCore" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-crimson-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.65 0.55 0.35 0 0.25
                      0.55 0.85 0.35 0 0.08
                      0.35 0.25 0.65 0 0.05
                      0    0    0    0.92 0"
              result="hotCrimson"
            />
            <feGaussianBlur in="hotCrimson" stdDeviation="1.9" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotCrimson" />
            </feMerge>
          </filter>

          {/* SHADERS DEL SPRITE DE RAXXAR */}
          <filter id="raxxar-crimson-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.075" numOctaves="2" seed="7" result="bloodNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.048 0.13; 0.02 0.06" dur="0.32s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="bloodNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#dc2626" floodOpacity="0.94" result="crimsonColor" />
            <feComposite in="crimsonColor" in2="wavyAura" operator="in" result="crimsonAura" />
            <feGaussianBlur in="crimsonAura" stdDeviation="3.4" result="crimsonCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fca5a5" floodOpacity="0.82" result="hotRim" />
            <feMerge>
              <feMergeNode in="crimsonCorona" />
              <feMergeNode in="hotRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-crimson-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.085" numOctaves="2" seed="12" result="bloodNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.056 0.145; 0.024 0.07" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="bloodNoise" scale="5.4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#ef4444" floodOpacity="0.96" result="crimsonColor" />
            <feComposite in="crimsonColor" in2="wavyAura" operator="in" result="crimsonAura" />
            <feGaussianBlur in="crimsonAura" stdDeviation="4.6" result="crimsonCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fecaca" floodOpacity="0.88" result="hotRim" />
            <feMerge>
              <feMergeNode in="crimsonCorona" />
              <feMergeNode in="hotRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-crimson-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.036 0.095" numOctaves="3" seed="19" result="bloodNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.068 0.17; 0.028 0.08" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="bloodNoise" scale="6.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#b91c1c" floodOpacity="1" result="deepBlood" />
            <feComposite in="deepBlood" in2="wavyAura" operator="in" result="bloodAura" />
            <feGaussianBlur in="bloodAura" stdDeviation="6.2" result="outerCorona" />
            <feFlood floodColor="#fde047" floodOpacity="0.92" result="runeGold" />
            <feComposite in="runeGold" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.5" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-shield-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.024 0.075" numOctaves="2" seed="22" result="wardNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.05 0.135; 0.02 0.065" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="wardNoise" scale="4.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#dc2626" floodOpacity="0.94" result="crimsonColor" />
            <feComposite in="crimsonColor" in2="wavyAura" operator="in" result="crimsonAura" />
            <feGaussianBlur in="crimsonAura" stdDeviation="4.4" result="crimsonCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fbbf24" floodOpacity="0.88" result="bronzeRim" />
            <feMerge>
              <feMergeNode in="crimsonCorona" />
              <feMergeNode in="bronzeRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-shield-armed-shader" x="-22%" y="-22%" width="144%" height="144%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="dilated" />
            <feFlood floodColor="#dc2626" floodOpacity="0.72" result="wardColor" />
            <feComposite in="wardColor" in2="dilated" operator="in" result="wardRim" />
            <feGaussianBlur in="wardRim" stdDeviation="2.6" result="wardGlow" />
            <feMerge>
              <feMergeNode in="wardGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="raxxar-crimson-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="27" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fca5a5" floodOpacity="0.96" result="coralFlood" />
            <feComposite in="coralFlood" in2="rippledRim" operator="in" result="coralRim" />
            <feGaussianBlur in="coralRim" stdDeviation="1.6" result="coralBloom" />
            <feMerge>
              <feMergeNode in="coralBloom" />
              <feMergeNode in="coralRim" />
            </feMerge>
          </filter>

          <filter id="raxxar-bronze-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="31" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fde68a" floodOpacity="0.96" result="goldFlood" />
            <feComposite in="goldFlood" in2="rippledRim" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldBloom" />
            <feMerge>
              <feMergeNode in="goldBloom" />
              <feMergeNode in="goldRim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`raxxar-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. TAJO DE ESPADA RÚNICA: Tajos curvos carmesí escalonados sin recortes */
            @keyframes raxxarCrimsonSlashSlice {
              0% {
                transform: translateX(-22px) scale(0.45) rotate(-8deg);
                opacity: 0;
              }
              24% {
                transform: translateX(4px) scale(1.08) rotate(2deg);
                opacity: 1;
              }
              64% {
                transform: translateX(10px) scale(1.02) rotate(5deg);
                opacity: 0.94;
              }
              100% {
                transform: translateX(18px) scale(1.1) rotate(9deg);
                opacity: 0;
              }
            }

            @keyframes raxxarSlashOnoPop {
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

            /* 3. RAYOS DE MAGIA SANGRIENTA: Disparo eléctrico instantáneo desde el dedo */
            @keyframes raxxarBloodBoltSnap {
              0% {
                transform: scaleX(0.14) scaleY(0.5);
                opacity: 0;
              }
              14% {
                transform: scaleX(1.06) scaleY(1.16);
                opacity: 1;
              }
              36% {
                transform: scaleX(0.98) scaleY(0.9);
                opacity: 0.96;
              }
              58% {
                transform: scaleX(1.03) scaleY(1.08);
                opacity: 1;
              }
              82% {
                transform: scaleX(1.0) scaleY(0.84);
                opacity: 0.78;
              }
              100% {
                transform: scaleX(0.94) scaleY(0.28);
                opacity: 0;
              }
            }

            @keyframes raxxarImpactBurstPop {
              0% {
                transform: scale(0.32) rotate(-10deg);
                opacity: 0;
              }
              22% {
                transform: scale(1.16) rotate(4deg);
                opacity: 1;
              }
              58% {
                transform: scale(1.0) rotate(8deg);
                opacity: 0.92;
              }
              100% {
                transform: scale(1.18) rotate(14deg);
                opacity: 0;
              }
            }

            @keyframes raxxarEnergySweep {
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
                -webkit-mask-position: -35% 0%;
                mask-position: -35% 0%;
              }
            }

            @keyframes raxxarShieldAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.05); opacity: 0.92; }
              64% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.82; }
              100% { transform: scaleX(1.16) scaleY(1.06); opacity: 0; }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Halo protector de Escudo Carmesí sólo al activar Escudo Antidisturbios */}
          {skillType === 'raxxar_escudo' && (
            <div
              className="absolute left-[4%] bottom-[4%] w-[210px] h-[292px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[raxxarShieldAuraBloom_0.94s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 60%, rgba(254,202,202,0.44) 0%, rgba(220,38,38,0.32) 44%, rgba(245,158,11,0.14) 68%, transparent 78%)',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. TAJO DE ESPADA RÚNICA (raxxar_espada)                          */}
          {/* ================================================================= */}
          {skillType === 'raxxar_espada' && (
            <>
              {triggeredSlashes.map((idx) => {
                const s = activeSlashes[idx];
                if (!s) return null;
                return (
                  <div
                    key={`raxxar-tajo-${vfxKey}-${idx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${s.rightPct}%`,
                      bottom: `${s.bottomPct}%`,
                      width: `${s.widthPx}px`,
                      height: `${Math.round(s.widthPx * 0.72)}px`,
                      transform: `rotate(${s.rotateDeg}deg) ${s.flipX ? 'scaleX(-1)' : ''} ${
                        s.flipY ? 'scaleY(-1)' : ''
                      }`,
                    }}
                  >
                    <div
                      className="relative w-full h-full overflow-visible"
                      style={{
                        animation: 'raxxarCrimsonSlashSlice 0.44s cubic-bezier(0.16,1,0.3,1) forwards',
                      }}
                    >
                      <img
                        src="/assets/combat/raxxar_vfx_tajo.png"
                        alt="Tajo Carmesí"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        style={{ filter: slashFilter }}
                      />
                      <img
                        src="/assets/combat/raxxar_vfx_tajo.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          mixBlendMode: 'screen',
                          filter: 'url(#raxxar-crimson-sweep-shader)',
                          WebkitMaskImage:
                            'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                          maskImage:
                            'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                          WebkitMaskSize: '230% 100%',
                          maskSize: '230% 100%',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          animation: 'raxxarEnergySweep 0.36s ease-out forwards',
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {triggeredOnos.map((idx) => {
                const ono = activeOnos[idx];
                if (!ono) return null;
                return (
                  <div
                    key={`raxxar-ono-${vfxKey}-${idx}`}
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
                      className="w-full h-full object-contain animate-[raxxarSlashOnoPop_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#raxxar-crimson-slash-text-shader)' }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 2. ESCUDO ANTIDISTURBIOS RÚNICO (raxxar_escudo): Solo aura/canvas */}
          {/* ================================================================= */}

          {/* ================================================================= */}
          {/* 3. RAYO DE MAGIA SANGRIENTA (raxxar_lanza)                        */}
          {/* ================================================================= */}
          {skillType === 'raxxar_lanza' && (
            <>
              {triggeredBolts.map((bIdx) => {
                const b = activeBolts[bIdx];
                if (!b) return null;
                return (
                  <div
                    key={`raxxar-bolt-${vfxKey}-${bIdx}`}
                    className="absolute pointer-events-none z-20 overflow-visible origin-left"
                    style={{
                      left: `${b.startLeftPct}%`,
                      bottom: `${b.startBottomPct}%`,
                      width: `${b.widthPx}px`,
                      height: `${b.heightPx}px`,
                      transform: `rotate(${b.angleDeg}deg)`,
                    }}
                  >
                    <img
                      src="/assets/combat/raxxar_vfx_rayo_sangre.png"
                      alt="Rayo de Sangre"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-fill origin-left animate-[raxxarBloodBoltSnap_0.44s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                      style={{ filter: spearFilter }}
                    />
                  </div>
                );
              })}

              {triggeredImpacts.map((impIdx) => {
                const imp = activeImpacts[impIdx];
                if (!imp) return null;
                return (
                  <div
                    key={`raxxar-impact-${vfxKey}-${impIdx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                    style={{
                      right: `${imp.rightPct}%`,
                      bottom: `${imp.bottomPct}%`,
                      width: `${imp.sizePx}px`,
                      height: `${imp.sizePx}px`,
                      transform: `rotate(${imp.rotateDeg}deg)`,
                    }}
                  >
                    <div
                      className="relative w-full h-full overflow-visible"
                      style={{
                        animation: 'raxxarImpactBurstPop 0.44s cubic-bezier(0.16,1,0.3,1) forwards',
                      }}
                    >
                      <img
                        src="/assets/combat/raxxar_vfx_impacto.png"
                        alt="Impacto Carmesí"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        style={{ filter: 'url(#raxxar-impact-shader)' }}
                      />
                      <img
                        src="/assets/combat/raxxar_vfx_impacto.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          mixBlendMode: 'screen',
                          filter: 'url(#raxxar-crimson-sweep-shader)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {triggeredBoltOnos.map((onoIdx) => {
                const ono = activeBoltOnos[onoIdx];
                if (!ono) return null;
                return (
                  <div
                    key={`raxxar-bolt-ono-${vfxKey}-${onoIdx}`}
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
                      src={ono.src}
                      alt={ono.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[raxxarSlashOnoPop_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{ filter: 'url(#raxxar-bolt-ono-shader)' }}
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
