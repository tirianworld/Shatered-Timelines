import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import {
  Trophy,
  Sparkles,
  Zap,
  Package,
  X,
  Shield,
  Skull,
  Eye,
  Info,
  BookOpen,
  ChevronRight,
  Swords,
  Activity,
  Flame,
} from 'lucide-react';
import {
  GachaEffectType,
  ActiveGachaEffect,
  GACHA_EFFECTS_CATALOG,
  stackGachaEffect,
  tickGachaEffects,
} from '../types/gachaCombatEffects';
import {
  DndDamageType,
  DND_DAMAGE_TYPES_REGISTRY,
  evaluateDndDamageMechanic,
} from '../types/dndCombatDamage';
import { CartoonFxAnimatedSpriteOverlay } from './CartoonFxAnimatedSpriteOverlay';
import { AshDisintegrationEffect } from './AshDisintegrationEffect';
import { DndDamageCodexModal } from './DndDamageCodexModal';
import { CombatInventoryModal } from './CombatInventoryModal';
import {
  ActiveCombatFoodBuff,
  CombatConsumableDefinition,
} from '../types/combatConsumables';
import { loadTavernCookingStock, saveTavernCookingStock } from '../data/cookingData';

export interface GachaSkillEffectApplication {
  type: GachaEffectType;
  duration: number;
  stacks: number;
  target: 'enemy' | 'hero';
}

export interface CardTierInfo {
  tier: number; // 1 = Bronze, 2 = Silver, 3 = Gold
  frameName: string;
  image: string;
  damage: number;
  heal?: number;
  title: string;
  description: string;
  gachaEffectBadge: string;
  gachaEffectsApplied: GachaSkillEffectApplication[];
  dndConditionBadge?: string;
  dndConditionsApplied?: GachaSkillEffectApplication[];
  dndDamageType?: DndDamageType;
}

export interface SkillDefinition {
  id: string;
  name: string;
  type: 'attack' | 'magic' | 'drain' | 'buff';
  sfx: string;
  dndDamageType: DndDamageType;
  tiers: {
    1: CardTierInfo;
    2: CardTierInfo;
    3: CardTierInfo;
  };
}

// Magordito's Combat Deck: Authentic Gacha RPG Skills with Electric Cyan VFX & Tactical Buffs/Debuffs
export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
  rayo_necrotico: {
    id: 'rayo_necrotico',
    name: 'Rayo Voltaico',
    type: 'attack',
    sfx: 'necrotic',
    dndDamageType: 'lightning',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/ui/rayo_necrotico.png',
        damage: 14,
        title: 'Rayo Voltaico',
        description: '⚡ [RELÁMPAGO]: Rayo verde descendente con impacto 3D y estallido cósmico (+25% crítico).',
        gachaEffectBadge: '⚡ Relámpago • Rayo CFXR + Ruptura DEF (-25%)',
        gachaEffectsApplied: [
          { type: 'def_break', duration: 2, stacks: 1, target: 'enemy' },
        ],
        dndDamageType: 'lightning',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/ui/rayo_necrotico_tier_2.png',
        damage: 27,
        title: 'Rayo Voltaico II',
        description: '⚡ [RELÁMPAGO]: Trueno doble con detonación 3D cian y sobrecarga paralisante.',
        gachaEffectBadge: '⚡ Relámpago • Sobrecarga 3D + Ruptura DEF II (-40%)',
        gachaEffectsApplied: [
          { type: 'def_break', duration: 2, stacks: 2, target: 'enemy' },
          { type: 'paralyze', duration: 1, stacks: 1, target: 'enemy' },
        ],
        dndDamageType: 'lightning',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/ui/rayo_necrotico_tier_3.png',
        damage: 48,
        title: 'Rayo Voltaico III',
        description: '⚡ [RELÁMPAGO]: Cataclismo de trueno CFXR y detonación POW con parálisis total garantizada.',
        gachaEffectBadge: '⚡ Relámpago • Detonación POW + Ruptura DEF III (-60%)',
        gachaEffectsApplied: [
          { type: 'paralyze', duration: 2, stacks: 1, target: 'enemy' },
          { type: 'def_break', duration: 3, stacks: 3, target: 'enemy' },
        ],
        dndDamageType: 'lightning',
      },
    },
  },
  dios_oscuro: {
    id: 'dios_oscuro',
    name: 'Dios Oscuro',
    type: 'magic',
    sfx: 'dark_god',
    dndDamageType: 'necrotic',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/skills/fragmento_del_dios_oscuro.png',
        damage: 12,
        title: 'Fragmento Dios Oscuro',
        description: '💀 [NECRÓTICO]: Drenaje vampírico de vitalidad (restaura 35% de vida) y marchitamiento.',
        gachaEffectBadge: '💀 Necrótico • Drenaje Vampírico + ATK Down (-25%)',
        gachaEffectsApplied: [
          { type: 'atk_down', duration: 2, stacks: 1, target: 'enemy' },
        ],
        dndDamageType: 'necrotic',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/skills/fragmento_del_dios_oscuro_tier_2.png',
        damage: 25,
        title: 'Fragmento Dios Oscuro II',
        description: '💀 [NECRÓTICO]: Sifón de ánimas que erosiona el ataque e inocula marchitamiento.',
        gachaEffectBadge: '💀 Necrótico • Gran Drenaje + ⚔️ ATK Down II (-40%)',
        gachaEffectsApplied: [
          { type: 'atk_down', duration: 2, stacks: 2, target: 'enemy' },
          { type: 'decay', duration: 2, stacks: 1, target: 'enemy' },
        ],
        dndDamageType: 'necrotic',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/skills/fragmento_del_dios_oscuro_tier_3.png',
        damage: 46,
        title: 'Fragmento Dios Oscuro III',
        description: '💀 [NECRÓTICO]: Colapso del alma enemiga con drenaje vampírico supremo.',
        gachaEffectBadge: '💀 Necrótico • Drenaje Supremo + Marchitamiento Triple',
        gachaEffectsApplied: [
          { type: 'atk_down', duration: 3, stacks: 3, target: 'enemy' },
          { type: 'decay', duration: 3, stacks: 2, target: 'enemy' },
        ],
        dndDamageType: 'necrotic',
      },
    },
  },
  drenar_maldiciones: {
    id: 'drenar_maldiciones',
    name: 'Peste Tóxica',
    type: 'drain',
    sfx: 'drain',
    dndDamageType: 'poison',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/items/drenar_maldiciones.png',
        damage: 8,
        heal: 10,
        title: 'Peste Tóxica',
        description: '☣️ [VENENO]: Neurotoxina que merma vitalidad por turno e inhibe curaciones un 50%.',
        gachaEffectBadge: '☣️ Veneno • Neurotoxina DoT + Anti-Curación (-50%)',
        gachaEffectsApplied: [
          { type: 'poison', duration: 3, stacks: 1, target: 'enemy' },
        ],
        dndDamageType: 'poison',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/items/drenar_maldiciones_tier_2.png',
        damage: 16,
        heal: 18,
        title: 'Peste Tóxica II',
        description: '☣️ [VENENO]: Doble carga neurotóxica acumulable con lixiviado celular.',
        gachaEffectBadge: '☣️ Veneno • Neurotoxina x2 + Inhibición Sanación',
        gachaEffectsApplied: [
          { type: 'poison', duration: 3, stacks: 2, target: 'enemy' },
        ],
        dndDamageType: 'poison',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/items/drenar_maldiciones_tier_3.png',
        damage: 30,
        heal: 30,
        title: 'Peste Tóxica III',
        description: '☣️ [VENENO]: Peste tóxica masiva triple con anulación total de curación.',
        gachaEffectBadge: '☣️ Veneno • Peste Tóxica x3 + Súper Curación + ATK UP',
        gachaEffectsApplied: [
          { type: 'poison', duration: 4, stacks: 3, target: 'enemy' },
          { type: 'atk_buff', duration: 2, stacks: 1, target: 'hero' },
        ],
        dndDamageType: 'poison',
      },
    },
  },
  fortalecer_marioneta: {
    id: 'fortalecer_marioneta',
    name: 'Tajo Lacerante',
    type: 'buff',
    sfx: 'skill',
    dndDamageType: 'slashing',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/skills/fortalecer_marioneta.png',
        damage: 13,
        title: 'Tajo Lacerante',
        description: '⚔️ [CORTANTE]: Laceración que amplifica todo el daño recibido en un +15% por acumulación.',
        gachaEffectBadge: '⚔️ Cortante • Laceración (+15% Daño Recibido) + ATK UP',
        gachaEffectsApplied: [
          { type: 'laceration', duration: 3, stacks: 1, target: 'enemy' },
          { type: 'atk_buff', duration: 2, stacks: 1, target: 'hero' },
        ],
        dndDamageType: 'slashing',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/skills/fortalecer_marioneta_tier_2.png',
        damage: 27,
        title: 'Tajo Lacerante II',
        description: '⚔️ [CORTANTE]: Doble laceración en cadena para combos destructivos.',
        gachaEffectBadge: '⚔️ Cortante • Laceración x2 (+30% DMG) + ATK UP II',
        gachaEffectsApplied: [
          { type: 'laceration', duration: 3, stacks: 2, target: 'enemy' },
          { type: 'atk_buff', duration: 2, stacks: 2, target: 'hero' },
        ],
        dndDamageType: 'slashing',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/skills/fortalecer_marioneta_tier_3.png',
        damage: 48,
        title: 'Tajo Lacerante III',
        description: '⚔️ [CORTANTE]: Desgarro supremo que desangra y expone puntos críticos.',
        gachaEffectBadge: '⚔️ Cortante • Laceración x3 (+45% DMG) + Furia Crítica',
        gachaEffectsApplied: [
          { type: 'laceration', duration: 4, stacks: 3, target: 'enemy' },
          { type: 'atk_buff', duration: 3, stacks: 3, target: 'hero' },
          { type: 'haste', duration: 2, stacks: 2, target: 'hero' },
        ],
        dndDamageType: 'slashing',
      },
    },
  },
  cataclismo_astral: {
    id: 'cataclismo_astral',
    name: 'Cataclismo Astral',
    type: 'attack',
    sfx: 'powerup',
    dndDamageType: 'force',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Definitivo',
        image: '/assets/skills/smite_celestial_tier_3.png',
        damage: 95,
        title: '★ Cataclismo Astral ★',
        description: '🔮 [FUERZA]: MOVIMIENTO DEFINITIVO: Pura energía arcana. Ignora el 100% de escudos y aturde.',
        gachaEffectBadge: '🔮 Fuerza • Daño Puro Ineludible (95 DAÑO) + Aturdimiento',
        gachaEffectsApplied: [
          { type: 'stun', duration: 2, stacks: 1, target: 'enemy' },
          { type: 'def_break', duration: 3, stacks: 3, target: 'enemy' },
        ],
        dndDamageType: 'force',
      },
      2: {
        tier: 2,
        frameName: 'Definitivo',
        image: '/assets/skills/smite_celestial_tier_3.png',
        damage: 95,
        title: '★ Cataclismo Astral ★',
        description: '🔮 [FUERZA]: MOVIMIENTO DEFINITIVO: Desata furia cósmica ineludible.',
        gachaEffectBadge: '🔮 Fuerza • Daño Puro Ineludible (95 DAÑO) + Aturdimiento',
        gachaEffectsApplied: [
          { type: 'stun', duration: 2, stacks: 1, target: 'enemy' },
          { type: 'def_break', duration: 3, stacks: 3, target: 'enemy' },
        ],
        dndDamageType: 'force',
      },
      3: {
        tier: 3,
        frameName: 'Definitivo',
        image: '/assets/skills/smite_celestial_tier_3.png',
        damage: 95,
        title: '★ Cataclismo Astral ★',
        description: '🔮 [FUERZA]: MOVIMIENTO DEFINITIVO: Desata furia cósmica ineludible.',
        gachaEffectBadge: '🔮 Fuerza • Daño Puro Ineludible (95 DAÑO) + Aturdimiento',
        gachaEffectsApplied: [
          { type: 'stun', duration: 2, stacks: 1, target: 'enemy' },
          { type: 'def_break', duration: 3, stacks: 3, target: 'enemy' },
        ],
        dndDamageType: 'force',
      },
    },
  },
  ataque_furtivo: {
    id: 'ataque_furtivo',
    name: 'Ataque Furtivo',
    type: 'attack',
    sfx: 'attack',
    dndDamageType: 'slashing',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/items/dagas_electrum.png',
        damage: 16,
        title: 'Ataque Furtivo',
        description: '⚔️ [CORTANTE]: Estocada rápida con dagas gemelas que golpea puntos vitales.',
        gachaEffectBadge: '⚔️ Cortante • Doble Estocada Rápida',
        gachaEffectsApplied: [],
        dndDamageType: 'slashing',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/items/dagas_plata.png',
        damage: 29,
        title: 'Danza de Dagas II',
        description: '⚔️ [CORTANTE]: Combinación veloz de cortes que fractura la defensa enemiga.',
        gachaEffectBadge: '⚔️ Cortante • Fractura DEF (-30%) + Sangrado',
        gachaEffectsApplied: [
          { type: 'def_break', duration: 2, stacks: 1, target: 'enemy' },
        ],
        dndDamageType: 'slashing',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/items/dagas_oro.png',
        damage: 52,
        title: 'Asalto Fantasmal III',
        description: '⚔️ [FUERZA / CORTANTE]: Embestida con alas esmeralda que desgarra al rival con golpe crítico garantizado.',
        gachaEffectBadge: '⚔️ Crítico Letal • Alas Esmeralda + Ruptura Total',
        gachaEffectsApplied: [
          { type: 'def_break', duration: 3, stacks: 2, target: 'enemy' },
          { type: 'laceration', duration: 3, stacks: 2, target: 'enemy' },
        ],
        dndDamageType: 'slashing',
      },
    },
  },
  contraataque: {
    id: 'contraataque',
    name: 'Contraataque',
    type: 'buff',
    sfx: 'skill',
    dndDamageType: 'piercing',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/items/edacorn contra ataque.png',
        damage: 12,
        title: 'Postura de Contraataque',
        description: '🛡️ [RÉPLICA]: Edacorn adopta guardia baja. Si el enemigo ataca, responde instantáneamente con un contragolpe.',
        gachaEffectBadge: '🛡️ Contraataque • Réplica Inmediata (22 DMG)',
        gachaEffectsApplied: [
          { type: 'atk_buff', duration: 1, stacks: 1, target: 'hero' },
        ],
        dndDamageType: 'piercing',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/items/edacorn contra ataque tier 2.png',
        damage: 24,
        title: 'Reflejo Letal II',
        description: '🛡️ [RÉPLICA]: Parada perfecta que castiga al agresor con réplica potenciada y desequilibrio.',
        gachaEffectBadge: '🛡️ Contraataque • Réplica Fuerte (36 DMG) + ATK UP',
        gachaEffectsApplied: [
          { type: 'atk_buff', duration: 2, stacks: 2, target: 'hero' },
        ],
        dndDamageType: 'piercing',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/items/edacorn contra ataque tier 3png.png',
        damage: 44,
        title: 'Castigo Espectral III',
        description: '🛡️ [RÉPLICA SUPREMA]: El enemigo cae en la trampa; contraataque fulminante con alas esmeralda.',
        gachaEffectBadge: '🛡️ Contraataque Supremo (55 DMG) + Aturdimiento',
        gachaEffectsApplied: [
          { type: 'stun', duration: 1, stacks: 1, target: 'enemy' },
          { type: 'atk_buff', duration: 3, stacks: 3, target: 'hero' },
        ],
        dndDamageType: 'piercing',
      },
    },
  },
  sigilo: {
    id: 'sigilo',
    name: 'Sigilo Esmeralda',
    type: 'buff',
    sfx: 'laser',
    dndDamageType: 'force',
    tiers: {
      1: {
        tier: 1,
        frameName: 'Bronce',
        image: '/assets/items/edacorn sigilo.png',
        damage: 8,
        title: 'Manto Esmeralda',
        description: '👻 [SIGILO]: Edacorn se vuelve semitransparente. Evita el 100% de los ataques durante 1 turno.',
        gachaEffectBadge: '👻 Intangibilidad • Evasión Absoluta (1 Turno)',
        gachaEffectsApplied: [
          { type: 'haste', duration: 1, stacks: 1, target: 'hero' },
        ],
        dndDamageType: 'force',
      },
      2: {
        tier: 2,
        frameName: 'Plata',
        image: '/assets/items/edacorn sigilo tier 2.png',
        damage: 16,
        heal: 15,
        title: 'Sigilo Fantasmal II',
        description: '👻 [SIGILO]: Desvanecimiento espectral. Inmune a golpes por 1 turno, restaura 15 PV y gana velocidad.',
        gachaEffectBadge: '👻 Evasión Absoluta + Sanación (15 PV) + Celeridad',
        gachaEffectsApplied: [
          { type: 'haste', duration: 2, stacks: 2, target: 'hero' },
          { type: 'atk_buff', duration: 2, stacks: 1, target: 'hero' },
        ],
        dndDamageType: 'force',
      },
      3: {
        tier: 3,
        frameName: 'Oro',
        image: '/assets/items/edacorn sigilo tier 3.png',
        damage: 28,
        heal: 25,
        title: 'Inmaterialidad Ancestral III',
        description: '👻 [SIGILO SUPREMO]: Alas esmeralda envuelven su cuerpo. Evasión total, restaura 25 PV y asegura crítico.',
        gachaEffectBadge: '👻 Evasión Absoluta + Sanación (25 PV) + Furia Crítica',
        gachaEffectsApplied: [
          { type: 'haste', duration: 2, stacks: 3, target: 'hero' },
          { type: 'atk_buff', duration: 3, stacks: 2, target: 'hero' },
        ],
        dndDamageType: 'force',
      },
    },
  },
};

export interface ActiveCombatCard {
  instanceId: string;
  skillId: string;
  tier: 1 | 2 | 3;
}

interface FloatingText {
  id: number;
  text: string;
  isEnemy: boolean;
  isHeal?: boolean;
  tier?: 1 | 2 | 3;
  isCrit?: boolean;
  slotIndex?: number;
  dndType?: DndDamageType;
  badgeText?: string;
  badgeColor?: string;
}

interface MergeAnimation {
  targetSlot: number;
  newTier: 2 | 3;
}

export type CombatVfxType =
  | 'none'
  | 'rayo_necrotico'
  | 'dios_oscuro'
  | 'drenar_maldiciones'
  | 'fortalecer_marioneta'
  | 'martillo_titan'
  | 'estocada_sombra'
  | 'llamarada_infernal'
  | 'lanza_glacial'
  | 'estallido_sonico'
  | 'lluvia_caustica'
  | 'chispa_sagrada'
  | 'pulso_mental'
  | 'cataclismo_astral'
  | 'ataque_furtivo'
  | 'contraataque'
  | 'sigilo'
  | 'araknoide_claw'
  | 'araknoide_silk'
  | 'araknoide_death'
  | 'medusa_electric'
  | 'medusa_sting';

export interface CombatVfxState {
  type: CombatVfxType;
  tier: 1 | 2 | 3;
}

export type CombatEnemyId =
  | 'araknoide_rojo'
  | 'araknoide_azul'
  | 'araknoide_glacial'
  | 'araknoide_voraz'
  | 'araknoide_espinoso'
  | 'araknoide_oviparo'
  | 'semiboss_zancudo'
  | 'semiboss_melenudo'
  | 'araknoide'
  | 'medusa'
  | 'guardia_lanza'
  | 'guardia_espada'
  | 'guardia_ballesta'
  | 'guardia_pesado'
  | 'goblin_daga'
  | 'goblin_honda'
  | 'goblin_garrote'
  | 'goblin_chaman'
  | 'devorador_quitinoso'
  | 'devorador_quitinoso_p2'
  | 'bandido_daga'
  | 'bandido_tirador'
  | 'bandido_lider'
  | 'orco_lanza'
  | 'orco_hacha'
  | 'orco_caudillo';

export interface EnemyConfig {
  id: CombatEnemyId;
  missionId: string;
  name: string;
  title: string;
  chamberName: string;
  chamberNumber: number;
  spriteUrl: string;
  attackSpriteUrl?: string;
  hurtSpriteUrl?: string;
  thumbUrl: string;
  maxHp: number;
  width: number;
  height: number;
  scaleClass: string;
  isBoss: boolean;
  isSemiboss: boolean;
  hasPhaseTwo?: boolean;
  normalSkill: {
    name: string;
    desc: string;
    damage: [number, number];
    vfx:
      | 'araknoide_claw'
      | 'araknoide_silk'
      | 'medusa_electric'
      | 'medusa_sting'
      | 'earth_titan'
      | 'crimson_claw'
      | 'frost_blizzard'
      | 'shadow_needle'
      | 'void_miasma'
      | 'gorgon_lightning';
    sfx: string;
    dndDamageType: DndDamageType;
    condition?: {
      type: GachaEffectType;
      duration: number;
      stacks: number;
      title: string;
    };
  };
  specialSkill: {
    name: string;
    desc: string;
    damage: [number, number];
    vfx:
      | 'araknoide_claw'
      | 'araknoide_silk'
      | 'medusa_electric'
      | 'medusa_sting'
      | 'earth_titan'
      | 'crimson_claw'
      | 'frost_blizzard'
      | 'shadow_needle'
      | 'void_miasma'
      | 'gorgon_lightning';
    sfx: string;
    dndDamageType: DndDamageType;
    condition?: {
      type: GachaEffectType;
      duration: number;
      stacks: number;
      title: string;
    };
  };
  ultimateSkill: {
    name: string;
    desc: string;
    damage: number;
    sfx?: string;
    dndDamageType: DndDamageType;
    condition: {
      type: GachaEffectType;
      duration: number;
      stacks: number;
      title: string;
    };
  };
  rewards: {
    gold: number;
    crystals: number;
    item: {
      id: string;
      name: string;
      rarity: 'SR' | 'SSR';
      count: number;
      icon: string;
      description: string;
    };
  };
}

