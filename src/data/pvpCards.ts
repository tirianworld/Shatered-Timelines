import { SKILL_DEFINITIONS } from '../components/CombatView';
import { getHeroById } from './heroesData';
import type { PvpCardSeed } from '../types/pvp';

/**
 * Cartas del combate de historia reutilizadas en el PvP del coliseo.
 *
 * Cada héroe tiene su mismo pool de cartas que en la campaña (`getHeroCardPool` de
 * CombatView). El servidor reparte manos de 4 cartas de ese pool con sus valores de
 * misión (daño/curación en escala 0-100) y el cliente pinta el arte real de la carta
 * leyendo `SKILL_DEFINITIONS`, así que el coliseo usa exactamente las mismas cartas.
 */
const PVP_HERO_CARD_POOL: Record<string, string[]> = {
  smurph_draco: ['smurph_aterrizaje_heroico', 'smurph_bolas_fuego', 'smurph_aliento_rayo'],
  smurph: ['smurph_aterrizaje_heroico', 'smurph_bolas_fuego', 'smurph_aliento_rayo'],
  roxanne: ['roxanne_inspiracion', 'roxanne_velada', 'roxanne_estocada'],
  barled: ['barled_inspiracion', 'barled_fuego_feerico', 'barled_curacion'],
  raxxar: ['raxxar_espada', 'raxxar_escudo', 'raxxar_lanza'],
  ragnavaldr: ['ragnavaldr_doble_lanza', 'ragnavaldr_furia', 'ragnavaldr_cuchillo_hielo'],
  kairon: ['kairon_tiro_doble', 'kairon_disparo_dual', 'kairon_espadazo_largo'],
  prometeo: ['prometeo_fire_bolt', 'prometeo_espada_verde', 'prometeo_bola_fuego'],
  chispo_deez: ['chispo_martillo', 'chispo_luz_divina', 'chispo_castigo_divino'],
  chispo: ['chispo_martillo', 'chispo_luz_divina', 'chispo_castigo_divino'],
  giovani: ['giovani_plumas', 'giovani_treta', 'giovani_tomo'],
  giovani_vazquez: ['giovani_plumas', 'giovani_treta', 'giovani_tomo'],
  edacorn: ['ataque_furtivo', 'contraataque', 'sigilo'],
  pepe_loux: ['pepe_ataque', 'pepe_remo', 'pepe_escudo'],
  arlem: ['arlem_rankup', 'arlem_curacion', 'arlem_fuego'],
  arlem_diaz: ['arlem_rankup', 'arlem_curacion', 'arlem_fuego'],
  magordito: ['rayo_necrotico', 'drenar_maldiciones', 'fortalecer_marioneta'],
};

const DEFAULT_POOL = ['rayo_necrotico', 'drenar_maldiciones', 'fortalecer_marioneta'];

export const pvpCardPoolFor = (heroId: string): string[] =>
  PVP_HERO_CARD_POOL[heroId] ?? DEFAULT_POOL;

/** Arte de la carta de definitiva de cada héroe, igual que en la campaña. */
const HERO_ULTIMATE_ART: Record<string, string> = {
  arlem_diaz: '/assets/skills/arlem_ultimate.webp',
  arlem: '/assets/skills/arlem_ultimate.webp',
  smurph: '/assets/skills/smurph_ultimate.webp',
  smurph_draco: '/assets/skills/smurph_ultimate.webp',
  chispo_deez: '/assets/skills/chispo_ultimate.webp',
  chispo: '/assets/skills/chispo_ultimate.webp',
  giovani_vazquez: '/assets/skills/giovani_ultimate.webp',
  giovani: '/assets/skills/giovani_ultimate.webp',
};

export const pvpUltimateArt = (heroId: string): string =>
  HERO_ULTIMATE_ART[heroId] ?? `/assets/skills/${heroId}_ultimate.webp`;

/**
 * Todas las cartas (3 habilidades x 3 niveles) que puede robar un héroe.
 *
 * El daño de la campaña ya no es un valor fijo: es `damagePercent` sobre el ATQ del héroe,
 * así que se traduce a la escala 0-100 del coliseo dividiendo por la vida del escuadrón.
 */
