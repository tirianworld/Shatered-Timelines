import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ENEMY_FRAME, type EnemyVfxFrame } from '../utils/enemyVfxFrame';

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
  /** Marco normalizado del enemigo activo: sirve para que los proyectiles nazcan en su arma. */
  enemyFrame?: EnemyVfxFrame;
}

type DeliveryMode =
  | 'sword_slash'
  | 'dagger_slash'
  | 'spear_thrust'
  | 'oviparo_dual_spears'
  | 'shield_bash'
  | 'spear_vanguard_ult'
  | 'shield_sword_ult'
  | 'mace_smash'
  | 'mace_judgment_ult'
  | 'warcry_roar'
  | 'arrow_shot'
  | 'crossbow_bolt'
  | 'sling_stone'
  | 'club_smash'
  | 'axe_cleave'
  | 'hammer_slam'
  | 'punch_slam'
  | 'shaman_wisp'
  | 'shaman_lightning'
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
  | 'static_pulse'
  | 'mist_breath';

type ShaderKey =
  | 'none'
  | 'crimson'
  | 'crimson_claw'
  | 'steel'
  | 'icespear_steel'
  | 'icespear_shield'
  | 'icespear_fire'
  | 'icespear_crimson'
  | 'icespear_roar'
  | 'frost_cryo'
  | 'abyssal_spear'
  | 'abyssal_void'
  | 'volt_slam'
  | 'venom_acid'
  | 'gold'
  | 'gold_slash'
  | 'goblin'
  | 'shaman_lightning'
  | 'fire'
  | 'frost'
  | 'acid'
  | 'void'
  | 'lightning'
  | 'crimson_ono_tint';

type ParticlePreset =
  | 'sparks'
  | 'icespear_cyan'
  | 'icespear_shield'
  | 'icespear_roar'
  | 'blood'
  | 'dust'
  | 'splinters'
  | 'fire'
  | 'frost'
  | 'acid'
  | 'void'
  | 'lightning'
  | 'shaman_lightning'
  | 'lifesteal';

interface EnemyVfxProfile {
  mode: DeliveryMode;
  shader: ShaderKey;
  particles: ParticlePreset;
  accentColor: string;
  spriteSrc: string;
  secondarySpriteSrc?: string;
  flipImgX?: boolean;
  onoSrc?: string;
  ultOnoSrc?: string;
  onoGlowColor?: 'cyan' | 'crimson' | 'gold' | 'purple' | 'crimson_tint';
  impactSrc?: string;
  alwaysDoubleSlash?: boolean;
  alwaysDualOno?: boolean;
  energyGlint?: boolean;
}

const FILTER_ID_MAP: Record<ShaderKey, string | undefined> = {
  none: undefined,
  crimson: 'url(#enemy-vfx-crimson-shader)',
  crimson_claw: 'url(#enemy-vfx-crimson-claw-shader)',
  steel: 'url(#enemy-vfx-steel-shader)',
  icespear_steel: 'url(#enemy-vfx-icespear-steel-shader)',
  icespear_shield: 'url(#enemy-vfx-icespear-shield-shader)',
  icespear_fire: 'url(#enemy-vfx-icespear-fire-shader)',
  icespear_crimson: 'url(#enemy-vfx-icespear-crimson-shader)',
  icespear_roar: 'url(#enemy-vfx-icespear-roar-shader)',
  frost_cryo: 'url(#enemy-vfx-frost-cryo-shader)',
  abyssal_spear: 'url(#enemy-vfx-abyssal-spear-shader)',
  abyssal_void: 'url(#enemy-vfx-abyssal-void-shader)',
  volt_slam: 'url(#enemy-vfx-volt-slam-shader)',
  venom_acid: 'url(#enemy-vfx-venom-acid-shader)',
  gold: 'url(#enemy-vfx-gold-shader)',
  gold_slash: 'url(#enemy-vfx-gold-slash-shader)',
  goblin: 'url(#enemy-vfx-goblin-shader)',
  shaman_lightning: 'url(#enemy-vfx-shaman-lightning-shader)',
  fire: 'url(#enemy-vfx-fire-shader)',
  frost: 'url(#enemy-vfx-frost-shader)',
  acid: 'url(#enemy-vfx-acid-shader)',
  void: 'url(#enemy-vfx-void-shader)',
  lightning: 'url(#enemy-vfx-lightning-shader)',
  crimson_ono_tint: 'url(#enemy-vfx-crimson-ono-tint-shader)',
};

