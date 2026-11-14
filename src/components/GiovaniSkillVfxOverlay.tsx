import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface GiovaniSkillVfxOverlayProps {
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
  targetX?: number;
  targetY?: number;
}

interface FeatherSpec {
  delayMs: number;
  startBottomPct: number;
  arcY: number;
  angleDeg: number;
  scale: number;
  widthPx: number;
}

interface CardTrickSpec {
  delayMs: number;
  offsetX: number;
  offsetY: number;
  startRot: number;
  endRot: number;
  scale: number;
  targetEnemy: boolean;
}

interface ZapPopupSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
}

const FEATHERS_TIER1: readonly FeatherSpec[] = [
  { delayMs: 0, startBottomPct: 42, arcY: -18, angleDeg: -7, scale: 0.96, widthPx: 112 },
  { delayMs: 95, startBottomPct: 37, arcY: 6, angleDeg: 2, scale: 1.0, widthPx: 118 },
  { delayMs: 190, startBottomPct: 33, arcY: 22, angleDeg: 9, scale: 0.95, widthPx: 112 },
];

const FEATHERS_TIER2: readonly FeatherSpec[] = [
  { delayMs: 0, startBottomPct: 44, arcY: -24, angleDeg: -10, scale: 0.92, widthPx: 108 },
  { delayMs: 65, startBottomPct: 39, arcY: -6, angleDeg: -3, scale: 0.96, widthPx: 114 },
  { delayMs: 130, startBottomPct: 34, arcY: 16, angleDeg: 7, scale: 0.94, widthPx: 110 },
  { delayMs: 195, startBottomPct: 43, arcY: -12, angleDeg: -6, scale: 0.98, widthPx: 116 },
  { delayMs: 260, startBottomPct: 36, arcY: 10, angleDeg: 4, scale: 1.02, widthPx: 118 },
  { delayMs: 325, startBottomPct: 32, arcY: 24, angleDeg: 11, scale: 0.96, widthPx: 114 },
];

const FEATHERS_TIER3: readonly FeatherSpec[] = [
  { delayMs: 0, startBottomPct: 45, arcY: -28, angleDeg: -12, scale: 0.9, widthPx: 106 },
  { delayMs: 45, startBottomPct: 40, arcY: -12, angleDeg: -5, scale: 0.94, widthPx: 110 },
  { delayMs: 90, startBottomPct: 35, arcY: 12, angleDeg: 5, scale: 0.92, widthPx: 108 },
  { delayMs: 135, startBottomPct: 31, arcY: 26, angleDeg: 12, scale: 0.9, widthPx: 106 },
  { delayMs: 180, startBottomPct: 44, arcY: -20, angleDeg: -8, scale: 0.96, widthPx: 114 },
  { delayMs: 225, startBottomPct: 38, arcY: 2, angleDeg: 0, scale: 1.0, widthPx: 116 },
  { delayMs: 270, startBottomPct: 33, arcY: 18, angleDeg: 8, scale: 0.96, widthPx: 112 },
  { delayMs: 315, startBottomPct: 42, arcY: -14, angleDeg: -6, scale: 1.02, widthPx: 118 },
  { delayMs: 360, startBottomPct: 36, arcY: 8, angleDeg: 4, scale: 1.04, widthPx: 120 },
  { delayMs: 405, startBottomPct: 39, arcY: -2, angleDeg: -2, scale: 1.12, widthPx: 126 },
];

const CARDS_TIER1: readonly CardTrickSpec[] = [
  { delayMs: 0, offsetX: -18, offsetY: -18, startRot: -34, endRot: -16, scale: 0.86, targetEnemy: false },
  { delayMs: 95, offsetX: 28, offsetY: -26, startRot: 28, endRot: 14, scale: 0.92, targetEnemy: false },
];

