import React, { useId, useLayoutEffect, useMemo, useRef } from 'react';
import type { ActiveGachaEffect, GachaEffectType } from '../types/gachaCombatEffects';

export type ConditionKey =
  | 'frozen'
  | 'chill'
  | 'paralyze'
  | 'stun'
  | 'burn'
  | 'poison'
  | 'charmed'
  | 'faerie_fire'
  | 'bleed'
  | 'laceration'
  | 'confused'
  | 'corrosion'
  | 'decay'
  | 'def_break'
  | 'restrained'
  | 'blind'
  | 'holy_blind'
  | 'atk_down'
  | 'def_buff'
  | 'atk_buff'
  | 'regen'
  | 'haste';

export type AuraMotifKind =
  | 'flames'
  | 'frost'
  | 'lightning'
  | 'poison'
  | 'stun'
  | 'bleed'
  | 'shield'
  | 'power'
  | 'regen'
  | 'wind'
  | 'charm'
  | 'faerie'
  | 'confused'
  | 'shatter'
  | 'chains'
  | 'shadow'
  | 'radiance'
  | 'decay';

export interface StatusAuraConfig {
  key: ConditionKey;
  label: string;
  svgFilterId: string;
  auraShaderId: string;
  motif: AuraMotifKind;
  spriteUrl: string;
  primary: string;
  secondary: string;
  highlight: string;
  glow: string;
  cssFilter: string;
  blendMode: 'screen' | 'normal';
}

export function normalizeConditionKey(raw: GachaEffectType | string): ConditionKey | null {
  switch (raw) {
    case 'frozen':
      return 'frozen';
    case 'chill':
    case 'chilled':
      return 'chill';
    case 'paralyze':
    case 'paralyzed':
    case 'shock':
      return 'paralyze';
    case 'stun':
    case 'stunned':
      return 'stun';
    case 'burn':
      return 'burn';
    case 'poison':
    case 'poisoned':
      return 'poison';
    case 'charmed':
      return 'charmed';
    case 'faerie_fire':
      return 'faerie_fire';
    case 'bleed':
      return 'bleed';
    case 'laceration':
      return 'laceration';
    case 'confused':
    case 'frightened':
      return 'confused';
    case 'corrosion':
      return 'corrosion';
    case 'decay':
    case 'exhaustion':
      return 'decay';
    case 'def_break':
    case 'prone':
      return 'def_break';
    case 'restrained':
      return 'restrained';
    case 'blind':
    case 'blinded':
      return 'blind';
    case 'holy_blind':
      return 'holy_blind';
    case 'atk_down':
      return 'atk_down';
    case 'def_buff':
      return 'def_buff';
    case 'atk_buff':
      return 'atk_buff';
    case 'regen':
    case 'blessed':
      return 'regen';
    case 'haste':
      return 'haste';
    default:
      return null;
  }
}

export const STATUS_AURA_REGISTRY: Record<ConditionKey, StatusAuraConfig> = {
  burn: {
    key: 'burn',
    label: 'Quemadura',
    svgFilterId: 'status-sprite-burn',
    auraShaderId: 'aura-shader-fire',
    motif: 'flames',
    spriteUrl: '/assets/combat/status/aura_flames.png',
    primary: '#f97316',
    secondary: '#dc2626',
    highlight: '#fef08a',
    glow: 'rgba(249,115,22,0.52)',
    cssFilter: 'drop-shadow(0 0 5px rgba(249,115,22,0.52)) saturate(1.08)',
    blendMode: 'screen',
  },
  frozen: {
    key: 'frozen',
    label: 'Congelado',
    svgFilterId: 'status-sprite-frozen',
    auraShaderId: 'aura-shader-frost',
    motif: 'frost',
    spriteUrl: '/assets/combat/status/aura_frost.png',
    primary: '#38bdf8',
    secondary: '#0284c7',
    highlight: '#e0f2fe',
    glow: 'rgba(56,189,248,0.52)',
    cssFilter: 'drop-shadow(0 0 5px rgba(56,189,248,0.55)) brightness(1.03)',
    blendMode: 'screen',
  },
  chill: {
    key: 'chill',
    label: 'Escalofrío',
    svgFilterId: 'status-sprite-frozen',
    auraShaderId: 'aura-shader-frost',
    motif: 'frost',
    spriteUrl: '/assets/combat/status/aura_frost.png',
    primary: '#7dd3fc',
    secondary: '#0ea5e9',
    highlight: '#f0f9ff',
    glow: 'rgba(125,211,252,0.46)',
    cssFilter: 'drop-shadow(0 0 4px rgba(56,189,248,0.48))',
    blendMode: 'screen',
  },
  paralyze: {
    key: 'paralyze',
    label: 'Parálisis',
    svgFilterId: 'status-sprite-paralyze',
    auraShaderId: 'aura-shader-lightning',
    motif: 'lightning',
    spriteUrl: '/assets/combat/status/aura_lightning.png',
    primary: '#3b82f6',
    secondary: '#facc15',
    highlight: '#fef08a',
    glow: 'rgba(59,130,246,0.62)',
    cssFilter: 'drop-shadow(0 0 5px rgba(37,99,235,0.62)) drop-shadow(0 0 2px rgba(250,204,21,0.58)) contrast(1.06)',
    blendMode: 'screen',
  },
  stun: {
    key: 'stun',
    label: 'Noqueado',
    svgFilterId: 'status-sprite-stun',
    auraShaderId: 'aura-shader-halo',
    motif: 'stun',
    spriteUrl: '/assets/combat/status/aura_stun.png',
    primary: '#fbbf24',
    secondary: '#d97706',
    highlight: '#fef9c3',
    glow: 'rgba(251,191,36,0.5)',
    cssFilter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))',
    blendMode: 'normal',
  },
  poison: {
    key: 'poison',
    label: 'Veneno',
    svgFilterId: 'status-sprite-poison',
    auraShaderId: 'aura-shader-toxin',
    motif: 'poison',
    spriteUrl: '/assets/combat/status/aura_poison.png',
    primary: '#22c55e',
    secondary: '#15803d',
    highlight: '#bbf7d0',
    glow: 'rgba(34,197,94,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(34,197,94,0.52))',
    blendMode: 'screen',
  },
  corrosion: {
    key: 'corrosion',
    label: 'Corrosión',
    svgFilterId: 'status-sprite-corrosion',
    auraShaderId: 'aura-shader-toxin',
    motif: 'poison',
    spriteUrl: '/assets/combat/status/aura_poison.png',
    primary: '#a3e635',
    secondary: '#4d7c0f',
    highlight: '#ecfccb',
    glow: 'rgba(163,230,53,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(163,230,53,0.52)) hue-rotate(-18deg) saturate(1.1)',
    blendMode: 'screen',
  },
  bleed: {
    key: 'bleed',
    label: 'Sangrado',
    svgFilterId: 'status-sprite-bleed',
    auraShaderId: 'aura-shader-crimson',
    motif: 'bleed',
    spriteUrl: '/assets/combat/status/aura_bleed.png',
    primary: '#dc2626',
    secondary: '#7f1d1d',
    highlight: '#ef4444',
    glow: 'rgba(185,28,28,0.68)',
    cssFilter: 'drop-shadow(0 0 5px rgba(153,27,27,0.72)) saturate(1.25) contrast(1.06)',
    blendMode: 'normal',
  },
  laceration: {
    key: 'laceration',
    label: 'Laceración',
    svgFilterId: 'status-sprite-bleed',
    auraShaderId: 'aura-shader-crimson',
    motif: 'bleed',
    spriteUrl: '/assets/combat/status/aura_bleed.png',
    primary: '#e11d48',
    secondary: '#881337',
    highlight: '#f43f5e',
    glow: 'rgba(190,18,60,0.68)',
    cssFilter: 'drop-shadow(0 0 5px rgba(159,18,57,0.72)) saturate(1.25) contrast(1.06)',
    blendMode: 'normal',
  },
  charmed: {
    key: 'charmed',
    label: 'Encantado',
    svgFilterId: 'status-sprite-charmed',
    auraShaderId: 'aura-shader-arcane',
    motif: 'charm',
    spriteUrl: '/assets/combat/status/aura_charm.png',
    primary: '#f472b6',
    secondary: '#be185d',
    highlight: '#fce7f3',
    glow: 'rgba(244,114,182,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(244,114,182,0.52))',
    blendMode: 'screen',
  },
  faerie_fire: {
    key: 'faerie_fire',
    label: 'Fuego Feérico',
    svgFilterId: 'status-sprite-faerie',
    auraShaderId: 'aura-shader-arcane',
    motif: 'faerie',
    spriteUrl: '/assets/combat/status/aura_faerie.png',
    primary: '#e879f9',
    secondary: '#a21caf',
    highlight: '#fef08a',
    glow: 'rgba(232,121,249,0.52)',
    cssFilter: 'drop-shadow(0 0 5px rgba(232,121,249,0.54))',
    blendMode: 'screen',
  },
  confused: {
    key: 'confused',
    label: 'Confundido',
    svgFilterId: 'status-sprite-confused',
    auraShaderId: 'aura-shader-halo',
    motif: 'confused',
    spriteUrl: '/assets/combat/status/aura_confused.png',
    primary: '#c084fc',
    secondary: '#7e22ce',
    highlight: '#f3e8ff',
    glow: 'rgba(192,132,252,0.5)',
    cssFilter: 'drop-shadow(0 0 4px rgba(192,132,252,0.52))',
    blendMode: 'normal',
  },
  def_break: {
    key: 'def_break',
    label: 'Ruptura de Defensa',
    svgFilterId: 'status-sprite-def-break',
    auraShaderId: 'aura-shader-frost',
    motif: 'shatter',
    spriteUrl: '/assets/combat/status/aura_shatter.png',
    primary: '#fb923c',
    secondary: '#c2410c',
    highlight: '#ffedd5',
    glow: 'rgba(251,146,60,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(251,146,60,0.52))',
    blendMode: 'normal',
  },
  restrained: {
    key: 'restrained',
    label: 'Inmovilizado',
    svgFilterId: 'status-sprite-restrained',
    auraShaderId: 'aura-shader-arcane',
    motif: 'chains',
    spriteUrl: '/assets/combat/status/aura_chains.png',
    primary: '#38bdf8',
    secondary: '#1d4ed8',
    highlight: '#e0f2fe',
    glow: 'rgba(56,189,248,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(56,189,248,0.52))',
    blendMode: 'screen',
  },
  blind: {
    key: 'blind',
    label: 'Ceguera',
    svgFilterId: 'status-sprite-blind',
    auraShaderId: 'aura-shader-crimson',
    motif: 'shadow',
    spriteUrl: '/assets/combat/status/aura_shadow.png',
    primary: '#475569',
    secondary: '#0f172a',
    highlight: '#94a3b8',
    glow: 'rgba(15,23,42,0.58)',
    cssFilter: 'drop-shadow(0 0 5px rgba(15,23,42,0.6))',
    blendMode: 'normal',
  },
  holy_blind: {
    key: 'holy_blind',
    label: 'Ceguera Sagrada',
    svgFilterId: 'status-sprite-holy-blind',
    auraShaderId: 'aura-shader-arcane',
    motif: 'radiance',
    spriteUrl: '/assets/combat/status/aura_radiance.png',
    primary: '#fde047',
    secondary: '#eab308',
    highlight: '#ffffff',
    glow: 'rgba(253,224,71,0.55)',
    cssFilter: 'drop-shadow(0 0 6px rgba(253,224,71,0.58)) brightness(1.04)',
    blendMode: 'screen',
  },
  decay: {
    key: 'decay',
    label: 'Decadencia',
    svgFilterId: 'status-sprite-decay',
    auraShaderId: 'aura-shader-toxin',
    motif: 'decay',
    spriteUrl: '/assets/combat/status/aura_decay.png',
    primary: '#a855f7',
    secondary: '#4c1d95',
    highlight: '#e9d5ff',
    glow: 'rgba(168,85,247,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(168,85,247,0.52))',
    blendMode: 'normal',
  },
  atk_down: {
    key: 'atk_down',
    label: 'Debilitado',
    svgFilterId: 'status-sprite-decay',
    auraShaderId: 'aura-shader-toxin',
    motif: 'decay',
    spriteUrl: '/assets/combat/status/aura_decay.png',
    primary: '#8b5cf6',
    secondary: '#3b0764',
    highlight: '#ddd6fe',
    glow: 'rgba(139,92,246,0.48)',
    cssFilter: 'drop-shadow(0 0 4px rgba(139,92,246,0.5))',
    blendMode: 'normal',
  },
  def_buff: {
    key: 'def_buff',
    label: 'Escudo Arcano',
    svgFilterId: 'status-sprite-def-buff',
    auraShaderId: 'aura-shader-arcane',
    motif: 'shield',
    spriteUrl: '/assets/combat/status/aura_shield.png',
    primary: '#38bdf8',
    secondary: '#0369a1',
    highlight: '#e0f2fe',
    glow: 'rgba(56,189,248,0.52)',
    cssFilter: 'drop-shadow(0 0 5px rgba(56,189,248,0.54))',
    blendMode: 'screen',
  },
  atk_buff: {
    key: 'atk_buff',
    label: 'Ataque Potenciado',
    svgFilterId: 'status-sprite-atk-buff',
    auraShaderId: 'aura-shader-fire',
    motif: 'power',
    spriteUrl: '/assets/combat/status/aura_power.png',
    primary: '#fbbf24',
    secondary: '#ea580c',
    highlight: '#fef9c3',
    glow: 'rgba(251,191,36,0.55)',
    cssFilter: 'drop-shadow(0 0 6px rgba(251,191,36,0.58)) saturate(1.08)',
    blendMode: 'screen',
  },
  regen: {
    key: 'regen',
    label: 'Regeneración',
    svgFilterId: 'status-sprite-regen',
    auraShaderId: 'aura-shader-arcane',
    motif: 'regen',
    spriteUrl: '/assets/combat/status/aura_regen.png',
    primary: '#34d399',
    secondary: '#059669',
    highlight: '#fef08a',
    glow: 'rgba(52,211,153,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(52,211,153,0.52))',
    blendMode: 'screen',
  },
  haste: {
    key: 'haste',
    label: 'Celeridad',
    svgFilterId: 'status-sprite-haste',
    auraShaderId: 'aura-shader-wind',
    motif: 'wind',
    spriteUrl: '/assets/combat/status/aura_wind.png',
    primary: '#67e8f9',
    secondary: '#06b6d4',
    highlight: '#ffffff',
    glow: 'rgba(103,232,249,0.5)',
    cssFilter: 'drop-shadow(0 0 5px rgba(103,232,249,0.52))',
    blendMode: 'screen',
  },
};

