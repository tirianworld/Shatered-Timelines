import { ClanData, ClanMember, ClanPerk, GitHubSyncStatus } from '../types/clan';
import { safeStorage } from '../utils/storage';
import { playGames } from './playGamesService';
import { sound } from './soundService';
import { githubClanService } from './githubClanService';

const CLAN_STORAGE_KEY = 'cdd_clan_system_no_emojis_v2';
const SAVE_DEBOUNCE_MS = 600;

export const DEFAULT_CLANS: ClanData[] = [];

type ClanListener = (clan: ClanData | null) => void;

const sortOrders = (a: ClanData, b: ClanData) =>
  b.trophies - a.trophies || b.totalPower - a.totalPower || a.name.localeCompare(b.name);

/** Nivel mostrado en la Orden: se toma del título de Play Games cuando existe. */
const playerLevel = (): number => {
  const title = playGames.getProfile().title || '';
  const match = title.match(/\d+/);
  return match ? Math.max(1, Number(match[0])) : 1;
};

const withDerivedTotals = (clan: ClanData): ClanData => {
  const members = (clan.members || []).map((m) => ({ ...m }));
  return { ...clan, members, totalPower: members.reduce((sum, m) => sum + (m.squadPower || 0), 0) };
};

/**
 * Sede de la Orden: mantiene el estado local (caché inmediata) y lo sincroniza con la
 * base de órdenes que vive en GitHub a través del servidor. El servidor es la fuente
 * de verdad de la lista de jugadores; aquí se aplica de forma optimista para que la
 * interfaz responda al instante incluso con mala conexión.
 */
class ClanService {
  private currentClan: ClanData | null = null;
  private allClans: ClanData[] = [];
  private listeners: Set<ClanListener> = new Set();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSave: ClanData | null = null;

  constructor() {
    this.loadState();
    void this.refreshFromCloud();
  }

  private loadState() {
    try {
      const raw = safeStorage.getItem(CLAN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.currentClan = parsed.currentClan ? this.markPlayer(parsed.currentClan) : null;
        this.allClans = Array.isArray(parsed.allClans)
          ? parsed.allClans.map((c: ClanData) => this.markPlayer(c)).sort(sortOrders)
          : [];
      }
    } catch {
      this.currentClan = null;
      this.allClans = [];
    }
  }