const CARDS_TIER2: readonly CardTrickSpec[] = [
  { delayMs: 0, offsetX: -22, offsetY: -16, startRot: -38, endRot: -18, scale: 0.88, targetEnemy: false },
  { delayMs: 75, offsetX: 26, offsetY: -34, startRot: 16, endRot: 4, scale: 0.94, targetEnemy: false },
  { delayMs: 155, offsetX: 46, offsetY: -12, startRot: -12, endRot: 24, scale: 0.9, targetEnemy: true },
];

const CARDS_TIER3: readonly CardTrickSpec[] = [
  { delayMs: 0, offsetX: -24, offsetY: -16, startRot: -42, endRot: -22, scale: 0.88, targetEnemy: false },
  { delayMs: 60, offsetX: 22, offsetY: -38, startRot: 18, endRot: 4, scale: 0.96, targetEnemy: false },
  { delayMs: 120, offsetX: 48, offsetY: -14, startRot: 36, endRot: 20, scale: 0.9, targetEnemy: false },
  { delayMs: 180, offsetX: 10, offsetY: -8, startRot: -20, endRot: 18, scale: 0.94, targetEnemy: true },
  { delayMs: 255, offsetX: -12, offsetY: 14, startRot: 25, endRot: -12, scale: 1.0, targetEnemy: true },
];

const ZAP_PLUMAS_T1: readonly ZapPopupSpec[] = [
  { delayMs: 140, rightPct: 8, bottomPct: 48, widthPx: 104, rotateDeg: -10 },
];

const ZAP_PLUMAS_T2: readonly ZapPopupSpec[] = [
  { delayMs: 120, rightPct: 14, bottomPct: 55, widthPx: 104, rotateDeg: -12 },
  { delayMs: 290, rightPct: 3, bottomPct: 42, widthPx: 114, rotateDeg: 8 },
];

const ZAP_PLUMAS_T3: readonly ZapPopupSpec[] = [
  { delayMs: 100, rightPct: 15, bottomPct: 57, widthPx: 106, rotateDeg: -14 },
  { delayMs: 245, rightPct: 2, bottomPct: 48, widthPx: 112, rotateDeg: 10 },
  { delayMs: 390, rightPct: 9, bottomPct: 35, widthPx: 126, rotateDeg: -5 },
];

const ZAP_TOMO_T1: readonly ZapPopupSpec[] = [
  { delayMs: 105, rightPct: 7, bottomPct: 52, widthPx: 110, rotateDeg: -9 },
];

const ZAP_TOMO_T2: readonly ZapPopupSpec[] = [
  { delayMs: 85, rightPct: 14, bottomPct: 56, widthPx: 112, rotateDeg: -12 },
  { delayMs: 255, rightPct: 3, bottomPct: 44, widthPx: 120, rotateDeg: 8 },
];

const ZAP_TOMO_T3: readonly ZapPopupSpec[] = [
  { delayMs: 75, rightPct: 15, bottomPct: 58, widthPx: 116, rotateDeg: -13 },
  { delayMs: 245, rightPct: 3, bottomPct: 46, widthPx: 132, rotateDeg: 7 },
];

