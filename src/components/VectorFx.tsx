import React from 'react';
import { DndDamageType } from '../types/dndCombatDamage';

export interface VectorFxIconProps {
  src: string;
  className?: string;
  color?: string;
  gradient?: string;
  glow?: string;
  glowSize?: number;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * High-performance, GPU-accelerated Vector FX Renderer
 * Uses CSS mask-image so vector icons can be dynamically recolored
 * with any vibrant gradient, solid color, or neon drop-shadow glow without SVG parsing lag.
 */
export const VectorFxIcon: React.FC<VectorFxIconProps> = ({
  src,
  className = 'w-8 h-8',
  color,
  gradient,
  glow,
  glowSize = 12,
  style,
}) => {
  const maskStyle: React.CSSProperties = {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    filter: glow ? `drop-shadow(0 0 ${glowSize}px ${glow})` : undefined,
    ...style,
  };

  if (gradient) {
    return (
      <div
        className={`bg-gradient-to-br ${gradient} ${className}`}
        style={maskStyle}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: color || '#ffffff',
        ...maskStyle,
      }}
    />
  );
};

/**
 * Mapeo de vectores de tipos de daño D&D 5e
 */
export const DND_DAMAGE_VECTOR_MAP: Record<
  DndDamageType,
  {
    svg: string;
    gradient: string;
    glow: string;
    badgeBg: string;
    border: string;
    name: string;
  }
> = {
  slashing: {
    svg: '/assets/vector-fx/damage/dmg-slashing.svg',
    gradient: 'from-amber-200 via-amber-400 to-yellow-600',
    glow: '#f59e0b',
    badgeBg: 'bg-amber-950/80',
    border: 'border-amber-500/70',
    name: 'Cortante',
  },
  piercing: {
    svg: '/assets/vector-fx/damage/dmg-piercing.svg',
    gradient: 'from-emerald-200 via-emerald-400 to-teal-600',
    glow: '#10b981',
    badgeBg: 'bg-emerald-950/80',
    border: 'border-emerald-500/70',
    name: 'Perforante',
  },
  bludgeoning: {
    svg: '/assets/vector-fx/damage/dmg-bludgeoning.svg',
    gradient: 'from-stone-200 via-stone-400 to-amber-700',
    glow: '#d97706',
    badgeBg: 'bg-stone-900/80',
    border: 'border-amber-600/70',
    name: 'Contundente',
  },
  fire: {
    svg: '/assets/vector-fx/damage/dmg-fire.svg',
    gradient: 'from-yellow-200 via-orange-500 to-red-600',
    glow: '#f97316',
    badgeBg: 'bg-red-950/80',
    border: 'border-orange-500/70',
    name: 'Fuego',
  },
  cold: {
    svg: '/assets/vector-fx/damage/dmg-cold.svg',
    gradient: 'from-white via-cyan-300 to-sky-500',
    glow: '#38bdf8',
    badgeBg: 'bg-cyan-950/80',
    border: 'border-cyan-400/70',
    name: 'Frío',
  },
  lightning: {
    svg: '/assets/vector-fx/damage/dmg-lightning.svg',
    gradient: 'from-white via-yellow-300 to-cyan-400',
    glow: '#00f7ff',
    badgeBg: 'bg-blue-950/80',
    border: 'border-cyan-400/70',
    name: 'Relámpago',
  },
  thunder: {
    svg: '/assets/vector-fx/damage/dmg-thunder.svg',
    gradient: 'from-indigo-200 via-blue-400 to-indigo-600',
    glow: '#6366f1',
    badgeBg: 'bg-indigo-950/80',
    border: 'border-indigo-400/70',
    name: 'Trueno',
  },
  acid: {
    svg: '/assets/vector-fx/damage/dmg-acid.svg',
    gradient: 'from-lime-200 via-lime-400 to-emerald-600',
    glow: '#84cc16',
    badgeBg: 'bg-lime-950/80',
    border: 'border-lime-400/70',
    name: 'Ácido',
  },
  poison: {
    svg: '/assets/vector-fx/damage/dmg-poison.svg',
    gradient: 'from-emerald-200 via-teal-400 to-cyan-700',
    glow: '#14b8a6',
    badgeBg: 'bg-teal-950/80',
    border: 'border-teal-400/70',
    name: 'Veneno',
  },
  necrotic: {
    svg: '/assets/vector-fx/damage/dmg-necrotic.svg',
    gradient: 'from-purple-200 via-fuchsia-400 to-purple-800',
    glow: '#a855f7',
    badgeBg: 'bg-purple-950/80',
    border: 'border-purple-400/70',
    name: 'Necrótico',
  },
  radiant: {
    svg: '/assets/vector-fx/damage/dmg-radiant.svg',
    gradient: 'from-white via-yellow-200 to-amber-400',
    glow: '#fde047',
    badgeBg: 'bg-amber-950/80',
    border: 'border-yellow-300/70',
    name: 'Radiante',
  },
  force: {
    svg: '/assets/vector-fx/damage/dmg-force.svg',
    gradient: 'from-rose-200 via-red-400 to-purple-600',
    glow: '#f43f5e',
    badgeBg: 'bg-rose-950/80',
    border: 'border-rose-400/70',
    name: 'Fuerza',
  },
  psychic: {
    svg: '/assets/vector-fx/damage/dmg-psychic.svg',
    gradient: 'from-pink-200 via-fuchsia-400 to-violet-600',
    glow: '#ec4899',
    badgeBg: 'bg-pink-950/80',
    border: 'border-pink-400/70',
    name: 'Psíquico',
  },
};

/**
 * Insignia flotante de daño táctico D&D para combate
 */
export const DndDamageBadge: React.FC<{
  type: DndDamageType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}> = ({ type, size = 'sm', showLabel = false }) => {
  const meta = DND_DAMAGE_VECTOR_MAP[type];
  if (!meta) return null;

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-xs ${meta.badgeBg} ${meta.border} shadow-lg`}
    >
      <VectorFxIcon
        src={meta.svg}
        gradient={meta.gradient}
        glow={meta.glow}
        className={iconSizes[size]}
      />
      {showLabel && (
        <span className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-sm">
          {meta.name}
        </span>
      )}
    </div>
  );
};