  private saveState() {
    try {
      safeStorage.setItem(
        CLAN_STORAGE_KEY,
        JSON.stringify({
          currentClan: this.currentClan,
          allClans: this.allClans,
        })
      );
    } catch (e) {
      console.error('Error guardando el estado de la orden:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentClan);
      } catch (err) {
        console.error(err);
      }
    });
  }

  /** Marca qué miembro corresponde al jugador local (no se persiste en la nube). */
  private markPlayer(clan: ClanData): ClanData {
    const profile = playGames.getProfile();
    return {
      ...clan,
      members: (clan.members || []).map((m) => ({ ...m, isPlayer: m.playerId === profile.playerId })),
    };
  }

  /** Quita la marca local antes de enviar la orden al servidor. */
  private stripPlayerFlags(clan: ClanData): ClanData {
    return {
      ...clan,
      members: (clan.members || []).map(({ isPlayer, ...member }) => member as ClanMember),
    };
  }

  private applyRemoteOrder(order: ClanData) {
    const marked = this.markPlayer(order);
    const exists = this.allClans.some((c) => c.id === order.id);
    this.allClans = (exists
      ? this.allClans.map((c) => (c.id === order.id ? marked : c))
      : [marked, ...this.allClans]
    ).sort(sortOrders);

    if (this.currentClan?.id === order.id) {
      this.currentClan = marked;
    }
    this.saveState();
  }

  private queueSave(clan: ClanData) {
    this.pendingSave = this.stripPlayerFlags(clan);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const target = this.pendingSave;
      this.pendingSave = null;
      this.saveTimer = null;
      if (target) void this.persistOrder(target);
    }, SAVE_DEBOUNCE_MS);
  }

  private async persistOrder(order: ClanData) {
    const result = await githubClanService.saveOrder(order, `feat(orders): actualizar ${order.name} [${order.tag}]`);
    if (result.success && result.order) {
      this.applyRemoteOrder(result.order);
    }
  }

  public subscribe(cb: ClanListener): () => void {
    this.listeners.add(cb);
    cb(this.currentClan);
    return () => this.listeners.delete(cb);
  }

  public subscribeSync(cb: (status: GitHubSyncStatus) => void): () => void {
    return githubClanService.subscribeStatus(cb);
  }

  public getSyncStatus(): GitHubSyncStatus {
    return githubClanService.getStatus();
  }

  public getCurrentClan(): ClanData | null {
    return this.currentClan;
  }

  public getAllClans(): ClanData[] {
    // Copia defensiva: al ser una referencia nueva en cada aviso, React vuelve a pintar la lista.
    return [...this.allClans];
  }

  /** Descarga la base de órdenes de GitHub y fusiona con lo que haya en local. */
  public async refreshFromCloud(): Promise<{ success: boolean; count: number; message: string }> {
    const snapshot = await githubClanService.loadOrders();
    if (!snapshot) {
      return {
        success: false,
        count: this.allClans.length,
        message: 'No se pudo contactar con la sede remota. Se muestra la copia local.',
      };
    }

    const merged = new Map<string, ClanData>();
    snapshot.orders.forEach((remote) => merged.set(remote.id, this.markPlayer(remote)));

    // Conserva órdenes creadas sin conexión que todavía no llegaron a GitHub.
    this.allClans.forEach((local) => {
      if (!merged.has(local.id) && !local.githubSyncedAt) {
        merged.set(local.id, local);
      }
    });

    this.allClans = [...merged.values()].sort(sortOrders);

    const currentId = this.currentClan?.id;
    this.currentClan = currentId ? this.allClans.find((c) => c.id === currentId) || null : null;
    if (this.currentClan) this.currentClan = this.markPlayer(this.currentClan);

    this.saveState();

    return {
      success: true,
      count: this.allClans.length,
      message:
        snapshot.source === 'github'
          ? `Sede sincronizada con GitHub: ${this.allClans.length} órdenes.`
          : `Sede cargada desde la caché del servidor: ${this.allClans.length} órdenes.`,
    };
  }

  public createClan(name: string, tag: string, motto: string, emblem: string): ClanData {
    const profile = playGames.getProfile();
    const leaderTag = profile.gamerTag || 'Gran Maestre';

    const newClan: ClanData = {
      id: `clan_${Date.now()}`,
      name,
      tag: tag.toUpperCase(),
      motto: motto || 'Por el honor del bastión y la gloria eterna.',
      emblem: emblem || '/assets/items/Recurso 287@4x.png',
      buildingImage: '/assets/aistudio/image_6578a593.png',
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      totalPower: 25000,
      trophies: 1000,
      minPlayGamesLevel: 1,
      leaderGamerTag: leaderTag,
      members: [
        {
          playerId: profile.playerId,
          gamerTag: leaderTag,
          avatarUrl: profile.avatarUrl || '/assets/portraits/edacorn icono.png',
          role: 'Gran Maestre',
          playGamesLevel: playerLevel(),
          squadPower: 25000,
          contributionXp: 500,
          isPlayer: true,
          lastActive: 'En línea',
        },
      ],
      perks: [
        {
          id: 'perk_gold',
          name: 'Tesoro de la Hermandad',
          level: 1,
          maxLevel: 5,
          description: 'Aumenta el oro ganado en patrullas y combates.',
          icon: 'gold',
          bonusText: '+5% Ganancia de Oro Global',
          upgradeCostGold: 2000,
        },
        {
          id: 'perk_xp',
          name: 'Vínculo de Sabiduría Astral',
          level: 1,
          maxLevel: 5,
          description: 'Incrementa la experiencia recibida por los héroes.',
          icon: 'xp',
          bonusText: '+5% XP para Héroes',
          upgradeCostGold: 2500,
        },
        {
          id: 'perk_attack',
          name: 'Temple de Escarcha',
          level: 1,
          maxLevel: 5,
          description: 'Otorga un bonus marcial de ataque a toda tu escuadra.',
          icon: 'attack',
          bonusText: '+4% Ataque de Escuadra',
          upgradeCostGold: 3000,
        },
      ],
      activities: [
        {
          id: `act_${Date.now()}`,
          text: `La Orden ${name} [${tag}] ha sido fundada oficialmente en la sede de Icespear.`,
          time: 'Ahora',
          type: 'join',
          icon: 'order',
        },
      ],
    };

    const withTotals = withDerivedTotals(this.markPlayer(newClan));
    this.allClans.unshift(withTotals);
    this.allClans.sort(sortOrders);
    this.currentClan = withTotals;
    sound.playSFX('coin');
    this.saveState();
    this.queueSave(withTotals);
    return withTotals;
  }

  public async joinClan(clanId: string): Promise<boolean> {
    const target = this.allClans.find((c) => c.id === clanId);
    if (!target) return false;
    if (this.currentClan?.id === clanId) return true;

    // Una orden por jugador: si ya pertenece a otra, la abandona antes de entrar.
    if (this.currentClan) {
      await this.leaveClan();
    }

    const profile = playGames.getProfile();
    const newMember: ClanMember = {
      playerId: profile.playerId,
      gamerTag: profile.gamerTag || 'Aventurero',
      avatarUrl: profile.avatarUrl || '/assets/portraits/edacorn icono.png',
      role: 'Iniciado',
      playGamesLevel: playerLevel(),
      squadPower: 18500,
      contributionXp: 100,
      isPlayer: true,
      lastActive: 'En línea',
    };

    const optimistic = withDerivedTotals(
      this.markPlayer({
        ...JSON.parse(JSON.stringify(target)),
        members: [newMember, ...target.members.filter((m) => m.playerId !== profile.playerId)],
        activities: [
          {
            id: `act_${Date.now()}`,
            text: `${newMember.gamerTag} se ha unido a la Orden.`,
            time: 'Ahora',
            type: 'join',
            icon: 'shield',
          },
          ...target.activities,
        ].slice(0, 40),
      })
    );

    this.currentClan = optimistic;
    const idx = this.allClans.findIndex((c) => c.id === clanId);
    if (idx >= 0) this.allClans[idx] = optimistic;
    else this.allClans.push(optimistic);
    this.allClans.sort(sortOrders);
    sound.playSFX('sparkle');
    this.saveState();

    const result = await githubClanService.joinOrder(clanId, newMember);
    if (result.success && result.order) {
      this.applyRemoteOrder(result.order);
    }
    return true;
  }

  /** Cambia el emblema heráldico de la Orden y lo guarda en la sede. */
  public updateEmblem(emblem: string): void {
    if (!this.currentClan || this.currentClan.emblem === emblem) return;

    const updated = this.markPlayer({ ...this.currentClan, emblem });
    this.currentClan = updated;
    this.allClans = this.allClans
      .map((c) => (c.id === updated.id ? updated : c))
      .sort(sortOrders);
    this.saveState();
    this.queueSave(this.currentClan);
  }

  public async leaveClan(): Promise<void> {
    const clan = this.currentClan;
    if (!clan) return;

    const profile = playGames.getProfile();
    this.currentClan = null;
    sound.playSFX('click');
    this.saveState();

    await githubClanService.leaveOrder(clan.id, profile.playerId, profile.gamerTag);
  }

  public donateGold(goldAmount: number): { success: boolean; earnedPlayGamesXp: number; earnedClanXp: number } {
    if (!this.currentClan || goldAmount <= 0) {
      return { success: false, earnedPlayGamesXp: 0, earnedClanXp: 0 };
    }

    const clanXp = Math.round(goldAmount * 0.08);
    const playGamesXp = Math.round(goldAmount * 0.15);

    this.currentClan.xp += clanXp;
    while (this.currentClan.xp >= this.currentClan.xpToNextLevel) {
      this.currentClan.xp -= this.currentClan.xpToNextLevel;
      this.currentClan.level += 1;
      this.currentClan.xpToNextLevel = Math.round(this.currentClan.xpToNextLevel * 1.3);
      sound.playSFX('upgrade');
    }

    const playerIdx = this.currentClan.members.findIndex((m) => m.playerId === playGames.getProfile().playerId);
    if (playerIdx !== -1) {
      this.currentClan.members[playerIdx].contributionXp += clanXp;
    }

    const profile = playGames.getProfile();
    this.currentClan.activities.unshift({
      id: `act_${Date.now()}`,
      text: `${profile.gamerTag} ha donado ${goldAmount.toLocaleString()} Oro (+${clanXp} XP de Orden, +${playGamesXp} Play Games XP).`,
      time: 'Ahora',
      type: 'donation',
      icon: 'donation',
    });
    this.currentClan.activities = this.currentClan.activities.slice(0, 40);

    sound.playSFX('coin');
    this.saveState();
    this.queueSave(this.currentClan);

    return { success: true, earnedPlayGamesXp: playGamesXp, earnedClanXp: clanXp };
  }

  public upgradePerk(perkId: string): boolean {
    if (!this.currentClan) return false;

    const perk: ClanPerk | undefined = this.currentClan.perks.find((p) => p.id === perkId);
    if (!perk || perk.level >= perk.maxLevel) return false;

    perk.level += 1;
    perk.upgradeCostGold = Math.round(perk.upgradeCostGold * 1.5);

    this.currentClan.activities.unshift({
      id: `act_${Date.now()}`,
      text: `La bendición ${perk.name} alcanzó el nivel ${perk.level}. ${perk.bonusText}.`,
      time: 'Ahora',
      type: 'achievement',
      icon: 'order',
    });
    this.currentClan.activities = this.currentClan.activities.slice(0, 40);

    sound.playSFX('upgrade');
    this.saveState();
    this.queueSave(this.currentClan);
    return true;
  }
}

export const clanService = new ClanService();