export const GiovaniSkillVfxOverlay: React.FC<GiovaniSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredFeathers, setTriggeredFeathers] = useState<number[]>([]);
  const [triggeredCards, setTriggeredCards] = useState<number[]>([]);
  const [triggeredZaps, setTriggeredZaps] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'giovani_plumas' ||
    skillType === 'giovani_treta' ||
    skillType === 'giovani_tomo';

  const activeFeathers: readonly FeatherSpec[] =
    tier === 3 ? FEATHERS_TIER3 : tier === 2 ? FEATHERS_TIER2 : FEATHERS_TIER1;

  const activeCards: readonly CardTrickSpec[] =
    tier === 3 ? CARDS_TIER3 : tier === 2 ? CARDS_TIER2 : CARDS_TIER1;

  const activeZaps: readonly ZapPopupSpec[] =
    skillType === 'giovani_plumas'
      ? tier === 3
        ? ZAP_PLUMAS_T3
        : tier === 2
        ? ZAP_PLUMAS_T2
        : ZAP_PLUMAS_T1
      : skillType === 'giovani_tomo'
      ? tier === 3
        ? ZAP_TOMO_T3
        : tier === 2
        ? ZAP_TOMO_T2
        : ZAP_TOMO_T1
      : skillType === 'giovani_treta' && tier === 3
      ? [{ delayMs: 230, rightPct: 8, bottomPct: 52, widthPx: 112, rotateDeg: -8 }]
      : [];

  useEffect(() => {
    setTriggeredFeathers([]);
    setTriggeredCards([]);
    setTriggeredZaps([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'giovani_plumas') {
      activeFeathers.forEach((f, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredFeathers((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, f.delayMs);
        timers.push(id);
      });
    }

    if (skillType === 'giovani_treta') {
      activeCards.forEach((c, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredCards((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, c.delayMs);
        timers.push(id);
      });
    }

    activeZaps.forEach((z, idx) => {
      const id = window.setTimeout(() => {
        setTriggeredZaps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }, z.delayMs);
      timers.push(id);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // 60fps Canvas Shader Engine: Shadow Feather Impact Sparks, Trickster Card Rings, Arcane Grimoire Runes & Soul Drain
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
    const countMult = tier === 3 ? 1.5 : tier === 2 ? 1.25 : 1.0;

    const particles: CanvasParticle[] = [];

    if (skillType === 'giovani_plumas') {
      const palette = ['#a855f7', '#c084fc', '#e879f9', '#f3e8ff'];
      const count = Math.round(22 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.4;
        const speed = 2.8 + Math.random() * (4.2 + tier * 0.8);
        particles.push({
          x: enemyX - 10 + (Math.random() - 0.5) * 48,
          y: enemyY + (Math.random() - 0.5) * 68,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.75,
          size: 2.1 + Math.random() * 2.8,
          life: -Math.random() * (tier === 3 ? 20 : 12),
          maxLife: 18 + Math.random() * 14,
          color: palette[i % palette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'star',
        });
      }
    } else if (skillType === 'giovani_treta') {
      const trickPalette = ['#c084fc', '#f472b6', '#fbbf24', '#e879f9'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 86,
          y: heroY + 46 + (Math.random() - 0.5) * 48,
          vx: (Math.random() - 0.5) * 1.1,
          vy: -(1.7 + Math.random() * (2.6 + tier * 0.5)),
          size: 2.0 + Math.random() * 3.1,
          life: -Math.random() * 12,
          maxLife: 28 + Math.random() * 16,
          color: trickPalette[i % trickPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'star' : 'diamond',
        });
      }
    } else if (skillType === 'giovani_tomo') {
      const arcanePalette = ['#a855f7', '#d946ef', '#c084fc', '#f5d0fe'];
      const burstCount = Math.round(22 * countMult);
      for (let i = 0; i < burstCount; i++) {
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 70,
          y: enemyY + 34 + (Math.random() - 0.5) * 32,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -(2.1 + Math.random() * (3.2 + tier * 0.6)),
          size: 2.2 + Math.random() * 3.2,
          life: -Math.random() * 10,
          maxLife: 26 + Math.random() * 16,
          color: arcanePalette[i % arcanePalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'star' : 'circle',
        });
      }
      // Tier 2 & 3 drain wisps returning from enemy to Giovani
      if (tier >= 2) {
        const drainCount = tier === 3 ? 16 : 10;
        for (let i = 0; i < drainCount; i++) {
          particles.push({
            x: enemyX + (Math.random() - 0.5) * 36,
            y: enemyY + (Math.random() - 0.5) * 46,
            vx: -3.2,
            vy: (Math.random() - 0.5) * 2.2,
            size: 2.4 + Math.random() * 2.4,
            life: -i * 1.8,
            maxLife: 24 + Math.random() * 8,
            color: i % 2 === 0 ? '#e879f9' : '#a855f7',
            trail: true,
            shape: 'diamond',
            targetX: heroX,
            targetY: heroY - 6,
          });
        }
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

      if (skillType === 'giovani_plumas') {
        if (progress > 0.08 && progress < 0.8) {
          const fp = (progress - 0.08) / 0.72;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.58 + tier * 0.1);
          const impactX = enemyX - 8;
          const impactY = enemyY - 4;
          const radius = 44 + tier * 14;

          ctx.save();
          const grad = ctx.createRadialGradient(impactX, impactY, 2, impactX, impactY, radius);
          grad.addColorStop(0, `rgba(243, 232, 255, ${flashAlpha})`);
          grad.addColorStop(0.45, `rgba(168, 85, 247, ${flashAlpha * 0.65})`);
          grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
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
            18 + p * (56 + tier * 10),
            6 + p * (16 + tier * 2.5),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(192, 132, 252, ${(1 - p) * 0.74})`;
          ctx.lineWidth = 2.4 * (1 - p * 0.45);
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'giovani_treta') {
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
              24 + p * (58 + tier * 10),
              7 + p * (17 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r % 2 === 0
                ? `rgba(192, 132, 252, ${(1 - p) * 0.8})`
                : `rgba(251, 191, 36, ${(1 - p) * 0.68})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = r % 2 === 0 ? '#a855f7' : '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (skillType === 'giovani_tomo') {
        // Arcane violet ritual ring beneath enemy + caster pulse beneath Giovani
        if (progress < 0.88) {
          const p = progress / 0.88;
          const ringAlpha = Math.sin(p * Math.PI) * (0.72 + tier * 0.08);
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(enemyX, enemyY + 50, 26 + tier * 12 + p * 28, 9 + tier * 3 + p * 8, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(217, 70, 239, ${ringAlpha})`;
          ctx.lineWidth = 2.8;
          ctx.shadowColor = '#c026d3';
          ctx.shadowBlur = 16;
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(enemyX, enemyY + 50, 18 + tier * 8 + p * 18, 6 + tier * 2 + p * 5, 0, 0, Math.PI * 2);
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = -p * 48;
          ctx.strokeStyle = `rgba(245, 208, 254, ${ringAlpha * 0.9})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.ellipse(heroX, heroY + 74, 20 + p * 38, 6 + p * 11, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${(1 - p) * 0.65})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();
          ctx.restore();
        }
      }

      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;

        if (pt.targetX !== undefined && pt.targetY !== undefined) {
          const dx = pt.targetX - pt.x;
          const dy = pt.targetY - pt.y;
          pt.vx += dx * 0.022;
          pt.vy += dy * 0.022;
          pt.vx *= 0.88;
          pt.vy *= 0.88;
          pt.x += pt.vx;
          pt.y += pt.vy;
        } else {
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (skillType === 'giovani_treta' || skillType === 'giovani_tomo') {
            pt.x += Math.sin(pt.life * 0.24) * 0.55;
          } else {
            pt.vx *= 0.94;
            pt.vy *= 0.94;
          }
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
          ctx.lineWidth = pt.size * 0.66;
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

  const plumaShaderFilter =
    tier === 3
      ? 'url(#giovani-pluma-t3-shader)'
      : tier === 2
      ? 'url(#giovani-pluma-t2-shader)'
      : 'url(#giovani-pluma-t1-shader)';

  const llamaShaderFilter =
    tier === 3
      ? 'url(#giovani-llama-t3-shader)'
      : tier === 2
      ? 'url(#giovani-llama-t2-shader)'
      : 'url(#giovani-llama-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. PLUMAS SOMBRÍAS: Shaders de magia oscura penetrante */}
          <filter id="giovani-pluma-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#a855f7" floodOpacity="0.9" result="violetGlow" />
            <feMerge>
              <feMergeNode in="violetGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="giovani-pluma-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.026 0.08" numOctaves="1" seed="6" result="shadowNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.048 0.13; 0.02 0.06" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="shadowNoise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="livingFeather" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#a855f7" floodOpacity="0.94" result="violetGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#e879f9" floodOpacity="0.82" result="magentaRim" />
            <feMerge>
              <feMergeNode in="violetGlow" />
              <feMergeNode in="magentaRim" />
              <feMergeNode in="livingFeather" />
            </feMerge>
          </filter>

          <filter id="giovani-pluma-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.095" numOctaves="1" seed="11" result="shadowNoise">
              <animate attributeName="baseFrequency" values="0.024 0.075; 0.056 0.15; 0.024 0.075" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="shadowNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingFeather" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#9333ea" floodOpacity="0.98" result="purpleGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f5d0fe" floodOpacity="0.92" result="lavenderRim" />
            <feMerge>
              <feMergeNode in="purpleGlow" />
              <feMergeNode in="lavenderRim" />
              <feMergeNode in="livingFeather" />
            </feMerge>
          </filter>

          <filter id="giovani-card-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#c084fc" floodOpacity="0.92" result="violetGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fbbf24" floodOpacity="0.72" result="goldRim" />
            <feMerge>
              <feMergeNode in="violetGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3. CÁNTICO DEL TOMO VIOLETA: Llamarada Arcana Viva + Barrido Especular */}
          <filter id="giovani-llama-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.075" numOctaves="2" seed="3" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.048 0.14; 0.02 0.06" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="livingFlame" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#a855f7" floodOpacity="0.92" result="violetGlow" />
            <feMerge>
              <feMergeNode in="violetGlow" />
              <feMergeNode in="livingFlame" />
            </feMerge>
          </filter>

          <filter id="giovani-llama-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.09" numOctaves="2" seed="7" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.024 0.075; 0.056 0.16; 0.024 0.075" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="4.4" xChannelSelector="R" yChannelSelector="G" result="livingFlame" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.0" floodColor="#c026d3" floodOpacity="0.95" result="magentaGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f5d0fe" floodOpacity="0.88" result="lavenderRim" />
            <feMerge>
              <feMergeNode in="magentaGlow" />
              <feMergeNode in="lavenderRim" />
              <feMergeNode in="livingFlame" />
            </feMerge>
          </filter>

          <filter id="giovani-llama-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.1" numOctaves="2" seed="14" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.028 0.085; 0.068 0.18; 0.028 0.085" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="5.6" xChannelSelector="R" yChannelSelector="G" result="livingFlame" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.8" floodColor="#a855f7" floodOpacity="0.98" result="purpleCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#fdf4ff" floodOpacity="0.94" result="hotRim" />
            <feMerge>
              <feMergeNode in="purpleCorona" />
              <feMergeNode in="hotRim" />
              <feMergeNode in="livingFlame" />
            </feMerge>
          </filter>

          <filter id="giovani-llama-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.25 0.55 1.35 0 0.2
                      0.45 0.85 1.15 0 0.1
                      1.15 0.75 1.55 0 0.28
                      0    0    0    0.95 0"
              result="hotArcane"
            />
            <feGaussianBlur in="hotArcane" stdDeviation="2.0" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotArcane" />
            </feMerge>
          </filter>

          <filter id="giovani-zap-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#a855f7" floodOpacity="0.95" result="purpleGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#f5d0fe" floodOpacity="0.95" result="lavenderRim" />
            <feMerge>
              <feMergeNode in="purpleGlow" />
              <feMergeNode in="lavenderRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2. TRETA DEL BRIBÓN & CÁNTICO DEL TOMO: Shaders Violeta/Dorado sobre el sprite de Giovani */}
          <filter id="giovani-treta-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.075" numOctaves="2" seed="4" result="trickNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.115; 0.02 0.06" dur="0.36s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="trickNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#a855f7" floodOpacity="0.92" result="violetColor" />
            <feComposite in="violetColor" in2="wavyAura" operator="in" result="violetAura" />
            <feGaussianBlur in="violetAura" stdDeviation="3.5" result="violetCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#f5d0fe" floodOpacity="0.78" result="crispRim" />
            <feMerge>
              <feMergeNode in="violetCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="giovani-treta-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.082" numOctaves="2" seed="9" result="trickNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.054 0.13; 0.024 0.07" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="trickNoise" scale="5.5" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#c026d3" floodOpacity="0.95" result="magentaColor" />
            <feComposite in="magentaColor" in2="wavyAura" operator="in" result="magentaAura" />
            <feGaussianBlur in="magentaAura" stdDeviation="4.8" result="magentaCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fbbf24" floodOpacity="0.82" result="goldRim" />
            <feMerge>
              <feMergeNode in="magentaCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="giovani-treta-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.034 0.092" numOctaves="3" seed="14" result="trickNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.066 0.16; 0.028 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="trickNoise" scale="7.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#9333ea" floodOpacity="1" result="deepPurple" />
            <feComposite in="deepPurple" in2="wavyAura" operator="in" result="purpleAura" />
            <feGaussianBlur in="purpleAura" stdDeviation="6.6" result="outerCorona" />
            <feFlood floodColor="#fbbf24" floodOpacity="0.94" result="goldTrick" />
            <feComposite in="goldTrick" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="giovani-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="17" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.32s" repeatCount="indefinite" />
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

          <filter id="giovani-tomo-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.0" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.026 0.08" numOctaves="2" seed="19" result="chantNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.052 0.14; 0.022 0.07" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="chantNoise" scale="5.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#a855f7" floodOpacity="0.94" result="arcaneColor" />
            <feComposite in="arcaneColor" in2="wavyAura" operator="in" result="arcaneAura" />
            <feGaussianBlur in="arcaneAura" stdDeviation="4.6" result="arcaneCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f5d0fe" floodOpacity="0.88" result="crispRim" />
            <feMerge>
              <feMergeNode in="arcaneCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`giovani-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. PLUMAS SOMBRÍAS: Proyectiles veloces desde la mano de Giovani hasta el enemigo */
            @keyframes giovaniFeatherFly {
              0% {
                transform: translate(0px, 0px) scale(0.55);
                opacity: 0;
              }
              16% {
                transform: translate(32px, calc(var(--arc-y, 0px) * 0.25)) scale(1.04);
                opacity: 1;
              }
              74% {
                transform: translate(185px, var(--arc-y, 0px)) scale(1.0);
                opacity: 1;
              }
              100% {
                transform: translate(224px, var(--arc-y, 0px)) scale(0.84);
                opacity: 0;
              }
            }

            /* 2. TRETA DEL BRIBÓN: Naipes encantados girando en ilusión */
            @keyframes giovaniCardOrbitSpin {
              0% {
                transform: translate(0px, 14px) scale(0.35) rotate(var(--start-rot, -20deg));
                opacity: 0;
              }
              24% {
                transform: translate(0px, -4px) scale(1.08) rotate(0deg);
                opacity: 1;
              }
              68% {
                transform: translate(4px, -12px) scale(1.0) rotate(var(--end-rot, 15deg));
                opacity: 0.94;
              }
              100% {
                transform: translate(8px, -22px) scale(0.88) rotate(calc(var(--end-rot, 15deg) + 18deg));
                opacity: 0;
              }
            }

            @keyframes giovaniCardThrowEnemy {
              0% {
                transform: translate(0px, 0px) scale(0.55) rotate(var(--start-rot, -20deg));
                opacity: 0;
              }
              22% {
                transform: translate(45px, -16px) scale(1.08) rotate(120deg);
                opacity: 1;
              }
              74% {
                transform: translate(195px, 4px) scale(0.98) rotate(360deg);
                opacity: 1;
              }
              100% {
                transform: translate(220px, 12px) scale(0.72) rotate(440deg);
                opacity: 0;
              }
            }

            /* 3. LLAMARADA VIOLETA DEL TOMO: Erupción ascendente con calor vivo */
            @keyframes giovaniTomoFlameErupt {
              0% {
                transform: translateY(24px) scaleX(0.42) scaleY(0.26);
                opacity: 0;
              }
              20% {
                transform: translateY(-4px) scaleX(1.08) scaleY(1.1);
                opacity: 1;
              }
              52% {
                transform: translateY(-8px) scaleX(0.98) scaleY(1.02);
                opacity: 0.96;
              }
              82% {
                transform: translateY(-14px) scaleX(1.04) scaleY(0.96);
                opacity: 0.78;
              }
              100% {
                transform: translateY(-24px) scaleX(0.88) scaleY(1.12);
                opacity: 0;
              }
            }

            @keyframes giovaniFlameEnergySweep {
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

            @keyframes giovaniAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.05); opacity: 0.95; }
              62% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.86; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }

            @keyframes giovaniZapPopCartoony {
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
          `}</style>

          {/* Real-time 60fps Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* ================================================================= */}
          {/* 1. PLUMAS SOMBRÍAS (giovani_plumas): 3 / 6 / 10 plumas proyectil */}
          {/* ================================================================= */}
          {skillType === 'giovani_plumas' &&
            triggeredFeathers.map((idx) => {
              const f = activeFeathers[idx];
              if (!f) return null;
              return (
                <div
                  key={`giovani-pluma-${vfxKey}-${idx}`}
                  className="absolute left-[22%] pointer-events-none z-20 overflow-visible"
                  style={{
                    bottom: `${f.startBottomPct}%`,
                    width: `${f.widthPx}px`,
                    height: `${Math.round(f.widthPx * 0.34)}px`,
                    transform: `rotate(${f.angleDeg}deg) scale(${f.scale})`,
                  }}
                >
                  <img
                    src="/assets/combat/giovani_vfx_pluma.png"
                    alt="Pluma Sombría"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--arc-y': `${f.arcY}px`,
                        filter: plumaShaderFilter,
                        animation: 'giovaniFeatherFly 0.42s cubic-bezier(0.18,0.9,0.3,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* ================================================================= */}
          {/* 2. TRETA DEL BRIBÓN (giovani_treta): Aura Violeta + Naipes        */}
          {/* ================================================================= */}
          {skillType === 'giovani_treta' && (
            <>
              <div
                className="absolute left-[4.5%] bottom-[4%] w-[205px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[giovaniAuraBloom_0.96s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                style={{ mixBlendMode: 'screen' }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background:
                      tier === 3
                        ? 'radial-gradient(ellipse at 50% 62%, rgba(245,208,254,0.52) 0%, rgba(168,85,247,0.34) 40%, rgba(251,191,36,0.16) 66%, transparent 78%)'
                        : tier === 2
                        ? 'radial-gradient(ellipse at 50% 62%, rgba(232,121,249,0.42) 0%, rgba(168,85,247,0.28) 40%, transparent 76%)'
                        : 'radial-gradient(ellipse at 50% 64%, rgba(192,132,252,0.36) 0%, rgba(147,51,234,0.18) 44%, transparent 72%)',
                  }}
                />
              </div>

              {triggeredCards.map((idx) => {
                const c = activeCards[idx];
                if (!c) return null;
                return (
                  <div
                    key={`giovani-card-${vfxKey}-${idx}`}
                    className="absolute pointer-events-none z-20 overflow-visible"
                    style={{
                      left: `calc(18% + ${c.offsetX}px)`,
                      bottom: `calc(34% - ${c.offsetY}px)`,
                      width: `${Math.round(58 * c.scale)}px`,
                      height: `${Math.round(64 * c.scale)}px`,
                    }}
                  >
                    <img
                      src="/assets/combat/giovani_vfx_naipe.png"
                      alt="Naipe del Bribón"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      style={
                        {
                          '--start-rot': `${c.startRot}deg`,
                          '--end-rot': `${c.endRot}deg`,
                          filter: 'url(#giovani-card-shader)',
                          animation: c.targetEnemy
                            ? 'giovaniCardThrowEnemy 0.56s cubic-bezier(0.2,0.88,0.32,1) forwards'
                            : 'giovaniCardOrbitSpin 0.68s cubic-bezier(0.22,1,0.36,1) forwards',
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 3. CÁNTICO DEL TOMO VIOLETA (giovani_tomo): Llamas Arcanas Vivas  */}
          {/* ================================================================= */}
          {skillType === 'giovani_tomo' && (
            <>
              {/* Halo arcano bajo Giovani mientras recita el grimorio */}
              <div
                className="absolute left-[4.5%] bottom-[4%] w-[205px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[giovaniAuraBloom_0.96s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                style={{ mixBlendMode: 'screen' }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 62%, rgba(245,208,254,0.44) 0%, rgba(168,85,247,0.28) 42%, transparent 74%)',
                  }}
                />
              </div>

              {/* Pilar principal de fuego arcano violeta sobre el enemigo */}
              <div
                className={`absolute flex items-end justify-center pointer-events-none z-15 overflow-visible ${
                  tier === 3
                    ? 'right-[5.5%] bottom-[17%] w-[186px] h-[238px]'
                    : tier === 2
                    ? 'right-[6.5%] bottom-[18%] w-[162px] h-[210px]'
                    : 'right-[7.5%] bottom-[19%] w-[142px] h-[182px]'
                }`}
              >
                <img
                  src="/assets/combat/giovani_vfx_llama.png"
                  alt="Llama Arcana Violeta"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain origin-bottom animate-[giovaniTomoFlameErupt_0.9s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: llamaShaderFilter }}
                />
                <img
                  src="/assets/combat/giovani_vfx_llama.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain origin-bottom pointer-events-none"
                  style={{
                    mixBlendMode: 'screen',
                    filter: 'url(#giovani-llama-sweep-shader)',
                    WebkitMaskImage:
                      'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                    maskImage:
                      'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                    WebkitMaskSize: '100% 230%',
                    maskSize: '100% 230%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation:
                      'giovaniTomoFlameErupt 0.9s cubic-bezier(0.16,1,0.3,1) forwards, giovaniFlameEnergySweep 0.78s ease-out forwards',
                  }}
                />
              </div>

              {/* Lenguas secundarias de fuego para Tier 3 (Vórtice del Grimorio III) */}
              {tier === 3 && (
                <>
                  <div className="absolute right-[13.5%] bottom-[19%] w-[108px] h-[152px] flex items-end justify-center pointer-events-none z-15 overflow-visible">
                    <img
                      src="/assets/combat/giovani_vfx_llama.png"
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain origin-bottom scale-x-[-1] animate-[giovaniTomoFlameErupt_0.84s_0.08s_cubic-bezier(0.16,1,0.3,1)_both]"
                      style={{ filter: llamaShaderFilter }}
                    />
                  </div>
                  <div className="absolute right-[3%] bottom-[20%] w-[98px] h-[142px] flex items-end justify-center pointer-events-none z-15 overflow-visible">
                    <img
                      src="/assets/combat/giovani_vfx_llama.png"
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain origin-bottom animate-[giovaniTomoFlameErupt_0.82s_0.14s_cubic-bezier(0.16,1,0.3,1)_both]"
                      style={{ filter: llamaShaderFilter }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Onomatopeyas Comic ZAP! */}
          {triggeredZaps.map((idx) => {
            const z = activeZaps[idx];
            if (!z) return null;
            return (
              <div
                key={`giovani-zap-${vfxKey}-${idx}`}
                className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
                style={{
                  right: `${z.rightPct}%`,
                  bottom: `${z.bottomPct}%`,
                  width: `${z.widthPx}px`,
                  height: `${Math.round(z.widthPx * 0.64)}px`,
                  transform: `rotate(${z.rotateDeg}deg)`,
                }}
              >
                <img
                  src="/assets/combat/giovani_vfx_zap.png"
                  alt="ZAP!"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[giovaniZapPopCartoony_0.48s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                  style={{ filter: 'url(#giovani-zap-shader)' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
