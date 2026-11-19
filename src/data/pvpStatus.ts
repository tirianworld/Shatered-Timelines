import { GACHA_EFFECTS_CATALOG } from '../types/gachaCombatEffects';

/**
 * Efectos de estado del PvP. La ficha (nombre, icono, si es bueno o malo) sale del catálogo de
 * efectos que ya usa la campaña, así el coliseo muestra los mismos estados con el mismo arte.
 */
export type PvpStatusKind =
  | 'stun'
  | 'dot'
  | 'hot'
  | 'vuln'
  | 'atk_up'
  | 'atk_down'
  | 'def_up'
  | 'miss'
  | 'other';

export const pvpStatusKind = (type: string): PvpStatusKind => {
  switch (type) {
    case 'stun':
    case 'paralyze':
    case 'frozen':
    case 'confused':
    case 'charmed':
    case 'wind_prison':
    case 'frightened':
      return 'stun';
    case 'poison':
    case 'burn':
    case 'bleed':
    case 'corrosion':
    case 'decay':
    case 'shock':
    case 'chill':
    case 'chilled':
    case 'frost_mist':
    case 'exhaustion':
      return 'dot';
    case 'regen':
      return 'hot';
    case 'def_break':
    case 'laceration':
    case 'faerie_fire':
      return 'vuln';
    case 'atk_buff':
      return 'atk_up';
    case 'atk_down':
      return 'atk_down';
    case 'def_buff':
      return 'def_up';
    case 'blind':
    case 'holy_blind':
      return 'miss';
    default:
      return 'other';
  }
};

export const pvpStatusLabel = (type: string): string =>
  GACHA_EFFECTS_CATALOG[type]?.nameEs ?? GACHA_EFFECTS_CATALOG[type]?.name ?? type;

export const pvpStatusIcon = (type: string): string => GACHA_EFFECTS_CATALOG[type]?.icon ?? '✨';

/** Un efecto es hostil para quien lo lleva si la carta lo lanzaba al enemigo. */
export const pvpStatusHostile = (type: string, target: 'enemy' | 'hero'): boolean => {
  if (target === 'enemy') return true;
  if (target === 'hero') return false;
  return !(GACHA_EFFECTS_CATALOG[type]?.isBuff ?? false);
};

/** Multiplicador de daño que inflige un luchador según sus estados. */
export const pvpOutgoingMultiplier = (kinds: PvpStatusKind[]): number => {
  let mod = 1;
  if (kinds.includes('atk_up')) mod += 0.25;
  if (kinds.includes('atk_down')) mod -= 0.25;
  return Math.max(0.4, Math.min(1.8, mod));
};

/** Multiplicador de daño que recibe un luchador según sus estados. */
export const pvpIncomingMultiplier = (kinds: PvpStatusKind[]): number => {
  let mod = 1;
  if (kinds.includes('vuln')) mod += 0.3;
  if (kinds.includes('def_up')) mod -= 0.3;
  return Math.max(0.3, Math.min(2, mod));
};
