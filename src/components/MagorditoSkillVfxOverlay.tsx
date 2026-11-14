import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef } from 'react';

export interface MagorditoSkillVfxOverlayProps {
  skillType: string | null;
  tier?: 1 | 2 | 3;
  enemySpriteUrl?: string | null;
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

export const MagorditoSkillVfxOverlay: React.FC<MagorditoSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  enemySpriteUrl,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isActiveSkill =
    skillType === 'rayo_necrotico' ||
    skillType === 'drenar_maldiciones' ||
    skillType === 'fortalecer_marioneta';

  // Tier-specific bespoke cartoon sprites (clean & distinct per tier, zero visual clutter)
  const rayoSpriteUrl =
    tier === 3
      ? '/assets/combat/magordito_vfx_rayo_t3.png'
      : tier === 2
      ? '/assets/combat/magordito_vfx_rayo_t2.png'
      : '/assets/combat/magordito_vfx_rayo.png';

  const impactSpriteUrl =
    tier === 3
      ? '/assets/combat/magordito_vfx_impacto_aqua_t3.png'
      : tier === 2
      ? '/assets/combat/magordito_vfx_impacto_aqua_t2.png'
      : '/assets/combat/magordito_vfx_impacto_aqua.png';

  // Real-time 60fps Canvas AAA shader-grade particle, lightning-arc, shockwave & siphon engine
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

    const { enemyX, enemyY } = resolveEnemyVfxFrame(enemyFrame, width, height);
    const heroHandX = width * 0.25;
    const countMult = tier === 3 ? 1.35 : tier === 2 ? 1.18 : 1.0;

    // Signature aquamarine/teal/mint palette preserved across all 3 tiers
    const tierPalette =
      tier === 3
        ? ['#99f6e4', '#5eead4', '#2dd4bf', '#ccfbf1']
        : tier === 2
        ? ['#5eead4', '#2dd4bf', '#99f6e4', '#ccfbf1']
        : ['#5eead4', '#2dd4bf', '#14b8a6', '#ccfbf1'];

    const particles: CanvasParticle[] = [];