export const DUNGEON_ENEMIES: Record<CombatEnemyId, EnemyConfig> = {
  araknoide_rojo: {
    id: 'araknoide_rojo',
    missionId: 'm3_cuevas_rojo',
    name: 'Araknoide Carmesí',
    title: 'Vanguardia • Bruto Muscular',
    chamberName: 'Sala I: Nido de Sangre',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/araknoide_rojo_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_rojo_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_rojo_hurt.png',
    thumbUrl: '/assets/combat/araknoide_rojo_thumb.png',
    maxHp: 52,
    width: 139,
    height: 192,
    scaleClass: 'w-[139px] h-[192px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Desgarrón Demoledor',
      desc: 'Golpea con sus bíceps y garras reforzadas fracturando armaduras.',
      damage: [12, 16],
      vfx: 'araknoide_claw',
      sfx: 'attack',
      dndDamageType: 'slashing',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 1,
        title: 'Ruptura Carmesí',
      },
    },
    specialSkill: {
      name: 'Furia Berserker',
      desc: 'Inocula sangre ponzoñosa en un arrebato salvaje de furia quitinosa.',
      damage: [15, 19],
      vfx: 'araknoide_claw',
      sfx: 'skill',
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'poison',
        duration: 2,
        stacks: 2,
        title: 'Desgarro Sangriento',
      },
    },
    ultimateSkill: {
      name: 'Embestida Desgarradora Berserk',
      desc: 'Carga frontal con toda su masa muscular provocando aturdimiento.',
      damage: 24,
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Aturdimiento Demoledor',
      },
    },
    rewards: {
      gold: 1600,
      crystals: 80,
      item: {
        id: 'quitina_carmesi',
        name: 'Quitina Carmesí Fortificada',
        rarity: 'SSR',
        count: 2,
        icon: '/assets/items/fragmento_de_quitina.png',
        description: 'Caparazón rojo ultra resistente obtenido del Araknoide Berserker de las grutas.',
      },
    },
  },
  araknoide_voraz: {
    id: 'araknoide_voraz',
    missionId: 'm3_cuevas_rojo',
    name: 'Araknoide Voraz',
    title: 'Depredador Carmesí • Fauces Carnívoras',
    chamberName: 'Cueva de Huevos Carmesís',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/araknoide_voraz_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_voraz_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_voraz_hurt.png',
    thumbUrl: '/assets/combat/araknoide_voraz_thumb.png',
    maxHp: 48,
    width: 140,
    height: 192,
    scaleClass: 'w-[140px] h-[192px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Mandíbula Descuartizadora',
      desc: 'Muerde con voracidad desgarrando la carne y aplicando laceración.',
      damage: [10, 14],
      vfx: 'araknoide_claw',
      sfx: 'attack',
      dndDamageType: 'piercing',
      condition: {
        type: 'laceration',
        duration: 2,
        stacks: 1,
        title: 'Desgarro Voraz',
      },
    },
    specialSkill: {
      name: 'Festín Sanguinario',
      desc: 'Se nutre de restos frescos devorando con saña y aumentando su ataque.',
      damage: [13, 17],
      vfx: 'araknoide_claw',
      sfx: 'skill',
      dndDamageType: 'slashing',
      condition: {
        type: 'atk_buff',
        duration: 2,
        stacks: 1,
        title: 'Frenesí Carnívoro',
      },
    },
    ultimateSkill: {
      name: 'Dentellada Brutal',
      desc: 'Salto violento con todas las fauces abiertas infligiendo gran daño.',
      damage: 22,
      dndDamageType: 'piercing',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Mordisco Paralizante',
      },
    },
    rewards: {
      gold: 1400,
      crystals: 60,
      item: {
        id: 'mandibula_voraz',
        name: 'Mandíbula de Araknoide Voraz',
        rarity: 'SR',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        description: 'Fauces afiladas empapadas en icor carmesí.',
      },
    },
  },
  araknoide_espinoso: {
    id: 'araknoide_espinoso',
    missionId: 'm3_cuevas_rojo',
    name: 'Araknoide Espinoso',
    title: 'Acorazado de Púas • Caparazón Rojo',
    chamberName: 'Cueva de Huevos Carmesís',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/araknoide_espinoso_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_espinoso_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_espinoso_hurt.png',
    thumbUrl: '/assets/combat/araknoide_espinoso_thumb.png',
    maxHp: 54,
    width: 145,
    height: 192,
    scaleClass: 'w-[145px] h-[192px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Salva de Espinas',
      desc: 'Dispara púas quitinosas afiladas como estiletes.',
      damage: [11, 15],
      vfx: 'shadow_needle',
      sfx: 'laser',
      dndDamageType: 'piercing',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 1,
        title: 'Puntada Perforante',
      },
    },
    specialSkill: {
      name: 'Empalamiento Óseo',
      desc: 'Carga frontal enterrando sus aguijones de quitina.',
      damage: [14, 18],
      vfx: 'shadow_needle',
      sfx: 'attack',
      dndDamageType: 'piercing',
      condition: {
        type: 'poison',
        duration: 2,
        stacks: 1,
        title: 'Púa Tóxica',
      },
    },
    ultimateSkill: {
      name: 'Erupción de Púas Carmesí',
      desc: 'Detonación de aguijones que satura el área de combate.',
      damage: 25,
      dndDamageType: 'piercing',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 2,
        title: 'Coraza Quebrantada',
      },
    },
    rewards: {
      gold: 1500,
      crystals: 70,
      item: {
        id: 'pua_carmesi',
        name: 'Púa Carmesí Quitinoza',
        rarity: 'SR',
        count: 2,
        icon: '/assets/items/fragmento_de_quitina.png',
        description: 'Espina hiperdura extraída del caparazón del araknoide espinoso.',
      },
    },
  },
  araknoide_oviparo: {
    id: 'araknoide_oviparo',
    missionId: 'm3_cuevas_rojo',
    name: 'Araknoide Ovíparo',
    title: 'Guardián del Nido • Abdomen Carmesí',
    chamberName: 'Cueva de Huevos Carmesís',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/araknoide_oviparo_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_oviparo_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_oviparo_hurt.png',
    thumbUrl: '/assets/combat/araknoide_oviparo_thumb.png',
    maxHp: 44,
    width: 140,
    height: 192,
    scaleClass: 'w-[140px] h-[192px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Escupitajo Cáustico',
      desc: 'Lanza chorros de ácido corrosivo caliente desde su abdomen.',
      damage: [9, 13],
      vfx: 'araknoide_silk',
      sfx: 'drain',
      dndDamageType: 'acid',
      condition: {
        type: 'poison',
        duration: 3,
        stacks: 1,
        title: 'Bilis Cáustica',
      },
    },
    specialSkill: {
      name: 'Eclosión de Huevos Carmesís',
      desc: 'Rompe cáscaras carmesís liberando miasma infecto.',
      damage: [12, 16],
      vfx: 'araknoide_silk',
      sfx: 'skill',
      dndDamageType: 'poison',
      condition: {
        type: 'poison',
        duration: 3,
        stacks: 2,
        title: 'Infección Larvaria',
      },
    },
    ultimateSkill: {
      name: 'Nube de Esporas Carmesís',
      desc: 'Explosión pestilente de feromonas y ácido del nido.',
      damage: 21,
      dndDamageType: 'poison',
      condition: {
        type: 'paralyze',
        duration: 1,
        stacks: 1,
        title: 'Asfixia Ponzoñosa',
      },
    },
    rewards: {
      gold: 1600,
      crystals: 80,
      item: {
        id: 'huevo_carmesi_muestra',
        name: 'Muestra de Huevo Carmesí',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        description: 'Huevo viscoso intacto del nido subterráneo.',
      },
    },
  },
  araknoide_azul: {
    id: 'araknoide_azul',
    missionId: 'm4_cuevas_azul',
    name: 'Acechador Zafiro',
    title: 'Acechador Esbelto Criogénico',
    chamberName: 'Sala II: Grieta Criogénica',
    chamberNumber: 2,
    spriteUrl: '/assets/combat/araknoide_azul_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_azul_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_azul_hurt.png',
    thumbUrl: '/assets/combat/araknoide_azul_thumb.png',
    maxHp: 46,
    width: 135,
    height: 192,
    scaleClass: 'w-[135px] h-[192px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Aguja de Escarcha',
      desc: 'Punción ágil y gélida que reduce la potencia de ataque del rival.',
      damage: [11, 14],
      vfx: 'araknoide_silk',
      sfx: 'laser',
      dndDamageType: 'cold',
      condition: {
        type: 'atk_down',
        duration: 2,
        stacks: 1,
        title: 'Entumecimiento Gélido',
      },
    },
    specialSkill: {
      name: 'Seda Criogénica',
      desc: 'Hilos bajo cero que paralizan las extremidades del objetivo.',
      damage: [13, 17],
      vfx: 'araknoide_silk',
      sfx: 'skill',
      dndDamageType: 'cold',
      condition: {
        type: 'paralyze',
        duration: 1,
        stacks: 1,
        title: 'Congelación de Seda',
      },
    },
    ultimateSkill: {
      name: 'Ventisca Glacial de Seda',
      desc: 'Ráfaga de escarcha que inmoviliza y congela al aventurero.',
      damage: 22,
      dndDamageType: 'cold',
      condition: {
        type: 'paralyze',
        duration: 2,
        stacks: 1,
        title: 'Parálisis Criogénica Absoluta',
      },
    },
    rewards: {
      gold: 2000,
      crystals: 100,
      item: {
        id: 'glandula_zafiro',
        name: 'Glándula de Hielo Zafiro',
        rarity: 'SSR',
        count: 2,
        icon: '/assets/items/arcano_gema_app.png',
        description: 'Órgano criogénico que segrega seda helada indestructible.',
      },
    },
  },
  araknoide_glacial: {
    id: 'araknoide_glacial',
    missionId: 'm4_cuevas_azul',
    name: 'Acechador Glacial',
    title: 'Acechador Criogénico Blindado',
    chamberName: 'Caverna Congelada: Infección Glacial',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/araknoide_glacial_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_glacial_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_glacial_hurt.png',
    thumbUrl: '/assets/combat/araknoide_glacial_thumb.png',
    maxHp: 56,
    width: 145,
    height: 195,
    scaleClass: 'w-[145px] h-[195px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Púa de Permafrost',
      desc: 'Disparo de púas heladas con veneno criogénico que reduce el ataque.',
      damage: [12, 16],
      vfx: 'araknoide_silk',
      sfx: 'laser',
      dndDamageType: 'cold',
      condition: {
        type: 'atk_down',
        duration: 2,
        stacks: 1,
        title: 'Entumecimiento Glacial',
      },
    },
    specialSkill: {
      name: 'Ventisca de Esporas Criogénicas',
      desc: 'Expulsa una nube viral helada que intenta parasitar e inmovilizar a los rivales.',
      damage: [14, 18],
      vfx: 'araknoide_silk',
      sfx: 'skill',
      dndDamageType: 'cold',
      condition: {
        type: 'paralyze',
        duration: 1,
        stacks: 1,
        title: 'Esporas Congelantes',
      },
    },
    ultimateSkill: {
      name: 'Empalamiento Glacial Viral',
      desc: 'Carga frontal con tenazas congeladas para inocular la mutación arácnida.',
      damage: 26,
      dndDamageType: 'cold',
      condition: {
        type: 'paralyze',
        duration: 2,
        stacks: 1,
        title: 'Infección Glacial Crítica',
      },
    },
    rewards: {
      gold: 2200,
      crystals: 100,
      item: {
        id: 'espora_viral_araknoide',
        name: 'Espora Viral Criogénica',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        description: 'Muestra intacta del parásito viral que transforma tejido vivo en quitina arácnida gélida.',
      },
    },
  },
  semiboss_zancudo: {
    id: 'semiboss_zancudo',
    missionId: 'm5_cuevas_zancudo',
    name: 'El Zancudo Espectral',
    title: 'Jefe del Corazón de la Colonia • Tejedora de Espinas Abisales',
    chamberName: 'Entrada al Corazón de la Colonia: Mina Abisal',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/semiboss_zancudo_clean.png',
    attackSpriteUrl: '/assets/combat/semiboss_zancudo_attack.png',
    hurtSpriteUrl: '/assets/combat/semiboss_zancudo_hurt.png',
    thumbUrl: '/assets/combat/semiboss_zancudo_thumb.png',
    maxHp: 125,
    width: 146,
    height: 206,
    scaleClass: 'w-[146px] h-[206px] -translate-y-1.5',
    isBoss: true,
    isSemiboss: false,
    normalSkill: {
      name: 'Empalamiento Cenital',
      desc: 'Cae veloz clavando sus patas larguísimas que perforan cualquier armadura.',
      damage: [15, 19],
      vfx: 'araknoide_claw',
      sfx: 'dark_god',
      dndDamageType: 'piercing',
      condition: {
        type: 'def_break',
        duration: 3,
        stacks: 2,
        title: 'Perforación de Aguja',
      },
    },
    specialSkill: {
      name: 'Red Umbría de Espinas',
      desc: 'Tejido fantasmal que enreda e inocula veneno corrosivo oscuro.',
      damage: [16, 20],
      vfx: 'araknoide_silk',
      sfx: 'necrotic',
      dndDamageType: 'necrotic',
      condition: {
        type: 'poison',
        duration: 3,
        stacks: 2,
        title: 'Veneno de Sombra',
      },
    },
    ultimateSkill: {
      name: 'Danza Espectral de Sombras Largas',
      desc: 'Ataque devastador desde la oscuridad que aturde y drena vitalidad.',
      damage: 28,
      dndDamageType: 'necrotic',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Aturdimiento Espectral',
      },
    },
    rewards: {
      gold: 3200,
      crystals: 150,
      item: {
        id: 'pata_aguja_zancudo',
        name: 'Pata Aguja de Zancudo',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/fragmento_astral.png',
        description: 'Extremidad puntiaguda y letal del Semijefe Zancudo, codiciada por herreros de élite.',
      },
    },
  },
  semiboss_melenudo: {
    id: 'semiboss_melenudo',
    missionId: 'm6_cuevas_titan',
    name: 'El Titán Melenudo',
    title: 'Semijefe • Coloso Bestial Aracnofelino',
    chamberName: 'Sala IV: Foso del Behemoth',
    chamberNumber: 4,
    spriteUrl: '/assets/combat/semiboss_melenudo_clean.png',
    attackSpriteUrl: '/assets/combat/semiboss_melenudo_attack.png',
    hurtSpriteUrl: '/assets/combat/semiboss_melenudo_hurt.png',
    thumbUrl: '/assets/combat/semiboss_melenudo_thumb.png',
    maxHp: 88,
    width: 161,
    height: 202,
    scaleClass: 'w-[161px] h-[202px] scale-105',
    isBoss: false,
    isSemiboss: true,
    normalSkill: {
      name: 'Aplastamiento Sísmico',
      desc: 'Puñetazos descomunales que resquebrajan la roca y desestabilizan al héroe.',
      damage: [17, 21],
      vfx: 'araknoide_claw',
      sfx: 'critical',
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 2,
        title: 'Fisura de Roca',
      },
    },
    specialSkill: {
      name: 'Rugido de Melena Feroz',
      desc: 'Eriza su espesa melena y suelta un rugido ensordecedor que aturde por completo.',
      damage: [15, 19],
      vfx: 'medusa_electric',
      sfx: 'powerup',
      dndDamageType: 'thunder',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Aturdimiento Sísmico',
      },
    },
    ultimateSkill: {
      name: 'Furia del Behemoth Terrestre',
      desc: 'Salto demoledor tipo Hulk que hace temblar la montaña entera.',
      damage: 34,
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Colapso de Caverna',
      },
    },
    rewards: {
      gold: 4000,
      crystals: 200,
      item: {
        id: 'melena_cerdas_titanicas',
        name: 'Melena de Cerdas Titánicas',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/cuero.png',
        description: 'Tupida melena de pelos defensivos del Titán Araknoide. Irradia fuerza bruta colosal.',
      },
    },
  },
  araknoide: {
    id: 'araknoide',
    missionId: 'm7_cuevas_reina',
    name: 'Araknoide Ancestral',
    title: 'Gran Jefe • Soberano de las Profundidades',
    chamberName: 'Sala V: El Corazón del Abismo',
    chamberNumber: 5,
    spriteUrl: '/assets/aistudio/araknoide_clean.png',
    attackSpriteUrl: '/assets/combat/araknoide_attack.png',
    hurtSpriteUrl: '/assets/combat/araknoide_hurt.png',
    thumbUrl: '/assets/aistudio/image_54c3154f.png',
    maxHp: 65,
    width: 136,
    height: 192,
    scaleClass: 'w-[136px] h-[192px]',
    isBoss: true,
    isSemiboss: false,
    hasPhaseTwo: true,
    normalSkill: {
      name: 'Mordisco Venenoso Ancestral',
      desc: 'Mandíbulas curvas cargadas de toxina necrótica subterránea.',
      damage: [14, 18],
      vfx: 'araknoide_claw',
      sfx: 'attack',
      dndDamageType: 'poison',
      condition: {
        type: 'poison',
        duration: 3,
        stacks: 2,
        title: 'Veneno Ancestral',
      },
    },
    specialSkill: {
      name: 'Escupitajo de Seda Cáustico',
      desc: 'Red ácida corrosiva que disuelve defensas y paraliza.',
      damage: [12, 16],
      vfx: 'araknoide_silk',
      sfx: 'skill',
      dndDamageType: 'acid',
      condition: {
        type: 'paralyze',
        duration: 1,
        stacks: 1,
        title: 'Seda Paralizante',
      },
    },
    ultimateSkill: {
      name: 'Arachne Void: Web of Decay',
      desc: 'Invocación del vacío arácnido que corroe masivamente.',
      damage: 24,
      dndDamageType: 'acid',
      condition: {
        type: 'poison',
        duration: 3,
        stacks: 3,
        title: 'Peste de Araknoide',
      },
    },
    rewards: {
      gold: 5000,
      crystals: 300,
      item: {
        id: 'chitin_drop',
        name: 'Quitina de Araknoide',
        rarity: 'SSR',
        count: 3,
        icon: '/assets/items/fragmento_de_quitina.png',
        description: 'Caparazón endurecido obtenido de la bestia abisal de las Cuevas de Icespear.',
      },
    },
  },
  medusa: {
    id: 'medusa',
    missionId: 'm7_cuevas_reina',
    name: 'Medusa Abisal',
    title: 'Fase 2 • Horror Eléctrico Subterráneo',
    chamberName: 'Sala V: El Corazón del Abismo (Fase 2)',
    chamberNumber: 5,
    spriteUrl: '/assets/combat/medusa_clean.png',
    attackSpriteUrl: '/assets/combat/medusa_attack.png',
    hurtSpriteUrl: '/assets/combat/medusa_hurt.png',
    thumbUrl: '/assets/combat/medusa_thumb.png',
    maxHp: 75,
    width: 136,
    height: 192,
    scaleClass: 'w-[136px] h-[192px]',
    isBoss: true,
    isSemiboss: false,
    normalSkill: {
      name: 'Picadura Neurotóxica',
      desc: 'Tentáculos electrificados que inoculan veneno y parálisis.',
      damage: [14, 18],
      vfx: 'medusa_sting',
      sfx: 'skill',
      dndDamageType: 'poison',
      condition: {
        type: 'poison',
        duration: 2,
        stacks: 1,
        title: 'Toxina Eléctrica',
      },
    },
    specialSkill: {
      name: 'Descarga de Tentáculos',
      desc: 'Golpe de descarga bioeléctrica que aturde inmediatamente al rival.',
      damage: [16, 20],
      vfx: 'medusa_electric',
      sfx: 'skill',
      dndDamageType: 'lightning',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Aturdimiento Eléctrico',
      },
    },
    ultimateSkill: {
      name: 'Gorgon Eye: Abyssal Shock',
      desc: 'Sobrecarga psíquica y mental que colapsa los sistemas del oponente.',
      damage: 28,
      dndDamageType: 'psychic',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Sobrecarga Abisal',
      },
    },
    rewards: {
      gold: 5000,
      crystals: 300,
      item: {
        id: 'medusa_core',
        name: 'Tentáculo de Medusa Abisal',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/combat/medusa_thumb.png',
        description: 'Bioluminiscencia viva cargada de plasma de choque y efecto aturdidor.',
      },
    },
  },
  guardia_lanza: {
    id: 'guardia_lanza',
    missionId: 'm2_robo',
    name: 'Lancero de Icespear',
    title: 'Patrulla Urbana • Lanza y Broquel',
    chamberName: 'Oleada 1: Patrulla Callejera',
    chamberNumber: 1,
    spriteUrl: '/assets/combat/guardia_lanza_clean.png',
    attackSpriteUrl: '/assets/combat/guardia_lanza_attack.png',
    hurtSpriteUrl: '/assets/combat/guardia_lanza_hurt.png',
    thumbUrl: '/assets/combat/guardia_lanza_thumb.png',
    maxHp: 48,
    width: 142,
    height: 195,
    scaleClass: 'w-[142px] h-[195px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Estocada de Guardia',
      desc: 'Punta de lanza afilada que busca las junturas de la armadura.',
      damage: [12, 16],
      vfx: 'araknoide_claw',
      sfx: 'attack',
      dndDamageType: 'piercing',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 1,
        title: 'Armadura Traspasada',
      },
    },
    specialSkill: {
      name: 'Barrera de Broquel',
      desc: 'Golpe de escudo con el blasón rúnico que desestabiliza la postura.',
      damage: [14, 18],
      vfx: 'araknoide_claw',
      sfx: 'skill',
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'atk_down',
        duration: 2,
        stacks: 1,
        title: 'Desestabilizado',
      },
    },
    ultimateSkill: {
      name: 'Carga de Vanguardia Urbana',
      desc: 'Aremetida coordinada al grito de ¡Por Icespear! que aturde al objetivo.',
      damage: 24,
      dndDamageType: 'piercing',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Aturdimiento Militar',
      },
    },
    rewards: {
      gold: 1200,
      crystals: 50,
      item: {
        id: 'lanza_guardia_icespear',
        name: 'Lanza de la Guardia Urbana',
        rarity: 'SR',
        count: 1,
        icon: '/assets/combat/guardia_lanza_thumb.png',
        description: 'Lanza forjada en hierro templado perteneciente a la patrulla nocturna de Icespear.',
      },
    },
  },
  guardia_espada: {
    id: 'guardia_espada',
    missionId: 'm2_robo',
    name: 'Espadachín de la Guarnición',
    title: 'Infantería Pesada • Espada Ancha y Escudo Rúnico',
    chamberName: 'Oleada 2: Refuerzos de la Mansión',
    chamberNumber: 2,
    spriteUrl: '/assets/combat/guardia_espada_clean.png',
    attackSpriteUrl: '/assets/combat/guardia_espada_attack.png',
    hurtSpriteUrl: '/assets/combat/guardia_espada_hurt.png',
    thumbUrl: '/assets/combat/guardia_espada_thumb.png',
    maxHp: 58,
    width: 142,
    height: 195,
    scaleClass: 'w-[142px] h-[195px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Tajo Disciplinado',
      desc: 'Corte frontal implacable con espada ancha templada al fuego.',
      damage: [14, 19],
      vfx: 'araknoide_claw',
      sfx: 'attack',
      dndDamageType: 'slashing',
      condition: {
        type: 'laceration',
        duration: 2,
        stacks: 1,
        title: 'Laceración de Acero',
      },
    },
    specialSkill: {
      name: 'Embestida de Escudo',
      desc: 'Golpea brutalmente con el borde del gran escudo derribando al rival.',
      damage: [16, 21],
      vfx: 'araknoide_claw',
      sfx: 'skill',
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Contusión Severa',
      },
    },
    ultimateSkill: {
      name: 'Muro Infranqueable de Acero',
      desc: 'Formación defensiva impenetrable seguida de un golpe en arco demoledor.',
      damage: 28,
      dndDamageType: 'slashing',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 2,
        title: 'Guardia Quebrantada',
      },
    },
    rewards: {
      gold: 1500,
      crystals: 70,
      item: {
        id: 'escudo_runico_icespear',
        name: 'Escudo Rúnico de la Guarnición',
        rarity: 'SR',
        count: 1,
        icon: '/assets/combat/guardia_espada_thumb.png',
        description: 'Gran escudo de madera reforzada y tachones de acero con el sello de la guardia de la ciudad.',
      },
    },
  },
  guardia_ballesta: {
    id: 'guardia_ballesta',
    missionId: 'm2_robo',
    name: 'Tirador de Tejado',
    title: 'Francotirador de Élite • Ballesta Pesada',
    chamberName: 'Oleada 3: Emboscada de Francotiradores',
    chamberNumber: 3,
    spriteUrl: '/assets/combat/guardia_ballesta_clean.png',
    attackSpriteUrl: '/assets/combat/guardia_ballesta_attack.png',
    hurtSpriteUrl: '/assets/combat/guardia_ballesta_hurt.png',
    thumbUrl: '/assets/combat/guardia_ballesta_thumb.png',
    maxHp: 52,
    width: 142,
    height: 195,
    scaleClass: 'w-[142px] h-[195px]',
    isBoss: false,
    isSemiboss: false,
    normalSkill: {
      name: 'Virote Perforante',
      desc: 'Disparo de precisión con saeta de punta triangular de acero.',
      damage: [15, 20],
      vfx: 'medusa_sting',
      sfx: 'attack',
      dndDamageType: 'piercing',
      condition: {
        type: 'bleed',
        duration: 3,
        stacks: 1,
        title: 'Hemorragia por Virote',
      },
    },
    specialSkill: {
      name: 'Saeta Incendiaria',
      desc: 'Virote con punta impregnada en brea ardiendo que calina la piel.',
      damage: [16, 22],
      vfx: 'medusa_electric',
      sfx: 'skill',
      dndDamageType: 'fire',
      condition: {
        type: 'burn',
        duration: 3,
        stacks: 2,
        title: 'Fuego Urbano',
      },
    },
    ultimateSkill: {
      name: 'Ráfaga de Cerrajero Militar',
      desc: 'Disparo múltiple a quemarropa con mecanismo de recarga rápida.',
      damage: 30,
      dndDamageType: 'piercing',
      condition: {
        type: 'bleed',
        duration: 3,
        stacks: 3,
        title: 'Desangrado Masivo',
      },
    },
    rewards: {
      gold: 1800,
      crystals: 90,
      item: {
        id: 'caja_virotes_acero',
        name: 'Virotes de Precisión Templados',
        rarity: 'SR',
        count: 3,
        icon: '/assets/combat/guardia_ballesta_thumb.png',
        description: 'Saetas de ballesta reglamentarias con emplumado de cuervo y punta acerada.',
      },
    },
  },
  guardia_pesado: {
    id: 'guardia_pesado',
    missionId: 'm2_robo',
    name: 'Sargento Acorazado',
    title: 'Comandante de Turno • Maza con Púas y Armadura de Placas',
    chamberName: 'Oleada 4: Asedio del Sargento Acorazado',
    chamberNumber: 4,
    spriteUrl: '/assets/combat/guardia_pesado_clean.png',
    attackSpriteUrl: '/assets/combat/guardia_pesado_attack.png',
    hurtSpriteUrl: '/assets/combat/guardia_pesado_hurt.png',
    thumbUrl: '/assets/combat/guardia_pesado_thumb.png',
    maxHp: 85,
    width: 154,
    height: 210,
    scaleClass: 'w-[154px] h-[210px]',
    isBoss: true,
    isSemiboss: false,
    normalSkill: {
      name: 'Maza Rompe-Huesos',
      desc: 'Impacto brutal con maza de púas que abolla armaduras y fractura costillas.',
      damage: [16, 22],
      vfx: 'earth_titan',
      sfx: 'critical',
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'def_break',
        duration: 2,
        stacks: 2,
        title: 'Armadura Aplastada',
      },
    },
    specialSkill: {
      name: 'Rugido de la Guarnición',
      desc: 'Grito atronador que infunde pánico en los intrusos y acelera sus ataques.',
      damage: [15, 20],
      vfx: 'medusa_electric',
      sfx: 'powerup',
      dndDamageType: 'thunder',
      condition: {
        type: 'frightened',
        duration: 2,
        stacks: 1,
        title: 'Aterrorizado',
      },
    },
    ultimateSkill: {
      name: 'Juicio Marcial del Sargento',
      desc: 'Salto con maza en alto descargando toda su corpulencia en un golpe de gracia.',
      damage: 32,
      dndDamageType: 'bludgeoning',
      condition: {
        type: 'stun',
        duration: 1,
        stacks: 1,
        title: 'Aplastamiento Total',
      },
    },
    rewards: {
      gold: 5000,
      crystals: 200,
      item: {
        id: 'cofre_mansion_botin',
        name: 'Cofre Sellado de la Mansión',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/cofre_sellado_mansion.png',
        description: 'Cofre de roble con herrajes de latón y un cerrojo mágico sellado, repleto de doblones de oro, sustraído durante el asalto a la mansión tras derrotar a toda la guardia de Icespear.',
      },
    },
  },
  goblin_daga: {
      id: 'goblin_daga',
      missionId: 'm3_bosque',
      name: 'Goblin Asaltante',
      title: 'Merodeador de la Maleza • Dagas Dentadas',
      chamberName: 'Oleada 1: Batidores de la Maleza',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/goblin_daga_clean.png',
      attackSpriteUrl: '/assets/combat/goblin_daga_attack.png',
      hurtSpriteUrl: '/assets/combat/goblin_daga_hurt.png',
      thumbUrl: '/assets/combat/goblin_daga_thumb.png',
      maxHp: 38,
      width: 131,
      height: 180,
      scaleClass: 'w-[131px] h-[180px]',
      isBoss: false,
      isSemiboss: false,
      normalSkill: {
        name: 'Daga Mellada',
        desc: 'Cuchillada rápida y traicionera que busca desgarrar la ropa y armadura.',
        damage: [10, 14],
        vfx: 'araknoide_claw',
        sfx: 'attack',
        dndDamageType: 'piercing',
        condition: {
          type: 'def_break',
          duration: 2,
          stacks: 1,
          title: 'Herida Sangrante',
        },
      },
      specialSkill: {
        name: 'Tajo a las Espinillas',
        desc: 'Ataque bajo con ambas hojas buscando desestabilizar al oponente.',
        damage: [13, 17],
        vfx: 'araknoide_claw',
        sfx: 'skill',
        dndDamageType: 'piercing',
        condition: {
          type: 'atk_down',
          duration: 2,
          stacks: 1,
          title: 'Desequilibrado',
        },
      },
      ultimateSkill: {
        name: 'Frenesí Navajero Goblin',
        desc: 'Ráfaga descontrolada de estocadas chillonas con hojas envenenadas.',
        damage: 22,
        dndDamageType: 'piercing',
        condition: {
          type: 'bleed',
          duration: 2,
          stacks: 2,
          title: 'Veneno de Pantano',
        },
      },
      rewards: {
        gold: 800,
        crystals: 30,
        item: {
          id: 'daga_mellada_goblin',
          name: 'Daga Mellada Goblin',
          rarity: 'SR',
          count: 1,
          icon: '/assets/combat/goblin_daga_thumb.png',
          description: 'Cuchilla de hierro oxidado y hueso empuñada por los asaltantes goblin del bosque.',
        },
      },
    },
    goblin_honda: {
      id: 'goblin_honda',
      missionId: 'm3_bosque',
      name: 'Goblin Tirapiedras',
      title: 'Hostigador Rápido • Honda y Guijarros',
      chamberName: 'Oleada 1: Batidores de la Maleza',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/goblin_honda_clean.png',
      attackSpriteUrl: '/assets/combat/goblin_honda_attack.png',
      hurtSpriteUrl: '/assets/combat/goblin_honda_hurt.png',
      thumbUrl: '/assets/combat/goblin_honda_thumb.png',
      maxHp: 34,
      width: 131,
      height: 180,
      scaleClass: 'w-[131px] h-[180px]',
      isBoss: false,
      isSemiboss: false,
      normalSkill: {
        name: 'Proyectil de Río',
        desc: 'Lanzamiento certero de un canto rodado con honda de cuero crudo.',
        damage: [9, 13],
        vfx: 'araknoide_claw',
        sfx: 'attack',
        dndDamageType: 'bludgeoning',
      },
      specialSkill: {
        name: 'Ráfaga de Guijarros',
        desc: 'Lluvia de piedras menores que enturbian la vista del objetivo.',
        damage: [12, 16],
        vfx: 'araknoide_claw',
        sfx: 'skill',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'atk_down',
          duration: 2,
          stacks: 1,
          title: 'Vista Nublada',
        },
      },
      ultimateSkill: {
        name: 'Pedrada al Entrecejo',
        desc: 'Tiro letal a la frente que deja aturdido al rival por el impacto.',
        damage: 20,
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'stun',
          duration: 1,
          stacks: 1,
          title: 'Aturdimiento por Pedrada',
        },
      },
      rewards: {
        gold: 750,
        crystals: 30,
        item: {
          id: 'bolsa_guijarros_goblin',
          name: 'Bolsa de Guijarros de Río',
          rarity: 'SR',
          count: 1,
          icon: '/assets/combat/goblin_honda_thumb.png',
          description: 'Pouch de piel curtida repleto de cantos rodados de río listos para hondas de asalto.',
        },
      },
    },
    goblin_garrote: {
      id: 'goblin_garrote',
      missionId: 'm3_bosque',
      name: 'Goblin Machacador',
      title: 'Bruto de la Jauría • Clava Claveteada y Casco Olla',
      chamberName: 'Oleada 2: Emboscada de la Jauría Goblin',
      chamberNumber: 2,
      spriteUrl: '/assets/combat/goblin_garrote_clean.png',
      attackSpriteUrl: '/assets/combat/goblin_garrote_attack.png',
      hurtSpriteUrl: '/assets/combat/goblin_garrote_hurt.png',
      thumbUrl: '/assets/combat/goblin_garrote_thumb.png',
      maxHp: 56,
      width: 131,
      height: 180,
      scaleClass: 'w-[131px] h-[180px]',
      isBoss: false,
      isSemiboss: true,
      normalSkill: {
        name: 'Garrotazo de Roble',
        desc: 'Brutal golpe descendente con una rama pesada forrada de clavos oxidados.',
        damage: [13, 17],
        vfx: 'araknoide_claw',
        sfx: 'attack',
        dndDamageType: 'bludgeoning',
      },
      specialSkill: {
        name: 'Embestida con la Olla',
        desc: 'Cabezazo con su cacerola metálica que resquebraja las defensas.',
        damage: [16, 21],
        vfx: 'araknoide_claw',
        sfx: 'skill',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'def_break',
          duration: 2,
          stacks: 1,
          title: 'Defensas Rotos',
        },
      },
      ultimateSkill: {
        name: 'Aplastamiento Sísmico Goblin',
        desc: 'Salto descomunal descargando la clava a dos manos contra el suelo.',
        damage: 27,
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'stun',
          duration: 1,
          stacks: 1,
          title: 'Aplastamiento de Clava',
        },
      },
      rewards: {
        gold: 1400,
        crystals: 60,
        item: {
          id: 'clava_claveteada_roble',
          name: 'Clava Claveteada de Roble',
          rarity: 'SR',
          count: 1,
          icon: '/assets/combat/goblin_garrote_thumb.png',
          description: 'Garrote tosco pero mortífero adornado con clavos de forja humana sustraídos en los caminos.',
        },
      },
    },
    goblin_chaman: {
      id: 'goblin_chaman',
      missionId: 'm3_bosque',
      name: 'Goblin Chamán del Bosque',
      title: 'Líder Tribal • Fetiche de Calavera y Fuego Fatuo',
      chamberName: 'Oleada 2: Emboscada de la Jauría Goblin',
      chamberNumber: 2,
      spriteUrl: '/assets/combat/goblin_chaman_clean.png',
      attackSpriteUrl: '/assets/combat/goblin_chaman_attack.png',
      hurtSpriteUrl: '/assets/combat/goblin_chaman_hurt.png',
      thumbUrl: '/assets/combat/goblin_chaman_thumb.png',
      maxHp: 52,
      width: 131,
      height: 180,
      scaleClass: 'w-[131px] h-[180px]',
      isBoss: true,
      isSemiboss: false,
      normalSkill: {
        name: 'Chispa del Fuego Fatuo',
        desc: 'Emanación de llamas arcanas verdosas desde la calavera de su báculo.',
        damage: [12, 16],
        vfx: 'araknoide_claw',
        sfx: 'skill',
        dndDamageType: 'fire',
      },
      specialSkill: {
        name: 'Maldición de la Maleza',
        desc: 'Niebla fétida de esporas de hongo que carcome la salud y el ataque.',
        damage: [14, 19],
        vfx: 'araknoide_claw',
        sfx: 'skill',
        dndDamageType: 'poison',
        condition: {
          type: 'atk_down',
          duration: 2,
          stacks: 1,
          title: 'Esporas Tóxicas',
        },
      },
      ultimateSkill: {
        name: 'Hex Ritual de la Gran Alimaña',
        desc: 'Invocación del espíritu ancestral goblin que maldice y debilita todo el bando rival.',
        damage: 28,
        dndDamageType: 'necrotic',
        condition: {
          type: 'def_break',
          duration: 2,
          stacks: 2,
          title: 'Maldición Ancestral',
        },
      },
      rewards: {
        gold: 2500,
        crystals: 100,
        item: {
          id: 'fetiche_runico_chaman',
          name: 'Fetiche Rúnico del Chamán',
          rarity: 'SSR',
          count: 1,
          icon: '/assets/combat/goblin_chaman_thumb.png',
          description: 'Cráneo tallado y báculo de roble imbuido con magia de la naturaleza corrupta de los bosques.',
        },
      },
    },
    devorador_quitinoso: {
      id: 'devorador_quitinoso',
      missionId: 'm4_puertas_selladas',
      name: 'Devorador Quitinoso',
      title: 'Monstruosidad de las Nieves • Fase 1: Coraza [50% Resistencia a Definitivos]',
      chamberName: 'Puertas de Glimmerstone: El Titán del Paso',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/devorador_quitinoso_clean.png',
      attackSpriteUrl: '/assets/combat/devorador_quitinoso_attack.png',
      hurtSpriteUrl: '/assets/combat/devorador_quitinoso_hurt.png',
      thumbUrl: '/assets/combat/devorador_quitinoso_thumb.png',
      maxHp: 160,
      width: 176,
      height: 240,
      scaleClass: 'w-[176px] h-[240px]',
      isBoss: true,
      isSemiboss: false,
      hasPhaseTwo: true,
      normalSkill: {
        name: 'Guadañas Gemelas de Quitina',
        desc: 'Tajazo cruzado con sus apéndices aserrados con fuerza destructiva.',
        damage: [15, 21],
        vfx: 'crimson_claw',
        sfx: 'critical',
        dndDamageType: 'slashing',
        condition: {
          type: 'bleed',
          duration: 3,
          stacks: 1,
          title: 'Hemorragia de Guadaña',
        },
      },
      specialSkill: {
        name: 'Endurecimiento Quitinoso',
        desc: 'Compacta sus placas minerales reduciendo daño y cargando un orbe adicional.',
        damage: [17, 23],
        vfx: 'earth_titan',
        sfx: 'skill',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'def_buff',
          duration: 2,
          stacks: 2,
          title: 'Coraza Reforzada',
        },
      },
      ultimateSkill: {
        name: '¡GIGANTOMAQUIA SUBTERRÁNEA!',
        desc: 'El coloso arremete contra el suelo congelado causando un colapso sísmico ineludible.',
        damage: 34,
        sfx: 'dark_god',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'stun',
          duration: 1,
          stacks: 1,
          title: 'Aturdimiento Cataclísmico',
        },
      },
      rewards: {
        gold: 3500,
        crystals: 150,
        item: {
          id: 'placa_quitina_ancestral',
          name: 'Placa de Quitina Ancestral',
          rarity: 'SSR',
          count: 2,
          icon: '/assets/items/fragmento_de_quitina.png',
          description: 'Placa quitinosa de dureza extrema arrancada de la coraza del Devorador Quitinoso.',
        },
      },
    },
    devorador_quitinoso_p2: {
      id: 'devorador_quitinoso_p2',
      missionId: 'm4_puertas_selladas',
      name: 'Devorador Quitinoso (Frenesí)',
      title: 'Fase 2 • Depredador Desatado [Robo de Vida en Ataques + 50% Resistencia Definitivos]',
      chamberName: 'Puertas de Glimmerstone: Furia Desatada',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/devorador_quitinoso_clean.png',
      attackSpriteUrl: '/assets/combat/devorador_quitinoso_attack.png',
      hurtSpriteUrl: '/assets/combat/devorador_quitinoso_hurt.png',
      thumbUrl: '/assets/combat/devorador_quitinoso_thumb.png',
      maxHp: 220,
      width: 191,
      height: 262,
      scaleClass: 'w-[191px] h-[262px]',
      isBoss: true,
      isSemiboss: false,
      hasPhaseTwo: false,
      normalSkill: {
        name: 'Mandíbulas Voraces',
        desc: 'Mordisco colosal que desgarra la carne enemiga y drena salud.',
        damage: [18, 25],
        vfx: 'crimson_claw',
        sfx: 'critical',
        dndDamageType: 'piercing',
        condition: {
          type: 'bleed',
          duration: 3,
          stacks: 2,
          title: 'Hemorragia Profunda',
        },
      },
      specialSkill: {
        name: 'Torbellino Quitinoso',
        desc: 'Giro furioso de cuchillas que quiebra armaduras e infecta heridas abiertas.',
        damage: [21, 28],
        vfx: 'crimson_claw',
        sfx: 'attack',
        dndDamageType: 'slashing',
        condition: {
          type: 'def_break',
          duration: 3,
          stacks: 2,
          title: 'Armadura Destrozada',
        },
      },
      ultimateSkill: {
        name: '¡DESGARRO APOCALÍPTICO DEL ABISMO!',
        desc: 'El devorador desata su furia primordial en un arrebato de aniquilación total.',
        damage: 42,
        sfx: 'dark_god',
        dndDamageType: 'slashing',
        condition: {
          type: 'bleed',
          duration: 4,
          stacks: 3,
          title: 'Desangrado Letal',
        },
      },
      rewards: {
        gold: 8000,
        crystals: 300,
        item: {
          id: 'coraza_quitinosa_titan',
          name: 'Coraza del Devorador Quitinoso',
          rarity: 'SSR',
          count: 1,
          icon: '/assets/items/fragmento_de_quitina.png',
          description: 'El núcleo de coraza blindada del coloso que custodiaba las puertas selladas de Glimmerstone.',
        },
      },
    },
    bandido_daga: {
      id: 'bandido_daga',
      missionId: 'evento_emboscada_bandidos',
      name: 'Bandido con Daga',
      title: 'Asaltante Furtivo • Ataques Rápidos y Hemorragia',
      chamberName: 'Emboscada de Bandidos • Asalto en el Vado',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/bandido_daga_clean.png',
      attackSpriteUrl: '/assets/combat/bandido_daga_attack.png',
      hurtSpriteUrl: '/assets/combat/bandido_daga_hurt.png',
      thumbUrl: '/assets/combat/bandido_daga_thumb.png',
      maxHp: 42,
      width: 140,
      height: 180,
      scaleClass: 'w-[140px] h-[180px]',
      isBoss: false,
      isSemiboss: false,
      normalSkill: {
        name: 'Cuchillada Rápida',
        desc: 'Ataque veloz con daga corta afilada',
        damage: [9, 13],
        vfx: 'araknoide_claw',
        sfx: 'attack',
        dndDamageType: 'slashing',
      },
      specialSkill: {
        name: 'Corte a la Yugular',
        desc: 'Estocada rápida dirigida a puntos vitales',
        damage: [12, 16],
        vfx: 'crimson_claw',
        sfx: 'skill',
        dndDamageType: 'piercing',
        condition: {
          type: 'bleed',
          duration: 2,
          stacks: 1,
          title: 'Hemorragia',
        },
      },
      ultimateSkill: {
        name: 'Golpe a Traición',
        desc: 'Apuñalamiento con hemorragia lacerante',
        damage: 22,
        sfx: 'critical',
        dndDamageType: 'piercing',
        condition: {
          type: 'bleed',
          duration: 2,
          stacks: 2,
          title: 'Hemorragia Profunda',
        },
      },
      rewards: {
        gold: 800,
        crystals: 25,
        item: {
          id: 'daga_mellada_bandido',
          name: 'Daga Mellada de Bandido',
          rarity: 'SR',
          count: 1,
          icon: '/assets/items/dagas_hierro.png',
          description: 'Arma ligera recuperada de los forajidos del vado.',
        },
      },
    },
    bandido_tirador: {
      id: 'bandido_tirador',
      missionId: 'evento_emboscada_bandidos',
      name: 'Bandido Tirador',
      title: 'Arquero de los Riscos • Flechas Penetrantes',
      chamberName: 'Emboscada de Bandidos • Asalto en el Vado',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/bandido_tirador_clean.png',
      attackSpriteUrl: '/assets/combat/bandido_tirador_attack.png',
      hurtSpriteUrl: '/assets/combat/bandido_tirador_hurt.png',
      thumbUrl: '/assets/combat/bandido_tirador_thumb.png',
      maxHp: 36,
      width: 130,
      height: 180,
      scaleClass: 'w-[130px] h-[180px]',
      isBoss: false,
      isSemiboss: false,
      normalSkill: {
        name: 'Disparo de Precisión',
        desc: 'Disparo certero desde los riscos',
        damage: [8, 12],
        vfx: 'shadow_needle',
        sfx: 'attack',
        dndDamageType: 'piercing',
      },
      specialSkill: {
        name: 'Tiro Perforante',
        desc: 'Flecha con punta de hierro que rompe guardias',
        damage: [11, 15],
        vfx: 'shadow_needle',
        sfx: 'skill',
        dndDamageType: 'piercing',
        condition: {
          type: 'def_break',
          duration: 2,
          stacks: 1,
          title: 'Armadura Rasgada',
        },
      },
      ultimateSkill: {
        name: 'Lluvia de Flechas',
        desc: 'Ráfaga de flechas dentadas y lacerantes',
        damage: 20,
        sfx: 'critical',
        dndDamageType: 'piercing',
        condition: {
          type: 'bleed',
          duration: 2,
          stacks: 2,
          title: 'Sangrado',
        },
      },
      rewards: {
        gold: 900,
        crystals: 30,
        item: {
          id: 'flechas_dentadas_bandido',
          name: 'Flechas Dentadas de Bandido',
          rarity: 'SR',
          count: 2,
          icon: '/assets/items/dagas_plata.png',
          description: 'Proyectiles de caza utilizados para asaltar caravanas mercantes.',
        },
      },
    },
    bandido_lider: {
      id: 'bandido_lider',
      missionId: 'evento_emboscada_bandidos',
      name: 'Capitán de los Riscos',
      title: 'Líder Forajido • Furia de Acero y Golpes Brutales',
      chamberName: 'Emboscada de Bandidos • Asalto en el Vado',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/bandido_lider_clean.png',
      attackSpriteUrl: '/assets/combat/bandido_lider_attack.png',
      hurtSpriteUrl: '/assets/combat/bandido_lider_hurt.png',
      thumbUrl: '/assets/combat/bandido_lider_thumb.png',
      maxHp: 96,
      width: 155,
      height: 220,
      scaleClass: 'w-[155px] h-[220px]',
      isBoss: true,
      isSemiboss: false,
      normalSkill: {
        name: 'Mamporro Brutal',
        desc: 'Golpe pesado cuerpo a cuerpo que resuena con furia',
        damage: [14, 18],
        vfx: 'earth_titan',
        sfx: 'attack',
        dndDamageType: 'bludgeoning',
      },
      specialSkill: {
        name: 'Saqueo Intimidador',
        desc: 'Aullido feroz y asalto que intimida al héroe y le roba 1 orbe de definitiva',
        damage: [12, 16],
        vfx: 'earth_titan',
        sfx: 'skill',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'atk_down',
          duration: 2,
          stacks: 1,
          title: 'Intimidado',
        },
      },
      ultimateSkill: {
        name: 'Furia del Cabecilla',
        desc: 'Tajo destructor que conmociona al objetivo y saquea hasta 2 orbes de definitiva',
        damage: 30,
        sfx: 'critical',
        dndDamageType: 'slashing',
        condition: {
          type: 'stun',
          duration: 1,
          stacks: 1,
          title: 'Aturdimiento',
        },
      },
      rewards: {
        gold: 2200,
        crystals: 60,
        item: {
          id: 'cinto_cuero_capitan',
          name: 'Cinto de Cuero del Capitán',
          rarity: 'SSR',
          count: 1,
          icon: '/assets/items/cuero.png',
          description: 'Cinto con hebilla de bronce forjado que portaba el líder de los forajidos.',
        },
      },
    },
    orco_lanza: {
      id: 'orco_lanza',
      missionId: 'evento_asalto_orco',
      name: 'Orco Cazador',
      title: 'Rastreador Caníbal • Estocada y Sangrado',
      chamberName: 'Asalto Orco • Paso Helado',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/orco_lanza_clean.png',
      attackSpriteUrl: '/assets/combat/orco_lanza_attack.png',
      hurtSpriteUrl: '/assets/combat/orco_lanza_hurt.png',
      thumbUrl: '/assets/combat/orco_lanza_thumb.png',
      maxHp: 58,
      width: 145,
      height: 200,
      scaleClass: 'w-[145px] h-[200px]',
      isBoss: false,
      isSemiboss: false,
      normalSkill: {
        name: 'Estocada de Pedernal',
        desc: 'Abalanza su lanza dentada de punta áspera',
        damage: [12, 16],
        vfx: 'shadow_needle',
        sfx: 'attack',
        dndDamageType: 'piercing',
      },
      specialSkill: {
        name: 'Grito Famélico',
        desc: 'Brama con violencia e inflige hemorragia lacerante',
        damage: [11, 15],
        vfx: 'crimson_claw',
        sfx: 'skill',
        dndDamageType: 'slashing',
        condition: {
          type: 'bleed',
          duration: 2,
          stacks: 1,
          title: 'Hemorragia',
        },
      },
      ultimateSkill: {
        name: 'Ensartado de Cazador',
        desc: 'Brutal estocada empaladora con punta dentada',
        damage: 24,
        sfx: 'critical',
        dndDamageType: 'piercing',
        condition: {
          type: 'bleed',
          duration: 2,
          stacks: 2,
          title: 'Hemorragia Profunda',
        },
      },
      rewards: {
        gold: 800,
        crystals: 25,
        item: {
          id: 'punta_lanza_orco',
          name: 'Punta de Lanza Dentada',
          rarity: 'SR',
          count: 1,
          icon: '/assets/items/dagas_hierro.png',
          description: 'Pedernal afilado a mano por los cazadores orcos.',
        },
      },
    },
    orco_hacha: {
      id: 'orco_hacha',
      missionId: 'evento_asalto_orco',
      name: 'Orco Cortador',
      title: 'Carnicero de la Horda • Hachazo Demoledor',
      chamberName: 'Asalto Orco • Paso Helado',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/orco_hacha_clean.png',
      attackSpriteUrl: '/assets/combat/orco_hacha_attack.png',
      hurtSpriteUrl: '/assets/combat/orco_hacha_hurt.png',
      thumbUrl: '/assets/combat/orco_hacha_thumb.png',
      maxHp: 72,
      width: 155,
      height: 205,
      scaleClass: 'w-[155px] h-[205px]',
      isBoss: false,
      isSemiboss: false,
      normalSkill: {
        name: 'Hachazo Despiadado',
        desc: 'Corte violento y brutal con su pesada hacha oxidada',
        damage: [15, 20],
        vfx: 'crimson_claw',
        sfx: 'attack',
        dndDamageType: 'slashing',
      },
      specialSkill: {
        name: 'Tajo Hendidor',
        desc: 'Golpe demoledor que vulnera las defensas de la víctima',
        damage: [14, 18],
        vfx: 'earth_titan',
        sfx: 'skill',
        dndDamageType: 'slashing',
        condition: {
          type: 'def_break',
          duration: 2,
          stacks: 1,
          title: 'Defensa Rota',
        },
      },
      ultimateSkill: {
        name: 'Descuartizamiento Total',
        desc: 'Hachazo violento a dos manos que parte armaduras',
        damage: 28,
        sfx: 'critical',
        dndDamageType: 'slashing',
        condition: {
          type: 'def_break',
          duration: 2,
          stacks: 2,
          title: 'Armadura Destrozada',
        },
      },
      rewards: {
        gold: 1100,
        crystals: 35,
        item: {
          id: 'hacha_astillada_orco',
          name: 'Hacha Astillada de Carnicero',
          rarity: 'SR',
          count: 1,
          icon: '/assets/items/cuero.png',
          description: 'Hoja de hierro mellada con la que los carniceros orcos despedazan a sus presas.',
        },
      },
    },
    orco_caudillo: {
      id: 'orco_caudillo',
      missionId: 'evento_asalto_orco',
      name: 'Caudillo Gorrak',
      title: 'Jefe Caníbal • El Devorador Insaciable',
      chamberName: 'Asalto Orco • Paso Helado',
      chamberNumber: 1,
      spriteUrl: '/assets/combat/orco_caudillo_clean.png',
      attackSpriteUrl: '/assets/combat/orco_caudillo_attack.png',
      hurtSpriteUrl: '/assets/combat/orco_caudillo_hurt.png',
      thumbUrl: '/assets/combat/orco_caudillo_thumb.png',
      maxHp: 165,
      width: 190,
      height: 240,
      scaleClass: 'w-[190px] h-[240px]',
      isBoss: true,
      isSemiboss: false,
      normalSkill: {
        name: 'Puñetazo Colosal',
        desc: 'Impacto atronador con sus nudillos y brazales de cuero rudo',
        damage: [18, 25],
        vfx: 'earth_titan',
        sfx: 'attack',
        dndDamageType: 'bludgeoning',
      },
      specialSkill: {
        name: '¡Saqueo Glotón!',
        desc: 'Aullido famélico que arrebata 1 orbe de definitiva e intimida al rival',
        damage: [16, 22],
        vfx: 'earth_titan',
        sfx: 'skill',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'atk_down',
          duration: 2,
          stacks: 1,
          title: 'Intimidado',
        },
      },
      ultimateSkill: {
        name: '¡¡Hambre Caníbal!!',
        desc: 'Furia desatada que aplasta al rival, aturde y saquea hasta 2 orbes de definitiva',
        damage: 38,
        sfx: 'critical',
        dndDamageType: 'bludgeoning',
        condition: {
          type: 'stun',
          duration: 1,
          stacks: 1,
          title: 'Aturdimiento',
        },
      },
      rewards: {
        gold: 3200,
        crystals: 100,
        item: {
          id: 'amuleto_colmillos_gorrak',
          name: 'Collar de Colmillos de Gorrak',
          rarity: 'SSR',
          count: 1,
          icon: '/assets/items/cinto_cuero_capitan.png',
          description: 'Aparato tribal de dientes de bestias y huesos que portaba el jefe caníbal.',
        },
      },
    },
  };

