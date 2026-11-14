import React, { useEffect, useRef, useState } from 'react';

export type EnemyVfxCategory =
  | 'crimson_claw'
  | 'frost_blizzard'
  | 'shadow_needle'
  | 'earth_titan'
  | 'void_miasma'
  | 'gorgon_lightning';

export interface ActiveEnemyAttackVfxState {
  vfxType: EnemyVfxCategory;
  themeColor: string;
  dndDamageType: string;
  isUlt?: boolean;
  isSpecial?: boolean;
  hobgoblinPhase?: 1 | 2 | 3;
  skillName?: string;
  enemyConfigId?: string;
  vfxKey: number;
}

export interface EnemyAttackVfxOverlayProps {
  activeAttack: ActiveEnemyAttackVfxState | null;
  enabled?: boolean;
}

type DeliveryMode =
  | 'sword_slash'
  | 'dagger_slash'
  | 'spear_thrust'
  | 'arrow_shot'
  | 'crossbow_bolt'
  | 'sling_stone'
  | 'club_smash'
  | 'axe_cleave'
  | 'hammer_slam'
  | 'punch_slam'
  | 'shaman_wisp'
  | 'grenade_throw'
  | 'blunderbuss_shot'
  | 'claw_swipe'
  | 'fang_bite'
  | 'spine_shot'
  | 'acid_glob'
  | 'ice_shard'
  | 'ice_lance'
  | 'ceiling_impale'
  | 'lightning_slam'
  | 'void_orb'
  | 'lightning_bolt'
  | 'scythe_slash'
  | 'lifesteal_bite'
  | 'static_pulse';

type ShaderKey =
  | 'none'
  | 'crimson'
  | 'steel'
  | 'gold'
  | 'goblin'
  | 'fire'
  | 'frost'
  | 'acid'
  | 'void'
  | 'lightning';

type ParticlePreset =
  | 'sparks'
  | 'blood'
  | 'dust'
  | 'splinters'
  | 'fire'
  | 'frost'
  | 'acid'
  | 'void'
  | 'lightning'
  | 'lifesteal';

interface EnemyVfxProfile {
  mode: DeliveryMode;
  shader: ShaderKey;
  particles: ParticlePreset;
  accentColor: string;
  spriteSrc: string;
  flipImgX?: boolean;
  onoSrc?: string;
  ultOnoSrc?: string;
  impactSrc?: string;
}

const FILTER_ID_MAP: Record<ShaderKey, string | undefined> = {
  none: undefined,
  crimson: 'url(#enemy-vfx-crimson-shader)',
  steel: 'url(#enemy-vfx-steel-shader)',
  gold: 'url(#enemy-vfx-gold-shader)',
  goblin: 'url(#enemy-vfx-goblin-shader)',
  fire: 'url(#enemy-vfx-fire-shader)',
  frost: 'url(#enemy-vfx-frost-shader)',
  acid: 'url(#enemy-vfx-acid-shader)',
  void: 'url(#enemy-vfx-void-shader)',
  lightning: 'url(#enemy-vfx-lightning-shader)',
};

