import { resolveEnemyVfxFrame, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import React, { useEffect, useRef, useState } from 'react';

export interface KaironSkillVfxOverlayProps {
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
  shape?: 'circle' | 'spark' | 'smoke';
  gravity?: number;
}

interface BulletSpec {
  delayMs: number;
  startLeftPct: number;
  startBottomPct: number;
  arcY: number;
  angleDeg: number;
  scale: number;
  widthPx: number;
}

interface MuzzleBlastSpec {
  delayMs: number;
  leftPct?: number;
  rightPct?: number;
  bottomPct: number;
  sizePx: number;
  rotateDeg: number;
}

interface SteelSlashSpec {
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
  goldVariant?: boolean;
}

const TIRO_DOBLE_T1: readonly BulletSpec[] = [
  { delayMs: 0, startLeftPct: 24, startBottomPct: 45, arcY: -6, angleDeg: -2, scale: 0.98, widthPx: 128 },
  { delayMs: 135, startLeftPct: 23, startBottomPct: 41, arcY: 8, angleDeg: 2, scale: 1.04, widthPx: 136 },
];

const TIRO_DOBLE_T2: readonly BulletSpec[] = [
  { delayMs: 0, startLeftPct: 24, startBottomPct: 47, arcY: -18, angleDeg: -6, scale: 0.94, widthPx: 124 },
  { delayMs: 85, startLeftPct: 23, startBottomPct: 42, arcY: -2, angleDeg: 0, scale: 1.0, widthPx: 132 },
  { delayMs: 170, startLeftPct: 24, startBottomPct: 38, arcY: 14, angleDeg: 5, scale: 0.98, widthPx: 128 },
  { delayMs: 255, startLeftPct: 23, startBottomPct: 44, arcY: 2, angleDeg: 1, scale: 1.08, widthPx: 142 },
];

const TIRO_DOBLE_T3: readonly BulletSpec[] = [
  { delayMs: 0, startLeftPct: 24, startBottomPct: 48, arcY: -22, angleDeg: -8, scale: 0.92, widthPx: 122 },
  { delayMs: 60, startLeftPct: 23, startBottomPct: 43, arcY: -6, angleDeg: -2, scale: 0.98, widthPx: 128 },
  { delayMs: 120, startLeftPct: 24, startBottomPct: 37, arcY: 16, angleDeg: 6, scale: 0.96, widthPx: 126 },
  { delayMs: 180, startLeftPct: 23, startBottomPct: 46, arcY: -12, angleDeg: -4, scale: 1.02, widthPx: 134 },
  { delayMs: 240, startLeftPct: 24, startBottomPct: 40, arcY: 8, angleDeg: 3, scale: 1.04, widthPx: 138 },
  { delayMs: 300, startLeftPct: 23, startBottomPct: 43, arcY: 0, angleDeg: 0, scale: 1.14, widthPx: 150 },
];

const DISPARO_DUAL_T1: readonly BulletSpec[] = [
  { delayMs: 0, startLeftPct: 23, startBottomPct: 47, arcY: -14, angleDeg: -4, scale: 1.0, widthPx: 132 },
  { delayMs: 35, startLeftPct: 25, startBottomPct: 40, arcY: 12, angleDeg: 4, scale: 1.0, widthPx: 132 },
];

const DISPARO_DUAL_T2: readonly BulletSpec[] = [
  { delayMs: 0, startLeftPct: 23, startBottomPct: 48, arcY: -18, angleDeg: -5, scale: 0.98, widthPx: 130 },
  { delayMs: 30, startLeftPct: 25, startBottomPct: 41, arcY: 14, angleDeg: 4, scale: 0.98, widthPx: 130 },
  { delayMs: 165, startLeftPct: 23, startBottomPct: 46, arcY: -8, angleDeg: -2, scale: 1.04, widthPx: 138 },
  { delayMs: 195, startLeftPct: 25, startBottomPct: 39, arcY: 8, angleDeg: 3, scale: 1.04, widthPx: 138 },
];

const DISPARO_DUAL_T3: readonly BulletSpec[] = [
  { delayMs: 0, startLeftPct: 23, startBottomPct: 49, arcY: -22, angleDeg: -7, scale: 0.96, widthPx: 128 },
  { delayMs: 25, startLeftPct: 25, startBottomPct: 40, arcY: 16, angleDeg: 5, scale: 0.96, widthPx: 128 },
  { delayMs: 135, startLeftPct: 23, startBottomPct: 46, arcY: -10, angleDeg: -3, scale: 1.02, widthPx: 136 },
  { delayMs: 160, startLeftPct: 25, startBottomPct: 38, arcY: 10, angleDeg: 3, scale: 1.02, widthPx: 136 },
  { delayMs: 270, startLeftPct: 23, startBottomPct: 45, arcY: -4, angleDeg: -1, scale: 1.1, widthPx: 146 },
  { delayMs: 295, startLeftPct: 25, startBottomPct: 42, arcY: 6, angleDeg: 2, scale: 1.1, widthPx: 146 },
];

const MUZZLES_TIRO_DOBLE_T1: readonly MuzzleBlastSpec[] = [
  { delayMs: 0, leftPct: 20, bottomPct: 41, sizePx: 74, rotateDeg: -10 },
  { delayMs: 135, leftPct: 19, bottomPct: 38, sizePx: 80, rotateDeg: 14 },
];

const MUZZLES_TIRO_DOBLE_T2: readonly MuzzleBlastSpec[] = [
  { delayMs: 0, leftPct: 20, bottomPct: 43, sizePx: 76, rotateDeg: -12 },
  { delayMs: 170, leftPct: 19, bottomPct: 37, sizePx: 82, rotateDeg: 18 },
  { delayMs: 265, rightPct: 8, bottomPct: 34, sizePx: 94, rotateDeg: -8 },
];

const MUZZLES_TIRO_DOBLE_T3: readonly MuzzleBlastSpec[] = [
  { delayMs: 0, leftPct: 20, bottomPct: 44, sizePx: 80, rotateDeg: -15 },
  { delayMs: 120, leftPct: 19, bottomPct: 36, sizePx: 84, rotateDeg: 16 },
  { delayMs: 225, rightPct: 10, bottomPct: 36, sizePx: 98, rotateDeg: 12 },
  { delayMs: 320, rightPct: 6, bottomPct: 28, sizePx: 112, rotateDeg: -18 },
];

const MUZZLES_DISPARO_DUAL_T1: readonly MuzzleBlastSpec[] = [
  { delayMs: 0, leftPct: 21, bottomPct: 43, sizePx: 84, rotateDeg: -14 },
  { delayMs: 125, rightPct: 8, bottomPct: 33, sizePx: 96, rotateDeg: 8 },
];

const MUZZLES_DISPARO_DUAL_T2: readonly MuzzleBlastSpec[] = [
  { delayMs: 0, leftPct: 21, bottomPct: 44, sizePx: 88, rotateDeg: -12 },
  { delayMs: 120, rightPct: 10, bottomPct: 36, sizePx: 100, rotateDeg: 14 },
  { delayMs: 245, rightPct: 6, bottomPct: 28, sizePx: 112, rotateDeg: -16 },
];

const MUZZLES_DISPARO_DUAL_T3: readonly MuzzleBlastSpec[] = [
  { delayMs: 0, leftPct: 21, bottomPct: 45, sizePx: 94, rotateDeg: -14 },
  { delayMs: 115, rightPct: 11, bottomPct: 38, sizePx: 106, rotateDeg: 18 },
  { delayMs: 230, rightPct: 6, bottomPct: 30, sizePx: 118, rotateDeg: -10 },
  { delayMs: 340, rightPct: 8, bottomPct: 34, sizePx: 132, rotateDeg: 22 },
];

const STEEL_SLASHES_T1: readonly SteelSlashSpec[] = [
  { delayMs: 0, rightPct: 8, bottomPct: 24, widthPx: 150, rotateDeg: -22 },
  { delayMs: 120, rightPct: 7, bottomPct: 27, widthPx: 142, rotateDeg: 26, flipX: true },
];

const STEEL_SLASHES_T2: readonly SteelSlashSpec[] = [
  { delayMs: 0, rightPct: 9, bottomPct: 25, widthPx: 150, rotateDeg: -24 },
  { delayMs: 85, rightPct: 6.5, bottomPct: 28, widthPx: 144, rotateDeg: 26, flipX: true },
  { delayMs: 170, rightPct: 8.5, bottomPct: 21, widthPx: 152, rotateDeg: -8, flipY: true },
  { delayMs: 255, rightPct: 7, bottomPct: 30, widthPx: 158, rotateDeg: 14 },
];

const STEEL_SLASHES_T3: readonly SteelSlashSpec[] = [
  { delayMs: 0, rightPct: 9.5, bottomPct: 26, widthPx: 150, rotateDeg: -28 },
  { delayMs: 60, rightPct: 6.5, bottomPct: 29, widthPx: 146, rotateDeg: 30, flipX: true },
  { delayMs: 120, rightPct: 8.5, bottomPct: 21, widthPx: 152, rotateDeg: -10, flipY: true },
  { delayMs: 180, rightPct: 6, bottomPct: 24, widthPx: 150, rotateDeg: 16 },
  { delayMs: 240, rightPct: 9, bottomPct: 32, widthPx: 156, rotateDeg: -38, flipX: true },
  { delayMs: 310, rightPct: 7, bottomPct: 25, widthPx: 170, rotateDeg: 8 },
];

const BANG_T1: readonly ComicPopupSpec[] = [
  { delayMs: 115, rightPct: 7, bottomPct: 49, widthPx: 108, rotateDeg: -9 },
];

const BANG_T2: readonly ComicPopupSpec[] = [
  { delayMs: 105, rightPct: 14, bottomPct: 55, widthPx: 106, rotateDeg: -12 },
  { delayMs: 260, rightPct: 3.5, bottomPct: 43, widthPx: 116, rotateDeg: 8 },
];

const BANG_T3: readonly ComicPopupSpec[] = [
  { delayMs: 95, rightPct: 15, bottomPct: 58, widthPx: 108, rotateDeg: -13 },
  { delayMs: 225, rightPct: 3, bottomPct: 48, widthPx: 114, rotateDeg: 9 },
  { delayMs: 350, rightPct: 8, bottomPct: 36, widthPx: 126, rotateDeg: -6 },
];

const SLASH_ACERO_T1: readonly ComicPopupSpec[] = [
  { delayMs: 75, rightPct: 7, bottomPct: 50, widthPx: 106, rotateDeg: -10 },
];

const SLASH_ACERO_T2: readonly ComicPopupSpec[] = [
  { delayMs: 65, rightPct: 14, bottomPct: 55, widthPx: 104, rotateDeg: -12 },
  { delayMs: 230, rightPct: 3.5, bottomPct: 43, widthPx: 114, rotateDeg: 8 },
];

const SLASH_ACERO_T3: readonly ComicPopupSpec[] = [
  { delayMs: 55, rightPct: 15, bottomPct: 57, widthPx: 106, rotateDeg: -14 },
  { delayMs: 190, rightPct: 3, bottomPct: 49, widthPx: 112, rotateDeg: 10 },
  { delayMs: 330, rightPct: 8, bottomPct: 36, widthPx: 124, rotateDeg: -6, goldVariant: true },
];

export const KaironSkillVfxOverlay: React.FC<KaironSkillVfxOverlayProps> = ({
  enemyFrame,
  skillType,
  tier = 1,
  vfxKey = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredBullets, setTriggeredBullets] = useState<number[]>([]);
  const [triggeredMuzzles, setTriggeredMuzzles] = useState<number[]>([]);
  const [triggeredSlashes, setTriggeredSlashes] = useState<number[]>([]);
  const [triggeredPopups, setTriggeredPopups] = useState<number[]>([]);

  const isActiveSkill =
    skillType === 'kairon_tiro_doble' ||
    skillType === 'kairon_disparo_dual' ||
    skillType === 'kairon_espadazo_largo';

  const activeBullets: readonly BulletSpec[] =
    skillType === 'kairon_disparo_dual'
      ? tier === 3
        ? DISPARO_DUAL_T3
        : tier === 2
        ? DISPARO_DUAL_T2
        : DISPARO_DUAL_T1
      : tier === 3
      ? TIRO_DOBLE_T3
      : tier === 2
      ? TIRO_DOBLE_T2
      : TIRO_DOBLE_T1;

  const activeMuzzles: readonly MuzzleBlastSpec[] =
    skillType === 'kairon_disparo_dual'
      ? tier === 3
        ? MUZZLES_DISPARO_DUAL_T3
        : tier === 2
        ? MUZZLES_DISPARO_DUAL_T2
        : MUZZLES_DISPARO_DUAL_T1
      : skillType === 'kairon_tiro_doble'
      ? tier === 3
        ? MUZZLES_TIRO_DOBLE_T3
        : tier === 2
        ? MUZZLES_TIRO_DOBLE_T2
        : MUZZLES_TIRO_DOBLE_T1
      : [];

  const activeSlashes: readonly SteelSlashSpec[] =
    tier === 3 ? STEEL_SLASHES_T3 : tier === 2 ? STEEL_SLASHES_T2 : STEEL_SLASHES_T1;

  const activePopups: readonly ComicPopupSpec[] =
    skillType === 'kairon_espadazo_largo'
      ? tier === 3
        ? SLASH_ACERO_T3
        : tier === 2
        ? SLASH_ACERO_T2
        : SLASH_ACERO_T1
      : tier === 3
      ? BANG_T3
      : tier === 2
      ? BANG_T2
      : BANG_T1;

  useEffect(() => {
    setTriggeredBullets([]);
    setTriggeredMuzzles([]);
    setTriggeredSlashes([]);
    setTriggeredPopups([]);
    if (!isActiveSkill || !skillType) return;

    const timers: number[] = [];

    if (skillType === 'kairon_tiro_doble' || skillType === 'kairon_disparo_dual') {
      activeBullets.forEach((b, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredBullets((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, b.delayMs);
        timers.push(id);
      });

      activeMuzzles.forEach((m, idx) => {
        const id = window.setTimeout(() => {
          setTriggeredMuzzles((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, m.delayMs);
        timers.push(id);
      });
    }

    if (skillType === 'kairon_espadazo_largo') {
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

  // 60fps Canvas Shader Engine: Supersonic Gunpowder Sparks, Smoke Plumes & Metallic Steel Glints
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

    if (skillType === 'kairon_tiro_doble') {
      const palette =
        tier === 3
          ? ['#e0f2fe', '#38bdf8', '#fde047', '#fb923c']
          : ['#fef08a', '#fbbf24', '#fb923c', '#f87171'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.45;
        const speed = 3.2 + Math.random() * (4.8 + tier * 0.9);
        particles.push({
          x: enemyX - 8 + (Math.random() - 0.5) * 44,
          y: enemyY + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.8 - 0.4,
          size: 2.0 + Math.random() * 2.7,
          life: -Math.random() * (tier === 3 ? 18 : 10),
          maxLife: 17 + Math.random() * 13,
          color: palette[i % palette.length],
          trail: true,
          shape: 'spark',
          gravity: 0.05,
        });
      }
    } else if (skillType === 'kairon_disparo_dual') {
      const sparkPalette = ['#fef08a', '#fbbf24', '#f97316', '#ef4444'];
      const sparkCount = Math.round(26 * countMult);
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.6 + Math.random() * (5.2 + tier * 0.9);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 52,
          y: enemyY + (Math.random() - 0.5) * 56,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.84 - 0.6,
          size: 2.1 + Math.random() * 2.9,
          life: -Math.random() * (tier === 3 ? 20 : 12),
          maxLife: 18 + Math.random() * 14,
          color: sparkPalette[i % sparkPalette.length],
          trail: true,
          shape: 'spark',
          gravity: 0.05,
        });
      }
      // Gunpowder smoke puffs around hero barrel & enemy
      const smokeCount = Math.round(10 * countMult);
      for (let i = 0; i < smokeCount; i++) {
        const atHero = i < Math.floor(smokeCount / 2);
        particles.push({
          x: (atHero ? heroX + 26 : enemyX) + (Math.random() - 0.5) * 38,
          y: (atHero ? heroY - 40 : enemyY) + (Math.random() - 0.5) * 32,
          vx: (atHero ? 1.1 : (Math.random() - 0.5) * 1.4),
          vy: -(0.8 + Math.random() * 1.5),
          size: 5 + Math.random() * 6,
          life: -Math.random() * 10,
          maxLife: 24 + Math.random() * 14,
          color: '#94a3b8',
          trail: false,
          shape: 'smoke',
        });
      }
    } else if (skillType === 'kairon_espadazo_largo') {
      const steelPalette =
        tier === 3
          ? ['#e0f2fe', '#7dd3fc', '#38bdf8', '#fde047']
          : ['#f8fafc', '#bae6fd', '#38bdf8', '#7dd3fc'];
      const count = Math.round(24 * countMult);
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.7;
        const speed = 2.8 + Math.random() * (4.6 + tier * 0.9);
        particles.push({
          x: enemyX + (Math.random() - 0.5) * 56,
          y: enemyY + (Math.random() - 0.5) * 64,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.82 - 0.4,
          size: 2.1 + Math.random() * 2.8,
          life: -Math.random() * (tier === 3 ? 18 : 11),
          maxLife: 18 + Math.random() * 13,
          color: steelPalette[i % steelPalette.length],
          trail: true,
          shape: 'spark',
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

      if (skillType === 'kairon_tiro_doble' || skillType === 'kairon_disparo_dual') {
        ctx.globalCompositeOperation = 'lighter';
        if (progress > 0.06 && progress < 0.84) {
          const fp = (progress - 0.06) / 0.78;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.6 + tier * 0.1);
          const radius = 44 + tier * 14;

          ctx.save();
          const grad = ctx.createRadialGradient(enemyX - 6, enemyY - 4, 2, enemyX - 6, enemyY - 4, radius);
          grad.addColorStop(0, `rgba(254, 249, 195, ${flashAlpha})`);
          grad.addColorStop(
            0.45,
            skillType === 'kairon_tiro_doble' && tier === 3
              ? `rgba(56, 189, 248, ${flashAlpha * 0.72})`
              : `rgba(249, 115, 22, ${flashAlpha * 0.72})`
          );
          grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX - 6, enemyY - 4, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (tier >= 2 && progress > 0.1 && progress < 0.88) {
          const p = (progress - 0.1) / 0.78;
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
            skillType === 'kairon_tiro_doble' && tier === 3
              ? `rgba(125, 211, 252, ${(1 - p) * 0.78})`
              : `rgba(251, 191, 36, ${(1 - p) * 0.78})`;
          ctx.lineWidth = 2.5 * (1 - p * 0.45);
          ctx.shadowColor = skillType === 'kairon_tiro_doble' && tier === 3 ? '#38bdf8' : '#f59e0b';
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }
      } else if (skillType === 'kairon_espadazo_largo') {
        ctx.globalCompositeOperation = 'lighter';
        if (progress > 0.04 && progress < 0.84) {
          const fp = (progress - 0.04) / 0.8;
          const flashAlpha = Math.sin(fp * Math.PI) * (0.56 + tier * 0.1);
          const radius = 50 + tier * 15;

          ctx.save();
          const grad = ctx.createRadialGradient(enemyX, enemyY, 2, enemyX, enemyY, radius);
          grad.addColorStop(0, `rgba(240, 249, 255, ${flashAlpha})`);
          grad.addColorStop(0.48, `rgba(56, 189, 248, ${flashAlpha * 0.68})`);
          grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(enemyX, enemyY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (progress > 0.08 && progress < 0.88) {
          const p = (progress - 0.08) / 0.8;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            enemyX,
            enemyY + 48,
            20 + p * (62 + tier * 12),
            6 + p * (17 + tier * 3),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle =
            tier === 3
              ? `rgba(253, 224, 71, ${(1 - p) * 0.76})`
              : `rgba(125, 211, 252, ${(1 - p) * 0.76})`;
          ctx.lineWidth = 2.6 * (1 - p * 0.42);
          ctx.shadowColor = tier === 3 ? '#fbbf24' : '#38bdf8';
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
        pt.vx *= 0.94;
        pt.vy = pt.vy * 0.94 + (pt.gravity || 0);

        const lifeFrac = pt.life / pt.maxLife;
        const pAlpha = Math.sin(lifeFrac * Math.PI);

        ctx.save();
        if (pt.shape === 'smoke') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.max(0, Math.min(0.45, pAlpha * 0.42));
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * (0.7 + lifeFrac * 0.8), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        ctx.globalCompositeOperation = 'lighter';
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

        const r = pt.size * 0.9;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - r * 1.35);
        ctx.lineTo(pt.x + r * 0.72, pt.y);
        ctx.lineTo(pt.x, pt.y + r * 1.35);
        ctx.lineTo(pt.x - r * 0.72, pt.y);
        ctx.closePath();
        ctx.fill();
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

  const bulletShaderFilter =
    skillType === 'kairon_tiro_doble' && tier === 3
      ? 'url(#kairon-bullet-phantom-shader)'
      : tier >= 2
      ? 'url(#kairon-bullet-t2-shader)'
      : 'url(#kairon-bullet-t1-shader)';

  const swordShaderFilter =
    tier === 3
      ? 'url(#kairon-sword-t3-shader)'
      : tier === 2
      ? 'url(#kairon-sword-t2-shader)'
      : 'url(#kairon-sword-t1-shader)';

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. BALAS & DISPAROS: Trazador Dorado / Balas Fantasma Plata-Cian */}
          <filter id="kairon-bullet-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#f59e0b" floodOpacity="0.92" result="amberGlow" />
            <feMerge>
              <feMergeNode in="amberGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="kairon-bullet-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.085" numOctaves="1" seed="6" result="heatNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.05 0.14; 0.022 0.07" dur="0.2s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="heatNoise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="livingBullet" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#f97316" floodOpacity="0.96" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.9" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="livingBullet" />
            </feMerge>
          </filter>

          <filter id="kairon-bullet-phantom-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.82 0.35 0.65 0 0.08
                      0.45 1.05 0.95 0 0.12
                      0.75 1.15 1.55 0 0.22
                      0    0    0    1 0"
              result="silverPhantom"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="4.0" floodColor="#38bdf8" floodOpacity="0.98" result="cyanGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#f0f9ff" floodOpacity="0.95" result="silverRim" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="silverRim" />
              <feMergeNode in="silverPhantom" />
            </feMerge>
          </filter>

          <filter id="kairon-muzzle-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#f97316" floodOpacity="0.94" result="orangeGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.88" result="yellowRim" />
            <feMerge>
              <feMergeNode in="orangeGlow" />
              <feMergeNode in="yellowRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2. ESPADAZO DE ACERO: Tajos de Acero Glacial */}
          <filter id="kairon-sword-t1-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#38bdf8" floodOpacity="0.94" result="cyanGlow" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="kairon-sword-t2-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.026 0.08" numOctaves="1" seed="9" result="steelNoise">
              <animate attributeName="baseFrequency" values="0.02 0.065; 0.048 0.135; 0.02 0.065" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="steelNoise" scale="1.9" xChannelSelector="R" yChannelSelector="G" result="livingSteel" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#0ea5e9" floodOpacity="0.96" result="cyanGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#e0f2fe" floodOpacity="0.9" result="iceRim" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="livingSteel" />
            </feMerge>
          </filter>

          <filter id="kairon-sword-t3-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.032 0.095" numOctaves="2" seed="16" result="steelNoise">
              <animate attributeName="baseFrequency" values="0.025 0.075; 0.06 0.16; 0.025 0.075" dur="0.18s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="steelNoise" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="livingSteel" />
            <feDropShadow dx="0" dy="0" stdDeviation="4.4" floodColor="#38bdf8" floodOpacity="0.98" result="skyCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.7" floodColor="#fef08a" floodOpacity="0.92" result="goldJudgment" />
            <feMerge>
              <feMergeNode in="skyCorona" />
              <feMergeNode in="goldJudgment" />
              <feMergeNode in="livingSteel" />
            </feMerge>
          </filter>

          <filter id="kairon-sword-sweep-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.9 0.95 1.35 0 0.14
                      1.05 1.35 1.55 0 0.2
                      1.15 1.45 1.75 0 0.26
                      0    0    0    0.95 0"
              result="hotSteel"
            />
            <feGaussianBlur in="hotSteel" stdDeviation="1.8" result="bloom" />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="hotSteel" />
            </feMerge>
          </filter>

          <filter id="kairon-bang-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#f97316" floodOpacity="0.95" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.92" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="kairon-slash-ono-shader" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.0" floodColor="#38bdf8" floodOpacity="0.95" result="cyanGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#f0f9ff" floodOpacity="0.92" result="iceRim" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* SHADERS DEL SPRITE DE KAIRON: Aura Pistolero Ámbar-Carmesí & Acero Glacial */}
          <filter id="kairon-gun-hero-shader-t1" x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.075" numOctaves="2" seed="4" result="gunNoise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.12; 0.02 0.06" dur="0.34s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="gunNoise" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
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

          <filter id="kairon-gun-hero-shader-t2" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.082" numOctaves="2" seed="9" result="gunNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.054 0.135; 0.024 0.07" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="gunNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#f97316" floodOpacity="0.95" result="fireColor" />
            <feComposite in="fireColor" in2="wavyAura" operator="in" result="fireAura" />
            <feGaussianBlur in="fireAura" stdDeviation="4.6" result="fireCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#fde047" floodOpacity="0.86" result="goldRim" />
            <feMerge>
              <feMergeNode in="fireCorona" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="kairon-gun-hero-shader-t3" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="dilated" />
            <feTurbulence type="fractalNoise" baseFrequency="0.034 0.092" numOctaves="3" seed="14" result="gunNoise">
              <animate attributeName="baseFrequency" values="0.028 0.08; 0.066 0.16; 0.028 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="gunNoise" scale="6.8" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#ea580c" floodOpacity="1" result="deepAmber" />
            <feComposite in="deepAmber" in2="wavyAura" operator="in" result="amberAura" />
            <feGaussianBlur in="amberAura" stdDeviation="6.2" result="outerCorona" />
            <feFlood floodColor="#fef08a" floodOpacity="0.95" result="goldDeadeye" />
            <feComposite in="goldDeadeye" in2="dilated" operator="in" result="goldRim" />
            <feGaussianBlur in="goldRim" stdDeviation="1.6" result="goldRimGlow" />
            <feMerge>
              <feMergeNode in="outerCorona" />
              <feMergeNode in="goldRimGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="kairon-sword-hero-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="dilated" />
            <feTurbulence type="turbulence" baseFrequency="0.028 0.085" numOctaves="2" seed="17" result="bladeNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.056 0.15; 0.022 0.07" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="dilated" in2="bladeNoise" scale="5.0" xChannelSelector="R" yChannelSelector="G" result="wavyAura" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.95" result="steelBlue" />
            <feComposite in="steelBlue" in2="wavyAura" operator="in" result="steelAura" />
            <feGaussianBlur in="steelAura" stdDeviation="4.5" result="steelCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#f0f9ff" floodOpacity="0.9" result="iceRim" />
            <feMerge>
              <feMergeNode in="steelCorona" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="kairon-gun-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
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

          <filter id="kairon-sword-oversprite-shader" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3.2" result="innerCore" />
            <feComposite in="SourceAlpha" in2="innerCore" operator="out" result="fresnelRim" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.14" numOctaves="2" seed="23" result="shimmerNoise">
              <animate attributeName="baseFrequency" values="0.02 0.12; 0.045 0.22; 0.02 0.12" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="fresnelRim" in2="shimmerNoise" scale="4.0" xChannelSelector="R" yChannelSelector="G" result="rippledRim" />
            <feFlood floodColor="#e0f2fe" floodOpacity="0.96" result="iceFlood" />
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
          key={`kairon-vfx-${skillType}-${tier}-${vfxKey}`}
          className="absolute inset-0 pointer-events-none z-[25] overflow-visible select-none"
        >
          <style>{`
            /* 1. BALAS SUPERSÓNICAS DE REVOLVER */
            @keyframes kaironBulletFly {
              0% {
                transform: translate(0px, 0px) scale(0.55);
                opacity: 0;
              }
              15% {
                transform: translate(34px, calc(var(--arc-y, 0px) * 0.25)) scale(1.06);
                opacity: 1;
              }
              74% {
                transform: translate(188px, var(--arc-y, 0px)) scale(1.0);
                opacity: 1;
              }
              100% {
                transform: translate(224px, var(--arc-y, 0px)) scale(0.82);
                opacity: 0;
              }
            }

            /* 2. FOGONAZOS & DETONACIONES DE PÓLVORA */
            @keyframes kaironMuzzleBurst {
              0% {
                transform: scale(0.22) rotate(var(--blast-rot, 0deg));
                opacity: 0;
              }
              24% {
                transform: scale(1.16) rotate(calc(var(--blast-rot, 0deg) + 12deg));
                opacity: 1;
              }
              68% {
                transform: scale(0.96) rotate(calc(var(--blast-rot, 0deg) + 18deg));
                opacity: 0.88;
              }
              100% {
                transform: scale(1.24) rotate(calc(var(--blast-rot, 0deg) + 28deg));
                opacity: 0;
              }
            }

            /* 3. ESPADAZO DE ACERO: Tajos crecientes glaciales */
            @keyframes kaironSteelSlashArc {
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

            @keyframes kaironSlashSweepMask {
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

            @keyframes kaironAuraBloom {
              0% { transform: scaleX(0.55) scaleY(0.45); opacity: 0; }
              24% { transform: scaleX(1.08) scaleY(1.05); opacity: 0.95; }
              62% { transform: scaleX(1.0) scaleY(1.0); opacity: 0.86; }
              100% { transform: scaleX(1.18) scaleY(1.08); opacity: 0; }
            }

            @keyframes kaironComicPop {
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

          {/* Fogonazos en cañón y explosiones de pólvora en impacto */}
          {(skillType === 'kairon_tiro_doble' || skillType === 'kairon_disparo_dual') &&
            triggeredMuzzles.map((idx) => {
              const m = activeMuzzles[idx];
              if (!m) return null;
              return (
                <div
                  key={`kairon-muzzle-${vfxKey}-${idx}`}
                  className="absolute pointer-events-none z-20 overflow-visible flex items-center justify-center"
                  style={{
                    left: m.leftPct !== undefined ? `${m.leftPct}%` : undefined,
                    right: m.rightPct !== undefined ? `${m.rightPct}%` : undefined,
                    bottom: `${m.bottomPct}%`,
                    width: `${m.sizePx}px`,
                    height: `${m.sizePx}px`,
                  }}
                >
                  <img
                    src="/assets/combat/kairon_vfx_muzzle.png"
                    alt="Fogonazo de Pólvora"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--blast-rot': `${m.rotateDeg}deg`,
                        filter: 'url(#kairon-muzzle-shader)',
                        animation: 'kaironMuzzleBurst 0.36s cubic-bezier(0.16,1,0.3,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* ================================================================= */}
          {/* 1 & 2. TIRO DOBLE & DISPARO DUAL: Proyectiles bala                */}
          {/* ================================================================= */}
          {(skillType === 'kairon_tiro_doble' || skillType === 'kairon_disparo_dual') &&
            triggeredBullets.map((idx) => {
              const b = activeBullets[idx];
              if (!b) return null;
              return (
                <div
                  key={`kairon-bullet-${vfxKey}-${idx}`}
                  className="absolute pointer-events-none z-20 overflow-visible"
                  style={{
                    left: `${b.startLeftPct}%`,
                    bottom: `${b.startBottomPct}%`,
                    width: `${b.widthPx}px`,
                    height: `${Math.round(b.widthPx * 0.28)}px`,
                    transform: `rotate(${b.angleDeg}deg) scale(${b.scale})`,
                  }}
                >
                  <img
                    src="/assets/combat/kairon_vfx_bullet.png"
                    alt="Proyectil de Revólver"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--arc-y': `${b.arcY}px`,
                        filter: bulletShaderFilter,
                        animation: 'kaironBulletFly 0.38s cubic-bezier(0.16,0.9,0.28,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* ================================================================= */}
          {/* 3. ESPADAZO DE ACERO (kairon_espadazo_largo): 2 / 4 / 6 tajos     */}
          {/* ================================================================= */}
          {skillType === 'kairon_espadazo_largo' &&
            triggeredSlashes.map((idx) => {
              const s = activeSlashes[idx];
              if (!s) return null;
              const flipScaleX = s.flipX ? -1 : 1;
              const flipScaleY = s.flipY ? -1 : 1;
              return (
                <div
                  key={`kairon-steel-slash-${vfxKey}-${idx}`}
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
                    src="/assets/combat/kairon_vfx_tajo_acero.png"
                    alt="Espadazo de Acero"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    style={
                      {
                        '--slash-rot': `${s.rotateDeg}deg`,
                        filter: swordShaderFilter,
                        animation: 'kaironSteelSlashArc 0.46s cubic-bezier(0.16,1,0.3,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                  <img
                    src="/assets/combat/kairon_vfx_tajo_acero.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={
                      {
                        '--slash-rot': `${s.rotateDeg}deg`,
                        mixBlendMode: 'screen',
                        filter: 'url(#kairon-sword-sweep-shader)',
                        WebkitMaskImage:
                          'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 82%)',
                        maskImage:
                          'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 82%)',
                        WebkitMaskSize: '240% 100%',
                        maskSize: '240% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        animation:
                          'kaironSteelSlashArc 0.46s cubic-bezier(0.16,1,0.3,1) forwards, kaironSlashSweepMask 0.46s cubic-bezier(0.22,1,0.36,1) forwards',
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}

          {/* Onomatopeyas cómic: BANG! (Pistolas) o SLASH! (Espadazo de Acero) */}
          {triggeredPopups.map((idx) => {
            const p = activePopups[idx];
            if (!p) return null;
            const isSwordPopup = skillType === 'kairon_espadazo_largo';
            const popupSrc = isSwordPopup
              ? p.goldVariant
                ? '/assets/combat/arlem_vfx_slash_gold.png'
                : '/assets/combat/arlem_vfx_slash.png'
              : '/assets/combat/kairon_vfx_bang.png';
            return (
              <div
                key={`kairon-popup-${vfxKey}-${idx}`}
                className="absolute pointer-events-none z-30 overflow-visible"
                style={{
                  right: `${p.rightPct}%`,
                  bottom: `${p.bottomPct}%`,
                  width: `${p.widthPx}px`,
                  height: `${Math.round(p.widthPx * 0.6)}px`,
                  transform: `rotate(${p.rotateDeg}deg)`,
                }}
              >
                <img
                  src={popupSrc}
                  alt={isSwordPopup ? 'SLASH!' : 'BANG!'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  style={{
                    filter: isSwordPopup
                      ? 'url(#kairon-slash-ono-shader)'
                      : 'url(#kairon-bang-shader)',
                    animation: 'kaironComicPop 0.54s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
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