export const STATUS_AURA_SPRITE_ASSETS: readonly string[] = Array.from(
  new Set(Object.values(STATUS_AURA_REGISTRY).map((cfg) => cfg.spriteUrl))
);

export function getAuraConfigForCondition(
  activeEffect: ActiveGachaEffect | null
): StatusAuraConfig | null {
  if (!activeEffect) return null;
  const key = normalizeConditionKey(activeEffect.type);
  return key ? STATUS_AURA_REGISTRY[key] : null;
}

export function getStatusSpriteShaderFilter(
  activeEffect: ActiveGachaEffect | null
): string | undefined {
  const cfg = getAuraConfigForCondition(activeEffect);
  return cfg ? `url(#${cfg.svgFilterId})` : undefined;
}

/**
 * Definiciones SVG del Aura Manager:
 * Cada estado alterado aplica un filtro SVG único directamente sobre la silueta
 * completa del modelo del personaje (desplazamiento orgánico para fuego/veneno,
 * escarcha cristalina, corona eléctrica, estela de velocidad, etc.).
 */
export const StatusAuraSvgFilterDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    className="absolute pointer-events-none opacity-0"
    aria-hidden="true"
  >
    <defs>
      {/* QUEMADURA: Llamas orgánicas envolviendo toda la silueta */}
      <filter id="status-sprite-burn" x="-35%" y="-35%" width="170%" height="170%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6.5" result="dilated" />
        <feTurbulence type="fractalNoise" baseFrequency="0.024 0.052" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="dilated" in2="noise" scale="11" xChannelSelector="R" yChannelSelector="G" result="flameContour" />
        <feFlood floodColor="#f97316" floodOpacity="0.92" result="fireFlood" />
        <feComposite in="fireFlood" in2="flameContour" operator="in" result="fireBody" />
        <feGaussianBlur in="fireBody" stdDeviation="3.4" result="fireGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="rimAlpha" />
        <feFlood floodColor="#fef08a" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="goldRim" />
        <feMerge>
          <feMergeNode in="fireGlow" />
          <feMergeNode in="fireBody" />
          <feMergeNode in="goldRim" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* CONGELACIÓN / ESCALOFRÍO: Coraza cristalina y tinte glacial */}
      <filter id="status-sprite-frozen" x="-32%" y="-32%" width="164%" height="164%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5.5" result="iceOuter" />
        <feFlood floodColor="#0ea5e9" floodOpacity="0.88" result="iceFlood" />
        <feComposite in="iceFlood" in2="iceOuter" operator="in" result="iceShell" />
        <feGaussianBlur in="iceShell" stdDeviation="3.2" result="iceGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="frostAlpha" />
        <feFlood floodColor="#e0f2fe" floodOpacity="0.98" result="frostFlood" />
        <feComposite in="frostFlood" in2="frostAlpha" operator="in" result="frostRim" />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.68 0.14 0.22 0 0.05  0.12 0.94 0.30 0 0.09  0.16 0.30 1.24 0 0.20  0 0 0 1 0"
          result="icedModel"
        />
        <feMerge>
          <feMergeNode in="iceGlow" />
          <feMergeNode in="frostRim" />
          <feMergeNode in="icedModel" />
        </feMerge>
      </filter>

      {/* PARÁLISIS / RAYO Y TRUENO: Corona eléctrica azul y amarilla alrededor del modelo */}
      <filter id="status-sprite-paralyze" x="-35%" y="-35%" width="170%" height="170%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="voltAlpha" />
        <feTurbulence type="turbulence" baseFrequency="0.062" numOctaves="2" seed="7" result="arcNoise" />
        <feDisplacementMap in="voltAlpha" in2="arcNoise" scale="7.5" xChannelSelector="R" yChannelSelector="G" result="corona" />
        <feFlood floodColor="#2563eb" floodOpacity="0.95" result="blueFlood" />
        <feComposite in="blueFlood" in2="corona" operator="in" result="blueShell" />
        <feGaussianBlur in="blueShell" stdDeviation="3.2" result="blueGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="goldAlpha" />
        <feFlood floodColor="#facc15" floodOpacity="0.98" result="goldFlood" />
        <feComposite in="goldFlood" in2="goldAlpha" operator="in" result="goldRim" />
        <feMerge>
          <feMergeNode in="blueGlow" />
          <feMergeNode in="blueShell" />
          <feMergeNode in="goldRim" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* VENENO: Miasma esmeralda orgánico */}
      <filter id="status-sprite-poison" x="-35%" y="-35%" width="170%" height="170%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6.5" result="toxAlpha" />
        <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="11" result="toxNoise" />
        <feDisplacementMap in="toxAlpha" in2="toxNoise" scale="9" xChannelSelector="R" yChannelSelector="G" result="toxCloud" />
        <feFlood floodColor="#16a34a" floodOpacity="0.88" result="toxFlood" />
        <feComposite in="toxFlood" in2="toxCloud" operator="in" result="toxShell" />
        <feGaussianBlur in="toxShell" stdDeviation="3.5" result="toxGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#86efac" floodOpacity="0.94" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.82 0.08 0 0 0  0.1 1.15 0.08 0 0.02  0 0.08 0.82 0 0  0 0 0 1 0"
          result="tinted"
        />
        <feMerge>
          <feMergeNode in="toxGlow" />
          <feMergeNode in="toxShell" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="tinted" />
        </feMerge>
      </filter>

      {/* CORROSIÓN: Halo ácido lima */}
      <filter id="status-sprite-corrosion" x="-35%" y="-35%" width="170%" height="170%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="acidAlpha" />
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="19" result="acidNoise" />
        <feDisplacementMap in="acidAlpha" in2="acidNoise" scale="8" xChannelSelector="R" yChannelSelector="G" result="acidCloud" />
        <feFlood floodColor="#65a30d" floodOpacity="0.9" result="acidFlood" />
        <feComposite in="acidFlood" in2="acidCloud" operator="in" result="acidShell" />
        <feGaussianBlur in="acidShell" stdDeviation="3.2" result="acidGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#d9f99d" floodOpacity="0.95" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="acidGlow" />
          <feMergeNode in="acidShell" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* NOQUEADO: Contorno dorado cálido y leve aturdimiento */}
      <filter id="status-sprite-stun" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="4.5" result="stunAlpha" />
        <feFlood floodColor="#f59e0b" floodOpacity="0.88" result="stunFlood" />
        <feComposite in="stunFlood" in2="stunAlpha" operator="in" result="stunShell" />
        <feGaussianBlur in="stunShell" stdDeviation="3.2" result="stunGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#fef08a" floodOpacity="0.95" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feColorMatrix in="SourceGraphic" type="saturate" values="0.82" result="dazed" />
        <feMerge>
          <feMergeNode in="stunGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="dazed" />
        </feMerge>
      </filter>

      {/* SANGRADO / LACERACIÓN: Aura carmesí oscura y saturada intensa */}
      <filter id="status-sprite-bleed" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="bAlpha" />
        <feFlood floodColor="#7f1d1d" floodOpacity="0.95" result="bFlood" />
        <feComposite in="bFlood" in2="bAlpha" operator="in" result="bShell" />
        <feGaussianBlur in="bShell" stdDeviation="3.2" result="bGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#ef4444" floodOpacity="0.98" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="bGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* ENCANTADO: Aura rosa terciopelo */}
      <filter id="status-sprite-charmed" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5.2" result="cAlpha" />
        <feFlood floodColor="#db2777" floodOpacity="0.9" result="cFlood" />
        <feComposite in="cFlood" in2="cAlpha" operator="in" result="cShell" />
        <feGaussianBlur in="cShell" stdDeviation="3.5" result="cGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#fbcfe8" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1.12 0.16 0.1 0 0.03  0.05 0.82 0.16 0 0  0.1 0.08 1.08 0 0.03  0 0 0 1 0"
          result="tinted"
        />
        <feMerge>
          <feMergeNode in="cGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="tinted" />
        </feMerge>
      </filter>

      {/* FUEGO FEÉRICO: Resplandor magenta luminiscente */}
      <filter id="status-sprite-faerie" x="-32%" y="-32%" width="164%" height="164%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5.5" result="fAlpha" />
        <feFlood floodColor="#c026d3" floodOpacity="0.92" result="fFlood" />
        <feComposite in="fFlood" in2="fAlpha" operator="in" result="fShell" />
        <feGaussianBlur in="fShell" stdDeviation="3.5" result="fGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="rimAlpha" />
        <feFlood floodColor="#fef08a" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="fGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* CONFUNDIDO: Halo violeta hipnótico */}
      <filter id="status-sprite-confused" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="cfAlpha" />
        <feFlood floodColor="#9333ea" floodOpacity="0.9" result="cfFlood" />
        <feComposite in="cfFlood" in2="cfAlpha" operator="in" result="cfShell" />
        <feGaussianBlur in="cfShell" stdDeviation="3.2" result="cfGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#e9d5ff" floodOpacity="0.95" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="cfGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* CEGUERA: Velo oscuro envolvente */}
      <filter id="status-sprite-blind" x="-32%" y="-32%" width="164%" height="164%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5.5" result="blAlpha" />
        <feFlood floodColor="#0f172a" floodOpacity="0.92" result="blFlood" />
        <feComposite in="blFlood" in2="blAlpha" operator="in" result="blShell" />
        <feGaussianBlur in="blShell" stdDeviation="3.6" result="blGlow" />
        <feColorMatrix in="SourceGraphic" type="saturate" values="0.52" result="dimmed" />
        <feMerge>
          <feMergeNode in="blGlow" />
          <feMergeNode in="dimmed" />
        </feMerge>
      </filter>

      {/* CEGUERA SAGRADA: Halo radiante dorado-blanco */}
      <filter id="status-sprite-holy-blind" x="-34%" y="-34%" width="168%" height="168%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="hbAlpha" />
        <feFlood floodColor="#eab308" floodOpacity="0.94" result="hbFlood" />
        <feComposite in="hbFlood" in2="hbAlpha" operator="in" result="hbShell" />
        <feGaussianBlur in="hbShell" stdDeviation="3.8" result="hbGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="rimAlpha" />
        <feFlood floodColor="#ffffff" floodOpacity="0.98" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="hbGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* DECADENCIA / DEBILITADO: Niebla necrótica descendente */}
      <filter id="status-sprite-decay" x="-32%" y="-32%" width="164%" height="164%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5.5" result="dAlpha" />
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="23" result="dNoise" />
        <feDisplacementMap in="dAlpha" in2="dNoise" scale="7" xChannelSelector="R" yChannelSelector="G" result="dCloud" />
        <feFlood floodColor="#7e22ce" floodOpacity="0.9" result="dFlood" />
        <feComposite in="dFlood" in2="dCloud" operator="in" result="dShell" />
        <feGaussianBlur in="dShell" stdDeviation="3.4" result="dGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="rimAlpha" />
        <feFlood floodColor="#d8b4fe" floodOpacity="0.9" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="dGlow" />
          <feMergeNode in="dShell" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* RUPTURA DE DEFENSA */}
      <filter id="status-sprite-def-break" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="dbAlpha" />
        <feFlood floodColor="#ea580c" floodOpacity="0.9" result="dbFlood" />
        <feComposite in="dbFlood" in2="dbAlpha" operator="in" result="dbShell" />
        <feGaussianBlur in="dbShell" stdDeviation="3" result="dbGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#fed7aa" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="dbGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* INMOVILIZADO */}
      <filter id="status-sprite-restrained" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="rAlpha" />
        <feFlood floodColor="#1d4ed8" floodOpacity="0.9" result="rFlood" />
        <feComposite in="rFlood" in2="rAlpha" operator="in" result="rShell" />
        <feGaussianBlur in="rShell" stdDeviation="3.2" result="rGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="rimAlpha" />
        <feFlood floodColor="#bae6fd" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="rGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* ATAQUE POTENCIADO: Aura de poder dorado llameante */}
      <filter id="status-sprite-atk-buff" x="-35%" y="-35%" width="170%" height="170%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="abAlpha" />
        <feTurbulence type="fractalNoise" baseFrequency="0.022 0.055" numOctaves="2" seed="31" result="abNoise" />
        <feDisplacementMap in="abAlpha" in2="abNoise" scale="11" xChannelSelector="R" yChannelSelector="G" result="abFlame" />
        <feFlood floodColor="#f59e0b" floodOpacity="0.94" result="abFlood" />
        <feComposite in="abFlood" in2="abFlame" operator="in" result="abBody" />
        <feGaussianBlur in="abBody" stdDeviation="3.6" result="abGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="rimAlpha" />
        <feFlood floodColor="#fef9c3" floodOpacity="0.98" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="abGlow" />
          <feMergeNode in="abBody" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* ESCUDO / BARRERA: Aura protectora cristalina */}
      <filter id="status-sprite-def-buff" x="-32%" y="-32%" width="164%" height="164%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="shAlpha" />
        <feFlood floodColor="#0284c7" floodOpacity="0.9" result="shFlood" />
        <feComposite in="shFlood" in2="shAlpha" operator="in" result="shShell" />
        <feGaussianBlur in="shShell" stdDeviation="3.4" result="shGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="rimAlpha" />
        <feFlood floodColor="#bae6fd" floodOpacity="0.98" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="shGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* REGENERACIÓN: Halo sagrado esmeralda y oro */}
      <filter id="status-sprite-regen" x="-32%" y="-32%" width="164%" height="164%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="rgAlpha" />
        <feFlood floodColor="#059669" floodOpacity="0.9" result="rgFlood" />
        <feComposite in="rgFlood" in2="rgAlpha" operator="in" result="rgShell" />
        <feGaussianBlur in="rgShell" stdDeviation="3.5" result="rgGlow" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="rimAlpha" />
        <feFlood floodColor="#fef08a" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="rgGlow" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* CELERIDAD: Estela de velocidad aerodinámica */}
      <filter id="status-sprite-haste" x="-38%" y="-30%" width="176%" height="160%">
        <feOffset in="SourceAlpha" dx="-9" dy="0" result="trailAlpha" />
        <feFlood floodColor="#22d3ee" floodOpacity="0.65" result="trailFlood" />
        <feComposite in="trailFlood" in2="trailAlpha" operator="in" result="trailBody" />
        <feGaussianBlur in="trailBody" stdDeviation="2.6" result="trailBlur" />
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="rimAlpha" />
        <feFlood floodColor="#e0f2fe" floodOpacity="0.96" result="rimFlood" />
        <feComposite in="rimFlood" in2="rimAlpha" operator="in" result="rimShell" />
        <feMerge>
          <feMergeNode in="trailBlur" />
          <feMergeNode in="rimShell" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* =================================================================== */}
      {/* SHADERS ANIMADOS PARA LOS SPRITES DE AURAS (SUTILES Y SIN RECORTES) */}
      {/* =================================================================== */}

      {/* FUEGO / PODER: shader de turbulencia térmica ascendente sutil */}
      <filter id="aura-shader-fire" filterUnits="objectBoundingBox" x="-55%" y="-55%" width="210%" height="210%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022 0.055" numOctaves="2" seed="5" result="fireNoise">
          <animate
            attributeName="baseFrequency"
            values="0.018 0.048;0.030 0.072;0.022 0.056;0.018 0.048"
            dur="0.46s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="fireNoise" scale="5" xChannelSelector="R" yChannelSelector="G" result="warped" />
        <feGaussianBlur in="warped" stdDeviation="1.8" result="bloomRaw" />
        <feComponentTransfer in="bloomRaw" result="bloom">
          <feFuncA type="linear" slope="0.45" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="bloom" />
          <feMergeNode in="warped" />
        </feMerge>
      </filter>

      {/* RAYO Y TRUENO / PARÁLISIS: shader voltaico rápido azul y amarillo */}
      <filter id="aura-shader-lightning" filterUnits="objectBoundingBox" x="-55%" y="-55%" width="210%" height="210%">
        <feTurbulence type="turbulence" baseFrequency="0.068" numOctaves="2" seed="2" result="voltNoise">
          <animate
            attributeName="seed"
            values="2;11;5;17;8;2"
            dur="0.18s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="voltNoise" scale="5.2" xChannelSelector="R" yChannelSelector="G" result="warped" />
        <feGaussianBlur in="warped" stdDeviation="1.9" result="coronaRaw" />
        <feComponentTransfer in="coronaRaw" result="corona">
          <feFuncA type="linear" slope="0.48" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="corona" />
          <feMergeNode in="warped" />
        </feMerge>
      </filter>

      {/* HIELO / RUPTURA: shader cristalino ligero */}
      <filter id="aura-shader-frost" filterUnits="objectBoundingBox" x="-55%" y="-55%" width="210%" height="210%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="iceEdge" />
        <feFlood floodColor="#e0f2fe" floodOpacity="0.32" result="iceFlood" />
        <feComposite in="iceFlood" in2="iceEdge" operator="in" result="iceRim" />
        <feGaussianBlur in="iceRim" stdDeviation="1.8" result="iceGlow" />
        <feMerge>
          <feMergeNode in="iceGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* VENENO / DECADENCIA: shader orgánico ondulante de miasma */}
      <filter id="aura-shader-toxin" filterUnits="objectBoundingBox" x="-55%" y="-55%" width="210%" height="210%">
        <feTurbulence type="fractalNoise" baseFrequency="0.018 0.036" numOctaves="2" seed="12" result="toxNoise">
          <animate
            attributeName="baseFrequency"
            values="0.016 0.032;0.026 0.048;0.016 0.032"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="toxNoise" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="warped" />
        <feGaussianBlur in="warped" stdDeviation="1.8" result="toxRaw" />
        <feComponentTransfer in="toxRaw" result="toxGlow">
          <feFuncA type="linear" slope="0.4" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="toxGlow" />
          <feMergeNode in="warped" />
        </feMerge>
      </filter>

      {/* ARCANO / ESCUDO / FEÉRICO / REGEN / CADENAS: shader luminoso suave */}
      <filter id="aura-shader-arcane" filterUnits="objectBoundingBox" x="-55%" y="-55%" width="210%" height="210%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="17" result="arcNoise">
          <animate
            attributeName="baseFrequency"
            values="0.013;0.020;0.013"
            dur="0.55s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="arcNoise" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="shimmer" />
        <feGaussianBlur in="shimmer" stdDeviation="1.8" result="arcRaw" />
        <feComponentTransfer in="arcRaw" result="arcGlow">
          <feFuncA type="linear" slope="0.4" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="arcGlow" />
          <feMergeNode in="shimmer" />
        </feMerge>
      </filter>

      {/* SANGRADO / SOMBRA: shader fluido discreto */}
      <filter id="aura-shader-crimson" filterUnits="objectBoundingBox" x="-55%" y="-55%" width="210%" height="210%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022 0.040" numOctaves="2" seed="21" result="cNoise">
          <animate
            attributeName="baseFrequency"
            values="0.020 0.036;0.028 0.050;0.020 0.036"
            dur="0.52s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="cNoise" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="warped" />
        <feGaussianBlur in="warped" stdDeviation="1.6" result="cRaw" />
        <feComponentTransfer in="cRaw" result="cGlow">
          <feFuncA type="linear" slope="0.4" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="cGlow" />
          <feMergeNode in="warped" />
        </feMerge>
      </filter>

      {/* VIENTO / CELERIDAD: shader de estela cinética ligera */}
      <filter id="aura-shader-wind" filterUnits="objectBoundingBox" x="-60%" y="-55%" width="220%" height="210%">
        <feOffset in="SourceGraphic" dx="-4" dy="0" result="trail" />
        <feGaussianBlur in="trail" stdDeviation="2.4 0.4" result="streakRaw" />
        <feComponentTransfer in="streakRaw" result="streak">
          <feFuncA type="linear" slope="0.45" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="streak" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* HALO CABEZA (ATURDIDO / CONFUNDIDO): bloom estelar ligero */}
      <filter id="aura-shader-halo" filterUnits="objectBoundingBox" x="-65%" y="-65%" width="230%" height="230%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="starRaw" />
        <feComponentTransfer in="starRaw" result="starGlow">
          <feFuncA type="linear" slope="0.45" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="starGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

