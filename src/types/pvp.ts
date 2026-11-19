/**
 * Tipos compartidos del PvP de los Pozos de Pelea.
 *
 * El coliseo funciona con el MISMO combate de la campaña: vida compartida del escuadrón,
 * mano de 4 cartas de habilidad por héroe (arte, nombre y niveles de las cartas de
 * historia), 5 orbes dorados y definitiva al llenarlos. En tu turno juegas una carta de tu
 * héroe activo; cambiar de héroe es gratis una vez por turno y roba su mano.
 *
 * El servidor es la fuente de verdad (reparte manos, valida turno y orbes) y manda el mismo
 * estado a los dos clientes: cada uno se pinta como héroe y al rival como enemigo.
 */

/** Estado que aplica una carta, tal cual viene en la definición de la campaña. */
export interface PvpStatusSeed {
  type: string;
  duration: number;
  stacks: number;
  target: 'enemy' | 'hero';
}

export interface PvpStatusView {
  id: string;
  type: string;
  label: string;
  icon: string;
  turns: number;
  stacks: number;
  hostile: boolean;
  kind: string;
}

export interface PvpCardSeed {
  skillId: string;
  tier: 1 | 2 | 3;
  name: string;
  effects?: PvpStatusSeed[];
  /** Daño y curación en la escala de las misiones (0-100 sobre la vida del escuadrón). */
  damage: number;
  heal: number;
}

export interface PvpCard extends PvpCardSeed {
  uid: string;
}

export interface PvpHeroInput {
  heroId: string;
  heroName: string;
  spriteUrl: string;
  attackSpriteUrl?: string;
  portraitUrl: string;
  cards: PvpCardSeed[];
}

export interface PvpFighterPayload {
  playerId: string;
  name: string;
  rating: number;
  heroes: PvpHeroInput[];
  botPool?: PvpHeroInput[];
}

export interface PvpHeroView {
  heroId: string;
  heroName: string;
  spriteUrl: string;
  attackSpriteUrl?: string;
  portraitUrl: string;
  hand: PvpCard[];
}

export interface PvpFighterView {
  seat: 0 | 1;
  playerId: string;
  name: string;
  isBot: boolean;
  rating: number;
  heroes: PvpHeroView[];
  hp: number;
  maxHp: number;
  /** Orbes de definitiva (0-5). */
  orbs: number;
  maxOrbs: number;
  activeIndex: number;
  swapped: boolean;
  guard: boolean;
  connected: boolean;
  /** Estados activos: aturdimiento, veneno, ruptura de defensa, buffs… */
  statuses: PvpStatusView[];
}

export type PvpLogKind = 'damage' | 'heal' | 'guard' | 'ultimate' | 'crit' | 'switch' | 'system';

export interface PvpLogEntry {
  id: string;
  seat: 0 | 1;
  text: string;
  kind: PvpLogKind;
}

export interface PvpLastAction {
  seat: 0 | 1;
  heroName: string;
  cardName: string;
  /** Qué hizo el turno: jugar carta, fusionar, reordenar o cambiar de héroe. */
  kind?: 'card' | 'merge' | 'move' | 'switch';
  /** Habilidad jugada, para pintar su VFX y su pose de casteo. */
  skillId?: string;
  tier?: 1 | 2 | 3;
  damage?: number;
  heal?: number;
  crit?: boolean;
  ultimate?: boolean;
  switched?: boolean;
  /** Nombres de los estados que aplicó la carta. */
  status?: string[];
  /** La carta falló por ceguera. */
  missed?: boolean;
  at: number;
}

export interface PvpRoomView {
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  turnSeat: 0 | 1;
  deadline: number;
  fighters: [PvpFighterView, PvpFighterView];
  log: PvpLogEntry[];
  lastAction: PvpLastAction | null;
  winnerSeat?: 0 | 1;
  reason?: string;
  ratingDelta: Record<0 | 1, number>;
  opponentRating: Record<0 | 1, number>;
  turnMs: number;
}

export type PvpAction =
  | { type: 'card'; uid: string }
  | { type: 'switch'; heroIndex: number }
  /** Arrastrar una carta sobre otra: fusiona si son iguales, si no cambia de sitio. */
  | { type: 'merge'; uid: string; targetUid: string };

export interface PvpRankTier {
  id: string;
  name: string;
  icon: string;
  min: number;
  reward: number;
  color: string;
}

/** Escalera de rangos: cada tramo paga oro la primera vez que se alcanza. */
export const PVP_RANKS: PvpRankTier[] = [
  { id: 'hierro', name: 'Hierro', icon: '🛡️', min: 0, reward: 150, color: '#9ca3af' },
  { id: 'bronce', name: 'Bronce', icon: '🥉', min: 300, reward: 300, color: '#b45309' },
  { id: 'plata', name: 'Plata', icon: '🥈', min: 700, reward: 600, color: '#cbd5e1' },
  { id: 'oro', name: 'Oro', icon: '🥇', min: 1100, reward: 900, color: '#fbbf24' },
  { id: 'platino', name: 'Platino', icon: '💠', min: 1500, reward: 1400, color: '#67e8f9' },
  { id: 'diamante', name: 'Diamante', icon: '💎', min: 1900, reward: 2000, color: '#a5b4fc' },
  { id: 'leyenda', name: 'Leyenda', icon: '🏆', min: 2400, reward: 3000, color: '#f472b6' },
];

export interface PvpRankState {
  tier: PvpRankTier;
  next: PvpRankTier | null;
  progress: number; // 0..1 hacia el siguiente rango
}

export const rankFor = (rating: number): PvpRankState => {
  const safe = Math.max(0, Math.round(rating || 0));
  let index = 0;
  for (let i = 0; i < PVP_RANKS.length; i += 1) {
    if (safe >= PVP_RANKS[i].min) index = i;
  }
  const tier = PVP_RANKS[index];
  const next = PVP_RANKS[index + 1] ?? null;
  const span = next ? next.min - tier.min : 1;
  const progress = next ? Math.max(0, Math.min(1, (safe - tier.min) / span)) : 1;
  return { tier, next, progress };
};

/** Orbes necesarios para la definitiva y cartas en mano, igual que en las misiones. */
export const PVP_MAX_ORBS = 5;
export const PVP_HAND_SIZE = 4;
export const PVP_ULTIMATE_SKILL_ID = 'cataclismo_astral';

export const PVP_ATTRIBUTE_ICON: Record<string, string> = {
  Fuego: '🔥',
  Hielo: '❄️',
  Divino: '✨',
  Profano: '🌑',
  Natural: '🌿',
  Arcano: '🔮',
};