const ENEMY_VFX_PROFILES: Record<string, EnemyVfxProfile> = {
  // === GOBLINS ===
  goblin_daga: {
    mode: 'dagger_slash',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#84cc16',
    spriteSrc: '/assets/combat/enemy_vfx_goblin_tajo.webp',
    flipImgX: true,
    onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
    ultOnoSrc: '/assets/combat/enemy_ono_shlink.webp',
    alwaysDoubleSlash: true,
    alwaysDualOno: true,
  },
  goblin_honda: {
    mode: 'sling_stone',
    shader: 'none',
    particles: 'dust',
    accentColor: '#a8a29e',
    spriteSrc: '/assets/combat/enemy_vfx_sling_stone.webp',
    onoSrc: '/assets/combat/guardia_ono_crack.webp',
  },
  goblin_garrote: {
    mode: 'club_smash',
    shader: 'none',
    particles: 'splinters',
    accentColor: '#d97706',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.webp',
    onoSrc: '/assets/combat/magordito_vfx_bonk.webp',
  },
  goblin_chaman: {
    mode: 'shaman_lightning',
    shader: 'shaman_lightning',
    particles: 'shaman_lightning',
    accentColor: '#34d399',
    spriteSrc: '/assets/combat/enemy_vfx_chaman_rayo.webp',
  },

  // === BANDIDOS ===
  bandido_daga: {
    mode: 'dagger_slash',
    shader: 'crimson',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_dagger_slash.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
    ultOnoSrc: '/assets/combat/roxanne_vfx_tshk.webp',
  },
  bandido_tirador: {
    mode: 'arrow_shot',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#f59e0b',
    spriteSrc: '/assets/combat/enemy_vfx_flecha_simple.webp',
    onoSrc: '/assets/combat/enemy_ono_twang.webp',
  },
  bandido_lider: {
    mode: 'axe_cleave',
    shader: 'crimson',
    particles: 'sparks',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_axe_cleave.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },

  // === GUARDIA DE ICESPEAR (M2: Robo no tan Justo) ===
  guardia_lanza: {
    mode: 'spear_thrust',
    shader: 'none',
    particles: 'icespear_cyan',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/aistudio/image_4437a419.webp',
    onoSrc: '/assets/combat/enemy_ono_shk.webp',
  },
  guardia_espada: {
    mode: 'sword_slash',
    shader: 'none',
    particles: 'icespear_cyan',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/aistudio/image_ddc0d845.webp',
    flipImgX: true,
    onoSrc: '/assets/combat/arlem_vfx_slash.webp',
  },
  guardia_ballesta: {
    mode: 'crossbow_bolt',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#94a3b8',
    spriteSrc: '/assets/combat/enemy_vfx_flecha_simple.webp',
    onoSrc: '/assets/combat/enemy_ono_twang.webp',
  },
  guardia_pesado: {
    mode: 'mace_smash',
    shader: 'icespear_crimson',
    particles: 'dust',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/guardia_vfx_maza_aplastar.webp',
    secondarySpriteSrc: '/assets/combat/guardia_vfx_rugido_onda.webp',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
    onoSrc: '/assets/combat/guardia_ono_crack.webp',
    ultOnoSrc: '/assets/combat/guardia_ono_roar.webp',
    onoGlowColor: 'crimson',
  },

  // === ORCOS ===
  orco_lanza: {
    mode: 'spear_thrust',
    shader: 'none',
    particles: 'blood',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/aistudio/image_4437a419.webp',
    onoSrc: '/assets/combat/enemy_ono_shk.webp',
  },
  orco_hacha: {
    mode: 'axe_cleave',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#ea580c',
    spriteSrc: '/assets/combat/enemy_vfx_axe_cleave.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/edacorn_vfx_corte.webp',
    ultOnoSrc: '/assets/combat/edacorn_vfx_slash.webp',
  },
  orco_caudillo: {
    mode: 'punch_slam',
    shader: 'crimson',
    particles: 'dust',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
    onoSrc: '/assets/combat/magordito_vfx_bonk.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },

  // === GUARDIA ÁUREA ===
  guarda_negro_espada: {
    mode: 'sword_slash',
    shader: 'gold_slash',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/aistudio/image_ddc0d845.webp',
    flipImgX: true,
    onoSrc: '/assets/combat/arlem_vfx_slash_gold.webp',
  },
  guarda_negro_alabarda: {
    mode: 'spear_thrust',
    shader: 'gold_slash',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/aistudio/image_4437a419.webp',
    onoSrc: '/assets/combat/enemy_ono_shk.webp',
  },
  guarda_negro_ballesta: {
    mode: 'crossbow_bolt',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#94a3b8',
    spriteSrc: '/assets/combat/enemy_vfx_flecha_simple.webp',
    onoSrc: '/assets/combat/enemy_ono_twang.webp',
  },
  guarda_negro_pesado: {
    mode: 'hammer_slam',
    shader: 'gold',
    particles: 'dust',
    accentColor: '#d97706',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.webp',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
    onoSrc: '/assets/combat/magordito_vfx_bonk.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },

  // === CAPATAZ HOBGOBLIN (3 FASES) ===
  hobgoblin_capataz_p1: {
    mode: 'hammer_slam',
    shader: 'gold',
    particles: 'dust',
    accentColor: '#f59e0b',
    spriteSrc: '/assets/combat/enemy_vfx_spiked_club.webp',
    impactSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
    onoSrc: '/assets/combat/magordito_vfx_bonk.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },
  hobgoblin_capataz_p2: {
    mode: 'grenade_throw',
    shader: 'fire',
    particles: 'fire',
    accentColor: '#ea580c',
    spriteSrc: '/assets/combat/enemy_vfx_alchemical_bomb.webp',
    impactSrc: '/assets/combat/prometeo_vfx_bola.webp',
    onoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },
  hobgoblin_capataz_p3: {
    mode: 'blunderbuss_shot',
    shader: 'fire',
    particles: 'fire',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/kairon_vfx_bullet.webp',
    flipImgX: true,
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/kairon_vfx_bang.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },

  // === ARAKNOIDES Y JEFES DE CUEVAS ===
  araknoide_rojo: {
    mode: 'claw_swipe',
    shader: 'crimson_claw',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_claw_slash.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
    onoGlowColor: 'crimson',
    energyGlint: true,
  },
  araknoide_voraz: {
    mode: 'sword_slash',
    shader: 'none',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_voraz_corte_espada.webp',
    flipImgX: true,
    onoSrc: '/assets/combat/enemy_ono_chack.webp',
    ultOnoSrc: '/assets/combat/enemy_ono_scrook.webp',
    alwaysDoubleSlash: true,
    onoGlowColor: 'crimson',
    energyGlint: true,
  },
  araknoide_espinoso: {
    mode: 'punch_slam',
    shader: 'crimson_claw',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_espinoso_web.webp',
    impactSrc: '/assets/combat/enemy_vfx_espinoso_web.webp',
    onoSrc: '/assets/combat/enemy_ono_crash.webp',
    ultOnoSrc: '/assets/combat/enemy_ono_crosh.webp',
    alwaysDualOno: true,
    onoGlowColor: 'crimson',
    energyGlint: true,
  },
  araknoide_oviparo: {
    mode: 'oviparo_dual_spears',
    shader: 'none',
    particles: 'blood',
    accentColor: '#ef4444',
    spriteSrc: '/assets/combat/enemy_vfx_oviparo_lanza.webp',
    onoSrc: '/assets/combat/enemy_ono_shk.webp',
    ultOnoSrc: '/assets/combat/enemy_ono_shlink.webp',
    onoGlowColor: 'crimson_tint',
    energyGlint: true,
  },
  // === HOGGOBLINS ENCAPUCHADOS (Callejón de Ferton) ===
  hoggoblin_encapuchado_daga: {
    mode: 'sword_slash',
    shader: 'gold_slash',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/aistudio/image_ddc0d845.webp',
    flipImgX: true,
    onoSrc: '/assets/combat/arlem_vfx_slash_gold.webp',
    ultOnoSrc: '/assets/combat/edacorn_vfx_slosh.webp',
    alwaysDoubleSlash: true,
    alwaysDualOno: true,
    onoGlowColor: 'gold',
  },
  hoggoblin_encapuchado_ballesta: {
    mode: 'crossbow_bolt',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/combat/enemy_vfx_flecha_simple.webp',
    onoSrc: '/assets/combat/enemy_ono_twang.webp',
  },
  // === BUGBEAR CRIADO (Recibidor Mansión Ferton) ===
  bugbear_criado: {
    mode: 'punch_slam',
    shader: 'gold',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/combat/bugbear_vfx_bandeja.webp',
    onoSrc: '/assets/combat/bugbear_ono_bonk.webp',
    ultOnoSrc: '/assets/combat/bugbear_ono_swiing.webp',
    onoGlowColor: 'gold',
    energyGlint: true,
  },
  // === DURNIK (Guardaespaldas de Ferton - Escaleras) ===
  durnik_guardaespaldas: {
    mode: 'hammer_slam',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#fbbf24',
    spriteSrc: '/assets/combat/durnik_vfx_martillo.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/durnik_ono_krak.webp',
    ultOnoSrc: '/assets/combat/durnik_ono_bamm.webp',
    onoGlowColor: 'gold',
    energyGlint: true,
  },
  // === GORGON DE HIERRO (Capítulo V - Primera Cámara) ===
  gorgon_metal: {
    mode: 'spear_thrust',
    shader: 'none',
    particles: 'sparks',
    accentColor: '#10b981',
    spriteSrc: '/assets/combat/gorgon_vfx_lanza.webp',
    onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
    ultOnoSrc: '/assets/combat/edacorn_vfx_slosh.webp',
    alwaysDualOno: true,
    onoGlowColor: 'cyan',
    energyGlint: true,
  },
  araknoide_azul: {
    mode: 'ice_shard',
    shader: 'frost_cryo',
    particles: 'frost',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/combat/enemy_vfx_azul_web_ball.webp',
    flipImgX: true,
    impactSrc: '/assets/combat/enemy_vfx_ice_web.webp',
    onoSrc: '/assets/combat/enemy_ono_azul_splat.webp',
    ultOnoSrc: '/assets/combat/guardia_ono_crack.webp',
    onoGlowColor: 'cyan',
    energyGlint: true,
  },
  araknoide_glacial: {
    mode: 'sword_slash',
    shader: 'frost_cryo',
    particles: 'frost',
    accentColor: '#0ea5e9',
    spriteSrc: '/assets/combat/enemy_vfx_glacial_slash.webp',
    flipImgX: true,
    impactSrc: '/assets/combat/enemy_vfx_glacial_slash.webp',
    onoSrc: '/assets/combat/enemy_ono_glacial_slash.webp',
    ultOnoSrc: '/assets/combat/enemy_ono_glacial_shlink.webp',
    alwaysDoubleSlash: true,
    alwaysDualOno: true,
    onoGlowColor: 'cyan',
    energyGlint: true,
  },
  semiboss_zancudo: {
    mode: 'ceiling_impale',
    shader: 'abyssal_spear',
    particles: 'void',
    accentColor: '#a855f7',
    spriteSrc: '/assets/combat/enemy_vfx_spear_thrust.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/enemy_ono_shk.webp',
    ultOnoSrc: '/assets/combat/enemy_ono_shlink.webp',
    onoGlowColor: 'purple',
    energyGlint: true,
  },
  semiboss_melenudo: {
    mode: 'punch_slam',
    shader: 'icespear_fire',
    particles: 'dust',
    accentColor: '#f59e0b',
    spriteSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
    impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
    onoSrc: '/assets/combat/guardia_ono_crack.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
    onoGlowColor: 'gold',
    energyGlint: true,
  },
  araknoide: {
    mode: 'fang_bite',
    shader: 'abyssal_void',
    particles: 'void',
    accentColor: '#c084fc',
    spriteSrc: '/assets/combat/enemy_vfx_fang_bite.webp',
    impactSrc: '/assets/combat/edacorn_vfx_slosh.webp',
    onoSrc: '/assets/combat/guardia_ono_crack.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
    onoGlowColor: 'purple',
    energyGlint: true,
  },
  medusa: {
    mode: 'lightning_bolt',
    shader: 'lightning',
    particles: 'lightning',
    accentColor: '#22d3ee',
    spriteSrc: '/assets/combat/smurph_vfx_rayo.webp',
    impactSrc: '/assets/combat/smurph_vfx_impacto.webp',
    onoSrc: '/assets/combat/giovani_vfx_zap.webp',
    ultOnoSrc: '/assets/combat/raxxar_vfx_zap.webp',
  },
  devorador_quitinoso: {
    mode: 'scythe_slash',
    shader: 'fire',
    particles: 'dust',
    accentColor: '#f97316',
    spriteSrc: '/assets/combat/enemy_vfx_devorador_slash.webp',
    onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
  },
  devorador_quitinoso_p2: {
    mode: 'lifesteal_bite',
    shader: 'crimson',
    particles: 'lifesteal',
    accentColor: '#dc2626',
    spriteSrc: '/assets/combat/enemy_vfx_devorador_mordisco.webp',
    onoSrc: '/assets/combat/guardia_ono_crack.webp',
    ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
    onoGlowColor: 'crimson',
  },
  mineral_descarga: {
    mode: 'static_pulse',
    shader: 'lightning',
    particles: 'lightning',
    accentColor: '#38bdf8',
    spriteSrc: '/assets/combat/smurph_vfx_impacto.webp',
    impactSrc: '/assets/combat/smurph_vfx_impacto.webp',
  },
};

function resolveEnemyProfile(attack: ActiveEnemyAttackVfxState): EnemyVfxProfile {
  const id = attack.enemyConfigId || '';
  const skillLower = (attack.skillName || '').toLowerCase();
  const isUlt = Boolean(attack.isUlt);
  const isSpecial = Boolean(attack.isSpecial);
  const dmgType = attack.dndDamageType || '';

  // Clean skill routing for Icespear Guard Knights (Capítulo I - Robo no tan Justo)
  if (id === 'guardia_lanza') {
    return ENEMY_VFX_PROFILES.guardia_lanza;
  }

  if (id === 'guardia_espada') {
    return ENEMY_VFX_PROFILES.guardia_espada;
  }

  if (id === 'guardia_ballesta') {
    return ENEMY_VFX_PROFILES.guardia_ballesta;
  }

  if (id === 'guardia_pesado') {
    if (isUlt || skillLower.includes('juicio')) {
      return {
        ...ENEMY_VFX_PROFILES.guardia_pesado,
        mode: 'mace_judgment_ult',
        shader: 'icespear_crimson',
        particles: 'icespear_roar',
        accentColor: '#ef4444',
        onoSrc: '/assets/combat/guardia_ono_roar.webp',
        ultOnoSrc: '/assets/combat/guardia_ono_crack.webp',
        onoGlowColor: 'crimson',
      };
    }
    if (isSpecial || dmgType === 'thunder' || skillLower.includes('rugido')) {
      return {
        ...ENEMY_VFX_PROFILES.guardia_pesado,
        mode: 'warcry_roar',
        shader: 'icespear_roar',
        particles: 'icespear_roar',
        accentColor: '#f43f5e',
        spriteSrc: '/assets/combat/guardia_vfx_rugido_onda.webp',
        impactSrc: '/assets/combat/guardia_vfx_rugido_onda.webp',
        onoSrc: '/assets/combat/guardia_ono_roar.webp',
        onoGlowColor: 'crimson',
      };
    }
    return ENEMY_VFX_PROFILES.guardia_pesado;
  }

  // Per-skill routing for Cuevas Arácnidas & Semibosses
  if (id === 'araknoide_rojo') {
    if (isUlt || skillLower.includes('embestida')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_rojo,
        mode: 'claw_swipe',
        shader: 'crimson_claw',
        particles: 'blood',
        accentColor: '#ef4444',
        impactSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
        onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
        ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
        onoGlowColor: 'crimson',
        energyGlint: true,
      };
    }
    if (isSpecial || skillLower.includes('furia')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_rojo,
        mode: 'fang_bite',
        shader: 'crimson_claw',
        particles: 'blood',
        accentColor: '#dc2626',
        spriteSrc: '/assets/combat/enemy_vfx_fang_bite.webp',
        impactSrc: '/assets/combat/raxxar_vfx_impacto.webp',
        onoSrc: '/assets/combat/edacorn_vfx_corte.webp',
        ultOnoSrc: '/assets/combat/guardia_ono_crack.webp',
        alwaysDualOno: true,
        onoGlowColor: 'crimson',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.araknoide_rojo;
  }

  if (id === 'araknoide_azul') {
    if (isUlt || skillLower.includes('ventisca')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_azul,
        mode: 'ice_lance',
        shader: 'frost_cryo',
        particles: 'frost',
        accentColor: '#38bdf8',
        spriteSrc: '/assets/combat/ragnavaldr_vfx_lanza.webp',
        flipImgX: true,
        impactSrc: '/assets/combat/enemy_vfx_ice_web.webp',
        onoSrc: '/assets/combat/enemy_ono_shlink.webp',
        ultOnoSrc: '/assets/combat/guardia_ono_crack.webp',
        onoGlowColor: 'cyan',
        energyGlint: true,
      };
    }
    if (isSpecial || skillLower.includes('seda')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_azul,
        mode: 'ice_shard',
        shader: 'frost_cryo',
        particles: 'frost',
        accentColor: '#38bdf8',
        spriteSrc: '/assets/combat/ragnavaldr_vfx_cuchillo_hielo.webp',
        flipImgX: true,
        impactSrc: '/assets/combat/enemy_vfx_ice_web.webp',
        onoSrc: '/assets/combat/roxanne_vfx_tshk.webp',
        onoGlowColor: 'cyan',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.araknoide_azul;
  }

  if (id === 'semiboss_zancudo') {
    if (isUlt || skillLower.includes('danza')) {
      return {
        ...ENEMY_VFX_PROFILES.semiboss_zancudo,
        mode: 'ceiling_impale',
        shader: 'abyssal_spear',
        particles: 'void',
        accentColor: '#c084fc',
        spriteSrc: '/assets/combat/enemy_vfx_spear_thrust.webp',
        impactSrc: '/assets/combat/enemy_vfx_ice_web.webp',
        onoSrc: '/assets/combat/enemy_ono_shlink.webp',
        ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
        onoGlowColor: 'purple',
        energyGlint: true,
      };
    }
    if (isSpecial || dmgType === 'necrotic' || skillLower.includes('umbr')) {
      return {
        ...ENEMY_VFX_PROFILES.semiboss_zancudo,
        mode: 'spine_shot',
        shader: 'abyssal_spear',
        particles: 'void',
        accentColor: '#a855f7',
        spriteSrc: '/assets/combat/enemy_vfx_chitin_spines.webp',
        impactSrc: '/assets/combat/enemy_vfx_ice_web.webp',
        onoSrc: '/assets/combat/roxanne_vfx_tshk.webp',
        onoGlowColor: 'purple',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.semiboss_zancudo;
  }

  if (id === 'semiboss_melenudo') {
    if (isUlt || skillLower.includes('cataclismo')) {
      return {
        ...ENEMY_VFX_PROFILES.semiboss_melenudo,
        mode: 'lightning_slam',
        shader: 'volt_slam',
        particles: 'lightning',
        accentColor: '#38bdf8',
        spriteSrc: '/assets/combat/smurph_vfx_rayo.webp',
        impactSrc: '/assets/combat/enemy_vfx_slam_crush.webp',
        onoSrc: '/assets/combat/raxxar_vfx_zap.webp',
        ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
        onoGlowColor: 'cyan',
        energyGlint: true,
      };
    }
    if (isSpecial || dmgType === 'thunder' || skillLower.includes('rugido')) {
      return {
        ...ENEMY_VFX_PROFILES.semiboss_melenudo,
        mode: 'warcry_roar',
        shader: 'volt_slam',
        particles: 'lightning',
        accentColor: '#38bdf8',
        spriteSrc: '/assets/combat/guardia_vfx_rugido_onda.webp',
        impactSrc: '/assets/combat/smurph_vfx_impacto.webp',
        onoSrc: '/assets/combat/guardia_ono_roar.webp',
        ultOnoSrc: '/assets/combat/raxxar_vfx_zap.webp',
        alwaysDualOno: true,
        onoGlowColor: 'cyan',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.semiboss_melenudo;
  }

  if (id === 'araknoide') {
    if (isUlt || skillLower.includes('arachne') || skillLower.includes('void')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide,
        mode: 'void_orb',
        shader: 'abyssal_void',
        particles: 'void',
        accentColor: '#c084fc',
        spriteSrc: '/assets/combat/enemy_vfx_miasma_orb.webp',
        impactSrc: '/assets/combat/enemy_vfx_ice_web.webp',
        onoSrc: '/assets/combat/edacorn_vfx_slash.webp',
        ultOnoSrc: '/assets/combat/prometeo_vfx_boom.webp',
        onoGlowColor: 'purple',
        energyGlint: true,
      };
    }
    if (isSpecial || dmgType === 'acid' || skillLower.includes('escupitajo')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide,
        mode: 'acid_glob',
        shader: 'venom_acid',
        particles: 'acid',
        accentColor: '#a3e635',
        spriteSrc: '/assets/combat/enemy_vfx_miasma_orb.webp',
        impactSrc: '/assets/combat/edacorn_vfx_slosh.webp',
        onoSrc: '/assets/combat/roxanne_vfx_tshk.webp',
        onoGlowColor: 'purple',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.araknoide;
  }

  if (id === 'araknoide_voraz') {
    if (isUlt || skillLower.includes('tajo brutal') || skillLower.includes('dentellada')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_voraz,
        mode: 'sword_slash',
        onoSrc: '/assets/combat/enemy_ono_chack.webp',
        ultOnoSrc: '/assets/combat/enemy_ono_scrook.webp',
        alwaysDoubleSlash: true,
        alwaysDualOno: true,
        onoGlowColor: 'crimson',
        energyGlint: true,
      };
    }
    if (isSpecial || skillLower.includes('pinzazo') || skillLower.includes('fest')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_voraz,
        mode: 'sword_slash',
        onoSrc: '/assets/combat/enemy_ono_screeck.webp',
        ultOnoSrc: '/assets/combat/enemy_ono_scrook.webp',
        alwaysDoubleSlash: true,
        alwaysDualOno: true,
        onoGlowColor: 'crimson',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.araknoide_voraz;
  }

  if (id === 'araknoide_espinoso') {
    return ENEMY_VFX_PROFILES.araknoide_espinoso;
  }

  if (id === 'araknoide_oviparo') {
    if (isUlt || skillLower.includes('lluvia') || skillLower.includes('rafaga') || skillLower.includes('ráfaga')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_oviparo,
        mode: 'oviparo_dual_spears',
        onoSrc: '/assets/combat/enemy_ono_shk.webp',
        ultOnoSrc: '/assets/combat/enemy_ono_shlink.webp',
        alwaysDualOno: true,
        onoGlowColor: 'crimson_tint',
      };
    }
    if (isSpecial || skillLower.includes('doble') || skillLower.includes('punzada')) {
      return {
        ...ENEMY_VFX_PROFILES.araknoide_oviparo,
        mode: 'oviparo_dual_spears',
        onoSrc: '/assets/combat/enemy_ono_shk.webp',
        ultOnoSrc: '/assets/combat/enemy_ono_shlink.webp',
        alwaysDualOno: true,
        onoGlowColor: 'crimson_tint',
      };
    }
    return ENEMY_VFX_PROFILES.araknoide_oviparo;
  }

  if (id === 'devorador_quitinoso_p2') {
    return ENEMY_VFX_PROFILES.devorador_quitinoso_p2;
  }

  if (id === 'bugbear_criado') {
    if (
      !isUlt &&
      (isSpecial ||
        skillLower.includes('lanz') ||
        skillLower.includes('vajilla') ||
        skillLower.includes('objeto'))
    ) {
      return {
        ...ENEMY_VFX_PROFILES.bugbear_criado,
        mode: 'grenade_throw',
        shader: 'gold',
        particles: 'sparks',
        accentColor: '#38bdf8',
        spriteSrc: '/assets/combat/bugbear_vfx_objetos.webp',
        onoSrc: '/assets/combat/bugbear_ono_swiing.webp',
        ultOnoSrc: undefined,
        onoGlowColor: 'cyan',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.bugbear_criado;
  }

  if (id === 'durnik_guardaespaldas') {
    if (isUlt || skillLower.includes('juicio') || skillLower.includes('aplastamiento')) {
      return {
        ...ENEMY_VFX_PROFILES.durnik_guardaespaldas,
        mode: 'mace_judgment_ult',
        shader: 'gold',
        particles: 'sparks',
        accentColor: '#f59e0b',
        spriteSrc: '/assets/combat/durnik_vfx_martillo.webp',
        secondarySpriteSrc: '/assets/combat/guardia_vfx_rugido_onda.webp',
        onoSrc: '/assets/combat/durnik_ono_bamm.webp',
        ultOnoSrc: '/assets/combat/durnik_ono_krak.webp',
        onoGlowColor: 'gold',
        energyGlint: true,
      };
    }
    if (isSpecial || dmgType === 'thunder' || skillLower.includes('bramido') || skillLower.includes('choque')) {
      return {
        ...ENEMY_VFX_PROFILES.durnik_guardaespaldas,
        mode: 'warcry_roar',
        shader: 'gold',
        particles: 'dust',
        accentColor: '#fbbf24',
        spriteSrc: '/assets/combat/guardia_vfx_rugido_onda.webp',
        impactSrc: '/assets/combat/durnik_vfx_martillo.webp',
        onoSrc: '/assets/combat/durnik_ono_bamm.webp',
        onoGlowColor: 'gold',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.durnik_guardaespaldas;
  }

  if (id === 'gorgon_metal') {
    if (
      !isUlt &&
      (skillLower.includes('aliento') ||
        skillLower.includes('niebla') ||
        skillLower.includes('petrific') ||
        dmgType === 'poison' ||
        isSpecial)
    ) {
      return {
        ...ENEMY_VFX_PROFILES.gorgon_metal,
        mode: 'mist_breath',
        shader: 'none',
        particles: 'acid',
        accentColor: '#34d399',
        spriteSrc: '/assets/combat/gorgon_vfx_niebla.webp',
        impactSrc: '/assets/combat/gorgon_vfx_niebla.webp',
        onoSrc: '/assets/combat/gorgon_ono_shhhhh.webp',
        ultOnoSrc: undefined,
        alwaysDualOno: false,
        onoGlowColor: 'cyan',
        energyGlint: true,
      };
    }
    return ENEMY_VFX_PROFILES.gorgon_metal;
  }

  if (id === 'hobgoblin_capataz') {
    const phase = attack.hobgoblinPhase ?? 1;
    return ENEMY_VFX_PROFILES[`hobgoblin_capataz_p${phase}`] || ENEMY_VFX_PROFILES.hobgoblin_capataz_p1;
  }
  if (id === 'guarda_aurea_borracho_espada') return ENEMY_VFX_PROFILES.guarda_negro_espada;
  if (id === 'guarda_aurea_borracho_alabarda') return ENEMY_VFX_PROFILES.guarda_negro_alabarda;
  if (id === 'guarda_aurea_borracho_pesado') return ENEMY_VFX_PROFILES.guarda_negro_pesado;
  if (id === 'hoggoblin_tunica_borracho_daga') return ENEMY_VFX_PROFILES.hoggoblin_encapuchado_daga;
  if (id === 'hoggoblin_tunica_borracho_ballesta') return ENEMY_VFX_PROFILES.hoggoblin_encapuchado_ballesta;

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
  startOffsetX: number;
  startOffsetY: number;
  endBottomPct: number;
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

// Clean crescent slashes using the provided sprite directly (1 normally, 2 crossed on Ult)
const SLASH_SINGLE: readonly EnemySlashSpec[] = [
  { delayMs: 85, leftPct: 5.5, bottomPct: 31, widthPx: 196, rotateDeg: -14 },
];

const SLASH_DOUBLE: readonly EnemySlashSpec[] = [
  { delayMs: 75, leftPct: 5, bottomPct: 35, widthPx: 190, rotateDeg: -22 },
  { delayMs: 200, leftPct: 7, bottomPct: 26, widthPx: 202, rotateDeg: 16, flipY: true },
];

// Pointed sonic air thrust for lancers: tip ends right at the hero's center X
const SPEAR_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 80, startOffsetX: 168, startOffsetY: -20, endBottomPct: 36, widthPx: 220, aspect: 0.435, rotateDeg: -5, durationMs: 290 },
];

const SPEAR_DOUBLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startOffsetX: 164, startOffsetY: -24, endBottomPct: 40, widthPx: 214, aspect: 0.435, rotateDeg: -7, durationMs: 275 },
  { delayMs: 195, startOffsetX: 172, startOffsetY: -16, endBottomPct: 33, widthPx: 224, aspect: 0.435, rotateDeg: -3, durationMs: 275 },
];

const SPEAR_TRIPLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 65, startOffsetX: 166, startOffsetY: -28, endBottomPct: 42, widthPx: 212, aspect: 0.5, rotateDeg: -8, durationMs: 265 },
  { delayMs: 165, startOffsetX: 174, startOffsetY: -18, endBottomPct: 36, widthPx: 224, aspect: 0.5, rotateDeg: -4, durationMs: 265 },
  { delayMs: 265, startOffsetX: 168, startOffsetY: -10, endBottomPct: 31, widthPx: 218, aspect: 0.5, rotateDeg: -1, durationMs: 265 },
];

// Paired crimson leg-spears for Araknoide Ovíparo: one from upper scythe leg, one from lower scythe leg
const OVIPARO_DUAL_LEGS: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startOffsetX: 156, startOffsetY: -72, endBottomPct: 41, widthPx: 204, aspect: 0.54, rotateDeg: -20, durationMs: 285 },
  { delayMs: 95, startOffsetX: 132, startOffsetY: -30, endBottomPct: 30, widthPx: 204, aspect: 0.54, rotateDeg: -8, durationMs: 285 },
];

const OVIPARO_DUAL_LEGS_ULT: readonly EnemyProjectileSpec[] = [
  { delayMs: 65, startOffsetX: 156, startOffsetY: -72, endBottomPct: 41, widthPx: 208, aspect: 0.54, rotateDeg: -20, durationMs: 270 },
  { delayMs: 88, startOffsetX: 132, startOffsetY: -30, endBottomPct: 30, widthPx: 208, aspect: 0.54, rotateDeg: -8, durationMs: 270 },
  { delayMs: 205, startOffsetX: 160, startOffsetY: -76, endBottomPct: 43, widthPx: 214, aspect: 0.54, rotateDeg: -21, durationMs: 270 },
  { delayMs: 228, startOffsetX: 136, startOffsetY: -26, endBottomPct: 28, widthPx: 214, aspect: 0.54, rotateDeg: -7, durationMs: 270 },
];

// Clean simple arrows / crossbow bolts (no effects): arrowhead tip ends right at the hero's center X
const BOLT_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 80, startOffsetX: 176, startOffsetY: -22, endBottomPct: 37, widthPx: 130, aspect: 0.2, rotateDeg: -6, durationMs: 280 },
];

const BOLT_VOLLEY: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startOffsetX: 172, startOffsetY: -28, endBottomPct: 42, widthPx: 124, aspect: 0.2, rotateDeg: -8, durationMs: 270 },
  { delayMs: 160, startOffsetX: 178, startOffsetY: -20, endBottomPct: 37, widthPx: 130, aspect: 0.2, rotateDeg: -5, durationMs: 270 },
  { delayMs: 250, startOffsetX: 174, startOffsetY: -12, endBottomPct: 32, widthPx: 134, aspect: 0.2, rotateDeg: -3, durationMs: 270 },
];