const ENEMY_VFX_PROFILES: Record<string, EnemyVfxProfile> = {
  // === GOBLINS ===
  goblin_daga: {
    mode: 'dagger_slash',
    shader: 'goblin',
    particles: 'sparks',
    accentColor: '#84cc16',
    spriteSrc: '/assets/combat/enemy_vfx_dagger_slash.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_corte.png',
    ultOnoSrc: '/assets/combat/edacorn_vfx_slash.png',
  },
  goblin_honda: {
    mode: 'sling_stone',
    shader: 'none',
    particles: 'dust',
    accentColor: '#a8a29e',
    spriteSrc: '/assets/combat/enemy_vfx_sling_stone.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/magordito_vfx_bonk.png',
  },
  goblin_garrote: {
    mode: 'club_smash',
    shader: 'none',
    particles: 'splinters',
    accentColor: '#d97706',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/magordito_vfx_bonk.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },
  goblin_chaman: {
    mode: 'shaman_wisp',
    shader: 'goblin',
    particles: 'acid',
    accentColor: '#34d399',
    spriteSrc: '/assets/combat/enemy_vfx_chaman_wisp.png',
    impactSrc: '/assets/combat/edacorn_vfx_humo.png',
    onoSrc: '/assets/combat/edacorn_vfx_slosh.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },

  // === BANDIDOS ===
  bandido_daga: {
    mode: 'dagger_slash',
    shader: 'crimson',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_dagger_slash.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_slash.png',
    ultOnoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  bandido_tirador: {
    mode: 'arrow_shot',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#f59e0b',
    spriteSrc: '/assets/combat/enemy_vfx_bandit_arrow.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  bandido_lider: {
    mode: 'axe_cleave',
    shader: 'crimson',
    particles: 'sparks',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_axe_cleave.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_slash.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },

  // === GUARDIA DE ICESPEAR ===
  guardia_lanza: {
    mode: 'spear_thrust',
    shader: 'steel',
    particles: 'sparks',
    accentColor: '#60a5fa',
    spriteSrc: '/assets/combat/enemy_vfx_spear_thrust.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  guardia_espada: {
    mode: 'sword_slash',
    shader: 'steel',
    particles: 'sparks',
    accentColor: '#60a5fa',
    spriteSrc: '/assets/combat/kairon_vfx_tajo_acero.png',
    flipImgX: true,
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_slash.png',
  },
  guardia_ballesta: {
    mode: 'crossbow_bolt',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#d6d3d1',
    spriteSrc: '/assets/combat/enemy_vfx_pierce_bolt.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  guardia_pesado: {
    mode: 'hammer_slam',
    shader: 'steel',
    particles: 'dust',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/magordito_vfx_bonk.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },

  // === ORCOS ===
  orco_lanza: {
    mode: 'spear_thrust',
    shader: 'none',
    particles: 'blood',
    accentColor: '#84cc16',
    spriteSrc: '/assets/combat/enemy_vfx_spear_thrust.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  orco_hacha: {
    mode: 'axe_cleave',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#ea580c',
    spriteSrc: '/assets/combat/enemy_vfx_axe_cleave.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_corte.png',
    ultOnoSrc: '/assets/combat/edacorn_vfx_slash.png',
  },
  orco_caudillo: {
    mode: 'punch_slam',
    shader: 'crimson',
    particles: 'dust',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/magordito_vfx_bonk.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },

  // === GUARDIA NEGRA DE FERTON ===
  guarda_negro_espada: {
    mode: 'sword_slash',
    shader: 'gold',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/combat/enemy_vfx_ebony_sword.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_slash.png',
  },
  guarda_negro_alabarda: {
    mode: 'spear_thrust',
    shader: 'gold',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/combat/enemy_vfx_spear_thrust.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  guarda_negro_ballesta: {
    mode: 'crossbow_bolt',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/combat/enemy_vfx_pierce_bolt.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  guarda_negro_pesado: {
    mode: 'hammer_slam',
    shader: 'gold',
    particles: 'dust',
    accentColor: '#d97706',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/magordito_vfx_bonk.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },

  // === CAPATAZ HOBGOBLIN (3 FASES) ===
  hobgoblin_capataz_p1: {
    mode: 'hammer_slam',
    shader: 'gold',
    particles: 'dust',
    accentColor: '#f59e0b',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/magordito_vfx_bonk.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },
  hobgoblin_capataz_p2: {
    mode: 'grenade_throw',
    shader: 'fire',
    particles: 'fire',
    accentColor: '#ea580c',
    spriteSrc: '/assets/combat/enemy_vfx_alchemical_bomb.png',
    impactSrc: '/assets/combat/prometeo_vfx_bola.png',
    onoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },
  hobgoblin_capataz_p3: {
    mode: 'blunderbuss_shot',
    shader: 'fire',
    particles: 'fire',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/kairon_vfx_bullet.png',
    flipImgX: true,
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/kairon_vfx_bang.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },

  // === ARAKNOIDES Y JEFES DE CUEVAS ===
  araknoide_rojo: {
    mode: 'claw_swipe',
    shader: 'crimson',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_claw_slash.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_slash.png',
  },
  araknoide_voraz: {
    mode: 'fang_bite',
    shader: 'crimson',
    particles: 'blood',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_fang_bite.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_corte.png',
  },
  araknoide_espinoso: {
    mode: 'spine_shot',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#ea580c',
    spriteSrc: '/assets/combat/enemy_vfx_chitin_spines.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  araknoide_oviparo: {
    mode: 'acid_glob',
    shader: 'acid',
    particles: 'acid',
    accentColor: '#84cc16',
    spriteSrc: '/assets/combat/enemy_vfx_miasma_orb.png',
    impactSrc: '/assets/combat/edacorn_vfx_slosh.png',
  },
  araknoide_azul: {
    mode: 'ice_shard',
    shader: 'frost',
    particles: 'frost',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/combat/ragnavaldr_vfx_cuchillo_hielo.png',
    flipImgX: true,
    impactSrc: '/assets/combat/enemy_vfx_ice_web.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  araknoide_glacial: {
    mode: 'ice_lance',
    shader: 'frost',
    particles: 'frost',
    accentColor: '#0ea5e9',
    spriteSrc: '/assets/combat/ragnavaldr_vfx_lanza.png',
    flipImgX: true,
    impactSrc: '/assets/combat/ragnavaldr_vfx_escarcha.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  semiboss_zancudo: {
    mode: 'ceiling_impale',
    shader: 'void',
    particles: 'void',
    accentColor: '#a855f7',
    spriteSrc: '/assets/combat/enemy_vfx_spear_thrust.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/roxanne_vfx_tshk.png',
  },
  semiboss_melenudo: {
    mode: 'lightning_slam',
    shader: 'lightning',
    particles: 'lightning',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/combat/smurph_vfx_rayo.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/raxxar_vfx_zap.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },
  araknoide: {
    mode: 'void_orb',
    shader: 'void',
    particles: 'void',
    accentColor: '#c084fc',
    spriteSrc: '/assets/combat/enemy_vfx_miasma_orb.png',
    impactSrc: '/assets/combat/edacorn_vfx_slosh.png',
  },
  medusa: {
    mode: 'lightning_bolt',
    shader: 'lightning',
    particles: 'lightning',
    accentColor: '#22d3ee',
    spriteSrc: '/assets/combat/smurph_vfx_rayo.png',
    impactSrc: '/assets/combat/smurph_vfx_impacto.png',
    onoSrc: '/assets/combat/giovani_vfx_zap.png',
    ultOnoSrc: '/assets/combat/raxxar_vfx_zap.png',
  },
  devorador_quitinoso: {
    mode: 'scythe_slash',
    shader: 'crimson',
    particles: 'dust',
    accentColor: '#f97316',
    spriteSrc: '/assets/combat/enemy_vfx_claw_slash.png',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.png',
    onoSrc: '/assets/combat/edacorn_vfx_slash.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },
  devorador_quitinoso_p2: {
    mode: 'lifesteal_bite',
    shader: 'crimson',
    particles: 'lifesteal',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_fang_bite.png',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.png',
    onoSrc: '/assets/combat/edacorn_vfx_corte.png',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.png',
  },
  mineral_descarga: {
    mode: 'static_pulse',
    shader: 'lightning',
    particles: 'lightning',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/combat/smurph_vfx_impacto.png',
    impactSrc: '/assets/combat/smurph_vfx_impacto.png',
  },
};

function resolveEnemyProfile(attack: ActiveEnemyAttackVfxState): EnemyVfxProfile {
  const id = attack.enemyConfigId || '';
  if (id === 'hobgoblin_capataz') {
    const phase = attack.hobgoblinPhase ?? 1;
    return ENEMY_VFX_PROFILES[`hobgoblin_capataz_p${phase}`] || ENEMY_VFX_PROFILES.hobgoblin_capataz_p1;
  }
  if (id && ENEMY_VFX_PROFILES[id]) {
    return ENEMY_VFX_PROFILES[id];
  }
  switch (attack.vfxType) {
    case 'frost_blizzard':
      return ENEMY_VFX_PROFILES.araknoide_azul;
    case 'shadow_needle':
      return ENEMY_VFX_PROFILES.guardia_ballesta;
    case 'earth_titan':
      return ENEMY_VFX_PROFILES.guardia_pesado;
    case 'void_miasma':
      return ENEMY_VFX_PROFILES.araknoide_oviparo;
    case 'gorgon_lightning':
      return ENEMY_VFX_PROFILES.medusa;
    case 'crimson_claw':
    default:
      return ENEMY_VFX_PROFILES.araknoide_rojo;
  }
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
  shape?: 'circle' | 'spark' | 'diamond';
  gravity?: number;
  homingToEnemy?: boolean;
}

interface EnemySlashSpec {
  delayMs: number;
  leftPct: number;
  bottomPct: number;
  widthPx: number;
  rotateDeg: number;
  flipY?: boolean;
}

interface EnemyProjectileSpec {
  delayMs: number;
  startRightPct: number;
  startBottomPct: number;
  travelX: number;
  travelY: number;
  widthPx: number;
  aspect?: number;
  rotateDeg: number;
  durationMs?: number;
}

interface EnemyImpactSpec {
  delayMs: number;
  leftPct: number;
  bottomPct: number;
  sizePx: number;
  rotateDeg: number;
}

// Clean, focused slash timings (1 crisp slash normally, 2 on Ult)
const SLASH_SINGLE: readonly EnemySlashSpec[] = [
  { delayMs: 95, leftPct: 6, bottomPct: 20, widthPx: 172, rotateDeg: 6 },
];

const SLASH_DOUBLE: readonly EnemySlashSpec[] = [
  { delayMs: 85, leftPct: 5.5, bottomPct: 22, widthPx: 170, rotateDeg: 12 },
  { delayMs: 215, leftPct: 8, bottomPct: 19, widthPx: 184, rotateDeg: -16, flipY: true },
];

// Clean piercing spear thrusts
const SPEAR_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 90, startRightPct: 18, startBottomPct: 34, travelX: -214, travelY: 16, widthPx: 190, aspect: 0.44, rotateDeg: -4, durationMs: 280 },
];

const SPEAR_DOUBLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 80, startRightPct: 18, startBottomPct: 38, travelX: -214, travelY: 20, widthPx: 186, aspect: 0.44, rotateDeg: -7, durationMs: 265 },
  { delayMs: 205, startRightPct: 19, startBottomPct: 32, travelX: -222, travelY: 10, widthPx: 198, aspect: 0.44, rotateDeg: 2, durationMs: 265 },
];

// Clean normal arrows / crossbow bolts
const BOLT_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 85, startRightPct: 18, startBottomPct: 37, travelX: -228, travelY: 16, widthPx: 148, aspect: 0.4, rotateDeg: -4, durationMs: 280 },
];