export const pvpCardsForHero = (
  heroId: string,
  options?: { attack?: number; squadMaxHp?: number }
): PvpCardSeed[] => {
  const hero = getHeroById(heroId);
  const attack = Math.max(1, Math.round(options?.attack ?? hero?.stats?.attack ?? 100));
  const poolHp = Math.max(1, Math.round(options?.squadMaxHp ?? hero?.stats?.maxHp ?? 1000));
  const poolScale = poolHp / 100;
  const seeds: PvpCardSeed[] = [];
  pvpCardPoolFor(heroId).forEach((skillId) => {
    const def = SKILL_DEFINITIONS[skillId];
    if (!def) return;
    ([1, 2, 3] as const).forEach((tier) => {
      const info = def.tiers[tier];
      if (!info) return;
      // Estados de la carta: los mismos que aplica en la campaña.
      const rawEffects = [...(info.gachaEffectsApplied ?? []), ...(info.dndConditionsApplied ?? [])];
      const effects = rawEffects
        .filter((effect) => effect && effect.type && String(effect.type) !== 'none')
        .map((effect) => ({
          type: String(effect.type),
          duration: Math.max(1, Math.min(3, effect.duration ?? 1)),
          stacks: Math.max(1, Math.min(3, effect.stacks ?? 1)),
          target: effect.target === 'hero' ? ('hero' as const) : ('enemy' as const),
        }))
        .slice(0, 3);
      seeds.push({
        skillId,
        tier,
        name: info.title || def.name,
        damage: Math.max(0, Math.round(((attack * (info.damagePercent ?? 0)) / 100) / poolScale)),
        heal: Math.max(0, Math.round(info.heal || 0)),
        effects,
      });
    });
  });
  return seeds;
};

/** Arte de una carta concreta (nivel incluido), tal cual se ve en las misiones. */
export const pvpCardArt = (skillId: string, tier: 1 | 2 | 3): string | null =>
  SKILL_DEFINITIONS[skillId]?.tiers?.[tier]?.image ?? null;

export const pvpCardTitle = (skillId: string, tier: 1 | 2 | 3): string =>
  SKILL_DEFINITIONS[skillId]?.tiers?.[tier]?.title ?? SKILL_DEFINITIONS[skillId]?.name ?? '';

/**
 * Postura de casteo de cada habilidad, las mismas que usa la campaña al jugar la carta
 * (`getHeroSpriteUrl` de CombatView). Devuelve null si el héroe no tiene pose propia.
 */
const SKILL_CAST_SPRITE: Record<string, string> = {
  pepe_ataque: '/assets/combat/pepe_loux_cast_hacha.webp',
  pepe_remo: '/assets/combat/pepe_loux_cast_remo.webp',
  pepe_escudo: '/assets/combat/pepe_loux_cast_escudo.webp',
  arlem_rankup: '/assets/combat/arlem_cast_inspiracion.webp',
  arlem_curacion: '/assets/combat/arlem_cast_balada.webp',
  arlem_fuego: '/assets/combat/arlem_cast_estocada.webp',
  ataque_furtivo: '/assets/combat/edacorn_cast_furtivo.webp',
  contraataque: '/assets/combat/edacorn_cast_contraataque.webp',
  sigilo: '/assets/combat/edacorn_cast_sigilo.webp',
  rayo_necrotico: '/assets/combat/magordito_cast_rayo.webp',
  drenar_maldiciones: '/assets/combat/magordito_cast_toxic.webp',
  fortalecer_marioneta: '/assets/combat/magordito_cast_slash.webp',
  cataclismo_astral: '/assets/combat/magordito_cast_rayo.webp',
};

/** Pose de casteo genérica de cada héroe (una sola para todas sus cartas). */
const HERO_CAST_SPRITE: Record<string, string> = {
  arlem: '/assets/combat/arlem_cast_estocada.webp',
  arlem_diaz: '/assets/combat/arlem_cast_estocada.webp',
  barled: '/assets/combat/barled_cast.webp',
  chispo: '/assets/combat/chispo_cast.webp',
  chispo_deez: '/assets/combat/chispo_cast.webp',
  giovani: '/assets/combat/giovani_cast.webp',
  giovani_vazquez: '/assets/combat/giovani_cast.webp',
  kairon: '/assets/combat/kairon_cast.webp',
  magordito: '/assets/combat/magordito_cast_slash.webp',
  pepe_loux: '/assets/combat/pepe_loux_cast_hacha.webp',
  prometeo: '/assets/combat/prometeo_cast.webp',
  ragnavaldr: '/assets/combat/ragnavaldr_cast.webp',
  roxanne: '/assets/combat/roxanne_cast.webp',
  smurph: '/assets/combat/smurph_cast.webp',
  smurph_draco: '/assets/combat/smurph_cast.webp',
  edacorn: '/assets/combat/edacorn_cast_furtivo.webp',
};

export const pvpSkillCastSprite = (heroId: string, skillId: string): string | null =>
  SKILL_CAST_SPRITE[skillId] ?? HERO_CAST_SPRITE[heroId] ?? null;
