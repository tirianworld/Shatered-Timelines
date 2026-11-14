import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface PrometeoSkillVfxOverlayProps {
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
  shape?: 'circle' | 'spark' | 'ember';
  gravity?: number;
}

interface FireBoltSpec {
  delayMs: number;
  startBottomPct: number;
  arcY: number;
  angleDeg: number;
  scale: number;
  widthPx: number;
}

interface GreenSlashSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  flipX?: boolean;
  flipY?: boolean;
}

interface ComicPopupSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

const BOLTS_TIER1: readonly FireBoltSpec[] = [
  { delayMs: 0, startBottomPct: 39, arcY: -6, angleDeg: -3, scale: 1.04, widthPx: 148 },
];

const BOLTS_TIER2: readonly FireBoltSpec[] = [
  { delayMs: 0, startBottomPct: 43, arcY: -22, angleDeg: -8, scale: 0.96, widthPx: 138 },
  { delayMs: 95, startBottomPct: 37, arcY: 4, angleDeg: 1, scale: 1.04, widthPx: 148 },
  { delayMs: 190, startBottomPct: 32, arcY: 20, angleDeg: 7, scale: 1.0, widthPx: 142 },
];

const BOLTS_TIER3: readonly FireBoltSpec[] = [
  { delayMs: 0, startBottomPct: 44, arcY: -26, angleDeg: -10, scale: 0.94, widthPx: 134 },
  { delayMs: 65, startBottomPct: 39, arcY: -8, angleDeg: -3, scale: 1.0, widthPx: 142 },
  { delayMs: 130, startBottomPct: 34, arcY: 14, angleDeg: 6, scale: 0.98, widthPx: 140 },
  { delayMs: 195, startBottomPct: 42, arcY: -16, angleDeg: -6, scale: 1.06, widthPx: 150 },
  { delayMs: 260, startBottomPct: 36, arcY: 6, angleDeg: 2, scale: 1.14, widthPx: 162 },
];

const GREEN_SLASHES_TIER1: readonly GreenSlashSpec[] = [
  { delayMs: 0, rightPct: 8, bottomPct: 24, widthPx: 146, rotateDeg: -22 },
  { delayMs: 120, rightPct: 7, bottomPct: 27, widthPx: 138, rotateDeg: 28, flipX: true },
];

const GREEN_SLASHES_TIER2: readonly GreenSlashSpec[] = [
  { delayMs: 0, rightPct: 9, bottomPct: 25, widthPx: 146, rotateDeg: -24 },
  { delayMs: 85, rightPct: 6.5, bottomPct: 28, widthPx: 142, rotateDeg: 26, flipX: true },
  { delayMs: 170, rightPct: 8.5, bottomPct: 21, widthPx: 150, rotateDeg: -8, flipY: true },
  { delayMs: 255, rightPct: 7, bottomPct: 30, widthPx: 156, rotateDeg: 14 },
];

const GREEN_SLASHES_TIER3: readonly GreenSlashSpec[] = [
  { delayMs: 0, rightPct: 9.5, bottomPct: 26, widthPx: 146, rotateDeg: -28 },
  { delayMs: 60, rightPct: 6.5, bottomPct: 29, widthPx: 144, rotateDeg: 30, flipX: true },
  { delayMs: 120, rightPct: 8.5, bottomPct: 21, widthPx: 150, rotateDeg: -10, flipY: true },
  { delayMs: 180, rightPct: 6, bottomPct: 24, widthPx: 148, rotateDeg: 16 },
  { delayMs: 240, rightPct: 9, bottomPct: 32, widthPx: 154, rotateDeg: -38, flipX: true },
  { delayMs: 310, rightPct: 7, bottomPct: 25, widthPx: 168, rotateDeg: 8 },
];

const BOOM_FIREBOLT_T1: readonly ComicPopupSpec[] = [
  { delayMs: 135, rightPct: 7, bottomPct: 48, widthPx: 112, rotateDeg: -8 },
];

const BOOM_FIREBOLT_T2: readonly ComicPopupSpec[] = [
  { delayMs: 120, rightPct: 14, bottomPct: 55, widthPx: 108, rotateDeg: -11 },
  { delayMs: 280, rightPct: 4, bottomPct: 42, widthPx: 118, rotateDeg: 7 },
];