// Slingshot pebble arcs
const STONE_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 85, startOffsetX: 184, startOffsetY: -20, endBottomPct: 35, widthPx: 96, aspect: 0.66, rotateDeg: -4, durationMs: 340 },
];

const STONE_BARRAGE: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startOffsetX: 180, startOffsetY: -26, endBottomPct: 40, widthPx: 88, aspect: 0.66, rotateDeg: -6, durationMs: 310 },
  { delayMs: 175, startOffsetX: 188, startOffsetY: -14, endBottomPct: 33, widthPx: 96, aspect: 0.66, rotateDeg: 4, durationMs: 310 },
];

// Grenade arcs
const BOMB_SINGLE: readonly EnemyProjectileSpec[] = [
  { delayMs: 85, startOffsetX: 184, startOffsetY: -24, endBottomPct: 35, widthPx: 104, aspect: 0.68, rotateDeg: -6, durationMs: 370 },
];

const BOMB_ULT: readonly EnemyProjectileSpec[] = [
  { delayMs: 70, startOffsetX: 178, startOffsetY: -28, endBottomPct: 40, widthPx: 100, aspect: 0.68, rotateDeg: -8, durationMs: 340 },
  { delayMs: 190, startOffsetX: 190, startOffsetY: -18, endBottomPct: 33, widthPx: 110, aspect: 0.68, rotateDeg: 4, durationMs: 340 },
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
  enemyFrame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [triggeredSteps, setTriggeredSteps] = useState<number[]>([]);
  const [triggeredImpact, setTriggeredImpact] = useState<boolean>(false);
  const [triggeredOno, setTriggeredOno] = useState<boolean>(false);
  const [triggeredUltOno, setTriggeredUltOno] = useState<boolean>(false);

  const isActive = Boolean(activeAttack) && enabled;

  /**
   * Punta del arma del enemigo en coordenadas normalizadas del área de combate (origen arriba
   * izquierda). Sale del marco medido del sprite y del alfa del propio PNG (el padding
   * transparente no cuenta), así que sirve igual para un lancero pequeño que para un jefe.
   */
  const weaponTip = useMemo(() => {
    const f = enemyFrame ?? DEFAULT_ENEMY_FRAME;
    const x =
      f.left !== undefined
        ? f.left + f.width * (f.tipFx ?? 0)
        : f.x - f.width * 0.5 + f.width * (f.tipFx ?? 0);
    const topY = f.top !== undefined ? f.top : f.headY - f.height * 0.15;
    const y = f.tipFy !== undefined ? topY + f.height * f.tipFy : f.headY + (f.y - f.headY) * 0.55;
    return {
      x: Math.min(0.96, Math.max(0.02, x)),
      y: Math.min(0.94, Math.max(0.06, y)),
    };
  }, [enemyFrame]);

  const mouthOrigin = useMemo(() => {
    const f = enemyFrame ?? DEFAULT_ENEMY_FRAME;
    const fallbackX = f.left !== undefined ? f.left + f.width * 0.27 : f.x - f.width * 0.23;
    const fallbackY = f.top !== undefined ? f.top + f.height * 0.425 : f.headY + f.height * 0.16;
    return {
      x: Math.min(0.95, Math.max(0.22, f.mouthX ?? fallbackX)),
      y: Math.min(0.9, Math.max(0.12, f.mouthY ?? fallbackY)),
    };
  }, [enemyFrame]);

  // La punta y la boca se congelan al despegar el ataque para que el efecto no salte en vuelo.
  const [launchTip, setLaunchTip] = useState(weaponTip);
  const [launchMouth, setLaunchMouth] = useState(mouthOrigin);
  useEffect(() => {
    setLaunchTip(weaponTip);
    setLaunchMouth(mouthOrigin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAttack?.vfxKey]);
  useEffect(() => {
    if (triggeredSteps.length === 0) {
      setLaunchTip(weaponTip);
      setLaunchMouth(mouthOrigin);
    }
  }, [weaponTip, mouthOrigin, triggeredSteps.length]);

  // Tamaño real del área de combate: hace falta para pasar de porcentajes a píxeles al calcular
  // la recta entre la punta del arma y el héroe.
  const [arenaBox, setArenaBox] = useState({ w: 407, h: 380 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 407;
    const h = el.clientHeight || 380;
    setArenaBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, [activeAttack]);
  const vfxKey = activeAttack?.vfxKey ?? 0;
  const isUlt = Boolean(activeAttack?.isUlt);
  const isSpecial = Boolean(activeAttack?.isSpecial);
  const dndDamageType = activeAttack?.dndDamageType ?? 'slashing';
  const profile = activeAttack ? resolveEnemyProfile(activeAttack) : null;

  const effectiveShader: ShaderKey = profile?.shader ?? 'none';
  const effectiveParticles: ParticlePreset = profile?.particles ?? 'sparks';
  const effectiveAccent = profile?.accentColor ?? activeAttack?.themeColor ?? '#ef4444';
  const filterUrl = FILTER_ID_MAP[effectiveShader];
  const isPureSimpleMode =
    profile?.mode === 'spear_thrust' ||
    profile?.mode === 'spear_vanguard_ult' ||
    profile?.mode === 'oviparo_dual_spears' ||
    profile?.mode === 'crossbow_bolt' ||
    profile?.mode === 'arrow_shot' ||
    profile?.mode === 'sling_stone' ||
    profile?.mode === 'club_smash';
  const isCleanSlashMode =
    profile?.mode === 'sword_slash' ||
    profile?.mode === 'shield_sword_ult' ||
    Boolean(profile?.alwaysDoubleSlash);
  const isDevoradorMode =
    profile?.mode === 'scythe_slash' || profile?.mode === 'lifesteal_bite';
  const isSpiderWebPunchMode =
    profile?.spriteSrc === '/assets/combat/enemy_vfx_espinoso_web.webp';
  const isBugbearMansionVfx =
    profile?.spriteSrc === '/assets/combat/bugbear_vfx_bandeja.webp' ||
    profile?.spriteSrc === '/assets/combat/bugbear_vfx_objetos.webp';
  const omitGenericImpact =
    isPureSimpleMode ||
    isCleanSlashMode ||
    profile?.mode === 'shaman_lightning' ||
    profile?.mode === 'mist_breath' ||
    isDevoradorMode ||
    isSpiderWebPunchMode ||
    isBugbearMansionVfx;

  const getStepDelays = (): number[] => {
    if (!profile) return [];
    switch (profile.mode) {
      case 'sword_slash':
      case 'dagger_slash':
      case 'axe_cleave':
      case 'claw_swipe':
      case 'scythe_slash':
        return (isUlt || profile.alwaysDoubleSlash ? SLASH_DOUBLE : SLASH_SINGLE).map(
          (s) => s.delayMs
        );
      case 'spear_thrust':
        return (isUlt ? SPEAR_TRIPLE : SPEAR_SINGLE).map((p) => p.delayMs);
      case 'spear_vanguard_ult':
        return (isUlt ? SPEAR_TRIPLE : SPEAR_DOUBLE).map((p) => p.delayMs);
      case 'oviparo_dual_spears':
        return (isUlt ? OVIPARO_DUAL_LEGS_ULT : OVIPARO_DUAL_LEGS).map((p) => p.delayMs);
      case 'shield_sword_ult':
        return [75, 190, 305];
      case 'shield_bash':
      case 'mace_smash':
      case 'warcry_roar':
        return [90];
      case 'mace_judgment_ult':
        return [80, 230];
      case 'arrow_shot':
      case 'crossbow_bolt':
        return (isUlt ? BOLT_VOLLEY : BOLT_SINGLE).map((p) => p.delayMs);
      case 'spine_shot':
      case 'ice_shard':
      case 'ice_lance':
      case 'shaman_wisp':
        return (isUlt || isSpecial
          ? BOLT_VOLLEY.slice(0, isUlt ? 3 : 2)
          : BOLT_SINGLE
        ).map((p) => p.delayMs);
      case 'sling_stone':
        return STONE_SINGLE.map((p) => p.delayMs);
      case 'grenade_throw':
        return (isUlt ? BOMB_ULT : BOMB_SINGLE).map((p) => p.delayMs);
      case 'blunderbuss_shot':
        return (isUlt ? BOLT_VOLLEY : BOLT_SINGLE).map((p) => p.delayMs);
      case 'lightning_bolt':
      case 'lightning_slam':
        return (isUlt ? BOLTS_ULT : BOLTS_NORMAL).map((b) => b.delayMs);
      case 'ceiling_impale':
        return isUlt ? [85, 205] : [95];
      case 'shaman_lightning':
        return [60];
      case 'mist_breath':
        return [110];
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
    setTriggeredUltOno(false);

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
      profile.mode === 'lifesteal_bite'
        ? 185
        : profile.mode === 'grenade_throw' || profile.mode === 'sling_stone'
        ? isUlt
          ? 360
          : 315
        : profile.alwaysDualOno
        ? 175
        : isUlt
        ? 300
        : 245;

    timers.push(window.setTimeout(() => setTriggeredImpact(true), impactDelay));
    timers.push(window.setTimeout(() => setTriggeredOno(true), impactDelay + 25));
    if (
      (isUlt || profile.alwaysDualOno) &&
      profile.ultOnoSrc &&
      profile.onoSrc &&
      profile.ultOnoSrc !== profile.onoSrc
    ) {
      timers.push(window.setTimeout(() => setTriggeredUltOno(true), impactDelay + 145));
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [activeAttack, vfxKey, isUlt, isSpecial]);

  // 60fps Canvas Particle & Runic/Acoustic Shockwave Engine (skipped for pure simple spear/bolt/arrow & clean hero-style slashes)
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (isPureSimpleMode || isCleanSlashMode) {
      return;
    }

    const heroX = width * 0.21;
    const heroY = height * 0.62;
    const enemyX = width * 0.77;
    const enemyY = height * 0.54;

    const particles: CanvasParticle[] = [];
    const count = isUlt ? 24 : 15;

    const paletteByPreset: Record<ParticlePreset, string[]> = {
      sparks: [effectiveAccent, '#fde68a', '#ffffff'],
      icespear_cyan: ['#38bdf8', '#67e8f9', '#e0f2fe', '#ffffff'],
      icespear_shield: ['#22d3ee', '#60a5fa', '#fef08a', '#e0f2fe'],
      icespear_roar: ['#ef4444', '#22d3ee', '#fbbf24', '#ffffff'],
      blood: ['#ef4444', '#fca5a5', '#dc2626'],
      dust: ['#d6d3d1', effectiveAccent, '#fef3c7'],
      splinters: ['#d97706', '#fde68a', '#92400e'],
      fire: ['#f97316', '#fde047', '#ef4444'],
      frost: ['#e0f2fe', '#38bdf8', '#bae6fd'],
      acid: ['#a3e635', '#bef264', '#84cc16'],
      void: ['#c084fc', '#a855f7', '#e9d5ff'],
      lightning: ['#e0f2fe', '#38bdf8', '#22d3ee'],
      shaman_lightning: ['#a7f3d0', '#6ee7b7', '#34d399', '#ecfdf5'],
      lifesteal: ['#ef4444', '#fda4af', '#dc2626'],
    };

    const palette = paletteByPreset[effectiveParticles];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.4 + Math.random() * (isUlt ? 5.6 : 4.0);
      particles.push({
        x: heroX + (Math.random() - 0.5) * 38,
        y: heroY + (Math.random() - 0.5) * 42,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4,
        size: 2.0 + Math.random() * 2.4,
        life: -6 - Math.random() * 10,
        maxLife: 19 + Math.random() * 11,
        color: palette[i % palette.length],
        trail: effectiveParticles !== 'acid' && effectiveParticles !== 'dust',
        shape:
          effectiveParticles === 'frost' ||
          effectiveParticles === 'dust' ||
          effectiveParticles === 'icespear_shield' ||
          (effectiveParticles === 'shaman_lightning' && i % 3 === 0)
            ? 'diamond'
            : effectiveParticles === 'acid'
            ? 'circle'
            : 'spark',
        gravity: effectiveParticles === 'acid' || effectiveParticles === 'fire' ? -0.04 : 0.14,
      });
    }

    // Chorro de esporas verdes petrificantes saliendo de la boca del Gorgon hacia el héroe
    if (profile.mode === 'mist_breath') {
      const startMouthX = mouthOrigin.x * width;
      const startMouthY = mouthOrigin.y * height;
      const travelX = heroX - startMouthX;
      const travelY = heroY - startMouthY;
      for (let i = 0; i < 18; i++) {
        const steps = 16 + Math.random() * 10;
        particles.push({
          x: startMouthX + (Math.random() - 0.5) * 8,
          y: startMouthY + (Math.random() - 0.5) * 8,
          vx: travelX / steps + (Math.random() - 0.5) * 1.1,
          vy: travelY / steps + (Math.random() - 0.5) * 1.6,
          size: 2.2 + Math.random() * 2.5,
          life: -5 - i * 0.9,
          maxLife: Math.round(steps) + 6,
          color: i % 3 === 0 ? '#a7f3d0' : i % 2 === 0 ? '#34d399' : '#10b981',
          trail: false,
          shape: 'circle',
          gravity: -0.02,
        });
      }
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

    const drawHexagon = (cx: number, cy: number, radius: number, rotationRad: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = rotationRad + (i * Math.PI) / 3;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    let frameId = 0;
    const startTime = performance.now();
    const totalDurationMs = isUlt ? 900 : 780;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      // Shockwave rings on impact (multi-ring for Icespear Ults & Shield/Mace; skipped for shaman_lightning which has its own Magordito-style ring)
      const isRunicShieldMode =
        profile.mode === 'shield_bash' ||
        profile.mode === 'spear_vanguard_ult' ||
        profile.mode === 'shield_sword_ult';
      const isRoarOrMaceUlt =
        profile.mode === 'warcry_roar' || profile.mode === 'mace_judgment_ult';
      const isHeavySlamOrVoid =
        profile.mode === 'punch_slam' ||
        profile.mode === 'ceiling_impale' ||
        profile.mode === 'fang_bite' ||
        profile.mode === 'void_orb';
      const ringCount =
        profile.mode === 'shaman_lightning' ||
        profile.mode === 'scythe_slash' ||
        profile.mode === 'lifesteal_bite' ||
        isSpiderWebPunchMode
          ? 0
          : isUlt || isRunicShieldMode || isRoarOrMaceUlt || isHeavySlamOrVoid
          ? isUlt
            ? 3
            : 2
          : 1;

      for (let r = 0; r < ringCount; r++) {
        const ringStart = 0.2 + r * 0.11;
        const ringSpan = 0.45;
        if (progress > ringStart && progress < ringStart + ringSpan) {
          const p = (progress - ringStart) / ringSpan;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            heroX,
            heroY + 58,
            20 + p * (50 + r * 12),
            6 + p * (16 + r * 4),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle =
            r === 1 && isRunicShieldMode
              ? '#fef08a'
              : r === 1 && isRoarOrMaceUlt
              ? '#22d3ee'
              : r === 1 && profile.mode === 'punch_slam'
              ? '#fde047'
              : r === 1 && (profile.shader === 'abyssal_spear' || profile.shader === 'abyssal_void')
              ? '#f0abfc'
              : effectiveAccent;
          ctx.globalAlpha = (1 - p) * (0.78 - r * 0.12);
          ctx.lineWidth = (2.8 - r * 0.4) * (1 - p * 0.4);
          ctx.shadowColor = effectiveAccent;
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Spectral abyssal drop streaks for Zancudo ceiling impale
      if (profile.mode === 'ceiling_impale' && progress > 0.08 && progress < 0.72) {
        const p = (progress - 0.08) / 0.64;
        const streakCount = isUlt ? 3 : 2;
        for (let s = 0; s < streakCount; s++) {
          const sx = heroX + 68 - s * 22;
          const ex = heroX - 10 + s * 14;
          const sy = 24 + s * 12;
          const ey = heroY + 26;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (ex - sx) * Math.min(1, p * 1.4), sy + (ey - sy) * Math.min(1, p * 1.4));
          ctx.strokeStyle = s % 2 === 0 ? '#a855f7' : '#f5d0fe';
          ctx.globalAlpha = Math.sin(p * Math.PI) * 0.72;
          ctx.lineWidth = 2.6 - s * 0.5;
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Magordito-style vertical lightning arc branches for Goblin Chamán
      if (profile.mode === 'shaman_lightning' && progress > 0.08 && progress < 0.72) {
        const arcAlpha = Math.sin(((progress - 0.08) / 0.64) * Math.PI) * 0.7;
        const drawBranch = (x1: number, y1: number, x2: number, y2: number, lw: number) => {
          const steps = 6;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            const jitter = (1 - Math.abs(t - 0.5) * 1.4) * 18;
            ctx.lineTo(
              x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter,
              y1 + (y2 - y1) * t + (Math.random() - 0.5) * 8
            );
          }
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(52, 211, 153, ${arcAlpha})`;
          ctx.lineWidth = lw;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.strokeStyle = `rgba(236, 253, 245, ${arcAlpha * 0.9})`;
          ctx.lineWidth = Math.max(1, lw * 0.42);
          ctx.stroke();
          ctx.restore();
        };
        drawBranch(heroX - 14, 14, heroX - 2, heroY + 62, 1.9);
        if (isUlt) {
          drawBranch(heroX + 18, 18, heroX + 6, heroY + 58, 1.7);
        }
      }

      // Nordic Runic Hexagonal Shockwave for Icespear Shield Bash / Ults
      if (isRunicShieldMode && progress > 0.18 && progress < 0.78) {
        const p = (progress - 0.18) / 0.6;
        const hexAlpha = Math.sin(p * Math.PI) * (isUlt ? 0.82 : 0.68);
        const hexRadius = 32 + p * (isUlt ? 46 : 36);
        ctx.save();
        drawHexagon(heroX + 8, heroY - 6, hexRadius, p * 0.42);
        ctx.strokeStyle = `rgba(56, 189, 248, ${hexAlpha})`;
        ctx.lineWidth = isUlt ? 3.0 : 2.3;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 14;
        ctx.stroke();

        drawHexagon(heroX + 8, heroY - 6, hexRadius * 0.68, -p * 0.55);
        ctx.strokeStyle = `rgba(254, 240, 138, ${hexAlpha * 0.8})`;
        ctx.lineWidth = 1.7;
        ctx.shadowColor = '#fbbf24';
        ctx.stroke();
        ctx.restore();
      }

      // Sonic Warcry Wave Rings traveling from Enemy -> Hero
      if (isRoarOrMaceUlt && progress > 0.08 && progress < 0.72) {
        const isElectricRoar = effectiveAccent === '#38bdf8';
        for (let wIdx = 0; wIdx < 3; wIdx++) {
          const wStart = 0.08 + wIdx * 0.1;
          const wSpan = 0.46;
          if (progress > wStart && progress < wStart + wSpan) {
            const wp = (progress - wStart) / wSpan;
            const waveX = enemyX - 24 + (heroX - (enemyX - 24)) * wp;
            const waveY = enemyY - 12 + (heroY - (enemyY - 12)) * wp;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(waveX, waveY, 12 + wp * 26, 26 + wp * 52, 0, Math.PI * 0.55, Math.PI * 1.45);
            const ringCol = isElectricRoar
              ? wIdx % 2 === 0
                ? '#38bdf8'
                : '#fde047'
              : wIdx % 2 === 0
              ? '#ef4444'
              : '#38bdf8';
            ctx.strokeStyle = ringCol;
            ctx.globalAlpha = Math.sin(wp * Math.PI) * 0.85;
            ctx.lineWidth = 3.2 - wp * 1.2;
            ctx.shadowColor = ringCol;
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
          }
        }
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
  }, [activeAttack, vfxKey, isUlt, effectiveAccent, effectiveParticles, profile]);

  if (!isActive || !profile) return null;

  const isMode = (m: DeliveryMode) => profile.mode === m;
  const activeImpactSrc = profile.impactSrc ?? '/assets/combat/raxxar_vfx_impacto.webp';
  const activePrimaryOnoSrc = profile.onoSrc;
  const activeSecondaryOnoSrc =
    (isUlt || profile.alwaysDualOno) && profile.ultOnoSrc && profile.ultOnoSrc !== profile.onoSrc
      ? profile.ultOnoSrc
      : undefined;
  const onoRimFilter =
    profile.onoGlowColor === 'crimson_tint'
      ? 'url(#enemy-vfx-crimson-ono-tint-shader)'
      : profile.onoGlowColor === 'crimson'
      ? 'url(#enemy-vfx-ono-crimson-shader)'
      : profile.onoGlowColor === 'gold'
      ? 'url(#enemy-vfx-ono-gold-shader)'
      : profile.onoGlowColor === 'cyan'
      ? 'url(#enemy-vfx-ono-cyan-shader)'
      : profile.onoGlowColor === 'purple'
      ? 'url(#enemy-vfx-ono-purple-shader)'
      : filterUrl;

  const GLINT_MASK_STYLE: React.CSSProperties = {
    mixBlendMode: 'screen',
    WebkitMaskImage:
      'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
    maskImage:
      'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
    WebkitMaskSize: '230% 100%',
    maskSize: '230% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };

  /**
   * Proyectiles de arma (lanzas, flechas, virotes, púas...): nacen en la punta del arma del
   * enemigo y recorren en recta la distancia hasta el héroe, girando según su trayectoria real.
   */
  const renderProjectileWave = (
    list: readonly EnemyProjectileSpec[],
    src: string,
    keyPrefix: string,
    opts?: { flipImgX?: boolean; arc?: boolean; spin?: boolean }
  ) =>
    triggeredSteps.map((idx) => {
      const p = list[idx];
      if (!p) return null;
      const dur = p.durationMs ?? 290;
      const heightPx = Math.round(p.widthPx * (p.aspect ?? 0.44));
      const { w, h } = arenaBox;

      // Sale de la punta del arma...
      const startX = launchTip.x * w;
      const startY = launchTip.y * h;
      // ...y llega a la zona de impacto de siempre, sobre el héroe.
      const endX = 0.065 * w + 74.5;
      const endY = h - (p.endBottomPct / 100) * h;
      const dx = endX - startX;
      const dy = endY - startY;
      // El arte de estos proyectiles apunta a la izquierda (180º): se gira para seguir la recta.
      const flightAngle = (Math.atan2(dy, dx) * 180) / Math.PI - 180 + p.rotateDeg;

      return (
        <div
          key={`${keyPrefix}-${vfxKey}-${idx}`}
          className="absolute pointer-events-none z-20 overflow-visible"
          style={
            {
              left: `${(launchTip.x * 100).toFixed(2)}%`,
              bottom: `${((1 - launchTip.y) * 100).toFixed(2)}%`,
              width: `${p.widthPx}px`,
              height: `${heightPx}px`,
              transformOrigin: 'left center',
              '--dx': `${dx.toFixed(1)}px`,
              '--dy': `${dy.toFixed(1)}px`,
              animation: `${
                opts?.arc ? 'enemyProjectileArcToTarget' : 'enemyProjectileFlyToTarget'
              } ${dur}ms cubic-bezier(0.16,0.9,0.28,1) forwards`,
            } as React.CSSProperties
          }
        >
          <div
            className="relative w-full h-full"
            style={{
              transform: `rotate(${flightAngle.toFixed(2)}deg)`,
              transformOrigin: 'left center',
            }}
          >
            <img
              src={src}
              alt="Ataque Enemigo"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-contain ${opts?.spin ? 'animate-[enemySpinLob_0.34s_linear_infinite]' : ''}`}
              style={{
                transform: opts?.flipImgX ? 'scaleX(-1)' : undefined,
                filter: filterUrl,
              }}
            />
            {profile.energyGlint && !opts?.spin && (
              <img
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  ...GLINT_MASK_STYLE,
                  transform: opts?.flipImgX ? 'scaleX(-1)' : undefined,
                  animation: 'enemyEnergySweep 0.36s ease-out forwards',
                }}
              />
            )}
          </div>
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
            height:
              isMode('sword_slash') || profile.spriteSrc.includes('enemy_vfx_goblin_tajo')
                ? `${Math.round(s.widthPx * 0.53)}px`
                : `${s.widthPx}px`,
            transform: `rotate(${s.rotateDeg}deg) ${s.flipY ? 'scaleY(-1)' : ''}`,
          }}
        >
          <div
            className="relative w-full h-full overflow-visible"
            style={{
              transform: flipImgX ? 'scaleX(-1)' : undefined,
            }}
          >
            <img
              src={src}
              alt="Corte Enemigo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain animate-[enemyClawSlashSweep_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
              style={{
                filter: filterUrl,
              }}
            />
            {profile.energyGlint && (
              <img
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  ...GLINT_MASK_STYLE,
                  animation:
                    'enemyClawSlashSweep 0.4s cubic-bezier(0.16,1,0.3,1) forwards, enemyEnergySweep 0.36s ease-out forwards',
                }}
              />
            )}
          </div>
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
          <filter id="enemy-vfx-icespear-steel-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.08" numOctaves="2" seed="4" result="steelNoise">
              <animate attributeName="baseFrequency" values="0.02 0.07; 0.045 0.13; 0.02 0.07" dur="0.32s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="steelNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="shimmerEdge" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#38bdf8" floodOpacity="0.95" result="cyanGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.1" floodColor="#e0f2fe" floodOpacity="0.9" result="iceRim" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="shimmerEdge" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-icespear-shield-shader" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.09" numOctaves="2" seed="9" result="runeNoise">
              <animate attributeName="baseFrequency" values="0.024 0.08; 0.052 0.14; 0.024 0.08" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="runeNoise" scale="3.0" xChannelSelector="R" yChannelSelector="G" result="kineticRune" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#22d3ee" floodOpacity="0.96" result="cyanCorona" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fef08a" floodOpacity="0.72" result="goldCore" />
            <feMerge>
              <feMergeNode in="cyanCorona" />
              <feMergeNode in="goldCore" />
              <feMergeNode in="kineticRune" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-icespear-fire-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="turbulence" baseFrequency="0.03 0.09" numOctaves="2" seed="7" result="flameNoise">
              <animate attributeName="baseFrequency" values="0.025 0.08; 0.055 0.14; 0.025 0.08" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="flameNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="flameWarp" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#f97316" floodOpacity="0.96" result="emberGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fde047" floodOpacity="0.88" result="solarRim" />
            <feMerge>
              <feMergeNode in="emberGlow" />
              <feMergeNode in="solarRim" />
              <feMergeNode in="flameWarp" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-icespear-crimson-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ef4444" floodOpacity="0.95" result="crimsonGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#fbbf24" floodOpacity="0.82" result="goldRim" />
            <feMerge>
              <feMergeNode in="crimsonGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-icespear-roar-shader" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.1" numOctaves="2" seed="12" result="sonicNoise">
              <animate attributeName="baseFrequency" values="0.03 0.09; 0.068 0.16; 0.03 0.09" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="sonicNoise" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="sonicPulse" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#ef4444" floodOpacity="0.95" result="roarRed" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#38bdf8" floodOpacity="0.85" result="roarCyan" />
            <feMerge>
              <feMergeNode in="roarRed" />
              <feMergeNode in="roarCyan" />
              <feMergeNode in="sonicPulse" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-ono-cyan-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.0" floodColor="#22d3ee" floodOpacity="0.92" result="cyanGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#cffafe" floodOpacity="0.95" result="iceRim" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="iceRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-ono-crimson-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ef4444" floodOpacity="0.95" result="redGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fde047" floodOpacity="0.9" result="goldRim" />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="goldRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-crimson-ono-tint-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.38 0.92 0.85 0 0.04
                      0.14 0.14 0.14 0 0
                      0.12 0.10 0.16 0 0
                      0    0    0    1 0"
              result="crimsonText"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ef4444" floodOpacity="0.95" result="redGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#fda4af" floodOpacity="0.92" result="roseRim" />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="roseRim" />
              <feMergeNode in="crimsonText" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-ono-gold-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#f97316" floodOpacity="0.95" result="fireGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#fef08a" floodOpacity="0.95" result="lemonRim" />
            <feMerge>
              <feMergeNode in="fireGlow" />
              <feMergeNode in="lemonRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-ono-purple-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#9333ea" floodOpacity="0.95" result="voidGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#f5d0fe" floodOpacity="0.95" result="spectralRim" />
            <feMerge>
              <feMergeNode in="voidGlow" />
              <feMergeNode in="spectralRim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-crimson-claw-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="turbulence" baseFrequency="0.03 0.08" numOctaves="2" seed="3" result="clawNoise">
              <animate attributeName="baseFrequency" values="0.025 0.07; 0.05 0.13; 0.025 0.07" dur="0.24s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="clawNoise" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="clawWarp" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ef4444" floodOpacity="0.96" result="bloodGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#fda4af" floodOpacity="0.88" result="roseRim" />
            <feMerge>
              <feMergeNode in="bloodGlow" />
              <feMergeNode in="roseRim" />
              <feMergeNode in="clawWarp" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-frost-cryo-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.08" numOctaves="2" seed="11" result="iceNoise">
              <animate attributeName="baseFrequency" values="0.022 0.07; 0.048 0.12; 0.022 0.07" dur="0.3s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="iceNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="iceShimmer" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#38bdf8" floodOpacity="0.96" result="cryoGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#e0f2fe" floodOpacity="0.95" result="frostRim" />
            <feMerge>
              <feMergeNode in="cryoGlow" />
              <feMergeNode in="frostRim" />
              <feMergeNode in="iceShimmer" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-abyssal-spear-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.82 0.05 0.55 0 0.06
                      0.10 0.30 0.45 0 0
                      0.55 0.25 1.15 0 0.14
                      0    0    0    1 0"
              result="violetShift"
            />
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="2" seed="15" result="abyssNoise">
              <animate attributeName="baseFrequency" values="0.025 0.07; 0.05 0.13; 0.025 0.07" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="violetShift" in2="abyssNoise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="abyssWarp" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#9333ea" floodOpacity="0.96" result="voidAura" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#f5d0fe" floodOpacity="0.9" result="spectralRim" />
            <feMerge>
              <feMergeNode in="voidAura" />
              <feMergeNode in="spectralRim" />
              <feMergeNode in="abyssWarp" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-abyssal-void-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028 0.09" numOctaves="2" seed="19" result="voidNoise">
              <animate attributeName="baseFrequency" values="0.022 0.08; 0.052 0.14; 0.022 0.08" dur="0.25s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="voidNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="voidWarp" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#a855f7" floodOpacity="0.96" result="violetGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#e9d5ff" floodOpacity="0.9" result="voidRim" />
            <feMerge>
              <feMergeNode in="violetGlow" />
              <feMergeNode in="voidRim" />
              <feMergeNode in="voidWarp" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-volt-slam-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="turbulence" baseFrequency="0.032 0.09" numOctaves="2" seed="21" result="voltNoise">
              <animate attributeName="baseFrequency" values="0.024 0.08; 0.055 0.14; 0.024 0.08" dur="0.22s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="voltNoise" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="voltWarp" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#38bdf8" floodOpacity="0.96" result="voltCyan" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#fef08a" floodOpacity="0.88" result="voltGoldRim" />
            <feMerge>
              <feMergeNode in="voltCyan" />
              <feMergeNode in="voltGoldRim" />
              <feMergeNode in="voltWarp" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-venom-acid-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="2" seed="25" result="acidNoise">
              <animate attributeName="baseFrequency" values="0.024 0.07; 0.052 0.13; 0.024 0.07" dur="0.26s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="acidNoise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="acidWarp" />
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#84cc16" floodOpacity="0.95" result="limeGlow" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="#c084fc" floodOpacity="0.82" result="miasmaRim" />
            <feMerge>
              <feMergeNode in="limeGlow" />
              <feMergeNode in="miasmaRim" />
              <feMergeNode in="acidWarp" />
            </feMerge>
          </filter>
          <filter id="enemy-vfx-gold-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#fbbf24" floodOpacity="0.92" />
          </filter>
          <filter id="enemy-vfx-gold-slash-shader" x="-10%" y="-10%" width="120%" height="120%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.25 0.65 1.15 0 0.08
                      0.15 0.52 0.88 0 0.04
                      0.05 0.12 0.28 0 0
                      0    0    0    1 0"
            />
          </filter>
          <filter id="enemy-vfx-goblin-shader" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#84cc16" floodOpacity="0.9" />
          </filter>
          <filter id="enemy-vfx-shaman-lightning-shader" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.07" numOctaves="2" seed="6" result="noise">
              <animate attributeName="baseFrequency" values="0.02 0.06; 0.045 0.11; 0.02 0.06" dur="0.28s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="warped" />
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor="#34d399" floodOpacity="0.72" result="emeraldGlow" />
            <feMerge>
              <feMergeNode in="emeraldGlow" />
              <feMergeNode in="warped" />
            </feMerge>
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
        className="absolute inset-0 pointer-events-none z-[35] overflow-visible select-none"
      >
        <style>{`
          @keyframes enemyClawSlashSweep {
            0% { transform: translate(24px, -14px) scale(0.45); opacity: 0; }
            25% { transform: translate(-2px, 4px) scale(1.06); opacity: 1; }
            70% { transform: translate(-8px, 6px) scale(1.0); opacity: 0.92; }
            100% { transform: translate(-14px, 12px) scale(1.08); opacity: 0; }
          }

          @keyframes enemyProjectileFlyLeft {
            0% { transform: translate(var(--sx), var(--sy)) scale(0.84); opacity: 0; }
            16% { transform: translate(calc(var(--sx) * 0.78), calc(var(--sy) * 0.78)) scale(1.0); opacity: 1; }
            70% { transform: translate(0px, 0px) scale(1.02); opacity: 1; }
            85% { transform: translate(0px, 0px) scale(1.0); opacity: 0.94; }
            100% { transform: translate(0px, 0px) scale(0.92); opacity: 0; }
          }

          /* Proyectiles clavados al arma: salen de la punta y recorren la recta hasta el héroe. */
          @keyframes enemyProjectileFlyToTarget {
            0% { transform: translate(0px, 0px) scale(0.82); opacity: 0; }
            14% { transform: translate(calc(var(--dx) * 0.16), calc(var(--dy) * 0.16)) scale(1.0); opacity: 1; }
            74% { transform: translate(var(--dx), var(--dy)) scale(1.02); opacity: 1; }
            88% { transform: translate(var(--dx), var(--dy)) scale(1.0); opacity: 0.92; }
            100% { transform: translate(var(--dx), var(--dy)) scale(0.9); opacity: 0; }
          }

          @keyframes enemyProjectileArcToTarget {
            0% { transform: translate(0px, 0px) scale(0.8); opacity: 0; }
            22% { transform: translate(calc(var(--dx) * 0.2), calc(var(--dy) * 0.2 - 52px)) scale(1.05); opacity: 1; }
            52% { transform: translate(calc(var(--dx) * 0.58), calc(var(--dy) * 0.58 - 68px)) scale(1.1); opacity: 1; }
            78% { transform: translate(var(--dx), var(--dy)) scale(1.02); opacity: 1; }
            100% { transform: translate(var(--dx), calc(var(--dy) + 4px)) scale(0.55); opacity: 0; }
          }

          @keyframes enemyArcLobLeft {
            0% { transform: translate(var(--sx), var(--sy)) scale(0.82); opacity: 0; }
            22% { transform: translate(calc(var(--sx) * 0.72), calc(var(--sy) * 0.65 - 52px)) scale(1.05); opacity: 1; }
            52% { transform: translate(calc(var(--sx) * 0.42), calc(var(--sy) * 0.35 - 68px)) scale(1.1); opacity: 1; }
            78% { transform: translate(0px, 0px) scale(1.02); opacity: 1; }
            100% { transform: translate(0px, 4px) scale(0.55); opacity: 0; }
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

          @keyframes enemyPokemonBiteClamp {
            0% { transform: scale(1.18) scaleY(1.28); opacity: 0; }
            18% { transform: scale(1.06) scaleY(1.16); opacity: 1; }
            42% { transform: scale(1.04) scaleY(0.84); opacity: 1; }
            62% { transform: scale(1.0) scaleY(0.94); opacity: 1; }
            100% { transform: scale(1.04) scaleY(0.9); opacity: 0; }
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

          @keyframes enemyShieldBashLeft {
            0% { transform: translate(62px, -8px) scale(0.45); opacity: 0; }
            28% { transform: translate(-4px, 2px) scale(1.14); opacity: 1; }
            68% { transform: translate(-10px, 4px) scale(1.04); opacity: 0.94; }
            100% { transform: translate(-18px, 8px) scale(1.18); opacity: 0; }
          }

          @keyframes enemyMaceSmashLeft {
            0% { transform: translate(42px, -54px) rotate(28deg) scale(0.74); opacity: 0; }
            30% { transform: translate(4px, -8px) rotate(4deg) scale(1.08); opacity: 1; }
            64% { transform: translate(-6px, 8px) rotate(-10deg) scale(1.12); opacity: 0.96; }
            100% { transform: translate(-12px, 14px) rotate(-14deg) scale(0.95); opacity: 0; }
          }

          @keyframes enemyWarcryWaveLeft {
            0% { transform: translate(185px, -18px) scale(0.38); opacity: 0; }
            26% { transform: translate(78px, -6px) scale(0.96); opacity: 1; }
            70% { transform: translate(-10px, 4px) scale(1.18); opacity: 0.92; }
            100% { transform: translate(-34px, 8px) scale(1.3); opacity: 0; }
          }

          @keyframes enemyEnergySweep {
            0% { opacity: 0; -webkit-mask-position: 120% 0%; mask-position: 120% 0%; }
            22% { opacity: 1; }
            76% { opacity: 0.9; }
            100% { opacity: 0; -webkit-mask-position: -35% 0%; mask-position: -35% 0%; }
          }

          @keyframes enemyShamanRayoStrike {
            0% { transform: translateY(-115px) scaleY(0.32) scaleX(0.78); opacity: 0; }
            16% { transform: translateY(-5px) scaleY(1.08) scaleX(1.03); opacity: 1; }
            28% { transform: translateY(3px) scaleY(1.12) scaleX(1.05); opacity: 1; }
            42% { transform: translateY(0px) scaleY(0.96) scaleX(1.0) skewX(2.5deg); opacity: 0.84; }
            58% { transform: translateY(-2px) scaleY(1.05) scaleX(0.98) skewX(-2deg); opacity: 1; }
            80% { transform: translateY(2px) scaleY(1.0) scaleX(1.02); opacity: 0.9; }
            100% { transform: translateY(12px) scaleY(0.84) scaleX(1.1); opacity: 0; }
          }

          @keyframes enemyShamanRayoGroundRing {
            0% { transform: scale(0.2); opacity: 0; }
            22% { transform: scale(1.0); opacity: 0.85; }
            72% { transform: scale(1.25); opacity: 0.45; }
            100% { transform: scale(1.55); opacity: 0; }
          }

          @keyframes enemyMistBreathFromMouth {
            0% { transform: scaleX(0.14) scaleY(0.28); opacity: 0; }
            18% { transform: scaleX(0.55) scaleY(0.72); opacity: 0.98; }
            56% { transform: scaleX(1.0) scaleY(1.0); opacity: 1; }
            82% { transform: scaleX(1.03) scaleY(1.04); opacity: 0.86; }
            100% { transform: scaleX(1.05) scaleY(1.06); opacity: 0; }
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
          renderSlashWave(
            isUlt || profile.alwaysDoubleSlash ? SLASH_DOUBLE : SLASH_SINGLE,
            profile.spriteSrc,
            'slash',
            profile.flipImgX
          )}

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

        {/* MAZAS, GARROTES Y APLASTAMIENTO SÍSMICO */}
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

        {/* APLASTAMIENTO SÍSMICO / GOLPE DE PUÑO (Titán Melenudo / Orco Caudillo / Araknoide Musculoso estilo Magordito) */}
        {isMode('punch_slam') &&
          triggeredSteps.map((idx) => (
            <div
              key={`punch-slam-${vfxKey}-${idx}`}
              className={`absolute pointer-events-none z-20 flex items-center justify-center ${
                isSpiderWebPunchMode
                  ? isUlt
                    ? 'left-[5.5%] bottom-[22%] w-[156px] h-[156px]'
                    : 'left-[6%] bottom-[23%] w-[138px] h-[138px]'
                  : 'left-[3.5%] bottom-[16%] w-[196px] h-[196px]'
              }`}
            >
              <div className="relative w-full h-full overflow-visible">
                <img
                  src={profile.spriteSrc}
                  alt="Impacto de Puño"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemySlamBurstPop_0.46s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: filterUrl }}
                />
                {profile.energyGlint && (
                  <img
                    src={profile.spriteSrc}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{
                      ...GLINT_MASK_STYLE,
                      animation:
                        'enemySlamBurstPop 0.46s cubic-bezier(0.16,1,0.3,1) forwards, enemyEnergySweep 0.38s ease-out forwards',
                    }}
                  />
                )}
              </div>
            </div>
          ))}

        {/* MAZA CON PÚAS DEL SARGENTO ACORAZADO (Maza Rompe-Huesos) */}
        {isMode('mace_smash') &&
          triggeredSteps.map((idx) => (
            <div
              key={`mace-${vfxKey}-${idx}`}
              className="absolute left-[3.5%] bottom-[16%] w-[198px] h-[198px] pointer-events-none z-20 flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Maza Rompe-Huesos"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyMaceSmashLeft_0.46s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* RUGIDO DE LA GUARNICIÓN (Onda sónica del Sargento) */}
        {isMode('warcry_roar') &&
          triggeredSteps.map((idx) => (
            <div
              key={`roar-${vfxKey}-${idx}`}
              className="absolute left-[6%] bottom-[21%] w-[188px] h-[188px] pointer-events-none z-20 flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Rugido de la Guarnición"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyWarcryWaveLeft_0.48s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* JUICIO MARCIAL DEL SARGENTO (Onda sónica + Salto con maza) */}
        {isMode('mace_judgment_ult') && (
          <>
            {triggeredSteps.includes(0) && (
              <div className="absolute left-[6.5%] bottom-[21%] w-[184px] h-[184px] pointer-events-none z-20 flex items-center justify-center">
                <img
                  src={profile.secondarySpriteSrc ?? '/assets/combat/guardia_vfx_rugido_onda.webp'}
                  alt="Onda de Juicio"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyWarcryWaveLeft_0.44s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: 'url(#enemy-vfx-icespear-roar-shader)' }}
                />
              </div>
            )}
            {triggeredSteps.includes(1) && (
              <div className="absolute left-[3%] bottom-[15%] w-[212px] h-[212px] pointer-events-none z-[21] flex items-center justify-center">
                <img
                  src={profile.spriteSrc}
                  alt="Juicio Marcial"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyMaceSmashLeft_0.48s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: 'url(#enemy-vfx-icespear-crimson-shader)' }}
                />
              </div>
            )}
          </>
        )}

        {/* EMBESTIDA DE ESCUDO / BARRERA DE BROQUEL */}
        {isMode('shield_bash') &&
          triggeredSteps.map((idx) => (
            <div
              key={`shield-bash-${vfxKey}-${idx}`}
              className="absolute left-[4.5%] bottom-[19%] w-[184px] h-[184px] pointer-events-none z-20 flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Embestida de Escudo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyShieldBashLeft_0.44s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* MURO INFRANQUEABLE DE ACERO (Espadachín Ult: Escudo + Doble Tajo) */}
        {isMode('shield_sword_ult') && (
          <>
            {triggeredSteps.includes(0) && (
              <div className="absolute left-[5%] bottom-[19%] w-[182px] h-[182px] pointer-events-none z-20 flex items-center justify-center">
                <img
                  src={profile.secondarySpriteSrc ?? '/assets/combat/guardia_vfx_escudo_embestida.webp'}
                  alt="Muro de Escudo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyShieldBashLeft_0.42s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: 'url(#enemy-vfx-icespear-shield-shader)' }}
                />
              </div>
            )}
            {SLASH_DOUBLE.map((s, idx) =>
              triggeredSteps.includes(idx + 1) ? (
                <div
                  key={`sword-ult-${vfxKey}-${idx}`}
                  className="absolute flex items-center justify-center pointer-events-none z-[21] overflow-visible"
                  style={{
                    left: `${s.leftPct}%`,
                    bottom: `${s.bottomPct}%`,
                    width: `${s.widthPx + 14}px`,
                    height: `${s.widthPx + 14}px`,
                    transform: `rotate(${s.rotateDeg}deg) ${s.flipY ? 'scaleY(-1)' : ''}`,
                  }}
                >
                  <div className="relative w-full h-full overflow-visible">
                    <img
                      src={profile.spriteSrc}
                      alt="Tajo de Acero"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain animate-[enemyClawSlashSweep_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                      style={{ filter: 'url(#enemy-vfx-icespear-steel-shader)' }}
                    />
                    <img
                      src={profile.spriteSrc}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{
                        mixBlendMode: 'screen',
                        WebkitMaskImage:
                          'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                        maskImage:
                          'linear-gradient(105deg, transparent 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 52%, transparent 78%)',
                        WebkitMaskSize: '230% 100%',
                        maskSize: '230% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        animation:
                          'enemyClawSlashSweep 0.4s cubic-bezier(0.16,1,0.3,1) forwards, enemyEnergySweep 0.36s ease-out forwards',
                      }}
                    />
                  </div>
                </div>
              ) : null
            )}
          </>
        )}

        {/* LANZAS Y PATAS DE AIRE TRIANGULAR (Lanzas + Araknoide Delgado Ovíparo) */}
        {isMode('spear_thrust') &&
          renderProjectileWave(
            isUlt ? SPEAR_TRIPLE : SPEAR_SINGLE,
            profile.spriteSrc,
            'spear',
            { flipImgX: false }
          )}
        {isMode('spear_vanguard_ult') &&
          renderProjectileWave(
            isUlt ? SPEAR_TRIPLE : SPEAR_DOUBLE,
            profile.spriteSrc,
            'spear-ult',
            { flipImgX: false }
          )}
        {isMode('oviparo_dual_spears') &&
          renderProjectileWave(
            isUlt ? OVIPARO_DUAL_LEGS_ULT : OVIPARO_DUAL_LEGS,
            profile.spriteSrc,
            'oviparo-legs',
            { flipImgX: false }
          )}

        {/* BALLESTEROS Y TIRADORES: FLECHAS / VIROTES SIMPLES SIN EFECTOS (+ onomatopeya) */}
        {(isMode('arrow_shot') || isMode('crossbow_bolt')) &&
          renderProjectileWave(
            isUlt ? BOLT_VOLLEY : BOLT_SINGLE,
            profile.spriteSrc,
            'bolt',
            { flipImgX: false }
          )}

        {/* TIRACHINAS / HONDA (Goblin Honda: una piedra con estela + ¡CRACK!) */}
        {isMode('sling_stone') &&
          renderProjectileWave(
            STONE_SINGLE,
            profile.spriteSrc,
            'stone',
            { arc: true }
          )}

        {/* GRANADA ALQUÍMICA (Hobgoblin Fase 2) */}
        {isMode('grenade_throw') &&
          renderProjectileWave(
            isUlt ? BOMB_ULT : BOMB_SINGLE,
            profile.spriteSrc,
            'bomb',
            { arc: true, spin: true }
          )}

        {/* TRABUCO (Hobgoblin Fase 3) */}
        {isMode('blunderbuss_shot') && (
          <>
            {triggeredSteps.includes(0) && (
              <div className="absolute right-[21%] bottom-[35%] w-[104px] h-[104px] pointer-events-none z-[22] flex items-center justify-center">
                <img
                  src="/assets/combat/kairon_vfx_muzzle.webp"
                  alt="Fogonazo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyMuzzlePop_0.32s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ transform: 'scaleX(-1)', filter: filterUrl }}
                />
              </div>
            )}
            {renderProjectileWave(
              isUlt ? BOLT_VOLLEY : BOLT_SINGLE,
              isUlt ? '/assets/combat/prometeo_vfx_fire_bolt.webp' : profile.spriteSrc,
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

        {/* MORDISCO ARAKNOIDE VORAZ / BERSERKER / ANCESTRAL */}
        {isMode('fang_bite') &&
          triggeredSteps.map((idx) => (
            <div
              key={`bite-${vfxKey}-${idx}`}
              className="absolute left-[4.8%] bottom-[18.5%] w-[184px] h-[184px] pointer-events-none z-20 flex items-center justify-center"
            >
              <div className="relative w-full h-full overflow-visible">
                <img
                  src={profile.spriteSrc}
                  alt="Mordisco"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyFangClamp_0.44s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: filterUrl }}
                />
                {profile.energyGlint && (
                  <img
                    src={profile.spriteSrc}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{
                      ...GLINT_MASK_STYLE,
                      animation:
                        'enemyFangClamp 0.44s cubic-bezier(0.16,1,0.3,1) forwards, enemyEnergySweep 0.36s ease-out forwards',
                    }}
                  />
                )}
              </div>
            </div>
          ))}

        {/* MORDISCO VAMPÍRICO CON MANDÍBULAS DEL DEVORADOR F2 */}
        {isMode('lifesteal_bite') &&
          triggeredSteps.map((idx) => (
            <div
              key={`devorador-mordisco-${vfxKey}-${idx}`}
              className="absolute left-[3.6%] bottom-[19%] w-[204px] h-[186px] pointer-events-none z-[23] flex items-center justify-center"
            >
              <img
                src={profile.spriteSrc}
                alt="Mordisco del Devorador"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-[enemyPokemonBiteClamp_0.48s_cubic-bezier(0.16,1,0.3,1)_forwards]"
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
                left: `${4.5 + idx * 3.5}%`,
                bottom: `${21 + idx * 4}%`,
                width: '198px',
                height: '126px',
              }}
            >
              <div
                className="relative w-full h-full overflow-visible"
                style={{ transform: 'rotate(-54deg)' }}
              >
                <img
                  src={profile.spriteSrc}
                  alt="Empalamiento"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain animate-[enemyCeilingPlunge_0.42s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{ filter: filterUrl }}
                />
                {profile.energyGlint && (
                  <img
                    src={profile.spriteSrc}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{
                      ...GLINT_MASK_STYLE,
                      animation:
                        'enemyCeilingPlunge 0.42s cubic-bezier(0.16,1,0.3,1) forwards, enemyEnergySweep 0.36s ease-out forwards',
                    }}
                  />
                )}
              </div>
            </div>
          ))}

        {/* RAYOS (Medusa y Titán Melenudo) */}
        {(isMode('lightning_bolt') || isMode('lightning_slam')) &&
          renderBoltWave(isUlt ? BOLTS_ULT : BOLTS_NORMAL, profile.spriteSrc, 'bolt')}

        {/* RAYO DEL GOBLIN CHAMÁN (estilo Magordito pero más delgado y sin almas) */}
        {isMode('shaman_lightning') &&
          triggeredSteps.map((idx) => (
            <div
              key={`shaman-rayo-${vfxKey}-${idx}`}
              style={{ left: 'calc(6.5% + 74.5px)', bottom: 'calc(5% + 2px)' }}
              className={`absolute -translate-x-1/2 flex items-end justify-center pointer-events-none z-20 ${
                isUlt ? 'w-[144px] h-[332px]' : 'w-[124px] h-[296px]'
              }`}
            >
              <div
                className={`absolute bottom-[6px] rounded-full border-2 animate-[enemyShamanRayoGroundRing_0.95s_ease-out_forwards] ${
                  isUlt
                    ? 'w-[152px] h-[38px] border-[#a7f3d0] bg-[#10b981]/18 shadow-[0_0_22px_#34d399]'
                    : 'w-[130px] h-[32px] border-[#6ee7b7] bg-[#10b981]/14 shadow-[0_0_18px_#34d399]'
                }`}
              />
              <img
                src={profile.spriteSrc}
                alt="Rayo del Chamán"
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-contain animate-[enemyShamanRayoStrike_0.96s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ filter: filterUrl }}
              />
            </div>
          ))}

        {/* ALIENTO DE NIEBLA PETRIFICANTE DEL GORGON (Nace en su boca y envuelve al héroe sin cortarse) */}
        {isMode('mist_breath') &&
          triggeredSteps.map((idx) => {
            const mouthPxX = launchMouth.x * arenaBox.w;
            const mouthPxY = launchMouth.y * arenaBox.h;
            const heroLeftMargin = 14;
            const mistW = Math.max(176, Math.min(285, Math.round(mouthPxX - heroLeftMargin)));
            const mistH = Math.round(mistW * 0.592);
            return (
              <div
                key={`mist-breath-${vfxKey}-${idx}`}
                className="absolute pointer-events-none z-[22] overflow-visible"
                style={{
                  left: `${Math.round(mouthPxX - mistW + 10)}px`,
                  top: `${Math.round(mouthPxY - mistH * 0.5)}px`,
                  width: `${mistW}px`,
                  height: `${mistH}px`,
                }}
              >
                <div
                  className="relative w-full h-full overflow-visible"
                  style={{ transformOrigin: 'right center' }}
                >
                  <img
                    src={profile.spriteSrc}
                    alt="Niebla Petrificante"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain animate-[enemyMistBreathFromMouth_0.66s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                    style={{ transformOrigin: 'right center', filter: filterUrl }}
                  />
                  {profile.energyGlint && (
                    <img
                      src={profile.spriteSrc}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{
                        ...GLINT_MASK_STYLE,
                        transformOrigin: 'right center',
                        animation:
                          'enemyMistBreathFromMouth 0.66s cubic-bezier(0.16,1,0.3,1) forwards, enemyEnergySweep 0.48s ease-out forwards',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

        {/* IMPACTO LIMPIO SOBRE EL HÉROE (omitido en lanzas, espadas limpias, ballestas, flechas, garrote y rayo del chamán) */}
        {triggeredImpact && !omitGenericImpact && (
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

        {/* ONOMATOPEYA CÓMICA PRINCIPAL */}
        {triggeredOno && activePrimaryOnoSrc && (
          <div className="absolute left-[5.5%] bottom-[47%] w-[126px] h-[72px] pointer-events-none z-[25] flex items-center justify-center">
            <img
              src={activePrimaryOnoSrc}
              alt="Onomatopeya"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain animate-[enemyOnoPop_0.42s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
              style={{ filter: onoRimFilter }}
            />
          </div>
        )}

        {/* SEGUNDA ONOMATOPEYA ESCALONADA PARA ULTIMATES */}
        {triggeredUltOno && activeSecondaryOnoSrc && (
          <div className="absolute left-[13%] bottom-[38%] w-[134px] h-[76px] pointer-events-none z-[26] flex items-center justify-center">
            <img
              src={activeSecondaryOnoSrc}
              alt="Onomatopeya Ultimate"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain animate-[enemyOnoPop_0.44s_cubic-bezier(0.22,1.28,0.36,1)_forwards]"
              style={{ filter: onoRimFilter }}
            />
          </div>
        )}
      </div>
    </>
  );
};
