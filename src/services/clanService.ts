import { ClanData, ClanMember, ClanPerk } from '../types/clan';
import { safeStorage } from '../utils/storage';
import { playGames } from './playGamesService';
import { sound } from './soundService';
import { githubClanService } from './githubClanService';

const CLAN_STORAGE_KEY = 'cdd_clan_system_no_emojis_v2';

export const DEFAULT_CLANS: ClanData[] = [];

type ClanListener = (clan: ClanData | null) => void;

class ClanService {
  private currentClan: ClanData | null = null;
  private allClans: ClanData[] = [];
  private listeners: Set<ClanListener> = new Set();
  private autoSyncDebounceTimer: any = null;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const raw = safeStorage.getItem(CLAN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.currentClan) {
          this.currentClan = parsed.currentClan;
        } else {
          this.currentClan = null;
        }
        if (Array.isArray(parsed.allClans)) {
          this.allClans = parsed.allClans;
        }
      } else {
        this.currentClan = null;
        this.allClans = [];
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
      console.error('Error saving clan state:', e);
    }
    this.notify();

    // Trigger GitHub background auto-sync if configured
    this.triggerAutoSyncToGitHub();
  }

  private triggerAutoSyncToGitHub() {
    const cfg = githubClanService.getConfig();
    if (!cfg.token?.trim() || !cfg.autoSync) return;

    if (this.autoSyncDebounceTimer) {
      clearTimeout(this.autoSyncDebounceTimer);
    }

    this.autoSyncDebounceTimer = setTimeout(() => {
      githubClanService.pushOrdersToGitHub(this.allClans, this.currentClan).catch((err) => {
        console.warn('Auto-sync to GitHub error:', err);
      });
    }, 1200);
  }

  public subscribe(cb: ClanListener): () => void {
    this.listeners.add(cb);
    cb(this.currentClan);
    return () => this.listeners.delete(cb);
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

  public getCurrentClan(): ClanData | null {
    return this.currentClan;
  }

  public getAllClans(): ClanData[] {
    return this.allClans;
  }

  public importClansFromGitHub(allClans: ClanData[], currentClan: ClanData | null): void {
    this.allClans = allClans;
    this.currentClan = currentClan;
    sound.playSFX('sparkle');
    this.saveState();
  }

  public joinClan(clanId: string): boolean {
    const target = this.allClans.find((c) => c.id === clanId);
    if (!target) return false;

    const profile = playGames.getProfile();
    const newMember: ClanMember = {
      playerId: profile.playerId,
      gamerTag: profile.gamerTag || 'Aventurero',
      avatarUrl: profile.avatarUrl || '/assets/portraits/edacorn icono.png',
      role: 'Iniciado',
      playGamesLevel: profile.level,
      squadPower: 18500,
      contributionXp: 100,
      isPlayer: true,
      lastActive: 'En línea',
    };

    const clanCopy = JSON.parse(JSON.stringify(target));
    clanCopy.members = [newMember, ...clanCopy.members.filter((m: ClanMember) => !m.isPlayer)];
    clanCopy.totalPower += newMember.squadPower;
    clanCopy.activities.unshift({
      id: `act_${Date.now()}`,
      text: `${newMember.gamerTag} se ha unido a la Orden.`,
      time: 'Ahora',
      type: 'join',
      icon: 'shield',
    });

    this.currentClan = clanCopy;
    sound.playSFX('sparkle');
    this.saveState();
    return true;
  }

  public leaveClan(): void {
    this.currentClan = null;
    sound.playSFX('click');
    this.saveState();
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
          playGamesLevel: profile.level,
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

    this.allClans.unshift(newClan);
    this.currentClan = newClan;
    sound.playSFX('coin');
    this.saveState();
    return newClan;
  }

  public donateGold(goldAmount: number): { success: boolean; earnedPlayGamesXp: number; earnedClanXp: number } {
    if (!this.currentClan || goldAmount <= 0) return { success: false, earnedPlayGamesXp: 0, earnedClanXp: 0 };

    const clanXp = Math.round(goldAmount * 0.08);
    const playGamesXp = Math.round(goldAmount * 0.15);

    this.currentClan.xp += clanXp;
    while (this.currentClan.xp >= this.currentClan.xpToNextLevel) {
      this.currentClan.xp -= this.currentClan.xpToNextLevel;
      this.currentClan.level += 1;
      this.currentClan.xpToNextLevel = Math.round(this.currentClan.xpToNextLevel * 1.3);
      sound.playSFX('upgrade');
    }

    const pIdx = this.currentClan.members.findIndex((m) => m.isPlayer);
    if (pIdx !== -1) {
      this.currentClan.members[pIdx].contributionXp += clanXp;
    }

    const profile = playGames.getProfile();
    this.currentClan.activities.unshift({
      id: `act_${Date.now()}`,
      text: `${profile.gamerTag} ha donado ${goldAmount.toLocaleString()} Oro (+${clanXp} XP de Clan, +${playGamesXp} Play Games XP).`,
      time: 'Ahora',
      type: 'donation',
      icon: 'donation',
    });

    sound.playSFX('coin');
    this.saveState();
    return { success: true, earnedPlayGamesXp: playGamesXp, earnedClanXp: clanXp };
  }

  public upgradePerk(perkId: string): boolean {
    if (!this.currentClan) return false;
    const perk = this.currentClan.perks.find((p) => p.id === perkId);
    if (!perk || perk.level >= perk.maxLevel) return false;

    perk.level += 1;
    perk.upgradeCostGold = Math.round(perk.upgradeCostGold * 1.5);
    sound.playSFX('upgrade');
    this.saveState();
    return true;
  }
}

export const clanService = new ClanService();