export const DEVORADOR_CHAMBERS: BaseChamber[] = [
  { floor: 1, name: 'Confrontación en las Puertas de Glimmerstone', isBoss: true, enemyConfigIds: ['devorador_quitinoso'], missionId: 'm4_puertas_selladas' },
];

export const GOBLIN_CHAMBERS: BaseChamber[] = [
  { floor: 1, name: 'Oleada 1: Batidores de la Maleza', isBoss: false, enemyConfigIds: ['goblin_daga', 'goblin_honda', 'goblin_daga'], missionId: 'm3_bosque' },
  { floor: 2, name: 'Oleada 2: Emboscada de la Jauría Goblin', isBoss: true, enemyConfigIds: ['goblin_garrote', 'goblin_chaman', 'goblin_honda', 'goblin_daga'], missionId: 'm3_bosque' },
];

export const GUARD_CHAMBERS: BaseChamber[] = [
  { floor: 1, name: 'Oleada 1: Patrulla Callejera', isBoss: false, enemyConfigIds: ['guardia_lanza', 'guardia_lanza', 'guardia_espada'], missionId: 'm2_robo' },
  { floor: 2, name: 'Oleada 2: Refuerzos de la Mansión', isBoss: false, enemyConfigIds: ['guardia_espada', 'guardia_lanza', 'guardia_ballesta'], missionId: 'm2_robo' },
  { floor: 3, name: 'Oleada 3: Francotiradores de Élite', isBoss: false, enemyConfigIds: ['guardia_ballesta', 'guardia_ballesta', 'guardia_espada', 'guardia_lanza'], missionId: 'm2_robo' },
  { floor: 4, name: 'Oleada 4: Asedio del Sargento Acorazado', isBoss: true, enemyConfigIds: ['guardia_pesado', 'guardia_espada', 'guardia_ballesta', 'guardia_lanza'], missionId: 'm2_robo' },
];

export interface BaseChamber {
  floor: number;
  name: string;
  isBoss: boolean;
  enemyConfigIds: CombatEnemyId[];
  missionId?: string;
}

export const BASE_CHAMBERS: BaseChamber[] = [
  { floor: 1, name: 'Sala 1: Vanguardia Carmesí', isBoss: false, enemyConfigIds: ['araknoide_rojo', 'araknoide_rojo', 'araknoide_azul'], missionId: 'm3_cuevas_rojo' },
  { floor: 2, name: 'Sala 2: Grieta Criogénica', isBoss: false, enemyConfigIds: ['araknoide_azul', 'araknoide_azul', 'araknoide_rojo'], missionId: 'm4_cuevas_azul' },
  { floor: 3, name: 'Sala 3: Emboscada Bicolor', isBoss: false, enemyConfigIds: ['araknoide_rojo', 'araknoide_azul', 'araknoide_rojo', 'araknoide_azul'], missionId: 'm3_cuevas_rojo' },
  { floor: 4, name: 'Sala 4: Galería de las Agujas', isBoss: false, enemyConfigIds: ['semiboss_zancudo', 'araknoide_azul', 'araknoide_rojo'], missionId: 'm5_cuevas_zancudo' },
  { floor: 5, name: 'Sala 5: Redes Heladas y Espinas', isBoss: false, enemyConfigIds: ['semiboss_zancudo', 'araknoide_azul', 'araknoide_azul', 'araknoide_rojo'], missionId: 'm5_cuevas_zancudo' },
  { floor: 6, name: 'Sala 6: Foso del Behemoth', isBoss: false, enemyConfigIds: ['semiboss_melenudo', 'araknoide_rojo', 'araknoide_azul'], missionId: 'm6_cuevas_titan' },
  { floor: 7, name: 'Sala 7: Enjambre de Sangre y Hielo', isBoss: false, enemyConfigIds: ['araknoide_rojo', 'araknoide_azul', 'araknoide_rojo', 'araknoide_azul'], missionId: 'm4_cuevas_azul' },
  { floor: 8, name: 'Sala 8: Dúo de Semijefes', isBoss: false, enemyConfigIds: ['semiboss_zancudo', 'semiboss_melenudo', 'araknoide_rojo', 'araknoide_azul'], missionId: 'm6_cuevas_titan' },
  { floor: 9, name: 'Sala 9: Asedio de la Bestia Melenuda', isBoss: false, enemyConfigIds: ['semiboss_melenudo', 'semiboss_zancudo', 'araknoide_azul', 'araknoide_rojo'], missionId: 'm6_cuevas_titan' },
  { floor: 10, name: 'Sala 10: El Nido Ancestral de la Reina', isBoss: true, enemyConfigIds: ['araknoide', 'semiboss_zancudo', 'semiboss_melenudo'], missionId: 'm7_cuevas_reina' },
];

export const getInfiniteChamberEnemies = (floor: number): CombatEnemyId[] => {
  const count = Math.random() < 0.5 ? 3 : 4;
  const enemyPool: CombatEnemyId[] = [
    'araknoide_rojo',
    'araknoide_azul',
    'semiboss_zancudo',
    'semiboss_melenudo',
  ];
  const chosen: CombatEnemyId[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0 && floor % 5 === 0) {
      chosen.push(floor % 10 === 0 ? 'araknoide' : 'semiboss_melenudo');
    } else {
      chosen.push(enemyPool[Math.floor(Math.random() * enemyPool.length)]);
    }
  }
  return chosen;
};

// Saquito de botin que cae al derrotar a un enemigo (estilo 7DS Grand Cross).
export interface LootSackDrop {
  key: string;
  left: number;
  top: number;
  fall: number;
  gold: number;
  item?: { name: string; icon: string };
  dissolving: boolean;
}

const LootSackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M22 25c-5.5 3.4-13 9.6-13 19.2C9 54 18.4 60 32 60s23-6 23-15.8C55 34.6 47.5 28.4 42 25Z" fill="#f6e0c6" stroke="#5b2a10" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M15 41c4.6 3.8 10.4 5.6 17 5.6s12.4-1.8 17-5.6" stroke="#e2bd99" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M20 25c-1.4-5.2-5-8.7-9.6-9.8 4.6-3.2 9.6-4.2 14-2.6 2.6-3 6.6-4.4 10.6-4.4s8 1.4 10.6 4.4c4.4-1.6 9.4-.6 14 2.6-4.6 1.1-8.2 4.6-9.6 9.8Z" fill="#fcefdd" stroke="#5b2a10" strokeWidth="2.6" strokeLinejoin="round" />
    <rect x="18.5" y="22.5" width="27" height="6.5" rx="3.2" fill="#c31d2b" stroke="#5b2a10" strokeWidth="2.2" />
    <path d="M31 29c2 3 3 6 3 9M36 29c6 3 10 6 12 11M30 29c-2 4-4 7-4 10" stroke="#c31d2b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    <path d="M26 39h7l-3.5 8ZM40 40h7l-3.5 8Z" fill="#f5b93a" stroke="#5b2a10" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export interface ChamberEnemyState {
  uid: string;
  configId: CombatEnemyId;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  ultimateOrbs: number;
  conditions: ActiveGachaEffect[];
  isAshDissolving: boolean;
  isHitShaking: boolean;
  hitKey: number;
  isTwitching: boolean;
  animation: 'idle' | 'hit' | 'strike' | 'dead';
  spriteUrl: string;
  attackSpriteUrl?: string;
  hurtSpriteUrl?: string;
  thumbUrl: string;
  scaleClass: string;
  width: number;
  height: number;
  slotIndex: number;
  hasPhaseTwo?: boolean;
  isBoss?: boolean;
  isSemiboss?: boolean;
}

export interface AccumulatedLoot {
  gold: number;
  crystals: number;
  items: {
    id: string;
    name: string;
    count: number;
    icon: string;
    rarity: string;
    description: string;
  }[];
}

