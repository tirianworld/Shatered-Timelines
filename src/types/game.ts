export type HeroRarity = 'R' | 'SR' | 'SSR' | 'UR';

export type HeroAttribute = 'Divino' | 'Profano' | 'Natural' | 'Arcano' | 'Fuego' | 'Hielo';

export type HeroClass =
  | 'Guerrero'
  | 'Paladín'
  | 'Bárbaro'
  | 'Clérigo'
  | 'Mago'
  | 'Hechicero'
  | 'Nigromante'
  | 'Monje'
  | 'Pícaro'
  | 'Cazador'
  | 'Caballero'
  | 'Bardo'
  | 'Cazador de Sangre'
  | 'Gunslinger';

export type Alianza =
  | 'Guardia de Icespear'
  | 'Mercado Negro'
  | 'Orden Astral'
  | 'Hermandad del Manantial'
  | 'Casa Loux'
  | 'Nómadas del Páramo';

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number; // in turns
  currentCooldown?: number;
  damageMultiplier: number;
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  healMultiplier?: number;
  icon?: string;
  effectType?: 'damage' | 'heal' | 'buff_atk' | 'buff_def' | 'stun';
  dndDamageType?: import('./dndCombatDamage').DndDamageType;
}

export interface HeroStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number; // 0.05 = 5%
  critDamage: number; // 1.5 = 150%
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'ring' | 'helmet';
  rarity: HeroRarity;
  stats: Partial<HeroStats>;
  level: number;
  icon: string;
  description: string;
  dndDamageType?: import('./dndCombatDamage').DndDamageType;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  rarity: HeroRarity;
  heroClass: HeroClass;
  attribute: HeroAttribute;
  alliance: Alianza;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  stars: number;
  stats: HeroStats;
  skills: HeroSkill[];
  portrait: string; // url/path
  backgroundArt?: string;
  quote: string;
  bio: string;
  equipped: {
    weapon?: EquipmentItem;
    armor?: EquipmentItem;
    helmet?: EquipmentItem;
    ring?: EquipmentItem;
    accessory?: EquipmentItem;
  };
  inPatrol?: boolean;
}


/** Arma rara que puede salir en una tirada de gacha como relleno. */
export interface GachaWeapon {
  id: string;
  name: string;
  icon: string;
  rarity: HeroRarity;
}

/** Entrada de una tirada, en el orden en que se revela. */
export type GachaEntry = { kind: 'hero'; hero: Hero } | { kind: 'weapon'; weapon: GachaWeapon };

export interface SummonBanner {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  featuredHeroIds: string[];
  costSingle: number;
  costMulti: number;
  bannerImage: string;
  dropRates: {
    UR: number;
    SSR: number;
    SR: number;
    R: number;
  };
}

export interface PatrolMission {
  id: string;
  name: string;
  region: string;
  durationSeconds: number;
  description: string;
  bgImage: string;
  recommendedPower: number;
  rewards: {
    gold: number;
    xp: number;
    crystals: number;
    materials?: string[];
  };
  activeHeroes?: string[];
  startTime?: number; // timestamp
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'currency' | 'material' | 'consumable' | 'recipe';
  rarity: HeroRarity;
  count: number;
  icon: string;
  description: string;
  usable?: boolean;
  effect?: {
    goldAmount?: number;
    xpAmount?: number;
    healPercent?: number;
  };
}

export interface CombatUnit {
  uid: string;
  id: string;
  name: string;
  isEnemy: boolean;
  position: number; // 0 to 3
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  portrait: string;
  skills: HeroSkill[];
  attribute: HeroAttribute;
  isDead: boolean;
  statusEffects: {
    type: 'stun' | 'buff_atk' | 'buff_def';
    turnsRemaining: number;
  }[];
}

export interface CombatLogEntry {
  id: string;
  text: string;
  type: 'damage' | 'heal' | 'defeat' | 'buff' | 'info';
}