export interface AuraAnchorBox {
  hostW: number;
  hostH: number;
  footX: number;
  footY: number;
  bodyBotY: number;
  headX: number;
  headY: number;
  crownY: number;
  centerX: number;
  torsoX: number;
  torsoY: number;
  bodyH: number;
  bodyW: number;
  contourPx: ReadonlyArray<readonly [number, number]>;
}

export interface StatusAuraManagerProps {
  config: StatusAuraConfig;
  cueKey: number;
  durationMs: number;
  box: AuraAnchorBox;
}

interface AnalyzedAuraFrame {
  splitL: number;
  splitR: number;
  hollowByRow: Float32Array;
  rows: number;
}

const auraImgCache = new Map<string, HTMLImageElement>();
const auraAnalysisCache = new Map<string, AnalyzedAuraFrame>();

function getOrLoadAuraImage(url: string, onReady: (img: HTMLImageElement) => void): () => void {
  let cached = auraImgCache.get(url);
  if (!cached) {
    cached = new Image();
    cached.src = url;
    auraImgCache.set(url, cached);
  }
  if (cached.complete && cached.naturalWidth > 0) {
    onReady(cached);
    return () => {};
  }
  const img = cached;
  const handleLoad = () => onReady(img);
  img.addEventListener('load', handleLoad);
  return () => img.removeEventListener('load', handleLoad);
}

