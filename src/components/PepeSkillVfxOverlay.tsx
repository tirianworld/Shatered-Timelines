import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef } from 'react';

export interface PepeSkillVfxOverlayProps {
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

export const PepeSkillVfxOverlay: React.FC<PepeSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isActiveSkill =
    skillType === 'pepe_ataque' ||
    skillType === 'pepe_remo' ||
    skillType === 'pepe_escudo';

  const hachazoSpriteUrl =
    tier === 3
      ? '/assets/combat/pepe_vfx_hachazo_t3.png'
      : tier === 2
      ? '/assets/combat/pepe_vfx_hachazo_t2.png'
      : '/assets/combat/pepe_vfx_hachazo_t1.png';

  // Real-time 60fps AAA Canvas Shader Engine (Incandescent Axe Cleaves, Tidal Splash Arcs, Bastion Hex-Dome)
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
    const { enemyX, enemyY, headX, headY, enemyScale } = resolveEnemyVfxFrame(enemyFrame, width, height);
    const countMult = tier === 3 ? 1.48 : tier === 2 ? 1.24 : 1.0;

    const particles: CanvasParticle[] = [];

    if (skillType === 'pepe_ataque') {
      const firePalette = ['#ef4444', '#f97316', '#fb923c', '#fed7aa'];
      const count = Math.round(28 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI + Math.random() * Math.PI * 2;
        const speed = 3.6 + Math.random() * (5.6 + tier * 0.95);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 44,
          y: enemyY + (Math.random() - 0.5) * 66,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.9,
          size: 2.1 + Math.random() * 3.3,
          life: 0,
          maxLife: 19 + Math.random() * 16,
          color: firePalette[i % firePalette.length],
          trail: true,
          shape: tier >= 2 && i % 4 === 0 ? 'diamond' : i % 3 === 0 ? 'star' : 'circle',
        });
      }
    } else if (skillType === 'pepe_remo') {
      const bonkPalette = ['#fbbf24', '#f97316', '#fef08a', '#fde047', '#d97706'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI + Math.random() * Math.PI * 2;
        const speed = 3.0 + Math.random() * (4.8 + tier * 0.85);
        particles.push({
          x: headX + (Math.random() - 0.5) * 34 * enemyScale,
          y: headY + (Math.random() - 0.5) * 24 * enemyScale,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.75 - 1.1,
          size: 2.0 + Math.random() * 3.1,
          life: 0,
          maxLife: 19 + Math.random() * 14,
          color: bonkPalette[i % bonkPalette.length],
          trail: true,
          shape: i % 3 === 0 ? 'star' : i % 2 === 0 ? 'diamond' : 'circle',
        });
      }
    } else if (skillType === 'pepe_escudo') {
      const bastionPalette = ['#38bdf8', '#7dd3fc', '#fbbf24', '#bae6fd'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 86,
          y: heroY + 62 + (Math.random() - 0.5) * 32,
          vx: (Math.random() - 0.5) * 0.85,
          vy: -(1.7 + Math.random() * (2.5 + tier * 0.45)),
          size: 2.2 + Math.random() * 3.2,
          life: -Math.random() * 10,
          maxLife: 28 + Math.random() * 18,
          color: bastionPalette[i % bastionPalette.length],
          trail: true,
          shape: i % 2 === 0 ? 'diamond' : 'star',
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = 1020;

    const drawFourPointStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r * 1.45 : r * 0.38;
        const a = (i * Math.PI) / 4;
        const sx = cx + Math.cos(a) * rad;
        const sy = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawHexagon = (cx: number, cy: number, radius: number, rot: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + (i * Math.PI) / 3;
        const px = cx + Math.cos(a) * radius;
        const py = cy + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const drawComicFivePointStar = (cx: number, cy: number, outerR: number, rot: number) => {
      const innerR = outerR * 0.44;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
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

      if (skillType === 'pepe_ataque') {
        // 1. Incandescent impact core flare + fiery cleave shock-arcs
        if (progress < 0.65) {
          const fp = progress / 0.65;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.76 + tier * 0.08);
          ctx.save();
          const grad = ctx.createRadialGradient(enemyX - 4, enemyY - 4, 2, enemyX - 4, enemyY - 4, 48 + tier * 14);
          grad.addColorStop(0, `rgba(254, 215, 170, ${flashAlpha})`);
          grad.addColorStop(0.42, `rgba(249, 115, 22, ${flashAlpha * 0.65})`);
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX - 4, enemyY - 4, 48 + tier * 14, 0, Math.PI * 2);
          ctx.fill();

          // Sweeping additive energy cleave arc
          const startAngle = -Math.PI * 0.72 + fp * 0.4;
          const endAngle = startAngle + Math.PI * 0.85;
          ctx.beginPath();
          ctx.arc(enemyX - 8, enemyY - 4, 42 + tier * 10 + fp * 16, startAngle, endAngle);
          ctx.strokeStyle = `rgba(253, 186, 116, ${flashAlpha * 0.88})`;
          ctx.lineWidth = 4.0 * (1 - fp * 0.45);
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 16;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }

        // 2. Heavy crimson-orange ground shockwave ellipses
        if (progress > 0.06 && progress < 0.84) {
          const p = (progress - 0.06) / 0.78;
          const alpha = (1 - p) * 0.8;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            22 + p * (62 + tier * 11),
            7 + p * (18 + tier * 3),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
          ctx.lineWidth = (2.8 + tier * 0.4) * (1 - p * 0.45);
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 14;
          ctx.stroke();

          if (tier >= 2 && p > 0.14) {
            const p2 = (p - 0.14) / 0.86;
            ctx.beginPath();
            ctx.arc(enemyX, enemyY - 4, 16 + p2 * (56 + tier * 9), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(251, 146, 60, ${(1 - p2) * 0.58})`;
            ctx.lineWidth = 2.2;
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (skillType === 'pepe_remo') {

        // 1. Overhead blunt BONK flash & radial shock rays right on top of the enemy head
        if (progress < 0.56) {
          const fp = progress / 0.56;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.82 + tier * 0.06);
          ctx.save();
          const grad = ctx.createRadialGradient(headX, headY, 2, headX, headY, (44 + tier * 12) * enemyScale);
          grad.addColorStop(0, `rgba(254, 249, 195, ${flashAlpha})`);
          grad.addColorStop(0.45, `rgba(251, 191, 36, ${flashAlpha * 0.7})`);
          grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(headX, headY, (44 + tier * 12) * enemyScale, 0, Math.PI * 2);
          ctx.fill();

          const rayCount = tier === 3 ? 10 : tier === 2 ? 8 : 6;
          for (let r = 0; r < rayCount; r++) {
            const ang = (r * Math.PI * 2) / rayCount + 0.2;
            const innerDist = (14 + fp * 10) * enemyScale;
            const outerDist = (30 + fp * (26 + tier * 7)) * enemyScale;
            ctx.beginPath();
            ctx.moveTo(headX + Math.cos(ang) * innerDist, headY + Math.sin(ang) * innerDist * 0.72);
            ctx.lineTo(headX + Math.cos(ang) * outerDist, headY + Math.sin(ang) * outerDist * 0.72);
            ctx.strokeStyle = `rgba(254, 240, 138, ${flashAlpha * 0.9})`;
            ctx.lineWidth = 2.5 * (1 - fp * 0.45);
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
          ctx.restore();
        }

        // 2. Comic blunt impact shockwaves at feet + mutual-stun recoil pulse on Pepe
        if (progress > 0.08 && progress < 0.84) {
          const p = (progress - 0.08) / 0.76;
          const ringCount = tier >= 2 ? 2 : 1;
          for (let r = 0; r < ringCount; r++) {
            const rp = Math.max(0, p - r * 0.14);
            if (rp <= 0) continue;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              enemyX,
              enemyY + 48 * enemyScale,
              (22 + rp * (58 + tier * 10)) * enemyScale,
              (7 + rp * (16 + tier * 2.5)) * enemyScale,
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle =
              r === 0
                ? `rgba(251, 191, 36, ${(1 - rp) * 0.82})`
                : `rgba(249, 115, 22, ${(1 - rp) * 0.64})`;
            ctx.lineWidth = (2.8 - r * 0.55) * (1 - rp * 0.45);
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();
          }

          if (p < 0.68) {
            const sp = p / 0.68;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(heroX, heroY + 74, 18 + sp * 36, 5 + sp * 10, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(249, 115, 22, ${(1 - sp) * 0.52})`;
            ctx.lineWidth = 2.0;
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();
          }
        }

        // 3. Cartoon Dizzy Stars orbiting smoothly above the enemy's squashed head ("estrellitas en la cabeza")
        if (progress > 0.14 && progress < 0.98) {
          const dp = (progress - 0.14) / 0.84;
          const dizzyAlpha = dp < 0.15 ? dp / 0.15 : dp > 0.78 ? (1 - dp) / 0.22 : 1;
          const orbitCenterY = headY - 22 * enemyScale + Math.sin(dp * Math.PI * 2) * 3;
          const orbitRx = (34 + tier * 4) * enemyScale;
          const orbitRy = (10 + tier * 1.5) * enemyScale;

          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.max(0, Math.min(1, dizzyAlpha));

          // Subtle cartoon dizzy motion ring
          ctx.beginPath();
          ctx.ellipse(headX, orbitCenterY, orbitRx, orbitRy, -0.06, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 6]);
          ctx.lineDashOffset = -dp * 42;
          ctx.stroke();
          ctx.setLineDash([]);

          const starCount = tier === 3 ? 5 : tier === 2 ? 4 : 3;
          const baseSpin = dp * Math.PI * 3.6;
          const starList = Array.from({ length: starCount }, (_, idx) => {
            const ang = baseSpin + (idx * Math.PI * 2) / starCount;
            return {
              x: headX + Math.cos(ang) * orbitRx,
              y: orbitCenterY + Math.sin(ang) * orbitRy,
              depth: Math.sin(ang),
              idx,
            };
          }).sort((a, b) => a.depth - b.depth);

          for (const st of starList) {
            const starSize = (7.2 + tier * 0.9) * (0.84 + st.depth * 0.22) * enemyScale;
            drawComicFivePointStar(st.x, st.y, starSize, baseSpin * 0.9 + st.idx * 0.6);
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.fillStyle = st.idx % 2 === 0 ? '#fde047' : '#fef08a';
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = '#111827';
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (skillType === 'pepe_escudo') {
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
                ? `rgba(56, 189, 248, ${(1 - p) * 0.78})`
                : `rgba(251, 191, 36, ${(1 - p) * 0.66})`;
            ctx.lineWidth = (2.8 - r * 0.35) * (1 - p * 0.4);
            ctx.shadowColor = r % 2 === 0 ? '#38bdf8' : '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (progress > 0.05 && progress < 0.88) {
          const p = (progress - 0.05) / 0.83;
          const hexAlpha = Math.sin(p * Math.PI) * (0.58 + tier * 0.12);
          const hexRadius = 46 + Math.sin(p * Math.PI * 0.8) * (18 + tier * 5);

          ctx.save();
          drawHexagon(heroX, heroY - 12, hexRadius, p * 0.4);
          ctx.strokeStyle = `rgba(56, 189, 248, ${hexAlpha})`;
          ctx.lineWidth = tier === 3 ? 3.0 : 2.2;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.stroke();

          if (tier >= 2) {
            drawHexagon(heroX, heroY - 12, hexRadius * 0.72, -p * 0.55);
            ctx.strokeStyle = `rgba(251, 191, 36, ${hexAlpha * 0.78})`;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#fbbf24';
            ctx.stroke();
          }
          ctx.restore();
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

        if (skillType === 'pepe_escudo') {
          pt.x += Math.sin(pt.life * 0.24) * 0.45;
        } else {
          pt.vx *= 0.94;
          pt.vy *= 0.94;
          if (skillType === 'pepe_remo') pt.vy += 0.16;
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
          ctx.moveTo(prevX - pt.vx * 1.45, prevY - pt.vy * 1.45);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.68;
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

  const hachazoShaderFilter =
    tier === 3
      ? 'url(#pepe-hachazo-t3-shader)'
      : tier === 2
      ? 'url(#pepe-hachazo-t2-shader)'
      : 'url(#pepe-hachazo-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. HACHAZO (pepe_ataque): Living Blazing Heat-Wave Shader (animates BOTH fire body & crimson corona!) */}
          <filter id="pepe-hachazo-t1-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.085" numOctaves="2" seed="3" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.058 0.16; 0.022 0.07" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="livingFire" />
            <feMorphology in="livingFire" operator="dilate" radius="2.0" result="dilated" />
            <feFlood floodColor="#f97316" floodOpacity="0.88" result="orangeColor" />
            <feComposite in="orangeColor" in2="dilated" operator="in" result="orangeRim" />
            <feGaussianBlur in="orangeRim" stdDeviation="2.6" result="orangeCorona" />
            <feMerge>
              <feMergeNode in="orangeCorona" />
              <feMergeNode in="livingFire" />
            </feMerge>
          </filter>

          <filter id="pepe-hachazo-t2-shader" x="-28%" y="-28%" width="156%" height="156%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.095" numOctaves="2" seed="6" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.026 0.08; 0.068 0.18; 0.026 0.08" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="4.8" xChannelSelector="R" yChannelSelector="G" result="livingFire" />
            <feMorphology in="livingFire" operator="dilate" radius="2.8" result="dilated" />
            <feFlood floodColor="#ef4444" floodOpacity="0.95" result="redColor" />
            <feComposite in="redColor" in2="dilated" operator="in" result="redAura" />
            <feGaussianBlur in="redAura" stdDeviation="3.4" result="redCorona" />
            <feMerge>
              <feMergeNode in="redCorona" />
              <feMergeNode in="livingFire" />
            </feMerge>
          </filter>

          <filter id="pepe-hachazo-t3-shader" x="-32%" y="-32%" width="164%" height="164%">
            <feTurbulence type="fractalNoise" baseFrequency="0.038 0.11" numOctaves="2" seed="11" result="fireNoise">
              <animate attributeName="baseFrequency" values="0.03 0.09; 0.08 0.21; 0.03 0.09" dur="0.15s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="6.0" xChannelSelector="R" yChannelSelector="G" result="livingFire" />
            <feMorphology in="livingFire" operator="dilate" radius="3.6" result="dilated" />
            <feFlood floodColor="#ef4444" floodOpacity="0.98" result="outerCrimson" />
            <feComposite in="outerCrimson" in2="dilated" operator="in" result="crimsonSilhouette" />
            <feGaussianBlur in="crimsonSilhouette" stdDeviation="4.6" result="outerCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.7" floodColor="#fed7aa" floodOpacity="0.94" result="innerEmberRim" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="innerEmberRim" />
              <feMergeNode in="livingFire" />
            </feMerge>
          </filter>

          {/* Specular Molten Slash Sweep Shader for Hachazo Over-Pass */}
          <filter id="pepe-hachazo-energy-sweep-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1.4 0.7 0.2 0 0.25
                      1.0 0.9 0.3 0 0.15
                      0.4 0.4 0.3 0 0.05
                      0   0   0   0.95 0"
              result="hotEmber"
            />
            <feGaussianBlur in="hotEmber" stdDeviation="2.0" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotEmber" />
            </feMerge>
          </filter>

          {/* 3. BALUARTE DE PEPE (pepe_escudo): AAA Steel-Cyan & Golden Bastion Shaders ON Hero Sprite */}
          <filter id="pepe-shield-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.068" numOctaves="2" seed="5" result="shieldNoise">
              <animate attributeName="baseFrequency" values="0.02 0.058; 0.042 0.105; 0.02 0.058" dur="0.38s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="shieldNoise" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="wavyShield" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.9" result="cyanColor" />
            <feComposite in="cyanColor" in2="wavyShield" operator="in" result="cyanAura" />
            <feGaussianBlur in="cyanAura" stdDeviation="3.4" result="cyanCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#bae6fd" floodOpacity="0.75" result="crispRim" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="crispRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="pepe-shield-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.078" numOctaves="2" seed="9" result="shieldNoise">
              <animate attributeName="baseFrequency" values="0.024 0.068; 0.05 0.125; 0.024 0.068" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="shieldNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyShield" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.95" result="cyanColor" />
            <feComposite in="cyanColor" in2="wavyShield" operator="in" result="cyanAura" />
            <feGaussianBlur in="cyanAura" stdDeviation="4.8" result="cyanCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fbbf24" floodOpacity="0.82" result="amberRim" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="amberRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="pepe-shield-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.09" numOctaves="3" seed="17" result="shieldNoise">
              <animate attributeName="baseFrequency" values="0.028 0.078; 0.062 0.15; 0.028 0.078" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="shieldNoise" scale="7.0" xChannelSelector="R" yChannelSelector="G" result="wavyShield" />
            <feFlood floodColor="#0284c7" floodOpacity="1" result="cobaltColor" />
            <feComposite in="cobaltColor" in2="wavyShield" operator="in" result="cobaltAura" />
            <feGaussianBlur in="cobaltAura" stdDeviation="6.6" result="outerCorona" />
            <feFlood floodColor="#fbbf24" floodOpacity="0.95" result="goldBastion" />
            <feComposite in="goldBastion" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="pepe-shield-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.4" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.13" numOctaves="2" seed="21" result="armorNoise">
              <animate attributeName="baseFrequency" values="0.02 0.11; 0.044 0.21; 0.02 0.11" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="armorNoise" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#bae6fd" floodOpacity="0.95" result="iceFlood" />
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
          key={`pepe-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-hidden select-none"
        >
          <style>{`
            /* 1. HACHAZO (pepe_ataque): Tajo rotacional con barrido direccional y calor vivo */
            @keyframes pepeHachazoSlashAAA {
              0% {
                transform: translate(-38px, -36px) scale(0.28) rotate(-32deg);
                clip-path: inset(0 0 85% 0);
                opacity: 0;
              }
              16% {
                transform: translate(6px, 6px) scale(1.14) rotate(5deg);
                clip-path: inset(0 0 0% 0);
                opacity: 1;
              }
              30% {
                transform: translate(-2px, -2px) scale(0.96) rotate(-2deg) skewX(-3deg);
                clip-path: inset(0 0 0% 0);
                opacity: 1;
              }
              52% {
                transform: translate(3px, 3px) scale(1.05) rotate(2deg) skewX(2deg);
                clip-path: inset(0 0 0% 0);
                opacity: 0.94;
              }
              78% {
                transform: translate(8px, 8px) scale(1.09) rotate(4deg);
                clip-path: inset(22% 0 0% 0);
                opacity: 0.78;
              }
              100% {
                transform: translate(16px, 18px) scale(1.2) rotate(9deg);
                clip-path: inset(100% 0 0% 0);
                opacity: 0;
              }
            }

            @keyframes pepeAttackEnergySweep {
              0% {
                opacity: 0;
                -webkit-mask-position: 110% 110%;
                mask-position: 110% 110%;
              }
              22% {
                opacity: 1;
              }
              76% {
                opacity: 0.85;
              }
              100% {
                opacity: 0;
                -webkit-mask-position: -30% -30%;
                mask-position: -30% -30%;
              }
            }

            /* 3. BALUARTE DE PEPE (pepe_escudo): Aura de fortaleza sin sprites extra */
            @keyframes pepeBastionAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              22% { transform: scaleX(1.06) scaleY(1.04); opacity: 0.95; }
              60% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.86; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }
          `}</style>

          {/* Real-time 60fps AAA Canvas Shader Engine */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* ================================================================= */}
          {/* 1. HACHAZO (pepe_ataque): Shader vivo + barrido ígneo incandescente */}
          {/* ================================================================= */}
          {skillType === 'pepe_ataque' && (
            <div
              className={`absolute flex items-center justify-center pointer-events-none z-15 ${
                tier === 3
                  ? 'right-[4%] bottom-[22%] w-[186px] h-[182px]'
                  : tier === 2
                  ? 'right-[5%] bottom-[24%] w-[168px] h-[162px]'
                  : 'right-[6%] bottom-[26%] w-[156px] h-[148px]'
              }`}
            >
              <img
                src={hachazoSpriteUrl}
                alt="Hachazo de Combate"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[pepeHachazoSlashAAA_0.94s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: hachazoShaderFilter }}
              />
              <img
                src={hachazoSpriteUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  mixBlendMode: 'screen',
                  filter: 'url(#pepe-hachazo-energy-sweep-shader)',
                  WebkitMaskImage:
                    'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                  maskImage:
                    'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                  WebkitMaskSize: '230% 230%',
                  maskSize: '230% 230%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  animation:
                    'pepeHachazoSlashAAA 0.94s cubic-bezier(0.16,1,0.3,1) forwards, pepeAttackEnergySweep 0.78s ease-out forwards',
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. GOLPE DE REMO (pepe_remo): Solo impacto en canvas + estrellitas */}
          {/* ================================================================= */}

          {/* ================================================================= */}
          {/* 3. BALUARTE DE PEPE (pepe_escudo): Aura Shader Cian/Ámbar         */}
          {/* ================================================================= */}
          {skillType === 'pepe_escudo' && (
            <div
              className="absolute left-[4.5%] bottom-[4%] w-[205px] h-[290px] pointer-events-none z-0 flex items-end justify-center origin-bottom animate-[pepeBastionAuraBloom_0.98s_cubic-bezier(0.22,1,0.36,1)_forwards]"
              style={{ mixBlendMode: 'screen' }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    tier === 3
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(186,230,253,0.5) 0%, rgba(56,189,248,0.34) 38%, rgba(251,191,36,0.16) 64%, transparent 78%)'
                      : tier === 2
                      ? 'radial-gradient(ellipse at 50% 62%, rgba(186,230,253,0.4) 0%, rgba(56,189,248,0.26) 38%, rgba(251,191,36,0.1) 62%, transparent 76%)'
                      : 'radial-gradient(ellipse at 50% 64%, rgba(56,189,248,0.34) 0%, rgba(2,132,199,0.18) 42%, transparent 72%)',
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