const BOLT_VOLLEY: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startRightPct: 18, startBottomPct: 43, travelX: -226, travelY: 26, widthPx: 142, aspect: 0.4, rotateDeg: -8, durationMs: 270 },
  { delayMs: 165, startRightPct: 19, startBottomPct: 37, travelX: -232, travelY: 16, widthPx: 148, aspect: 0.4, rotateDeg: -3, durationMs: 270 },
  { delayMs: 260, startRightPct: 18, startBottomPct: 32, travelX: -236, travelY: 8, widthPx: 156, aspect: 0.4, rotateDeg: 2, durationMs: 270 },
];

// Slingshot pebble arcs
const STONE_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 85, startRightPct: 19, startBottomPct: 36, travelX: -226, travelY: 14, widthPx: 100, aspect: 0.66, rotateDeg: -4, durationMs: 340 },
];

const STONE_BARRAGE: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startRightPct: 18, startBottomPct: 41, travelX: -224, travelY: 22, widthPx: 90, aspect: 0.66, rotateDeg: -6, durationMs: 310 },
  { delayMs: 175, startRightPct: 20, startBottomPct: 34, travelX: -232, travelY: 10, widthPx: 98, aspect: 0.66, rotateDeg: 4, durationMs: 310 },
];

// Grenade arcs
const BOMB_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 85, startRightPct: 18, startBottomPct: 38, travelX: -228, travelY: 24, widthPx: 108, aspect: 0.68, rotateDeg: -6, durationMs: 370 },
];

