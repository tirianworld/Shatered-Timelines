import { Hero } from '../types/game';

/**
 * Calcula la Suerte total de un héroe (base + equipo equipado) usando la misma
 * escala visible en HeroPageView (critRate * 100).
 */
export function getHeroLuck(hero?: Hero | null): number {
  if (!hero) return 10;
  const slots = [
    hero.equipped?.weapon,
    hero.equipped?.armor,
    hero.equipped?.helmet,
    hero.equipped?.ring,
    hero.equipped?.accessory,
  ];
  const equipCrit = slots.reduce((sum, item) => sum + (item?.stats?.critRate ?? 0), 0);
  const totalCrit = (hero.stats?.critRate ?? 0.1) + equipCrit;
  return Math.round(totalCrit * 1000) / 10;
}

export interface DrinkingDifficultyParams {
  /** Amplitud en grados del área correcta en la rueda de skill check. */
  zoneDegrees: number;
  /** Velocidad angular de la aguja en grados por segundo. */
  speedDegPerSec: number;
  /** Etiqueta descriptiva del nivel de ventaja por Suerte. */
  luckTierLabel: string;
}

/**
 * Cuanta más Suerte tenga el héroe, mayor es la zona correcta y más calmada gira la aguja.
 */
export function getDrinkingDifficultyFromLuck(luck: number): DrinkingDifficultyParams {
  const clampedLuck = Math.max(0, Math.min(80, luck));
  const zoneDegrees = Math.round(Math.max(32, Math.min(108, 24 + clampedLuck * 1.65)));
  const speedDegPerSec = Math.round(Math.max(210, Math.min(345, 355 - clampedLuck * 2.8)));

  let luckTierLabel = 'Pulso tenso';
  if (clampedLuck >= 32) {
    luckTierLabel = 'Suerte legendaria';
  } else if (clampedLuck >= 24) {
    luckTierLabel = 'Gran fortuna';
  } else if (clampedLuck >= 18) {
    luckTierLabel = 'Buena suerte';
  } else if (clampedLuck >= 12) {
    luckTierLabel = 'Suerte moderada';
  }

  return {
    zoneDegrees,
    speedDegPerSec,
    luckTierLabel,
  };
}