    if (skillType === 'rayo_necrotico') {
      const sparkCount = Math.round(20 * countMult);
      for (let i = 0; i < sparkCount; i++) {
        const angle = -Math.PI + Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * (4.8 + tier * 0.7);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 40,
          y: enemyY + (Math.random() - 0.5) * 80,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 2 + Math.random() * 3.4,
          life: 0,
          maxLife: 22 + Math.random() * 20,
          color: tierPalette[i % tierPalette.length],
          trail: true,
          shape: tier >= 2 && i % 4 === 0 ? 'diamond' : 'circle',
        });
      }
    } else if (skillType === 'fortalecer_marioneta') {
      const burstCount = Math.round(18 * countMult);
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.22;
        const speed = 2.8 + Math.random() * (4.5 + tier * 0.7);
        particles.push({
          x: enemyX - 4,
          y: enemyY - 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.2 + Math.random() * 3.2,
          life: 0,
          maxLife: 16 + Math.random() * 16,
          color: tierPalette[i % tierPalette.length],
          trail: true,
          shape: tier === 3 && i % 3 === 0 ? 'star' : 'circle',
        });
      }
    } else if (skillType === 'drenar_maldiciones') {
      const wispCount = Math.round(22 * countMult);
      for (let i = 0; i < wispCount; i++) {
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 46,
          y: enemyY + (Math.random() - 0.5) * 84,
          vx: (heroHandX - enemyX) / (25 + Math.random() * 13),
          vy: (Math.random() - 0.5) * 2.2,
          size: 2.8 + Math.random() * (tier === 3 ? 4.8 : 4.2),
          life: -Math.random() * 12,
          maxLife: 32 + Math.random() * 18,
          color: i % 3 === 0 ? '#5eead4' : i % 2 === 0 ? '#2dd4bf' : '#34d399',
          trail: true,
          shape: tier === 3 && i % 5 === 0 ? 'star' : 'circle',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 1020;

    const drawFourPointStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r * 1.4 : r * 0.42;
        const a = (i * Math.PI) / 4;
        const sx = cx + Math.cos(a) * rad;
        const sy = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawLightningBranch = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      alpha: number,
      lineWidth: number
    ) => {
      const steps = 6;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const jitter = (1 - Math.abs(t - 0.5) * 1.4) * 22;
        const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter;
        const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 9;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(94, 234, 212, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 14;
      ctx.stroke();

      ctx.strokeStyle = `rgba(224, 254, 251, ${alpha * 0.9})`;
      ctx.lineWidth = Math.max(1, lineWidth * 0.42);
      ctx.stroke();
      ctx.restore();
    };

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      // Subtle procedural accents balanced so sprites stay crisp and never oversaturated
      if (skillType === 'rayo_necrotico') {
        const impactWindow = progress > 0.1 && progress < 0.72;
        if (impactWindow) {
          const arcAlpha = Math.sin(((progress - 0.1) / 0.62) * Math.PI) * 0.68;
          drawLightningBranch(enemyX - 24, 14, enemyX - 6, enemyY + 32, arcAlpha, 2.2);
          if (tier >= 2) {
            drawLightningBranch(enemyX + 28, 18, enemyX + 12, enemyY + 28, arcAlpha * 0.85, 2.0);
          }
          if (tier === 3 && Math.random() < 0.55) {
            drawLightningBranch(
              enemyX,
              enemyY + 18,
              enemyX + (Math.random() - 0.5) * 95,
              enemyY + 50,
              arcAlpha * 0.75,
              1.8
            );
          }
        }

        if (progress > 0.18 && progress < 0.84) {
          const ringP = (progress - 0.18) / 0.66;
          const ringAlpha = (1 - ringP) * 0.65;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(enemyX, enemyY + 52, 24 + ringP * (66 + tier * 10), 7 + ringP * (18 + tier * 3), 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(94, 234, 212, ${ringAlpha})`;
          ctx.lineWidth = 2.6 * (1 - ringP * 0.45);
          ctx.shadowColor = '#2dd4bf';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'fortalecer_marioneta') {
        if (progress > 0.14 && progress < 0.8) {
          const p = (progress - 0.14) / 0.66;
          const alpha = (1 - p) * 0.72;
          ctx.save();
          ctx.beginPath();
          ctx.arc(enemyX - 4, enemyY - 10, 14 + p * (48 + tier * 8), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
          ctx.lineWidth = (3 + tier * 0.6) * (1 - p * 0.55);
          ctx.shadowColor = '#2dd4bf';
          ctx.shadowBlur = 14;
          ctx.stroke();

          if (tier >= 2 && p > 0.16) {
            const p2 = (p - 0.16) / 0.84;
            ctx.beginPath();
            ctx.arc(enemyX - 4, enemyY - 10, 10 + p2 * 40, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(153, 246, 228, ${(1 - p2) * 0.65})`;
            ctx.lineWidth = 2.0;
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (skillType === 'drenar_maldiciones') {
        if (progress > 0.1 && progress < 0.92) {
          const p = (progress - 0.1) / 0.82;
          const alpha = Math.sin(p * Math.PI) * (0.45 + tier * 0.1);
          const streamCount = tier === 3 ? 5 : tier === 2 ? 4 : 3;
          for (let r = 0; r < streamCount; r++) {
            const waveX = enemyX + (heroHandX - enemyX) * ((p * 1.15 + r * (1 / streamCount)) % 1);
            const curveY =
              enemyY -
              8 +
              Math.sin((p + r * 0.25) * Math.PI * (tier === 3 ? 4 : 3)) * (15 + tier * 2.5) -
              r * 7;
            ctx.save();
            ctx.beginPath();
            ctx.arc(waveX, curveY, 7 + r * 2 + tier * 1.2, 0, Math.PI * 2);
            ctx.fillStyle =
              r % 2 === 0
                ? `rgba(94, 234, 212, ${alpha * 0.52})`
                : `rgba(16, 185, 129, ${alpha * 0.48})`;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 16;
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Render particles
      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (skillType === 'drenar_maldiciones') {
          pt.vy += Math.sin(pt.life * 0.35) * 0.35;
        } else {
          pt.vx *= 0.94;
          pt.vy *= 0.94;
        }

        const lifeFrac = pt.life / pt.maxLife;
        const pAlpha = Math.sin(lifeFrac * Math.PI);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, pAlpha * 0.9));
        ctx.strokeStyle = pt.color;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 9;

        if (pt.trail) {
          ctx.beginPath();
          ctx.moveTo(prevX - pt.vx * 1.4, prevY - pt.vy * 1.4);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.7;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        if (pt.shape === 'star') {
          drawFourPointStar(pt.x, pt.y, pt.size * 0.9);
        } else if (pt.shape === 'diamond') {
          const r = pt.size * 0.9;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.3);
          ctx.lineTo(pt.x + r * 0.8, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.3);
          ctx.lineTo(pt.x - r * 0.8, pt.y);
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

  // Balanced SVG shaders (preserve crisp cartoon outlines & colors without oversaturating)
  const rayoShaderFilter =
    tier === 3
      ? 'url(#magordito-electric-tier3-shader)'
      : tier === 2
      ? 'url(#magordito-electric-tier2-shader)'
      : 'url(#magordito-electric-warp-shader)';

  const impactShaderFilter =
    tier === 3
      ? 'url(#magordito-chromatic-tier3-shader)'
      : tier === 2
      ? 'url(#magordito-chromatic-tier2-shader)'
      : 'url(#magordito-chromatic-impact-shader)';

  const soulShaderFilter =
    tier === 3 ? 'url(#magordito-soul-ripple-tier3-shader)' : 'url(#magordito-soul-ripple-shader)';

  return (
    <>
      {/* SVG Shader Definitions: always mounted for Magordito so enemy sprite shader filter resolves cleanly */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1A. Electric Plasma Turbulence Shader (Tier 1) */}
          <filter id="magordito-electric-warp-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.07" numOctaves="2" seed="5" result="noise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.11; 0.02 0.06" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="warped" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#2dd4bf" floodOpacity="0.6" result="aquaGlow" />
            <feMerge>
              <feMergeNode in="aquaGlow" />
              <feMergeNode in="warped" />
            </feMerge>
          </filter>

          {/* 1B. Electric Plasma Shader (Tier 2 - slightly crisper rim & wave) */}
          <filter id="magordito-electric-tier2-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="2" seed="7" result="noise">
              <animate attributeName="baseFrequency" values="0.025 0.07; 0.055 0.13; 0.025 0.07" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7.5" xChannelSelector="R" yChannelSelector="G" result="warped" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#5eead4" floodOpacity="0.72" result="aquaRim" />
            <feMerge>
              <feMergeNode in="aquaRim" />
              <feMergeNode in="warped" />
            </feMerge>
          </filter>

          {/* 1C. Electric Plasma Shader (Tier 3 - high-frequency storm ripple & clean aqua halo) */}
          <filter id="magordito-electric-tier3-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="11" result="noise">
              <animate attributeName="baseFrequency" values="0.03 0.08; 0.065 0.15; 0.03 0.08" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" result="warped" />
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2dd4bf" floodOpacity="0.82" result="aquaRim" />
            <feMerge>
              <feMergeNode in="aquaRim" />
              <feMergeNode in="warped" />
            </feMerge>
          </filter>

          {/* 2A. Sharp Crisp Impact Shader (Tier 1 - zero offset ghosting) */}
          <filter id="magordito-chromatic-impact-shader" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#2dd4bf" floodOpacity="0.55" result="aquaGlow" />
            <feMerge>
              <feMergeNode in="aquaGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2B. Sharp Crisp Impact Shader (Tier 2 - stronger aqua rim & crisp contrast, zero blur/ghosts) */}
          <filter id="magordito-chromatic-tier2-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#5eead4" floodOpacity="0.8" result="aquaRim" />
            <feMerge>
              <feMergeNode in="aquaRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2C. Sharp Crisp Impact Shader (Tier 3 - vibrant double aqua halo, zero blurry duplicate offsets) */}
          <filter id="magordito-chromatic-tier3-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#2dd4bf" floodOpacity="0.95" result="outerAquaHalo" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#ccfbf1" floodOpacity="0.85" result="innerMintRim" />
            <feMerge>
              <feMergeNode in="outerAquaHalo" />
              <feMergeNode in="innerMintRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3A. Drenar Maldiciones: Spectral Liquid Ripple & Aquamarine Translucency Shader (Tier 1 & 2) */}
          <filter id="magordito-soul-ripple-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.065" numOctaves="2" seed="3" result="soulNoise">
              <animate attributeName="baseFrequency" values="0.02 0.05; 0.045 0.11; 0.02 0.05" dur="0.42s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="soulNoise" scale="13" xChannelSelector="R" yChannelSelector="G" result="rippled" />
            <feColorMatrix
              in="rippled"
              type="matrix"
              values="
                0.08 0.18 0.12 0 0.05
                0.35 0.95 0.65 0 0.15
                0.28 0.85 0.72 0 0.12
                0    0    0    0.52 0"
              result="aquaSpectral"
            />
            <feGaussianBlur in="aquaSpectral" stdDeviation="2.2" result="spectralGlow" />
            <feMerge>
              <feMergeNode in="spectralGlow" />
              <feMergeNode in="aquaSpectral" />
            </feMerge>
          </filter>

          {/* 3B. Drenar Maldiciones Tier 3: Deeper Aquamarine Spectral Wave */}
          <filter id="magordito-soul-ripple-tier3-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="turbulence" baseFrequency="0.032 0.085" numOctaves="3" seed="9" result="soulNoise">
              <animate attributeName="baseFrequency" values="0.025 0.06; 0.065 0.15; 0.025 0.06" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="soulNoise" scale="17" xChannelSelector="R" yChannelSelector="G" result="rippled" />
            <feColorMatrix
              in="rippled"
              type="matrix"
              values="
                0.10 0.22 0.15 0 0.08
                0.42 1.0  0.75 0 0.2
                0.34 0.92 0.82 0 0.16
                0    0    0    0.58 0"
              result="aquaSpectral"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="3.8" floodColor="#5eead4" floodOpacity="0.82" result="aquaRim" />
            <feMerge>
              <feMergeNode in="aquaRim" />
              <feMergeNode in="aquaSpectral" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {isActiveSkill && (
        <div
          ref={containerRef}
          key={`magordito-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-hidden select-none"
        >
          <style>{`
            /* 1. RAYO VOLTAICO: Impacto eléctrico AAA con almas y sprite único por tier */
            @keyframes magorditoRayoStrikeAAA {
              0% { transform: translateY(-115px) scaleY(0.32) scaleX(0.78); opacity: 0; }
              16% { transform: translateY(-5px) scaleY(1.08) scaleX(1.03); opacity: 1; }
              28% { transform: translateY(3px) scaleY(1.12) scaleX(1.05); opacity: 1; }
              42% { transform: translateY(0px) scaleY(0.96) scaleX(1.0) skewX(2.5deg); opacity: 0.84; }
              58% { transform: translateY(-2px) scaleY(1.05) scaleX(0.98) skewX(-2deg); opacity: 1; }
              80% { transform: translateY(2px) scaleY(1.0) scaleX(1.02); opacity: 0.9; }
              100% { transform: translateY(12px) scaleY(0.84) scaleX(1.1); opacity: 0; }
            }

            @keyframes magorditoRayoGroundRingAAA {
              0% { transform: scale(0.2); opacity: 0; }
              22% { transform: scale(1.0); opacity: 0.85; }
              72% { transform: scale(1.25); opacity: 0.45; }
              100% { transform: scale(1.55); opacity: 0; }
            }

            /* 2. DRENAR MALDICIONES: Ecos espectrales del sprite enemigo */
            @keyframes magorditoEnemyGhostPeelA {
              0% { transform: translateX(0px) scale(1); opacity: 0; }
              18% { transform: translateX(-10px) scale(1.03); opacity: 0.85; }
              56% { transform: translateX(-68px) translateY(-10px) scale(0.92) skewX(-6deg); opacity: 0.58; }
              100% { transform: translateX(-148px) translateY(-18px) scale(0.54) skewX(-10deg); opacity: 0; }
            }

            @keyframes magorditoEnemyGhostPeelB {
              0% { transform: translateX(0px) scale(1); opacity: 0; }
              26% { transform: translateX(-6px) scale(1.01); opacity: 0.65; }
              65% { transform: translateX(-48px) translateY(-6px) scale(0.94) skewX(-4deg); opacity: 0.42; }
              100% { transform: translateX(-120px) translateY(-14px) scale(0.6) skewX(-8deg); opacity: 0; }
            }

            @keyframes magorditoEnemyGhostPeelC {
              0% { transform: translateX(0px) scale(1); opacity: 0; }
              22% { transform: translateX(-14px) translateY(-8px) scale(1.04); opacity: 0.72; }
              62% { transform: translateX(-92px) translateY(-16px) scale(0.86) skewX(-8deg); opacity: 0.48; }
              100% { transform: translateX(-178px) translateY(-22px) scale(0.45) skewX(-12deg); opacity: 0; }
            }

            @keyframes magorditoSiphonVortexSpin {
              0% { transform: scale(0.35) rotate(0deg); opacity: 0; }
              25% { transform: scale(1.05) rotate(110deg); opacity: 0.9; }
              75% { transform: scale(0.95) rotate(280deg); opacity: 0.7; }
              100% { transform: scale(1.28) rotate(400deg); opacity: 0; }
            }

            /* 3. PUÑETAZO (fortalecer_marioneta): Impacto compacto + BONK! dejando ver parte del enemigo */
            @keyframes magorditoPunchImpactAAA {
              0% { transform: scale(0.2) rotate(-14deg); opacity: 0; }
              20% { transform: scale(1.1) rotate(4deg); opacity: 0.94; }
              38% { transform: scale(0.96) rotate(-2deg); opacity: 0.92; }
              64% { transform: scale(1.05) rotate(2deg); opacity: 0.85; }
              100% { transform: scale(1.22) rotate(6deg); opacity: 0; }
            }

            @keyframes magorditoBonkPopAAA {
              0% { transform: translate(16px, 22px) scale(0.15) rotate(-18deg); opacity: 0; }
              22% { transform: translate(-6px, -10px) scale(1.16) rotate(-4deg); opacity: 1; }
              36% { transform: translate(2px, 2px) scale(0.95) rotate(-7deg); opacity: 1; }
              52% { transform: translate(-1px, -3px) scale(1.04) rotate(-5deg); opacity: 1; }
              82% { transform: translate(0px, -7px) scale(1.0) rotate(-5deg); opacity: 0.96; }
              100% { transform: translate(0px, -20px) scale(0.84) rotate(-2deg); opacity: 0; }
            }

            @keyframes magorditoBonkPopEpicT3 {
              0% { transform: translate(18px, 24px) scale(0.14) rotate(-20deg); opacity: 0; filter: brightness(1.45); }
              20% { transform: translate(-8px, -14px) scale(1.24) rotate(-3deg); opacity: 1; filter: brightness(1.25); }
              34% { transform: translate(3px, 2px) scale(0.95) rotate(-8deg); opacity: 1; filter: brightness(1.08); }
              50% { transform: translate(-2px, -4px) scale(1.08) rotate(-5deg); opacity: 1; filter: brightness(1.12); }
              82% { transform: translate(0px, -8px) scale(1.02) rotate(-5deg); opacity: 0.98; filter: brightness(1.02); }
              100% { transform: translate(0px, -22px) scale(0.86) rotate(-2deg); opacity: 0; }
            }
          `}</style>

          {/* Real-time 60fps Canvas Shader Particle & Arc Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          />

          {/* ================================================================= */}
          {/* 1. RAYO VOLTAICO: Sprite distinto por Tier 1 / 2 / 3               */}
          {/* ================================================================= */}
          {skillType === 'rayo_necrotico' && (
            <div
              className={`absolute right-[1.5%] bottom-[17%] flex items-end justify-center pointer-events-none z-10 ${
                tier === 3
                  ? 'w-[252px] h-[348px]'
                  : tier === 2
                  ? 'w-[234px] h-[324px]'
                  : 'w-[214px] h-[298px]'
              }`}
            >
              <div
                className={`absolute bottom-[8px] rounded-full border-2 animate-[magorditoRayoGroundRingAAA_0.95s_ease-out_forwards] ${
                  tier === 3
                    ? 'w-[210px] h-[52px] border-[#99f6e4] bg-[#2dd4bf]/18 shadow-[0_0_24px_#2dd4bf]'
                    : tier === 2
                    ? 'w-[195px] h-[48px] border-[#5eead4] bg-[#2dd4bf]/15 shadow-[0_0_20px_#5eead4]'
                    : 'w-[175px] h-[42px] border-[#5eead4] bg-[#2dd4bf]/14 shadow-[0_0_18px_#2dd4bf]'
                }`}
              />

              <img
                src={rayoSpriteUrl}
                alt="Rayo Eléctrico con Almas"
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-contain animate-[magorditoRayoStrikeAAA_0.98s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: rayoShaderFilter }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. DRENAR MALDICIONES: Solo sprite enemigo (Tier 1 / 2 / 3)       */}
          {/* ================================================================= */}
          {skillType === 'drenar_maldiciones' && enemySpriteUrl && (
            <>
              <div className="absolute right-[5%] bottom-[21%] w-[145px] h-[195px] flex items-end justify-center pointer-events-none z-10">
                <img
                  src={enemySpriteUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-auto object-contain animate-[magorditoEnemyGhostPeelA_0.96s_cubic-bezier(0.22,1,0.36,1)_forwards]"
                  style={{ filter: soulShaderFilter }}
                />
              </div>
              <div className="absolute right-[5%] bottom-[21%] w-[145px] h-[195px] flex items-end justify-center pointer-events-none z-10">
                <img
                  src={enemySpriteUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-auto object-contain animate-[magorditoEnemyGhostPeelB_0.96s_cubic-bezier(0.22,1,0.36,1)_0.08s_forwards]"
                  style={{ filter: soulShaderFilter }}
                />
              </div>

              {tier >= 2 && (
                <>
                  <div className="absolute right-[5%] bottom-[21%] w-[145px] h-[195px] flex items-end justify-center pointer-events-none z-10">
                    <img
                      src={enemySpriteUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-auto object-contain animate-[magorditoEnemyGhostPeelC_0.98s_cubic-bezier(0.22,1,0.36,1)_0.14s_forwards]"
                      style={{ filter: soulShaderFilter }}
                    />
                  </div>
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute left-[15%] bottom-[34%] w-[80px] h-[80px] pointer-events-none z-15 animate-[magorditoSiphonVortexSpin_0.96s_ease-out_forwards]"
                  >
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#050505" strokeWidth="10" strokeDasharray="24 14" />
                    <circle cx="50" cy="50" r="36" fill="none" stroke={tier === 3 ? '#99f6e4' : '#5eead4'} strokeWidth="5.5" strokeDasharray="24 14" />
                    <circle cx="50" cy="50" r="20" fill="none" stroke="#2dd4bf" strokeWidth="4" strokeDasharray="14 10" />
                  </svg>
                </>
              )}

              {tier === 3 && (
                <div className="absolute right-[5%] bottom-[21%] w-[145px] h-[195px] flex items-end justify-center pointer-events-none z-10">
                  <img
                    src={enemySpriteUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-auto object-contain animate-[magorditoEnemyGhostPeelC_1.0s_cubic-bezier(0.22,1,0.36,1)_0.22s_forwards]"
                    style={{ filter: soulShaderFilter }}
                  />
                </div>
              )}
            </>
          )}

          {/* ================================================================= */}
          {/* 3. PUÑETAZO (fortalecer_marioneta): Sprite distinto por Tier 1/2/3 */}
          {/*    + BONK compacto para dejar ver parte del enemigo               */}
          {/* ================================================================= */}
          {skillType === 'fortalecer_marioneta' && (
            <>
              <div
                className={`absolute right-[8.5%] bottom-[26%] flex items-center justify-center pointer-events-none z-10 ${
                  tier === 3
                    ? 'w-[136px] h-[136px]'
                    : tier === 2
                    ? 'w-[120px] h-[120px]'
                    : 'w-[106px] h-[106px]'
                }`}
              >
                <img
                  src={impactSpriteUrl}
                  alt="Impacto Aguamarina"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[magorditoPunchImpactAAA_0.9s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: impactShaderFilter }}
                />
              </div>

              <div
                className={`absolute flex items-center justify-center pointer-events-none z-15 ${
                  tier === 3
                    ? 'right-[4.5%] bottom-[51%] w-[172px] h-[120px]'
                    : tier === 2
                    ? 'right-[5.5%] bottom-[50.5%] w-[144px] h-[100px]'
                    : 'right-[6.5%] bottom-[50%] w-[118px] h-[82px]'
                }`}
              >
                <img
                  src="/assets/combat/magordito_vfx_bonk.png"
                  alt="BONK!"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-contain ${
                    tier === 3
                      ? 'animate-[magorditoBonkPopEpicT3_0.96s_cubic-bezier(0.22,1.28,0.36,1)_forwards]'
                      : 'animate-[magorditoBonkPopAAA_0.95s_cubic-bezier(0.22,1.28,0.36,1)_forwards]'
                  }`}
                  style={{ filter: impactShaderFilter }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
