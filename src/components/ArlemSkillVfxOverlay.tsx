import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface ArlemSkillVfxOverlayProps {
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

interface VergilTajoSpec {
  delayMs: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  flipY: boolean;
}

const VERGIL_TIER3_TAJOS: readonly VergilTajoSpec[] = [
  { delayMs: 0, x: -16, y: -20, angle: -34, scale: 0.92, flipY: false },
  { delayMs: 85, x: 10, y: -14, angle: 28, scale: 0.9, flipY: true },
  { delayMs: 170, x: -10, y: 16, angle: -12, scale: 0.95, flipY: false },
  { delayMs: 255, x: 8, y: -22, angle: 54, scale: 0.88, flipY: false },
  { delayMs: 340, x: -18, y: 8, angle: -54, scale: 0.92, flipY: true },
  { delayMs: 425, x: 6, y: 18, angle: 16, scale: 0.98, flipY: false },
  { delayMs: 515, x: -2, y: -2, angle: -36, scale: 1.08, flipY: false },
];

interface SlashOnoSpec {
  delayMs: number;
  rightPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  isGold: boolean;
}

const VERGIL_TIER3_ONOS: readonly SlashOnoSpec[] = [
  { delayMs: 45, rightPct: 16, bottomPct: 57, widthPx: 108, rotateDeg: -14, isGold: true },
  { delayMs: 215, rightPct: 1.5, bottomPct: 48, widthPx: 114, rotateDeg: 11, isGold: false },
  { delayMs: 385, rightPct: 13, bottomPct: 33, widthPx: 118, rotateDeg: -7, isGold: true },
  { delayMs: 545, rightPct: 4.5, bottomPct: 52, widthPx: 150, rotateDeg: 4, isGold: true },
];

export const ArlemSkillVfxOverlay: React.FC<ArlemSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredTajos, setTriggeredTajos] = useState<number[]>([]);
  const [triggeredOnos, setTriggeredOnos] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'arlem_fuego' ||
    skillType === 'arlem_rankup' ||
    skillType === 'arlem_curacion';

  const estocadaSpriteUrl =
    tier === 3
      ? '/assets/combat/arlem_vfx_tajo_t3.png'
      : tier === 2
      ? '/assets/combat/arlem_vfx_estocada_t2.png'
      : '/assets/combat/arlem_vfx_estocada_t1.png';

  // Timer-driven staggered slash lines + comic SLASH! popups for Tier 3 Golden Rapier
  useEffect(() => {
    setTriggeredTajos([]);
    setTriggeredOnos([]);
    if (!isActiveSkill || skillType !== 'arlem_fuego' || tier !== 3) return;

    const timers: number[] = [];
    VERGIL_TIER3_TAJOS.forEach((tajo, idx) => {
      const id = window.setTimeout(() => {
        setTriggeredTajos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }, tajo.delayMs);
      timers.push(id);
    });
    VERGIL_TIER3_ONOS.forEach((ono, idx) => {
      const id = window.setTimeout(() => {
        setTriggeredOnos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }, ono.delayMs);
      timers.push(id);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isActiveSkill, skillType, tier, vfxKey]);

  // Real-time 60fps AAA Canvas Shader Engine (Supersonic Piercing Beams, Harmonic Ribbons, Sanctuary Spirals)
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
    const countMult = tier === 3 ? 1.48 : tier === 2 ? 1.24 : 1.0;

    const particles: CanvasParticle[] = [];

    if (skillType === 'arlem_fuego') {
      const rapierPalette =
        tier === 3
          ? ['#fde047', '#fbbf24', '#22d3ee', '#cffafe']
          : ['#22d3ee', '#67e8f9', '#cffafe', '#06b6d4'];
      const count = tier === 3 ? 20 : Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = tier === 3 ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 1.25;
        const speed = 3.0 + Math.random() * (4.6 + tier * 0.8);
        particles.push({
          x: enemyX - (tier === 3 ? 8 : 42) + (Math.random() - 0.5) * (tier === 3 ? 64 : 28),
          y: enemyY + (Math.random() - 0.5) * (tier === 3 ? 82 : 64),
          vx: Math.cos(angle) * speed * (tier === 3 ? 0.75 : i % 4 === 0 ? -0.55 : 1),
          vy: Math.sin(angle) * speed * 0.75,
          size: 2.2 + Math.random() * 2.8,
          life: tier === 3 ? -Math.random() * 20 : 0,
          maxLife: 18 + Math.random() * 12,
          color: rapierPalette[i % rapierPalette.length],
          trail: false,
          shape: i % 2 === 0 ? 'diamond' : 'star',
        });
      }
    } else if (skillType === 'arlem_rankup') {
      const goldPalette = ['#fbbf24', '#f59e0b', '#fef08a', '#fde047'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.85 + Math.random() * Math.PI * 1.15;
        const speed = 1.6 + Math.random() * (3.2 + tier * 0.6);
        particles.push({
          x: heroX + (Math.random() - 0.5) * 76,
          y: heroY + 26 + (Math.random() - 0.5) * 86,
          vx: Math.cos(angle) * speed * 0.55 + 0.35,
          vy: -(1.4 + Math.random() * (2.5 + tier * 0.5)),
          size: 2.0 + Math.random() * 3.2,
          life: -Math.random() * 10,
          maxLife: 28 + Math.random() * 18,
          color: goldPalette[i % goldPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'star' : 'diamond',
        });
      }
    } else if (skillType === 'arlem_curacion') {
      const emeraldPalette = ['#34d399', '#10b981', '#a7f3d0', '#6ee7b7'];
      const count = Math.round(26 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 84,
          y: heroY + 62 + (Math.random() - 0.5) * 34,
          vx: (Math.random() - 0.5) * 0.75,
          vy: -(1.8 + Math.random() * (2.7 + tier * 0.5)),
          size: 2.1 + Math.random() * 3.4,
          life: -Math.random() * 12,
          maxLife: 32 + Math.random() * 18,
          color: emeraldPalette[i % emeraldPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'star' : 'circle',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 1020;

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

    const drawHelixRibbon = (
      centerX: number,
      baseY: number,
      topY: number,
      progress: number,
      phaseOffset: number,
      radiusX: number,
      rgb: string,
      glowColor: string,
      alpha: number,
      lineWidth: number
    ) => {
      const segments = 26;
      ctx.save();
      ctx.beginPath();
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const localProgress = Math.max(0, Math.min(1, progress * 1.35 - t * 0.35));
        const y = baseY - (baseY - topY) * t * Math.min(1, progress * 1.35);
        const angle = t * Math.PI * 3.2 - progress * Math.PI * 4.5 + phaseOffset;
        const taper = Math.sin(t * Math.PI) * (0.65 + 0.35 * localProgress);
        const x = centerX + Math.sin(angle) * radiusX * taper;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
      ctx.lineWidth = Math.max(1, lineWidth * 0.35);
      ctx.stroke();
      ctx.restore();
    };

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (skillType === 'arlem_fuego') {
        // 1. Radial piercing impact glow (no straight horizontal lines)
        if (progress < 0.68) {
          const fp = progress / 0.68;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.68 + tier * 0.08);
          const impactX = enemyX - 12;
          const impactY = enemyY - 6;

          ctx.save();
          const radius = 48 + tier * 16;
          const grad = ctx.createRadialGradient(impactX, impactY, 2, impactX, impactY, radius);
          if (tier === 3) {
            grad.addColorStop(0, `rgba(254, 249, 195, ${flashAlpha})`);
            grad.addColorStop(0.45, `rgba(251, 191, 36, ${flashAlpha * 0.58})`);
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          } else {
            grad.addColorStop(0, `rgba(207, 250, 254, ${flashAlpha})`);
            grad.addColorStop(0.45, `rgba(34, 211, 238, ${flashAlpha * 0.62})`);
            grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(impactX, impactY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 2. Swirling curved wind-vortex rings (no straight lines)
        const vortexCount = tier === 3 ? 2 : tier === 2 ? 2 : 1;
        for (let v = 0; v < vortexCount; v++) {
          const start = 0.05 + v * 0.1;
          const span = 0.62;
          if (progress > start && progress < start + span) {
            const vp = (progress - start) / span;
            const ringX = tier === 3 ? enemyX - 18 + vp * 16 : enemyX - 66 + vp * 68;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              ringX,
              enemyY - 4,
              (tier === 3 ? 18 : 7) + vp * (tier === 3 ? 38 : 10),
              20 + vp * (34 + tier * 8),
              0.08,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              tier === 3
                ? `rgba(251, 191, 36, ${(1 - vp) * 0.64})`
                : `rgba(103, 232, 249, ${(1 - vp) * 0.72})`;
            ctx.lineWidth = (2.6 - v * 0.4) * (1 - vp * 0.45);
            ctx.shadowColor = tier === 3 ? '#fbbf24' : '#22d3ee';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        // 3. Curved ground shockwave ring for Tier >= 2
        if (tier >= 2 && progress > 0.04 && progress < 0.84) {
          const p = (progress - 0.04) / 0.8;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            18 + p * (60 + tier * 10),
            6 + p * (17 + tier * 2.5),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle =
            tier === 3
              ? `rgba(251, 191, 36, ${(1 - p) * 0.74})`
              : `rgba(34, 211, 238, ${(1 - p) * 0.72})`;
          ctx.lineWidth = 2.6 * (1 - p * 0.45);
          ctx.shadowColor = tier === 3 ? '#fbbf24' : '#22d3ee';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'arlem_rankup') {
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
              24 + p * (58 + tier * 11),
              7 + p * (17 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - p) * 0.72})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        const radialWaves = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < radialWaves; r++) {
          const start = 0.08 + r * 0.15;
          const span = 0.72;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.arc(heroX, heroY - 14, 18 + p * (68 + tier * 12), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(254, 240, 138, ${(1 - p) * 0.56})`;
            ctx.lineWidth = (2.6 - r * 0.35) * (1 - p * 0.5);
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (progress > 0.04 && progress < 0.92) {
          const ribbonAlpha = Math.sin(((progress - 0.04) / 0.88) * Math.PI) * (0.58 + tier * 0.1);
          const ribbonCount = tier === 3 ? 3 : 2;
          for (let h = 0; h < ribbonCount; h++) {
            drawHelixRibbon(
              heroX,
              heroY + 72,
              heroY - 122,
              progress,
              (h * Math.PI * 2) / ribbonCount,
              42 + tier * 6,
              h % 2 === 0 ? '251, 191, 36' : '254, 240, 138',
              '#f59e0b',
              ribbonAlpha,
              tier === 3 ? 3.0 : 2.3
            );
          }
        }
      } else if (skillType === 'arlem_curacion') {
        const ringCount = tier === 3 ? 3 : tier === 2 ? 2 : 1;
        for (let r = 0; r < ringCount; r++) {
          const start = 0.05 + r * 0.14;
          const span = 0.78;
          if (progress > start && progress < start + span) {
            const p = (progress - start) / span;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              heroX,
              heroY + 76,
              22 + p * (56 + tier * 10),
              7 + p * (16 + tier * 3),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(52, 211, 153, ${(1 - p) * 0.74})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (progress > 0.05 && progress < 0.94) {
          const ribbonAlpha = Math.sin(((progress - 0.05) / 0.89) * Math.PI) * (0.6 + tier * 0.1);
          const ribbonCount = tier === 3 ? 3 : 2;
          for (let h = 0; h < ribbonCount; h++) {
            drawHelixRibbon(
              heroX,
              heroY + 74,
              heroY - 126,
              progress,
              (h * Math.PI * 2) / ribbonCount,
              40 + tier * 5,
              h % 2 === 0 ? '52, 211, 153' : '167, 243, 208',
              '#10b981',
              ribbonAlpha,
              tier === 3 ? 3.0 : 2.4
            );
          }
        }
      }

      // Render shader particles
      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;
        pt.x += pt.vx;
        pt.y += pt.vy;

        if (skillType === 'arlem_curacion' || skillType === 'arlem_rankup') {
          pt.x += Math.sin(pt.life * 0.24) * 0.55;
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
          ctx.moveTo(prevX - pt.vx * 1.5, prevY - pt.vy * 1.5);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.68;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (pt.shape === 'star') {
          drawFourPointStar(pt.x, pt.y, pt.size * 0.92);
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
          ctx.arc(pt.x, pt.y, pt.size * 0.62, 0, Math.PI * 2);
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

  const estocadaShaderFilter =
    tier === 3
      ? 'url(#arlem-estocada-t3-shader)'
      : tier === 2
      ? 'url(#arlem-estocada-t2-shader)'
      : 'url(#arlem-estocada-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. ESTOCADA DE RAPIER (arlem_fuego): Living Kinetic Plasma Shader (warps corona AND subtly pulses blade wind!) */}
          <filter id="arlem-estocada-t1-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.1" numOctaves="2" seed="3" result="windNoise">
              <animate attributeName="baseFrequency" values="0.025 0.08; 0.065 0.18; 0.025 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="livingSlash" />
            <feMorphology in="livingSlash" operator="dilate" radius="2.0" result="dilated" />
            <feFlood floodColor="#22d3ee" floodOpacity="0.88" result="cyanColor" />
            <feComposite in="cyanColor" in2="dilated" operator="in" result="cyanRim" />
            <feGaussianBlur in="cyanRim" stdDeviation="2.6" result="cyanCorona" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="livingSlash" />
            </feMerge>
          </filter>

          <filter id="arlem-estocada-t2-shader" x="-28%" y="-28%" width="156%" height="156%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.11" numOctaves="2" seed="7" result="windNoise">
              <animate attributeName="baseFrequency" values="0.03 0.09; 0.075 0.2; 0.03 0.09" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale="4.4" xChannelSelector="R" yChannelSelector="G" result="livingSlash" />
            <feMorphology in="livingSlash" operator="dilate" radius="2.8" result="dilated" />
            <feFlood floodColor="#67e8f9" floodOpacity="0.94" result="cyanColor" />
            <feComposite in="cyanColor" in2="dilated" operator="in" result="cyanSilhouette" />
            <feGaussianBlur in="cyanSilhouette" stdDeviation="3.4" result="cyanCorona" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="livingSlash" />
            </feMerge>
          </filter>

          <filter id="arlem-estocada-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.08" numOctaves="1" seed="11" result="windNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.12; 0.02 0.06" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="windNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="livingSlash" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#fbbf24" floodOpacity="0.92" result="goldGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#22d3ee" floodOpacity="0.72" result="cyanRim" />
            <feMerge>
              <feMergeNode in="goldGlow" />
              <feMergeNode in="cyanRim" />
              <feMergeNode in="livingSlash" />
            </feMerge>
          </filter>

          {/* Specular Energy Core Sweep Shader for Attack Over-Pass */}
          <filter id="arlem-estocada-energy-sweep-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.4 0.8 1.2 0 0.15
                      0.9 1.3 1.5 0 0.28
                      1.1 1.4 1.6 0 0.35
                      0   0   0   0.95 0"
              result="hotCyan"
            />
            <feGaussianBlur in="hotCyan" stdDeviation="2.0" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotCyan" />
            </feMerge>
          </filter>

          {/* Golden-White Specular Energy Sweep Shader for Tier 3 Multi-Slash Over-Pass */}
          <filter id="arlem-estocada-gold-energy-sweep-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.45 1.0 0.3 0 0.24
                      1.2 1.05 0.35 0 0.18
                      0.5 0.6 0.5 0 0.08
                      0   0   0   0.96 0"
              result="hotGold"
            />
            <feGaussianBlur in="hotGold" stdDeviation="2.2" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotGold" />
            </feMerge>
          </filter>

          {/* Crisp Stylized Cartoony Rim-Glow Shaders for SLASH! Comic Onomatopoeias */}
          <filter id="arlem-slash-text-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.0" floodColor="#22d3ee" floodOpacity="0.92" result="cyanGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#cffafe" floodOpacity="0.95" result="iceRim" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-slash-gold-text-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#f59e0b" floodOpacity="0.95" result="goldGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fef08a" floodOpacity="0.95" result="lemonRim" />
            <feMerge>
              <feMergeNode in="goldGlow" />
              <feMergeNode in="lemonRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2. INSPIRACIÓN BÁRDICA (arlem_rankup): AAA Golden Harmonic Aura Shader ON Hero Sprite */}
          <filter id="arlem-buff-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.07" numOctaves="2" seed="3" result="waveNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.11; 0.02 0.06" dur="0.38s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="waveNoise" scale="4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#fbbf24" floodOpacity="0.88" result="goldColor" />
            <feComposite in="goldColor" in2="wavyAura" operator="in" result="goldAura" />
            <feGaussianBlur in="goldAura" stdDeviation="3.4" result="goldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#fef08a" floodOpacity="0.7" result="crispRim" />
            <feMerge>
              <feMergeNode in="goldCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-buff-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="2" seed="7" result="waveNoise">
              <animate attributeName="baseFrequency" values="0.025 0.07; 0.055 0.13; 0.025 0.07" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="waveNoise" scale="5.5" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.95" result="goldColor" />
            <feComposite in="goldColor" in2="wavyAura" operator="in" result="goldAura" />
            <feGaussianBlur in="goldAura" stdDeviation="4.8" result="goldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fef08a" floodOpacity="0.88" result="crispRim" />
            <feMerge>
              <feMergeNode in="goldCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-buff-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="3" seed="11" result="waveNoise">
              <animate attributeName="baseFrequency" values="0.03 0.08; 0.068 0.16; 0.03 0.08" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="waveNoise" scale="7.5" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f59e0b" floodOpacity="1" result="amberColor" />
            <feComposite in="amberColor" in2="wavyAura" operator="in" result="amberAura" />
            <feGaussianBlur in="amberAura" stdDeviation="6.5" result="outerCorona" />
            <feFlood floodColor="#fef08a" floodOpacity="0.95" result="innerGoldColor" />
            <feComposite in="innerGoldColor" in2="dilated" operator="in" result="innerRim" />
            <feGaussianBlur in="innerRim" stdDeviation="1.5" result="innerRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="innerRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-buff-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="15" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#fef08a" floodOpacity="0.95" result="goldFlood" />
            <feComposite in="goldFlood" in2="rippledRim" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldBloom" />
            <feMerge>
              <feMergeNode in="goldBloom" />
              <feMergeNode in="goldRim" />
            </feMerge>
          </filter>

          {/* 3. BALADA SERENA (arlem_curacion): AAA Mint-Emerald Sanctuary Aura Shader ON Hero Sprite */}
          <filter id="arlem-heal-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.022 0.065" numOctaves="2" seed="4" result="liquidNoise">
              <animate attributeName="baseFrequency" values="0.018 0.055; 0.038 0.105; 0.018 0.055" dur="0.42s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="liquidNoise" scale="4" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#34d399" floodOpacity="0.88" result="emeraldColor" />
            <feComposite in="emeraldColor" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="3.5" result="emeraldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#a7f3d0" floodOpacity="0.72" result="crispRim" />
            <feMerge>
              <feMergeNode in="emeraldCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-heal-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.028 0.075" numOctaves="2" seed="8" result="liquidNoise">
              <animate attributeName="baseFrequency" values="0.022 0.065; 0.048 0.125; 0.022 0.065" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="liquidNoise" scale="5.5" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#10b981" floodOpacity="0.95" result="emeraldColor" />
            <feComposite in="emeraldColor" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="5.0" result="emeraldCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#a7f3d0" floodOpacity="0.88" result="crispRim" />
            <feMerge>
              <feMergeNode in="emeraldCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-heal-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.4" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.032 0.088" numOctaves="3" seed="14" result="liquidNoise">
              <animate attributeName="baseFrequency" values="0.026 0.075; 0.058 0.145; 0.026 0.075" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="liquidNoise" scale="7.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#10b981" floodOpacity="1" result="emeraldColor" />
            <feComposite in="emeraldColor" in2="wavyAura" operator="in" result="emeraldAura" />
            <feGaussianBlur in="emeraldAura" stdDeviation="6.8" result="outerCorona" />
            <feFlood floodColor="#a7f3d0" floodOpacity="0.95" result="innerMintColor" />
            <feComposite in="innerMintColor" in2="dilated" operator="in" result="innerRim" />
            <feGaussianBlur in="innerRim" stdDeviation="1.5" result="innerRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="innerRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arlem-heal-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="turbulence" baseFrequency="0.022 0.13" numOctaves="2" seed="19" result="sanctuaryNoise">
              <animate attributeName="baseFrequency" values="0.018 0.11; 0.04 0.2; 0.018 0.11" dur="0.38s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="sanctuaryNoise" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#a7f3d0" floodOpacity="0.95" result="mintFlood" />
            <feComposite in="mintFlood" in2="rippledRim" operator="in" result="mintRim" />
            <feGaussianBlur in="mintRim" stdDeviation="1.6" result="mintBloom" />
            <feMerge>
              <feMergeNode in="mintBloom" />
              <feMergeNode in="mintRim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
          <div
          ref={containerRef}
          key={`arlem-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. ESTOCADA DE RAPIER (arlem_fuego): Barrido supersónico + destello + vibración cinética */
            @keyframes arlemEstocadaThrustAAA {
              0% {
                transform: translateX(-64px) scaleX(0.28) scaleY(0.76);
                clip-path: inset(0 85% 0 0);
                opacity: 0;
              }
              15% {
                transform: translateX(10px) scaleX(1.16) scaleY(1.06);
                clip-path: inset(0 0% 0 0);
                opacity: 1;
              }
              28% {
                transform: translateX(-2px) scaleX(0.96) scaleY(1.02) skewX(-4deg);
                clip-path: inset(0 0% 0 0);
                opacity: 1;
              }
              46% {
                transform: translateX(5px) scaleX(1.04) scaleY(0.98) skewX(2deg);
                clip-path: inset(0 0% 0 0);
                opacity: 0.96;
              }
              74% {
                transform: translateX(10px) scaleX(1.06) scaleY(0.96);
                clip-path: inset(0 0% 0 18%);
                opacity: 0.82;
              }
              100% {
                transform: translateX(28px) scaleX(1.18) scaleY(0.86);
                clip-path: inset(0 0% 0 100%);
                opacity: 0;
              }
            }

            /* Specular Hot-Core Sweep traveling along the rapier slash */
            @keyframes arlemEstocadaEnergySweep {
              0% {
                opacity: 0;
                -webkit-mask-position: 120% 0%;
                mask-position: 120% 0%;
              }
              20% {
                opacity: 1;
              }
              75% {
                opacity: 0.85;
              }
              100% {
                opacity: 0;
                -webkit-mask-position: -30% 0%;
                mask-position: -30% 0%;
              }
            }

            /* Tier 3 ("Dorado"): Tajos limpios cartoony estilo Vergil sin recortes de clip-path */
            @keyframes arlemVergilTajoSliceAAA {
              0% {
                transform: translateX(-16px) scaleX(0.45) scaleY(0.76);
                opacity: 0;
              }
              24% {
                transform: translateX(2px) scaleX(1.06) scaleY(1.04);
                opacity: 1;
              }
              62% {
                transform: translateX(6px) scaleX(1.0) scaleY(0.98);
                opacity: 0.94;
              }
              100% {
                transform: translateX(12px) scaleX(1.08) scaleY(0.84);
                opacity: 0;
              }
            }

            /* Comic SLASH! Pop Onomatopeya Cartoony (Tier 1, 2 & 3) */
            @keyframes arlemSlashPopCartoony {
              0% {
                transform: scale(0.28) rotate(-14deg);
                opacity: 0;
              }
              24% {
                transform: scale(1.16) rotate(4deg);
                opacity: 1;
              }
              42% {
                transform: scale(0.96) rotate(-2deg);
                opacity: 1;
              }
              74% {
                transform: scale(1.02) rotate(1deg);
                opacity: 0.96;
              }
              100% {
                transform: translateY(-10px) scale(1.1) rotate(5deg);
                opacity: 0;
              }
            }

            /* 2. AURA LUMINOSA PARA BUFOS Y CURACIONES */
            @keyframes arlemAuraPillarBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              22% { transform: scaleX(1.06) scaleY(1.04); opacity: 0.95; }
              58% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.85; }
              100% { transform: scaleX(1.18) scaleY(1.1); opacity: 0; }
            }
          `}</style>

          {/* Real-time 60fps AAA Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* ================================================================= */}
          {/* 1. ESTOCADA DE RAPIER (arlem_fuego): Tier 1 & 2 sprites + SLASH!; */}
          {/*    Tier 3 ("Dorado") dispara tajos clean + varias onomatopeyas    */}
          {/* ================================================================= */}
          {skillType === 'arlem_fuego' && tier !== 3 && (
            <>
              <div
                className={`absolute flex items-center justify-center pointer-events-none z-15 ${
                  tier === 2
                    ? 'right-[5.5%] bottom-[25%] w-[172px] h-[126px]'
                    : 'right-[6.5%] bottom-[28%] w-[156px] h-[90px]'
                }`}
              >
                {/* Layer A: Animated Turbulent Plasma Body + Corona */}
                <img
                  src={estocadaSpriteUrl}
                  alt="Estocada de Rapier"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[arlemEstocadaThrustAAA_0.94s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: estocadaShaderFilter }}
                />
                {/* Layer B: Traveling Specular Energy Glint Pass */}
                <img
                  src={estocadaSpriteUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    mixBlendMode: 'screen',
                    filter: 'url(#arlem-estocada-energy-sweep-shader)',
                    WebkitMaskImage:
                      'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                    maskImage:
                      'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                    WebkitMaskSize: '230% 100%',
                    maskSize: '230% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation:
                      'arlemEstocadaThrustAAA 0.94s cubic-bezier(0.16,1,0.3,1) forwards, arlemEstocadaEnergySweep 0.78s ease-out forwards',
                  }}
                />
              </div>

              {/* Onomatopeya Comic SLASH! en Tier 1 y Tier 2 */}
              <div
                className={`absolute flex items-center justify-center pointer-events-none z-20 ${
                  tier === 2
                    ? 'right-[5%] bottom-[51%] w-[142px] h-[72px]'
                    : 'right-[6%] bottom-[50%] w-[122px] h-[62px]'
                }`}
              >
                <img
                  src="/assets/combat/arlem_vfx_slash.png"
                  alt="SLASH!"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[arlemSlashPopCartoony_0.82s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                  style={{ filter: 'url(#arlem-slash-text-shader)' }}
                />
              </div>
            </>
          )}

          {skillType === 'arlem_fuego' && tier === 3 && (
            <>
              <div className="absolute right-[7.5%] bottom-[22%] w-[188px] h-[165px] flex items-center justify-center pointer-events-none z-15 overflow-visible">
                {triggeredTajos.map((idx) => {
                  const tajo = VERGIL_TIER3_TAJOS[idx];
                  if (!tajo) return null;
                  return (
                    <div
                      key={`arlem-vergil-tajo-${vfxKey}-${idx}`}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
                      style={{
                        transform: `translate(${tajo.x}px, ${tajo.y}px) rotate(${tajo.angle}deg) scale(${tajo.scale}) ${tajo.flipY ? 'scaleY(-1)' : ''}`,
                      }}
                    >
                      <div className="relative w-[144px] h-[64px] flex items-center justify-center overflow-visible animate-[arlemVergilTajoSliceAAA_0.38s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                        {/* Layer A: Sprite cartoony limpio con shader dorado/cian */}
                        <img
                          src={estocadaSpriteUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          style={{ filter: estocadaShaderFilter }}
                        />
                        {/* Layer B: Barrido especular dorado aditivo */}
                        <img
                          src={estocadaSpriteUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          style={{
                            mixBlendMode: 'screen',
                            filter: 'url(#arlem-estocada-gold-energy-sweep-shader)',
                            WebkitMaskImage:
                              'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                            maskImage:
                              'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                            WebkitMaskSize: '230% 100%',
                            maskSize: '230% 100%',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            animation: 'arlemEstocadaEnergySweep 0.34s ease-out forwards',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Varias onomatopeyas SLASH! escalonadas estilo cómic */}
              {triggeredOnos.map((idx) => {
                const ono = VERGIL_TIER3_ONOS[idx];
                if (!ono) return null;
                return (
                  <div
                    key={`arlem-vergil-ono-${vfxKey}-${idx}`}
                    className="absolute flex items-center justify-center pointer-events-none z-20"
                    style={{
                      right: `${ono.rightPct}%`,
                      bottom: `${ono.bottomPct}%`,
                      width: `${ono.widthPx}px`,
                      height: `${Math.round(ono.widthPx * 0.54)}px`,
                      transform: `rotate(${ono.rotateDeg}deg)`,
                    }}
                  >
                    <img
                      src={
                        ono.isGold
                          ? '/assets/combat/arlem_vfx_slash_gold.png'
                          : '/assets/combat/arlem_vfx_slash.png'
                      }
                      alt="SLASH!"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[arlemSlashPopCartoony_0.46s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
                      style={{
                        filter: ono.isGold
                          ? 'url(#arlem-slash-gold-text-shader)'
                          : 'url(#arlem-slash-text-shader)',
                      }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* ================================================================= */}
          {/* 2. INSPIRACIÓN BÁRDICA (arlem_rankup): Aura Shader Dorada         */}
          {/* ================================================================= */}
          {skillType === 'arlem_rankup' && (
            <div
              className="absolute left-[4.5%] bottom-[4%] w-[200px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[arlemAuraPillarBloom_0.98s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    tier === 3
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(254,240,138,0.52) 0%, rgba(251,191,36,0.34) 38%, rgba(245,158,11,0.12) 64%, transparent 78%)'
                      : tier === 2
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(254,240,138,0.4) 0%, rgba(251,191,36,0.26) 38%, rgba(245,158,11,0.09) 62%, transparent 76%)'
                      : 'radial-gradient(ellipse at 50% 64%, rgba(251,191,36,0.34) 0%, rgba(245,158,11,0.18) 40%, transparent 72%)',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. BALADA SERENA (arlem_curacion): Aura Shader Verde Menta        */}
          {/* ================================================================= */}
          {skillType === 'arlem_curacion' && (
            <div
              className="absolute left-[4.5%] bottom-[4%] w-[200px] h-[295px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[arlemAuraPillarBloom_0.98s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    tier === 3
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(167,243,208,0.52) 0%, rgba(52,211,153,0.34) 38%, rgba(16,185,129,0.12) 64%, transparent 78%)'
                      : tier === 2
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(167,243,208,0.4) 0%, rgba(52,211,153,0.26) 38%, rgba(16,185,129,0.09) 62%, transparent 76%)'
                      : 'radial-gradient(ellipse at 50% 64%, rgba(52,211,153,0.34) 0%, rgba(16,185,129,0.18) 40%, transparent 72%)',
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
