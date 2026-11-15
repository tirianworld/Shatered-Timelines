/**
 * Efectos de sonido del combate: uno propio por personaje y por ataque.
 *
 * Los nombres son claves de ASSET_SFX en `src/services/soundService.ts`, que apuntan
 * al pack cartoon CC0 de `public/assets/audio/cartoon` (spritepilot + bigsoundbank).
 * Si un ataque no está listado se usa el sonido del personaje, y si tampoco existe,
 * el genérico de ataque.
 *
 * Además del archivo, cada personaje tiene una "voz": tono (rate) y volumen. Así el
 * mismo golpe suena grave y pesado en Raxxar y rápido y agudo en Barled.
 */

export type CombatVoice = {
  sfx: string;
  rate: number;
  volume: number;
};

/** Sonido base de cada personaje (su "firma" al golpear). */
export const HERO_BASIC_SFX: Record<string, string> = {
  magordito: 'dark_god',
  edacorn: 'dagger',
  arlem: 'spell',
  pepe_loux: 'axe',
  chispo: 'hammer',
  giovani: 'bow',
  prometeo: 'flame',
  kairon: 'airslash',
  ragnavaldr: 'frost',
  roxanne: 'gong',
  barled: 'sparkle',
  raxxar: 'airslash',
  smurph: 'roar',
};

/** Tono y volumen de la firma sonora de cada personaje. */
export const HERO_COMBAT_VOICE: Record<string, { rate: number; volume: number }> = {
  magordito: { rate: 0.9, volume: 1 }, // nigromante: oscuro y grave
  edacorn: { rate: 1.12, volume: 0.9 }, // pícaro: rápido y ligero
  arlem: { rate: 1, volume: 0.95 }, // bardo: neutro
  pepe_loux: { rate: 0.92, volume: 1.1 }, // enano: pesado
  chispo: { rate: 0.95, volume: 1.05 }, // clérigo: metálico
  giovani: { rate: 1.06, volume: 0.92 }, // arquero: seco y ágil
  prometeo: { rate: 0.98, volume: 1 }, // cazador de fuego
  kairon: { rate: 1.04, volume: 0.95 }, // pistolero: rápido
  ragnavaldr: { rate: 0.86, volume: 1.15 }, // druida glacial: enorme
  roxanne: { rate: 1.1, volume: 0.85 }, // velada: etérea
  barled: { rate: 1.16, volume: 0.8 }, // feérico: campanilla
  raxxar: { rate: 0.88, volume: 1.15 }, // guardián: acorazado
  smurph: { rate: 0.84, volume: 1.15 }, // dragón: bestial
};

/** Sonido concreto de cada ataque (una carta = un efecto distinto). */
export const SKILL_COMBAT_SFX: Record<string, string> = {
  // Magordito — nigromante
  rayo_necrotico: 'storm',
  dios_oscuro: 'boom',
  drenar_maldiciones: 'drain',
  fortalecer_marioneta: 'powerup',
  cataclismo_astral: 'cataclysm',

  // Edacorn — pícaro
  ataque_furtivo: 'dagger',
  contraataque: 'parry',
  sigilo: 'teleport',

  // Arlem — bardo
  arlem_rankup: 'levelup',
  arlem_curacion: 'mend',
  arlem_fuego: 'flame2',

  // Pepe Loux — enano
  pepe_ataque: 'axe',
  pepe_remo: 'whip',
  pepe_escudo: 'block',

  // Chispo Deez — clérigo
  chispo_martillo: 'hammer',
  chispo_luz_divina: 'bell',
  chispo_castigo_divino: 'storm',

  // Giovani Vázquez — arquero
  giovani_plumas: 'bow',
  giovani_treta: 'arrow',
  giovani_tomo: 'spell',

  // Prometeo — fuego
  prometeo_fire_bolt: 'flame',
  prometeo_espada_verde: 'airslash',
  prometeo_bola_fuego: 'fireball_cast',

  // Kairon — pistolero y espadachín
  kairon_tiro_doble: 'zap',
  kairon_disparo_dual: 'raygun',
  kairon_espadazo_largo: 'airslash',

  // Ragnavaldr — druida glacial
  ragnavaldr_doble_lanza: 'spear',
  ragnavaldr_furia: 'roar',
  ragnavaldr_cuchillo_hielo: 'frost',

  // Roxanne — velada
  roxanne_inspiracion: 'gong',
  roxanne_velada: 'portal',
  roxanne_estocada: 'dagger',

  // Barled — feérico
  barled_inspiracion: 'chime',
  barled_fuego_feerico: 'sparkle',
  barled_curacion: 'hp',

  // Raxxar — guardián
  raxxar_espada: 'airslash',
  raxxar_escudo: 'field',
  raxxar_lanza: 'spear',

  // Smurph Draco — dragón
  smurph_aterrizaje_heroico: 'land',
  smurph_bolas_fuego: 'fireball_cast',
  smurph_aliento_rayo: 'beam',
};

