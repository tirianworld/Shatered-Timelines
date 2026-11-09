import { PlayGamesProfile, PlayGamesAchievement, PlayGamesLeaderboard, PlayGamesCloudSave } from '../types/playGames';
import { safeStorage } from '../utils/storage';
import { sound } from './soundService';

const PLAY_GAMES_PROFILE_KEY = 'cdd_play_games_profile_v1';
const PLAY_GAMES_ACHIEVEMENTS_KEY = 'cdd_play_games_achievements_v1';
const PLAY_GAMES_CLOUD_SAVE_KEY = 'cdd_play_games_cloud_save_v1';

export const INITIAL_ACHIEVEMENTS: PlayGamesAchievement[] = [
  {
    id: 'ach_first_summon',
    title: 'Primer Vínculo Astral',
    description: 'Invoca a tu primer héroe mediante la Puerta Astral.',
    xpReward: 500,
    icon: 'sparkles',
    unlocked: false,
    category: 'summon',
  },
  {
    id: 'ach_hero_collector',
    title: 'Comandante de Icespear',
    description: 'Recluta al menos 6 héroes diferentes en tu bastión.',
    xpReward: 1000,
    icon: 'shield',
    unlocked: false,
    progress: 4,
    maxProgress: 6,
    category: 'collection',
  },
  {
    id: 'ach_hero_master',
    title: 'Legión de las Cumbres',
    description: 'Reúne 12 o más héroes legendarios en tu compañía.',
    xpReward: 2500,
    icon: 'crown',
    unlocked: false,
    progress: 4,
    maxProgress: 12,
    category: 'collection',
  },
  {
    id: 'ach_rarity_ssr',
    title: 'Bendición de los Antiguos',
    description: 'Consigue o asciende a un héroe de rareza SSR o UR.',
    xpReward: 2000,
    icon: 'star',
    unlocked: false,
    category: 'summon',
  },
  {
    id: 'ach_level_10',
    title: 'Ascenso Marcial',
    description: 'Eleva a cualquier héroe al nivel 10 o superior.',
    xpReward: 1500,
    icon: 'swords',
    unlocked: false,
    category: 'progression',
  },
  {
    id: 'ach_level_25',
    title: 'Maestría Heroica',
    description: 'Eleva a un héroe al nivel 25 con bendiciones de experiencia.',
    xpReward: 3000,
    icon: 'flame',
    unlocked: false,
    category: 'progression',
  },
  {
    id: 'ach_patrol_done',
    title: 'Vigías de las Nieves',
    description: 'Completa con éxito tu primera misión de patrulla en la región.',
    xpReward: 1000,
    icon: 'eagle',
    unlocked: false,
    category: 'progression',
  },
  {
    id: 'ach_forge_master',
    title: 'Yunque y Fuego',
    description: 'Forja o mejora un arma o armadura en la Herrería de Icespear.',
    xpReward: 1200,
    icon: 'hammer',
    unlocked: false,
    category: 'forge',
  },
  {
    id: 'ach_first_victory',
    title: 'Bautismo de Sangre',
    description: 'Vence a una escuadra enemiga en el modo de combate táctico.',
    xpReward: 1500,
    icon: 'trophy',
    unlocked: false,
    category: 'combat',
  },
  {
    id: 'ach_wealthy',
    title: 'Bolsas Llenas',
    description: 'Acumula 25,000 monedas de oro en las arcas de tu bastión.',
    xpReward: 1500,
    icon: 'coins',
    unlocked: false,
    category: 'progression',
  },
  {
    id: 'ach_tycoon',
    title: 'Fortuna del Barón',
    description: 'Alcanza la exorbitante cifra de 75,000 monedas de oro.',
    xpReward: 3500,
    icon: 'gem',
    unlocked: false,
    category: 'progression',
  },
  {
    id: 'ach_cloud_save',
    title: 'Guardián Celestial',
    description: 'Sincroniza y resguarda tu progreso en la Nube de Google Play Games.',
    xpReward: 1000,
    icon: 'cloud',
    unlocked: false,
    category: 'progression',
  },
];

const INITIAL_PROFILE: PlayGamesProfile = {
  isSignedIn: false,
  playerId: 'G:0000000000',
  gamerTag: 'Aventurero#0001',
  avatarUrl: '/assets/portraits/edacorn icono.png',
  level: 1,
  currentXp: 0,
  xpToNextLevel: 1000,
  totalPlayGamesXp: 0,
  unlockedAchievementsCount: 0,
  totalAchievementsCount: INITIAL_ACHIEVEMENTS.length,
  lastLogin: Date.now(),
  isGoogleAccountLinked: false,
};

type AchievementCallback = (achievement: PlayGamesAchievement) => void;
type ProfileCallback = (profile: PlayGamesProfile) => void;

