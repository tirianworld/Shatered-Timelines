/** Estado real de la conexión con Google Play Games Services (API v1). */
export interface PlayGamesProfile {
  /** Sesión validada contra games.googleapis.com. */
  isSignedIn: boolean;
  /** El servidor tiene configurado el cliente OAuth de Play Games. */
  isConfigured: boolean;
  /** Identidad local (sin cuenta de Play Games). */
  isGuest: boolean;
  playerId: string;
  gamerTag: string;
  avatarUrl: string;
  /** Título/nivel que devuelve Play Games (p. ej. "Nivel 12"). */
  title?: string;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  lastLogin: number;
  error?: string | null;
}

export type AchievementSyncState = 'local' | 'pending' | 'synced' | 'error';

export interface PlayGamesAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  category: 'summon' | 'combat' | 'collection' | 'forge' | 'progression';
  syncState: AchievementSyncState;
  syncMessage?: string;
}

export interface PlayGamesLeaderboardEntry {
  rank: number;
  playerId: string;
  gamerTag: string;
  avatarUrl: string;
  score: number;
  formattedScore: string;
  isCurrentPlayer?: boolean;
  badge?: string;
  date: string;
}

export interface PlayGamesLeaderboard {
  id: string;
  name: string;
  description: string;
  unit: string;
  icon: string;
  entries: PlayGamesLeaderboardEntry[];
}

export interface PlayGamesCloudSave {
  slotId: string;
  title: string;
  timestamp: number;
  playerName: string;
  heroCount: number;
  gold: number;
  crystals: number;
  astralShards: number;
  chapter: number;
  squadPower: number;
  data: string;
}
