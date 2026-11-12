import React, { useState, useEffect, useRef } from 'react';

export interface CartoonFxAnimatedSpriteOverlayProps {
  activeSkillVfx: { type: string; tier?: number; isEnemy?: boolean } | null;
  activeEnemyAttack: { vfxType: string; themeColor: string } | null;
  heroHitKey?: number;
  enemyHitKey?: number;
  heroImpactDamageType?: string | null;
  enemyImpactDamageType?: string | null;
}

/**
 * Reusable Frame-by-Frame Animated Sprite Sheet Component
 * Plays authentic Cartoon FX Remaster multi-frame sprite sheets seamlessly.
 */
interface CFXRSpriteSheetProps {
  src: string;
  cols: number;
  rows: number;
  fps?: number;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

export const CFXRSpriteSheet: React.FC<CFXRSpriteSheetProps> = ({
  src,
  cols,
  rows,
  fps = 16,
  loop = false,
  className = '',
  style = {},
  onComplete,
}) => {
  const [frame, setFrame] = useState(0);
  const totalFrames = cols * rows;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setFrame(0);
    const intervalMs = Math.round(1000 / fps);
    const timer = setInterval(() => {
      setFrame((prev) => {
        const next = prev + 1;
        if (next >= totalFrames) {
          if (loop) return 0;
          clearInterval(timer);
          if (onCompleteRef.current) onCompleteRef.current();
          return totalFrames - 1;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [src, totalFrames, fps, loop]);

  const col = frame % cols;
  const row = Math.floor(frame / cols);
  const posX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const posY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
};

interface ActiveHitBurst {
  id: number;
  target: 'hero' | 'enemy';
  damageType: string;
}

/**
 * CARTOON FX REMASTER - ANIMATED SPRITE COMBAT VFX OVERLAY
 *
 * Replaces all canvas particle simulators with crisp, authentic Cartoon FX Remaster
 * animated sprites, flipbooks and multi-frame sheets.
 */
export const CartoonFxAnimatedSpriteOverlay: React.FC<CartoonFxAnimatedSpriteOverlayProps> = ({
  activeSkillVfx,
  activeEnemyAttack,
  heroHitKey = 0,
  enemyHitKey = 0,
  heroImpactDamageType,
  enemyImpactDamageType,
}) => {
  const [hitBursts, setHitBursts] = useState<ActiveHitBurst[]>([]);
  const prevHeroKey = useRef(heroHitKey);
  const prevEnemyKey = useRef(enemyHitKey);

  // Trigger instant hit reaction sprite on Hero
  useEffect(() => {
    if (heroHitKey > 0 && heroHitKey !== prevHeroKey.current) {
      prevHeroKey.current = heroHitKey;
      const id = Date.now() + Math.random();
      const type = heroImpactDamageType || 'slashing';
      setHitBursts((prev) => [...prev, { id, target: 'hero', damageType: type }]);
      setTimeout(() => {
        setHitBursts((prev) => prev.filter((b) => b.id !== id));
      }, 550);
    }
  }, [heroHitKey, heroImpactDamageType]);

  // Trigger instant hit reaction sprite on Enemy
  useEffect(() => {
    if (enemyHitKey > 0 && enemyHitKey !== prevEnemyKey.current) {
      prevEnemyKey.current = enemyHitKey;
      const id = Date.now() + Math.random();
      const type = enemyImpactDamageType || 'slashing';
      setHitBursts((prev) => [...prev, { id, target: 'enemy', damageType: type }]);
      setTimeout(() => {
        setHitBursts((prev) => prev.filter((b) => b.id !== id));
      }, 550);
    }
  }, [enemyHitKey, enemyImpactDamageType]);

  // Active skill visual determination
  const skillType = activeSkillVfx?.type || activeEnemyAttack?.vfxType || null;
  const isEnemySkill = !!activeEnemyAttack || !!activeSkillVfx?.isEnemy;
  const tier = activeSkillVfx?.tier || 1;
  const tierScale = tier === 3 ? 1.3 : tier === 2 ? 1.15 : 1.0;

  // Determine target placement: hero on left, enemy on right
  const isTargetHero = isEnemySkill || skillType === 'fortalecer_marioneta';
  const isTargetScreen = skillType === 'cataclismo_astral';

  return (
    <div className="absolute inset-0 pointer-events-none z-45 overflow-visible select-none">
      <style>{`
        @keyframes cfxrSlashSweepA {
          0% { transform: translate(-60px, -60px) rotate(-35deg) scale(0.4); opacity: 0; }
          20% { transform: translate(0px, 0px) rotate(-35deg) scale(1.25); opacity: 0.95; }
          65% { transform: translate(30px, 30px) rotate(-35deg) scale(1.1); opacity: 0.9; }
          100% { transform: translate(70px, 60px) rotate(-35deg) scale(0.3); opacity: 0; }
        }

        @keyframes cfxrSlashSweepB {
          0% { transform: translate(60px, -60px) rotate(35deg) scale(0.4); opacity: 0; }
          20% { transform: translate(0px, 0px) rotate(35deg) scale(1.2); opacity: 0.95; }
          65% { transform: translate(-30px, 30px) rotate(35deg) scale(1.05); opacity: 0.9; }
          100% { transform: translate(-70px, 60px) rotate(35deg) scale(0.3); opacity: 0; }
        }

        @keyframes cfxrRingExpand {
          0% { transform: scale(0.2); opacity: 0; }
          25% { transform: scale(0.7); opacity: 0.95; }
          75% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(1.7); opacity: 0; }
        }

        @keyframes cfxrSkullPop {
          0% { transform: scale(0.3) translateY(30px); opacity: 0; }
          30% { transform: scale(1.3) translateY(-10px); opacity: 1; filter: drop-shadow(0 0 25px #a855f7); }
          70% { transform: scale(1.1) translateY(-25px); opacity: 0.85; }
          100% { transform: scale(1.5) translateY(-45px); opacity: 0; filter: drop-shadow(0 0 35px #7c3aed); }
        }

        @keyframes cfxrSpikePop {
          0% { transform: scaleY(0.2) scaleX(0.5); opacity: 0; }
          25% { transform: scaleY(1.3) scaleX(1.1); opacity: 1; }
          70% { transform: scaleY(1.05) scaleX(1.0); opacity: 0.9; }
          100% { transform: scaleY(0.4) scaleX(0.8); opacity: 0; }
        }

        @keyframes cfxrBloodBurst {
          0% { transform: scale(0.3); opacity: 0; }
          30% { transform: scale(1.25); opacity: 1; }
          75% { transform: scale(1.1); opacity: 0.85; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @keyframes cfxrStarSpin {
          0% { transform: rotate(0deg) scale(0.3); opacity: 0; }
          30% { transform: rotate(180deg) scale(1.3); opacity: 1; filter: drop-shadow(0 0 30px #facc15); }
          70% { transform: rotate(360deg) scale(1.1); opacity: 0.9; }
          100% { transform: rotate(540deg) scale(0.4); opacity: 0; }
        }

        @keyframes cfxrHitPop {
          0% { transform: scale(0.4); opacity: 0; }
          35% { transform: scale(1.25); opacity: 1; }
          70% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* =================================================================== */}
      {/* 1. ACTIVE SKILL ANIMATED SPRITES                                    */}
      {/* =================================================================== */}
      {skillType && (
        <div
          className={`absolute flex items-center justify-center pointer-events-none ${
            isTargetScreen
              ? 'inset-0 w-full h-full'
              : isTargetHero
              ? 'left-[10px] bottom-[30px] w-[280px] h-[310px]'
              : 'right-[10px] bottom-[30px] w-[300px] h-[310px]'
          }`}
          style={{
            transform: `scale(${tierScale})`,
            transformOrigin: 'center bottom',
          }}
        >
          {/* FIRE / LLAMARADA INFERNAL: 8-Frame Animated Fire Sprite + Smoke Cloud */}
          {(skillType === 'llamarada_infernal' || skillType.includes('fire') || skillType.includes('flame')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Floor expanding fire ring */}
              <img
                src="/assets/cfxr/graphics/cfxr-fire-circle-crisp.png"
                alt=""
                className="absolute bottom-4 w-[240px] h-[120px] object-contain animate-[cfxrRingExpand_0.75s_ease-out_forwards] filter drop-shadow-[0_0_24px_#f97316]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Central 8-Frame Animated CFXR Roaring Flame Spritesheet */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-fire-small-anim.png"
                cols={4}
                rows={2}
                fps={15}
                loop={true}
                className="w-[220px] h-[240px] filter drop-shadow-[0_0_28px_#ea580c]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* 4-Frame Smoke Cloud Plume */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-smoke-cloud-x4.png"
                cols={4}
                rows={1}
                fps={8}
                loop={false}
                className="absolute top-2 w-[190px] h-[190px] opacity-75"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* RAYO DE MAGORDITO: Combinación de 3 vídeos CFXR (Lightning Strike Green + Hit D 3D Cyan + Hit Pow Blue-Cyan) */}
          {(skillType === 'rayo_necrotico' ||
            skillType === 'rayo_voltaico' ||
            skillType === 'rayo' ||
            skillType.includes('rayo')) && (
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              {/* Radial Cyan-Green Glow Backing */}
              <div
                className="absolute w-[290px] h-[290px] rounded-full bg-emerald-400/20 blur-2xl animate-pulse pointer-events-none"
                style={{ mixBlendMode: 'screen' }}
              />

              {/* 1. Electric Variants CFXR Lightning Strike & Impact (Green) - Descending thunderbolt & ground sparks */}
              <video
                src="/assets/aistudio/Electric_Variants_CFXR_Lightning_Strike___Impact__Green__46fae418.webm"
                autoPlay
                playsInline
                muted
                className="absolute -top-10 w-[310px] h-[340px] object-contain filter drop-shadow-[0_0_26px_#22c55e] drop-shadow-[0_0_40px_#10b981] z-20"
                style={{ mixBlendMode: 'screen' }}
              />

              {/* 2. Impacts Variants CFXR Hit D 3D (Cyan) - Expanding 3D impact shockwaves */}
              <video
                src="/assets/aistudio/Impacts_Variants_CFXR_Hit_D_3D__Cyan__0ead4fe4.webm"
                autoPlay
                playsInline
                muted
                className="absolute bottom-2 w-[270px] h-[270px] object-contain filter drop-shadow-[0_0_28px_#06b6d4] drop-shadow-[0_0_45px_#0891b2] z-30"
                style={{ mixBlendMode: 'screen' }}
              />

              {/* 3. Misc Variants CFXR4 Hit Pow Cartoon (Blue-Cyan) - Explosive comic POW burst */}
              <video
                src="/assets/aistudio/Misc_Variants_CFXR4_Hit_Pow_Cartoon__Blue-Cyan__626d44c0.webm"
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 w-[280px] h-[280px] object-contain filter drop-shadow-[0_0_26px_#38bdf8] drop-shadow-[0_0_40px_#0284c7] z-40"
                style={{ mixBlendMode: 'screen' }}
              />

              {/* Ground Expanding Shockwave Ring */}
              <img
                src="/assets/cfxr/graphics/cfxr-ring-electric-cyan.png"
                alt=""
                className="absolute bottom-2 w-[270px] h-[135px] object-contain animate-[cfxrRingExpand_0.65s_ease-out_forwards] filter drop-shadow-[0_0_24px_#00f7ff] z-10"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* LIGHTNING / RAYO VOLTAICO / MEDUSA ELECTRIC: 8-Frame Electric Arc Spritesheet + Ring */}
          {(skillType === 'gorgon_lightning' ||
            skillType === 'medusa_electric' ||
            skillType === 'abyssal_electric' ||
            skillType.includes('electric') ||
            skillType.includes('lightning')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Electric Shockwave Ring */}
              <img
                src="/assets/cfxr/graphics/cfxr-ring-electric-cyan.png"
                alt=""
                className="absolute bottom-6 w-[250px] h-[130px] object-contain animate-[cfxrRingExpand_0.65s_ease-out_forwards] filter drop-shadow-[0_0_26px_#00f7ff]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* 8-Frame Animated High-Voltage Electric Arc Sheet */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-electric-small-anim-4x2-cyan.png"
                cols={4}
                rows={2}
                fps={18}
                loop={true}
                className="w-[240px] h-[260px] filter drop-shadow-[0_0_32px_#38bdf8]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Additional Electric Arc Burst */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-electric-arc-anim-x4-cyan.png"
                cols={4}
                rows={1}
                fps={14}
                loop={true}
                className="absolute top-4 w-[210px] h-[210px] filter drop-shadow-[0_0_24px_#00f7ff]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* SLASH / FORTALECER MARIONETA / CRIMSON CLAW: CFXR Sword Trails & Blood Splash */}
          {(skillType === 'fortalecer_marioneta' ||
            skillType === 'crimson_claw' ||
            skillType === 'araknoide_claw' ||
            skillType.includes('claw') ||
            skillType.includes('slash')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Primary Slash Trail Sprite */}
              <img
                src={
                  skillType.includes('claw')
                    ? '/assets/cfxr/graphics/cfxr-sword-trail-mask-light-crimson.png'
                    : '/assets/cfxr/graphics/cfxr-sword-trail-mask-light.png'
                }
                alt=""
                className="absolute inset-0 w-full h-full object-contain animate-[cfxrSlashSweepA_0.42s_ease-out_forwards] filter drop-shadow-[0_0_24px_#ef4444]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Secondary Cross-Cut Slash Trail Sprite */}
              <img
                src="/assets/cfxr/graphics/cfxr-sword-trail-mask-light-crimson.png"
                alt=""
                className="absolute inset-0 w-full h-full object-contain animate-[cfxrSlashSweepB_0.38s_ease-out_forwards] filter drop-shadow-[0_0_22px_#dc2626]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Animated Blood Splash Sprite on Impact */}
              <img
                src="/assets/cfxr/graphics/cfxr-blood-splash.png"
                alt=""
                className="absolute w-[180px] h-[180px] object-contain animate-[cfxrBloodBurst_0.48s_ease-out_forwards] filter drop-shadow-[0_0_18px_#b91c1c]"
              />
              {/* Sharp CFXR Hit Spikes */}
              <img
                src="/assets/cfxr/graphics/cfxr-spikes-impact.png"
                alt=""
                className="absolute w-[160px] h-[160px] object-contain animate-[cfxrSpikePop_0.4s_ease-out_forwards] filter drop-shadow-[0_0_20px_#fbbf24]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* ICE / LANZA GLACIAL / FROST BLIZZARD: 4-Frame Ice Debris Spritesheet + Ring */}
          {(skillType === 'lanza_glacial' || skillType === 'frost_blizzard' || skillType.includes('ice') || skillType.includes('frost')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Ground Ice Ring Sprite */}
              <img
                src="/assets/cfxr/graphics/cfxr-ring-ice.png"
                alt=""
                className="absolute bottom-6 w-[260px] h-[130px] object-contain animate-[cfxrRingExpand_0.7s_ease-out_forwards] filter drop-shadow-[0_0_26px_#38bdf8]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* 4-Frame Animated Ice Debris Spritesheet (2x2) */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-debris-ice-2x2.png"
                cols={2}
                rows={2}
                fps={10}
                loop={true}
                className="w-[230px] h-[230px] filter drop-shadow-[0_0_28px_#0284c7]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Cyan Ice Spikes Impact */}
              <img
                src="/assets/cfxr/graphics/cfxr-spikes-impact-cyan.png"
                alt=""
                className="absolute bottom-8 w-[200px] h-[200px] object-contain animate-[cfxrSpikePop_0.6s_ease-out_forwards] filter drop-shadow-[0_0_24px_#38bdf8]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* EARTH / MARTILLO TITAN / EARTH TITAN: 9-Frame Rock Debris Spritesheet (3x3) */}
          {(skillType === 'martillo_titan' || skillType === 'earth_titan' || skillType.includes('earth') || skillType.includes('titan')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Ground Earth Shockwave */}
              <img
                src="/assets/cfxr/graphics/cfxr-ring-spikes-revert.png"
                alt=""
                className="absolute bottom-6 w-[260px] h-[140px] object-contain animate-[cfxrRingExpand_0.75s_ease-out_forwards] filter drop-shadow-[0_0_24px_#d97706]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* 9-Frame Animated Rock Debris Spritesheet (3x3) */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-debris-3x3.png"
                cols={3}
                rows={3}
                fps={14}
                loop={true}
                className="w-[240px] h-[240px] filter drop-shadow-[0_0_22px_#b45309]"
              />
              {/* Erupting Gold Spikes Impact */}
              <img
                src="/assets/cfxr/graphics/cfxr-spikes-impact-gold.png"
                alt=""
                className="absolute bottom-8 w-[220px] h-[220px] object-contain animate-[cfxrSpikePop_0.6s_ease-out_forwards] filter drop-shadow-[0_0_28px_#f59e0b]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* DARK / DIOS OSCURO / VOID MIASMA / SHADOW NEEDLE: Purple Skull Dissolve & Runes */}
          {(skillType === 'dios_oscuro' ||
            skillType === 'void_miasma' ||
            skillType === 'shadow_needle' ||
            skillType === 'araknoide_death' ||
            skillType.includes('dark') ||
            skillType.includes('shadow')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Expanding Crimson/Purple Ripple */}
              <img
                src="/assets/cfxr/graphics/cfxr-ring-ripple-dissolve-crimson.png"
                alt=""
                className="absolute bottom-6 w-[260px] h-[140px] object-contain animate-[cfxrRingExpand_0.8s_ease-out_forwards] filter drop-shadow-[0_0_26px_#7c3aed]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Spinning Dark Runic Aura */}
              <img
                src="/assets/cfxr/graphics/cfxr-aura-runic-purple.png"
                alt=""
                className="absolute w-[220px] h-[220px] object-contain animate-[cfxrStarSpin_0.85s_ease-out_forwards] filter drop-shadow-[0_0_30px_#a855f7]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Animated Dissolving Purple Skull */}
              <img
                src="/assets/cfxr/graphics/cfxr-skull-dissolve-violet.png"
                alt=""
                className="absolute top-2 w-[210px] h-[210px] object-contain animate-[cfxrSkullPop_0.75s_ease-out_forwards] filter drop-shadow-[0_0_32px_#6d28d9]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* DRAIN / POISON / TOXIC / DRENAR MALDICIONES: CFXR Water Drop Anim & Bubbles */}
          {(skillType === 'drenar_maldiciones' || skillType.includes('poison') || skillType.includes('drain') || skillType.includes('acid')) && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Animated Water/Acid Drop Spritesheet */}
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-water-drop-blur-anim.png"
                cols={2}
                rows={3}
                fps={12}
                loop={true}
                className="w-[210px] h-[230px] filter drop-shadow-[0_0_26px_#10b981]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Popping Toxic Bubbles */}
              <img
                src="/assets/cfxr/graphics/cfxr-bubble-2.png"
                alt=""
                className="absolute w-[180px] h-[180px] object-contain animate-[cfxrHitPop_0.6s_ease-out_forwards] filter drop-shadow-[0_0_24px_#34d399]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Splashing Acid */}
              <img
                src="/assets/cfxr/graphics/cfxr-water-small-splash-stretch.png"
                alt=""
                className="absolute bottom-6 w-[230px] h-[120px] object-contain animate-[cfxrRingExpand_0.6s_ease-out_forwards] filter drop-shadow-[0_0_20px_#22c55e]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* CATACLISMO ASTRAL (ULTIMATE NOBLE PHANTASM): Full Screen Celestial Magic Star & Aura Rays */}
          {skillType === 'cataclismo_astral' && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Massive Golden Electric Ring */}
              <img
                src="/assets/cfxr/graphics/cfxr-ring-electric-gold.png"
                alt=""
                className="absolute w-[340px] h-[340px] object-contain animate-[cfxrRingExpand_1.1s_ease-out_forwards] filter drop-shadow-[0_0_40px_#f59e0b]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Rotating Celestial Rays Aura */}
              <img
                src="/assets/cfxr/graphics/cfxr-aura-rays.png"
                alt=""
                className="absolute w-[360px] h-[360px] object-contain animate-[cfxrStarSpin_1.3s_ease-out_forwards] filter drop-shadow-[0_0_45px_#facc15]"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Giant CFXR Magic Star Gold */}
              <img
                src="/assets/cfxr/graphics/cfxr-magic-star-gold.png"
                alt=""
                className="w-[280px] h-[280px] object-contain animate-[cfxrStarSpin_1.0s_ease-out_forwards] filter drop-shadow-[0_0_50px_#ffffff]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* ROXANNE: VELADA ENCANTADORA & INSPIRACIÓN BÁRDICA (Magia Rosada & Notas) */}
          {(skillType === 'roxanne_velada' || skillType === 'roxanne_inspiracion' || skillType?.includes('velada')) && (
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <img
                src="/assets/cfxr/graphics/cfxr-ring-electric-violet.png"
                alt=""
                className="absolute w-[290px] h-[290px] object-contain animate-[cfxrRingExpand_0.85s_ease-out_forwards] filter drop-shadow-[0_0_30px_#ec4899] hue-rotate-[320deg]"
                style={{ mixBlendMode: 'screen' }}
              />
              <img
                src="/assets/cfxr/graphics/cfxr-heart.png"
                alt=""
                className="absolute w-[180px] h-[180px] object-contain animate-[cfxrStarSpin_0.9s_ease-out_forwards] filter drop-shadow-[0_0_35px_#f43f5e] drop-shadow-[0_0_20px_#ec4899]"
                style={{ mixBlendMode: 'screen' }}
              />
              <img
                src="/assets/cfxr/graphics/cfxr-heart-break-parts.png"
                alt=""
                className="absolute w-[160px] h-[160px] object-contain animate-[cfxrHitPop_0.8s_ease-out_forwards] filter drop-shadow-[0_0_25px_#ec4899]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}

          {/* ROXANNE: ESTOCADA SONORA DE RAPIER */}
          {skillType === 'roxanne_estocada' && (
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <img
                src="/assets/cfxr/graphics/cfxr-sword-trail-mask-light-crimson.png"
                alt=""
                className="absolute w-[260px] h-[260px] object-contain animate-[cfxrSlashSweepA_0.6s_ease-out_forwards] filter drop-shadow-[0_0_30px_#ec4899] hue-rotate-[290deg]"
                style={{ mixBlendMode: 'screen' }}
              />
              <img
                src="/assets/cfxr/graphics/cfxr-spikes-impact-cyan.png"
                alt=""
                className="absolute bottom-6 w-[200px] h-[200px] object-contain animate-[cfxrSpikePop_0.5s_ease-out_forwards] filter drop-shadow-[0_0_25px_#f43f5e] hue-rotate-[280deg]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. INSTANT ANIMATED HIT BURST SPRITES ON HERO & ENEMY               */}
      {/* =================================================================== */}
      {hitBursts.map((burst) => {
        const isHero = burst.target === 'hero';
        const positionClass = isHero
          ? 'left-[40px] bottom-[97px] w-[200px] h-[200px]'
          : 'right-[40px] bottom-[80px] w-[210px] h-[210px]';

        return (
          <div
            key={burst.id}
            className={`absolute flex items-center justify-center pointer-events-none ${positionClass}`}
          >
            {/* FIRE HIT: 8-Frame Flame Burst */}
            {burst.damageType === 'fire' && (
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-fire-small-anim.png"
                cols={4}
                rows={2}
                fps={18}
                loop={false}
                className="w-[180px] h-[190px] filter drop-shadow-[0_0_24px_#f97316]"
                style={{ mixBlendMode: 'screen' }}
              />
            )}

            {/* COLD HIT: 4-Frame Ice Shatter */}
            {burst.damageType === 'cold' && (
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-debris-ice-2x2.png"
                cols={2}
                rows={2}
                fps={12}
                loop={false}
                className="w-[170px] h-[170px] filter drop-shadow-[0_0_22px_#38bdf8]"
                style={{ mixBlendMode: 'screen' }}
              />
            )}

            {/* LIGHTNING HIT: 4-Frame Electric Arc */}
            {burst.damageType === 'lightning' && (
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-electric-arc-anim-x4-cyan.png"
                cols={4}
                rows={1}
                fps={16}
                loop={false}
                className="w-[190px] h-[190px] filter drop-shadow-[0_0_28px_#00f7ff]"
                style={{ mixBlendMode: 'screen' }}
              />
            )}

            {/* SLASHING / PIERCING HIT: Crimson Sword Trail + Blood Splash */}
            {(burst.damageType === 'slashing' || burst.damageType === 'piercing') && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/assets/cfxr/graphics/cfxr-sword-trail-mask-light-crimson.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain animate-[cfxrSlashSweepA_0.35s_ease-out_forwards] filter drop-shadow-[0_0_20px_#ef4444]"
                  style={{ mixBlendMode: 'screen' }}
                />
                <img
                  src="/assets/cfxr/graphics/cfxr-blood-splash.png"
                  alt=""
                  className="w-[140px] h-[140px] object-contain animate-[cfxrBloodBurst_0.42s_ease-out_forwards]"
                />
              </div>
            )}

            {/* BLUDGEONING HIT: 9-Frame Rock Impact Debris */}
            {burst.damageType === 'bludgeoning' && (
              <CFXRSpriteSheet
                src="/assets/cfxr/graphics/cfxr-debris-3x3.png"
                cols={3}
                rows={3}
                fps={16}
                loop={false}
                className="w-[180px] h-[180px] filter drop-shadow-[0_0_20px_#f59e0b]"
              />
            )}

            {/* NECROTIC / PSYCHIC HIT: Purple Skull Pop */}
            {(burst.damageType === 'necrotic' || burst.damageType === 'psychic') && (
              <img
                src="/assets/cfxr/graphics/cfxr-skull-dissolve-violet.png"
                alt=""
                className="w-[160px] h-[160px] object-contain animate-[cfxrSkullPop_0.48s_ease-out_forwards] filter drop-shadow-[0_0_26px_#a855f7]"
                style={{ mixBlendMode: 'screen' }}
              />
            )}

            {/* ACID / POISON HIT: Bubble Splash */}
            {(burst.damageType === 'acid' || burst.damageType === 'poison') && (
              <img
                src="/assets/cfxr/graphics/cfxr-bubble-2.png"
                alt=""
                className="w-[160px] h-[160px] object-contain animate-[cfxrHitPop_0.45s_ease-out_forwards] filter drop-shadow-[0_0_22px_#10b981]"
                style={{ mixBlendMode: 'screen' }}
              />
            )}

            {/* RADIANT / FORCE HIT: Magic Star Flash */}
            {(burst.damageType === 'radiant' || burst.damageType === 'force' || burst.damageType === 'thunder') && (
              <img
                src="/assets/cfxr/graphics/cfxr-magic-star-gold.png"
                alt=""
                className="w-[160px] h-[160px] object-contain animate-[cfxrStarSpin_0.5s_ease-out_forwards] filter drop-shadow-[0_0_28px_#fbbf24]"
                style={{ mixBlendMode: 'screen' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
