export type ClanRole = 'Gran Maestre' | 'Comandante' | 'Paladín' | 'Iniciado';

export interface ClanMember {
  playerId: string;
  gamerTag: string;
  avatarUrl: string;
  role: ClanRole;
  playGamesLevel: number;
  squadPower: number;
  contributionXp: number;
  isPlayer?: boolean;
  lastActive: string;
}

export interface ClanPerk {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  icon: string;
  bonusText: string;
  upgradeCostGold: number;
}

export interface ClanActivity {
  id: string;
  text: string;
  time: string;
  type: 'achievement' | 'donation' | 'join' | 'sync';
  icon: string;
}

export interface ClanData {
  id: string;
  name: string;
  tag: string;
  motto: string;
  emblem: string;
  buildingImage: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPower: number;
  trophies: number;
  minPlayGamesLevel: number;
  leaderGamerTag: string;
  members: ClanMember[];
  perks: ClanPerk[];
  activities: ClanActivity[];
  githubSyncedAt?: string;
}

export interface GitHubSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  gistId?: string;
  useGist: boolean;
  autoSync: boolean;
}

export interface GitHubSyncStatus {
  lastSyncTime: string | null;
  lastCommitSha: string | null;
  lastSyncStatus: 'success' | 'local' | 'error' | 'idle' | 'syncing';
  errorMessage: string | null;
  remoteUrl: string | null;
  authenticatedUser?: string | null;
  /** Número de órdenes conocidas en la última sincronización. */
  orderCount?: number;
  /** Origen de la última lectura: GitHub o la caché local del servidor. */
  source?: 'github' | 'local' | null;
}
