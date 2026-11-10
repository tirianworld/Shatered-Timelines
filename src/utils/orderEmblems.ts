import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  Axe,
  Bird,
  Compass,
  Crown,
  Eye,
  Feather,
  Flame,
  Gem,
  Ghost,
  Moon,
  Shield,
  Skull,
  Snowflake,
  Star,
  Sun,
  Swords,
  Target,
  Zap,
} from 'lucide-react';

/**
 * Emblemas heráldicos de la Orden (estilo 7DS Grand Cross / WoW).
 * Se guardan como un código corto (`cdd-emblem:forma:color:símbolo`) para que la base
 * de órdenes de GitHub siga siendo legible y ligera, sin añadir imágenes al repositorio.
 */

export type EmblemShapeId = 'shield' | 'round' | 'diamond' | 'banner' | 'crest';
export type EmblemPaletteId =
  | 'gold'
  | 'crimson'
  | 'azure'
  | 'emerald'
  | 'violet'
  | 'frost'
  | 'obsidian'
  | 'ivory';
export type EmblemSymbolId =
  | 'swords'
  | 'shield'
  | 'crown'
  | 'skull'
  | 'flame'
  | 'moon'
  | 'snow'
  | 'star'
  | 'sun'
  | 'gem'
  | 'feather'
  | 'eye'
  | 'target'
  | 'bolt'
  | 'axe'
  | 'bird'
  | 'ghost'
  | 'anchor'
  | 'compass'
  | 'heart_of_ice';

export interface EmblemSelection {
  shape: EmblemShapeId;
  palette: EmblemPaletteId;
  symbol: EmblemSymbolId;
}

const CODE_PREFIX = 'cdd-emblem';

export const DEFAULT_EMBLEM: EmblemSelection = {
  shape: 'shield',
  palette: 'gold',
  symbol: 'swords',
};

/** Trazados SVG en un lienzo de 64x64. */
export const SHAPE_PATHS: Record<EmblemShapeId, { outer: string; inner?: string }> = {
  shield: {
    outer: 'M32 4 L57 12 V32 C57 45 46 55 32 60 C18 55 7 45 7 32 V12 Z',
    inner: 'M32 10 L51 16 V32 C51 42 43 50 32 54 C21 50 13 42 13 32 V16 Z',
  },
  round: {
    outer: 'M32 4 A28 28 0 1 1 31.99 4 Z',
    inner: 'M32 10 A22 22 0 1 1 31.99 10 Z',
  },
  diamond: {
    outer: 'M32 3 L61 32 L32 61 L3 32 Z',
    inner: 'M32 11 L53 32 L32 53 L11 32 Z',
  },
  banner: {
    outer: 'M12 5 H52 V52 L32 43 L12 52 Z',
    inner: 'M17 11 H47 V45 L32 38 L17 45 Z',
  },
  crest: {
    outer: 'M32 4 L56 17 V45 L32 60 L8 45 V17 Z',
    inner: 'M32 11 L50 20 V42 L32 52 L14 42 V20 Z',
  },
};

export const SHAPES: Array<{ id: EmblemShapeId; label: string }> = [
  { id: 'shield', label: 'Escudo' },
  { id: 'round', label: 'Medallón' },
  { id: 'diamond', label: 'Rombo' },
  { id: 'banner', label: 'Estandarte' },
  { id: 'crest', label: 'Blasón' },
];

export const PALETTES: Array<{
  id: EmblemPaletteId;
  label: string;
  from: string;
  to: string;
  rim: string;
  glyph: string;
}> = [
  { id: 'gold', label: 'Oro', from: '#fbbf24', to: '#7c4a09', rim: '#fde68a', glyph: '#fff8e1' },
  { id: 'crimson', label: 'Carmesí', from: '#f87171', to: '#5f0f14', rim: '#fecaca', glyph: '#fff1f2' },
  { id: 'azure', label: 'Azur', from: '#60a5fa', to: '#0c2c5c', rim: '#bfdbfe', glyph: '#eff6ff' },
  { id: 'emerald', label: 'Esmeralda', from: '#34d399', to: '#064e3b', rim: '#a7f3d0', glyph: '#ecfdf5' },
  { id: 'violet', label: 'Amatista', from: '#c084fc', to: '#3b0764', rim: '#e9d5ff', glyph: '#faf5ff' },
  { id: 'frost', label: 'Escarcha', from: '#a5f3fc', to: '#0e4a5e', rim: '#e0f2fe', glyph: '#f0f9ff' },
  { id: 'obsidian', label: 'Obsidiana', from: '#6b7280', to: '#0b0f14', rim: '#d1d5db', glyph: '#f3f4f6' },
  { id: 'ivory', label: 'Marfil', from: '#f5e6c8', to: '#8a6a3b', rim: '#fffbeb', glyph: '#3f2f14' },
];

export const SYMBOLS: Array<{ id: EmblemSymbolId; label: string; icon: LucideIcon }> = [
  { id: 'swords', label: 'Espadas', icon: Swords },
  { id: 'shield', label: 'Escudo', icon: Shield },
  { id: 'crown', label: 'Corona', icon: Crown },
  { id: 'skull', label: 'Cráneo', icon: Skull },
  { id: 'flame', label: 'Llama', icon: Flame },
  { id: 'moon', label: 'Luna', icon: Moon },
  { id: 'snow', label: 'Copo', icon: Snowflake },
  { id: 'star', label: 'Estrella', icon: Star },
  { id: 'sun', label: 'Sol', icon: Sun },
  { id: 'gem', label: 'Gema', icon: Gem },
  { id: 'feather', label: 'Pluma', icon: Feather },
  { id: 'eye', label: 'Ojo', icon: Eye },
  { id: 'target', label: 'Diana', icon: Target },
  { id: 'bolt', label: 'Rayo', icon: Zap },
  { id: 'axe', label: 'Hacha', icon: Axe },
  { id: 'bird', label: 'Ave', icon: Bird },
  { id: 'ghost', label: 'Espectro', icon: Ghost },
  { id: 'anchor', label: 'Ancla', icon: Anchor },
  { id: 'compass', label: 'Brújula', icon: Compass },
  { id: 'heart_of_ice', label: 'Corazón de hielo', icon: Snowflake },
];

export const isEmblemCode = (value?: string | null): boolean =>
  typeof value === 'string' && value.startsWith(`${CODE_PREFIX}:`);

export const encodeEmblem = (selection: EmblemSelection): string =>
  `${CODE_PREFIX}:${selection.shape}:${selection.palette}:${selection.symbol}`;

export const decodeEmblem = (value?: string | null): EmblemSelection => {
  if (!isEmblemCode(value)) return DEFAULT_EMBLEM;
  const [, rawShape, rawPalette, rawSymbol] = String(value).split(':');
  return {
    shape: SHAPES.find((s) => s.id === rawShape)?.id ?? DEFAULT_EMBLEM.shape,
    palette: PALETTES.find((p) => p.id === rawPalette)?.id ?? DEFAULT_EMBLEM.palette,
    symbol: SYMBOLS.find((s) => s.id === rawSymbol)?.id ?? DEFAULT_EMBLEM.symbol,
  };
};

export const getPalette = (id: EmblemPaletteId) =>
  PALETTES.find((p) => p.id === id) ?? PALETTES[0];

export const getSymbolIcon = (id: EmblemSymbolId): LucideIcon =>
  SYMBOLS.find((s) => s.id === id)?.icon ?? Swords;