const BOOM_FIREBOLT_T3: readonly ComicPopupSpec[] = [
  { delayMs: 105, rightPct: 15, bottomPct: 57, widthPx: 108, rotateDeg: -12 },
  { delayMs: 235, rightPct: 3, bottomPct: 48, widthPx: 114, rotateDeg: 9 },
  { delayMs: 365, rightPct: 8, bottomPct: 35, widthPx: 128, rotateDeg: -5 },
];

const SLASH_VERDE_T1: readonly ComicPopupSpec[] = [
  { delayMs: 70, rightPct: 7, bottomPct: 50, widthPx: 106, rotateDeg: -10 },
];

const SLASH_VERDE_T2: readonly ComicPopupSpec[] = [
  { delayMs: 60, rightPct: 14, bottomPct: 55, widthPx: 104, rotateDeg: -12 },
  { delayMs: 225, rightPct: 3.5, bottomPct: 43, widthPx: 114, rotateDeg: 8 },
];

const SLASH_VERDE_T3: readonly ComicPopupSpec[] = [
  { delayMs: 50, rightPct: 15, bottomPct: 57, widthPx: 106, rotateDeg: -14 },
  { delayMs: 185, rightPct: 3, bottomPct: 49, widthPx: 112, rotateDeg: 10 },
  { delayMs: 325, rightPct: 8, bottomPct: 36, widthPx: 124, rotateDeg: -6 },
];

const BOOM_BOLA_T1: readonly ComicPopupSpec[] = [
  { delayMs: 130, rightPct: 7, bottomPct: 53, widthPx: 122, rotateDeg: -8 },
];

const BOOM_BOLA_T2: readonly ComicPopupSpec[] = [
  { delayMs: 115, rightPct: 14, bottomPct: 58, widthPx: 118, rotateDeg: -11 },
  { delayMs: 270, rightPct: 3.5, bottomPct: 45, widthPx: 132, rotateDeg: 8 },
];

const BOOM_BOLA_T3: readonly ComicPopupSpec[] = [
  { delayMs: 100, rightPct: 15, bottomPct: 60, widthPx: 120, rotateDeg: -13 },
  { delayMs: 230, rightPct: 3, bottomPct: 50, widthPx: 128, rotateDeg: 9 },
  { delayMs: 360, rightPct: 8, bottomPct: 36, widthPx: 146, rotateDeg: -5 },
];