function analyzeAuraFrame(img: HTMLImageElement, url: string, motif: AuraMotifKind): AnalyzedAuraFrame {
  const cacheKey = `${url}::${motif}`;
  const existing = auraAnalysisCache.get(cacheKey);
  if (existing) return existing;

  const rows = 160;
  const cols = 128;
  const hollowByRow = new Float32Array(rows);

  // Viento y resplandor atraviesan el ancho completo del personaje
  if (motif === 'wind' || motif === 'radiance') {
    const res: AnalyzedAuraFrame = { splitL: 0.36, splitR: 0.64, hollowByRow, rows };
    auraAnalysisCache.set(cacheKey, res);
    return res;
  }

  let splitL = 0.36;
  let splitR = 0.64;

  try {
    const off = document.createElement('canvas');
    off.width = cols;
    off.height = rows;
    const ctx = off.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, cols, rows);
      const { data } = ctx.getImageData(0, 0, cols, rows);
      const cStart = Math.floor(cols * 0.38);
      const cEnd = Math.ceil(cols * 0.62);
      const cSpan = Math.max(1, cEnd - cStart);
      const rawHollow = new Float32Array(rows);
      const leftInnerEdges: number[] = [];
      const rightInnerEdges: number[] = [];

      for (let r = 0; r < rows; r++) {
        let centerOpaque = 0;
        const rowOff = r * cols * 4;
        for (let x = cStart; x < cEnd; x++) {
          if (data[rowOff + x * 4 + 3] > 20) centerOpaque++;
        }
        const ratio = centerOpaque / cSpan;
        rawHollow[r] = Math.max(0, Math.min(1, 1 - ratio / 0.12));

        // Medir el borde interior de las paredes izquierda y derecha en la zona media
        if (rawHollow[r] > 0.75 && r >= rows * 0.22 && r <= rows * 0.78) {
          for (let x = Math.floor(cols * 0.44); x >= 0; x--) {
            if (data[rowOff + x * 4 + 3] > 26) {
              leftInnerEdges.push((x + 2) / cols);
              break;
            }
          }
          for (let x = Math.ceil(cols * 0.56); x < cols; x++) {
            if (data[rowOff + x * 4 + 3] > 26) {
              rightInnerEdges.push(Math.max(0, (x - 1) / cols));
              break;
            }
          }
        }
      }

      // Suavizado vertical para transiciones continuas entre arcos y paredes laterales
      const radius = 6;
      for (let r = 0; r < rows; r++) {
        let sum = 0;
        let wSum = 0;
        for (let d = -radius; d <= radius; d++) {
          const idx = Math.max(0, Math.min(rows - 1, r + d));
          const wt = radius + 1 - Math.abs(d);
          sum += rawHollow[idx] * wt;
          wSum += wt;
        }
        hollowByRow[r] = sum / wSum;
      }

      if (leftInnerEdges.length > 4) {
        leftInnerEdges.sort((a, b) => a - b);
        const p80 = leftInnerEdges[Math.min(leftInnerEdges.length - 1, Math.floor(leftInnerEdges.length * 0.85))];
        splitL = Math.max(0.28, Math.min(0.40, p80 + 0.02));
      }
      if (rightInnerEdges.length > 4) {
        rightInnerEdges.sort((a, b) => a - b);
        const p20 = rightInnerEdges[Math.floor(rightInnerEdges.length * 0.15)];
        splitR = Math.max(0.60, Math.min(0.72, p20 - 0.02));
      }
    }
  } catch {
    hollowByRow.fill(1);
    for (let r = 0; r < Math.floor(rows * 0.16); r++) hollowByRow[r] = r / (rows * 0.16);
    for (let r = Math.floor(rows * 0.84); r < rows; r++) hollowByRow[r] = (rows - 1 - r) / (rows * 0.16);
  }

  const res: AnalyzedAuraFrame = { splitL, splitR, hollowByRow, rows };
  auraAnalysisCache.set(cacheKey, res);
  return res;
}