const BOMB_ULT: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startRightPct: 17, startBottomPct: 41, travelX: -222, travelY: 28, widthPx: 104, aspect: 0.68, rotateDeg: -8, durationMs: 340 },
  { delayMs: 190, startRightPct: 19, startBottomPct: 35, travelX: -234, travelY: 18, widthPx: 114, aspect: 0.68, rotateDeg: 4, durationMs: 340 },
];

const BOLTS_NORMAL: readonly EnemyImpactSpec[] = [
  { delayMs: 105, leftPct: 10.5, bottomPct: 35, sizePx: 226, rotateDeg: 3 },
];

const BOLTS_ULT: readonly EnemyImpactSpec[] = [
  { delayMs: 85, leftPct: 10.5, bottomPct: 40, sizePx: 222, rotateDeg: 6 },
  { delayMs: 210, leftPct: 11, bottomPct: 34, sizePx: 240, rotateDeg: -3 },
];

export const EnemyAttackVfxOverlay: React.FC<EnemyAttackVfxOverlayProps> = ({
  activeAttack,
  enabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredSteps, setTriggeredSteps] = useState<number[]>([]);
  const [triggeredImpact, setTriggeredImpact] = useState<boolean>(false);
  const [triggeredOno, setTriggeredOno] = useState<boolean>(false);

  const isActive = Boolean(activeAttack) && enabled;
  const vfxKey = activeAttack?.vfxKey ?? 0;
  const isUlt = Boolean(activeAttack?.isUlt);
  const isSpecial = Boolean(activeAttack?.isSpecial);
  const dndDamageType = activeAttack?.dndDamageType ?? 'slashing';
  const profile = activeAttack ? resolveEnemyProfile(activeAttack) : null;

  // Keep guardia_ballesta incendiary bolt when skill is Saeta Incendiaria
  const isFireCrossbow =
    activeAttack?.enemyConfigId === 'guardia_ballesta' &&
    (dndDamageType === 'fire' || Boolean(activeAttack?.skillName?.toLowerCase().includes('incendiaria')));
  const effectiveShader: ShaderKey = isFireCrossbow ? 'fire' : profile?.shader ?? 'none';
  const effectiveParticles: ParticlePreset = isFireCrossbow ? 'fire' : profile?.particles ?? 'sparks';
  const effectiveAccent = isFireCrossbow ? '#f97316' : profile?.accentColor ?? activeAttack?.themeColor ?? '#ef4444';
  const filterUrl = FILTER_ID_MAP[effectiveShader];

  const getStepDelays = (): number[] => {
    if (!profile) return [];
    switch (profile.mode) {
      case 'sword_slash':
      case 'dagger_slash':
      case 'axe_cleave':
      case 'claw_swipe':
      case 'scythe_slash':
        return (isUlt ? SLASH_DOUBLE : SLASH_SINGLE).map((s) => s.delayMs);
      case 'spear_thrust':
        return (isUlt ? SPEAR_DOUBLE : SPEAR_SINGLE).map((p) => p.delayMs);
      case 'arrow_shot':
      case 'crossbow_bolt':
      case 'spine_shot':
      case 'ice_shard':
      case 'ice_lance':
      case 'shaman_wisp':
        return (isUlt || isSpecial ? BOLT_VOLLEY.slice(0, isUlt ? 3 : 2) : BOLT_SINGLE).map((p) => p.delayMs);
      case 'sling_stone':
        return (isSpecial ? STONE_BARRAGE : STONE_SINGLE).map((p) => p.delayMs);
      case 'grenade_throw':
        return (isUlt ? BOMB_ULT : BOMB_SINGLE).map((p) => p.delayMs);
      case 'blunderbuss_shot':
        return (isUlt ? BOLT_VOLLEY : BOLT_SINGLE).map((p) => p.delayMs);
      case 'lightning_bolt':
      case 'lightning_slam':
        return (isUlt ? BOLTS_ULT : BOLTS_NORMAL).map((b) => b.delayMs);
      case 'ceiling_impale':
        return isUlt ? [85, 205] : [95];
      case 'club_smash':
      case 'hammer_slam':
      case 'punch_slam':
      case 'fang_bite':
      case 'lifesteal_bite':
      case 'acid_glob':
      case 'void_orb':
      case 'static_pulse':
      default:
        return [90];
    }
  };

  useEffect(() => {
    setTriggeredSteps([]);
    setTriggeredImpact(false);
    setTriggeredOno(false);

    if (!isActive || !activeAttack || !profile) return;

    const timers: number[] = [];
    const delays = getStepDelays();
    delays.forEach((delay, idx) => {
      timers.push(
        window.setTimeout(() => {
          setTriggeredSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        }, delay)
      );
    });

    const impactDelay =
      profile.mode === 'grenade_throw' || profile.mode === 'sling_stone'
        ? isUlt
          ? 360
          : 315
        : isUlt
        ? 300
        : 245;

    timers.push(window.setTimeout(() => setTriggeredImpact(true), impactDelay));
    timers.push(window.setTimeout(() => setTriggeredOno(true), impactDelay + 35));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [activeAttack, vfxKey, isUlt, isSpecial]);

  // Lightweight, crisp 60fps Canvas Particle Engine (clean sparks/impact, no clutter)
  useEffect(() => {
    if (!isActive || !activeAttack || !profile) return;
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

    const heroX = width * 0.21;
    const heroY = height * 0.62;
    const enemyX = width * 0.77;
    const enemyY = height * 0.54;

    const particles: CanvasParticle[] = [];
    const count = isUlt ? 18 : 12;

    const paletteByPreset: Record<ParticlePreset, string[]> = {
      sparks: [effectiveAccent, '#fde68a', '#ffffff'],
      blood: ['#ef4444', '#fca5a5', '#dc2626'],
      dust: ['#d6d3d1', effectiveAccent, '#fef3c7'],
      splinters: ['#d97706', '#fde68a', '#92400e'],
      fire: ['#f97316', '#fde047', '#ef4444'],
      frost: ['#e0f2fe', '#38bdf8', '#bae6fd'],
      acid: ['#a3e635', '#bef264', '#84cc16'],
      void: ['#c084fc', '#a855f7', '#e9d5ff'],
      lightning: ['#e0f2fe', '#38bdf8', '#22d3ee'],
      lifesteal: ['#ef4444', '#fda4af', '#dc2626'],
    };

    const palette = paletteByPreset[effectiveParticles];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.4 + Math.random() * (isUlt ? 5.2 : 3.8);
      particles.push({
        x: heroX + (Math.random() - 0.5) * 34,
        y: heroY + (Math.random() - 0.5) * 38,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4,
        size: 1.9 + Math.random() * 2.2,
        life: -7 - Math.random() * 10,
        maxLife: 18 + Math.random() * 10,
        color: palette[i % palette.length],
        trail: effectiveParticles !== 'acid' && effectiveParticles !== 'dust',
        shape:
          effectiveParticles === 'frost' || effectiveParticles === 'dust'
            ? 'diamond'
            : effectiveParticles === 'acid'
            ? 'circle'
            : 'spark',
        gravity: effectiveParticles === 'acid' || effectiveParticles === 'fire' ? -0.04 : 0.14,
      });
    }

    // Crimson lifesteal motes returning from Hero -> Devorador P2
    if (effectiveParticles === 'lifesteal') {
      for (let i = 0; i < (isUlt ? 12 : 8); i++) {
        particles.push({
          x: heroX + (Math.random() - 0.5) * 20,
          y: heroY + (Math.random() - 0.5) * 20,
          vx: (enemyX - heroX) / 24,
          vy: (enemyY - heroY) / 24 - 1.2,
          size: 3.0 + Math.random() * 1.6,
          life: -9 - i * 1.4,
          maxLife: 25,
          color: i % 2 === 0 ? '#ef4444' : '#fda4af',
          trail: true,
          shape: 'circle',
          homingToEnemy: true,
        });
      }
    }

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = isUlt ? 860 : 760;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      // Clean single shockwave ring on impact
      const ringStart = 0.24;
      const ringSpan = 0.44;
      if (progress > ringStart && progress < ringStart + ringSpan) {
        const p = (progress - ringStart) / ringSpan;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(heroX, heroY + 60, 18 + p * 46, 6 + p * 14, 0, 0, Math.PI * 2);
        ctx.strokeStyle = effectiveAccent;
        ctx.globalAlpha = (1 - p) * 0.72;
        ctx.lineWidth = 2.4 * (1 - p * 0.4);
        ctx.shadowColor = effectiveAccent;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      // Clean lightning arc for Medusa / Melenudo
      if (effectiveParticles === 'lightning' && progress > 0.12 && progress < 0.62) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(enemyX - 18, enemyY - 10);
        const segs = 6;
        for (let s = 1; s < segs; s++) {
          const t = s / segs;
          const px = enemyX - 18 + (heroX - (enemyX - 18)) * t;
          const py =
            enemyY -
            10 +
            (heroY - (enemyY - 10)) * t +
            Math.sin(elapsed * 0.05 + s * 2.4) * 14;
          ctx.lineTo(px, py);
        }
        ctx.lineTo(heroX, heroY - 6);
        ctx.strokeStyle = '#e0f2fe';
        ctx.globalAlpha = Math.sin(((progress - 0.12) / 0.5) * Math.PI) * 0.8;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = effectiveAccent;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      for (const pt of particles) {
        pt.life += 1;
        if (pt.life < 0 || pt.life > pt.maxLife) continue;
        const prevX = pt.x;
        const prevY = pt.y;
        if (pt.homingToEnemy) {
          pt.vx += (enemyX - pt.x) * 0.008;
          pt.vy += (enemyY - pt.y) * 0.008;
        }
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.gravity && !pt.homingToEnemy) {
          pt.vy += pt.gravity;
        }

        const lifeFrac = pt.life / pt.maxLife;
        const pAlpha = Math.sin(lifeFrac * Math.PI);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, pAlpha * 0.9));
        ctx.strokeStyle = pt.color;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;

        if (pt.trail) {
          ctx.beginPath();
          ctx.moveTo(prevX - pt.vx * 1.2, prevY - pt.vy * 1.2);
          ctx.lineTo(pt.x, pt.y);
          ctx.lineWidth = pt.size * 0.6;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        if (pt.shape === 'diamond') {
          const r = pt.size * 0.9;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - r * 1.2);
          ctx.lineTo(pt.x + r * 0.72, pt.y);
          ctx.lineTo(pt.x, pt.y + r * 1.2);
          ctx.lineTo(pt.x - r * 0.72, pt.y);
          ctx.closePath();
          ctx.fill();
        } else if (pt.shape === 'spark') {
          const r = pt.size;
          ctx.beginPath();
          ctx.moveTo(pt.x - r, pt.y);
          ctx.lineTo(pt.x + r, pt.y);
          ctx.moveTo(pt.x, pt.y - r);
          ctx.lineTo(pt.x, pt.y + r);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
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
  }, [activeAttack, vfxKey, isUlt, effectiveAccent, effectiveParticles]);

  if (!isActive || !profile) return null;

  const isMode = (m: DeliveryMode) => profile.mode === m;
  const activeImpactSrc = profile.impactSrc ?? '/assets/combat/raxxar_vfx_impacto.png';
  const activeOnoSrc = isUlt ? profile.ultOnoSrc ?? profile.onoSrc : profile.onoSrc;

  const renderProjectileWave = (
    list: readonly EnemyProjectileSpec[],
    src: string,
    keyPrefix: string,
    opts?: { flipImgX?: boolean; keyframe?: string; spin?: boolean }
  ) =>
    triggeredSteps.map((idx) => {
      const p = list[idx];
      if (!p) return null;
      const dur = p.durationMs ?? 290;
      return (
        <div
          key={`${keyPrefix}-${vfxKey}-${idx}`}
          className="absolute pointer-events-none z-20 overflow-visible"
          style={
            {
              right: `${p.startRightPct}%`,
              bottom: `${p.startBottomPct}%`,
              width: `${p.widthPx}px`,
              height: `${Math.round(p.widthPx * (p.aspect ?? 0.44))}px`,
              '--tx': `${p.travelX}px`,
              '--ty': `${p.travelY}px`,
              animation: `${opts?.keyframe ?? 'enemyProjectileFlyLeft'} ${dur}ms cubic-bezier(0.16,0.9,0.28,1) forwards`,
            } as React.CSSProperties
          }
        >
          <img
            src={src}
            alt="Ataque Enemigo"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-contain ${opts?.spin ? 'animate-[enemySpinLob_0.34s_linear_infinite]' : ''}`}
            style={{
              transform: `rotate(${p.rotateDeg}deg)${opts?.flipImgX ? ' scaleX(-1)' : ''}`,
              filter: filterUrl,
            }}
          />
        </div>
      );
    });

  const renderSlashWave = (
    list: readonly EnemySlashSpec[],
    src: string,
    keyPrefix: string,
    flipImgX?: boolean
  ) =>
    triggeredSteps.map((idx) => {
      const s = list[idx];
      if (!s) return null;
      return (
        <div
          key={`${keyPrefix}-${vfxKey}-${idx}`}
          className="absolute flex items-center justify-center pointer-events-none z-20 overflow-visible"
          style={{
            left: `${s.leftPct}%`,
            bottom: `${s.bottomPct}%`,
            width: `${s.widthPx}px`,
            height: `${s.widthPx}px`,
            transform: `rotate(${s.rotateDeg}deg) ${s.flipY ? 'scaleY(-1)' : ''}`,
          }}
        >
          <img
            src={src}
            alt="Corte Enemigo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain animate-[enemyClawSlashSweep_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            style={{
              transform: flipImgX ? 'scaleX(-1)' : undefined,
              filter: filterUrl,
            }}
          />
        </div>
      );
    });

  const renderBoltWave = (list: readonly EnemyImpactSpec[], src: string, keyPrefix: string) =>
    triggeredSteps.map((idx) => {
      const b = list[idx];
      if (!b) return null;
      return (
        <div
          key={`${keyPrefix}-${vfxKey}-${idx}`}
          className="absolute pointer-events-none z-20 overflow-visible origin-right"
          style={{
            left: `${b.leftPct}%`,
            bottom: `${b.bottomPct}%`,
            width: `${b.sizePx}px`,
            height: '78px',
            transform: `rotate(${b.rotateDeg}deg)`,
          }}
        >
          <img
            src={src}
            alt="Descarga"
            referrerPolicy="no-referrer"
            className="w-full h-full object-fill origin-center animate-[enemyBoltSnapLeft_0.38s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            style={{ filter: filterUrl }}
          />
        </div>
      );
    });

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="enemy-vfx-crimson-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#ef4444" floodOpacity="0.9" />
          </filter>
          <filter id="enemy-vfx-steel-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#60a5fa" floodOpacity="0.9" />
          </filter>
          <filter id="enemy-vfx-gold-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#fbbf24" floodOpacity="0.92" />
          </filter>
          <filter id="enemy-vfx-goblin-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#84cc16" floodOpacity="0.9" />
          </filter>
          <filter id="enemy-vfx-fire-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#f97316" floodOpacity="0.94" />
          </filter>
          <filter id="enemy-vfx-frost-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#38bdf8" floodOpacity="0.94" />
          </filter>
          <filter id="enemy-vfx-acid-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#84cc16" floodOpacity="0.92" />
          </filter>
          <filter id="enemy-vfx-void-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#a855f7" floodOpacity="0.94" />
          </filter>
          <filter id="enemy-vfx-lightning-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#22d3ee" floodOpacity="0.95" />
          </filter>
        </defs>
      </svg>

      <div
        ref={containerRef}
        key={`enemy-vfx-${profile.mode}-${vfxKey}`}
        className="absolute inset-0 pointer-events-none z-[26] overflow-visible select-none"
      >
        <style>{`
          @keyframes enemyClawSlashSweep {
            0% { transform: translate(24px, -14px) scale(0.45); opacity: 0; }
            25% { transform: translate(-2px, 4px) scale(1.06); opacity: 1; }
            70% { transform: translate(-8px, 6px) scale(1.0); opacity: 0.92; }
            100% { transform: translate(-14px, 12px) scale(1.08); opacity: 0; }
          }

          @keyframes enemyProjectileFlyLeft {
            0% { transform: translate(0px, 0px) scale(0.78); opacity: 0; }
            16% { transform: translate(calc(var(--tx) * 0.24), calc(var(--ty) * 0.24)) scale(1.04); opacity: 1; }
            78% { transform: translate(var(--tx), var(--ty)) scale(1.06); opacity: 1; }
            100% { transform: translate(calc(var(--tx) - 14px), calc(var(--ty) + 4px)) scale(0.7); opacity: 0; }
          }

          @keyframes enemyArcLobLeft {
            0% { transform: translate(0px, 0px) scale(0.76); opacity: 0; }
            22% { transform: translate(calc(var(--tx) * 0.3), calc(var(--ty) * 0.1 - 52px)) scale(1.05); opacity: 1; }
            54% { transform: translate(calc(var(--tx) * 0.56), calc(var(--ty) * 0.45 - 70px)) scale(1.1); opacity: 1; }
            84% { transform: translate(var(--tx), var(--ty)) scale(1.04); opacity: 1; }
            100% { transform: translate(var(--tx), calc(var(--ty) + 8px)) scale(0.55); opacity: 0; }
          }

          @keyframes enemyOverheadSwingLeft {
            0% { transform: translate(38px, -42px) rotate(34deg) scale(0.8); opacity: 0; }
            28% { transform: translate(10px, -20px) rotate(10deg) scale(1.1); opacity: 1; }
            60% { transform: translate(-6px, 10px) rotate(-24deg) scale(1.12); opacity: 1; }
            100% { transform: translate(-16px, 18px) rotate(-34deg) scale(0.92); opacity: 0; }
          }

          @keyframes enemyCeilingPlunge {
            0% { transform: translate(18px, -88px) scale(0.82); opacity: 0; }
            30% { transform: translate(4px, -16px) scale(1.06); opacity: 1; }
            75% { transform: translate(-4px, 12px) scale(1.02); opacity: 0.92; }
            100% { transform: translate(-8px, 20px) scale(0.88); opacity: 0; }
          }

          @keyframes enemyFangClamp {
            0% { transform: scale(0.55); opacity: 0; }
            26% { transform: scale(1.18); opacity: 1; }
            52% { transform: scale(0.95); opacity: 1; }
            100% { transform: scale(1.08); opacity: 0; }
          }

          @keyframes enemySpinLob {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-360deg); }
          }

          @keyframes enemySlamBurstPop {
            0% { transform: scale(0.32) rotate(-8deg); opacity: 0; }
            26% { transform: scale(1.14) rotate(3deg); opacity: 1; }
            68% { transform: scale(1.0) rotate(6deg); opacity: 0.88; }
            100% { transform: scale(1.18) rotate(10deg); opacity: 0; }
          }

          @keyframes enemyBoltSnapLeft {
            0% { transform: scaleX(-0.15) scaleY(0.5); opacity: 0; }
            18% { transform: scaleX(-1.05) scaleY(1.1); opacity: 1; }
            58% { transform: scaleX(-1.0) scaleY(0.94); opacity: 0.94; }
            100% { transform: scaleX(-0.92) scaleY(0.35); opacity: 0; }
          }

          @keyframes enemyMuzzlePop {
            0% { transform: scale(0.35); opacity: 0; }
            25% { transform: scale(1.12); opacity: 1; }
            100% { transform: scale(1.2); opacity: 0; }
          }

          @keyframes enemyOnoPop {
            0% { transform: scale(0.32) rotate(8deg); opacity: 0; }
            28% { transform: scale(1.12) rotate(-4deg); opacity: 1; }
            56% { transform: scale(0.96) rotate(2deg); opacity: 1; }
            100% { transform: scale(1.08) rotate(-2deg); opacity: 0; }
          }
        `}</style>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* CORTES DE ESPADA / DAGA / GARRAS / GUADAÑAS */}
        {(isMode('sword_slash') ||
          isMode('dagger_slash') ||
          isMode('claw_swipe') ||
          isMode('scythe_slash')) &&
          renderSlashWave(isUlt ? SLASH_DOUBLE : SLASH_SINGLE, profile.spriteSrc, 'slash', profile.flipImgX)}

        {/* HACHAS (con arco descendente) */}
        {isMode('axe_cleave') &&
          triggeredSteps.map((idx) => (
            <div
              key={`axe-${vfxKey}-${idx}`}
              className="absolute left-[5.5%] bottom-[19%] w-[172px] h-[172px] pointer-events-none z-20 flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Hachazo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyOverheadSwingLeft_0.42s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* MAZAS Y GARROTES */}
        {(isMode('club_smash') || isMode('hammer_slam')) &&
          triggeredSteps.map((idx) => (
            <div
              key={`club-${vfxKey}-${idx}`}
              className="absolute left-[5%] bottom-[18%] w-[172px] h-[172px] pointer-events-none z-20 flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Golpe Contundente"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyOverheadSwingLeft_0.44s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* LANZAS PINCHANTES (Guardia Icespear, Guardia Negra Ferton, Orco Lanza) */}
        {isMode('spear_thrust') &&
          renderProjectileWave(
            isUlt ? SPEAR_DOUBLE : SPEAR_SINGLE,
            profile.spriteSrc,
            'spear'
          )}

        {/* FLECHAS Y VIROTES DE BALLESTA NORMALES (+ saeta incendiaria cuando aplica) */}
        {(isMode('arrow_shot') || isMode('crossbow_bolt')) &&
          renderProjectileWave(
            isUlt || isSpecial ? BOLT_VOLLEY.slice(0, isUlt ? 3 : 2) : BOLT_SINGLE,
            isFireCrossbow ? '/assets/combat/prometeo_vfx_fire_bolt.png' : profile.spriteSrc,
            'bolt',
            { flipImgX: isFireCrossbow }
          )}

        {/* TIRACHINAS / HONDA (Goblin Honda) */}
        {isMode('sling_stone') &&
          renderProjectileWave(
            isSpecial ? STONE_BARRAGE : STONE_SINGLE,
            profile.spriteSrc,
            'stone',
            { keyframe: 'enemyArcLobLeft', spin: true }
          )}

        {/* GRANADA ALQUÍMICA (Hobgoblin Fase 2) */}
        {isMode('grenade_throw') &&
          renderProjectileWave(
            isUlt ? BOMB_ULT : BOMB_SINGLE,
            profile.spriteSrc,
            'bomb',
            { keyframe: 'enemyArcLobLeft', spin: true }
          )}

        {/* TRABUCO (Hobgoblin Fase 3) */}
        {isMode('blunderbuss_shot') && (
          <>
            {triggeredSteps.includes(0) && (
              <div className="absolute right-[21%] bottom-[35%] w-[104px] h-[104px] pointer-events-none z-[22] flex items-center justify-center">
                <img
                  src="/assets/combat/kairon_vfx_muzzle.png"
                  alt="Fogonazo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyMuzzlePop_0.32s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ transform: 'scaleX(-1)', filter: filterUrl }}
                />
              </div>
            )}
            {renderProjectileWave(
              isUlt ? BOLT_VOLLEY : BOLT_SINGLE,
              isUlt ? '/assets/combat/prometeo_vfx_fire_bolt.png' : profile.spriteSrc,
              'trabuco',
              { flipImgX: true }
            )}
          </>
        )}

        {/* ESPINAS, HIELO, FUEGO FATUO, ÁCIDO Y ORBES */}
        {(isMode('spine_shot') ||
          isMode('ice_shard') ||
          isMode('ice_lance') ||
          isMode('shaman_wisp') ||
          isMode('acid_glob') ||
          isMode('void_orb')) &&
          renderProjectileWave(
            isUlt || isSpecial ? BOLT_VOLLEY.slice(0, isUlt ? 3 : 2) : BOLT_SINGLE,
            profile.spriteSrc,
            'proj',
            { flipImgX: profile.flipImgX }
          )}

        {/* MORDISCOS (Araknoide Voraz & Devorador P2) */}
        {(isMode('fang_bite') || isMode('lifesteal_bite')) &&
          triggeredSteps.map((idx) => (
            <div
              key={`bite-${vfxKey}-${idx}`}
              className="absolute left-[5.5%] bottom-[19%] w-[170px] h-[170px] pointer-events-none z-20 flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Mordisco"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyFangClamp_0.42s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* EMPALAMIENTO CENITAL (Zancudo) */}
        {isMode('ceiling_impale') &&
          triggeredSteps.map((idx) => (
            <div
              key={`zanc-${vfxKey}-${idx}`}
              className="absolute pointer-events-none z-20 flex items-center justify-center"
              style={{
                left: `${5.5 + idx * 3}%`,
                bottom: `${22 + idx * 3}%`,
                width: '170px',
                height: '120px',
              }}
            >
              <img
                src={profile.spriteSrc}
                alt="Empalamiento"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyCeilingPlunge_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ transform: 'rotate(-68deg)', filter: filterUrl }}
              />
            </div>
          ))}

        {/* RAYOS (Medusa y Titán Melenudo) */}
        {(isMode('lightning_bolt') || isMode('lightning_slam')) &&
          renderBoltWave(isUlt ? BOLTS_ULT : BOLTS_NORMAL, profile.spriteSrc, 'bolt')}

        {/* IMPACTO LIMPIO SOBRE EL HÉROE */}
        {triggeredImpact && (
          <div
            className="absolute left-[5.5%] bottom-[18%] pointer-events-none z-[22] flex items-center justify-center"
            style={{
              width: isUlt ? '164px' : '142px',
              height: isUlt ? '164px' : '142px',
            }}
          >
            <img
              src={activeImpactSrc}
              alt="Impacto"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain animate-[enemySlamBurstPop_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
              style={{ filter: filterUrl }}
            />
          </div>
        )}

        {/* ONOMATOPEYA DIRECTA (TSHK!, SLASH!, BONK!, BOOM!, BANG!, ZAP!) */}
        {triggeredOno && activeOnoSrc && (
          <div className="absolute left-[7.5%] bottom-[45%] w-[116px] h-[64px] pointer-events-none z-[25] flex items-center justify-center">
            <img
              src={activeOnoSrc}
              alt="Onomatopeya"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain animate-[enemyOnoPop_0.42s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
              style={{ filter: filterUrl }}
            />
          </div>
        )}
      </div>
    </>
  );
};