export const PrometeoSkillVfxOverlay: React.FC<PrometeoSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredBolts, setTriggeredBolts] = useState<number[]>([]);
  const [triggeredSlashes, setTriggeredSlashes] = useState<number[]>([]);
  const [triggeredPopups, setTriggeredPopups] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'prometeo_fire_bolt' ||
    skillType === 'prometeo_espada_verde' ||
    skillType === 'prometeo_bola_fuego';

  const activeBolts: readonly FireBoltSpec[] =
    tier === 3 ? BOLTS_TIER3 : tier === 2 ? BOLTS_TIER2 : BOLTS_TIER1;

  const activeSlashes: readonly GreenSlashSpec[] =
    tier === 3
      ? GREEN_SLASHES_TIER3
      : tier === 2
      ? GREEN_SLASHES_TIER2
      : GREEN_SLASHES_TIER1;

  const activePopups: readonly ComicPopupSpec[] =
    skillType === 'prometeo_fire_bolt'
      ? tier === 3
        ? BOOM_FIREBOLT_T3
        : tier === 2
        ? BOOM_FIREBOLT_T2
        : BOOM_FIREBOLT_T1
      : skillType === 'prometeo_espada_verde'
      ? tier === 3
        ? SLASH_VERDE_T3
        : tier === 2
        ? SLASH_VERDE_T2
        : SLASH_VERDE_T1
      : skillType === 'prometeo_bola_fuego'
      ? tier === 3
        ? BOOM_BOLA_T3
        : tier === 2
        ? BOOM_BOLA_T2
        : BOOM_BOLA_T1
      : [];

  useEffect(() => {
    setTriggeredBolts([]);
    setTriggeredSlashes([]);
    setTriggeredPopups([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'prometeo_fire_bolt') {
      activeBolts.forEach((b, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBolts((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, b.delayMs);
        timers.push(id);
      });
    }

    if (skillType === 'prometeo_espada_verde') {
      activeSlashes.forEach((s, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredSlashes((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, s.delayMs);
        timers.push(id);
      });
    }

    activePopups.forEach((p, idx) => {
      const id = window.setTimeout(() => {
        setTriggeredPopups((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }, p.delayMs);
      timers.push(id);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Embers, Crimson Blood Sparks, Green-Fire & Magma Shockwaves
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

    if (skillType === 'prometeo_fire_bolt') {
      const firePalette = ['#fef08a', '#fb923c', '#f97316', '#ef4444'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.5;
        const speed = 3.0 + Math.random() * (4.8 + tier * 0.8);
        particles.push({
          x: enemyX - 8 + (Math.random() - 0.5) * 44,
          y: enemyY + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.8 - 0.7,
          size: 2.2 + Math.random() * 2.8,
          life: -Math.random() * (tier === 3 ? 18 : 10),
          maxLife: 18 + Math.random() * 14,
          color: firePalette[i % firePalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'spark' : 'ember',
          gravity: 0.06,
        });
      }
    } else if (skillType === 'prometeo_espada_verde') {
      const verdeBloodPalette = ['#bef264', '#4ade80', '#22c55e', '#ef4444'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.75;
        const speed = 2.8 + Math.random() * (4.4 + tier * 0.9);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 58,
          y: enemyY + (Math.random() - 0.5) * 66,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.82 - 0.5,
          size: 2.0 + Math.random() * 2.9,
          life: -Math.random() * (tier === 3 ? 20 : 12),
          maxLife: 19 + Math.random() * 13,
          color: verdeBloodPalette[i % verdeBloodPalette.length],
          trail: true,
          shape: i % 4 === 3 ? 'circle' : 'spark',
          gravity: 0.05,
        });
      }
    } else if (skillType === 'prometeo_bola_fuego') {
      const magmaPalette = ['#fef08a', '#fbbf24', '#fb923c', '#f97316', '#dc2626'];
      const count = Math.round(32 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * (5.2 + tier * 0.9);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 52,
          y: enemyY + (Math.random() - 0.5) * 54,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.86 - 1.1,
          size: 2.3 + Math.random() * 3.2,
          life: -6 - Math.random() * 12,
          maxLife: 22 + Math.random() * 16,
          color: magmaPalette[i % magmaPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'ember' : 'spark',
          gravity: 0.04,
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

      if (skillType === 'prometeo_fire_bolt') {
        if (progress > 0.08 && progress < 0.82) {
          const fp = (progress - 0.08) / 0.74;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.62 + tier * 0.1);
          const impactX = enemyX - 6;
          const impactY = enemyY - 4;
          const radius = 44 + tier * 14;

          ctx.save();
          const grad = ctx.createRadialGradient(impactX, impactY, 2, impactX, impactY, radius);
          grad.addColorStop(0, `rgba(254, 240, 138, ${flashAlpha})`);
          grad.addColorStop(0.45, `rgba(249, 115, 22, ${flashAlpha * 0.72})`);
          grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(impactX, impactY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (tier >= 2 && progress > 0.12 && progress < 0.88) {
          const p = (progress - 0.12) / 0.76;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            18 + p * (58 + tier * 10),
            6 + p * (16 + tier * 2.5),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(251, 146, 60, ${(1 - p) * 0.76})`;
          ctx.lineWidth = 2.5 * (1 - p * 0.45);
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'prometeo_espada_verde') {
        if (progress > 0.05 && progress < 0.84) {
          const fp = (progress - 0.05) / 0.79;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.52 + tier * 0.1);
          const radius = 48 + tier * 14;

          ctx.save();
          const grad = ctx.createRadialGradient(enemyX, enemyY, 2, enemyX, enemyY, radius);
          grad.addColorStop(0, `rgba(217, 249, 157, ${flashAlpha})`);
          grad.addColorStop(0.48, `rgba(34, 197, 94, ${flashAlpha * 0.64})`);
          grad.addColorStop(1, 'rgba(22, 163, 74, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX, enemyY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (skillType === 'prometeo_bola_fuego') {
        const rings = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < rings; r++) {
          const start = 0.08 + r * 0.14;
          const span = 0.74;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 48,
              22 + p * (72 + tier * 14),
              7 + p * (20 + tier * 3.5),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(251, 146, 60, ${(1 - p) * 0.86})`
                : `rgba(254, 240, 138, ${(1 - p) * 0.78})`;
            ctx.lineWidth = (3.2 - r * 0.4) * (1 - p * 0.42);
            ctx.shadowColor = r % 2 === 0 ? '#ea580c' : '#fbbf24';
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (progress > 0.1 && progress < 0.88) {
          const fp = (progress - 0.1) / 0.78;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.68 + tier * 0.08);
          const radius = 58 + tier * 18;
          ctx.save();
          const grad = ctx.createRadialGradient(enemyX, enemyY - 4, 4, enemyX, enemyY - 4, radius);
          grad.addColorStop(0, `rgba(254, 249, 195, ${flashAlpha})`);
          grad.addColorStop(0.45, `rgba(249, 115, 22, ${flashAlpha * 0.72})`);
          grad.addColorStop(1, 'rgba(185, 28, 28, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX, enemyY - 4, radius, 0, Math.PI * 2);
          ctx.fill();
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
        pt.vx *= 0.94;
        pt.vy = pt.vy * 0.94 + (pt.gravity || 0);

        const lifeFrac = pt.life / pt.maxLife;
        const pAlpha = Math.sin(lifeFrac * Math.PI);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, pAlpha * 0.95));
        ctx.strokeStyle = pt.color;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 10;

        if (pt.trail) {
          ctx.beginPath();
          ctx.moveTo(prevX - pt.vx * 1.45, prevY - pt.vy * 1.45);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.68;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (pt.shape === 'spark') {
          const r = pt.size * 0.92;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.35);
          ctx.lineTo(pt.x + r * 0.75, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.35);
          ctx.lineTo(pt.x - r * 0.75, pt.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 0.66, 0, Math.PI * 2);
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

  const boltShaderFilter =
    tier === 3
      ? 'url(#prometeo-bolt-t3-shader)'
      : tier === 2
      ? 'url(#prometeo-bolt-t2-shader)'
      : 'url(#prometeo-bolt-t1-shader)';

  const verdeShaderFilter =
    tier === 3
      ? 'url(#prometeo-verde-t3-shader)'
      : tier === 2
      ? 'url(#prometeo-verde-t2-shader)'
      : 'url(#prometeo-verde-t1-shader)';

  const bolaShaderFilter =
    tier === 3
      ? 'url(#prometeo-bola-t3-shader)'
      : tier === 2
      ? 'url(#prometeo-bola-t2-shader)'
      : 'url(#prometeo-bola-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. FIRE BOLT: Shaders de fuego abrasador */}
          <filter id="prometeo-bolt-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#f97316" floodOpacity="0.94" result="fireGlow" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-bolt-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.085" numOctaves="1" seed="5" result="heatNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.05 0.14; 0.022 0.07" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="heatNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingBolt" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#f97316" floodOpacity="0.96" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.88" result="yellowRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="yellowRim" />
              <feMergeNode in="livingBolt" />
            </feMerge>
          </filter>

          <filter id="prometeo-bolt-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.1" numOctaves="1" seed="12" result="heatNoise">
              <animate attributeName="baseFrequency" values="0.025 0.08; 0.062 0.16; 0.025 0.08" dur="0.16s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="heatNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="livingBolt" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.2" floodColor="#ef4444" floodOpacity="0.98" result="crimsonGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fef9c3" floodOpacity="0.94" result="hotRim" />
            <feMerge>
              <feMergeNode in="crimsonGlow" />
              <feMergeNode in="hotRim" />
              <feMergeNode in="livingBolt" />
            </feMerge>
          </filter>

          {/* 2. ESPADA DE FUEGO VERDE: Shaders de fuego esmeralda y filo sangriento */}
          <filter id="prometeo-verde-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#22c55e" floodOpacity="0.94" result="greenGlow" />
            <feMerge>
              <feMergeNode in="greenGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-verde-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.026 0.08" numOctaves="1" seed="8" result="felNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.048 0.135; 0.02 0.065" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="felNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingArc" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.6" floodColor="#22c55e" floodOpacity="0.96" result="greenGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#d9f99d" floodOpacity="0.9" result="limeRim" />
            <feMerge>
              <feMergeNode in="greenGlow" />
              <feMergeNode in="limeRim" />
              <feMergeNode in="livingArc" />
            </feMerge>
          </filter>

          <filter id="prometeo-verde-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.095" numOctaves="2" seed="15" result="felNoise">
              <animate attributeName="baseFrequency" values="0.025 0.075; 0.06 0.16; 0.025 0.075" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="felNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="livingArc" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.4" floodColor="#16a34a" floodOpacity="0.98" result="emeraldGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.7" floodColor="#ecfccb" floodOpacity="0.95" result="hotLimeRim" />
            <feMerge>
              <feMergeNode in="emeraldGlow" />
              <feMergeNode in="hotLimeRim" />
              <feMergeNode in="livingArc" />
            </feMerge>
          </filter>

          <filter id="prometeo-verde-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.85 1.35 0.35 0 0.14
                      0.55 1.65 0.45 0 0.22
                      0.35 1.05 0.45 0 0.06
                      0    0    0    0.95 0"
              result="hotEmerald"
            />
            <feGaussianBlur in="hotEmerald" stdDeviation="1.8" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotEmerald" />
            </feMerge>
          </filter>

          {/* 3. BOLA DE FUEGO: Shaders de vórtice magmático cataclísmico */}
          <filter id="prometeo-bola-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022 0.07" numOctaves="2" seed="4" result="magmaNoise">
              <animate attributeName="baseFrequency" values="0.018 0.055; 0.044 0.12; 0.018 0.055" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="magmaNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="livingMagma" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#f97316" floodOpacity="0.94" result="orangeGlow" />
            <feMerge>
              <feMergeNode in="orangeGlow" />
              <feMergeNode in="livingMagma" />
            </feMerge>
          </filter>

          <filter id="prometeo-bola-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.085" numOctaves="2" seed="10" result="magmaNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.054 0.15; 0.024 0.07" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="magmaNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="livingMagma" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.4" floodColor="#ea580c" floodOpacity="0.96" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef08a" floodOpacity="0.9" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="livingMagma" />
            </feMerge>
          </filter>

          <filter id="prometeo-bola-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.1" numOctaves="2" seed="18" result="magmaNoise">
              <animate attributeName="baseFrequency" values="0.028 0.085; 0.068 0.18; 0.028 0.085" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="magmaNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="livingMagma" />
            <feDropShadow dx="0" dy="0" stdDeviation="5.2" floodColor="#dc2626" floodOpacity="0.98" result="crimsonCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.0" floodColor="#fef9c3" floodOpacity="0.96" result="hotCore" />
            <feMerge>
              <feMergeNode in="crimsonCorona" />
              <feMergeNode in="hotCore" />
              <feMergeNode in="livingMagma" />
            </feMerge>
          </filter>

          <filter id="prometeo-bola-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.55 0.95 0.35 0 0.24
                      0.85 1.25 0.35 0 0.14
                      0.25 0.45 0.55 0 0.04
                      0    0    0    0.92 0"
              result="hotMagma"
            />
            <feGaussianBlur in="hotMagma" stdDeviation="2.2" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotMagma" />
            </feMerge>
          </filter>

          {/* Onomatopeyas BOOM! y SLASH! */}
          <filter id="prometeo-boom-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ea580c" floodOpacity="0.95" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.92" result="yellowRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="yellowRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-slash-verde-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.0" floodColor="#22c55e" floodOpacity="0.95" result="greenGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#ecfccb" floodOpacity="0.92" result="limeRim" />
            <feMerge>
              <feMergeNode in="greenGlow" />
              <feMergeNode in="limeRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* SHADERS DEL SPRITE DE PROMETEO: Aura Ígnea Piromántica & Aura Blood Hunter Verde-Carmesí */}
          <filter id="prometeo-fire-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.075" numOctaves="2" seed="4" result="pyroNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.12; 0.02 0.06" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="pyroNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f97316" floodOpacity="0.92" result="fireColor" />
            <feComposite in="fireColor" in2="wavyAura" operator="in" result="fireAura" />
            <feGaussianBlur in="fireAura" stdDeviation="3.5" result="fireCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fef08a" floodOpacity="0.78" result="crispRim" />
            <feMerge>
              <feMergeNode in="fireCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-fire-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.082" numOctaves="2" seed="9" result="pyroNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.054 0.135; 0.024 0.07" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="pyroNoise" scale="5.4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#ea580c" floodOpacity="0.95" result="fireColor" />
            <feComposite in="fireColor" in2="wavyAura" operator="in" result="fireAura" />
            <feGaussianBlur in="fireAura" stdDeviation="4.8" result="fireCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fde047" floodOpacity="0.86" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-fire-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.034 0.092" numOctaves="3" seed="14" result="pyroNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.066 0.16; 0.028 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="pyroNoise" scale="7.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#dc2626" floodOpacity="1" result="deepCrimson" />
            <feComposite in="deepCrimson" in2="wavyAura" operator="in" result="crimsonAura" />
            <feGaussianBlur in="crimsonAura" stdDeviation="6.4" result="outerCorona" />
            <feFlood floodColor="#fef08a" floodOpacity="0.95" result="goldHeat" />
            <feComposite in="goldHeat" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-blood-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.028 0.085" numOctaves="2" seed="17" result="riteNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.056 0.15; 0.022 0.07" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="riteNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#22c55e" floodOpacity="0.95" result="felGreen" />
            <feComposite in="felGreen" in2="wavyAura" operator="in" result="greenAura" />
            <feGaussianBlur in="greenAura" stdDeviation="4.6" result="greenCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#ef4444" floodOpacity="0.88" result="bloodRim" />
            <feMerge>
              <feMergeNode in="greenCorona" />
              <feMergeNode in="bloodRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="prometeo-fire-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="21" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fef08a" floodOpacity="0.96" result="amberFlood" />
            <feComposite in="amberFlood" in2="rippledRim" operator="in" result="amberRim" />
            <feGaussianBlur in="amberRim" stdDeviation="1.6" result="amberBloom" />
            <feMerge>
              <feMergeNode in="amberBloom" />
              <feMergeNode in="amberRim" />
            </feMerge>
          </filter>

          <filter id="prometeo-blood-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="23" result="shimmerNoise">
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
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`prometeo-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. FIRE BOLT: Proyectiles veloces de fuego abrasador desde las manos de Prometeo */
            @keyframes prometeoFireBoltFly {
              0% {
                transform: translate(0px, 0px) scale(0.55);
                opacity: 0;
              }
              16% {
                transform: translate(34px, calc(var(--arc-y, 0px) * 0.25)) scale(1.06);
                opacity: 1;
              }
              74% {
                transform: translate(188px, var(--arc-y, 0px)) scale(1.0);
                opacity: 1;
              }
              100% {
                transform: translate(224px, var(--arc-y, 0px)) scale(0.84);
                opacity: 0;
              }
            }

            /* 2. ESPADA DE FUEGO VERDE: Tajos crecientes de fuego esmeralda */
            @keyframes prometeoGreenSlashArc {
              0% {
                transform: scaleX(0.42) scaleY(0.48) rotate(var(--slash-rot, -18deg));
                opacity: 0;
              }
              24% {
                transform: scaleX(1.12) scaleY(1.08) rotate(calc(var(--slash-rot, -18deg) + 6deg));
                opacity: 1;
              }
              62% {
                transform: scaleX(1.02) scaleY(1.0) rotate(calc(var(--slash-rot, -18deg) + 10deg));
                opacity: 0.96;
              }
              100% {
                transform: scaleX(1.14) scaleY(0.92) rotate(calc(var(--slash-rot, -18deg) + 16deg));
                opacity: 0;
              }
            }

            @keyframes prometeoSlashSweepMask {
              0% {
                opacity: 0;
                -webkit-mask-position: 120% 0%;
                mask-position: 120% 0%;
              }
              24% {
                opacity: 1;
              }
              78% {
                opacity: 0.85;
              }
              100% {
                opacity: 0;
                -webkit-mask-position: -35% 0%;
                mask-position: -35% 0%;
              }
            }

            /* 3. BOLA DE FUEGO: Vórtice ígneo giratorio y detonación magmática */
            @keyframes prometeoFireballDetonate {
              0% {
                transform: translate(-115px, 14px) scale(0.32) rotate(-65deg);
                opacity: 0;
              }
              24% {
                transform: translate(0px, 0px) scale(1.14) rotate(45deg);
                opacity: 1;
              }
              58% {
                transform: translate(0px, -4px) scale(1.02) rotate(135deg);
                opacity: 0.98;
              }
              84% {
                transform: translate(0px, -8px) scale(1.18) rotate(195deg);
                opacity: 0.82;
              }
              100% {
                transform: translate(0px, -14px) scale(1.32) rotate(240deg);
                opacity: 0;
              }
            }

            @keyframes prometeoFireballCoreSpin {
              0% {
                transform: scale(0.45) rotate(0deg);
                opacity: 0;
              }
              28% {
                transform: scale(0.92) rotate(-90deg);
                opacity: 0.95;
              }
              72% {
                transform: scale(0.84) rotate(-200deg);
                opacity: 0.84;
              }
              100% {
                transform: scale(1.12) rotate(-270deg);
                opacity: 0;
              }
            }

            @keyframes prometeoAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.05); opacity: 0.95; }
              62% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.86; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }

            @keyframes prometeoComicPop {
              0% {
                transform: scale(0.24) rotate(-14deg);
                opacity: 0;
              }
              24% {
                transform: scale(1.18) rotate(4deg);
                opacity: 1;
              }
              44% {
                transform: scale(0.95) rotate(-2deg);
                opacity: 1;
              }
              76% {
                transform: scale(1.04) rotate(1deg);
                opacity: 0.95;
              }
              100% {
                transform: translateY(-10px) scale(1.12) rotate(5deg);
                opacity: 0;
              }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Halo piromántico bajo Prometeo solo en hechizos a distancia (sin aura en ataque mele) */}
          {skillType !== 'prometeo_espada_verde' && (
            <div
              className="absolute left-[4.5%] bottom-[4%] w-[205px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[prometeoAuraBloom_0.94s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 62%, rgba(254,240,138,0.48) 0%, rgba(249,115,22,0.32) 42%, rgba(220,38,38,0.16) 66%, transparent 78%)',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. FIRE BOLT (prometeo_fire_bolt): 1 / 3 / 5 saetas de fuego      */}
          {/* ================================================================= */}
          {skillType === 'prometeo_fire_bolt' &&
            triggeredBolts.map((idx) => {
              const b = activeBolts[idx];
              if (!b) return null;
              return (
                <div
                  key={`prometeo-bolt-${vfxKey}-${idx}`}
                  className="absolute left-[21%] pointer-events-none z-20 overflow-visible"
                  style={{
                    bottom: `${b.startBottomPct}%`,
                    width: `${b.widthPx}px`,
                    height: `${Math.round(b.widthPx * 0.3)}px`,
                    transform: `rotate(${b.angleDeg}deg) scale(${b.scale})`,
                  }}
                >
                  <img
                    src="/assets/combat/prometeo_vfx_fire_bolt.png"
                    alt="Fire Bolt"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--arc-y': `${b.arcY}px`,
                        filter: boltShaderFilter,
                        animation: 'prometeoFireBoltFly 0.44s cubic-bezier(0.18,0.9,0.3,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* ================================================================= */}
          {/* 2. ESPADA DE FUEGO VERDE (prometeo_espada_verde): 2 / 4 / 6 tajos */}
          {/* ================================================================= */}
          {skillType === 'prometeo_espada_verde' &&
            triggeredSlashes.map((idx) => {
              const s = activeSlashes[idx];
              if (!s) return null;
              const flipScaleX = s.flipX ? -1 : 1;
              const flipScaleY = s.flipY ? -1 : 1;
              return (
                <div
                  key={`prometeo-verde-slash-${vfxKey}-${idx}`}
                  className="absolute pointer-events-none z-20 overflow-visible flex items-center justify-center"
                  style={{
                    right: `${s.rightPct}%`,
                    bottom: `${s.bottomPct}%`,
                    width: `${s.widthPx}px`,
                    height: `${Math.round(s.widthPx * 0.48)}px`,
                    transform: `scale(${flipScaleX}, ${flipScaleY})`,
                  }}
                >
                  <img
                    src="/assets/combat/prometeo_vfx_tajo_verde.png"
                    alt="Tajo de Fuego Verde"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--slash-rot': `${s.rotateDeg}deg`,
                        filter: verdeShaderFilter,
                        animation: 'prometeoGreenSlashArc 0.46s cubic-bezier(0.16,1,0.3,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                  <img
                    src="/assets/combat/prometeo_vfx_tajo_verde.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={
                      {
                        '--slash-rot': `${s.rotateDeg}deg`,
                        mixBlendMode: 'screen',
                        filter: 'url(#prometeo-verde-sweep-shader)',
                        WebkitMaskImage:
                          'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 82%)',
                        maskImage:
                          'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 82%)',
                        WebkitMaskSize: '240% 100%',
                        maskSize: '240% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        animation:
                          'prometeoGreenSlashArc 0.46s cubic-bezier(0.16,1,0.3,1) forwards, prometeoSlashSweepMask 0.46s cubic-bezier(0.22,1,0.36,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* ================================================================= */}
          {/* 3. BOLA DE FUEGO (prometeo_bola_fuego): Detonación magmática      */}
          {/* ================================================================= */}
          {skillType === 'prometeo_bola_fuego' && (
            <div
              className={`absolute flex items-center justify-center pointer-events-none z-20 overflow-visible ${
                tier === 3
                  ? 'right-[4.5%] bottom-[16%] w-[224px] h-[224px]'
                  : tier === 2
                  ? 'right-[6%] bottom-[18%] w-[192px] h-[192px]'
                  : 'right-[7%] bottom-[20%] w-[162px] h-[162px]'
              }`}
            >
              <img
                src="/assets/combat/prometeo_vfx_bola.png"
                alt="Bola de Fuego"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                style={{
                  filter: bolaShaderFilter,
                  animation: 'prometeoFireballDetonate 0.86s cubic-bezier(0.16,1,0.3,1) forwards',
                }}
              />
              <img
                src="/assets/combat/prometeo_vfx_bola.png"
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  mixBlendMode: 'screen',
                  filter: 'url(#prometeo-bola-sweep-shader)',
                  animation: 'prometeoFireballCoreSpin 0.84s cubic-bezier(0.22,1,0.36,1) forwards',
                }}
              />
            </div>
          )}

          {/* Onomatopeyas estilo cómic: BOOM! (Fire Bolt & Bola de Fuego) o SLASH! (Espada Verde) */}
          {triggeredPopups.map((idx) => {
            const p = activePopups[idx];
            if (!p) return null;
            const isGreenSlashPopup = skillType === 'prometeo_espada_verde';
            return (
              <div
                key={`prometeo-popup-${vfxKey}-${idx}`}
                className="absolute pointer-events-none z-30 overflow-visible"
                style={{
                  right: `${p.rightPct}%`,
                  bottom: `${p.bottomPct}%`,
                  width: `${p.widthPx}px`,
                  height: `${Math.round(p.widthPx * 0.56)}px`,
                  transform: `rotate(${p.rotateDeg}deg)`,
                }}
              >
                <img
                  src={
                    isGreenSlashPopup
                      ? '/assets/combat/edacorn_vfx_slash.png'
                      : '/assets/combat/prometeo_vfx_boom.png'
                  }
                  alt={isGreenSlashPopup ? 'SLASH!' : 'BOOM!'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  style={{
                    filter: isGreenSlashPopup
                      ? 'url(#prometeo-slash-verde-shader)'
                      : 'url(#prometeo-boom-shader)',
                    animation: 'prometeoComicPop 0.54s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
