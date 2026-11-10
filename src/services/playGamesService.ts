import {
  PlayGamesProfile,
  PlayGamesAchievement,
  PlayGamesLeaderboard,
  PlayGamesCloudSave,
} from '../types/playGames';
import { safeStorage } from '../utils/storage';
import { sound } from './soundService';
import { apiUrl } from '../utils/api';

/**
 * Google Play Games Services real (API v1, https://games.googleapis.com/games/v1).
 *
 * Google no ofrece SDK web de Play Games: la autenticación la hace el cliente Android/nativo
 * con GamesSignInClient y entrega al servidor un *server auth code*. Este servicio habla con
 * los endpoints del servidor (`/api/play-games/*`), que canjean ese código y llaman a la API
 * oficial con el token resultante. Sin configuración o sin sesión no se inventa ningún dato:
 * la identidad es la local y los logros se marcan como "local".
 */

const ACHIEVEMENTS_KEY = 'cdd_play_games_achievements_v2';
const PROFILE_KEY = 'cdd_play_games_profile_v2';
const LOCAL_BACKUP_KEY = 'cdd_local_backup_v1';

/** Identidad local histórica del jugador en la sede (no es una cuenta de Play Games). */
const GUEST_PLAYER_ID = 'G:0000000000';

interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: PlayGamesAchievement['category'];
  maxProgress?: number;
  initialProgress?: number;
}

export const ACHIEVEMENT_CATALOG: CatalogEntry[] = [
  { id: 'ach_first_summon', title: 'Primer Vínculo Astral', description: 'Invoca a tu primer héroe mediante la Puerta Astral.', icon: 'sparkles', category: 'summon' },
  { id: 'ach_hero_collector', title: 'Comandante de Icespear', description: 'Recluta al menos 6 héroes diferentes en tu bastión.', icon: 'shield', category: 'collection', maxProgress: 6, initialProgress: 0 },
  { id: 'ach_hero_master', title: 'Legión de las Cumbres', description: 'Reúne 12 o más héroes legendarios en tu compañía.', icon: 'crown', category: 'collection', maxProgress: 12, initialProgress: 0 },
  { id: 'ach_rarity_ssr', title: 'Bendición de los Antiguos', description: 'Consigue o asciende a un héroe de rareza SSR o UR.', icon: 'star', category: 'summon' },
  { id: 'ach_level_10', title: 'Ascenso Marcial', description: 'Eleva a cualquier héroe al nivel 10 o superior.', icon: 'swords', category: 'progression' },
  { id: 'ach_level_25', title: 'Maestría Heroica', description: 'Eleva a un héroe al nivel 25 con bendiciones de experiencia.', icon: 'flame', category: 'progression' },
  { id: 'ach_patrol_done', title: 'Vigías de las Nieves', description: 'Completa con éxito tu primera misión de patrulla en la región.', icon: 'eagle', category: 'progression' },
  { id: 'ach_forge_master', title: 'Yunque y Fuego', description: 'Forja o mejora un arma o armadura en la Herrería de Icespear.', icon: 'hammer', category: 'forge' },
  { id: 'ach_first_victory', title: 'Bautismo de Sangre', description: 'Vence a una escuadra enemiga en el modo de combate táctico.', icon: 'trophy', category: 'combat' },
  { id: 'ach_wealthy', title: 'Bolsas Llenas', description: 'Acumula 25,000 monedas de oro en las arcas de tu bastión.', icon: 'coins', category: 'progression' },
  { id: 'ach_tycoon', title: 'Fortuna del Barón', description: 'Alcanza la exorbitante cifra de 75,000 monedas de oro.', icon: 'gem', category: 'progression' },
  { id: 'ach_cloud_save', title: 'Guardián Celestial', description: 'Guarda una copia de tu progreso en el bastión local.', icon: 'cloud', category: 'progression' },
];