/** Ajuste fino por ataque: los golpes gordos bajan el tono y suben el volumen. */
const SKILL_COMBAT_VOICE: Record<string, { rate?: number; volume?: number }> = {
  // Golpes contundentes y de área
  dios_oscuro: { rate: 0.9, volume: 1.1 },
  cataclismo_astral: { rate: 0.88, volume: 1.1 },
  prometeo_bola_fuego: { rate: 0.92, volume: 1.1 },
  smurph_bolas_fuego: { rate: 0.9, volume: 1.1 },
  chispo_martillo: { rate: 0.95, volume: 1.05 },
  pepe_ataque: { rate: 0.94, volume: 1.05 },
  smurph_aliento_rayo: { rate: 0.92, volume: 1.1 },
  ragnavaldr_furia: { rate: 0.9, volume: 1.1 },

  // Cortes de aire: un pelín más agudos y suaves que el impacto
  kairon_espadazo_largo: { rate: 1.05, volume: 0.92 },
  prometeo_espada_verde: { rate: 1.02, volume: 0.95 },
  raxxar_espada: { rate: 0.95, volume: 1 },

  // Estocadas rápidas
  ataque_furtivo: { rate: 1.08, volume: 0.9 },
  roxanne_estocada: { rate: 1.08, volume: 0.9 },
  contraataque: { rate: 1.02, volume: 1 },

  // Magia
  rayo_necrotico: { rate: 0.95, volume: 1 },
  chispo_castigo_divino: { rate: 1.02, volume: 1 },
  ragnavaldr_cuchillo_hielo: { rate: 1.04, volume: 0.95 },
};

/** Algunos héroes tienen variantes con otro id (mismo personaje). */
const HERO_ALIASES: Record<string, string> = {
  smurph_draco: 'smurph',
  arlem_diaz: 'arlem',
  chispo_deez: 'chispo',
  giovani_vazquez: 'giovani',
  pepe: 'pepe_loux',
};

const DEFAULT_VOICE = { rate: 1, volume: 1 };

/** Sonido base (firma) de un personaje. */
export const getHeroBasicSfx = (heroId: string): string =>
  HERO_BASIC_SFX[HERO_ALIASES[heroId] ?? heroId] ?? 'attack';

/** Tono y volumen de la firma de un personaje. */
export const getHeroCombatVoice = (heroId: string): { rate: number; volume: number } =>
  HERO_COMBAT_VOICE[HERO_ALIASES[heroId] ?? heroId] ?? DEFAULT_VOICE;

/** Sonido de un ataque concreto, según el personaje que lo lanza. */
export const getCardCombatSfx = (skillId: string, heroId: string): string =>
  SKILL_COMBAT_SFX[skillId] ?? getHeroBasicSfx(heroId);

/** Sonido + tono + volumen de un ataque concreto de un personaje concreto. */
export const getCombatVoice = (skillId: string, heroId: string): CombatVoice => {
  const base = getHeroCombatVoice(heroId);
  const tweak = SKILL_COMBAT_VOICE[skillId] ?? {};
  return {
    sfx: getCardCombatSfx(skillId, heroId),
    rate: base.rate * (tweak.rate ?? 1),
    volume: Math.min(1.2, base.volume * (tweak.volume ?? 1)),
  };
};