export const createChamberEnemies = (floor: number, missionId?: string | null): ChamberEnemyState[] => {
  let configIds: CombatEnemyId[] = [];
  if (missionId === 'm5_cuevas_zancudo') {
    // Boss fight: El Zancudo Espectral in the entrance to the colony heart
    configIds = ['semiboss_zancudo'];
  } else if (missionId === 'm4_cuevas_azul') {
    // 4 enemies: 2 variants of acechadores gélidos (Acechador Zafiro + Acechador Glacial)
    configIds = ['araknoide_azul', 'araknoide_glacial', 'araknoide_azul', 'araknoide_glacial'];
  } else if (missionId === 'm3_cuevas_rojo') {
    configIds = ['araknoide_voraz', 'araknoide_espinoso', 'araknoide_oviparo'];
  } else if (missionId === 'evento_asalto_orco') {
    // 3 Orcs: Hunter with spear, Caudillo Gorrak (boss), Butcher with axe
    configIds = ['orco_lanza', 'orco_caudillo', 'orco_hacha'];
  } else if (missionId === 'evento_emboscada_bandidos') {
    const count = Math.floor(Math.random() * 4) + 2; // 2 to 5 bandits
    const pool: CombatEnemyId[] = ['bandido_daga', 'bandido_tirador'];
    const chosen: CombatEnemyId[] = [];
    for (let i = 0; i < count - 1; i++) {
      chosen.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (count >= 3) {
      chosen.push('bandido_lider');
    } else {
      chosen.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    configIds = chosen;
  } else if (missionId === 'm4_puertas_selladas') {
    const chamber = DEVORADOR_CHAMBERS[0];
    configIds = chamber.enemyConfigIds;
  } else if (missionId === 'm3_bosque') {
    if (floor <= 2) {
      const chamber = GOBLIN_CHAMBERS[floor - 1] || GOBLIN_CHAMBERS[0];
      configIds = chamber.enemyConfigIds;
    } else {
      configIds = ['goblin_daga', 'goblin_garrote'];
    }
  } else if (missionId === 'm2_robo') {
    if (floor <= 4) {
      const chamber = GUARD_CHAMBERS[floor - 1] || GUARD_CHAMBERS[0];
      configIds = chamber.enemyConfigIds;
    } else {
      const guardPool: CombatEnemyId[] = ['guardia_lanza', 'guardia_espada', 'guardia_ballesta', 'guardia_pesado'];
      configIds = [
        guardPool[Math.floor(Math.random() * guardPool.length)],
        guardPool[Math.floor(Math.random() * guardPool.length)],
      ];
    }
  } else if (floor <= 10) {
    const chamber = BASE_CHAMBERS[floor - 1] || BASE_CHAMBERS[0];
    configIds = chamber.enemyConfigIds;
  } else {
    configIds = getInfiniteChamberEnemies(floor);
  }

  const hpScale = floor <= 10 ? 1 : 1 + (floor - 10) * 0.08;

  return configIds.map((cfgId, idx) => {
    const cfg = DUNGEON_ENEMIES[cfgId] || DUNGEON_ENEMIES['araknoide_rojo'];
    const scaledMaxHp = Math.round(cfg.maxHp * hpScale);
    const letter =
      configIds.length > 1 && configIds.filter((c) => c === cfgId).length > 1
        ? ` ${String.fromCharCode(65 + idx)}`
        : '';

    return {
      uid: `${cfgId}_f${floor}_s${idx}_${Date.now()}_${Math.random()}`,
      configId: cfgId,
      name: `${cfg.name}${letter}`,
      title: cfg.title,
      hp: scaledMaxHp,
      maxHp: scaledMaxHp,
      ultimateOrbs: 0,
      conditions: [],
      isAshDissolving: false,
      isHitShaking: false,
      hitKey: 0,
      isTwitching: false,
      animation: 'idle',
      spriteUrl: cfg.spriteUrl,
      attackSpriteUrl: cfg.attackSpriteUrl,
      hurtSpriteUrl: cfg.hurtSpriteUrl,
      thumbUrl: cfg.thumbUrl,
      scaleClass: cfg.scaleClass,
      width: cfg.width,
      height: cfg.height,
      slotIndex: idx,
      hasPhaseTwo: cfg.hasPhaseTwo,
      isBoss: cfg.isBoss,
      isSemiboss: cfg.isSemiboss,
    };
  });
};

export const getDndImpactAnimationClass = (_dndType?: DndDamageType | null): string => {
  return 'dnd-impact-sprite-whiteout';
};

export const DndImpactShaderOverlay: React.FC<{
  spriteUrl?: string;
  dndType?: DndDamageType | null;
  active?: boolean;
  position?: 'center' | 'center bottom';
  imgClassName?: string;
}> = () => null;

export const DndSpriteMaskShader = DndImpactShaderOverlay;

export const CombatView: React.FC = () => {
  const {
    navigateTo,
    addGold,
    addCrystals,
    addShelfItem,
    inventory,
    selectedCombatMissionId,
    setSelectedCombatMissionId,
    questProgress,
    completeQuestMission,
    setActiveQuestChapter,
  } = useGame();

  // Determine starting floor based on selected mission
  const getInitialFloor = (): number => {
    if (
      selectedCombatMissionId === 'evento_asalto_orco' ||
      selectedCombatMissionId === 'evento_emboscada_bandidos' ||
      selectedCombatMissionId === 'm1_tirano' ||
      selectedCombatMissionId === 'm2_robo' ||
      selectedCombatMissionId === 'm3_bosque' ||
      selectedCombatMissionId === 'm4_puertas_selladas'
    ) return 1;
    if (selectedCombatMissionId === 'm3_cuevas_rojo') return 1;
    if (selectedCombatMissionId === 'm4_cuevas_azul') return 1;
    if (selectedCombatMissionId === 'm5_cuevas_zancudo') return 1;
    if (selectedCombatMissionId === 'm6_cuevas_titan') return 6;
    if (selectedCombatMissionId === 'm7_cuevas_reina' || selectedCombatMissionId === 'm3_cuevas') return 10;
    return 1;
  };

  const [currentFloor, setCurrentFloor] = useState<number>(getInitialFloor);
  const [bestFloor, setBestFloor] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('icespear_best_floor');
      return saved ? parseInt(saved, 10) || 1 : 1;
    } catch {
      return 1;
    }
  });

  const [accumulatedLoot, setAccumulatedLoot] = useState<AccumulatedLoot>({
    gold: 0,
    crystals: 0,
    items: [],
  });

  const [waveClearBanner, setWaveClearBanner] = useState<{
    floor: number;
    gold: number;
    crystals: number;
    nextFloor: number;
  } | null>(null);

  // Active enemies in the chamber (1 to 3 enemies)
  const [activeEnemies, setActiveEnemies] = useState<ChamberEnemyState[]>(() =>
    createChamberEnemies(getInitialFloor(), selectedCombatMissionId)
  );
  const activeEnemiesRef = useRef<ChamberEnemyState[]>(activeEnemies);
  activeEnemiesRef.current = activeEnemies;

  const [selectedEnemyIdx, setSelectedEnemyIdx] = useState<number>(0);
  const aliveEnemies = activeEnemies.filter((e) => e.hp > 0 && !e.isAshDissolving);

  // -- Botin al derrotar enemigos (estilo 7DS Grand Cross) --------------------
  // Cada enemigo que cae suelta un saquito en el campo y su botin entra en el
  // inventario al instante: oro siempre y, a veces, un material de su tabla.
  const [lootSacks, setLootSacks] = useState<LootSackDrop[]>([]);
  const droppedUidsRef = useRef<Set<string>>(new Set());
  const lootLayerRef = useRef<HTMLDivElement | null>(null);
  const grantGoldRef = useRef(addGold);
  grantGoldRef.current = addGold;
  const grantItemRef = useRef(addShelfItem);
  grantItemRef.current = addShelfItem;

  useEffect(() => {
    let cancelled = false;
    // El botin se procesa fuera del commit del combate para no encadenar
    // actualizaciones del provider mientras se resuelve la muerte.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      activeEnemies.forEach((enemy) => {
        if (enemy.hp > 0 || droppedUidsRef.current.has(enemy.uid)) return;
        droppedUidsRef.current.add(enemy.uid);

        const cfg = DUNGEON_ENEMIES[enemy.configId];
        const goldMultiplier = enemy.isBoss ? 6 : enemy.isSemiboss ? 3 : 1;
        const gold = Math.round((10 + Math.random() * 14) * goldMultiplier);
        grantGoldRef.current(gold);

        let droppedItem: { name: string; icon: string } | undefined;
        if (cfg?.rewards?.item && Math.random() < 0.45) {
          const loot = cfg.rewards.item;
          droppedItem = { name: loot.name, icon: loot.icon };
          grantItemRef.current({
            id: `${loot.id}_${enemy.uid}_${Date.now()}`,
            name: loot.name,
            category: 'materials',
            rarity: loot.rarity as any,
            count: 1,
            icon: loot.icon,
            description: loot.description,
          });
        }

        // Nace sobre la cabeza del enemigo derrotado y cae hasta el centro de su sombra.
        const layer = lootLayerRef.current;
        let left = 0;
        let top = 0;
        let fall = 96;
        if (layer) {
          const lr = layer.getBoundingClientRect();
          const shadow = document.querySelector('[data-enemy-shadow]') as HTMLElement | null;
          const sprite = document.querySelector('[data-enemy-sprite]') as HTMLElement | null;
          const sr = shadow ? shadow.getBoundingClientRect() : null;
          const pr = sprite ? sprite.getBoundingClientRect() : null;
          if (sr) {
            left = sr.left + sr.width / 2 - lr.left;
            top = sr.top + sr.height / 2 - lr.top;
          } else if (pr) {
            left = pr.left + pr.width / 2 - lr.left;
            top = pr.bottom - lr.top - 4;
          } else {
            left = lr.width * 0.78;
            top = lr.height * 0.8;
          }
          if (pr) fall = Math.max(70, top - (pr.top - lr.top) + 6);
        }

        const key = `${enemy.uid}_${Date.now()}`;
        setLootSacks((prev) => [...prev.slice(-5), { key, left, top, fall, gold, item: droppedItem, dissolving: false }]);
        window.setTimeout(() => {
          setLootSacks((prev) => prev.map((it) => (it.key === key ? { ...it, dissolving: true } : it)));
        }, 1600);
        window.setTimeout(() => {
          setLootSacks((prev) => prev.filter((it) => it.key !== key));
        }, 1900);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeEnemies]);

  const targetEnemy: ChamberEnemyState =
    activeEnemies[selectedEnemyIdx]?.hp > 0 && !activeEnemies[selectedEnemyIdx]?.isAshDissolving
      ? activeEnemies[selectedEnemyIdx]
      : aliveEnemies[0] || activeEnemies[0] || {
          uid: 'dummy',
          configId: 'araknoide_rojo',
          name: 'Araknoide',
          title: 'Vanguardia',
          hp: 0,
          maxHp: 50,
          ultimateOrbs: 0,
          conditions: [],
          isAshDissolving: false,
          isHitShaking: false,
          hitKey: 0,
          isTwitching: false,
          animation: 'idle',
          spriteUrl: '/assets/combat/araknoide_rojo_clean.png',
          attackSpriteUrl: '/assets/combat/araknoide_rojo_attack.png',
          hurtSpriteUrl: '/assets/combat/araknoide_rojo_hurt.png',
          thumbUrl: '/assets/combat/araknoide_rojo_thumb.png',
          scaleClass: 'w-[139px] h-[192px]',
          width: 139,
          height: 192,
          slotIndex: 0,
          isBoss: false,
          isSemiboss: false,
        };

  const currentEnemyId = targetEnemy.configId;
  const currentEnemy = DUNGEON_ENEMIES[currentEnemyId] || DUNGEON_ENEMIES['araknoide_rojo'];
  const currentBoss = currentEnemyId === 'medusa' ? 'medusa' : 'araknoide';
  const enemyHp = targetEnemy.hp;
  const enemyMaxHp = targetEnemy.maxHp;
  const enemyUltimateOrbs = targetEnemy.ultimateOrbs;
  const enemyConditions = targetEnemy.conditions;
  const isEnemyAshDissolving = targetEnemy.isAshDissolving;

  const [bossTransitioning, setBossTransitioning] = useState<boolean>(false);
  const [turnSkippedBanner, setTurnSkippedBanner] = useState<string | null>(null);

  // Hero Stats (Magordito) - 100 HP
  const MAX_HERO_HP = 100;
  const [heroHp, setHeroHp] = useState<number>(MAX_HERO_HP);
  const heroHpRef = useRef<number>(MAX_HERO_HP);
  const [heroMaxHp] = useState<number>(MAX_HERO_HP);

  // Turn Counter
  const [turnCounter, setTurnCounter] = useState<number>(1);

  // Battle State: 'idle' | 'player_acting' | 'enemy_acting' | 'victory' | 'defeat'
  const [battleState, setBattleState] = useState<
    'idle' | 'player_acting' | 'enemy_acting' | 'victory' | 'defeat'
  >('idle');

  // Hero & Enemy animations & Instant Hit Shake/Flash Feedback
  const [heroAnimation, setHeroAnimation] = useState<'idle' | 'lunge' | 'hit' | 'dead'>('idle');
  const [heroCastSkill, setHeroCastSkill] = useState<string | null>(null);
  const [enemyAnimation, setEnemyAnimation] = useState<'idle' | 'hit' | 'strike' | 'dead'>('idle');
  const [heroHitKey, setHeroHitKey] = useState<number>(0);
  const [enemyHitKey, setEnemyHitKey] = useState<number>(0);
  const [isHeroHitShaking, setIsHeroHitShaking] = useState<boolean>(false);
  const [isEnemyHitShaking, setIsEnemyHitShaking] = useState<boolean>(false);

  // Preload Magordito combat pose sprites for seamless zero-latency pose changes
  useEffect(() => {
    const sprites = [
      '/assets/combat/magordito_idle.png',
      '/assets/combat/magordito_hurt.png',
      '/assets/combat/magordito_cast_rayo.png',
      '/assets/combat/magordito_cast_dios.png',
      '/assets/combat/magordito_cast_slash.png',
      '/assets/combat/magordito_cast_toxic.png',
    ];
    sprites.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const isEdacornCombat = selectedCombatMissionId === 'm3_cuevas_rojo';
  const [isEdacornStealthed, setIsEdacornStealthed] = useState<boolean>(false);
  const [edacornCounter, setEdacornCounter] = useState<{ active: boolean; damage: number } | null>(null);

  const getHeroSpriteUrl = (): string => {
    if (isEdacornCombat) {
      if (heroAnimation === 'hit' || isHeroHitShaking) {
        return '/assets/combat/edacorn_alas_hurt.png';
      }
      if (heroCastSkill || heroAnimation === 'lunge' || tier3Cinematic) {
        return '/assets/combat/edacorn_alas_attack.png';
      }
      return '/assets/combat/edacorn_alas_idle.png';
    }
    if (heroAnimation === 'hit' || isHeroHitShaking) {
      return '/assets/combat/magordito_hurt.png';
    }
    if (heroCastSkill) {
      switch (heroCastSkill) {
        case 'rayo_necrotico':
          return '/assets/combat/magordito_cast_rayo.png';
        case 'dios_oscuro':
          return '/assets/combat/magordito_cast_dios.png';
        case 'drenar_maldiciones':
          return '/assets/combat/magordito_cast_toxic.png';
        case 'fortalecer_marioneta':
          return '/assets/combat/magordito_cast_slash.png';
        case 'cataclismo_astral':
          return '/assets/combat/magordito_cast_rayo.png';
        default:
          return '/assets/combat/magordito_cast_slash.png';
      }
    }
    if (isUltimateCinematicActive) {
      return '/assets/combat/magordito_cast_rayo.png';
    }
    if (heroAnimation === 'lunge') {
      return '/assets/combat/magordito_cast_slash.png';
    }
    return '/assets/combat/magordito_idle.png';
  };

  const getEnemySpriteUrl = (enemy: ChamberEnemyState): string => {
    if (isEnemyHitShaking || enemy.animation === 'hit' || enemyAnimation === 'hit') {
      return enemy.hurtSpriteUrl || enemy.spriteUrl;
    }
    if (enemy.animation === 'strike' || enemyAnimation === 'strike') {
      return enemy.attackSpriteUrl || enemy.spriteUrl;
    }
    return enemy.spriteUrl;
  };

  // Ash Disintegration States (Deshacerse en Cenizas al Morir)
  const setIsEnemyAshDissolving = (val: boolean) => {
    setActiveEnemies((prev) =>
      prev.map((e) => (e.uid === targetEnemy?.uid ? { ...e, isAshDissolving: val } : e))
    );
  };
  const [isHeroAshDissolving, setIsHeroAshDissolving] = useState<boolean>(false);

  // Reset combat run cleanly when selectedCombatMissionId changes
  useEffect(() => {
    const initFloor = getInitialFloor();
    setCurrentFloor(initFloor);
    const initialEnemies = createChamberEnemies(initFloor, selectedCombatMissionId);
    activeEnemiesRef.current = initialEnemies;
    setActiveEnemies(initialEnemies);
    setSelectedEnemyIdx(0);
    setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });
    heroHpRef.current = MAX_HERO_HP;
    setHeroHp(MAX_HERO_HP);
    setBattleState('idle');
    setWaveClearBanner(null);
    setIsEdacornStealthed(false);
    setEdacornCounter(null);
    if (selectedCombatMissionId === 'm3_cuevas_rojo') {
      setHand([
        { instanceId: 'init_eda_1', skillId: 'ataque_furtivo', tier: 1 },
        { instanceId: 'init_eda_2', skillId: 'contraataque', tier: 1 },
        { instanceId: 'init_eda_3', skillId: 'sigilo', tier: 1 },
        { instanceId: 'init_eda_4', skillId: 'ataque_furtivo', tier: 1 },
      ]);
    } else {
      setHand([
        { instanceId: 'init_1', skillId: 'drenar_maldiciones', tier: 1 },
        { instanceId: 'init_2', skillId: 'dios_oscuro', tier: 1 },
        { instanceId: 'init_3', skillId: 'fortalecer_marioneta', tier: 1 },
        { instanceId: 'init_4', skillId: 'fortalecer_marioneta', tier: 1 },
      ]);
    }
  }, [selectedCombatMissionId]);




  // Authentic Instrumental Combat Soundtrack: "Blades of the Astral Gate"
  useEffect(() => {
    sound.initBGM('/assets/audio/blades_of_the_astral_gate.mp3');
    sound.playBGM();
    return () => {
      sound.stopBGM();
    };
  }, []);

  // Preload all ability VFX, card tier assets, and merge textures for zero-latency instant rendering
  useEffect(() => {
    const assetsToPreload = [
      // All 12 Card Tier Images (guarantees zero-latency card rank-up without disappearing)
      '/assets/aistudio/image_f589d3f3.png',
      '/assets/aistudio/image_10ee0a33.png',
      '/assets/aistudio/image_b6d0dc18.png',
      '/assets/aistudio/image_e8288ed9.png',
      '/assets/aistudio/image_4aa946b2.png',
      '/assets/aistudio/image_eb9fd249.png',
      '/assets/aistudio/image_de00910f.png',
      '/assets/items/drenar_maldiciones_tier_2.png',
      '/assets/items/drenar_maldiciones_tier_3.png',
      '/assets/aistudio/image_e0c0b7e7.png',
      '/assets/aistudio/image_3e1c2525.png',
      '/assets/aistudio/image_f9e08028.png',
      // Card Combination Burst FX
      '/assets/cfxr/graphics/cfxr-ring-electric-gold.png?v=c3',
      '/assets/cfxr/graphics/cfxr-flare-gold.png?v=c3',
      '/assets/cfxr/graphics/cfxr-magic-star-gold.png?v=c3',
      // Combat VFX Textures
      '/assets/cfxr/graphics/cfxr-flare.png?v=c3',
      '/assets/cfxr/graphics/cfxr-spikes-impact-cyan.png?v=c3',
      '/assets/cfxr/graphics/cfxr-ring-electric-cyan.png?v=c3',
      '/assets/cfxr/graphics/cfxr-electric-spark-cyan.png?v=c3',
      '/assets/cfxr/graphics/cfxr-flare-gold.png',
      '/assets/cfxr/graphics/cfxr-ring-electric-gold.png',
      '/assets/cfxr/graphics/cfxr-fire-small-anim-gold.png',
      '/assets/cfxr/graphics/cfxr-magic-star-gold.png',
      '/assets/cfxr/graphics/cfxr-spikes-impact-gold.png',
      '/assets/cfxr/graphics/cfxr-aura-runic-purple.png',
      '/assets/cfxr/graphics/cfxr-aura-rays-purple.png',
      '/assets/cfxr/graphics/cfxr-skull-2-purple.png',
      '/assets/cfxr/graphics/cfxr-ring-electric-violet.png',
      '/assets/cfxr/graphics/cfxr-blood-splash-crimson.png',
      '/assets/cfxr/graphics/cfxr-heart-break-parts.png',
      '/assets/cfxr/graphics/cfxr-sword-trail-mask-light-crimson.png',
      '/assets/cfxr/graphics/cfxr-ember-blur.png',
      '/assets/cfxr/graphics/cfxr-explosion-smoke-dissolve-fire.png',
      '/assets/cfxr/graphics/cfxr-fire-edge-dissolve.png',
      '/assets/skills/rayo_necrotico_spritesheet.png',
      '/assets/skills/rayo_necrotico_impacto.webp',
    ];
    assetsToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // D&D 5E Elemental Impact Shaders State
  const [enemyImpactDamageType, setEnemyImpactDamageType] = useState<DndDamageType | null>(null);
  const [heroImpactDamageType, setHeroImpactDamageType] = useState<DndDamageType | null>(null);

  // Instant Visual Hit Shake & Flash Trigger Functions with D&D Shader Integration
  const triggerHeroHitReaction = useCallback((dndType?: DndDamageType) => {
    setHeroHitKey((k) => k + 1);
    setIsHeroHitShaking(true);
    setHeroAnimation('hit');
    setHeroImpactDamageType(dndType || null);
    setTimeout(() => {
      setIsHeroHitShaking(false);
      setHeroAnimation('idle');
      setHeroImpactDamageType(null);
    }, 450);
  }, []);

  const triggerEnemyHitReaction = useCallback((dndType?: DndDamageType) => {
    setEnemyHitKey((k) => k + 1);
    setIsEnemyHitShaking(true);
    setEnemyAnimation('hit');
    setEnemyImpactDamageType(dndType || null);
    setTimeout(() => {
      setIsEnemyHitShaking(false);
      setEnemyAnimation('idle');
      setEnemyImpactDamageType(null);
    }, 450);
  }, []);

  const [slashEffect, setSlashEffect] = useState<'none' | 'lightning' | 'shockwave' | 'drain'>('none');
  const [activeVfx, setActiveVfx] = useState<CombatVfxState>({ type: 'none', tier: 1 });

  // AAA Gacha Camera Shake & Impact Flash (Tiered Intensities)
  const [screenShake, setScreenShake] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const [screenFlash, setScreenFlash] = useState<'cyan' | 'purple' | 'gold' | 'red' | null>(null);
  const [tier3Cinematic, setTier3Cinematic] = useState<boolean>(false);

  // In-combat inventory modal & Active Food Buff
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [activeFoodBuff, setActiveFoodBuff] = useState<ActiveCombatFoodBuff | null>(null);
  const [foodShieldHp, setFoodShieldHp] = useState<number>(0);

  // D&D 5e Damage Compendium & Tactical Procs State
  const [showDndCodex, setShowDndCodex] = useState<boolean>(false);
  const [selectedDndCodexType, setSelectedDndCodexType] = useState<DndDamageType>('fire');
  const [dndProcBanner, setDndProcBanner] = useState<{
    text: string;
    color: string;
    icon: string;
  } | null>(null);

  // Active Gacha Status Effects State for Enemy & Hero
  const setEnemyConditions = (
    updater: ActiveGachaEffect[] | ((prev: ActiveGachaEffect[]) => ActiveGachaEffect[])
  ) => {
    setActiveEnemies((prev) =>
      prev.map((e) => {
        if (e.uid === targetEnemy?.uid) {
          const nextConds = typeof updater === 'function' ? updater(e.conditions) : updater;
          return { ...e, conditions: nextConds };
        }
        return e;
      })
    );
  };
  const [heroConditions, setHeroConditions] = useState<ActiveGachaEffect[]>([]);
  const [selectedConditionTooltip, setSelectedConditionTooltip] = useState<ActiveGachaEffect | null>(null);

  // Status Effect Animation Triggers (Pokémon style: one-shot on turn start or on application)
  const [heroStatusTrigger, setHeroStatusTrigger] = useState<number>(0);
  const [enemyStatusTrigger, setEnemyStatusTrigger] = useState<number>(0);
  const [heroTwitching, setHeroTwitching] = useState<boolean>(false);
  const [enemyTwitching, setEnemyTwitching] = useState<boolean>(false);

  // Floating damage/heal texts
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const floatingIdRef = useRef<number>(0);

  // Combination (Merge) Animation State
  const [mergeAnim, setMergeAnim] = useState<MergeAnimation | null>(null);

  // 4 Active Hand Slots (Starts with Tier 1 cards ready to merge, exactly matching screenshot)
  const [hand, setHand] = useState<ActiveCombatCard[]>([
    { instanceId: 'init_1', skillId: 'drenar_maldiciones', tier: 1 },
    { instanceId: 'init_2', skillId: 'dios_oscuro', tier: 1 },
    { instanceId: 'init_3', skillId: 'fortalecer_marioneta', tier: 1 },
    { instanceId: 'init_4', skillId: 'fortalecer_marioneta', tier: 1 },
  ]);

  // REFS TO PREVENT STALE CLOSURES DURING DRAG & DROP
  const handRef = useRef<ActiveCombatCard[]>(hand);
  handRef.current = hand;

  const dragIndexRef = useRef<number | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  const isOverArenaRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // DOM Elements refs
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Reactive Drag State for UI Rendering
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragTilt, setDragTilt] = useState<number>(0);
  const [dragCardSize, setDragCardSize] = useState<{ width: number; height: number }>({ width: 84, height: 120 });

  const spawnFloating = useCallback(
    (
      text: string,
      isEnemy: boolean,
      isHeal = false,
      tier: 1 | 2 | 3 = 1,
      isCrit = false,
      slotIndex?: number,
      dndType?: DndDamageType,
      badgeText?: string,
      badgeColor?: string
    ) => {
      const id = ++floatingIdRef.current;
      setFloatingTexts((prev) => [
        ...prev,
        { id, text, isEnemy, isHeal, tier, isCrit: isCrit || tier === 3, slotIndex, dndType, badgeText, badgeColor },
      ]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, tier === 3 || isCrit ? 1500 : 1200);
    },
    []
  );

  // 5-Orb Ultimate Move Gauge
  const MAX_ULTIMATE_ORBS = 5;
  const [ultimateOrbs, setUltimateOrbs] = useState<number>(0);
  const setEnemyUltimateOrbs = (updater: number | ((prev: number) => number)) => {
    setActiveEnemies((prev) =>
      prev.map((e) => {
        if (e.uid === targetEnemy?.uid) {
          const nextOrbs = typeof updater === 'function' ? updater(e.ultimateOrbs) : updater;
          return { ...e, ultimateOrbs: nextOrbs };
        }
        return e;
      })
    );
  };
  const [newlyGainedOrbIdx, setNewlyGainedOrbIdx] = useState<number | null>(null);
  const [newlyGainedEnemyOrbIdx, setNewlyGainedEnemyOrbIdx] = useState<number | null>(null);
  const [isUltimateCinematicActive, setIsUltimateCinematicActive] = useState<boolean>(false);
  const [ultimateCinematicPhase, setUltimateCinematicPhase] = useState<'cutin' | 'impact' | 'finish'>('cutin');
  const [isEnemyUltimateCinematic, setIsEnemyUltimateCinematic] = useState<boolean>(false);
  // Fate/Grand Order (FGO) Noble Phantasm Animated States
  const [fgoPhase, setFgoPhase] = useState<'none' | 'chant' | 'charge' | 'barrage' | 'impact' | 'total'>('none');
  const [fgoHitCount, setFgoHitCount] = useState<number>(0);
  const [fgoDamageTally, setFgoDamageTally] = useState<number>(0);
  const [isFgoEnemy, setIsFgoEnemy] = useState<boolean>(false);

  // Pokemon-style Tag-Team Switching & Enemy Unique Attacks
  const [enemySwitchState, setEnemySwitchState] = useState<'none' | 'exit' | 'enter'>('none');
  const [pokemonSwitchNotice, setPokemonSwitchNotice] = useState<string | null>(null);
  const [activeEnemyAttackVisual, setActiveEnemyAttackVisual] = useState<{
    enemyName: string;
    skillName: string;
    skillDesc: string;
    vfxType: 'crimson_claw' | 'frost_blizzard' | 'shadow_needle' | 'earth_titan' | 'void_miasma' | 'gorgon_lightning';
    themeColor: string;
  } | null>(null);

  const switchActiveEnemy = useCallback(
    (newIdx: number, isAiSwitch = false) => {
      const currentList = activeEnemiesRef.current;
      if (newIdx === selectedEnemyIdx || !currentList[newIdx] || currentList[newIdx].hp <= 0) {
        return;
      }
      const prevEnemy = currentList[selectedEnemyIdx];
      const nextEnemy = currentList[newIdx];

      sound.playSFX('blip');
      setEnemySwitchState('exit');

      setTimeout(() => {
        setSelectedEnemyIdx(newIdx);
        setEnemySwitchState('enter');
        sound.playSFX('powerup');
        setPokemonSwitchNotice(
          prevEnemy && prevEnemy.hp <= 0
            ? `¡${prevEnemy.name} cae! ¡Entra ${nextEnemy.name} al combate!`
            : `¡El rival retira a ${prevEnemy.name} y envía a ${nextEnemy.name}!`
        );

        setTimeout(() => {
          setEnemySwitchState('none');
        }, 450);

        setTimeout(() => {
          setPokemonSwitchNotice(null);
        }, 2400);
      }, 260);
    },
    [selectedEnemyIdx]
  );

  // Zancudo Espectral Boss Mechanic: Invoca a un araknoide básico cada vez que recibe daño
  const triggerZancudoSummon = useCallback(() => {
    const currentAlive = activeEnemiesRef.current.filter((e) => e.hp > 0 && !e.isAshDissolving);
    if (currentAlive.length >= 5) {
      // Máximo 5 enemigos activos en el campo para evitar sobrecarga visual
      return;
    }
    const summonPool: CombatEnemyId[] = ['araknoide_azul', 'araknoide_rojo', 'araknoide_glacial'];
    const chosenType = summonPool[Math.floor(Math.random() * summonPool.length)];
    const cfg = DUNGEON_ENEMIES[chosenType] || DUNGEON_ENEMIES['araknoide_rojo'];

    const newIdx = activeEnemiesRef.current.length;
    const scaledHp = Math.round(cfg.maxHp * 0.85);

    const newMinion: ChamberEnemyState = {
      uid: `zancudo_summon_${chosenType}_${Date.now()}_${Math.random()}`,
      configId: chosenType,
      name: `${cfg.name} (Cría Invocada)`,
      title: 'Cría de las Sombras • Invocación Abisal',
      hp: scaledHp,
      maxHp: scaledHp,
      ultimateOrbs: 0,
      conditions: [],
      isAshDissolving: false,
      isHitShaking: false,
      hitKey: 0,
      isTwitching: false,
      animation: 'idle',
      spriteUrl: cfg.spriteUrl,
      attackSpriteUrl: cfg.attackSpriteUrl,
      hurtSpriteUrl: cfg.hurtSpriteUrl,
      thumbUrl: cfg.thumbUrl,
      scaleClass: cfg.scaleClass,
      width: cfg.width,
      height: cfg.height,
      slotIndex: newIdx,
      isBoss: false,
      isSemiboss: false,
    };

    activeEnemiesRef.current = [...activeEnemiesRef.current, newMinion];
    setActiveEnemies((prev) => [...prev, newMinion]);
    sound.playSFX('necrotic');
    setTurnSkippedBanner('🕷️ ¡El Zancudo Espectral se estremece al recibir daño e invoca una cría!');
    setTimeout(() => {
      setTurnSkippedBanner(null);
    }, 2200);
  }, [sound]);

  // Grant the Ultimate Move Card into player's hand when 5 orbs are reached
  const checkGrantUltimateCard = useCallback(() => {
    setHand((prev) => {
      if (prev.some((c) => c.skillId === 'cataclismo_astral')) return prev;
      sound.playSFX('powerup');
      sound.playSFX('critical');
      setScreenFlash('gold');
      setTimeout(() => setScreenFlash(null), 350);
      spawnFloating('★ ¡DEFINITIVO CARGADO! ★', false, false, 3, true);
      const ultCard: ActiveCombatCard = {
        instanceId: `ult_${Date.now()}`,
        skillId: 'cataclismo_astral',
        tier: 3,
      };
      if (prev.length >= 4) {
        const next = [...prev];
        next[3] = ultCard;
        return next;
      }
      return [...prev, ultCard];
    });
  }, [spawnFloating]);

  // Charge Ultimate Orbs (+1 on card use, +1 on card merge, +1 on card move) with pulse animation
  const addUltimateOrb = useCallback(
    (amount: number = 1) => {
      setUltimateOrbs((prev) => {
        const next = Math.min(MAX_ULTIMATE_ORBS, prev + amount);
        if (next > prev) {
          sound.playSFX('coin');
          // Disparar animación de carga para el nuevo orbe circular obtenido
          setNewlyGainedOrbIdx(next - 1);
          setTimeout(() => {
            setNewlyGainedOrbIdx(null);
          }, 950);
          spawnFloating(`+${amount} Orbe Definitivo`, false, true);
          if (next >= MAX_ULTIMATE_ORBS) {
            setTimeout(() => {
              checkGrantUltimateCard();
            }, 300);
          }
        }
        return next;
      });
    },
    [checkGrantUltimateCard, spawnFloating]
  );

  // Invariante de Definitiva: Si los orbes caen por debajo de MAX_ULTIMATE_ORBS (por ejemplo si un enemigo roba o drena un orbe),
  // la carta de definitivo ('cataclismo_astral') debe desaparecer de la mano inmediatamente porque ya no está cargada.
  useEffect(() => {
    if (ultimateOrbs < MAX_ULTIMATE_ORBS) {
      setHand((prev) => {
        if (!prev.some((c) => c.skillId === 'cataclismo_astral')) return prev;
        return prev.filter((c) => c.skillId !== 'cataclismo_astral');
      });
      setDragIndex(null);
      setHoverIndex(null);
    }
  }, [ultimateOrbs]);

  // Helper to strictly ensure UN SOLO EMOJI (single grapheme cluster)
  const toSingleEmoji = (icon: string): string => {
    if (!icon) return '✦';
    const trimmed = icon.trim();
    if (typeof Intl !== 'undefined' && (Intl as unknown as { Segmenter?: new (locale: string, opts: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter) {
      const SegmenterClass = (Intl as unknown as { Segmenter: new (locale: string, opts: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
      const segmenter = new SegmenterClass('es', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(trimmed));
      if (segments.length > 0) return segments[0].segment;
    }
    return Array.from(trimmed)[0] || '✦';
  };

  // Status notification handler (toast disabled per user request)
  const queueStatusNotification = useCallback((_item: {
    icon: string;
    title: string;
    detail?: string;
    target: 'hero' | 'enemy';
    isBuff: boolean;
  }) => {
    // No-op: notification banner removed
  }, []);

  // Apply Food Buff & Special In-Combat Effects
  const handleApplyFoodBuff = useCallback(
    (item: any, def: CombatConsumableDefinition) => {
      // MECÁNICA DE JEFE: El Caudillo Gorrak es un glotón caníbal insaciable.
      // Si te comes una comida y Gorrak está presente y vivo en combate, ¡se la come él en vez de ti!
      const gorrakBoss = activeEnemiesRef.current.find(
        (e) => e.configId === 'orco_caudillo' && e.hp > 0
      );

      if (gorrakBoss) {
        sound.playSFX('drain');
        sound.playSFX('critical');

        // Gorrak devora el plato: se cura con creces y puede ganar escudo
        const healAmt = def.immediateHeal
          ? Math.max(35, Math.round(def.immediateHeal * 1.5))
          : Math.round(gorrakBoss.maxHp * 0.22);

        setActiveEnemies((prev) =>
          prev.map((e) =>
            e.uid === gorrakBoss.uid
              ? {
                  ...e,
                  hp: Math.min(e.maxHp, e.hp + healAmt),
                  animation: 'strike',
                }
              : e
          )
        );
        activeEnemiesRef.current = activeEnemiesRef.current.map((e) =>
          e.uid === gorrakBoss.uid
            ? {
                ...e,
                hp: Math.min(e.maxHp, e.hp + healAmt),
              }
            : e
        );

        setTimeout(() => {
          setActiveEnemies((prev) =>
            prev.map((e) => (e.uid === gorrakBoss.uid ? { ...e, animation: 'idle' } : e))
          );
        }, 550);

        // Feedback flotante y banner del robo de comida
        const gorrakSlot = activeEnemiesRef.current.findIndex((e) => e.uid === gorrakBoss.uid);
        setTimeout(() => {
          spawnFloating(
            `+${healAmt} PV (¡ZAMPADO!)`,
            true,
            true,
            3,
            false,
            gorrakSlot >= 0 ? gorrakSlot : undefined,
            'radiant',
            '🍖 GORRAK SE COME TU COMIDA',
            '#ef4444'
          );
        }, 120);

        setTimeout(() => {
          spawnFloating(
            '¡Gorrak te quitó el banquete!',
            false,
            false,
            2,
            false,
            undefined,
            'force',
            '🍽️ PLATO ROBADO',
            '#f59e0b'
          );
        }, 220);

        setDndProcBanner({
          text: `🍗 ¡¡EL CAUDILLO GORRAK SE HA COMIDO TU ${item.name.toUpperCase()}!!`,
          color: '#ef4444',
          icon: '🍖',
        });
        setTimeout(() => setDndProcBanner(null), 3600);

        // Magordito no recibe ningún beneficio, pues el jefe se lo comió todo
        return { stolenByBoss: true, bossName: 'Caudillo Gorrak' };
      }

      // 1. Immediate Heal (Ramen, Potions, etc.)
      if (def.immediateHeal) {
        heroHpRef.current = Math.min(heroMaxHp, heroHpRef.current + def.immediateHeal);
        setHeroHp(heroHpRef.current);
        spawnFloating(`+${def.immediateHeal} PV`, false, true);
      }

      // 2. Immediate Ultimate Gauge (Panes de Ajo: +2 Orbes Definitivos)
      if (def.ultGaugeBonus) {
        addUltimateOrb(def.ultGaugeBonus);
        spawnFloating(`+${def.ultGaugeBonus} Ulti ⚡`, false, true);
      }

      // 3. Protective Shield (Pizza)
      if (def.shieldHp) {
        setFoodShieldHp(def.shieldHp);
        spawnFloating(`+${def.shieldHp} Escudo 🛡️`, false, true);
      }

      // 4. Purify CC Debuffs (Tortilla / Sushi)
      if (def.purifyDebuffs) {
        setHeroConditions((prev) =>
          prev.filter(
            (c) =>
              c.type !== 'paralyze' &&
              c.type !== 'paralyzed' &&
              c.type !== 'stun' &&
              c.type !== 'stunned' &&
              c.type !== 'blind' &&
              c.type !== 'blinded' &&
              c.type !== 'poison' &&
              c.type !== 'decay'
          )
        );
        queueStatusNotification({
          icon: '✨',
          title: 'Purificación de Banquete',
          detail: 'Alteraciones de estado eliminadas',
          target: 'hero',
          isBuff: true,
        });
      }

      // 5. Register active food buff state
      const nextBuff: ActiveCombatFoodBuff = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        foodEffectTitle: def.foodEffectTitle,
        foodEffectBadge: def.foodEffectBadge,
        foodBuffType: def.foodBuffType,
        detailedEffect: def.detailedEffect,
        atkMultiplier: def.atkMultiplier,
        defMultiplier: def.defMultiplier,
        shieldHp: def.shieldHp,
        regenPerTurn: def.regenPerTurn,
        critRateBonus: def.critRateBonus,
        critDamageBonus: def.critDamageBonus,
        pierceDefense: def.pierceDefense,
        evadeNextHit: def.evadeNextHit,
        lifestealRate: def.lifestealRate,
        goldXpMultiplier: def.goldXpMultiplier,
      };
      setActiveFoodBuff(nextBuff);

      // 6. Proc Banner Notification
      setDndProcBanner({
        text: `🍽️ BANQUETE: ${def.foodEffectTitle.toUpperCase()}`,
        color: '#f59e0b',
        icon: '🍽️',
      });
      setTimeout(() => setDndProcBanner(null), 3200);
    },
    [heroMaxHp, spawnFloating, addUltimateOrb, queueStatusNotification]
  );

  // Helper to draw random tier 1 skill (spawns Edacorn skills during m3_cuevas_rojo, Magordito skills otherwise)
  const drawRandomCard = (): ActiveCombatCard => {
    if (selectedCombatMissionId === 'm3_cuevas_rojo') {
      const edacornSkills = ['ataque_furtivo', 'contraataque', 'sigilo'];
      const randomKey = edacornSkills[Math.floor(Math.random() * edacornSkills.length)];
      return {
        instanceId: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        skillId: randomKey,
        tier: 1,
      };
    }
    const regularSkills = [
      'rayo_necrotico',      // Lightning - Rayo Voltaico
      'dios_oscuro',         // Necrotic - Dios Oscuro
      'drenar_maldiciones',  // Poison - Peste Tóxica
      'fortalecer_marioneta',// Slashing - Tajo Lacerante
    ];
    const randomKey = regularSkills[Math.floor(Math.random() * regularSkills.length)];
    return {
      instanceId: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      skillId: randomKey,
      tier: 1,
    };
  };

  // Refill hand back to 4 cards at the start of each player turn
  const refillHandToFull = useCallback(() => {
    setHand((prev) => {
      const needed = 4 - prev.length;
      if (needed <= 0) return prev;
      const newCards: ActiveCombatCard[] = [];
      for (let i = 0; i < needed; i++) {
        newCards.push(drawRandomCard());
      }
      return [...prev, ...newCards];
    });
  }, []);

  // Start or transition to a specific dungeon chamber (Endless Wave flow)
  const startChamber = (floorNumber: number) => {
    sound.playSFX('powerup');
    setCurrentFloor(floorNumber);
    if (floorNumber > bestFloor) {
      setBestFloor(floorNumber);
      try {
        localStorage.setItem('icespear_best_floor', String(floorNumber));
      } catch {}
    }

    const newEnemies = createChamberEnemies(floorNumber, selectedCombatMissionId);
    activeEnemiesRef.current = newEnemies;
    setActiveEnemies(newEnemies);
    setSelectedEnemyIdx(0);

    // Cleanse negative conditions on hero between chambers
    setHeroConditions((prev) => prev.filter((c) => c.isBuff));

    setTurnCounter(1);
    setHeroCastSkill(null);
    setHeroAnimation('idle');
    setEnemyAnimation('idle');
    setIsHeroHitShaking(false);
    setIsEnemyHitShaking(false);
    setIsEnemyAshDissolving(false);
    setIsHeroAshDissolving(false);
    setSlashEffect('none');
    setBattleState('idle');
    setMergeAnim(null);
    setSelectedConditionTooltip(null);
    setActiveVfx({ type: 'none', tier: 1 });
    setBossTransitioning(false);
    setWaveClearBanner(null);
    refillHandToFull();
  };

  // Reset or restart run from Sala 1 (banks accumulated rewards first)
  const handleRestartBattle = () => {
    if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
    if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
    accumulatedLoot.items.forEach((item) => {
      addShelfItem({
        id: `${item.id}_${Date.now()}`,
        name: item.name,
        category: 'materials',
        rarity: item.rarity as any,
        count: item.count,
        icon: item.icon,
        description: item.description,
      });
    });

    setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });
    heroHpRef.current = MAX_HERO_HP;
    setHeroHp(MAX_HERO_HP);
    setHeroConditions([]);
    setUltimateOrbs(0);
    startChamber(1);
  };

  // Retreat from dungeon and bank all accumulated rewards safely
  const handleRetreatAndClaim = () => {
    sound.stopBGM();
    if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
    if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
    accumulatedLoot.items.forEach((item) => {
      addShelfItem({
        id: `${item.id}_${Date.now()}`,
        name: item.name,
        category: 'materials',
        rarity: item.rarity as any,
        count: item.count,
        icon: item.icon,
        description: item.description,
      });
    });
    const wasMapEvent =
      selectedCombatMissionId === 'evento_emboscada_bandidos' ||
      selectedCombatMissionId === 'evento_asalto_orco';
    setSelectedCombatMissionId(null);
    navigateTo(wasMapEvent ? 'world' : 'quest');
  };

  // Finalize enemy phase: tick conditions on enemies & hero, resolve start-of-turn DoT/HoT, refill hand
  const finalizeEnemyPhase = () => {
    setTimeout(() => {
      setActiveVfx({ type: 'none', tier: 1 });
      setHeroCastSkill(null);
      setHeroAnimation('idle');

      // 1. Tick down conditions on all alive enemies & apply DoT damages (Burn, Bleed, Poison)
      setActiveEnemies((prev) =>
        prev.map((e, eIdx) => {
          if (e.hp <= 0 || e.isAshDissolving) return e;

          let updatedHp = e.hp;
          let dotDamage = 0;
          let primaryDotType: DndDamageType | undefined = undefined;

          // Burn DoT (Fuego)
          const burnEffect = e.conditions.find((c) => c.type === 'burn');
          if (burnEffect) {
            const bDmg = 8 * burnEffect.stacks;
            dotDamage += bDmg;
            primaryDotType = 'fire';
            spawnFloating(`-${bDmg}`, true, false, 1, false, eIdx, 'fire', '🔥 QUEMADURA', '#ea580c');
          }

          // Bleed DoT (Perforante) - True DoT
          const bleedEffect = e.conditions.find((c) => c.type === 'bleed');
          if (bleedEffect) {
            const blDmg = 9 * bleedEffect.stacks;
            dotDamage += blDmg;
            if (!primaryDotType) primaryDotType = 'piercing';
            spawnFloating(`-${blDmg}`, true, false, 1, false, eIdx, 'piercing', '🩸 SANGRADO', '#94a3b8');
          }

          // Poison DoT (Veneno)
          const poisonEffect = e.conditions.find((c) => c.type === 'poison' || c.type === 'poisoned');
          if (poisonEffect) {
            const pDmg = 7 * poisonEffect.stacks;
            dotDamage += pDmg;
            if (!primaryDotType) primaryDotType = 'poison';
            spawnFloating(`-${pDmg}`, true, false, 1, false, eIdx, 'poison', '☣️ VENENO', '#10b981');
          }

          if (dotDamage > 0) {
            updatedHp = Math.max(0, updatedHp - dotDamage);
            triggerEnemyHitReaction(primaryDotType);
          }

          const { remainingEffects, expiredEffects } = tickGachaEffects(e.conditions);
          expiredEffects.forEach((exp) => {
            queueStatusNotification({
              icon: exp.icon || '⌛',
              title: exp.name,
              detail: `Efecto expirado en ${e.name}`,
              target: 'enemy',
              isBuff: exp.isBuff,
            });
          });
          return {
            ...e,
            hp: updatedHp,
            conditions: remainingEffects,
            isAshDissolving: updatedHp <= 0,
          };
        })
      );

      // Keep activeEnemiesRef in sync immediately
      activeEnemiesRef.current = activeEnemiesRef.current.map((e) => {
        const found = e;
        return found;
      });

      // Check if DoT defeated all enemies in the chamber
      const aliveAfterDot = activeEnemiesRef.current.filter((e) => e.hp > 0 && !e.isAshDissolving);
      if (aliveAfterDot.length === 0) {
        setHeroAnimation('idle');
        setTimeout(() => {
          handleAllEnemiesDefeated();
        }, 400);
        return;
      }

      // 2. Tick down Hero Gacha Effects & resolve hero start-of-turn (Poison DoT)
      let willSkipPlayerTurn = false;
      let skipReason = '';

      setHeroConditions((prev) => {
        // Poison DoT on Hero
        const poison = prev.find((c) => c.type === 'poison' || c.type === 'poisoned');
        if (poison) {
          const pDmg = 5 * poison.stacks;
          heroHpRef.current = Math.max(0, heroHpRef.current - pDmg);
          const currentHp = heroHpRef.current;
          setHeroHp(currentHp);
          spawnFloating(`-${pDmg}`, false, false);
          queueStatusNotification({
            icon: '☣️',
            title: 'Veneno DoT',
            detail: `-${pDmg} PV en Magordito`,
            target: 'hero',
            isBuff: false,
          });
          triggerHeroHitReaction('poison');
          sound.playSFX('hurt');

          if (currentHp <= 0) {
            setIsHeroAshDissolving(true);
            setHeroAnimation('dead');
            sound.playSFX('necrotic');
            setTimeout(() => {
              setIsHeroAshDissolving(false);
              setHeroAnimation('idle');
              setBattleState('defeat');
              sound.playSFX('defeat');
            }, 2200);
          }
        }

        const { remainingEffects, expiredEffects } = tickGachaEffects(prev);
        expiredEffects.forEach((exp) => {
          queueStatusNotification({
            icon: exp.icon || '⌛',
            title: exp.name,
            detail: 'Efecto expirado en Magordito',
            target: 'hero',
            isBuff: exp.isBuff,
          });
        });

        // Check if Hero is incapacitated (Paralyze or Stun)
        const hardCC = remainingEffects.find(
          (c) =>
            c.type === 'paralyze' ||
            c.type === 'paralyzed' ||
            c.type === 'stun' ||
            c.type === 'stunned'
        );
        if (hardCC) {
          willSkipPlayerTurn = true;
          skipReason =
            hardCC.type === 'stun' || hardCC.type === 'stunned'
              ? 'Aturdimiento'
              : 'Parálisis';
        }

        return remainingEffects;
      });

      setTurnCounter((prev) => prev + 1);
      setHeroStatusTrigger((prev) => prev + 1);

      // Turn-start HP Regeneration (Ramen Humeante, etc.)
      if (activeFoodBuff?.regenPerTurn && heroHpRef.current > 0 && heroHpRef.current < heroMaxHp) {
        const healAmt = activeFoodBuff.regenPerTurn;
        heroHpRef.current = Math.min(heroMaxHp, heroHpRef.current + healAmt);
        setHeroHp(heroHpRef.current);
        spawnFloating(`+${healAmt} PV (Ramen)`, false, true);
        sound.playSFX('coin');
      }

      // If player is hard CCed, skip turn and enemy acts again
      if (willSkipPlayerTurn) {
        setHeroTwitching(true);
        setTimeout(() => setHeroTwitching(false), 900);
        sound.playSFX('necrotic');
        setTurnSkippedBanner(`¡Turno omitido por ${skipReason}!`);
        setTimeout(() => setTurnSkippedBanner(null), 2200);

        queueStatusNotification({
          icon: '⚡',
          title: `¡Turno Omitido (${skipReason})!`,
          detail: 'Magordito no puede actuar. ¡Los enemigos toman un turno consecutivo!',
          target: 'hero',
          isBuff: false,
        });

        setBattleState('enemy_acting');
        setTimeout(() => {
          executeEnemyTurn();
        }, 900);
        return;
      }

      // Normal player turn: refill hand to 4 and idle
      refillHandToFull();
      setBattleState('idle');
    }, 550);
  };

  // Chamber Cleared: Accumulate rewards and direct wave-advance to next chamber
  const handleAllEnemiesDefeated = () => {
    // Check if Devorador Quitinoso (Fase 1) defeated -> Break Bar! Trigger Fase 2 (Frenesí Quitinoso)
    const hasDevoradorBoss = activeEnemiesRef.current.some(
      (e) => e.configId === 'devorador_quitinoso' && e.hasPhaseTwo
    );

    if (hasDevoradorBoss || selectedCombatMissionId === 'm4_puertas_selladas' && activeEnemiesRef.current.some(e => e.configId === 'devorador_quitinoso')) {
      sound.playSFX('critical');
      sound.playSFX('powerup');
      setBossTransitioning(true);
      setScreenFlash('red');
      setTimeout(() => setScreenFlash(null), 450);

      const devoradorP2Cfg = DUNGEON_ENEMIES.devorador_quitinoso_p2;
      const devoradorP2Enemy: ChamberEnemyState = {
        uid: `devorador_p2_${Date.now()}`,
        configId: 'devorador_quitinoso_p2',
        name: devoradorP2Cfg.name,
        title: devoradorP2Cfg.title,
        hp: devoradorP2Cfg.maxHp,
        maxHp: devoradorP2Cfg.maxHp,
        ultimateOrbs: 0,
        conditions: [],
        isAshDissolving: false,
        isHitShaking: false,
        hitKey: 0,
        isTwitching: false,
        animation: 'idle',
        spriteUrl: devoradorP2Cfg.spriteUrl,
        attackSpriteUrl: devoradorP2Cfg.attackSpriteUrl,
        hurtSpriteUrl: devoradorP2Cfg.hurtSpriteUrl,
        thumbUrl: devoradorP2Cfg.thumbUrl,
        scaleClass: devoradorP2Cfg.scaleClass,
        width: devoradorP2Cfg.width,
        height: devoradorP2Cfg.height,
        slotIndex: 0,
        hasPhaseTwo: false,
        isBoss: true,
        isSemiboss: false,
      };

      setTurnSkippedBanner('💥 ¡¡RUPTURA DE CORAZA!! FASE 2: ¡FRENESÍ QUITINOSO!');
      setTimeout(() => setTurnSkippedBanner(null), 3000);

      setTimeout(() => {
        setActiveEnemies([devoradorP2Enemy]);
        activeEnemiesRef.current = [devoradorP2Enemy];
        setSelectedEnemyIdx(0);
        setBossTransitioning(false);
        refillHandToFull();
        setBattleState('idle');
      }, 2000);
      return;
    }

    // Check if Devorador Quitinoso (Fase 2) is defeated -> Complete m4_puertas_selladas and immediately launch epilogue!
    const hasDevoradorP2Defeated = activeEnemiesRef.current.some(
      (e) => e.configId === 'devorador_quitinoso_p2'
    );

    if (hasDevoradorP2Defeated || selectedCombatMissionId === 'm4_puertas_selladas') {
      sound.playSFX('victory');
      launchConfetti();

      completeQuestMission('m4_puertas_selladas', 3);
      setActiveQuestChapter(2);
      addGold(8000);
      addCrystals(300);
      const corazaTitanItem = {
        id: 'coraza_quitinosa_titan',
        name: 'Coraza del Devorador Quitinoso',
        category: 'materials' as const,
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        rarity: 'SSR' as const,
        priceGold: 8000,
        description: 'El núcleo de coraza blindada del coloso que custodiaba las puertas selladas de Glimmerstone. Material de forja legendario.',
      };
      addShelfItem(corazaTitanItem);

      // Award exotic cooking drop: Carne de Devorador
      const carneDevoradorItem = {
        id: `ing_carne_devorador_${Date.now()}`,
        name: 'Carne de Devorador',
        category: 'materials' as const,
        count: 3,
        icon: '/assets/items/ing_carne_devorador.png',
        rarity: 'SSR' as const,
        priceGold: 240,
        description: 'Carne densa y marmolada protegida por la coraza quitinosa del Devorador. Jugosa, potente y digna de un banquete colosal.',
      };
      addShelfItem(carneDevoradorItem);

      try {
        const stock = loadTavernCookingStock();
        stock['ing_carne_devorador'] = (stock['ing_carne_devorador'] || 0) + 3;
        saveTavernCookingStock(stock);
      } catch (e) {
        console.error('Failed to update tavern cooking stock:', e);
      }

      // Bank accumulated loot safely
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: 1,
        gold: 8000,
        crystals: 300,
        nextFloor: 1,
      });

      setSelectedCombatMissionId(null);
      setTimeout(() => {
        navigateTo('quest');
      }, 1500);
      return;
    }

    // Specialized Victory Handling for El Zancudo Espectral (m5_cuevas_zancudo)
    if (selectedCombatMissionId === 'm5_cuevas_zancudo') {
      sound.playSFX('victory');
      launchConfetti();

      completeQuestMission('m5_cuevas_zancudo', 3);
      addGold(10000);
      addCrystals(350);
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      addShelfItem({
        id: `pata_aguja_zancudo_${Date.now()}`,
        name: 'Pata Aguja de Zancudo',
        category: 'materials',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/fragmento_astral.png',
        priceGold: 8500,
        description: 'Extremidad puntiaguda y letal del Jefe Zancudo Espectral, impregnada de esencia abisal del Corazón de la Colonia.',
      });
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: 1,
        gold: 10000,
        crystals: 350,
        nextFloor: 1,
      });

      // Launch the Zancudo Espectral epilogue dialogue directly!
      setTimeout(() => {
        setSelectedCombatMissionId('m5_cuevas_zancudo_epilogo');
        navigateTo('story');
      }, 1500);
      return;
    }

    // Specialized Victory Handling for Infección Glacial / Caverna Congelada (m4_cuevas_azul)
    if (selectedCombatMissionId === 'm4_cuevas_azul') {
      sound.playSFX('victory');
      launchConfetti();

      completeQuestMission('m4_cuevas_azul', 3);
      addGold(8000);
      addCrystals(250);
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      addShelfItem({
        id: `aguja_criogenica_${Date.now()}`,
        name: 'Aguja Criogénica Parasitaria',
        category: 'materials',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        priceGold: 6000,
        description: 'Púa glacial extraída de los acechadores congelados que inocula la mutación viral arácnida.',
      });
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: 1,
        gold: 8000,
        crystals: 250,
        nextFloor: 1,
      });

      // Launch the Caverna Congelada epilogue dialogue directly!
      setTimeout(() => {
        setSelectedCombatMissionId('m4_cuevas_azul_epilogo');
        navigateTo('story');
      }, 1500);
      return;
    }

    // Specialized Victory Handling for Furia Carmesí (m3_cuevas_rojo)
    if (selectedCombatMissionId === 'm3_cuevas_rojo') {
      sound.playSFX('victory');
      launchConfetti();

      completeQuestMission('m3_cuevas_rojo', 3);
      addGold(7000);
      addCrystals(250);
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      addShelfItem({
        id: `huevo_carmesi_${Date.now()}`,
        name: 'Huevo Carmesí Calcificado',
        category: 'materials',
        rarity: 'SSR',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        priceGold: 5000,
        description: 'Huevo mutante petrificado de la cámara de cría tras la purga de Edacorn. Reliquia repleta de maná primigenio.',
      });
      // Award exotic cooking drops: Huevos de Araknoide & Larvas de Araknoide
      addShelfItem({
        id: `ing_huevos_araknoide_${Date.now()}`,
        name: 'Huevos de Araknoide',
        category: 'materials',
        count: 4,
        icon: '/assets/items/ing_huevos_araknoide.png',
        rarity: 'SR',
        priceGold: 160,
        description: 'Huevos translúcidos recolectados en los nidos carmesíes de la colonia. Ingrediente exótico con suave luminiscencia nutritiva.',
      });
      addShelfItem({
        id: `ing_larvas_araknoide_${Date.now()}`,
        name: 'Larvas de Araknoide',
        category: 'materials',
        count: 4,
        icon: '/assets/items/ing_larvas_araknoide.png',
        rarity: 'SR',
        priceGold: 150,
        description: 'Larvas cavernícolas ricas en proteínas y maná residual. Crujientes al saltear y de gran valor culinario.',
      });
      try {
        const stock = loadTavernCookingStock();
        stock['ing_huevos_araknoide'] = (stock['ing_huevos_araknoide'] || 0) + 4;
        stock['ing_larvas_araknoide'] = (stock['ing_larvas_araknoide'] || 0) + 4;
        saveTavernCookingStock(stock);
      } catch (e) {
        console.error('Failed to update tavern cooking stock:', e);
      }
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: 1,
        gold: 7000,
        crystals: 250,
        nextFloor: 1,
      });

      // Launch the Furia Carmesí epilogue dialogue directly!
      setTimeout(() => {
        setSelectedCombatMissionId('m3_cuevas_rojo_epilogo');
        navigateTo('story');
      }, 1500);
      return;
    }

    // Specialized Victory Handling for Evento de Asalto Orco
    if (selectedCombatMissionId === 'evento_asalto_orco') {
      sound.playSFX('victory');
      launchConfetti();

      addGold(5000);
      addCrystals(200);
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: 1,
        gold: 5000,
        crystals: 200,
        nextFloor: 1,
      });

      // Launch the Asalto Orco epilogue dialogue directly!
      setTimeout(() => {
        setSelectedCombatMissionId('evento_asalto_orco_epilogo');
        navigateTo('story');
      }, 1500);
      return;
    }

    // Specialized Victory Handling for Evento de Emboscada de Bandidos
    if (selectedCombatMissionId === 'evento_emboscada_bandidos') {
      sound.playSFX('victory');
      launchConfetti();

      addGold(4000);
      addCrystals(150);
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: 1,
        gold: 4000,
        crystals: 150,
        nextFloor: 1,
      });

      // Launch the ambush epilogue dialogue directly!
      setTimeout(() => {
        setSelectedCombatMissionId('evento_emboscada_bandidos_epilogo');
        navigateTo('story');
      }, 1500);
      return;
    }

    // Check if Sala 10 Phase 1 Araknoide Ancestral -> emerge Medusa Abisal
    const hasAraknoideBoss = activeEnemiesRef.current.some(
      (e) => e.configId === 'araknoide' && e.hasPhaseTwo
    );

    if (hasAraknoideBoss && currentFloor === 10) {
      sound.playSFX('powerup');
      setBossTransitioning(true);
      setScreenFlash('cyan');
      setTimeout(() => setScreenFlash(null), 350);

      const medusaCfg = DUNGEON_ENEMIES.medusa;
      const medusaEnemy: ChamberEnemyState = {
        uid: `medusa_f10_phase2_${Date.now()}`,
        configId: 'medusa',
        name: medusaCfg.name,
        title: medusaCfg.title,
        hp: medusaCfg.maxHp,
        maxHp: medusaCfg.maxHp,
        ultimateOrbs: 0,
        conditions: [],
        isAshDissolving: false,
        isHitShaking: false,
        hitKey: 0,
        isTwitching: false,
        animation: 'idle',
        spriteUrl: medusaCfg.spriteUrl,
        attackSpriteUrl: medusaCfg.attackSpriteUrl,
        hurtSpriteUrl: medusaCfg.hurtSpriteUrl,
        thumbUrl: medusaCfg.thumbUrl,
        scaleClass: medusaCfg.scaleClass,
        width: medusaCfg.width,
        height: medusaCfg.height,
        slotIndex: 0,
        hasPhaseTwo: false,
        isBoss: true,
        isSemiboss: false,
      };

      queueStatusNotification({
        icon: '🪼',
        title: '¡FASE 2: MEDUSA ABISAL!',
        detail: '¡Una medusa eléctrica bioluminiscente desciende de la cueva!',
        target: 'enemy',
        isBuff: true,
      });

      setTimeout(() => {
        setActiveEnemies([medusaEnemy]);
        setSelectedEnemyIdx(0);
        setBossTransitioning(false);
        refillHandToFull();
        setBattleState('idle');
      }, 2000);
      return;
    }

    // Specialized Wave Progression for Robo no tan Justo (m2_robo)
    if (selectedCombatMissionId === 'm2_robo') {
      sound.playSFX('victory');
      launchConfetti();

      const waveGold = 1200 + currentFloor * 400;
      const waveCrystals = 50 + currentFloor * 20;

      const firstEnemyCfg =
        DUNGEON_ENEMIES[activeEnemiesRef.current[0]?.configId] || DUNGEON_ENEMIES['guardia_lanza'];
      const itemDrop = {
        id: `${firstEnemyCfg.rewards.item.id}_w${currentFloor}`,
        name: firstEnemyCfg.rewards.item.name,
        count: 1,
        icon: firstEnemyCfg.rewards.item.icon,
        rarity: firstEnemyCfg.rewards.item.rarity,
        description: firstEnemyCfg.rewards.item.description,
      };

      setAccumulatedLoot((prev) => ({
        gold: prev.gold + waveGold,
        crystals: prev.crystals + waveCrystals,
        items: [...prev.items, itemDrop],
      }));

      // Check if all 4 waves of the guard mission are completed
      if (currentFloor >= 4) {
        completeQuestMission('m2_robo', 3);
        addGold(5000);
        addCrystals(200);
        const cofreItem = {
          id: 'cofre_mansion_botin',
          name: 'Cofre Sellado de la Mansión',
          category: 'materials' as const,
          count: 1,
          icon: '/assets/items/cofre_sellado_mansion.png',
          rarity: 'SSR' as const,
          priceGold: 5000,
          description: 'Cofre de roble con herrajes de latón y un cerrojo mágico sellado, repleto de doblones de oro y gemas, sustraído durante el asalto a la mansión tras derrotar a toda la guardia de Icespear.',
        };
        addShelfItem(cofreItem);

        if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
        if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
        accumulatedLoot.items.forEach((it) =>
          addShelfItem({
            id: `${it.id}_${Date.now()}`,
            name: it.name,
            category: 'materials',
            rarity: it.rarity as any,
            count: it.count,
            icon: it.icon,
            description: it.description,
          })
        );
        setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

        setWaveClearBanner({
          floor: 4,
          gold: 5000,
          crystals: 200,
          nextFloor: 4,
        });

        setSelectedCombatMissionId(null);
        setTimeout(() => {
          navigateTo('quest');
        }, 1500);
        return;
      }

      setWaveClearBanner({
        floor: currentFloor,
        gold: waveGold,
        crystals: waveCrystals,
        nextFloor: currentFloor + 1,
      });

      setTimeout(() => {
        startChamber(currentFloor + 1);
      }, 1800);
      return;
    }

    // Specialized Wave Progression for Emboscada Goblin en el Bosque (m3_bosque)
    if (selectedCombatMissionId === 'm3_bosque') {
      sound.playSFX('victory');
      launchConfetti();

      const waveGold = 1000 + currentFloor * 500;
      const waveCrystals = 40 + currentFloor * 30;

      const firstEnemyCfg =
        DUNGEON_ENEMIES[activeEnemiesRef.current[0]?.configId] || DUNGEON_ENEMIES['goblin_daga'];
      const itemDrop = {
        id: `${firstEnemyCfg.rewards.item.id}_w${currentFloor}`,
        name: firstEnemyCfg.rewards.item.name,
        count: 1,
        icon: firstEnemyCfg.rewards.item.icon,
        rarity: firstEnemyCfg.rewards.item.rarity,
        description: firstEnemyCfg.rewards.item.description,
      };

      setAccumulatedLoot((prev) => ({
        gold: prev.gold + waveGold,
        crystals: prev.crystals + waveCrystals,
        items: [...prev.items, itemDrop],
      }));

      // Check if both 2 waves of goblins are completed
      if (currentFloor >= 2) {
        completeQuestMission('m3_bosque', 3);
        addGold(4000);
        addCrystals(150);
        const mapaItem = {
          id: 'mapa_mina_glimmerstone',
          name: 'Mapa de la Colonia de Plata de Glimmerstone',
          category: 'materials' as const,
          count: 1,
          icon: '/assets/backgrounds/mapa_icespear_clean_nobtn.png',
          rarity: 'SSR' as const,
          priceGold: 4000,
          description: 'Pergamino antiguo recuperado del chamán goblin con runas enanas. Revela la entrada a la histórica colonia minera de Glimmerstone en Icespear, célebre por sus ricas vetas de plata.',
        };
        addShelfItem(mapaItem);

        if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
        if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
        accumulatedLoot.items.forEach((it) =>
          addShelfItem({
            id: `${it.id}_${Date.now()}`,
            name: it.name,
            category: 'materials',
            rarity: it.rarity as any,
            count: it.count,
            icon: it.icon,
            description: it.description,
          })
        );
        setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

        setWaveClearBanner({
          floor: 2,
          gold: 4000,
          crystals: 150,
          nextFloor: 2,
        });

        setSelectedCombatMissionId(null);
        setTimeout(() => {
          navigateTo('quest');
        }, 1500);
        return;
      }

      setWaveClearBanner({
        floor: currentFloor,
        gold: waveGold,
        crystals: waveCrystals,
        nextFloor: currentFloor + 1,
      });

      setTimeout(() => {
        startChamber(currentFloor + 1);
      }, 1800);
      return;
    }

    // Standard Chamber Cleared!
    sound.playSFX('victory');
    launchConfetti();

    // Calculate room rewards (scales higher the deeper you go)
    const roomGold = Math.round((1200 + currentFloor * 400) * (currentFloor > 10 ? 1.4 : 1));
    const roomCrystals = Math.round(45 + currentFloor * 18);

    const firstEnemyCfg =
      DUNGEON_ENEMIES[activeEnemiesRef.current[0]?.configId] || DUNGEON_ENEMIES['araknoide_rojo'];
    const itemDrop = {
      id: `${firstEnemyCfg.rewards.item.id}_f${currentFloor}`,
      name: firstEnemyCfg.rewards.item.name,
      count: 1,
      icon: firstEnemyCfg.rewards.item.icon,
      rarity: firstEnemyCfg.rewards.item.rarity,
      description: firstEnemyCfg.rewards.item.description,
    };

    setAccumulatedLoot((prev) => ({
      gold: prev.gold + roomGold,
      crystals: prev.crystals + roomCrystals,
      items: [...prev.items, itemDrop],
    }));

    // When completing any mission from the Quests menu (m1_tirano, chapter 2 mines, etc.):
    if (selectedCombatMissionId) {
      completeQuestMission(selectedCombatMissionId, 3);
      addGold(roomGold);
      addCrystals(roomCrystals);
      addShelfItem({
        id: `${itemDrop.id}_${Date.now()}`,
        name: itemDrop.name,
        category: 'materials',
        rarity: itemDrop.rarity as any,
        count: itemDrop.count,
        icon: itemDrop.icon,
        description: itemDrop.description,
      });

      // Bank all accumulated rewards safely
      if (accumulatedLoot.gold > 0) addGold(accumulatedLoot.gold);
      if (accumulatedLoot.crystals > 0) addCrystals(accumulatedLoot.crystals);
      accumulatedLoot.items.forEach((it) =>
        addShelfItem({
          id: `${it.id}_${Date.now()}`,
          name: it.name,
          category: 'materials',
          rarity: it.rarity as any,
          count: it.count,
          icon: it.icon,
          description: it.description,
        })
      );
      setAccumulatedLoot({ gold: 0, crystals: 0, items: [] });

      setWaveClearBanner({
        floor: currentFloor,
        gold: roomGold,
        crystals: roomCrystals,
        nextFloor: currentFloor,
      });

      setSelectedCombatMissionId(null);
      setTimeout(() => {
        navigateTo('quest');
      }, 1500);
      return;
    }

    if (currentFloor <= 10) {
      const baseChamber = BASE_CHAMBERS[currentFloor - 1];
      if (baseChamber?.missionId) {
        completeQuestMission(baseChamber.missionId, 3);
      }
    }

    // Wave clear banner
    setWaveClearBanner({
      floor: currentFloor,
      gold: roomGold,
      crystals: roomCrystals,
      nextFloor: currentFloor + 1,
    });

    // DIRECT AUTOMATIC TRANSITION TO NEXT CHAMBER (Endless wave rush flow only for free expedition)
    setTimeout(() => {
      startChamber(currentFloor + 1);
    }, 1800);
  };
 
  // Safety recovery timeout: Prevents battle from ever getting permanently stuck
  useEffect(() => {
    if (battleState === 'player_acting' || battleState === 'enemy_acting') {
      const timeout = setTimeout(() => {
        const alive = activeEnemiesRef.current.filter((e) => e.hp > 0 && !e.isAshDissolving);
        if (alive.length === 0) {
          handleAllEnemiesDefeated();
        } else {
          setActiveVfx({ type: 'none', tier: 1 });
          setHeroAnimation('idle');
          setEnemyAnimation('idle');
          refillHandToFull();
          setBattleState('idle');
        }
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [battleState, refillHandToFull]);

  // Execute Enemy Turn Phase (1 vs 1 Pokemon Style with Tactical AI Switching and Unique Attacks)
  const executeEnemyTurn = () => {
    if (battleState === 'defeat' || battleState === 'victory') return;

    const alive = activeEnemiesRef.current.filter((e) => e.hp > 0 && !e.isAshDissolving);
    if (alive.length === 0) {
      handleAllEnemiesDefeated();
      return;
    }

    setBattleState('enemy_acting');

    // Get active enemy currently standing on the field
    let actingEnemy = activeEnemiesRef.current[selectedEnemyIdx];
    if (!actingEnemy || actingEnemy.hp <= 0 || actingEnemy.isAshDissolving) {
      const nextAliveIdx = activeEnemiesRef.current.findIndex((e) => e.hp > 0 && !e.isAshDissolving);
      if (nextAliveIdx >= 0) {
        setSelectedEnemyIdx(nextAliveIdx);
        actingEnemy = activeEnemiesRef.current[nextAliveIdx];
      } else {
        handleAllEnemiesDefeated();
        return;
      }
    }

    // Tactical Enemy AI Tag-Team Switch: El juego detecta cuándo conviene relevar
    const aliveBench = activeEnemiesRef.current
      .map((e, idx) => ({ e, idx }))
      .filter(({ e, idx }) => idx !== selectedEnemyIdx && e.hp > 0 && !e.isAshDissolving);

    if (aliveBench.length > 0) {
      const activeHpRatio = actingEnemy.hp / actingEnemy.maxHp;
      const sortedByHp = [...aliveBench].sort((a, b) => (b.e.hp / b.e.maxHp) - (a.e.hp / a.e.maxHp));
      const healthiestBench = sortedByHp[0];
      const healthiestRatio = healthiestBench.e.hp / healthiestBench.e.maxHp;

      const hasSevereDebuff = actingEnemy.conditions.some((c) =>
        c.type === 'paralyzed' || c.type === 'stunned' || c.type === 'poisoned' || c.type === 'frozen' || c.type === 'def_break'
      );

      // Criterio 1: Salud baja del activo (< 40%) y aliado sano en el banquillo (>= 50%)
      const shouldPreserveLowHp = activeHpRatio < 0.40 && healthiestRatio >= 0.50;
      // Criterio 2: El activo está incapacitado o con debuffs mientras que el banquillo está libre de estados
      const shouldSwapAfflicted = hasSevereDebuff && healthiestBench.e.conditions.length === 0 && Math.random() < 0.60;
      // Criterio 3: Relevo táctico periódico si el aliado tiene mayor porcentaje de vida
      const tacticalSwap = turnCounter % 3 === 0 && healthiestRatio > activeHpRatio + 0.20 && Math.random() < 0.50;

      if (shouldPreserveLowHp || shouldSwapAfflicted || tacticalSwap) {
        switchActiveEnemy(healthiestBench.idx, true);
        setTimeout(() => {
          finalizeEnemyPhase();
        }, 950);
        return;
      }
    }

    // Check Freezing (Frío - Congelación Glacial)
    const isFrozen = actingEnemy.conditions.some((c) => c.type === 'frozen');
    if (isFrozen) {
      sound.playSFX('laser');
      setTurnSkippedBanner(`❄️ ¡${actingEnemy.name} está CONGELADO y pierde el turno!`);
      setTimeout(() => setTurnSkippedBanner(null), 2000);
      spawnFloating('❄️ CONGELADO', true, false, 2, false, selectedEnemyIdx, 'cold', 'CONGELACIÓN', '#38bdf8');
      setTimeout(finalizeEnemyPhase, 600);
      return;
    }

    // Check Crowd Control (Parálisis / Aturdimiento / Contundente)
    const isCC = actingEnemy.conditions.some(
      (c) => c.type === 'paralyze' || c.type === 'paralyzed' || c.type === 'stun' || c.type === 'stunned'
    );

    if (isCC) {
      sound.playSFX('necrotic');
      setTurnSkippedBanner(`⚡ ¡${actingEnemy.name} está INCAPACITADO y pierde el turno!`);
      setTimeout(() => setTurnSkippedBanner(null), 2000);
      spawnFloating('💫 INCAPACITADO', true, false, 2, false, selectedEnemyIdx, 'bludgeoning', 'ATURDIDO', '#d97706');
      setTimeout(finalizeEnemyPhase, 500);
      return;
    }

    // Check Confusion (Psíquico - 35% probabilidad de autolesión)
    const isConfused = actingEnemy.conditions.some((c) => c.type === 'confused');
    if (isConfused && Math.random() < 0.35) {
      sound.playSFX('hurt');
      const selfDmg = Math.max(10, Math.round(actingEnemy.maxHp * 0.12));
      setActiveEnemies((prev) =>
        prev.map((e) =>
          e.uid === actingEnemy.uid
            ? { ...e, hp: Math.max(0, e.hp - selfDmg), isAshDissolving: e.hp - selfDmg <= 0 }
            : e
        )
      );
      triggerEnemyHitReaction('psychic');
      spawnFloating(`-${selfDmg}`, true, false, 2, true, selectedEnemyIdx, 'psychic', '🧠 AUTOLESIÓN', '#f43f5e');
      setTurnSkippedBanner(`🧠 ¡${actingEnemy.name} sufre COLAPSO MENTAL y se ataca a sí mismo (-${selfDmg} PV)!`);
      setTimeout(() => setTurnSkippedBanner(null), 2200);
      setTimeout(finalizeEnemyPhase, 650);
      return;
    }

    // Check Blind
    const isBlind = actingEnemy.conditions.some((c) => c.type === 'blind' || c.type === 'blinded');
    if (isBlind && Math.random() < 0.45) {
      queueStatusNotification({
        icon: '🌑',
        title: 'Ataque Fallido',
        detail: `¡${actingEnemy.name} falló su golpe!`,
        target: 'enemy',
        isBuff: false,
      });
      setTimeout(finalizeEnemyPhase, 500);
      return;
    }

    // Enemy Attack or Ultimate
    const enemyCfg = DUNGEON_ENEMIES[actingEnemy.configId] || DUNGEON_ENEMIES['araknoide_rojo'];
    const isUlt = actingEnemy.ultimateOrbs >= 5;

    // Strike animation for this active enemy
    setActiveEnemies((prev) =>
      prev.map((e) => (e.uid === actingEnemy.uid ? { ...e, animation: 'strike' } : e))
    );

    const skill = isUlt
      ? enemyCfg.ultimateSkill
      : turnCounter % 2 === 0
      ? enemyCfg.specialSkill
      : enemyCfg.normalSkill;

    // Distinct visual effects and sounds for each enemy
    let vfxType: 'crimson_claw' | 'frost_blizzard' | 'shadow_needle' | 'earth_titan' | 'void_miasma' | 'gorgon_lightning' = 'crimson_claw';
    let themeColor = '#ef4444';
    let attackSfx = 'attack';

    switch (actingEnemy.configId) {
      case 'araknoide_voraz':
        vfxType = 'crimson_claw';
        themeColor = '#dc2626';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'araknoide_espinoso':
        vfxType = 'shadow_needle';
        themeColor = '#ea580c';
        attackSfx = isUlt ? 'critical' : 'laser';
        break;
      case 'araknoide_oviparo':
        vfxType = 'void_miasma';
        themeColor = '#65a30d';
        attackSfx = isUlt ? 'dark_god' : 'attack';
        break;
      case 'araknoide_rojo':
        vfxType = 'crimson_claw';
        themeColor = '#ef4444';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'araknoide_azul':
        vfxType = 'frost_blizzard';
        themeColor = '#38bdf8';
        attackSfx = isUlt ? 'laser' : 'laser2';
        break;
      case 'semiboss_zancudo':
        vfxType = 'shadow_needle';
        themeColor = '#a855f7';
        attackSfx = isUlt ? 'dark_god' : 'necrotic';
        break;
      case 'semiboss_melenudo':
        vfxType = 'earth_titan';
        themeColor = '#f59e0b';
        attackSfx = isUlt ? 'critical' : 'hurt1';
        break;
      case 'araknoide':
        vfxType = 'void_miasma';
        themeColor = '#c084fc';
        attackSfx = isUlt ? 'dark_god' : 'necrotic';
        break;
      case 'medusa':
        vfxType = 'gorgon_lightning';
        themeColor = '#22d3ee';
        attackSfx = isUlt ? 'powerup' : 'laser1';
        break;
      case 'guardia_lanza':
        vfxType = 'crimson_claw';
        themeColor = '#3b82f6';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'guardia_espada':
        vfxType = 'crimson_claw';
        themeColor = '#60a5fa';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'guardia_ballesta':
        vfxType = 'shadow_needle';
        themeColor = '#f59e0b';
        attackSfx = isUlt ? 'laser' : 'laser2';
        break;
      case 'guardia_pesado':
        vfxType = 'earth_titan';
        themeColor = '#ef4444';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'devorador_quitinoso':
        vfxType = 'earth_titan';
        themeColor = '#f97316';
        attackSfx = isUlt ? 'dark_god' : 'critical';
        break;
      case 'devorador_quitinoso_p2':
        vfxType = 'crimson_claw';
        themeColor = '#dc2626';
        attackSfx = isUlt ? 'dark_god' : 'critical';
        break;
      case 'orco_lanza':
        vfxType = 'shadow_needle';
        themeColor = '#84cc16';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'orco_hacha':
        vfxType = 'crimson_claw';
        themeColor = '#ea580c';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      case 'orco_caudillo':
        vfxType = 'earth_titan';
        themeColor = '#dc2626';
        attackSfx = isUlt ? 'critical' : 'attack';
        break;
      default:
        vfxType = 'crimson_claw';
        themeColor = '#ef4444';
        attackSfx = 'attack';
    }

    setActiveEnemyAttackVisual({
      enemyName: actingEnemy.name,
      skillName: skill.name,
      skillDesc: skill.desc,
      vfxType,
      themeColor,
    });

    sound.playSFX(attackSfx);

    setTimeout(() => {
      // Return animation to idle
      setActiveEnemies((prev) =>
        prev.map((e) => (e.uid === actingEnemy.uid ? { ...e, animation: 'idle' } : e))
      );

      // Guaranteed Evasion from Edacorn Stealth (Sigilo Esmeralda)
      if (isEdacornCombat && isEdacornStealthed) {
        queueStatusNotification({
          icon: '👻',
          title: '¡Esquivado en Sigilo!',
          detail: `Edacorn es intangible y semitransparente. ¡El ataque de ${actingEnemy.name} pasa de largo!`,
          target: 'hero',
          isBuff: true,
        });
        spawnFloating('¡EVADIDO EN SIGILO!', false, false, 2, false, undefined, 'force', '👻 INTANGIBLE', '#10b981');
        setIsEdacornStealthed(false);
        setActiveEnemyAttackVisual(null);
        setTimeout(finalizeEnemyPhase, 450);
        return;
      }

      // Guaranteed Evasion from Tortilla
      if (activeFoodBuff?.evadeNextHit) {
        queueStatusNotification({
          icon: '🍳',
          title: '¡Evasión Absoluta!',
          detail: 'Tortilla de Patatas: Ataque rival esquivado con éxito',
          target: 'hero',
          isBuff: true,
        });
        spawnFloating('¡ESQUIVADO! (Tortilla)', false, false);
        setActiveFoodBuff((prev) => (prev ? { ...prev, evadeNextHit: false } : null));
        setActiveEnemyAttackVisual(null);
        setTimeout(finalizeEnemyPhase, 450);
        return;
      }

      // Check hero dodge
      const hasteHero = heroConditions.find((c) => c.type === 'haste');
      if (hasteHero && Math.random() < 0.25) {
        queueStatusNotification({
          icon: '💨',
          title: 'Evasión Táctica',
          detail: 'Magordito esquivó el ataque',
          target: 'hero',
          isBuff: true,
        });
        setActiveEnemyAttackVisual(null);
        setTimeout(finalizeEnemyPhase, 450);
        return;
      }

      // Damage calculation
      const dmgMult = currentFloor <= 10 ? 1 : 1 + (currentFloor - 10) * 0.06;
      let dmg = 0;
      if ('damage' in skill && Array.isArray(skill.damage)) {
        const [minD, maxD] = skill.damage;
        dmg = Math.round((minD + Math.floor(Math.random() * (maxD - minD + 1))) * dmgMult);
      } else if ('damage' in skill && typeof skill.damage === 'number') {
        dmg = Math.round(skill.damage * dmgMult);
      }

      const heroDefBuff = heroConditions.find((c) => c.type === 'def_buff');
      if (heroDefBuff) dmg = Math.max(1, Math.round(dmg * 0.7));

      const heroDefBreak = heroConditions.find((c) => c.type === 'def_break');
      if (heroDefBreak) dmg = Math.round(dmg * 1.4);

      // Food DEF Multiplier (Pizza: -30% daño)
      if (activeFoodBuff?.defMultiplier) {
        dmg = Math.max(1, Math.round(dmg * activeFoodBuff.defMultiplier));
      }

      // Food Protective Barrier / Shield
      if (foodShieldHp > 0) {
        if (foodShieldHp >= dmg) {
          setFoodShieldHp((prev) => prev - dmg);
          spawnFloating(`🛡️ Absorbe ${dmg}`, false, true);
          dmg = 0;
        } else {
          dmg -= foodShieldHp;
          spawnFloating(`🛡️ Escudo roto (-${foodShieldHp})`, false, true);
          setFoodShieldHp(0);
        }
      }

      heroHpRef.current = Math.max(0, heroHpRef.current - dmg);
      const nextHp = heroHpRef.current;
      setHeroHp(nextHp);

      const skillObj = skill as Record<string, unknown>;
      let enemyDndType: DndDamageType =
        skillObj && typeof skillObj.dndDamageType === 'string'
          ? (skillObj.dndDamageType as DndDamageType)
          : 'slashing';
      if (!skillObj.dndDamageType) {
        const skillName = typeof skillObj.name === 'string' ? skillObj.name.toLowerCase() : '';
        const vfx = (vfxType || '').toLowerCase();
        if (skillName.includes('veneno') || skillName.includes('tóxico') || vfx.includes('silk')) {
          enemyDndType = 'poison';
        } else if (skillName.includes('empal') || skillName.includes('colmillo') || skillName.includes('aguijón') || skillName.includes('flecha')) {
          enemyDndType = 'piercing';
        } else if (skillName.includes('titán') || skillName.includes('roca') || skillName.includes('aplastamiento') || skillName.includes('golpe')) {
          enemyDndType = 'bludgeoning';
        } else if (skillName.includes('fuego') || skillName.includes('ígneo') || skillName.includes('calor')) {
          enemyDndType = 'fire';
        } else if (skillName.includes('hielo') || skillName.includes('glacial') || skillName.includes('escarcha')) {
          enemyDndType = 'cold';
        } else if (skillName.includes('rayo') || skillName.includes('eléctrico') || skillName.includes('chispa')) {
          enemyDndType = 'lightning';
        } else if (skillName.includes('sónico') || skillName.includes('rugido') || skillName.includes('trueno')) {
          enemyDndType = 'thunder';
        } else if (skillName.includes('ácido') || skillName.includes('corrosión')) {
          enemyDndType = 'acid';
        } else if (skillName.includes('necro') || skillName.includes('abismo') || skillName.includes('sombr') || skillName.includes('maldición')) {
          enemyDndType = 'necrotic';
        } else if (skillName.includes('mente') || skillName.includes('psí') || skillName.includes('mirada') || skillName.includes('ojo')) {
          enemyDndType = 'psychic';
        } else if (skillName.includes('luz') || skillName.includes('solar') || skillName.includes('divino')) {
          enemyDndType = 'radiant';
        } else if (skillName.includes('arcano') || skillName.includes('fuerza') || skillName.includes('astral')) {
          enemyDndType = 'force';
        } else {
          enemyDndType = 'slashing';
        }
      }

      triggerHeroHitReaction(enemyDndType);
      sound.playSFX('hurt');
      setScreenShake(vfxType === 'earth_titan' || isUlt ? 'heavy' : 'medium');
      setTimeout(() => setScreenShake('none'), 200);
      spawnFloating(`-${dmg}`, false, false);

      // Edacorn Counterattack (Contraataque): Immediate Riposte
      if (isEdacornCombat && edacornCounter && edacornCounter.active) {
        const counterDmg = edacornCounter.damage;
        setEdacornCounter(null);
        setTimeout(() => {
          sound.playSFX('critical');
          setHeroAnimation('lunge');
          setHeroCastSkill('contraataque');
          triggerEnemyHitReaction('piercing');
          const nextEnemyHp = Math.max(0, actingEnemy.hp - counterDmg);
          setActiveEnemies((prev) =>
            prev.map((e) =>
              e.uid === actingEnemy.uid
                ? { ...e, hp: nextEnemyHp, isAshDissolving: nextEnemyHp <= 0 }
                : e
            )
          );
          activeEnemiesRef.current = activeEnemiesRef.current.map((e) =>
            e.uid === actingEnemy.uid
              ? { ...e, hp: nextEnemyHp, isAshDissolving: nextEnemyHp <= 0 }
              : e
          );
          spawnFloating(
            `-${counterDmg}`,
            true,
            false,
            2,
            true,
            selectedEnemyIdx,
            'piercing',
            '⚔️ CONTRAATAQUE',
            '#10b981'
          );
          queueStatusNotification({
            icon: '⚔️',
            title: '¡Contraataque!',
            detail: `Edacorn responde asestando ${counterDmg} de daño de réplica a ${actingEnemy.name}`,
            target: 'hero',
            isBuff: true,
          });
          setTimeout(() => {
            setHeroAnimation('idle');
            setHeroCastSkill(null);
          }, 350);
        }, 180);
      }

      // Devorador Quitinoso (Fase 2): Robo de vida por cada ataque que haga
      if (actingEnemy.configId === 'devorador_quitinoso_p2' && dmg > 0) {
        const lifestealHeal = Math.max(6, Math.round(dmg * 0.50));
        setActiveEnemies((prev) =>
          prev.map((e) =>
            e.uid === actingEnemy.uid
              ? { ...e, hp: Math.min(e.maxHp, e.hp + lifestealHeal) }
              : e
          )
        );
        activeEnemiesRef.current = activeEnemiesRef.current.map((e) =>
          e.uid === actingEnemy.uid
            ? { ...e, hp: Math.min(e.maxHp, e.hp + lifestealHeal) }
            : e
        );

        const slotIdx = activeEnemiesRef.current.findIndex((e) => e.uid === actingEnemy.uid);
        setTimeout(() => {
          spawnFloating(
            `+${lifestealHeal}`,
            true,
            true,
            2,
            false,
            slotIdx >= 0 ? slotIdx : undefined,
            'necrotic',
            '💀 ROBO DE VIDA',
            '#ef4444'
          );
        }, 180);

        queueStatusNotification({
          icon: '🩸',
          title: 'Robo de Vida',
          detail: `¡El Devorador drena +${lifestealHeal} PV en su ataque!`,
          target: 'enemy',
          isBuff: true,
        });
      }

      // Bandido Líder y Caudillo Gorrak: Robo de orbes de definitiva del jugador
      if (actingEnemy.configId === 'bandido_lider' || actingEnemy.configId === 'orco_caudillo') {
        const stealCount = isUlt ? 2 : 1;
        setUltimateOrbs((prevOrbs) => {
          const actualStolen = Math.min(prevOrbs, stealCount);
          if (actualStolen > 0) {
            // Transfer stolen orbs to boss
            setActiveEnemies((prev) =>
              prev.map((e) =>
                e.uid === actingEnemy.uid
                  ? { ...e, ultimateOrbs: Math.min(5, e.ultimateOrbs + actualStolen) }
                  : e
              )
            );
            activeEnemiesRef.current = activeEnemiesRef.current.map((e) =>
              e.uid === actingEnemy.uid
                ? { ...e, ultimateOrbs: Math.min(5, e.ultimateOrbs + actualStolen) }
                : e
            );

            // Floating text on hero losing orbs
            setTimeout(() => {
              spawnFloating(
                `-${actualStolen} Orbe${actualStolen > 1 ? 's' : ''} Definitiva`,
                false,
                false,
                2,
                false,
                undefined,
                'force',
                '⚡ ROBO DE ENERGÍA',
                '#f59e0b'
              );
            }, 120);

            // Floating text on boss gaining orbs
            const bossSlot = activeEnemiesRef.current.findIndex((e) => e.uid === actingEnemy.uid);
            setTimeout(() => {
              spawnFloating(
                `+${actualStolen} Orbe Ulti`,
                true,
                true,
                2,
                false,
                bossSlot >= 0 ? bossSlot : undefined,
                'radiant',
                '⚡ ORBE ROBADO',
                '#fbbf24'
              );
            }, 240);

            // Si el jugador tenía la definitiva cargada y le roban orbes, la carta de definitivo debe desaparecer de inmediato
            if (prevOrbs >= MAX_ULTIMATE_ORBS) {
              setHand((prevHand) => prevHand.filter((c) => c.skillId !== 'cataclismo_astral'));
              sound.playSFX('drain');
              setTimeout(() => {
                spawnFloating(
                  '⚡ ¡Definitivo Descargado!',
                  false,
                  false,
                  2,
                  false,
                  undefined,
                  'force',
                  '❌ CARTA DISIPADA',
                  '#ef4444'
                );
              }, 320);
            }

            queueStatusNotification({
              icon: '⚡',
              title: '¡Saqueo de Definitiva!',
              detail: `¡${actingEnemy.name} te roba ${actualStolen} orbe${actualStolen > 1 ? 's' : ''} de definitiva!`,
              target: 'enemy',
              isBuff: true,
            });
          }
          return Math.max(0, prevOrbs - actualStolen);
        });
      }

      // Apply skill condition
      if (skill.condition) {
        const cond = skill.condition;
        setHeroConditions((prev) => {
          const res = stackGachaEffect(prev, cond.type, cond.duration, cond.stacks, 1, cond.title);
          return res.updatedEffects;
        });
        setHeroStatusTrigger((prev) => prev + 1);
      }

      // Update acting enemy orbs
      setActiveEnemies((prev) =>
        prev.map((e) =>
          e.uid === actingEnemy.uid
            ? {
                ...e,
                ultimateOrbs: isUlt ? 0 : Math.min(5, e.ultimateOrbs + 1),
              }
            : e
        )
      );

      setTimeout(() => {
        setActiveEnemyAttackVisual(null);
      }, 350);

      if (nextHp <= 0) {
        setIsHeroAshDissolving(true);
        setHeroAnimation('dead');
        sound.playSFX('necrotic');
        setTimeout(() => {
          setIsHeroAshDissolving(false);
          setHeroAnimation('idle');
          setBattleState('defeat');
          sound.playSFX('defeat');
        }, 2200);
        return;
      }

      setTimeout(finalizeEnemyPhase, 400);
    }, 700);
  };

  // Fate/Grand Order (FGO): Execute Player Noble Phantasm (Cataclismo Astral / Stella Judicium)
  const executeUltimateMove = () => {
    if (battleState !== 'idle' || enemyHp <= 0) return;

    sound.playBGM();
    sound.playSFX('powerup');
    setBattleState('player_acting');
    setUltimateOrbs(0);

    // Eliminar carta de definitivo de la mano
    setHand((prev) => prev.filter((c) => c.skillId !== 'cataclismo_astral'));

    // 1. INICIAR FGO NOBLE PHANTASM - PHASE 1: CHANT (0ms)
    setIsUltimateCinematicActive(true);
    setIsFgoEnemy(false);
    setFgoPhase('chant');
    setFgoHitCount(0);
    setFgoDamageTally(0);
    setHeroCastSkill('cataclismo_astral');
    setHeroAnimation('lunge');

    // 2. PHASE 2: CHARGE DE MANÁ & ENERGÍA CELESTIAL (1300ms)
    setTimeout(() => {
      setFgoPhase('charge');
      sound.playSFX('dark_god');
      setScreenShake('light');
    }, 1300);

    // 3. PHASE 3: MULTI-HIT BARRAGE (2000ms)
    setTimeout(() => {
      setFgoPhase('barrage');

      // HIT 1
      setTimeout(() => {
        setFgoHitCount(1);
        setFgoDamageTally(18500);
        sound.playSFX('attack');
        triggerEnemyHitReaction('radiant');
        spawnFloating('18,500', true, false, 2);
      }, 60);

      // HIT 2
      setTimeout(() => {
        setFgoHitCount(2);
        setFgoDamageTally(42300);
        sound.playSFX('attack');
        triggerEnemyHitReaction('radiant');
        spawnFloating('23,800', true, false, 2);
      }, 360);

      // HIT 3
      setTimeout(() => {
        setFgoHitCount(3);
        setFgoDamageTally(71600);
        sound.playSFX('critical');
        setScreenShake('light');
        triggerEnemyHitReaction('radiant');
        spawnFloating('29,300', true, false, 3, true);
      }, 660);

      // HIT 4
      setTimeout(() => {
        setFgoHitCount(4);
        setFgoDamageTally(96800);
        sound.playSFX('critical');
        setScreenShake('heavy');
        triggerEnemyHitReaction('radiant');
        spawnFloating('★ 35,200 CRIT! ★', true, false, 3, true);
      }, 960);

      // FINAL BURST & APOCALYPTIC IMPACT (Phase 4)
      setTimeout(() => {
        setFgoPhase('impact');
        setFgoHitCount(5);
        setFgoDamageTally(135400);
        sound.playSFX('critical');
        sound.playSFX('powerup');
        setScreenShake('heavy');
        setScreenFlash('gold');
        triggerEnemyHitReaction('force');
        spawnFloating('★ 135,400 OVERKILL! ★', true, false, 3, true);

        // FGO PHASE 5: TOTAL DAMAGE & OVERKILL DISPLAY
        setTimeout(() => {
          setFgoPhase('total');
          sound.playSFX('victory');

          const target = targetEnemy || activeEnemiesRef.current.find((e) => e.hp > 0);
          
          let anyAliveAfterUlt = false;
          const updatedEnemies = activeEnemiesRef.current.map((e) => {
            const isTarget = e.uid === target?.uid;
            let dmg = isTarget ? 95 : 45;

            // Jefe de las puertas selladas: Las ultis le hacen un 50% de daño
            const isPuertasBoss =
              e.configId === 'devorador_quitinoso' ||
              e.configId === 'devorador_quitinoso_p2' ||
              (selectedCombatMissionId === 'm4_puertas_selladas' && e.isBoss);
            if (isPuertasBoss) {
              dmg = Math.round(dmg * 0.50);
            }

            const nextHp = Math.max(0, e.hp - dmg);
            if (nextHp > 0) anyAliveAfterUlt = true;
            return {
              ...e,
              hp: nextHp,
              isAshDissolving: nextHp <= 0,
            };
          });

          // Sync ref and state immediately
          activeEnemiesRef.current = updatedEnemies;
          setActiveEnemies(updatedEnemies);

          setTimeout(() => {
            setIsUltimateCinematicActive(false);
            setFgoPhase('none');
            setHeroCastSkill(null);
            setHeroAnimation('idle');

            if (!anyAliveAfterUlt) {
              handleAllEnemiesDefeated();
            } else {
              const stillAlive = activeEnemiesRef.current.filter((e) => e.hp > 0 && !e.isAshDissolving);
              if (stillAlive.length > 0 && target && !stillAlive.some((e) => e.uid === target.uid)) {
                const nextIdx = activeEnemiesRef.current.findIndex((e) => e.uid === stillAlive[0].uid);
                if (nextIdx >= 0) setSelectedEnemyIdx(nextIdx);
              }
              setTimeout(() => {
                executeEnemyTurn();
              }, 450);
            }
          }, 1200);
        }, 700);
      }, 1280);
    }, 2000);
  };

  const triggerCastUltimate = () => {
    if (battleState !== 'idle' || aliveEnemies.length === 0 || ultimateOrbs < MAX_ULTIMATE_ORBS) return;
    executeUltimateMove();
  };

  // Execute playing a card: Card disappears immediately, hero attacks, enemy takes damage, enemy counter-attacks, then hand refills!
  const playCard = (card: ActiveCombatCard, cardIndex: number) => {
    if (battleState !== 'idle' || aliveEnemies.length === 0) return;

    // Si es carta de Definitivo, desatar secuencia cinematográfica suprema
    if (card.skillId === 'cataclismo_astral') {
      if (ultimateOrbs < MAX_ULTIMATE_ORBS) {
        setHand((prev) => prev.filter((c) => c.skillId !== 'cataclismo_astral'));
        sound.playSFX('drain');
        return;
      }
      executeUltimateMove();
      return;
    }

    const skillDef = SKILL_DEFINITIONS[card.skillId];
    if (!skillDef) return;

    const tierInfo = skillDef.tiers[card.tier];

    // Check Gacha Hard CC on Magordito (Paralyze / Stun)
    const heroParalyzed = heroConditions.find((c) => c.type === 'paralyze' || c.type === 'paralyzed');
    if (heroParalyzed) {
      sound.playSFX('necrotic');
      setScreenShake('light');
      setScreenFlash('cyan');
      setTimeout(() => setScreenFlash(null), 180);
      queueStatusNotification({
        icon: '⚡',
        title: 'Magordito Paralizado',
        detail: 'Acción bloqueada este turno',
        target: 'hero',
        isBuff: false,
      });
      setBattleState('enemy_acting');
      setTimeout(() => {
        executeEnemyTurn();
      }, 700);
      return;
    }

    const heroStunned = heroConditions.find((c) => c.type === 'stun' || c.type === 'stunned');
    if (heroStunned) {
      sound.playSFX('skill');
      queueStatusNotification({
        icon: '💫',
        title: 'Magordito Aturdido',
        detail: 'Acción cancelada este turno',
        target: 'hero',
        isBuff: false,
      });
      setBattleState('enemy_acting');
      setTimeout(() => {
        executeEnemyTurn();
      }, 700);
      return;
    }

    // Ensure combat instrumental track is playing upon user interaction
    sound.playBGM();
    sound.playSFX(skillDef.sfx || 'attack');
    setBattleState('player_acting');

    // Edacorn story cards mechanics
    if (card.skillId === 'sigilo') {
      setIsEdacornStealthed(true);
      spawnFloating('👻 ¡SIGILO ESMERALDA!', false, true, card.tier, false, undefined, 'force', 'INVISIBILIDAD', '#10b981');
      queueStatusNotification({
        icon: '👻',
        title: 'Sigilo Esmeralda Activado',
        detail: 'Edacorn es semitransparente. ¡Esquivará todos los ataques el próximo turno!',
        target: 'hero',
        isBuff: true,
      });
    } else if (card.skillId === 'contraataque') {
      const counterDmg = card.tier === 3 ? 55 : card.tier === 2 ? 36 : 22;
      setEdacornCounter({ active: true, damage: counterDmg });
      spawnFloating('🛡️ ¡CONTRAATAQUE PREPARADO!', false, true, card.tier, false, undefined, 'piercing', 'PARADA', '#38bdf8');
      queueStatusNotification({
        icon: '🛡️',
        title: 'Postura de Contraataque',
        detail: `Edacorn responderá con ${counterDmg} de daño al ser atacado`,
        target: 'hero',
        isBuff: true,
      });
    }

    // 1. CARD DISAPPEARS IMMEDIATELY FROM HAND!
    setHand((prev) => prev.filter((_, idx) => idx !== cardIndex));

    // Ultimate Move Gauge: Consume on ultimate, charge on standard skill
    addUltimateOrb(1);

    // OPTIMIZACIÓN INSTANTÁNEA: Los efectos de partículas cargan en cuanto se castee (0ms)
    setActiveVfx({
      type: card.skillId as CombatVfxType,
      tier: card.tier,
    });

    // 2. Hero cleanly dashes toward Enemy with spell-specific casting pose
    setHeroCastSkill(card.skillId);
    setHeroAnimation('lunge');

    // Check Gacha Blind Miss Chance (45% miss rate)
    const heroBlinded = heroConditions.find((c) => c.type === 'blind' || c.type === 'blinded');
    const attackMissed = heroBlinded && Math.random() < 0.45;

    // 3. Impact on Enemy at 220ms (Exact moment hit lands: Screen shake, Whiteout, Damage & Reactions)
    setTimeout(() => {
      if (attackMissed) {
        setActiveVfx({ type: 'none', tier: 1 });
        sound.playSFX('attack');
        queueStatusNotification({
          icon: '🌑',
          title: 'Ataque Fallido',
          detail: 'Magordito cegado por seda',
          target: 'hero',
          isBuff: false,
        });
        setHeroCastSkill(null);
        setHeroAnimation('idle');
        setTimeout(() => {
          executeEnemyTurn();
        }, 550);
        return;
      }

      // Camera Shake & Impact Flash scaled by tier with authentic Gacha Critical audio
      const isUltimate = card.skillId === 'cataclismo_astral';
      if (isUltimate) {
        sound.playSFX('powerup');
        sound.playSFX('critical');
        setScreenShake('heavy');
        setTier3Cinematic(true);
        setTimeout(() => setTier3Cinematic(false), 750);
        setTimeout(() => setScreenShake('none'), 500);
      } else if (card.tier === 3) {
        sound.playSFX('critical');
        setScreenShake('heavy');
        setTier3Cinematic(true);
        setTimeout(() => setTier3Cinematic(false), 450);
        setTimeout(() => setScreenShake('none'), 380);
      } else if (card.tier === 2) {
        sound.playSFX('attack');
        setScreenShake('medium');
        setTimeout(() => setScreenShake('none'), 250);
      } else {
        sound.playSFX('attack');
        setScreenShake('light');
        setTimeout(() => setScreenShake('none'), 180);
      }

      const flashColor = isUltimate
        ? 'gold'
        : card.skillId === 'dios_oscuro'
        ? 'purple'
        : card.skillId === 'fortalecer_marioneta'
        ? 'gold'
        : 'cyan';
      setScreenFlash(flashColor);
      setTimeout(() => setScreenFlash(null), isUltimate ? 350 : card.tier === 3 ? 240 : 180);

      // --- GACHA DAMAGE FORMULA ---
      let baseDmg = tierInfo.damage;
      let isCrit = card.tier === 3;

      // Active Food Buff: ATK Multiplier (Hamburguesa / Furia / McBites)
      if (activeFoodBuff?.atkMultiplier) {
        baseDmg = Math.round(baseDmg * activeFoodBuff.atkMultiplier);
      }

      // Active Food Buff: Critical Strike Rate (Quesarito / Doritos)
      if (activeFoodBuff?.critRateBonus && Math.random() < activeFoodBuff.critRateBonus) {
        isCrit = true;
      }

      // Hero ATK Buff: +25% / +45% / +65%
      const heroAtkBuff = heroConditions.find((c) => c.type === 'atk_buff');
      if (heroAtkBuff) {
        const bonusRate = 0.25 + (heroAtkBuff.stacks - 1) * 0.20;
        const atkBonus = Math.round(baseDmg * bonusRate);
        baseDmg += atkBonus;
        queueStatusNotification({
          icon: '⚔️',
          title: 'Ataque Potenciado',
          detail: `+${atkBonus} daño infligido`,
          target: 'hero',
          isBuff: true,
        });
      }

      // Hero Tactical Speed (Haste): +25% damage
      const heroHaste = heroConditions.find((c) => c.type === 'haste');
      if (heroHaste) {
        baseDmg = Math.round(baseDmg * 1.25);
      }

      // Hero ATK Down: -25% to -45% damage
      const heroAtkDown = heroConditions.find((c) => c.type === 'atk_down' || c.type === 'frightened');
      if (heroAtkDown) {
        const penaltyRate = 0.25 + (heroAtkDown.stacks - 1) * 0.10;
        baseDmg = Math.max(1, Math.round(baseDmg * (1 - penaltyRate)));
      }

      const aliveList = activeEnemiesRef.current.filter((e) => e.hp > 0 && !e.isAshDissolving);
      if (aliveList.length === 0) {
        handleAllEnemiesDefeated();
        return;
      }
      let target = activeEnemiesRef.current[selectedEnemyIdx];
      if (!target || target.hp <= 0 || target.isAshDissolving) {
        target = aliveList[0];
        const nextIdx = activeEnemiesRef.current.findIndex((e) => e.uid === target.uid);
        if (nextIdx >= 0) setSelectedEnemyIdx(nextIdx);
      }
      if (!target) {
        setBattleState('idle');
        return;
      }
      const targetSlot = activeEnemies.findIndex((e) => e.uid === target.uid);

      // Enemy DEF Break: +35% / +50% / +65% damage taken
      const enemyDefBreak = target.conditions.find((c) => c.type === 'def_break' || c.type === 'prone' || c.type === 'restrained');
      if (enemyDefBreak) {
        const vulnRate = 0.35 + (enemyDefBreak.stacks - 1) * 0.15;
        const defBreakBonus = Math.round(baseDmg * vulnRate);
        baseDmg += defBreakBonus;
      }

      // Enemy Paralyze: Guaranteed Critical Hit (+75% damage)
      const enemyParalyzed = target.conditions.find((c) => c.type === 'paralyze' || c.type === 'paralyzed');
      if (enemyParalyzed) {
        baseDmg = Math.round(baseDmg * 1.75);
        isCrit = true;
      }

      // Pierce Food (Kebab) ignores 50% defense and applies def_break
      if (activeFoodBuff?.pierceDefense) {
        baseDmg = Math.round(baseDmg * 1.30);
        setEnemyConditions((prev) =>
          stackGachaEffect(prev, 'def_break', 2, 1, 1, 'Kebab Táctico').updatedEffects
        );
      }

      // --- D&D 5E GACHA DAMAGE & MECHANIC EXECUTION ---
      const dndEval = evaluateDndDamageMechanic(
        skillDef.dndDamageType,
        baseDmg,
        card.tier,
        target.conditions.map((c) => ({ type: c.type, stacks: c.stacks })),
        true // Cave spiders and aberrations are dark creatures (triggers Radiant bonus)
      );

      let finalCalculatedDamage = dndEval.finalDamage;
      const isCriticalHit = isCrit || dndEval.isCrit;

      // Crit Damage Boost (Quesarito / Doritos)
      if (isCriticalHit && activeFoodBuff?.critDamageBonus) {
        finalCalculatedDamage = Math.round(finalCalculatedDamage * (1 + activeFoodBuff.critDamageBonus));
      }

      // Jefe de las puertas selladas: Las ultis le hacen un 50% de daño
      const isPuertasBoss =
        target.configId === 'devorador_quitinoso' ||
        target.configId === 'devorador_quitinoso_p2' ||
        (selectedCombatMissionId === 'm4_puertas_selladas' && target.isBoss);

      if (isUltimate && isPuertasBoss) {
        finalCalculatedDamage = Math.max(1, Math.round(finalCalculatedDamage * 0.50));
        setDndProcBanner({
          text: '🛡️ ESCUDO QUITINOSO: 50% RESISTENCIA A DEFINITIVOS',
          color: '#fb7185',
          icon: '🛡️',
        });
        setTimeout(() => setDndProcBanner(null), 2400);
      }

      triggerEnemyHitReaction(skillDef.dndDamageType);
      spawnFloating(
        finalCalculatedDamage.toString(),
        true,
        false,
        card.tier,
        isCriticalHit,
        targetSlot >= 0 ? targetSlot : undefined,
        skillDef.dndDamageType,
        `${dndEval.meta.icon} ${dndEval.meta.nameEs.toUpperCase()}`,
        dndEval.meta.colorHex
      );

      // Trigger D&D mechanic proc banner notice
      if (dndEval.bannerNotice && (!isUltimate || !isPuertasBoss)) {
        setDndProcBanner({
          text: dndEval.bannerNotice,
          color: dndEval.meta.colorHex,
          icon: dndEval.meta.icon,
        });
        setTimeout(() => setDndProcBanner(null), 2400);
      }

      // Handle Lifesteal / Healing (Necrotic Vampiric Leech, Arepas, or skill base heal)
      let foodLifesteal = 0;
      if (activeFoodBuff?.lifestealRate && finalCalculatedDamage > 0) {
        foodLifesteal = Math.max(3, Math.round(finalCalculatedDamage * activeFoodBuff.lifestealRate));
      }
      const totalHeal = (tierInfo.heal || 0) + (dndEval.lifestealHealed || 0) + foodLifesteal;
      if (totalHeal > 0) {
        setTimeout(() => {
          heroHpRef.current = Math.min(heroMaxHp, heroHpRef.current + totalHeal);
          setHeroHp(heroHpRef.current);
          spawnFloating(
            `+${totalHeal}`,
            false,
            true,
            card.tier,
            false,
            undefined,
            dndEval.lifestealHealed ? 'necrotic' : undefined,
            dndEval.lifestealHealed ? '💀 ROBO DE VIDA' : '💚 CURACIÓN',
            dndEval.lifestealHealed ? '#a855f7' : '#10b981'
          );
        }, 350);
      }

      // Handle bonus orbs (Force Arcane Damage)
      if (dndEval.orbsGainedBonus) {
        addUltimateOrb(dndEval.orbsGainedBonus);
      }

      // Handle enemy orb drain (Thunder Sonic Disruption or Tier-3 Attack / CC)
      let enemyDrainAmount = dndEval.enemyOrbsDrained || 0;
      if (card.tier === 3 || card.skillId === 'cataclismo_astral') {
        enemyDrainAmount = Math.max(enemyDrainAmount, 1);
      }
      if (enemyDrainAmount > 0) {
        setActiveEnemies((prev) =>
          prev.map((e) =>
            e.uid === target.uid
              ? { ...e, ultimateOrbs: Math.max(0, e.ultimateOrbs - enemyDrainAmount) }
              : e
          )
        );
        spawnFloating(
          `-${enemyDrainAmount} Orbe Definitivo`,
          true,
          false,
          2,
          false,
          targetSlot >= 0 ? targetSlot : undefined,
          'thunder',
          '⚡ DRENAJE ASTRAL',
          '#f59e0b'
        );
      }

      // Handle hero cleanse (Radiant Divine Cleanse)
      if (dndEval.cleanseHero) {
        setHeroConditions((prev) => prev.filter((c) => c.isBuff));
      }

      // --- APPLY GACHA STATUS EFFECTS & ENEMY DAMAGE ---
      const baseEffects = tierInfo.gachaEffectsApplied || tierInfo.dndConditionsApplied || [];
      const extraEffects = dndEval.extraStatusEffects || [];
      const allEffectsToApply = [...baseEffects, ...extraEffects];

      const targetUid = target.uid;
      const targetNextHp = Math.max(0, target.hp - finalCalculatedDamage);
      const isTargetDying = targetNextHp <= 0;

      // Check if all enemies in the chamber will be defeated after this blow
      const otherAliveEnemies = activeEnemiesRef.current.filter(
        (e) => e.uid !== targetUid && e.hp > 0 && !e.isAshDissolving
      );
      const allDeadAfterThis = isTargetDying && otherAliveEnemies.length === 0;

      // Update activeEnemiesRef immediately to prevent race conditions
      activeEnemiesRef.current = activeEnemiesRef.current.map((e) =>
        e.uid === targetUid
          ? { ...e, hp: targetNextHp, isAshDissolving: isTargetDying }
          : e
      );

      setActiveEnemies((prev) => {
        return prev.map((e) => {
          if (e.uid === targetUid) {
            let updatedConds = e.conditions;
            allEffectsToApply.forEach((app) => {
              if (app.target === 'enemy') {
                const res = stackGachaEffect(
                  updatedConds,
                  app.type,
                  app.duration,
                  app.stacks,
                  card.tier,
                  tierInfo.title
                );
                updatedConds = res.updatedEffects;
              }
            });
            return {
              ...e,
              hp: targetNextHp,
              conditions: updatedConds,
              isAshDissolving: isTargetDying,
            };
          }
          return e;
        });
      });

      // Apply hero status effects if any
      allEffectsToApply.forEach((app) => {
        if (app.target === 'hero') {
          setHeroConditions((prev) => {
            const res = stackGachaEffect(
              prev,
              app.type,
              app.duration,
              app.stacks,
              card.tier,
              tierInfo.title
            );
            return res.updatedEffects;
          });
          setHeroStatusTrigger((prev) => prev + 1);
          if (app.type === 'paralyze') {
            setHeroTwitching(true);
            setTimeout(() => setHeroTwitching(false), 800);
          }
        }
      });

      // Check Victory or Phase Transition immediately if all dead
      if (allDeadAfterThis) {
        setHeroCastSkill(null);
        setHeroAnimation('idle');
        setTimeout(() => {
          handleAllEnemiesDefeated();
        }, 300);
        return;
      }

      // Boss Mechanic: Si El Zancudo Espectral recibe daño y sobrevive, invoca a un araknoide básico
      if (target.configId === 'semiboss_zancudo' && finalCalculatedDamage > 0 && !isTargetDying) {
        triggerZancudoSummon();
      }

      // Auto-retarget & smooth tag-in if current target died
      if (isTargetDying) {
        const nextTarget = activeEnemiesRef.current.find(
          (e) => e.uid !== targetUid && e.hp > 0 && !e.isAshDissolving
        );
        if (nextTarget) {
          const nextIdx = activeEnemiesRef.current.findIndex((e) => e.uid === nextTarget.uid);
          if (nextIdx >= 0) {
            switchActiveEnemy(nextIdx, true);
          }
        }
      }

      // Step back and execute enemy turn
      const impactDuration = card.skillId === 'rayo_necrotico' ? 850 : 550;
      setTimeout(() => {
        setActiveVfx({ type: 'none', tier: 1 });
        setHeroCastSkill(null);
        setHeroAnimation('idle');
        setEnemyAnimation('idle');
        executeEnemyTurn();
      }, impactDuration);
    }, 240);
  };

  // Merging two cards & Combination Animation (Bronce -> Plata -> Oro)
  // Mover una carta (combinar o reorganizar posición) carga +1 orbe definitivo y CONSUME 1 TURNO
  const executeCardMerge = (fromIdx: number, toIdx: number) => {
    const currentHand = handRef.current;
    if (
      battleState !== 'idle' ||
      aliveEnemies.length === 0 ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= currentHand.length ||
      toIdx >= currentHand.length ||
      fromIdx === toIdx
    ) {
      return;
    }

    const cardFrom = currentHand[fromIdx];
    const cardTo = currentHand[toIdx];
    if (!cardFrom || !cardTo) return;

    // Bloquear acciones del jugador inmediatamente ya que esta acción consume su turno
    setBattleState('player_acting');

    // Comprobar si las dos cartas son del mismo tipo y nivel (< 3) para fusión
    const isRankUpMerge =
      cardFrom.skillId === cardTo.skillId &&
      cardFrom.tier === cardTo.tier &&
      cardFrom.tier < 3;

    if (isRankUpMerge) {
      // 1. COMBINACIÓN DE RANGO (RANK UP MERGE)
      sound.playSFX('upgrade');
      addUltimateOrb(1);
      spawnFloating('★ FUSIÓN ★', false, false, 2);
      const newTier = (cardFrom.tier + 1) as 2 | 3;
      const targetSlotAfterSplice = toIdx > fromIdx ? toIdx - 1 : toIdx;

      // Iniciar animación de combinación en el slot objetivo
      setMergeAnim({
        targetSlot: targetSlotAfterSplice,
        newTier,
      });

      setHand((prev) => {
        if (!prev[fromIdx] || !prev[toIdx]) return prev;
        const cFrom = prev[fromIdx];
        const cTo = prev[toIdx];
        if (cFrom.skillId === cTo.skillId && cFrom.tier === cTo.tier && cFrom.tier < 3) {
          const next = [...prev];
          next[toIdx] = {
            ...cTo,
            tier: newTier,
            instanceId: cTo.instanceId,
          };
          next.splice(fromIdx, 1);
          return next;
        }
        return prev;
      });

      // CONSUMO DE TURNO: Tras finalizar la animación de combinación, el enemigo ejecuta su turno
      setTimeout(() => {
        setMergeAnim(null);
        setBattleState('enemy_acting');
        executeEnemyTurn();
      }, 750);
    } else {
      // 2. MOVIMIENTO DE POSICIÓN (SWAP CARDS)
      sound.playSFX('click');
      addUltimateOrb(1);

      setHand((prev) => {
        if (!prev[fromIdx] || !prev[toIdx]) return prev;
        const next = [...prev];
        const temp = next[fromIdx];
        next[fromIdx] = next[toIdx];
        next[toIdx] = temp;
        return next;
      });

      // CONSUMO DE TURNO: Tras el movimiento de posición, el enemigo ejecuta su turno
      setTimeout(() => {
        setBattleState('enemy_acting');
        executeEnemyTurn();
      }, 450);
    }
  };

  // POINTER & TOUCH DRAG HANDLERS (Locks card 1:1 directly to mouse / touch cursor)
  const handlePointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (battleState !== 'idle' || aliveEnemies.length === 0) return;

    // CC check: Stun and Paralyze immobilize the hero completely
    const isPlayerIncapacitated = heroConditions.some((c) =>
      ['stun', 'stunned', 'paralyze', 'paralyzed'].includes(c.id.toLowerCase())
    );
    if (isPlayerIncapacitated) {
      setHeroTwitching(true);
      setTimeout(() => setHeroTwitching(false), 600);
      return;
    }

    // Prevent default browser image dragging and gesture triggers
    e.preventDefault();
    e.stopPropagation();

    const targetEl = e.currentTarget;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDragCardSize({ width: rect.width, height: rect.height });
      }
    }

    const startX = e.clientX;
    const startY = e.clientY;
    dragStartPosRef.current = { x: startX, y: startY };
    hasMovedRef.current = false;
    dragIndexRef.current = index;
    hoverIndexRef.current = null;
    isOverArenaRef.current = false;

    // Activate drag state immediately with current position
    setDragIndex(index);
    setHoverIndex(null);
    setDragPos({ x: startX, y: startY });
    setDragTilt(0);

    let lastX = startX;

    const onMove = (clientX: number, clientY: number) => {
      const dx = clientX - dragStartPosRef.current.x;
      const dy = clientY - dragStartPosRef.current.y;
      if (Math.hypot(dx, dy) > 3) {
        hasMovedRef.current = true;
      }

      const velocityX = clientX - lastX;
      lastX = clientX;
      const tilt = Math.max(-14, Math.min(14, velocityX * 1.5));
      setDragTilt(tilt);

      // Directly update coordinates so the floating card stays exactly under the cursor
      setDragPos({ x: clientX, y: clientY });

      // 1. Detect if dragging over Arena (Combat field)
      if (arenaRef.current) {
        const rect = arenaRef.current.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom + 30
        ) {
          isOverArenaRef.current = true;
        } else {
          isOverArenaRef.current = false;
        }
      }

      // 2. Detect if hovering over another active card slot
      let detectedSlot: number | null = null;
      const activeSlotCount = handRef.current.length;
      for (let i = 0; i < activeSlotCount; i++) {
        const el = slotRefs.current[i];
        if (!el || i === dragIndexRef.current) continue;
        const rect = el.getBoundingClientRect();
        const padX = 14;
        const padY = 24;
        if (
          clientX >= rect.left - padX &&
          clientX <= rect.right + padX &&
          clientY >= rect.top - padY &&
          clientY <= rect.bottom + padY
        ) {
          detectedSlot = i;
          break; // Lock onto the first valid slot target
        }
      }

      hoverIndexRef.current = detectedSlot;
      setHoverIndex(detectedSlot);
    };

    const handlePointerMove = (ev: PointerEvent) => {
      onMove(ev.clientX, ev.clientY);
    };

    const handleMouseMove = (ev: MouseEvent) => {
      onMove(ev.clientX, ev.clientY);
    };

    const handleTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length > 0) {
        if (ev.cancelable) ev.preventDefault();
        onMove(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };

    const handleRelease = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('touchcancel', handleRelease);

      const fromIdx = dragIndexRef.current;
      const targetIdx = hoverIndexRef.current;
      const isArena = isOverArenaRef.current;
      const didMove = hasMovedRef.current;

      if (fromIdx !== null) {
        if (didMove) {
          // If dragged up into the arena -> execute attack!
          if (isArena) {
            playCard(handRef.current[fromIdx], fromIdx);
          }
          // If dropped onto another slot -> merge or swap!
          else if (targetIdx !== null && targetIdx !== fromIdx) {
            executeCardMerge(fromIdx, targetIdx);
          }
        } else {
          // Single tap/click -> play card immediately!
          playCard(handRef.current[fromIdx], fromIdx);
        }
      }

      // Reset drag references and state
      dragIndexRef.current = null;
      hoverIndexRef.current = null;
      isOverArenaRef.current = false;
      setDragIndex(null);
      setHoverIndex(null);
      setDragPos(null);
      setDragTilt(0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleRelease);
    window.addEventListener('touchcancel', handleRelease);
  };

  // Potion usage in battle
  const handleUsePotion = () => {
    sound.playSFX('coin');
    heroHpRef.current = Math.min(heroMaxHp, heroHpRef.current + 35);
    setHeroHp(heroHpRef.current);
    spawnFloating('+35', false, true);
    setShowInventoryModal(false);
  };

  // Helper to render authentic combat cards from the game assets (Solo el Sprite transparente)
  const renderCardContent = (card: ActiveCombatCard, _isDragging: boolean = false) => {
    const skillDef = SKILL_DEFINITIONS[card.skillId];
    if (!skillDef) return null;
    const tierInfo = skillDef.tiers[card.tier];
    if (!tierInfo) return null;

    const isUltimate = card.skillId === 'cataclismo_astral';
    const dndMeta = DND_DAMAGE_TYPES_REGISTRY[skillDef.dndDamageType];

    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-none rounded-lg overflow-visible ${
        isUltimate ? 'animate-[celestialCardPulse_2s_ease-in-out_infinite]' : ''
      }`}>
        {/* Ultimate Move Golden Aura Frame */}
        {isUltimate && (
          <>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 opacity-80 blur-xs animate-pulse pointer-events-none z-0" />
            {/* Holographic foil shimmer across card */}
            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-15 opacity-40">
              <div className="w-full h-full bg-gradient-to-tr from-transparent via-white/50 to-transparent anim-light-sweep" />
            </div>
          </>
        )}

        <img
          src={tierInfo.image}
          alt={tierInfo.title}
          draggable={false}
          loading="eager"
          decoding="sync"
          className={`w-full h-full object-contain pointer-events-none select-none transition-transform z-10 filter ${
            isUltimate
              ? 'drop-shadow-[0_0_20px_#f59e0b] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
              : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-[#290a03] select-none overflow-hidden font-sans">
      {/* KEYFRAME ANIMATIONS: IDLE SWAY, DRAGGED PENDULUM, READY-TO-COMBINE HOP, CARTOON COMBINATION BURST */}
      <style>{`
        /* CELESTIAL ULTIMATE KEYFRAMES */
        @keyframes celestialVoidEnter {
          0% { opacity: 0; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes celestialRuneSpin {
          0% { transform: rotate(0deg) scale(0.95); opacity: 0.6; }
          50% { transform: rotate(180deg) scale(1.05); opacity: 0.95; }
          100% { transform: rotate(360deg) scale(0.95); opacity: 0.6; }
        }
        @keyframes celestialRingPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes celestialCutInSlide {
          0% { transform: translateX(120%) skewX(-8deg); opacity: 0; }
          65% { transform: translateX(-4%) skewX(2deg); opacity: 1; }
          100% { transform: translateX(0%) skewX(0deg); opacity: 1; }
        }
        @keyframes celestialCardPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #f59e0b); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 18px #f59e0b) drop-shadow(0 0 28px #fbbf24); }
        }

        /* Circular Orb Charge Pop Animation (Animated on each newly gained orb) */
        @keyframes orbChargePop {
          0% {
            transform: scale(0.25);
            opacity: 0.3;
            filter: brightness(3) drop-shadow(0 0 20px #ffffff);
          }
          45% {
            transform: scale(1.65);
            opacity: 1;
            filter: brightness(2.2) drop-shadow(0 0 16px #f59e0b) drop-shadow(0 0 24px #fbbf24);
          }
          75% {
            transform: scale(0.9);
            filter: brightness(1.3) drop-shadow(0 0 10px #f59e0b);
          }
          100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 8px #f59e0b);
          }
        }
        @keyframes enemyOrbChargePop {
          0% {
            transform: scale(0.25);
            opacity: 0.3;
            filter: brightness(3) drop-shadow(0 0 20px #ffffff);
          }
          45% {
            transform: scale(1.65);
            opacity: 1;
            filter: brightness(2.2) drop-shadow(0 0 16px #ef4444) drop-shadow(0 0 24px #f43f5e);
          }
          75% {
            transform: scale(0.9);
            filter: brightness(1.3) drop-shadow(0 0 10px #ef4444);
          }
          100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 8px #ef4444);
          }
        }

        /* POKEMON STYLE ENEMY 1V1 SWITCH KEYFRAMES */
        @keyframes pokemonSlideIn {
          0% {
            transform: translateX(110px) scale(0.85);
            opacity: 0;
          }
          65% {
            transform: translateX(-12px) scale(1.04);
            opacity: 1;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes pokemonSwitchOut {
          0% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(120px) scale(0.75);
            opacity: 0;
          }
        }

        /* UNIQUE ENEMY ATTACK VFX KEYFRAMES */
        @keyframes enemySlashSlash {
          0% { transform: scale(0.35) rotate(-30deg); opacity: 0; filter: brightness(3); }
          40% { transform: scale(1.25) rotate(0deg); opacity: 1; filter: brightness(2) drop-shadow(0 0 16px #ef4444); }
          75% { transform: scale(1.05) rotate(15deg); opacity: 0.95; }
          100% { transform: scale(1.1) rotate(25deg); opacity: 0; }
        }
        @keyframes enemyIceShatter {
          0% { transform: scale(0.25) rotate(0deg); opacity: 0; filter: brightness(3); }
          35% { transform: scale(1.2) rotate(45deg); opacity: 1; filter: brightness(2.2) drop-shadow(0 0 20px #38bdf8); }
          100% { transform: scale(1.45) rotate(110deg); opacity: 0; }
        }
        @keyframes enemyShadowStrike {
          0% { transform: translateY(-60px) scaleY(1.9); opacity: 0; filter: brightness(2.5); }
          45% { transform: translateY(0) scaleY(1); opacity: 1; filter: drop-shadow(0 0 22px #a855f7); }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes enemyEarthFissure {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; }
          35% { transform: scale(1.25) translateY(0); opacity: 1; filter: brightness(2) drop-shadow(0 0 24px #f59e0b); }
          100% { transform: scale(1.05) translateY(0); opacity: 0; }
        }
        @keyframes enemyLightningBurst {
          0% { transform: scale(0.4); opacity: 0; filter: brightness(3.5); }
          25% { transform: scale(1.3); opacity: 1; filter: brightness(2.5) drop-shadow(0 0 24px #22d3ee); }
          75% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes enemyBannerPop {
          0% { transform: translateY(-16px) scale(0.9); opacity: 0; }
          30% { transform: translateY(0) scale(1.04); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        /* 1. Gentle Idle Sway for resting cards */
        @keyframes cardIdleFloat0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(0.8deg); }
        }
        @keyframes cardIdleFloat1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-0.8deg); }
        }
        @keyframes cardIdleFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(0.8deg); }
        }
        @keyframes cardIdleFloat3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-0.8deg); }
        }

        .anim-idle-0 { animation: cardIdleFloat0 3.2s ease-in-out infinite 0s; }
        .anim-idle-1 { animation: cardIdleFloat1 3.2s ease-in-out infinite 0.7s; }
        .anim-idle-2 { animation: cardIdleFloat2 3.2s ease-in-out infinite 1.4s; }
        .anim-idle-3 { animation: cardIdleFloat3 3.2s ease-in-out infinite 2.1s; }

        /* 2. Dragged Card Active Pendulum Swinging Sway */
        @keyframes cardDragSwayLoop {
          0% { transform: rotate(-5deg) scale(1.15); }
          50% { transform: rotate(5deg) scale(1.18); }
          100% { transform: rotate(-5deg) scale(1.15); }
        }
        .anim-drag-pendulum {
          animation: cardDragSwayLoop 1.4s ease-in-out infinite;
        }

        /* 3. Ready to Combine Eager Hopping Animation (NO OUTLINE/NO DELINEADO) */
        @keyframes combineReadyHop {
          0%, 100% {
            transform: translateY(0px) scale(1, 1) rotate(0deg);
          }
          25% {
            transform: translateY(-14px) scale(0.92, 1.12) rotate(-3.5deg);
          }
          50% {
            transform: translateY(0px) scale(1.12, 0.9) rotate(0deg);
          }
          75% {
            transform: translateY(-7px) scale(0.96, 1.05) rotate(3.5deg);
          }
        }
        .anim-combine-ready {
          animation: combineReadyHop 0.65s cubic-bezier(0.28, 0.84, 0.42, 1) infinite !important;
        }

        /* 4. Cartoon Combination Squash & Stretch Impact Burst (Vibrant, high-contrast, no whiteout) */
        @keyframes cartoonCombineImpact {
          0% {
            transform: scale(1.16, 0.84) translateY(4px);
            filter: drop-shadow(0 0 16px #f59e0b) brightness(1.2);
          }
          30% {
            transform: scale(0.92, 1.15) translateY(-8px);
            filter: drop-shadow(0 0 24px #fbbf24) brightness(1.3);
          }
          60% {
            transform: scale(1.06, 0.96) translateY(2px);
            filter: drop-shadow(0 0 14px #f59e0b) brightness(1.15);
          }
          85% {
            transform: scale(0.98, 1.02) translateY(-1px);
            filter: drop-shadow(0 0 8px #f59e0b) brightness(1.05);
          }
          100% {
            transform: scale(1, 1) translateY(0);
            filter: drop-shadow(0 0 0px transparent) brightness(1);
          }
        }
        .anim-combine-burst {
          animation: cartoonCombineImpact 0.7s cubic-bezier(0.2, 0.9, 0.3, 1) forwards !important;
        }

        @keyframes lightSweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .anim-light-sweep {
          animation: lightSweep 0.65s ease-out forwards;
        }

        /* 5. Smooth elastic cartoon spring curve for card positioning and recentering (no opacity lag) */
        .card-slot-spring {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1.15);
        }

        /* 6. Cartoon FX Remaster Custom Keyframes */
        /* 2x2 Spritesheet Flipbook Animation (4 frames, 256x256) */
        @keyframes cfxrFlipbook2x2 {
          0%, 24.99% { background-position: 0% 0%; }
          25%, 49.99% { background-position: 100% 0%; }
          50%, 74.99% { background-position: 0% 100%; }
          75%, 100% { background-position: 100% 100%; }
        }

        /* 4x2 Spritesheet Flipbook Animation (8 frames, 256x256) */
        @keyframes cfxrFlipbook4x2 {
          0%, 12.49% { background-position: 0% 0%; }
          12.5%, 24.99% { background-position: 33.333% 0%; }
          25%, 37.49% { background-position: 66.666% 0%; }
          37.5%, 49.99% { background-position: 100% 0%; }
          50%, 62.49% { background-position: 0% 100%; }
          62.5%, 74.99% { background-position: 33.333% 100%; }
          75%, 87.49% { background-position: 66.666% 100%; }
          87.5%, 100% { background-position: 100% 100%; }
        }

        @keyframes cfxrPulseRotate {
          0% { transform: scale(0.6) rotate(0deg); opacity: 0; }
          25% { transform: scale(1.18) rotate(90deg); opacity: 1; }
          75% { transform: scale(1.05) rotate(220deg); opacity: 0.95; }
          100% { transform: scale(1.35) rotate(360deg); opacity: 0; }
        }
        @keyframes cfxrExpandingRing {
          0% { transform: scale(0.15) rotate(0deg); opacity: 1; }
          100% { transform: scale(1.85) rotate(60deg); opacity: 0; }
        }
        @keyframes cfxrSkullAscend {
          0% { transform: translateY(50px) scale(0.55); opacity: 0; }
          35% { transform: translateY(-12px) scale(1.3); opacity: 1; filter: drop-shadow(0 0 30px #a855f7) brightness(1.5); }
          70% { transform: translateY(-28px) scale(1.4); opacity: 0.9; }
          100% { transform: translateY(-55px) scale(1.6); opacity: 0; filter: blur(5px); }
        }
        @keyframes cfxrRunicSpin {
          0% { transform: scale(0.6) rotate(0deg); opacity: 0; }
          25% { transform: scale(1.12) rotate(60deg); opacity: 1; }
          75% { transform: scale(1) rotate(180deg); opacity: 0.9; }
          100% { transform: scale(1.25) rotate(240deg); opacity: 0; }
        }
        @keyframes cfxrSiphonMote1 {
          0% { transform: translate(110px, -20px) scale(0.4); opacity: 0; }
          25% { transform: translate(70px, -45px) scale(1); opacity: 1; filter: drop-shadow(0 0 12px #10b981); }
          75% { transform: translate(-30px, -20px) scale(0.85); opacity: 0.9; }
          100% { transform: translate(-90px, 0px) scale(0.2); opacity: 0; }
        }
        @keyframes cfxrSiphonMote2 {
          0% { transform: translate(120px, 10px) scale(0.4); opacity: 0; }
          25% { transform: translate(80px, -15px) scale(1); opacity: 1; filter: drop-shadow(0 0 12px #34d399); }
          75% { transform: translate(-20px, -5px) scale(0.85); opacity: 0.9; }
          100% { transform: translate(-85px, 15px) scale(0.2); opacity: 0; }
        }
        @keyframes cfxrSiphonMote3 {
          0% { transform: translate(100px, -40px) scale(0.4); opacity: 0; }
          25% { transform: translate(50px, -60px) scale(1.1); opacity: 1; filter: drop-shadow(0 0 15px #059669); }
          75% { transform: translate(-40px, -30px) scale(0.9); opacity: 0.9; }
          100% { transform: translate(-95px, -10px) scale(0.2); opacity: 0; }
        }
        @keyframes cfxrSlashAcross {
          0% { transform: translate(45px, -45px) rotate(-35deg) scaleX(0.2); opacity: 0; }
          30% { transform: translate(0, 0) rotate(-35deg) scaleX(1.15); opacity: 1; filter: drop-shadow(0 0 22px #dc2626) brightness(1.5); }
          70% { transform: translate(-30px, 30px) rotate(-35deg) scaleX(1); opacity: 0.85; }
          100% { transform: translate(-55px, 55px) rotate(-35deg) scaleX(0.7); opacity: 0; }
        }
        @keyframes cfxrImpactBurst {
          0% { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          30% { transform: scale(1.32) rotate(0deg); opacity: 1; filter: brightness(2.4); }
          100% { transform: scale(1.55) rotate(15deg); opacity: 0; }
        }
        @keyframes cfxrRadialBurst0 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(70px, 0px) scale(1) rotate(45deg); opacity: 0; } }
        @keyframes cfxrRadialBurst1 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(50px, -50px) scale(1) rotate(90deg); opacity: 0; } }
        @keyframes cfxrRadialBurst2 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(0px, -70px) scale(1) rotate(135deg); opacity: 0; } }
        @keyframes cfxrRadialBurst3 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(-50px, -50px) scale(1) rotate(180deg); opacity: 0; } }
        @keyframes cfxrRadialBurst4 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(-70px, 0px) scale(1) rotate(225deg); opacity: 0; } }
        @keyframes cfxrRadialBurst5 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(-50px, 50px) scale(1) rotate(270deg); opacity: 0; } }
        @keyframes cfxrRadialBurst6 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(0px, 70px) scale(1) rotate(315deg); opacity: 0; } }
        @keyframes cfxrRadialBurst7 { 0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 1; } 100% { transform: translate(50px, 50px) scale(1) rotate(360deg); opacity: 0; } }

        @keyframes cfxrDebris0 { 0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 1; } 100% { transform: translate(80px, -60px) scale(1) rotate(180deg); opacity: 0; } }
        @keyframes cfxrDebris1 { 0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 1; } 100% { transform: translate(-70px, -70px) scale(0.9) rotate(-160deg); opacity: 0; } }
        @keyframes cfxrDebris2 { 0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 1; } 100% { transform: translate(-80px, 40px) scale(1.1) rotate(210deg); opacity: 0; } }
        @keyframes cfxrDebris3 { 0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 1; } 100% { transform: translate(75px, 50px) scale(0.8) rotate(-240deg); opacity: 0; } }

        @keyframes cfxrEmberDrift1 {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0.2; }
          50% { transform: translate(15px, -25px) rotate(45deg); opacity: 0.65; }
          100% { transform: translate(-10px, -50px) rotate(90deg); opacity: 0.1; }
        }
        @keyframes cfxrEmberDrift2 {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0.15; }
          50% { transform: translate(-20px, -30px) rotate(-35deg); opacity: 0.7; }
          100% { transform: translate(10px, -60px) rotate(-70deg); opacity: 0.15; }
        }
        @keyframes cfxrSparkleSpin {
          0% { transform: scale(0.4) rotate(0deg); opacity: 0; }
          40% { transform: scale(1.25) rotate(120deg); opacity: 1; filter: drop-shadow(0 0 18px #f59e0b); }
          100% { transform: scale(1.5) rotate(260deg); opacity: 0; }
        }

        /* AAA Gacha Camera Shake on Impact - Tier 1 Light */
        @keyframes gachaCameraShakeLight {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 2px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }

        /* Tier 2 Medium */
        @keyframes gachaCameraShakeMedium {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-4px, 3px) rotate(-0.8deg); }
          30% { transform: translate(4px, -3px) rotate(0.8deg); }
          50% { transform: translate(-3px, -2px) rotate(-0.4deg); }
          70% { transform: translate(3px, 2px) rotate(0.4deg); }
          85% { transform: translate(-1px, 1px) rotate(-0.2deg); }
        }

        /* Tier 3 Heavy (Cataclysmic Gacha Ultimate Rumble) */
        @keyframes gachaCameraShakeHeavy {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          10% { transform: translate(-7px, 6px) rotate(-1.5deg) scale(1.02); }
          25% { transform: translate(7px, -5px) rotate(1.5deg) scale(1.01); }
          40% { transform: translate(-6px, 5px) rotate(-1deg); }
          55% { transform: translate(5px, -4px) rotate(1deg); }
          70% { transform: translate(-4px, 3px) rotate(-0.5deg); }
          85% { transform: translate(2px, -2px) rotate(0.3deg); }
        }

        /* AAA Screen Flash on Hit */
        @keyframes gachaScreenFlash {
          0% { opacity: 0; }
          25% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        /* Vertical Thunderbolt Pierce */
        @keyframes cfxrThunderBolt {
          0% { transform: translateY(-160px) scaleY(2) scaleX(0.4); opacity: 0; }
          20% { transform: translateY(0px) scaleY(1.25) scaleX(1.3); opacity: 1; filter: brightness(2.6); }
          60% { transform: translateY(0px) scaleY(1) scaleX(1.05); opacity: 0.95; }
          100% { transform: translateY(0px) scaleY(0.7) scaleX(0.2); opacity: 0; }
        }

        /* Colossal Orbital Sky Beam (Tier 3 Rayo Necrótico) */
        @keyframes cfxrOrbitalBeam {
          0% { transform: translateY(-240px) scaleY(2.8) scaleX(0.4); opacity: 0; }
          22% { transform: translateY(0px) scaleY(1.4) scaleX(1.6); opacity: 1; filter: brightness(2.8) drop-shadow(0 0 45px #00f0ff); }
          65% { transform: translateY(0px) scaleY(1.1) scaleX(1.25); opacity: 0.95; }
          100% { transform: translateY(0px) scaleY(0.6) scaleX(0.1); opacity: 0; }
        }

        /* Dual Sword Trail Cross Slash */
        @keyframes cfxrCrossSlashA {
          0% { transform: translate(60px, -60px) rotate(-45deg) scaleX(0.2); opacity: 0; }
          25% { transform: translate(0, 0) rotate(-45deg) scaleX(1.3); opacity: 1; filter: brightness(2.2); }
          100% { transform: translate(-50px, 50px) rotate(-45deg) scaleX(0.7); opacity: 0; }
        }
        @keyframes cfxrCrossSlashB {
          0% { transform: translate(-60px, -60px) rotate(45deg) scaleX(0.2); opacity: 0; }
          25% { transform: translate(0, 0) rotate(45deg) scaleX(1.3); opacity: 1; filter: brightness(2.2); }
          100% { transform: translate(50px, 50px) rotate(45deg) scaleX(0.7); opacity: 0; }
        }

        /* Horizontal Cleave (Tier 3 Fortalecer Marioneta) */
        @keyframes cfxrHorizontalCleave {
          0% { transform: translateX(80px) scaleX(0.2) scaleY(1.3); opacity: 0; }
          28% { transform: translateX(0px) scaleX(1.4) scaleY(1.2); opacity: 1; filter: brightness(2.6) drop-shadow(0 0 30px #f59e0b); }
          100% { transform: translateX(-70px) scaleX(0.8) scaleY(0.5); opacity: 0; }
        }

        /* Siphon Motes 4, 5, 6 for Tier 3 Drenar Maldiciones */
        @keyframes cfxrSiphonMote4 {
          0% { transform: translate(130px, -60px) scale(0.3); opacity: 0; }
          25% { transform: translate(70px, -85px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 16px #fbbf24); }
          75% { transform: translate(-30px, -45px) scale(0.9); opacity: 0.9; }
          100% { transform: translate(-95px, -15px) scale(0.2); opacity: 0; }
        }
        @keyframes cfxrSiphonMote5 {
          0% { transform: translate(110px, 30px) scale(0.3); opacity: 0; }
          25% { transform: translate(60px, 45px) scale(1); opacity: 1; filter: drop-shadow(0 0 14px #34d399); }
          75% { transform: translate(-40px, 20px) scale(0.85); opacity: 0.9; }
          100% { transform: translate(-90px, 20px) scale(0.2); opacity: 0; }
        }
        @keyframes cfxrSiphonMote6 {
          0% { transform: translate(140px, -10px) scale(0.3); opacity: 0; }
          25% { transform: translate(80px, -30px) scale(1.1); opacity: 1; filter: drop-shadow(0 0 18px #00f0ff); }
          75% { transform: translate(-25px, -10px) scale(0.9); opacity: 0.9; }
          100% { transform: translate(-90px, 5px) scale(0.2); opacity: 0; }
        }

        /* Tier 2 & Tier 3 Cinematic Gacha Banner Drop */
        @keyframes cfxrTier3Banner {
          0% { transform: translate(-50%, -24px) scale(0.7); opacity: 0; }
          25% { transform: translate(-50%, 0px) scale(1.08); opacity: 1; }
          45% { transform: translate(-50%, 0px) scale(1); opacity: 1; }
          80% { transform: translate(-50%, 0px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -10px) scale(0.95); opacity: 0; }
        }



        /* Sequential Status Toast Animation (DE UNO EN UNO CON EMOJIS) */
        @keyframes statusToastEnter {
          0% { transform: translate(-50%, -16px) scale(0.85); opacity: 0; }
          12% { transform: translate(-50%, 0) scale(1.04); opacity: 1; }
          82% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -10px) scale(0.9); opacity: 0; }
        }

        /* Pokémon Paralysis Shudder / Twitch (Parálisis clásica) */
        @keyframes pokemonParalysisTwitch {
          0%, 100% { transform: translateX(0); }
          5% { transform: translateX(-4px); }
          10% { transform: translateX(4px); }
          15% { transform: translateX(-3px); }
          20% { transform: translateX(3px); }
          25% { transform: translateX(0); }
        }

        /* Medusa Abisal Hover & Floating Animation */
        @keyframes medusaHoverFloat {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-12px) scale(1.03) rotate(1.5deg); }
        }

        /* Instant Visceral Hero Hit Shake (Physical Recoil) */
        @keyframes heroHitShake {
          0% {
            transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
          }
          12% {
            transform: translateX(-16px) translateY(-4px) scale(0.94) rotate(-3deg);
          }
          26% {
            transform: translateX(13px) translateY(3px) scale(0.96) rotate(2deg);
          }
          42% {
            transform: translateX(-9px) translateY(-2px) scale(0.98) rotate(-1deg);
          }
          58% {
            transform: translateX(6px) translateY(1px) scale(0.99) rotate(0.8deg);
          }
          74% {
            transform: translateX(-3px) translateY(0px) scale(1) rotate(-0.4deg);
          }
          88% {
            transform: translateX(1px) translateY(0px) scale(1) rotate(0deg);
          }
          100% {
            transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
          }
        }

        /* Instant Visceral Enemy Hit Shake (Linear Recoil - Zero Rotation, Zero Deformation) */
        @keyframes enemyHitShake {
          0% {
            transform: translateX(0px);
          }
          15% {
            transform: translateX(18px);
          }
          35% {
            transform: translateX(-12px);
          }
          55% {
            transform: translateX(6px);
          }
          75% {
            transform: translateX(-2px);
          }
          100% {
            transform: translateX(0px);
          }
        }

        /* 1. Core Sprite: 100% Solid Pure White Interior with White Core Glow */
        .dnd-impact-sprite-whiteout {
          animation: spriteWhiteoutCore 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          will-change: filter;
        }

        @keyframes spriteWhiteoutCore {
          0%, 75% {
            filter: brightness(0) invert(1) drop-shadow(0 0 4px #ffffff);
            opacity: 1;
          }
          90% {
            filter: brightness(1.6) contrast(1.2);
            opacity: 1;
          }
          100% {
            filter: brightness(1) contrast(1);
            opacity: 1;
          }
        }



        /* D&D Impact Overlay Sub-Keyframes (Instant 100% Solid Impact Frame) */
        @keyframes dndMaskShaderFade {
          0% { opacity: 1; }
          28% { opacity: 1; }
          60% { opacity: 0.65; }
          85% { opacity: 0.25; }
          100% { opacity: 0; }
        }
        @keyframes dndVectorSubtleAppear {
          0% { opacity: 1; transform: scale(1); }
          28% { opacity: 1; transform: scale(1); }
          60% { opacity: 0.75; transform: scale(1.02); }
          85% { opacity: 0.35; transform: scale(1.03); }
          100% { opacity: 0; transform: scale(1.04); }
        }
        @keyframes dndShaderPulse {
          0% { transform: scale(0.92); opacity: 0; }
          25% { transform: scale(1.08); opacity: 1; }
          60% { transform: scale(1.02); opacity: 0.9; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes dndSlashCut {
          0% { transform: translate(-30px, -20px) scale(0.6); opacity: 0; }
          30% { transform: translate(0, 0) scale(1.15); opacity: 1; }
          100% { transform: translate(15px, 10px) scale(0.95); opacity: 0; }
        }
        @keyframes dndPiercePuncture {
          0% { transform: scaleY(0.2) scaleX(1.4); opacity: 0; }
          25% { transform: scaleY(1.2) scaleX(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes dndBluntCrush {
          0% { transform: scale(0.3) rotate(0deg); opacity: 0; }
          35% { transform: scale(1.25) rotate(15deg); opacity: 1; }
          100% { transform: scale(1.4) rotate(30deg); opacity: 0; }
        }
        @keyframes dndFireBurst {
          0% { transform: translateY(20px) scale(0.5); opacity: 0; }
          35% { transform: translateY(-5px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-25px) scale(1.35); opacity: 0; }
        }
        @keyframes dndFrostFractal {
          0% { transform: scale(0.4) rotate(0deg); opacity: 0; }
          30% { transform: scale(1.15) rotate(45deg); opacity: 1; }
          100% { transform: scale(1.05) rotate(90deg); opacity: 0; }
        }
        @keyframes dndLightningArc {
          0% { transform: scale(0.9); opacity: 0; }
          15% { transform: scale(1.2) skewX(6deg); opacity: 1; }
          35% { transform: scale(0.85) skewX(-4deg); opacity: 0.7; }
          55% { transform: scale(1.15) skewX(3deg); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes dndThunderRings {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes dndAcidDissolve {
          0% { transform: translateY(-10px) scale(0.8); opacity: 0; }
          35% { transform: translateY(0px) scale(1.1); opacity: 1; }
          100% { transform: translateY(20px) scale(1.2); opacity: 0; }
        }
        @keyframes dndPoisonSwirl {
          0% { transform: scale(0.6) rotate(0deg); opacity: 0; }
          40% { transform: scale(1.15) rotate(15deg); opacity: 0.95; }
          100% { transform: scale(1.3) rotate(30deg); opacity: 0; }
        }
        @keyframes dndNecroVoid {
          0% { transform: scale(0.4) rotate(0deg); opacity: 0; }
          35% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(1.4) rotate(360deg); opacity: 0; }
        }
        @keyframes dndRadiantFlare {
          0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
          30% { transform: scale(1.3) rotate(25deg); opacity: 1; }
          100% { transform: scale(1.5) rotate(50deg); opacity: 0; }
        }
        @keyframes dndForceSingularity {
          0% { transform: scale(1.6); opacity: 0; }
          35% { transform: scale(0.85); opacity: 1; }
          65% { transform: scale(1.2); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes dndPsychicWarp {
          0% { transform: scale(0.6) skewX(-10deg); opacity: 0; }
          30% { transform: scale(1.2) skewX(8deg); opacity: 1; }
          100% { transform: scale(1.35) skewX(0deg); opacity: 0; }
        }

        /* Clean Sprite Defeat Animation (Zero Particles, Clean Fade) */
        @keyframes spriteDefeatFade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          30% {
            opacity: 0.85;
            filter: brightness(1.4);
            transform: translateY(-2px) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translateY(8px) scale(0.92);
          }
        }

        /* Hero Ultimate Orb Charge Pop Animation */
        @keyframes orbChargePop {
          0% {
            transform: scale(0.2);
            filter: brightness(4) drop-shadow(0 0 25px #ffffff);
            opacity: 0.4;
          }
          35% {
            transform: scale(1.65);
            filter: brightness(2.8) drop-shadow(0 0 25px #facc15) drop-shadow(0 0 45px #f59e0b);
            opacity: 1;
          }
          65% {
            transform: scale(0.88);
            filter: brightness(1.6) drop-shadow(0 0 16px #f59e0b);
            opacity: 1;
          }
          85% {
            transform: scale(1.12);
            filter: brightness(1.3) drop-shadow(0 0 12px #f59e0b);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 8px #f59e0b);
            opacity: 1;
          }
        }

        /* Boss Ultimate Orb Charge Pop Animation */
        @keyframes enemyOrbChargePop {
          0% {
            transform: scale(0.2);
            filter: brightness(4) drop-shadow(0 0 25px #ffffff);
            opacity: 0.4;
          }
          35% {
            transform: scale(1.65);
            filter: brightness(2.8) drop-shadow(0 0 25px #ff4d6d) drop-shadow(0 0 45px #ef4444);
            opacity: 1;
          }
          65% {
            transform: scale(0.88);
            filter: brightness(1.6) drop-shadow(0 0 16px #ef4444);
            opacity: 1;
          }
          85% {
            transform: scale(1.12);
            filter: brightness(1.3) drop-shadow(0 0 12px #ef4444);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 8px #ef4444);
            opacity: 1;
          }
        }

        /* ========================================================================= */
        /* FATE/GRAND ORDER (FGO) NOBLE PHANTASM (宝具) KEYFRAME ANIMATIONS          */
        /* ========================================================================= */
        @keyframes fgoLetterboxTop {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        @keyframes fgoLetterboxBottom {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes fgoSpeedLines {
          0% { background-position: 0 0; }
          100% { background-position: -400px -200px; }
        }
        @keyframes fgoHeroSlideIn {
          0% { transform: translateX(-100%) skewX(-10deg) scale(0.85); opacity: 0; filter: blur(6px) brightness(2.5); }
          60% { transform: translateX(6%) skewX(3deg) scale(1.08); opacity: 1; filter: blur(0px) brightness(1.2); }
          100% { transform: translateX(0%) skewX(0deg) scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes fgoEnemySlideIn {
          0% { transform: translateX(100%) skewX(10deg) scale(0.85); opacity: 0; filter: blur(6px) brightness(2.5); }
          60% { transform: translateX(-6%) skewX(-3deg) scale(1.08); opacity: 1; filter: blur(0px) brightness(1.2); }
          100% { transform: translateX(0%) skewX(0deg) scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes fgoEyeFlare {
          0% { transform: scale(0); opacity: 0; }
          30% { transform: scale(2.8); opacity: 1; filter: drop-shadow(0 0 16px #38bdf8) drop-shadow(0 0 30px #ffffff); }
          70% { transform: scale(1.3); opacity: 0.95; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes fgoNpCardSlam {
          0% { transform: scale(2.2) rotate(-5deg); opacity: 0; filter: brightness(3.5); }
          65% { transform: scale(0.96) rotate(1deg); opacity: 1; filter: brightness(1.4); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
        }
        @keyframes fgoChantFadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fgoEnergyGather {
          0% { transform: scale(3.5) rotate(0deg); opacity: 0; }
          50% { opacity: 0.95; }
          100% { transform: scale(0.15) rotate(220deg); opacity: 1; }
        }
        @keyframes fgoHitSlam {
          0% { transform: scale(2.4); opacity: 0; filter: brightness(3.5); }
          40% { transform: scale(0.88); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fgoBeamBlast {
          0% { transform: scaleY(0.08) scaleX(0.1); opacity: 0.2; }
          25% { transform: scaleY(1.4) scaleX(1); opacity: 1; filter: brightness(2.5); }
          75% { transform: scaleY(0.9) scaleX(1); opacity: 1; }
          100% { transform: scaleY(0) scaleX(1.3); opacity: 0; }
        }
        @keyframes fgoTotalDamagePop {
          0% { transform: scale(0.3) rotate(-4deg); opacity: 0; filter: brightness(3.5); }
          60% { transform: scale(1.18) rotate(1.5deg); opacity: 1; filter: brightness(1.6); }
          85% { transform: scale(0.96) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fgoOverkillPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px #ef4444); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 24px #f59e0b) drop-shadow(0 0 40px #ef4444); }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: BOSS HEALTH BAR & ARAKNOIDE PORTRAIT                       */}
      {/* Panel is wider (w-[calc(100%+36px)] -mx-[18px]) to eliminate black edges  */}
      {/* Super intense saturated red health bar, mirrored portrait at right edge   */}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: BOSS HEALTH BAR, 5 ORBS & PORTRAIT */}
      <div
        className="relative z-20 w-[calc(100%+36px)] -mx-[18px] min-h-[58px] py-2 px-5 flex flex-col justify-center shadow-lg shrink-0 overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/aistudio/image_b8a81806.png)',
          backgroundSize: '112% 115%',
          backgroundPosition: 'center',
          backgroundColor: '#380f05',
        }}
      >
        <div className="w-full flex items-center justify-between">
          {/* Enemy Left Column: Break Bar (Fase 1/2) + 5 Crimson Orbs + Health Bar */}
          <div className="relative flex-1 flex flex-col justify-center mr-3 gap-1 z-20">
            {/* Boss Info Bar: Break Bar + Intent Preview + 5-Orb Gauge */}
            <div className="flex items-center justify-between px-1">
              {/* Boss 5-Orb Gauge */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const isFilled = slotIdx < enemyUltimateOrbs;
                  const isGaining = newlyGainedEnemyOrbIdx === slotIdx;
                  return (
                    <div
                      key={slotIdx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 flex items-center justify-center relative ${
                        isGaining ? 'animate-[enemyOrbChargePop_0.85s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]' : ''
                      } ${
                        isFilled
                          ? enemyUltimateOrbs >= 5
                            ? 'border border-rose-200 bg-gradient-to-tr from-rose-700 via-red-500 to-rose-300 shadow-[0_0_14px_#f43f5e] animate-pulse scale-105'
                            : 'border border-rose-300 bg-gradient-to-tr from-rose-700 via-red-500 to-rose-300 shadow-[0_0_9px_#ef4444]'
                          : 'border border-red-900/40 bg-black/55 shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]'
                      }`}
                    >
                      {isGaining && (
                        <div className="absolute -inset-2 rounded-full border-2 border-rose-400 animate-ping pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Boss Mechanics Badge: Break Bar */}
              {targetEnemy.configId.includes('devorador') && (
                <div className="flex items-center gap-1.5">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border shadow-md ${
                    targetEnemy.configId === 'devorador_quitinoso'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-600/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : 'bg-rose-950/90 text-rose-300 border-rose-600/80 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                  }`}>
                    {targetEnemy.configId === 'devorador_quitinoso' ? '🛡️ FASE 1/2 • CORAZA' : '🔥 FASE 2/2 • FRENESÍ'}
                  </div>
                </div>
              )}
            </div>

            {/* Clean Boss Health Bar without text overlay */}
            <div className="relative w-full h-[28px] rounded-sm overflow-hidden flex items-center">
              <div className="absolute inset-y-[8%] inset-x-[2.9%] rounded-xs overflow-hidden flex items-center bg-[#1e0305] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]">
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100))}%`,
                    boxShadow: '0 0 18px #ff0033, inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(130,0,0,0.6)',
                  }}
                  className="h-full bg-gradient-to-r from-[#ff0033] via-[#ff1447] to-[#ff0022] transition-all duration-300 filter brightness-110 saturate-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/25 pointer-events-none" />
                </div>
              </div>

              {/* Authentic Red Health Frame */}
              <img
                src="/assets/aistudio/image_fee54ee0.png"
                alt="Health Frame"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
              />
            </div>
          </div>

          {/* Dynamic Boss Portrait */}
          <div className="relative w-[54px] h-[54px] shrink-0 rounded-lg overflow-hidden border border-amber-600/60 bg-black/60 flex items-center justify-center pointer-events-none z-30 shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
            <img
              src={currentEnemy.thumbUrl}
              alt={currentEnemy.name}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTRAL ARENA: SPIDER CAVE BACKGROUND, MAGORDITO & ARAKNOIDE          */}
      {/* Both fighters are grounded with authentic shadow strictly underneath feet */}
      {/* ========================================================================= */}
      <div
        ref={arenaRef}
        className={`relative w-full flex-1 min-h-[300px] flex items-center justify-center overflow-hidden ${
          screenShake === 'heavy'
            ? 'animate-[gachaCameraShakeHeavy_0.36s_ease-in-out]'
            : screenShake === 'medium'
            ? 'animate-[gachaCameraShakeMedium_0.25s_ease-in-out]'
            : screenShake === 'light'
            ? 'animate-[gachaCameraShakeLight_0.18s_ease-in-out]'
            : ''
        }`}
      >
        {/* Arena Cave / Mansion / Forest / Sealed Gates / Bandits Ambush Background */}
        <img
          src={
            selectedCombatMissionId === 'm5_cuevas_zancudo'
              ? '/assets/backgrounds/mina_underdark_telaranas.png'
              : selectedCombatMissionId === 'm4_cuevas_azul'
              ? '/assets/backgrounds/cueva_congelada.png'
              : selectedCombatMissionId === 'm3_cuevas_rojo'
              ? '/assets/backgrounds/cueva_huevos_carmesis.png'
              : selectedCombatMissionId === 'evento_asalto_orco'
              ? '/assets/backgrounds/asalto_orco_combate.png'
              : selectedCombatMissionId === 'evento_emboscada_bandidos'
              ? '/assets/backgrounds/emboscada_combate.png'
              : selectedCombatMissionId === 'm4_puertas_selladas'
              ? '/assets/backgrounds/puertas_selladas_glimmerstone.png'
              : selectedCombatMissionId === 'm3_bosque'
              ? '/assets/backgrounds/bosque_icespear.png'
              : selectedCombatMissionId === 'm2_robo'
              ? '/assets/backgrounds/icespear_combate_guardias.png'
              : '/assets/aistudio/image_4daa80e0.png'
          }
          alt={
            selectedCombatMissionId === 'm5_cuevas_zancudo'
              ? 'Mina Enana en Ruinas con Telarañas en el Underdark'
              : selectedCombatMissionId === 'm4_cuevas_azul'
              ? 'Caverna Congelada de los Acechadores Gélidos'
              : selectedCombatMissionId === 'm3_cuevas_rojo'
              ? 'Cueva de Huevos Carmesís'
              : selectedCombatMissionId === 'evento_asalto_orco'
              ? 'Asalto Orco en el Paso Helado'
              : selectedCombatMissionId === 'evento_emboscada_bandidos'
              ? 'Emboscada de Bandidos en el Vado'
              : selectedCombatMissionId === 'm4_puertas_selladas'
              ? 'Puertas Selladas de Glimmerstone'
              : selectedCombatMissionId === 'm3_bosque'
              ? 'Bosque Invernal de Icespear'
              : selectedCombatMissionId === 'm2_robo'
              ? 'Mansión y Callejón de Icespear'
              : 'Cueva de Icespear'
          }
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 filter brightness-[0.98]"
        />

        {/* Discreet Retreat / Exit in top-left corner */}
        <button
          onClick={handleRetreatAndClaim}
          title="Retirarse a la aldea"
          className="absolute top-2 left-2 z-30 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 border border-amber-900/60 text-amber-300/80 hover:text-amber-200 text-xs flex items-center justify-center shadow-md backdrop-blur-xs cursor-pointer transition-all active:scale-90 font-mono"
        >
          ✕
        </button>


        {/* Tactical Multi-Enemy Formation Roster (Turn Markers, Non-Interactive) */}
        {activeEnemies.length > 1 && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 border border-amber-900/60 shadow-lg backdrop-blur-xs pointer-events-none select-none">
            {activeEnemies.map((enemy, idx) => {
              const isSelected = idx === selectedEnemyIdx;
              const isDead = enemy.hp <= 0 || enemy.isAshDissolving;
              const hpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
              return (
                <div
                  key={enemy.uid}
                  className={`relative w-8 h-8 rounded-lg overflow-hidden border transition-all duration-200 ${
                    isSelected
                      ? 'border-yellow-400 ring-2 ring-yellow-400/80 scale-105 shadow-[0_0_12px_#f59e0b] bg-amber-950/40'
                      : isDead
                      ? 'border-stone-800 opacity-35 grayscale bg-black/80'
                      : 'border-stone-700/80 bg-stone-900/85'
                  }`}
                  title={`${enemy.name} (${enemy.hp}/${enemy.maxHp} PV)`}
                >
                  <img src={enemy.thumbUrl} alt={enemy.name} className="w-full h-full object-contain p-0.5 pointer-events-none" />
                  {/* HP Mini Bar */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-black/90 pointer-events-none">
                    <div
                      className={`h-full transition-all duration-200 ${hpPct > 50 ? 'bg-emerald-400' : hpPct > 20 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  {enemy.isBoss && (
                    <span className="absolute top-0 right-0 px-0.5 text-[7px] font-black bg-red-600 text-white rounded-bl leading-none pointer-events-none">
                      ★
                    </span>
                  )}
                  {isDead && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] pointer-events-none">
                      ☠️
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Saquitos de botin: nacen sobre el enemigo derrotado, caen a su sombra y se vuelven ceniza */}
        <div ref={lootLayerRef} className="absolute inset-0 pointer-events-none z-40">
          {lootSacks.map((sack) => (
            <div
              key={sack.key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: sack.left, top: sack.top }}
            >
              <div
                className={`relative flex flex-col items-center ${sack.dissolving ? 'animate-loot-ash' : 'animate-loot-fall'}`}
                style={{ '--loot-fall': `${sack.fall}px` } as React.CSSProperties}
              >
                <LootSackIcon className="w-10 h-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]" />
                {sack.dissolving && <AshDisintegrationEffect active width={44} height={44} />}
              </div>
            </div>
          ))}
        </div>

        {/* ARAKNOIDE GACHA ACTIVE STATUS TRAY (CLEAN COMPACT STATUS TOKENS) */}
        {enemyConditions.length > 0 && (
          <div className="absolute top-1.5 right-20 z-30 flex items-center gap-1.5 justify-end">
            {enemyConditions.map((cond) => (
              <button
                key={cond.id}
                onClick={() => setSelectedConditionTooltip(cond)}
                title={`${cond.name} (${cond.isBuff ? 'Buff' : 'Debuff'}): ${cond.turnsRemaining} Turnos`}
                className={`group relative w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer backdrop-blur-md ${
                  cond.isBuff
                    ? 'bg-slate-950/85 border-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                    : 'bg-slate-950/85 border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                }`}
              >
                <span className="text-sm select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {toSingleEmoji(cond.icon)}
                </span>
                {cond.stacks > 1 && (
                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black font-mono leading-none shadow-sm border border-slate-900">
                    {cond.stacks}
                  </span>
                )}
                <span className="absolute -bottom-1.5 -right-1 px-1 py-0.2 rounded-full bg-slate-900/90 text-stone-200 text-[8px] font-bold font-mono leading-none border border-white/20">
                  {cond.turnsRemaining}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tier 3 Dramatic Cinematic Dark Contrast Vignette */}
        {tier3Cinematic && (
          <div className="absolute inset-0 bg-black/55 pointer-events-none z-45 animate-[gachaScreenFlash_0.35s_ease-out_forwards] backdrop-blur-[0.5px]" />
        )}

        {/* AAA Gacha Impact Screen Flash */}
        {screenFlash && (
          <div
            className={`absolute inset-0 pointer-events-none z-50 animate-[gachaScreenFlash_0.18s_ease-out_forwards] ${
              screenFlash === 'cyan'
                ? 'bg-gradient-to-r from-cyan-400/35 via-white/45 to-cyan-400/35'
                : screenFlash === 'purple'
                ? 'bg-gradient-to-r from-purple-500/35 via-white/45 to-purple-500/35'
                : screenFlash === 'red'
                ? 'bg-gradient-to-r from-red-600/40 via-red-500/30 to-red-600/40'
                : 'bg-gradient-to-r from-amber-300/35 via-white/45 to-amber-300/35'
            }`}
            style={{ mixBlendMode: 'screen' }}
          />
        )}

        {/* Floating Damage Numbers with Official Vector Damage Emblems */}
        {floatingTexts.map((item) => (
          <div
            key={item.id}
            style={{
              left: item.isEnemy
                ? item.slotIndex === 0
                  ? '78%'
                  : item.slotIndex === 1
                  ? '62%'
                  : item.slotIndex === 2
                  ? '46%'
                  : '72%'
                : '26%',
              top: item.isEnemy ? (item.tier === 3 ? '30%' : '35%') : '39%',
            }}
            className={`absolute pointer-events-none z-50 transform -translate-x-1/2 font-black tracking-wider animate-bounce flex flex-col items-center gap-0.5 ${
              item.isHeal
                ? item.tier === 3
                  ? 'text-emerald-300 drop-shadow-[0_0_18px_#10b981] scale-125'
                  : item.tier === 2
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_#10b981] scale-110'
                  : 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]'
                : item.isEnemy
                ? item.tier === 3
                  ? 'text-yellow-200 drop-shadow-[0_0_20px_#f59e0b] scale-135'
                  : item.tier === 2
                  ? 'text-amber-300 drop-shadow-[0_0_14px_#38bdf8] scale-115'
                  : 'text-yellow-300 drop-shadow-[0_3px_10px_rgba(220,38,38,1)]'
                : 'text-red-500 drop-shadow-[0_3px_10px_rgba(0,0,0,1)]'
            }`}
          >
            {/* Clean Cartoon Damage and Heal Indicator (Zero Icons) */}
            {item.isHeal && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/85 border border-emerald-400/80 shadow-[0_0_12px_#10b981]">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Sanación</span>
              </div>
            )}

            <span
              style={item.badgeColor ? { color: item.badgeColor, textShadow: `0 0 16px ${item.badgeColor}` } : undefined}
              className={item.tier === 3 ? 'text-3xl font-black drop-shadow-[0_2px_8px_rgba(0,0,0,1)]' : item.tier === 2 ? 'text-2xl font-black drop-shadow-[0_2px_6px_rgba(0,0,0,1)]' : 'text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]'}
            >
              {item.isCrit ? `★ ${item.text} ★` : item.text}
            </span>
          </div>
        ))}

        {/* HERO: MAGORDITO (Scaled down 25% and pushed left for increased separation, moved 5% upwards) */}
        <div
          key="hero-sprite-wrapper"
          style={{
            bottom: 'calc(5% + 4px)',
            transform:
              heroAnimation === 'lunge'
                ? 'translateX(35px) scale(1.04)'
                : undefined,
          }}
          className={`absolute left-[6.5%] w-[149px] h-[256px] flex items-end justify-center transition-all duration-300 z-10 ${
            isHeroHitShaking
              ? 'animate-[heroHitShake_0.42s_cubic-bezier(0.2,0.8,0.2,1)_forwards]'
              : heroTwitching
              ? 'animate-[pokemonParalysisTwitch_0.8s_ease-in-out] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]'
              : 'filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]'
          }`}
        >
          {/* Authentic Shadow sprite anchored in the exact middle of Magordito's feet contact plane */}
          <img
            src="/assets/aistudio/sombra_6ce1cba3.png"
            alt="Sombra"
            className={`absolute -bottom-[10px] left-1/2 transform -translate-x-1/2 w-[142px] h-[20px] object-fill pointer-events-none z-0 transition-opacity duration-1000 ${
              isHeroAshDissolving ? 'opacity-0' : 'opacity-50'
            }`}
          />

          {/* Magordito Sprite (Transparent Background, Dynamic Pose Changes, Stably Mounted) */}
          <div className="relative w-full h-full flex items-end justify-center">
            {/* Authentic Ash/Ember Dissolution Effect when defeated */}
            <AshDisintegrationEffect active={isHeroAshDissolving} width={149} height={256} />
            <img
              key="hero-sprite-img"
              src={getHeroSpriteUrl()}
              alt={isEdacornCombat ? 'Edacorn' : 'Magordito'}
              className={`relative h-full w-auto shrink-0 max-w-none max-h-[256px] object-contain pointer-events-none z-10 transition-all duration-300 ${
                isHeroAshDissolving
                  ? 'animate-[spriteDefeatFade_1.2s_ease-out_forwards]'
                  : isHeroHitShaking
                  ? 'dnd-impact-sprite-whiteout'
                  : ''
              } ${
                isEdacornStealthed
                  ? 'opacity-35 drop-shadow-[0_0_24px_rgba(16,185,129,0.95)] filter saturate-150 brightness-110'
                  : ''
              }`}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARTOON FX REMASTER - ANIMATED SPRITE COMBAT VFX OVERLAY                  */}
        {/* No spell particles (activeSkillVfx=null, activeEnemyAttack=null)           */}
        {/* Hit reactions and whiteout impact flashes remain active                   */}
        {/* ========================================================================= */}
        <CartoonFxAnimatedSpriteOverlay
          activeSkillVfx={null}
          activeEnemyAttack={null}
          heroHitKey={heroHitKey}
          enemyHitKey={enemyHitKey}
          heroImpactDamageType={heroImpactDamageType}
          enemyImpactDamageType={enemyImpactDamageType}
        />

        {/* SINGLE ACTIVE ENEMY IN ARENA (1 vs 1 Pokemon Style, Stably Mounted) */}
        {targetEnemy && (
          <div
            key={`active-enemy-${targetEnemy.uid}`}
            data-enemy-sprite={targetEnemy.uid}
            style={{
              transform:
                targetEnemy.animation === 'strike'
                  ? 'translateX(-40px)'
                  : enemySwitchState === 'exit'
                  ? 'translateX(120px)'
                  : undefined,
            }}
            className={`absolute right-[5%] bottom-[21%] z-20 ${targetEnemy.scaleClass} flex items-end justify-center transition-all duration-300 ${
              targetEnemy.hp <= 0 && !targetEnemy.isAshDissolving ? 'pointer-events-none opacity-0' : ''
            } ${
              isEnemyHitShaking
                ? 'animate-[enemyHitShake_0.42s_cubic-bezier(0.2,0.8,0.2,1)_forwards]'
                : enemyTwitching
                ? 'animate-[pokemonParalysisTwitch_0.8s_ease-in-out] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]'
                : 'filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]'
            } ${
              enemySwitchState === 'enter'
                ? 'animate-[pokemonSlideIn_0.42s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'
                : enemySwitchState === 'exit'
                ? 'animate-[pokemonSwitchOut_0.35s_ease-in_forwards]'
                : ''
            }`}
          >
            {/* Authentic Shadow anchored in the exact middle of enemy feet / claws contact plane */}
            <img
              src="/assets/aistudio/sombra_6ce1cba3.png"
              alt="Sombra"
              data-enemy-shadow=""
              className={`absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-[140px] h-[18px] object-fill pointer-events-none z-0 transition-opacity duration-1000 ${
                targetEnemy.isAshDissolving || targetEnemy.hp <= 0 ? 'opacity-0' : 'opacity-50'
              }`}
            />

            {/* Enemy Sprite (Transparent Background, Stably Mounted) */}
            <div className="relative w-full h-full flex items-end justify-center">
              {targetEnemy.configId === 'medusa' ? (
                <div className="relative w-full h-full flex items-center justify-center animate-[medusaHoverFloat_3.2s_ease-in-out_infinite]">
                  <AshDisintegrationEffect active={targetEnemy.isAshDissolving} width={136} height={192} />
                  {!targetEnemy.isAshDissolving && (
                    <div className="absolute -bottom-2 w-32 h-8 rounded-full bg-cyan-400/25 blur-md pointer-events-none z-0" />
                  )}
                  <img
                    key={`enemy-medusa-img-${targetEnemy.uid}`}
                    src={getEnemySpriteUrl(targetEnemy)}
                    alt="Medusa Abisal"
                    className={`relative h-full w-auto shrink-0 max-w-none object-contain pointer-events-none z-10 ${
                      targetEnemy.isAshDissolving
                        ? 'animate-[spriteDefeatFade_1.2s_ease-out_forwards]'
                        : isEnemyHitShaking
                        ? getDndImpactAnimationClass(enemyImpactDamageType)
                        : 'filter drop-shadow-[0_0_18px_rgba(34,211,238,0.7)]'
                    }`}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-end justify-center">
                  <AshDisintegrationEffect active={targetEnemy.isAshDissolving} width={targetEnemy.width || 135} height={targetEnemy.height || 192} />
                  <img
                    key={`enemy-sprite-img-${targetEnemy.uid}`}
                    src={getEnemySpriteUrl(targetEnemy)}
                    alt={targetEnemy.name}
                    className={`relative h-full w-auto shrink-0 max-w-none object-contain pointer-events-none z-10 ${
                      targetEnemy.isAshDissolving
                        ? 'animate-[spriteDefeatFade_1.2s_ease-out_forwards]'
                        : isEnemyHitShaking
                        ? getDndImpactAnimationClass(enemyImpactDamageType)
                        : targetEnemy.isSemiboss
                        ? 'filter drop-shadow-[0_0_14px_rgba(249,115,22,0.5)]'
                        : targetEnemy.isBoss
                        ? 'filter drop-shadow-[0_0_18px_rgba(220,38,38,0.6)]'
                        : ''
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        )}



        {/* Wave Clear Automatic Progression Banner */}
        {waveClearBanner && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border-2 border-yellow-400 shadow-[0_0_40px_rgba(245,158,11,0.9)] text-center animate-bounce">
              <div className="text-[11px] uppercase tracking-widest text-amber-300 font-black mb-1">
                {selectedCombatMissionId === 'm2_robo'
                  ? waveClearBanner.floor >= 4
                    ? '¡ASALTO A LA MANSIÓN COMPLETADO!'
                    : `¡OLEADA ${waveClearBanner.floor} DE 4 SUPERADA!`
                  : `¡VICTORIA EN SALA ${waveClearBanner.floor}!`}
              </div>
              <div className="text-xl font-black text-white flex items-center gap-2 justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {selectedCombatMissionId === 'm2_robo'
                  ? waveClearBanner.floor >= 4
                    ? '¡VICTORIA TOTAL!'
                    : '¡GUARDIAS REPELIDOS!'
                  : '¡SALA SUPERADA!'}
              </div>
              <div className="text-xs text-yellow-200 mt-2 font-mono font-bold">
                {selectedCombatMissionId === 'm2_robo'
                  ? waveClearBanner.floor >= 4
                    ? 'Cargando diálogo final automáticamente...'
                    : `Siguiente: Oleada ${waveClearBanner.nextFloor} de 4 (${GUARD_CHAMBERS[waveClearBanner.nextFloor - 1]?.name?.split(': ')[1] || 'Refuerzos'})...`
                  : `Avanzando directamente a la Sala ${waveClearBanner.nextFloor}...`}
              </div>
              <div className="mt-2 text-[10px] text-stone-300 font-mono">
                Botín acumulado: 🪙 +{accumulatedLoot.gold.toLocaleString()} • 💎 +{accumulatedLoot.crystals}
              </div>
            </div>
          </div>
        )}

        {/* Phase 2 Boss Transition Banner */}
        {bossTransitioning && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs pointer-events-none animate-in fade-in duration-300">
            <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-950/95 via-sky-900/95 to-cyan-950/95 border-2 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.85)] text-center animate-bounce">
              <div className="text-[11px] uppercase tracking-widest text-cyan-300 font-black mb-1">
                ¡FASE 2 DESBLOQUEADA!
              </div>
              <div className="text-xl font-black text-white filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] flex items-center gap-2 justify-center">
                <span>🪼</span> ¡HA SURGIDO LA MEDUSA ABISAL! <span>⚡</span>
              </div>
              <div className="text-xs text-cyan-200 mt-1 font-medium">
                ¡Cuidado con su descarga eléctrica paralizante y picadura neurotóxica!
              </div>
            </div>
          </div>
        )}

        {/* Turn Skipped CC Warning Banner */}
        {turnSkippedBanner && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-[statusToastEnter_2s_ease-out_forwards]">
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-950/95 via-yellow-900/95 to-amber-950/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.95)] text-center whitespace-nowrap">
              <div className="text-sm font-black text-amber-200 flex items-center justify-center gap-2">
                <span className="text-lg animate-spin">⚡</span>
                <span>¡TURNO DEL JUGADOR OMITIDO POR {turnSkippedBanner}!</span>
              </div>
              <div className="text-[11px] font-bold text-yellow-300 mt-0.5">
                ¡El enemigo ataca 2 veces seguidas!
              </div>
            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* CINEMATIC ULTIMATE MOVE SYSTEM                                            */}
        {/* ========================================================================= */}
        {(isUltimateCinematicActive || isEnemyUltimateCinematic) && (
          <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-between overflow-hidden">
            {/* 2. Deep Cosmic / Arcane Background with Animated Speedlines */}
            <div className={`absolute inset-0 z-10 ${isFgoEnemy ? 'bg-gradient-to-b from-black/95 via-[#230205]/95 to-black/95' : 'bg-gradient-to-b from-black/95 via-[#0b0416]/95 to-black/95'} backdrop-blur-xs`}>
              {/* Radial Magic Seal / Ground Runes */}
              <div className="absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none">
                <img
                  src={isFgoEnemy ? '/assets/cfxr/graphics/cfxr-aura-runic-purple.png' : '/assets/cfxr/graphics/cfxr-aura-runic.png'}
                  alt=""
                  className="w-[390px] h-[390px] object-contain animate-[celestialRuneSpin_3.5s_linear_infinite] filter drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]"
                  style={{ mixBlendMode: 'screen' }}
                />
                <img
                  src={isFgoEnemy ? '/assets/cfxr/graphics/cfxr-ring-electric-violet.png' : '/assets/cfxr/graphics/cfxr-ring-electric-gold.png'}
                  alt=""
                  className="absolute w-[330px] h-[330px] object-contain animate-[celestialRingPulse_1s_ease-in-out_infinite]"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>

              {/* Rising Energy Pillars */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                <img
                  src={isFgoEnemy ? '/assets/cfxr/graphics/cfxr-aura-rays-purple.png' : '/assets/cfxr/graphics/cfxr-aura-rays.png'}
                  alt=""
                  className="w-full h-full object-cover animate-pulse"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>
            </div>

            {/* 3. HERO / ENEMY NP CONTENT STAGE */}
            <div className="relative w-full flex-1 flex flex-col items-center justify-center z-30 px-3">
              {/* PHASE 1: CHANT & NOBLE PHANTASM CARD REVEAL */}
              {fgoPhase === 'chant' && (
                <div className="w-full flex flex-col items-center justify-center gap-3">
                  {/* Dynamic Character Cut-In */}
                  {!isFgoEnemy ? (
                    /* Magordito Hero Cut-In with Eye Flare */
                    <div className="relative w-full flex items-center justify-center animate-[fgoHeroSlideIn_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl animate-pulse" />
                        <img
                          src="/assets/aistudio/splashart_magordito_c1637d56.png"
                          alt="Magordito"
                          className="relative w-full h-full object-contain filter drop-shadow-[0_0_20px_#f59e0b] scale-125"
                        />
                        {/* Eye Lens Flare */}
                        <div className="absolute top-[34%] left-[45%] w-4 h-4 rounded-full bg-cyan-300 animate-[fgoEyeFlare_0.9s_ease-out_infinite] shadow-[0_0_18px_#38bdf8,0_0_30px_#ffffff]" />
                      </div>
                    </div>
                  ) : (
                    /* Boss Cut-In with Menacing Eye Flare */
                    <div className="relative w-full flex items-center justify-center animate-[fgoEnemySlideIn_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full ${currentBoss === 'medusa' ? 'bg-cyan-500/30' : 'bg-red-500/30'} blur-xl animate-pulse`} />
                        <img
                          src={currentBoss === 'medusa' ? '/assets/combat/medusa_thumb.png' : '/assets/aistudio/image_54c3154f.png'}
                          alt=""
                          className="relative w-full h-full object-contain filter drop-shadow-[0_0_20px_#ef4444] scale-125"
                        />
                        {/* Eye Lens Flare */}
                        <div className={`absolute top-[32%] left-[48%] w-4 h-4 rounded-full ${currentBoss === 'medusa' ? 'bg-cyan-300 shadow-[0_0_18px_#22d3ee]' : 'bg-rose-400 shadow-[0_0_18px_#f43f5e]'} animate-[fgoEyeFlare_0.9s_ease-out_infinite]`} />
                      </div>
                    </div>
                  )}

                  {/* FGO Noble Phantasm Card & Name Slam */}
                  <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-black/90 via-stone-900/95 to-black/90 border-2 border-yellow-400/90 shadow-[0_0_30px_rgba(245,158,11,0.9)] text-center animate-[fgoNpCardSlam_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                    <div className="flex items-center justify-center gap-2 mb-0.5">
                      <span className="px-2 py-0.2 rounded bg-red-600 text-white font-mono text-[8px] font-black tracking-widest uppercase shadow-sm">
                        {!isFgoEnemy ? 'BUSTER' : (currentBoss === 'medusa' ? 'ARTS' : 'BUSTER')}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-amber-300 tracking-widest uppercase">
                        {!isFgoEnemy ? '対界宝具 (ANTI-PURGE)' : '対軍宝具 (ANTI-ARMY)'}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-200/90 font-serif italic tracking-wide">
                      {!isFgoEnemy ? 'Stella Judicium' : (currentBoss === 'medusa' ? 'Gorgon Eye: Abyssal Shock' : 'Arachne Void: Web of Decay')}
                    </div>
                    <h2 className="text-2xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-400 drop-shadow-[0_2px_10px_rgba(0,0,0,1)] tracking-widest">
                      {!isFgoEnemy
                        ? '『CATACLISMO ASTRAL』'
                        : (currentBoss === 'medusa' ? '『GORGONA ABISAL: DESCARGA』' : '『TELARAÑA DEL APOCALIPSIS』')}
                    </h2>
                  </div>

                  {/* Subtitle Voice Chant */}
                  <div className="px-4 py-1.5 rounded-full bg-black/80 border border-white/20 text-center animate-[fgoChantFadeIn_0.4s_ease-out_0.2s_forwards]">
                    <p className="text-[11px] font-serif text-amber-100 italic tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                      {!isFgoEnemy
                        ? '«Aquel que contempla el vacío... ¡Que las estrellas caídas juzguen el destino!»'
                        : (currentBoss === 'medusa'
                          ? '«¡Mira a los ojos de la criatura abisal y contempla la petrificación!»'
                          : '«¡Desde las profundidades de la cueva helada, siente el veneno eterno!»')}
                    </p>
                  </div>
                </div>
              )}

              {/* PHASE 2: CHARGE OF MANA & CELESTIAL POWER */}
              {fgoPhase === 'charge' && (
                <div className="relative flex flex-col items-center justify-center">
                  {/* Energy Gathering Vortex */}
                  <img
                    src="/assets/cfxr/graphics/cfxr-ring-electric-gold.png"
                    alt=""
                    className="w-72 h-72 object-contain animate-[fgoEnergyGather_1s_cubic-bezier(0.16,1,0.3,1)_forwards] filter drop-shadow-[0_0_35px_#f59e0b]"
                    style={{ mixBlendMode: 'screen' }}
                  />
                  <img
                    src="/assets/cfxr/graphics/cfxr-flare-gold.png"
                    alt=""
                    className="absolute w-44 h-44 object-contain animate-pulse filter drop-shadow-[0_0_25px_#facc15]"
                    style={{ mixBlendMode: 'screen' }}
                  />
                  <div className="mt-4 px-4 py-1 rounded bg-black/80 border border-yellow-400 text-yellow-300 font-mono text-[11px] font-black tracking-widest uppercase animate-pulse shadow-[0_0_20px_#f59e0b]">
                    ⚡ NOBLE PHANTASM: 100% CHARGED ⚡
                  </div>
                </div>
              )}

              {/* PHASE 3 & 4: MULTI-HIT BARRAGE & IMPACT */}
              {(fgoPhase === 'barrage' || fgoPhase === 'impact') && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  {/* Cosmic Laser Beam Blast */}
                  <div className="absolute inset-x-0 h-28 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 opacity-95 blur-xs animate-[fgoBeamBlast_0.8s_ease-out_forwards] pointer-events-none shadow-[0_0_50px_#f59e0b]" />

                  {/* Explosive Impact Rings & Star Particles */}
                  <img
                    src={isFgoEnemy ? '/assets/cfxr/graphics/cfxr-ring-electric-violet.png' : '/assets/cfxr/graphics/cfxr-ring-electric-gold.png'}
                    alt=""
                    className="absolute w-[360px] h-[360px] object-contain animate-[cfxrExpandingRing_0.6s_ease-out_forwards] filter drop-shadow-[0_0_40px_#f59e0b]"
                    style={{ mixBlendMode: 'screen' }}
                  />

                  {fgoPhase === 'impact' && (
                    <img
                      src="/assets/cfxr/graphics/cfxr-spikes-impact-gold.png"
                      alt=""
                      className="absolute w-[300px] h-[300px] object-contain animate-[cfxrImpactBurst_0.5s_ease-out_forwards] filter drop-shadow-[0_0_30px_#f59e0b]"
                      style={{ mixBlendMode: 'screen' }}
                    />
                  )}

                  {/* FGO Multi-Hit Indicator Badge */}
                  <div className="relative z-30 flex flex-col items-center animate-[fgoHitSlam_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                    <div className="px-3 py-0.5 rounded-full bg-red-600 border border-yellow-300 text-white font-mono font-black text-[10px] tracking-widest shadow-[0_0_15px_#ef4444] uppercase mb-1">
                      {fgoHitCount >= 5 ? '★ CRITICAL HIT ★' : `${fgoHitCount} HIT!`}
                    </div>
                    <div className="text-4xl md:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,1)] tracking-wider">
                      {fgoDamageTally.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 5: TOTAL DAMAGE & OVERKILL DISPLAY */}
              {fgoPhase === 'total' && (
                <div className="relative z-30 flex flex-col items-center justify-center animate-[fgoTotalDamagePop_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                  {/* OVERKILL Golden Emblem */}
                  <div className="px-6 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 border-2 border-yellow-300 shadow-[0_0_30px_#ef4444] animate-[fgoOverkillPulse_1s_infinite] mb-2">
                    <span className="text-sm md:text-base font-black font-mono tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                      ★ OVERKILL ★
                    </span>
                  </div>

                  {/* TOTAL DAMAGE Frame */}
                  <div className="px-6 py-3 rounded-2xl bg-gradient-to-b from-stone-900/95 via-black/95 to-stone-900/95 border-2 border-yellow-400 shadow-[0_0_40px_rgba(245,158,11,0.9)] text-center">
                    <div className="text-[10px] font-mono font-black tracking-widest text-amber-300 uppercase mb-0.5">
                      TOTAL DAMAGE
                    </div>
                    <div className="text-4xl md:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 drop-shadow-[0_3px_10px_rgba(0,0,0,1)]">
                      135,400
                    </div>
                    <div className="text-xs font-bold font-mono text-red-400 mt-1">
                      (-95 PV AL ENEMIGO)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. FGO Cinematic Letterbox - Bottom Cinema Bar */}
            <div className={`relative w-full h-11 md:h-14 bg-gradient-to-t from-black via-stone-950 to-black ${isFgoEnemy ? 'border-t border-red-500/60 shadow-[0_-4px_15px_rgba(239,68,68,0.5)]' : 'border-t border-yellow-500/60 shadow-[0_-4px_15px_rgba(245,158,11,0.5)]'} flex items-center justify-between px-4 z-50 animate-[fgoLetterboxBottom_0.4s_ease-out_forwards]`}>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-stone-400">CLASS:</span>
                <span className={`text-[10px] font-mono font-black ${isFgoEnemy ? 'text-red-300' : 'text-amber-300'}`}>
                  {isFgoEnemy ? (currentBoss === 'medusa' ? 'BEAST / ABYSSAL' : 'AVENGER / ARACHNE') : 'CASTER / MAGORDITO'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-stone-400">STATUS:</span>
                <span className="text-[10px] font-mono font-black text-emerald-400 animate-pulse">
                  EXECUTING NP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE HERO BANNER: CAMPFIRE BACKGROUND, HERO BUST & GREEN HEALTH BAR   */}
      {/* Splashart of Magordito with glowing blue eye                              */}
      {/* Super intense highly saturated solid neon green health bar                */}
      {/* ========================================================================= */}
      <div
        className="relative z-20 w-[calc(100%+36px)] -mx-[18px] min-h-[82px] py-1.5 px-5 flex items-center justify-between shadow-xl overflow-visible shrink-0"
        style={{
          backgroundImage: 'url(/assets/aistudio/image_6c93ccdc.png)',
          backgroundSize: '105% 105%',
          backgroundPosition: 'center',
          backgroundColor: '#0a101d',
        }}
      >
        {/* MAGORDITO GACHA ACTIVE STATUS TRAY (CLEAN COMPACT STATUS TOKENS) */}
        {(heroConditions.length > 0 || activeFoodBuff) && (
          <div className="absolute -top-3.5 left-[100px] z-30 flex items-center gap-1.5 flex-wrap">
            {activeFoodBuff && (
              <button
                key="active-food-buff"
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  setShowInventoryModal(true);
                }}
                title={`${activeFoodBuff.name} (${activeFoodBuff.foodEffectBadge}): ${activeFoodBuff.detailedEffect}${foodShieldHp > 0 ? ` | Escudo: ${foodShieldHp} PV` : ''}`}
                className="group relative w-7 h-7 rounded-lg border border-amber-400/90 bg-slate-950/85 shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <img
                  src={activeFoodBuff.icon}
                  alt={activeFoodBuff.name}
                  className="w-5 h-5 object-contain filter drop-shadow select-none pointer-events-none"
                />
                {foodShieldHp > 0 ? (
                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[8px] font-black font-mono leading-none shadow-sm border border-slate-900">
                    {foodShieldHp}
                  </span>
                ) : (
                  <span className="absolute -bottom-1.5 -right-1 px-1 py-0.2 rounded-full bg-amber-950/90 text-amber-300 text-[8px] font-bold font-mono leading-none border border-amber-400/40">
                    ∞
                  </span>
                )}
              </button>
            )}
            {heroConditions.map((cond) => (
              <button
                key={cond.id}
                onClick={() => setSelectedConditionTooltip(cond)}
                title={`${cond.name} (${cond.isBuff ? 'Buff' : 'Debuff'}): ${cond.turnsRemaining} Turnos`}
                className={`group relative w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer backdrop-blur-md ${
                  cond.isBuff
                    ? 'bg-slate-950/85 border-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                    : 'bg-slate-950/85 border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                }`}
              >
                <span className="text-sm select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {toSingleEmoji(cond.icon)}
                </span>
                {cond.stacks > 1 && (
                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black font-mono leading-none shadow-sm border border-slate-900">
                    {cond.stacks}
                  </span>
                )}
                <span className="absolute -bottom-1.5 -right-1 px-1 py-0.2 rounded-full bg-slate-900/90 text-stone-200 text-[8px] font-bold font-mono leading-none border border-white/20">
                  {cond.turnsRemaining}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Hero Upper-Body Splashart */}
        <div className="relative -ml-2 -mt-4 w-[96px] h-[96px] shrink-0 z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] pointer-events-none">
          <img
            src={
              isEdacornCombat
                ? '/assets/portraits/edacorn_alas_thumb.png'
                : '/assets/aistudio/splashart_magordito_c1637d56.png'
            }
            alt={isEdacornCombat ? 'Edacorn Splashart' : 'Magordito Splashart'}
            className="w-full h-full object-contain object-bottom filter drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]"
          />
        </div>

        {/* Hero Right Column: 5 Golden Orbs (Above) + Health Bar (Clean without text) */}
        <div className="relative flex-1 flex flex-col justify-center ml-2 mr-1 gap-1 z-20">
          {/* 5-Orb Ultimate Gauge - Loose bright yellow orbs without square frame or text */}
          <div className="flex items-center justify-between px-1 py-0.5">
            {/* 5 Circular Orbs (Amarillo brillante, sueltos, sin punto blanco) */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const isFilled = slotIdx < ultimateOrbs;
                const isMax = ultimateOrbs >= 5;
                const isGaining = newlyGainedOrbIdx === slotIdx;
                return (
                  <div
                    key={slotIdx}
                    className={`relative w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center ${
                      isGaining ? 'animate-[orbChargePop_0.85s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]' : ''
                    } ${
                      isFilled
                        ? isMax
                          ? 'border-2 border-yellow-100 bg-gradient-to-tr from-amber-400 via-yellow-300 to-yellow-100 shadow-[0_0_16px_#fde047,0_0_24px_#facc15] scale-110 animate-pulse'
                          : 'border-2 border-yellow-200 bg-gradient-to-tr from-amber-400 via-yellow-300 to-yellow-100 shadow-[0_0_12px_#fde047,0_0_6px_#facc15] scale-100'
                        : 'border border-yellow-600/40 bg-black/55 shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]'
                    }`}
                  >
                    {isGaining && (
                      <div className="absolute -inset-2 rounded-full border-2 border-yellow-300 animate-ping pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clean Hero Health Bar without text overlay */}
          <div className="relative w-full h-[32px] rounded-sm overflow-hidden flex items-center">
            {/* Inner trough */}
            <div className="absolute inset-y-[8%] inset-x-[2.9%] rounded-xs overflow-hidden flex items-center bg-[#031c07] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]">
              {/* HP Fill */}
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, (heroHp / heroMaxHp) * 100))}%`,
                  boxShadow: '0 0 18px #00ff44, inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,120,20,0.6)',
                }}
                className="h-full bg-gradient-to-r from-[#00ff44] via-[#24ff5b] to-[#00eb38] transition-all duration-300 filter brightness-110 saturate-200 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-black/25 pointer-events-none" />
              </div>
            </div>

            {/* Authentic Green Health Frame (barra de vida 1.png) */}
            <img
              src="/assets/aistudio/image_7a62ba8b.png"
              alt="Hero Health Frame"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION PANEL: CARDS AUTO-CENTERED WITH ELASTIC CARTOON BOUNCE    */}
      {/* Panel is wider (w-[calc(100%+36px)] -mx-[18px]) to eliminate black edges  */}
      {/* ========================================================================= */}
      <div
        className="relative z-20 w-[calc(100%+36px)] -mx-[18px] flex flex-col items-center justify-between pt-3 pb-3 px-6 shadow-2xl overflow-hidden shrink-0"
        style={{
          backgroundImage: 'url(/assets/aistudio/image_b8a81806.png)',
          backgroundSize: '112% 115%',
          backgroundPosition: 'center',
          backgroundColor: '#380f05',
        }}
      >
        {/* CARDS CONTAINER: AUTO-CENTERED AT ALL TIMES (Cards dynamically center together) */}
        <div className="relative w-full flex items-center justify-center gap-2 sm:gap-2.5 mb-3 min-h-[135px]">

          {hand.map((card, idx) => {
            const skillDef = SKILL_DEFINITIONS[card.skillId];
            const tierInfo = skillDef?.tiers[card.tier];
            const isHovered = hoverIndex === idx && dragIndex !== idx;
            const isBeingDragged = dragIndex === idx;
            const isMergeTarget = mergeAnim?.targetSlot === idx;

            // Check if this slot can merge with the currently dragged card
            const canMergeWithDragged =
              dragIndex !== null &&
              dragIndex !== idx &&
              hand[dragIndex]?.skillId === card.skillId &&
              hand[dragIndex]?.tier === card.tier &&
              card.tier < 3;

            // Idle animation class applied when cards are resting in hand
            const idleClass =
              dragIndex === null && !isMergeTarget
                ? `anim-idle-${idx % 4}`
                : '';

            return (
              <div
                key={card.instanceId}
                ref={(el) => {
                  slotRefs.current[idx] = el;
                }}
                data-card-slot={idx}
                onPointerDown={(e) => handlePointerDown(idx, e)}
                className={`relative w-[80px] sm:w-[86px] aspect-[3/4.4] shrink-0 rounded-lg overflow-visible flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none card-slot-spring ${idleClass} ${
                  isBeingDragged
                    ? 'opacity-30 scale-95'
                    : isMergeTarget
                    ? 'anim-combine-burst z-40'
                    : isHovered && canMergeWithDragged
                    ? 'anim-combine-ready z-30'
                    : isHovered
                    ? 'scale-105 translate-x-1.5'
                    : 'hover:scale-105 active:scale-95'
                }`}
              >
                {/* High-Contrast Professional Card (Solo el Sprite transparente) */}
                {renderCardContent(card)}
              </div>
            );
          })}
        </div>

        {/* HIDDEN CACHE LAYER: Keeps all 12 card tier assets decoded in GPU memory to prevent 1-second disappearance */}
        <div className="hidden pointer-events-none select-none opacity-0 absolute" aria-hidden="true">
          {[
            '/assets/aistudio/image_f589d3f3.png',
            '/assets/aistudio/image_10ee0a33.png',
            '/assets/aistudio/image_b6d0dc18.png',
            '/assets/aistudio/image_e8288ed9.png',
            '/assets/aistudio/image_4aa946b2.png',
            '/assets/aistudio/image_eb9fd249.png',
            '/assets/aistudio/image_de00910f.png',
            '/assets/items/drenar_maldiciones_tier_2.png',
            '/assets/items/drenar_maldiciones_tier_3.png',
            '/assets/aistudio/image_e0c0b7e7.png',
            '/assets/aistudio/image_3e1c2525.png',
            '/assets/aistudio/image_f9e08028.png',
            '/assets/cfxr/graphics/cfxr-ring-electric-gold.png?v=c3',
            '/assets/cfxr/graphics/cfxr-flare-gold.png?v=c3',
            '/assets/cfxr/graphics/cfxr-magic-star-gold.png?v=c3',
            '/assets/skills/rayo_necrotico_spritesheet.png',
            '/assets/skills/rayo_necrotico_impacto.webp',
          ].map((src) => (
            <img key={src} src={src} alt="" loading="eager" decoding="sync" />
          ))}
        </div>

        {/* BOTTOM ACTION BUTTONS: [ INVENTARIO ] & [ CHANGE ] */}
        <div className="w-full max-w-[420px] grid grid-cols-2 gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              setShowInventoryModal(true);
            }}
            className="h-[44px] px-3 bg-gradient-to-b from-[#e44901] via-[#c64400] to-[#9d3d01] hover:brightness-110 active:brightness-95 border-[2px] border-[#ff6900] text-white font-black text-[12px] sm:text-[13px] uppercase tracking-wider rounded-[8px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.7)] cursor-pointer transition-all active:scale-[0.98] text-center flex items-center justify-center select-none"
          >
            INVENTARIO
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              sound.stopBGM();
              navigateTo('heroes');
            }}
            className="h-[44px] px-3 bg-gradient-to-b from-[#e44901] via-[#c64400] to-[#9d3d01] hover:brightness-110 active:brightness-95 border-[2px] border-[#ff6900] text-white font-black text-[12px] sm:text-[13px] uppercase tracking-wider rounded-[8px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.7)] cursor-pointer transition-all active:scale-[0.98] text-center flex items-center justify-center select-none"
          >
            CHANGE
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FLOATING DRAGGED CARD (PORTAL TO BODY - GUARANTEED 1:1 CURSOR TRACK)   */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' &&
        createPortal(
          dragIndex !== null && dragPos && hand[dragIndex] ? (
            <div
              style={{
                position: 'fixed',
                left: `${dragPos.x}px`,
                top: `${dragPos.y}px`,
                width: `${dragCardSize.width * 1.15}px`,
                height: `${dragCardSize.height * 1.15}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 99999999,
                touchAction: 'none',
                userSelect: 'none',
              }}
              className="will-change-transform"
            >
              <div
                style={{
                  transform: `rotate(${dragTilt}deg)`,
                  transition: 'transform 0.06s ease-out',
                }}
                className="w-full h-full anim-drag-pendulum drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
              >
                {renderCardContent(hand[dragIndex], true)}
              </div>
            </div>
          ) : null,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 6. IN-COMBAT INVENTORY MODAL                                              */}
      {/* ========================================================================= */}
      {/* 6. IN-COMBAT INVENTORY MODAL (Authentic Shelves & Food Buffs)           */}
      {/* ========================================================================= */}
      <CombatInventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        activeFoodBuff={activeFoodBuff}
        onApplyFoodBuff={handleApplyFoodBuff}
      />

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 7. VICTORY / STAGE CLEARED MODAL                                          */}
      {/* ========================================================================= */}
      {battleState === 'victory' && !selectedCombatMissionId && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-[350px] bg-[#1a0f08] border-2 border-amber-600 rounded-2xl p-5 shadow-[0_0_35px_rgba(245,158,11,0.6)] flex flex-col items-center text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3 shadow-[0_0_16px_#f59e0b]">
              <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
            </div>

            <h3 className="text-xl font-serif font-black text-amber-300 tracking-wider mb-1">
              ¡SALA {currentFloor} CONQUISTADA!
            </h3>
            <p className="text-xs text-stone-300 mb-1">
              {currentEnemy.name} y sus huestes han caído.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono font-bold mb-3">
              <span>🏆 Récord: Sala {bestFloor}</span>
              {currentFloor >= bestFloor && (
                <span className="px-1.5 py-0.5 rounded bg-yellow-950 border border-yellow-500 text-yellow-300 animate-pulse font-black">
                  ¡NUEVO RÉCORD!
                </span>
              )}
            </div>

            <div className="w-full bg-black/60 border border-amber-900/80 rounded-xl p-3 mb-4 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Botín Acumulado de la Expedición
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold text-stone-200">
                <div className="flex items-center gap-1.5 justify-center bg-stone-900/80 p-1.5 rounded border border-amber-950">
                  <span className="text-yellow-400">🪙 +{accumulatedLoot.gold.toLocaleString()}</span>
                  <span>Oro</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center bg-stone-900/80 p-1.5 rounded border border-amber-950">
                  <span className="text-cyan-400">💎 +{accumulatedLoot.crystals}</span>
                  <span>Cristales</span>
                </div>
              </div>
              {accumulatedLoot.items.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {accumulatedLoot.items.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-300 bg-emerald-950/40 p-1 rounded border border-emerald-800/40">
                      <img src={it.icon} alt="" className="w-4 h-4 object-contain" />
                      <span>+{it.count}x {it.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  startChamber(currentFloor + 1);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>▶ Continuar al Abismo (Sala {currentFloor + 1})</span>
              </button>

              <button
                onClick={handleRetreatAndClaim}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
              >
                Cobrar Botín y Volver a la Aldea
              </button>

              <button
                onClick={handleRestartBattle}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Reiniciar desde Sala 1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DEFEAT MODAL                                                           */}
      {/* ========================================================================= */}
      {heroHp <= 0 && battleState !== 'victory' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-[340px] bg-[#1a0604] border-2 border-red-700 rounded-2xl p-5 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex flex-col items-center text-center animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-serif font-black text-red-400 tracking-wider mb-1">
              {selectedCombatMissionId === 'm3_bosque'
                ? 'EMBOSCADA FALLIDA'
                : selectedCombatMissionId === 'm2_robo'
                ? 'ASALTO FALLIDO'
                : 'EXPEDICIÓN FINALIZADA'}
            </h3>
            <p className="text-xs text-stone-300 mb-1">
              {selectedCombatMissionId === 'm3_bosque' ? (
                <>Has caído ante los goblins en la <b className="text-amber-300">Oleada {currentFloor} de 2</b>.</>
              ) : selectedCombatMissionId === 'm2_robo' ? (
                <>Has caído ante la guardia en la <b className="text-amber-300">Oleada {currentFloor} de 4</b>.</>
              ) : (
                <>Has caído en combate en la <b className="text-amber-300">Sala {currentFloor}</b>.</>
              )}
            </p>
            {selectedCombatMissionId !== 'm2_robo' && selectedCombatMissionId !== 'm3_bosque' && (
              <div className="text-[10px] text-stone-400 font-mono mb-3">
                Récord alcanzado: <b className="text-amber-400 font-bold">Sala {bestFloor}</b>
              </div>
            )}

            {/* Accumulated Loot to bank */}
            <div className="w-full bg-black/60 border border-red-950 rounded-xl p-3 mb-4 flex flex-col gap-1.5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 text-center">
                {selectedCombatMissionId === 'm3_bosque'
                  ? 'Botín Rescatado del Bosque'
                  : selectedCombatMissionId === 'm2_robo'
                  ? 'Botín Rescatado'
                  : 'Botín Asegurado de la Expedición'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold text-stone-200">
                <div className="flex items-center gap-1.5 justify-center bg-stone-900/80 p-1.5 rounded border border-amber-950">
                  <span className="text-yellow-400">🪙 +{accumulatedLoot.gold.toLocaleString()}</span>
                  <span>Oro</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center bg-stone-900/80 p-1.5 rounded border border-amber-950">
                  <span className="text-cyan-400">💎 +{accumulatedLoot.crystals}</span>
                  <span>Cristales</span>
                </div>
              </div>
              {accumulatedLoot.items.length > 0 && (
                <div className="text-[10px] text-emerald-400 text-center font-mono mt-1">
                  +{accumulatedLoot.items.reduce((s, it) => s + it.count, 0)} materiales recolectados
                </div>
              )}
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleRetreatAndClaim}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg"
              >
                {selectedCombatMissionId === 'm2_robo' ? 'Escapar a la Aldea' : 'Cobrar Botín y Volver a la Aldea'}
              </button>

              <button
                onClick={handleRestartBattle}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                {selectedCombatMissionId === 'm2_robo' ? 'Reintentar Asalto (Oleada 1)' : 'Reintentar desde Sala 1'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. GACHA RPG TACTICAL EFFECT INSPECTOR MODAL                              */}
      {/* ========================================================================= */}
      {selectedConditionTooltip && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div
            className={`relative w-full max-w-[340px] p-5 rounded-2xl border-2 shadow-2xl flex flex-col items-center ${selectedConditionTooltip.bgColor} ${selectedConditionTooltip.borderColor}`}
            style={{ boxShadow: `0 0 35px ${selectedConditionTooltip.glowColor}` }}
          >
            <button
              onClick={() => setSelectedConditionTooltip(null)}
              className="absolute top-3 right-3 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{selectedConditionTooltip.icon}</span>
              <div className="flex flex-col text-left">
                <h3 className={`font-serif font-black text-lg ${selectedConditionTooltip.color}`}>
                  {selectedConditionTooltip.name}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">
                  {selectedConditionTooltip.isBuff
                    ? 'Mejora Táctica (Buff)'
                    : 'Alteración de Estado (Debuff)'}
                </span>
              </div>
            </div>

            {/* Badges for Stacks and Remaining Turns */}
            <div className="w-full flex items-center justify-center gap-2 my-2 py-1 px-3 bg-black/50 rounded-lg border border-white/10 font-mono text-xs">
              <span className="text-amber-300 font-bold">
                Duración: {selectedConditionTooltip.turnsRemaining} {selectedConditionTooltip.turnsRemaining === 1 ? 'Turno' : 'Turnos'}
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-white font-black bg-white/20 px-1.5 py-0.5 rounded">
                Acumulación: x{selectedConditionTooltip.stacks} / {selectedConditionTooltip.maxStacks}
              </span>
            </div>

            {/* Dynamic Combat Impact Box */}
            <div className="w-full p-2.5 bg-black/60 rounded-xl border border-white/10 text-left my-2 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" /> Efecto en Combate:
              </span>
              <p className="text-xs text-stone-100 font-semibold leading-relaxed">
                {(selectedConditionTooltip.type === 'poison' || selectedConditionTooltip.type === 'poisoned') &&
                  `Daño de veneno por turno (DoT): Inflige ${8 * selectedConditionTooltip.stacks} PV al inicio de cada ronda. Acumulable hasta 5 veces.`}
                {(selectedConditionTooltip.type === 'atk_down' || selectedConditionTooltip.type === 'frightened') &&
                  `Ataque debilitado: Reduce el daño de todos los ataques infligidos por el objetivo un ${Math.min(50, 25 + (selectedConditionTooltip.stacks - 1) * 10)}%.`}
                {(selectedConditionTooltip.type === 'def_break' || selectedConditionTooltip.type === 'prone') &&
                  `Ruptura de defensa: La coraza queda expuesta. Recibe +${Math.min(65, 35 + (selectedConditionTooltip.stacks - 1) * 15)}% de daño adicional de todas las cartas.`}
                {(selectedConditionTooltip.type === 'paralyze' || selectedConditionTooltip.type === 'paralyzed') &&
                  `¡Parálisis voltaica total! La unidad pierde su acción en el turno y los impactos que recibe son impactos CRÍTICOS garantizados.`}
                {(selectedConditionTooltip.type === 'stun' || selectedConditionTooltip.type === 'stunned') &&
                  `Aturdimiento completo (Hard CC): La unidad queda incapacitada y pierde su turno de acción.`}
                {(selectedConditionTooltip.type === 'blind' || selectedConditionTooltip.type === 'blinded') &&
                  `Ceguera de seda: 45% de probabilidad de que los ataques fallen por completo (indicador MISS).`}
                {(selectedConditionTooltip.type === 'atk_buff') &&
                  `Ataque potenciado: Multiplicador ofensivo de +${25 + (selectedConditionTooltip.stacks - 1) * 20}% al daño de todas las habilidades.`}
                {(selectedConditionTooltip.type === 'haste') &&
                  `Ímpetu táctico: +25% daño saliente y 25% de probabilidad de evasión completa ante ataques rivales.`}
                {(selectedConditionTooltip.type === 'regen' || selectedConditionTooltip.type === 'blessed') &&
                  `Regeneración vital sostenida (HoT): Restaura ${8 * selectedConditionTooltip.stacks} PV al iniciar cada fase de combate.`}
                {(selectedConditionTooltip.type === 'def_buff') &&
                  `Defensa rúnica: Mitiga el daño recibido de todos los ataques en un 30%.`}
              </p>
            </div>

            {/* Tactical Gacha Summary */}
            <div className="w-full p-2.5 bg-black/40 rounded-xl border border-white/5 text-left mb-3">
              <span className="text-[9px] font-bold uppercase text-stone-400 block mb-0.5">
                Mecánica Gacha Táctica:
              </span>
              <p className="text-[10px] text-stone-300 italic leading-snug">
                {GACHA_EFFECTS_CATALOG[selectedConditionTooltip.type]?.tacticalDesc ||
                  selectedConditionTooltip.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedConditionTooltip(null)}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 10. D&D 5E DAMAGE TYPES COMPENDIUM MODAL */}
      <DndDamageCodexModal
        isOpen={showDndCodex}
        onClose={() => setShowDndCodex(false)}
        initialType={selectedDndCodexType}
      />
    </div>
  );
};