function sampleCharContourAt(
  contourPx: ReadonlyArray<readonly [number, number]>,
  auraLeft: number,
  padTop: number,
  bodySpanH: number,
  auraH: number,
  v: number
): readonly [number, number] {
  const n = contourPx.length;
  if (!n) return [0, 80];
  const yPx = v * auraH;
  const tRaw = (yPx - padTop) / Math.max(1, bodySpanH);
  const t = Math.max(0, Math.min(1, tRaw));
  const f = t * (n - 1);
  const i0 = Math.floor(f);
  const i1 = Math.min(n - 1, i0 + 1);
  const frac = f - i0;
  let l = contourPx[i0][0] * (1 - frac) + contourPx[i1][0] * frac - auraLeft;
  let r = contourPx[i0][1] * (1 - frac) + contourPx[i1][1] * frac - auraLeft;

  // Curvatura suave en los extremos superior/inferior fuera del sprite para cerrar el arco
  if (tRaw < 0) {
    const capT = Math.min(1, -tRaw * (bodySpanH / Math.max(1, padTop)));
    const inset = (r - l) * 0.08 * capT * capT;
    l += inset;
    r -= inset;
  } else if (tRaw > 1) {
    const capT = Math.min(1, (tRaw - 1) * (bodySpanH / Math.max(1, auraH - padTop - bodySpanH)));
    const inset = (r - l) * 0.04 * capT * capT;
    l += inset;
    r -= inset;
  }

  return [l, Math.max(l + 16, r)];
}

function buildSilhouetteHaloPath(
  contourPx: ReadonlyArray<readonly [number, number]>,
  auraLeft: number,
  padOut: number,
  padTop: number,
  bodySpanH: number,
  auraH: number
): string {
  const steps = 14;
  const leftPts: Array<[number, number]> = [];
  const rightPts: Array<[number, number]> = [];

  for (let i = 0; i <= steps; i++) {
    const v = 0.04 + (0.92 * i) / steps;
    const [cl, cr] = sampleCharContourAt(contourPx, auraLeft, padTop, bodySpanH, auraH, v);
    const y = v * auraH;
    leftPts.push([cl - padOut * 0.45, y]);
    rightPts.push([cr + padOut * 0.45, y]);
  }

  const topMidX = (leftPts[0][0] + rightPts[0][0]) * 0.5;
  const botMidX = (leftPts[leftPts.length - 1][0] + rightPts[rightPts.length - 1][0]) * 0.5;
  // Construir polígono cerrado suave siguiendo el contorno izquierdo y derecho
  const loop: Array<[number, number]> = [
    [topMidX, auraH * 0.02],
    ...rightPts,
    [botMidX, auraH * 0.98],
    ...leftPts.slice().reverse(),
  ];

  if (loop.length < 3) return '';
  let d = `M ${((loop[loop.length - 1][0] + loop[0][0]) * 0.5).toFixed(1)} ${((loop[loop.length - 1][1] + loop[0][1]) * 0.5).toFixed(1)}`;
  for (let i = 0; i < loop.length; i++) {
    const curr = loop[i];
    const next = loop[(i + 1) % loop.length];
    const mx = ((curr[0] + next[0]) * 0.5).toFixed(1);
    const my = ((curr[1] + next[1]) * 0.5).toFixed(1);
    d += ` Q ${curr[0].toFixed(1)} ${curr[1].toFixed(1)} ${mx} ${my}`;
  }
  return `${d} Z`;
}

function drawContourWarpedAura(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  url: string,
  motif: AuraMotifKind,
  auraW: number,
  auraH: number,
  auraLeft: number,
  padTop: number,
  padOut: number,
  baseWallPx: number,
  bodySpanH: number,
  headRelX: number,
  bodyW: number,
  contourPx: ReadonlyArray<readonly [number, number]>
) {
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const dstW = Math.max(1, Math.round(auraW * dpr));
  const dstH = Math.max(1, Math.round(auraH * dpr));
  if (canvas.width !== dstW) canvas.width = dstW;
  if (canvas.height !== dstH) canvas.height = dstH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, dstW, dstH);

  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (!sw || !sh) return;

  const analyzed = analyzeAuraFrame(img, url, motif);
  const { splitL, splitR, hollowByRow, rows } = analyzed;
  const sxMidL = splitL * sw;
  const sxMidR = splitR * sw;
  const swMid = sxMidR - sxMidL;
  const swRight = sw - sxMidR;

  const STRIPS = 56;
  for (let s = 0; s < STRIPS; s++) {
    const v0 = s / STRIPS;
    const v1 = (s + 1) / STRIPS;
    const vMid = (v0 + v1) * 0.5;

    const sy = Math.floor(v0 * sh);
    const syEnd = Math.min(sh, Math.ceil(v1 * sh));
    const shStrip = Math.max(1, syEnd - sy);

    const dstY = v0 * dstH;
    const dstStripH = (v1 - v0) * dstH + 0.85;

    const [clPx, crPx] = sampleCharContourAt(contourPx, auraLeft, padTop, bodySpanH, auraH, vMid);
    const charL = clPx * dpr;
    const charR = crPx * dpr;
    const outerL = Math.max(0, charL - padOut * dpr);
    const outerR = Math.min(dstW, charR + padOut * dpr);
    const outerSpan = Math.max(20 * dpr, outerR - outerL);

    // Resplandor superior: mantener la estrella superior proporcionada sobre la cabeza
    if (motif === 'radiance' && vMid < 0.27) {
      const starW = Math.max(outerSpan, Math.min(dstW * 0.92, Math.max(bodyW * 1.15, 68) * dpr));
      const starCenter = Math.max(starW * 0.5, Math.min(dstW - starW * 0.5, headRelX * dpr));
      ctx.drawImage(img, 0, sy, sw, shStrip, starCenter - starW * 0.5, dstY, starW, dstStripH);
      continue;
    }

    const rIdx = Math.max(0, Math.min(rows - 1, Math.round(vMid * (rows - 1))));
    const hollow = hollowByRow[rIdx];

    const linearWallL = splitL * outerSpan;
    const linearWallR = (1 - splitR) * outerSpan;
    const fixedWall = Math.min(baseWallPx * dpr, outerSpan * 0.36);

    const wallW_L = linearWallL * (1 - hollow) + fixedWall * hollow;
    const wallW_R = linearWallR * (1 - hollow) + fixedWall * hollow;
    const midDestW = Math.max(0, outerSpan - wallW_L - wallW_R);

    // Borde izquierdo adaptado al contorno izquierdo
    ctx.drawImage(img, 0, sy, sxMidL, shStrip, outerL, dstY, wallW_L, dstStripH);
    // Zona central (arcos superiores/inferiores, correas de cadenas o ráfagas de viento)
    if (midDestW > 0.5) {
      ctx.drawImage(img, sxMidL, sy, swMid, shStrip, outerL + wallW_L, dstY, midDestW, dstStripH);
    }
    // Borde derecho adaptado al contorno derecho
    ctx.drawImage(img, sxMidR, sy, swRight, shStrip, outerR - wallW_R, dstY, wallW_R, dstStripH);
  }
}

function getSpriteAnimationForMotif(motif: AuraMotifKind, dur: string): string {
  switch (motif) {
    case 'flames':
    case 'power':
      return `statusAuraFireDance ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`;
    case 'lightning':
      return `statusAuraVoltCrack ${dur} linear both`;
    case 'frost':
      return `statusAuraFrostLock ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`;
    case 'stun':
    case 'confused':
      return `statusAuraHaloOrbit ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`;
    case 'wind':
      return `statusAuraGaleDash ${dur} cubic-bezier(0.16, 1, 0.3, 1) both`;
    case 'shatter':
      return `statusAuraArmorFracture ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`;
    case 'chains':
      return `statusAuraChainSnap ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`;
    case 'shield':
      return `statusAuraBarrierExpand ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`;
    case 'bleed':
    case 'decay':
      return `statusAuraMiasmaSink ${dur} ease-in-out both`;
    case 'shadow':
    case 'radiance':
      return `statusAuraVeilFlare ${dur} ease-in-out both`;
    case 'regen':
    case 'charm':
    case 'poison':
    case 'faerie':
      return `statusAuraSacredAscend ${dur} ease-out both`;
    default:
      return `statusAuraLifecycle ${dur} ease-out both`;
  }
}

/**
 * Renderizador de Sprites Cartoon + Shaders SVG/CSS del Aura Manager.
 * Presencia ligera y translúcida para acompañar al personaje sin taparlo ni recargarlo.
 */