const buildCatalog = (): PlayGamesAchievement[] =>
  ACHIEVEMENT_CATALOG.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    icon: entry.icon,
    category: entry.category,
    unlocked: false,
    progress: entry.initialProgress ?? 0,
    maxProgress: entry.maxProgress,
    syncState: 'local',
  }));

const guestProfile = (): PlayGamesProfile => ({
  isSignedIn: false,
  isConfigured: false,
  isGuest: true,
  playerId: GUEST_PLAYER_ID,
  gamerTag: 'Invitado local',
  avatarUrl: '/assets/portraits/edacorn icono.png',
  unlockedAchievementsCount: 0,
  totalAchievementsCount: ACHIEVEMENT_CATALOG.length,
  lastLogin: Date.now(),
  error: null,
});

type AchievementCallback = (achievement: PlayGamesAchievement) => void;
type ProfileCallback = (profile: PlayGamesProfile) => void;

class PlayGamesService {
  private profile: PlayGamesProfile = guestProfile();
  private achievements: PlayGamesAchievement[] = buildCatalog();
  private achievementListeners: Set<AchievementCallback> = new Set();
  private profileListeners: Set<ProfileCallback> = new Set();
  private sessionId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const rawProfile = safeStorage.getItem(PROFILE_KEY);
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile) as Partial<PlayGamesProfile>;
        // Nunca se restaura una sesión de Play Games desde disco: el token vive en memoria.
        this.profile = {
          ...guestProfile(),
          gamerTag: parsed.gamerTag || 'Invitado local',
          avatarUrl: parsed.avatarUrl || '/assets/portraits/edacorn icono.png',
        };
      }
    } catch {
      // Ignorado: se usa el perfil invitado
    }

    try {
      const rawAchievements = safeStorage.getItem(ACHIEVEMENTS_KEY);
      if (rawAchievements) {
        const saved: Record<string, Partial<PlayGamesAchievement>> = JSON.parse(rawAchievements);
        this.achievements = buildCatalog().map((ach) => ({
          ...ach,
          ...(saved[ach.id] || {}),
          syncState: saved[ach.id]?.unlocked ? 'local' : ach.syncState,
        }));
      }
    } catch {
      // Ignorado: catálogo por defecto
    }

    this.recalculateProfileStats();
    void this.refreshStatus();
  }

  public getProfile(): PlayGamesProfile {
    return { ...this.profile };
  }

  public getAchievements(): PlayGamesAchievement[] {
    return this.achievements.map((a) => ({ ...a }));
  }

  public subscribeToAchievements(cb: AchievementCallback): () => void {
    this.achievementListeners.add(cb);
    return () => {
      this.achievementListeners.delete(cb);
    };
  }

  public subscribeToProfile(cb: ProfileCallback): () => void {
    this.profileListeners.add(cb);
    cb(this.getProfile());
    return () => {
      this.profileListeners.delete(cb);
    };
  }

  private notifyProfile() {
    try {
      safeStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ gamerTag: this.profile.gamerTag, avatarUrl: this.profile.avatarUrl })
      );
    } catch {
      // Ignorado
    }
    this.profileListeners.forEach((cb) => {
      try {
        cb(this.getProfile());
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyAchievements() {
    try {
      const saveObj: Record<string, Partial<PlayGamesAchievement>> = {};
      this.achievements.forEach((a) => {
        saveObj[a.id] = { unlocked: a.unlocked, unlockedAt: a.unlockedAt, progress: a.progress };
      });
      safeStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(saveObj));
    } catch {
      // Ignorado
    }
    this.recalculateProfileStats();
    this.notifyProfile();
  }

  private recalculateProfileStats() {
    const unlocked = this.achievements.filter((a) => a.unlocked);
    this.profile.unlockedAchievementsCount = unlocked.length;
    this.profile.totalAchievementsCount = this.achievements.length;
  }

  private headers(json = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (this.sessionId) headers['x-play-session'] = this.sessionId;
    return headers;
  }

  /** Consulta si el servidor tiene credenciales de Play Games configuradas. */
  public async refreshStatus(): Promise<{ configured: boolean; message: string }> {
    try {
      const res = await fetch(apiUrl('/api/play-games/status'), { cache: 'no-store' });
      const data = await res.json();
      const configured = Boolean(data?.configured);
      this.profile.isConfigured = configured;
      this.profile.error = configured ? null : data?.message || null;
      this.notifyProfile();
      return { configured, message: data?.message || '' };
    } catch (err: any) {
      this.profile.error = 'No se pudo consultar el estado de Play Games en el servidor.';
      this.notifyProfile();
      return { configured: false, message: this.profile.error };
    }
  }

  /**
   * Conecta con una sesión real de Play Games usando el *server auth code* que entrega
   * el cliente Android/nativo tras el inicio de sesión con GamesSignInClient.
   */
  public async connect(serverAuthCode: string): Promise<{ success: boolean; message: string }> {
    const code = serverAuthCode.trim();
    if (!code) return { success: false, message: 'Introduce el código de autorización del servidor.' };

    try {
      const res = await fetch(apiUrl('/api/play-games/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverAuthCode: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || `El servidor respondió ${res.status}` };
      }

      this.sessionId = data.sessionId || null;
      this.profile = {
        ...guestProfile(),
        isConfigured: true,
        isSignedIn: true,
        isGuest: false,
        playerId: data.player?.playerId || GUEST_PLAYER_ID,
        gamerTag: data.player?.displayName || 'Jugador de Play Games',
        avatarUrl: data.player?.avatarImageUrl || '/assets/portraits/edacorn icono.png',
        title: data.player?.title || undefined,
        lastLogin: Date.now(),
        error: null,
      };
      this.recalculateProfileStats();
      this.notifyProfile();
      sound.playSFX('victory');
      void this.syncAchievementsWithPlayGames();
      return { success: true, message: `Conectado como ${this.profile.gamerTag}.` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error de red al conectar con Play Games.' };
    }
  }

  public async signOut(): Promise<void> {
    try {
      if (this.sessionId) {
        await fetch(apiUrl('/api/play-games/session'), {
          method: 'DELETE',
          headers: this.headers(),
        });
      }
    } catch {
      // Ignorado: la sesión local se cierra igualmente
    }
    this.sessionId = null;
    this.profile = { ...guestProfile(), isConfigured: this.profile.isConfigured };
    this.achievements = this.achievements.map((a) => ({ ...a, syncState: 'local' }));
    this.notifyAchievements();
    sound.playSFX('click');
  }

  /** Descarga el estado real de logros del jugador desde Play Games. */
  private async syncAchievementsWithPlayGames(): Promise<void> {
    try {
      const res = await fetch(apiUrl('/api/play-games/achievements'), { headers: this.headers(), cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const remote: Array<{ id: string; achievementState?: string; currentSteps?: number; unlockedAt?: string }> =
        Array.isArray(data?.playerAchievements) ? data.playerAchievements : [];

      if (!remote.length) return;
      this.achievements = this.achievements.map((ach) => {
        const match = remote.find((r) => r.id === ach.id);
        if (!match) return ach;
        const unlocked = match.achievementState === 'UNLOCKED' || match.achievementState === 'HIDDEN';
        return {
          ...ach,
          unlocked: ach.unlocked || unlocked,
          progress: typeof match.currentSteps === 'number' ? Math.max(ach.progress || 0, match.currentSteps) : ach.progress,
          syncState: unlocked ? 'synced' : 'local',
        };
      });
      this.notifyAchievements();
    } catch {
      // Sin conexión: se mantiene el estado local
    }
  }

  public unlockAchievement(achievementId: string): boolean {
    const targetIdx = this.achievements.findIndex((a) => a.id === achievementId);
    if (targetIdx === -1) return false;

    const target = this.achievements[targetIdx];
    if (target.unlocked) return false;

    const updated: PlayGamesAchievement = {
      ...target,
      unlocked: true,
      unlockedAt: Date.now(),
      progress: target.maxProgress ?? target.progress,
      syncState: this.sessionId ? 'pending' : 'local',
    };
    this.achievements[targetIdx] = updated;
    this.notifyAchievements();
    sound.playSFX('coin');
    this.achievementListeners.forEach((cb) => {
      try {
        cb({ ...updated });
      } catch (err) {
        console.error(err);
      }
    });

    if (this.sessionId) void this.pushAchievement(updated);
    return true;
  }

  private async pushAchievement(achievement: PlayGamesAchievement): Promise<void> {
    try {
      const res = await fetch(apiUrl(`/api/play-games/achievements/${encodeURIComponent(achievement.id)}/unlock`), {
        method: 'POST',
        headers: this.headers(true),
      });
      const data = await res.json().catch(() => ({}));
      this.markAchievementSync(achievement.id, res.ok ? 'synced' : 'error', res.ok ? undefined : data?.message);
    } catch (err: any) {
      this.markAchievementSync(achievement.id, 'error', err?.message);
    }
  }

  private markAchievementSync(id: string, state: PlayGamesAchievement['syncState'], message?: string) {
    this.achievements = this.achievements.map((a) =>
      a.id === id ? { ...a, syncState: state, syncMessage: message } : a
    );
    this.notifyAchievements();
  }

  public updateProgress(achievementId: string, current: number): void {
    const idx = this.achievements.findIndex((a) => a.id === achievementId);
    if (idx === -1) return;

    const target = this.achievements[idx];
    if (target.unlocked) return;

    this.achievements[idx] = { ...target, progress: current };
    if (target.maxProgress && current >= target.maxProgress) {
      this.unlockAchievement(achievementId);
      return;
    }

    if (this.sessionId) {
      fetch(apiUrl(`/api/play-games/achievements/${encodeURIComponent(achievementId)}/increment`), {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify({ steps: Math.max(1, Math.round(current - (target.progress || 0))) }),
      }).catch(() => undefined);
    }
    this.notifyAchievements();
  }

  /** Envía una puntuación al marcador real de Play Games. */
  public async submitScore(leaderboardId: string, score: number): Promise<{ success: boolean; message: string }> {
    if (!this.sessionId) {
      return { success: false, message: 'Conecta con Play Games para enviar puntuaciones al marcador oficial.' };
    }
    try {
      const res = await fetch(apiUrl(`/api/play-games/leaderboards/${encodeURIComponent(leaderboardId)}/scores`), {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify({ score: Math.max(0, Math.round(score)) }),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok && data?.success !== false,
        message: data?.message || (res.ok ? 'Puntuación enviada a Play Games.' : `El servidor respondió ${res.status}`),
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error de red al enviar la puntuación.' };
    }
  }

  /** Lee el marcador real de Play Games (top público, all-time). */
  public async getLeaderboard(leaderboardId: string): Promise<PlayGamesLeaderboard | null> {
    try {
      const res = await fetch(apiUrl(`/api/play-games/leaderboards/${encodeURIComponent(leaderboardId)}`), {
        headers: this.headers(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.leaderboard) return null;
      return data.leaderboard as PlayGamesLeaderboard;
    } catch {
      return null;
    }
  }

  /** Copia de seguridad local del navegador (no es Google Play Games). */
  public async saveLocalBackup(save: PlayGamesCloudSave): Promise<boolean> {
    try {
      safeStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(save));
      this.unlockAchievement('ach_cloud_save');
      sound.playSFX('victory');
      return true;
    } catch {
      return false;
    }
  }

  public async loadLocalBackup(): Promise<PlayGamesCloudSave | null> {
    try {
      const raw = safeStorage.getItem(LOCAL_BACKUP_KEY);
      return raw ? (JSON.parse(raw) as PlayGamesCloudSave) : null;
    } catch {
      return null;
    }
  }
}

export const playGames = new PlayGamesService();