class PlayGamesService {
  private profile: PlayGamesProfile = INITIAL_PROFILE;
  private achievements: PlayGamesAchievement[] = INITIAL_ACHIEVEMENTS;
  private achievementListeners: Set<AchievementCallback> = new Set();
  private profileListeners: Set<ProfileCallback> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load saved profile
    try {
      const rawProfile = safeStorage.getItem(PLAY_GAMES_PROFILE_KEY);
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        this.profile = { ...INITIAL_PROFILE, ...parsed };
      }
    } catch {
      // Ignored
    }

    // Load saved achievements
    try {
      const rawAch = safeStorage.getItem(PLAY_GAMES_ACHIEVEMENTS_KEY);
      if (rawAch) {
        const parsedMap: Record<string, Partial<PlayGamesAchievement>> = JSON.parse(rawAch);
        this.achievements = INITIAL_ACHIEVEMENTS.map((ach) => ({
          ...ach,
          ...(parsedMap[ach.id] || {}),
        }));
      }
    } catch {
      // Ignored
    }

    this.recalculateProfileStats();
  }

  public getProfile(): PlayGamesProfile {
    return { ...this.profile };
  }

  public getAchievements(): PlayGamesAchievement[] {
    return [...this.achievements];
  }

  public subscribeToAchievements(cb: AchievementCallback): () => void {
    this.achievementListeners.add(cb);
    return () => {
      this.achievementListeners.delete(cb);
    };
  }

  public subscribeToProfile(cb: ProfileCallback): () => void {
    this.profileListeners.add(cb);
    return () => {
      this.profileListeners.delete(cb);
    };
  }

  private notifyProfile() {
    safeStorage.setItem(PLAY_GAMES_PROFILE_KEY, JSON.stringify(this.profile));
    this.profileListeners.forEach((cb) => {
      try {
        cb({ ...this.profile });
      } catch (e) {
        console.error(e);
      }
    });
  }

  private recalculateProfileStats() {
    const unlocked = this.achievements.filter((a) => a.unlocked);
    const totalXp = unlocked.reduce((acc, curr) => acc + curr.xpReward, 0);

    // 1000 XP per Play Games level
    const level = Math.max(1, Math.floor(totalXp / 1000) + 1);
    const currentLevelBase = (level - 1) * 1000;
    const currentXp = totalXp - currentLevelBase;
    const xpToNextLevel = 1000;

    this.profile.totalPlayGamesXp = totalXp;
    this.profile.level = level;
    this.profile.currentXp = currentXp;
    this.profile.xpToNextLevel = xpToNextLevel;
    this.profile.unlockedAchievementsCount = unlocked.length;
    this.profile.totalAchievementsCount = this.achievements.length;
  }

  /**
   * Signs in with Google Play Games account
   */
  public async signIn(customGamerTag?: string, email?: string, avatarUrl?: string): Promise<PlayGamesProfile> {
    const defaultTag = customGamerTag?.trim() || 'DarkLord#7729';
    const tag = defaultTag.includes('#') ? defaultTag : `${defaultTag}#${Math.floor(1000 + Math.random() * 9000)}`;

    this.profile = {
      ...this.profile,
      isSignedIn: true,
      playerId: `G:${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      gamerTag: tag,
      email: email || 'darklordsombrior@gmail.com',
      avatarUrl: avatarUrl || '/assets/portraits/edacorn icono.png',
      lastLogin: Date.now(),
      isGoogleAccountLinked: true,
    };

    this.recalculateProfileStats();
    this.notifyProfile();

    sound.playSFX('victory');

    // Notify backend
    try {
      await fetch('/api/play-games/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: this.profile.playerId,
          gamerTag: this.profile.gamerTag,
          email: this.profile.email,
        }),
      });
    } catch {
      // Local mode fallback
    }

    return { ...this.profile };
  }

  /**
   * Signs out from Google Play Games
   */
  public async signOut(): Promise<void> {
    this.profile.isSignedIn = false;
    this.profile.isGoogleAccountLinked = false;
    this.notifyProfile();
    sound.playSFX('click');

    try {
      await fetch('/api/play-games/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
  }

  /**
   * Unlocks an achievement by ID and fires the banner
   */
  public unlockAchievement(achievementId: string): boolean {
    const targetIdx = this.achievements.findIndex((a) => a.id === achievementId);
    if (targetIdx === -1) return false;

    const target = this.achievements[targetIdx];
    if (target.unlocked) return false;

    // Mark as unlocked
    const updatedTarget: PlayGamesAchievement = {
      ...target,
      unlocked: true,
      unlockedAt: Date.now(),
      progress: target.maxProgress,
    };

    this.achievements[targetIdx] = updatedTarget;

    // Persist achievements map
    const saveObj: Record<string, Partial<PlayGamesAchievement>> = {};
    this.achievements.forEach((a) => {
      if (a.unlocked || a.progress) {
        saveObj[a.id] = {
          unlocked: a.unlocked,
          unlockedAt: a.unlockedAt,
          progress: a.progress,
        };
      }
    });
    safeStorage.setItem(PLAY_GAMES_ACHIEVEMENTS_KEY, JSON.stringify(saveObj));

    this.recalculateProfileStats();
    this.notifyProfile();

    // Sound effect
    sound.playSFX('coin');

    // Notify listeners (Banner Toast)
    this.achievementListeners.forEach((cb) => {
      try {
        cb(updatedTarget);
      } catch (e) {
        console.error(e);
      }
    });

    // Notify backend
    fetch('/api/play-games/unlock-achievement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: this.profile.playerId,
        achievementId,
        xpReward: updatedTarget.xpReward,
      }),
    }).catch(() => {});

    return true;
  }

  /**
   * Updates incremental progress of an achievement
   */
  public updateProgress(achievementId: string, current: number): void {
    const targetIdx = this.achievements.findIndex((a) => a.id === achievementId);
    if (targetIdx === -1) return;

    const target = this.achievements[targetIdx];
    if (target.unlocked) return;

    target.progress = current;
    if (target.maxProgress && current >= target.maxProgress) {
      this.unlockAchievement(achievementId);
    }
  }

  /**
   * Upload cloud save to Google Play Games
   */
  public async saveCloudSave(save: PlayGamesCloudSave): Promise<boolean> {
    try {
      safeStorage.setItem(PLAY_GAMES_CLOUD_SAVE_KEY, JSON.stringify(save));

      // Unlock cloud save achievement!
      this.unlockAchievement('ach_cloud_save');

      // Upload to server endpoint
      await fetch('/api/play-games/cloud-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: this.profile.playerId,
          gamerTag: this.profile.gamerTag,
          save,
        }),
      });

      sound.playSFX('victory');
      return true;
    } catch (e) {
      console.error('Error saving to Play Games cloud:', e);
      return false;
    }
  }

  /**
   * Retrieve cloud save from Google Play Games
   */
  public async loadCloudSave(): Promise<PlayGamesCloudSave | null> {
    try {
      // Attempt server first
      const res = await fetch(`/api/play-games/cloud-save?playerId=${encodeURIComponent(this.profile.playerId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.save) {
          return data.save;
        }
      }
    } catch {
      // Fallback to local
    }

    try {
      const raw = safeStorage.getItem(PLAY_GAMES_CLOUD_SAVE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignored
    }

    return null;
  }

  /**
   * Submit score to Leaderboard
   */
  public async submitScore(leaderboardId: string, score: number, formattedScore: string): Promise<void> {
    try {
      await fetch('/api/play-games/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboardId,
          playerId: this.profile.playerId,
          gamerTag: this.profile.gamerTag,
          avatarUrl: this.profile.avatarUrl,
          score,
          formattedScore,
        }),
      });
    } catch {
      // Handled locally
    }
  }

  /**
   * Fetch Leaderboard entries
   */
  public async getLeaderboard(leaderboardId: string): Promise<PlayGamesLeaderboard | null> {
    try {
      const res = await fetch(`/api/play-games/leaderboard?id=${encodeURIComponent(leaderboardId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.leaderboard;
      }
    } catch {
      // Fallback default
    }

    // Default mock data when offline
    return this.getMockLeaderboard(leaderboardId);
  }

  private getMockLeaderboard(id: string): PlayGamesLeaderboard {
    const isPower = id === 'lb_power';
    const isWealth = id === 'lb_wealth';

    const playerEntry = {
      rank: 1,
      playerId: this.profile.playerId,
      gamerTag: this.profile.gamerTag || 'Jugador',
      avatarUrl: this.profile.avatarUrl,
      score: isPower ? 14500 : isWealth ? 42000 : 3500,
      formattedScore: isPower ? '14,500 Poder' : isWealth ? '42,000 Oro' : '3,500 XP',
      isCurrentPlayer: true,
      badge: 'Tú',
      date: 'Hoy',
    };

    const entries = this.profile.isSignedIn || this.profile.gamerTag ? [playerEntry] : [];

    return {
      id,
      name: isPower ? 'Poder de Escuadrón' : isWealth ? 'Riqueza Acumulada' : 'XP de Google Play',
      description: isPower
        ? 'Jugadores con la mayor fuerza combinada en su escuadrón activo.'
        : isWealth
        ? 'Los comandantes con mayor fortuna de oro acumulada.'
        : 'Mayor cantidad de experiencia de logros de Google Play Games.',
      unit: isPower ? 'Poder' : isWealth ? 'Oro' : 'XP',
      icon: isPower ? 'swords' : isWealth ? 'coins' : 'trophy',
      entries,
    };
  }
}

export const playGames = new PlayGamesService();