export const StatusAuraManager: React.FC<StatusAuraManagerProps> = ({
  config,
  cueKey,
  durationMs,
  box,
}) => {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');
  const echoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dimensiones reales basadas en la silueta completa del personaje (coronilla a base visible)
  const contourSpanInfo = useMemo(() => {
    let minL = box.centerX - box.bodyW * 0.5;
    let maxR = box.centerX + box.bodyW * 0.5;
    if (box.contourPx.length > 0) {
      minL = Infinity;
      maxR = -Infinity;
      for (const [l, r] of box.contourPx) {
        if (l < minL) minL = l;
        if (r > maxR) maxR = r;
      }
    }
    const span = Math.max(36, maxR - minL);
    return { minL, maxR, span };
  }, [box.contourPx, box.centerX, box.bodyW]);

  const refDim = Math.min(box.bodyH, contourSpanInfo.span);
  const baseWallPx = Math.max(16, Math.min(44, refDim * 0.22));
  const padOut = baseWallPx * 0.72;
  const padTop = Math.max(8, Math.min(24, box.bodyH * 0.09));
  const padBottom = Math.max(5, Math.min(18, box.bodyH * 0.06));
  const bodySpanH = Math.max(40, box.bodyBotY - box.crownY);

  const auraLeft = contourSpanInfo.minL - padOut;
  const auraTop = box.crownY - padTop;
  const auraW = Math.max(64, contourSpanInfo.maxR + padOut - auraLeft);
  const auraH = Math.max(68, bodySpanH + padTop + padBottom);

  const vbW = 200;
  const vbH = 240;
  const footCenterX = Math.max(30, Math.min(170, ((box.footX - auraLeft) / auraW) * vbW));
  const footCenterY = ((box.footY - auraTop) / auraH) * vbH;
  const headRelX = box.headX - auraLeft;
  const crownRelY = box.crownY - auraTop;
  const isHeadHalo = config.motif === 'stun' || config.motif === 'confused';
  const haloWidth = Math.max(44, Math.min(148, Math.max(box.bodyW * 0.76, box.bodyH * 0.34)));
  const haloHeight = config.motif === 'stun' ? haloWidth * (266 / 384) : haloWidth * (362 / 384);
  const haloCenterY =
    config.motif === 'stun'
      ? crownRelY - haloHeight * 0.10
      : crownRelY - haloHeight * 0.24;

  const haloContourPath = useMemo(
    () =>
      isHeadHalo
        ? ''
        : buildSilhouetteHaloPath(box.contourPx, auraLeft, padOut, padTop, bodySpanH, auraH),
    [isHeadHalo, box.contourPx, auraLeft, padOut, padTop, bodySpanH, auraH]
  );

  // Arcos voltaicos azul/amarillo y chispas siguiendo el contorno para Rayo/Trueno
  const voltaicFx = useMemo(() => {
    if (config.motif !== 'lightning') return null;
    const samplePt = (v: number, side: 'L' | 'R', offsetFrac: number): [number, number] => {
      const [cl, cr] = sampleCharContourAt(box.contourPx, auraLeft, padTop, bodySpanH, auraH, v);
      const y = v * auraH;
      const x = side === 'L' ? cl - padOut * offsetFrac : cr + padOut * offsetFrac;
      return [x, y];
    };
    const makeBolt = (p1: [number, number], p2: [number, number], kinks: number, amp: number, sign: number): string => {
      const pts: Array<[number, number]> = [p1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      for (let i = 1; i <= kinks; i++) {
        const t = i / (kinks + 1);
        const zig = (i % 2 === 0 ? 1 : -1) * sign * amp;
        pts.push([p1[0] + dx * t + nx * zig, p1[1] + dy * t + ny * zig]);
      }
      pts.push(p2);
      return pts.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    };

    const arcs = [
      {
        d: makeBolt(samplePt(0.14, 'L', 0.45), samplePt(0.10, 'R', 0.45), 4, 6.5, 1),
        outer: '#2563eb',
        inner: '#fef08a',
        delayMs: 0,
      },
      {
        d: makeBolt(samplePt(0.24, 'L', 0.72), samplePt(0.56, 'L', 0.58), 4, 7.5, -1),
        outer: '#38bdf8',
        inner: '#facc15',
        delayMs: 65,
      },
      {
        d: makeBolt(samplePt(0.26, 'R', 0.72), samplePt(0.58, 'R', 0.58), 4, 7.5, 1),
        outer: '#2563eb',
        inner: '#fef08a',
        delayMs: 110,
      },
      {
        d: makeBolt(samplePt(0.58, 'L', 0.68), samplePt(0.86, 'L', 0.42), 3, 6.5, 1),
        outer: '#3b82f6',
        inner: '#facc15',
        delayMs: 155,
      },
      {
        d: makeBolt(samplePt(0.60, 'R', 0.68), samplePt(0.88, 'R', 0.42), 3, 6.5, -1),
        outer: '#38bdf8',
        inner: '#fef08a',
        delayMs: 45,
      },
    ];

    const sparks = [
      { pt: samplePt(0.18, 'L', 0.85), color: '#facc15', size: 5.5, delayMs: 25 },
      { pt: samplePt(0.20, 'R', 0.85), color: '#38bdf8', size: 5.0, delayMs: 95 },
      { pt: samplePt(0.46, 'L', 0.92), color: '#3b82f6', size: 6.0, delayMs: 140 },
      { pt: samplePt(0.48, 'R', 0.92), color: '#fef08a', size: 5.8, delayMs: 70 },
      { pt: samplePt(0.76, 'L', 0.78), color: '#facc15', size: 4.8, delayMs: 185 },
      { pt: samplePt(0.78, 'R', 0.78), color: '#38bdf8', size: 5.2, delayMs: 120 },
    ];

    return { arcs, sparks };
  }, [config.motif, box.contourPx, auraLeft, padOut, padTop, bodySpanH, auraH]);

  // Pompas de veneno flotantes y brillantes siguiendo la silueta para Veneno / Corrosión
  const poisonBubbles = useMemo(() => {
    if (config.motif !== 'poison') return null;
    const isAcid = config.key === 'corrosion';
    const specs: Array<{ v: number; side: 'L' | 'R'; out: number; r: number; delayMs: number }> = [
      { v: 0.86, side: 'L', out: 0.36, r: 7.2, delayMs: 0 },
      { v: 0.82, side: 'R', out: 0.44, r: 6.4, delayMs: 45 },
      { v: 0.68, side: 'L', out: 0.66, r: 5.2, delayMs: 90 },
      { v: 0.64, side: 'R', out: 0.56, r: 7.8, delayMs: 30 },
      { v: 0.50, side: 'L', out: 0.52, r: 8.4, delayMs: 115 },
      { v: 0.46, side: 'R', out: 0.72, r: 4.8, delayMs: 75 },
      { v: 0.32, side: 'L', out: 0.68, r: 6.0, delayMs: 145 },
      { v: 0.30, side: 'R', out: 0.48, r: 6.8, delayMs: 55 },
      { v: 0.16, side: 'L', out: 0.42, r: 4.6, delayMs: 165 },
      { v: 0.14, side: 'R', out: 0.38, r: 5.4, delayMs: 105 },
    ];
    const scaleFactor = Math.max(0.68, Math.min(1.18, refDim / 150));
    return {
      isAcid,
      fillLight: isAcid ? '#d9f99d' : '#86efac',
      fillDark: isAcid ? '#65a30d' : '#15803d',
      inkStroke: isAcid ? '#365314' : '#14532d',
      items: specs.map((sp) => {
        const [cl, cr] = sampleCharContourAt(box.contourPx, auraLeft, padTop, bodySpanH, auraH, sp.v);
        const cx = sp.side === 'L' ? cl - padOut * sp.out : cr + padOut * sp.out;
        const cy = sp.v * auraH;
        return {
          cx,
          cy,
          r: sp.r * scaleFactor,
          delayMs: sp.delayMs,
        };
      }),
    };
  }, [config.motif, config.key, box.contourPx, auraLeft, padOut, padTop, bodySpanH, auraH, refDim]);

  const gradPoolId = `${uid}-pool`;
  const gradSilId = `${uid}-sil`;
  const blurSilId = `${uid}-sil-blur`;
  const bubbleGradId = `${uid}-bubble`;
  const bloodGradId = `${uid}-blood`;

  // Gotas de sangre cayendo por gravedad siguiendo la silueta para Sangrado / Laceración
  const bloodDrops = useMemo(() => {
    if (config.motif !== 'bleed') return null;
    const isLac = config.key === 'laceration';
    const specs: Array<{ v: number; side: 'L' | 'R'; out: number; r: number; delayMs: number }> = [
      { v: 0.16, side: 'L', out: 0.34, r: 4.8, delayMs: 10 },
      { v: 0.20, side: 'R', out: 0.38, r: 5.2, delayMs: 65 },
      { v: 0.30, side: 'L', out: 0.56, r: 6.4, delayMs: 35 },
      { v: 0.34, side: 'R', out: 0.48, r: 5.8, delayMs: 115 },
      { v: 0.44, side: 'L', out: 0.14, r: 4.5, delayMs: 85 },
      { v: 0.48, side: 'R', out: 0.64, r: 6.8, delayMs: 20 },
      { v: 0.56, side: 'L', out: 0.68, r: 6.0, delayMs: 135 },
      { v: 0.60, side: 'R', out: 0.18, r: 4.6, delayMs: 55 },
      { v: 0.68, side: 'L', out: 0.42, r: 5.5, delayMs: 95 },
      { v: 0.72, side: 'R', out: 0.54, r: 6.2, delayMs: 150 },
      { v: 0.80, side: 'L', out: 0.28, r: 5.0, delayMs: 40 },
      { v: 0.82, side: 'R', out: 0.32, r: 4.9, delayMs: 120 },
    ];
    const scaleFactor = Math.max(0.7, Math.min(1.18, refDim / 150));
    return {
      fillBright: isLac ? '#f43f5e' : '#ef4444',
      fillMid: isLac ? '#be123c' : '#b91c1c',
      fillDeep: isLac ? '#4c0519' : '#450a0a',
      inkStroke: isLac ? '#3b0712' : '#2d0404',
      items: specs.map((sp) => {
        const [cl, cr] = sampleCharContourAt(box.contourPx, auraLeft, padTop, bodySpanH, auraH, sp.v);
        const cx = sp.side === 'L' ? cl - padOut * sp.out : cr + padOut * sp.out;
        const cy = sp.v * auraH;
        return {
          cx,
          cy,
          r: sp.r * scaleFactor,
          delayMs: sp.delayMs,
        };
      }),
    };
  }, [config.motif, config.key, box.contourPx, auraLeft, padOut, padTop, bodySpanH, auraH, refDim]);
  // Terminar el fade-out ~45ms antes del desmontaje para evitar cortes bruscos al cambiar de estado.
  const animDurMs = Math.max(240, durationMs - 45);
  const dur = `${animDurMs}ms`;
  const spriteAnim = getSpriteAnimationForMotif(config.motif, dur);
  const isSoftTranslucent =
    config.motif === 'shield' ||
    config.motif === 'radiance' ||
    config.motif === 'wind' ||
    config.motif === 'shadow';
  const spriteMaxOpacity = isHeadHalo ? 0.86 : isSoftTranslucent ? 0.62 : 0.74;
  const combinedSpriteFilter = `url(#${config.auraShaderId}) ${config.cssFilter}`;

  useLayoutEffect(() => {
    if (isHeadHalo) return;
    const drawAll = (img: HTMLImageElement) => {
      if (echoCanvasRef.current) {
        drawContourWarpedAura(
          echoCanvasRef.current,
          img,
          config.spriteUrl,
          config.motif,
          auraW,
          auraH,
          auraLeft,
          padTop,
          padOut,
          baseWallPx,
          bodySpanH,
          headRelX,
          box.bodyW,
          box.contourPx
        );
      }
      if (mainCanvasRef.current) {
        drawContourWarpedAura(
          mainCanvasRef.current,
          img,
          config.spriteUrl,
          config.motif,
          auraW,
          auraH,
          auraLeft,
          padTop,
          padOut,
          baseWallPx,
          bodySpanH,
          headRelX,
          box.bodyW,
          box.contourPx
        );
      }
    };
    return getOrLoadAuraImage(config.spriteUrl, drawAll);
  }, [
    isHeadHalo,
    config.spriteUrl,
    config.motif,
    auraW,
    auraH,
    auraLeft,
    padTop,
    padOut,
    baseWallPx,
    bodySpanH,
    headRelX,
    box.bodyW,
    box.contourPx,
    cueKey,
  ]);

  return (
    <div
      key={`aura-mgr-${config.key}-${cueKey}`}
      className="absolute pointer-events-none select-none overflow-visible"
      style={{
        left: auraLeft,
        top: auraTop,
        width: auraW,
        height: auraH,
        animation: `statusAuraLifecycle ${dur} cubic-bezier(0.22, 1, 0.36, 1) both`,
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes statusAuraLifecycle {
          0% { opacity: 0; transform: scale(0.94); }
          16% { opacity: 0.92; transform: scale(1.01); }
          72% { opacity: 0.88; transform: scale(1); }
          95% { opacity: 0.1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.02); }
        }
        @keyframes statusAuraEchoSurge {
          0% { opacity: 0; transform: scale(0.95); }
          22% { opacity: 0.24; transform: scale(1.04); }
          68% { opacity: 0.16; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.06); }
        }
        @keyframes statusAuraGroundPulse {
          0% { opacity: 0; transform: scale(0.82); }
          22% { opacity: 0.65; transform: scale(1.03); }
          72% { opacity: 0.55; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        @keyframes statusAuraFireDance {
          0% { transform: translateY(6px) scale(0.93, 0.9) skewX(-1.5deg); opacity: 0; }
          20% { transform: translateY(-1px) scale(1.01, 1.03) skewX(1deg); opacity: ${spriteMaxOpacity}; }
          48% { transform: translateY(-4px) scale(0.99, 1.04) skewX(-1deg); opacity: ${spriteMaxOpacity}; }
          74% { transform: translateY(-6px) scale(1.02, 1.01) skewX(0.5deg); opacity: ${spriteMaxOpacity * 0.9}; }
          100% { transform: translateY(-9px) scale(1.03, 0.99) skewX(0deg); opacity: 0; }
        }
        @keyframes statusAuraSacredAscend {
          0% { transform: translateY(7px) scale(0.93) rotate(-1.5deg); opacity: 0; }
          22% { transform: translateY(0px) scale(1.01) rotate(1deg); opacity: ${spriteMaxOpacity}; }
          70% { transform: translateY(-5px) scale(1.02) rotate(-0.8deg); opacity: ${spriteMaxOpacity * 0.9}; }
          100% { transform: translateY(-9px) scale(1.03) rotate(0.5deg); opacity: 0; }
        }
        @keyframes statusAuraMiasmaSink {
          0% { transform: translateY(-6px) scale(0.94) rotate(1deg); opacity: 0; }
          22% { transform: translateY(0px) scale(1.01) rotate(-0.8deg); opacity: ${spriteMaxOpacity}; }
          70% { transform: translateY(4px) scale(1.02) rotate(0.8deg); opacity: ${spriteMaxOpacity * 0.9}; }
          100% { transform: translateY(8px) scale(1.03) rotate(0deg); opacity: 0; }
        }
        @keyframes statusAuraHaloOrbit {
          0% { transform: translate(-50%, -50%) rotate(-14deg) scale(0.82); opacity: 0; }
          18% { transform: translate(-50%, -50%) rotate(-2deg) scale(1.04); opacity: ${spriteMaxOpacity}; }
          52% { transform: translate(-50%, -50%) rotate(8deg) scale(1.0); opacity: ${spriteMaxOpacity}; }
          78% { transform: translate(-50%, -50%) rotate(16deg) scale(1.02); opacity: ${spriteMaxOpacity * 0.9}; }
          100% { transform: translate(-50%, -50%) rotate(22deg) scale(0.96); opacity: 0; }
        }
        @keyframes statusAuraVoltCrack {
          0% { opacity: 0; transform: scale(0.94); }
          16% { opacity: ${spriteMaxOpacity}; transform: translateX(-1.5px) scale(1.02); }
          34% { opacity: ${spriteMaxOpacity * 0.65}; transform: translateX(1.5px) scale(0.99); }
          52% { opacity: ${spriteMaxOpacity}; transform: translateX(-1px) scale(1.03); }
          74% { opacity: ${spriteMaxOpacity * 0.8}; transform: translateX(1px) scale(1.0); }
          100% { opacity: 0; transform: scale(1.03); }
        }
        @keyframes statusAuraFrostLock {
          0% { transform: scale(1.06); opacity: 0; }
          20% { transform: scale(0.98); opacity: ${spriteMaxOpacity}; }
          55% { transform: scale(1.01); opacity: ${spriteMaxOpacity}; }
          78% { transform: scale(1.0); opacity: ${spriteMaxOpacity * 0.9}; }
          100% { transform: scale(1.03); opacity: 0; }
        }
        @keyframes statusAuraBarrierExpand {
          0% { transform: scale(0.86); opacity: 0; }
          22% { transform: scale(1.02); opacity: ${spriteMaxOpacity}; }
          62% { transform: scale(0.99); opacity: ${spriteMaxOpacity * 0.94}; }
          100% { transform: scale(1.04); opacity: 0; }
        }
        @keyframes statusAuraChainSnap {
          0% { transform: scale(1.08); opacity: 0; }
          22% { transform: scale(0.98) rotate(-1deg); opacity: ${spriteMaxOpacity}; }
          52% { transform: scale(1.0) rotate(1deg); opacity: ${spriteMaxOpacity * 0.95}; }
          100% { transform: scale(1.02) rotate(0deg); opacity: 0; }
        }
        @keyframes statusAuraGaleDash {
          0% { transform: translateX(-10px) scaleX(0.94) skewX(2.5deg); opacity: 0; }
          22% { transform: translateX(0px) scaleX(1.01) skewX(-1.5deg); opacity: ${spriteMaxOpacity}; }
          72% { transform: translateX(6px) scaleX(1.03) skewX(-2deg); opacity: ${spriteMaxOpacity * 0.88}; }
          100% { transform: translateX(11px) scaleX(1.04) skewX(-2.5deg); opacity: 0; }
        }
        @keyframes statusAuraArmorFracture {
          0% { transform: scale(0.88); opacity: 0; }
          22% { transform: scale(1.03) rotate(-1deg); opacity: ${spriteMaxOpacity}; }
          54% { transform: scale(1.0) rotate(1deg); opacity: ${spriteMaxOpacity * 0.92}; }
          100% { transform: scale(1.05); opacity: 0; }
        }
        @keyframes statusAuraVeilFlare {
          0% { transform: scale(0.92); opacity: 0; }
          26% { transform: scale(1.02); opacity: ${spriteMaxOpacity}; }
          74% { transform: scale(1.0); opacity: ${spriteMaxOpacity * 0.9}; }
          100% { transform: scale(1.04); opacity: 0; }
        }
        @keyframes statusAuraVoltaicFlicker {
          0% { opacity: 0; transform: scale(0.92); }
          14% { opacity: 0.95; transform: scale(1.03); }
          28% { opacity: 0.3; transform: scale(0.98); }
          44% { opacity: 1; transform: scale(1.04); }
          62% { opacity: 0.45; transform: scale(0.99); }
          80% { opacity: 0.9; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.04); }
        }
        @keyframes statusAuraBubbleRise {
          0% { opacity: 0; transform: translateY(8px) scale(0.45); }
          22% { opacity: 0.92; transform: translateY(1px) scale(1.04); }
          68% { opacity: 0.88; transform: translateY(-9px) scale(1.08); }
          86% { opacity: 0.95; transform: translateY(-13px) scale(1.18); }
          100% { opacity: 0; transform: translateY(-16px) scale(0.25); }
        }
        @keyframes statusAuraBloodDropFall {
          0% { opacity: 0; transform: translateY(-10px) scale(0.7, 0.85); }
          18% { opacity: 0.96; transform: translateY(-2px) scale(1, 1); }
          72% { opacity: 0.92; transform: translateY(15px) scale(0.93, 1.14); }
          100% { opacity: 0; transform: translateY(24px) scale(0.85, 1.22); }
        }
      `}</style>

      {/* Halo volumétrico adaptado a la silueta real del personaje */}
      {isHeadHalo ? (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            left: headRelX - haloWidth * 0.65,
            top: haloCenterY - haloHeight * 0.65,
            width: haloWidth * 1.3,
            height: haloHeight * 1.3,
            background: `radial-gradient(circle, ${config.primary}20 0%, ${config.secondary}10 55%, transparent 82%)`,
            filter: 'blur(5px)',
            mixBlendMode: config.blendMode,
          }}
        />
      ) : (
        haloContourPath && (
          <svg
            viewBox={`0 0 ${auraW} ${auraH}`}
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            style={{ mixBlendMode: config.blendMode }}
          >
            <defs>
              <linearGradient id={gradSilId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={config.primary} stopOpacity="0.12" />
                <stop offset="50%" stopColor={config.secondary} stopOpacity="0.16" />
                <stop offset="100%" stopColor={config.primary} stopOpacity="0.10" />
              </linearGradient>
              <filter id={blurSilId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>
            <path
              d={haloContourPath}
              fill={`url(#${gradSilId})`}
              stroke={config.primary}
              strokeOpacity="0.18"
              strokeWidth="4"
              filter={`url(#${blurSilId})`}
            />
          </svg>
        )
      )}

      {/* Base luminosa sutil bajo los pies */}
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        style={{
          transformOrigin: `${(footCenterX / vbW) * 100}% ${Math.min(96, (footCenterY / vbH) * 100)}%`,
          animation: `statusAuraGroundPulse ${dur} ease-out both`,
        }}
      >
        <defs>
          <radialGradient id={gradPoolId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.highlight} stopOpacity="0.42" />
            <stop offset="55%" stopColor={config.primary} stopOpacity="0.24" />
            <stop offset="100%" stopColor={config.secondary} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={footCenterX}
          cy={Math.min(232, footCenterY)}
          rx="58"
          ry="12"
          fill={`url(#${gradPoolId})`}
        />
      </svg>

      {/* Marco Stylized Cartoony adaptado al contorno del sprite + Shader SVG animado */}
      {isHeadHalo ? (
        <>
          <img
            src={config.spriteUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute pointer-events-none select-none object-contain"
            style={{
              left: headRelX,
              top: haloCenterY,
              width: haloWidth,
              height: haloHeight,
              transformOrigin: 'center center',
              mixBlendMode: 'screen',
              filter: 'blur(3px) brightness(1.25)',
              animation: spriteAnim,
              opacity: 0.22,
            }}
          />
          <img
            src={config.spriteUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute pointer-events-none select-none object-contain"
            style={{
              left: headRelX,
              top: haloCenterY,
              width: haloWidth,
              height: haloHeight,
              transformOrigin: 'center center',
              filter: combinedSpriteFilter,
              animation: spriteAnim,
            }}
          />
        </>
      ) : (
        <>
          <canvas
            ref={echoCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{
              transformOrigin: '50% 68%',
              mixBlendMode: config.motif === 'bleed' ? 'normal' : 'screen',
              filter:
                config.motif === 'bleed'
                  ? 'blur(4px) saturate(1.4) brightness(0.88)'
                  : 'blur(4px) brightness(1.22)',
              animation: `statusAuraEchoSurge ${dur} ease-out both`,
            }}
          />
          <canvas
            ref={mainCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{
              transformOrigin: '50% 72%',
              filter: combinedSpriteFilter,
              animation: spriteAnim,
            }}
          />

          {/* Arcos voltaicos azul/amarillo y chispas eléctricas para Rayo y Trueno */}
          {voltaicFx && (
            <svg
              viewBox={`0 0 ${auraW} ${auraH}`}
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            >
              {voltaicFx.arcs.map((arc, idx) => (
                <g
                  key={`v-arc-${idx}`}
                  style={{
                    transformOrigin: '50% 50%',
                    animation: `statusAuraVoltaicFlicker ${Math.max(200, animDurMs - arc.delayMs)}ms ${arc.delayMs}ms linear both`,
                  }}
                >
                  <path
                    d={arc.d}
                    fill="none"
                    stroke={arc.outer}
                    strokeWidth="4.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.72"
                  />
                  <path
                    d={arc.d}
                    fill="none"
                    stroke={arc.inner}
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ))}
              {voltaicFx.sparks.map((sp, idx) => {
                const [sx, sy] = sp.pt;
                const r = sp.size;
                const d = `M ${sx} ${sy - r} L ${sx + r * 0.38} ${sy - r * 0.38} L ${sx + r} ${sy} L ${sx + r * 0.38} ${sy + r * 0.38} L ${sx} ${sy + r} L ${sx - r * 0.38} ${sy + r * 0.38} L ${sx - r} ${sy} L ${sx - r * 0.38} ${sy - r * 0.38} Z`;
                return (
                  <path
                    key={`v-sp-${idx}`}
                    d={d}
                    fill={sp.color}
                    stroke="#0f172a"
                    strokeWidth="0.9"
                    style={{
                      transformOrigin: `${sx}px ${sy}px`,
                      animation: `statusAuraVoltaicFlicker ${Math.max(190, animDurMs - sp.delayMs)}ms ${sp.delayMs}ms linear both`,
                    }}
                  />
                );
              })}
            </svg>
          )}

          {/* Pompas de veneno flotantes y brillantes para Veneno y Corrosión */}
          {poisonBubbles && (
            <svg
              viewBox={`0 0 ${auraW} ${auraH}`}
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            >
              <defs>
                <radialGradient id={bubbleGradId} cx="35%" cy="32%" r="68%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="32%" stopColor={poisonBubbles.fillLight} stopOpacity="0.82" />
                  <stop offset="100%" stopColor={poisonBubbles.fillDark} stopOpacity="0.88" />
                </radialGradient>
              </defs>
              {poisonBubbles.items.map((b, idx) => (
                <g
                  key={`p-bub-${idx}`}
                  style={{
                    transformOrigin: `${b.cx}px ${b.cy}px`,
                    animation: `statusAuraBubbleRise ${Math.max(220, animDurMs - b.delayMs)}ms ${b.delayMs}ms ease-out both`,
                  }}
                >
                  <circle
                    cx={b.cx}
                    cy={b.cy}
                    r={b.r}
                    fill={`url(#${bubbleGradId})`}
                    stroke={poisonBubbles.inkStroke}
                    strokeWidth="1.2"
                  />
                  <ellipse
                    cx={b.cx - b.r * 0.32}
                    cy={b.cy - b.r * 0.32}
                    rx={Math.max(1.1, b.r * 0.26)}
                    ry={Math.max(0.8, b.r * 0.16)}
                    transform={`rotate(-28 ${b.cx - b.r * 0.32} ${b.cy - b.r * 0.32})`}
                    fill="#ffffff"
                    opacity="0.92"
                  />
                </g>
              ))}
            </svg>
          )}

          {/* Gotas de sangre cayendo para Sangrado y Laceración */}
          {bloodDrops && (
            <svg
              viewBox={`0 0 ${auraW} ${auraH}`}
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            >
              <defs>
                <radialGradient id={bloodGradId} cx="35%" cy="55%" r="65%">
                  <stop offset="0%" stopColor={bloodDrops.fillBright} stopOpacity="0.96" />
                  <stop offset="45%" stopColor={bloodDrops.fillMid} stopOpacity="0.96" />
                  <stop offset="100%" stopColor={bloodDrops.fillDeep} stopOpacity="0.98" />
                </radialGradient>
              </defs>
              {bloodDrops.items.map((d, idx) => {
                const r = d.r;
                const dropPath = `M 0 ${(-r * 1.35).toFixed(2)} C ${(r * 0.45).toFixed(2)} ${(-r * 0.55).toFixed(2)}, ${r.toFixed(2)} ${(r * 0.15).toFixed(2)}, ${r.toFixed(2)} ${(r * 0.55).toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${(-r).toFixed(2)} ${(r * 0.55).toFixed(2)} C ${(-r).toFixed(2)} ${(r * 0.15).toFixed(2)}, ${(-r * 0.45).toFixed(2)} ${(-r * 0.55).toFixed(2)}, 0 ${(-r * 1.35).toFixed(2)} Z`;
                return (
                  <g
                    key={`b-drop-${idx}`}
                    transform={`translate(${d.cx.toFixed(1)}, ${d.cy.toFixed(1)})`}
                  >
                    <g
                      style={{
                        transformOrigin: '0px 0px',
                        animation: `statusAuraBloodDropFall ${Math.max(220, animDurMs - d.delayMs)}ms ${d.delayMs}ms cubic-bezier(0.45, 0.05, 0.85, 0.55) both`,
                      }}
                    >
                      <path
                        d={dropPath}
                        fill={`url(#${bloodGradId})`}
                        stroke={bloodDrops.inkStroke}
                        strokeWidth="1.15"
                        strokeLinejoin="round"
                      />
                      <ellipse
                        cx={-r * 0.32}
                        cy={r * 0.46}
                        rx={Math.max(0.9, r * 0.22)}
                        ry={Math.max(1.2, r * 0.34)}
                        transform={`rotate(-14 ${-r * 0.32} ${r * 0.46})`}
                        fill={bloodDrops.fillBright}
                        opacity="0.88"
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
          )}
        </>
      )}
    </div>
  );
};
