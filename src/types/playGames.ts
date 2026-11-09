export interface PlayGamesProfile {
  isSignedIn: boolean;
  playerId: string;
  gamerTag: string;
  email?: string;
  avatarUrl: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalPlayGamesXp: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  lastLogin: number;
  isGoogleAccountLinked?: boolean;
}

export interface PlayGamesAchievement {
  id: string;
  title: string;
  description: string;
  xpReward: number; // Google Play Games XP (e.g. 500, 1000, 2500)
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  category: 'summon' | 'combat' | 'collection' | 'forge' | 'progression';
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
  data: string; // JSON serialized state
}
