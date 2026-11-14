/**
 * Efectos de sonido del combate: uno propio por personaje y por ataque.
 *
 * Los nombres son claves de ASSET_SFX en `src/services/soundService.ts`, que apuntan
 * al pack cartoon CC0 de `public/assets/audio/cartoon`. Si un ataque no está listado
 * se usa el sonido del personaje, y si tampoco existe, el genérico de ataque.
 */

/** Sonido base de cada personaje (su "firma" al golpear). */
export const HERO_BASIC_SFX: Record<string, string> = {
  magordito: 'dark_god',
  edacorn: 'dash',
  arlem: 'spell',
  pepe_loux: 'thud',
  chispo: 'metal',
  giovani: 'bow',
  prometeo: 'flame',
  kairon: 'sword',
  ragnavaldr: 'frost',
  roxanne: 'gong',
  barled: 'punch',
  raxxar: 'spear',
  smurph: 'roar',
};

/** Sonido concreto de cada ataque (una carta = un efecto distinto). */
export const SKILL_COMBAT_SFX: Record<string, string> = {
  // Magordito — nigromante
  rayo_necrotico: 'storm',
  dios_oscuro: 'boom',
  drenar_maldiciones: 'teleport',
  fortalecer_marioneta: 'powerup',
  cataclismo_astral: 'ultimate',

  // Edacorn — pícaro
  ataque_furtivo: 'dash',
  contraataque: 'clash',
  sigilo: 'teleport',

  // Arlem — bardo
  arlem_rankup: 'levelup',
  arlem_curacion: 'mend',
  arlem_fuego: 'flame2',

  // Pepe Loux — enano
  pepe_ataque: 'thud',
  pepe_remo: 'kick',
  pepe_escudo: 'block',

  // Chispo Deez — clérigo
  chispo_martillo: 'metal',
  chispo_luz_divina: 'bell',
  chispo_castigo_divino: 'storm',

  // Giovani Vázquez — arquero
  giovani_plumas: 'bow',
  giovani_treta: 'arrow',
  giovani_tomo: 'spell',

  // Prometeo — fuego
  prometeo_fire_bolt: 'flame',
  prometeo_espada_verde: 'slash',
  prometeo_bola_fuego: 'boom',

  // Kairon — espadachín
  kairon_tiro_doble: 'zap',
  kairon_disparo_dual: 'raygun',
  kairon_espadazo_largo: 'sword',

  // Ragnavaldr — druida glacial
  ragnavaldr_doble_lanza: 'spear',
  ragnavaldr_furia: 'roar',
  ragnavaldr_cuchillo_hielo: 'frost',

  // Roxanne — velada
  roxanne_inspiracion: 'gong',
  roxanne_velada: 'portal',
  roxanne_estocada: 'clash',

  // Barled — feérico
  barled_inspiracion: 'chime',
  barled_fuego_feerico: 'sparkle',
  barled_curacion: 'hp',

  // Raxxar — guardián
  raxxar_espada: 'sword',
  raxxar_escudo: 'field',
  raxxar_lanza: 'spear',

  // Smurph Draco — dragón
  smurph_aterrizaje_heroico: 'land',
  smurph_bolas_fuego: 'pop',
  smurph_aliento_rayo: 'beam',
};

/** Algunos héroes tienen variantes con otro id (mismo personaje). */
const HERO_ALIASES: Record<string, string> = {
  smurph_draco: 'smurph',
  arlem_diaz: 'arlem',
  chispo_deez: 'chispo',
  giovani_vazquez: 'giovani',
  pepe: 'pepe_loux',
};

/** Sonido base (firma) de un personaje. */
export const getHeroBasicSfx = (heroId: string): string =>
  HERO_BASIC_SFX[HERO_ALIASES[heroId] ?? heroId] ?? 'attack';

/** Sonido de un ataque concreto, según el personaje que lo lanza. */
export const getCardCombatSfx = (skillId: string, heroId: string): string =>
  SKILL_COMBAT_SFX[skillId] ?? getHeroBasicSfx(heroId);
