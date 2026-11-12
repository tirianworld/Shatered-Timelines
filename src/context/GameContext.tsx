import React, { createContext, useContext, useState, useEffect } from 'react';
import { Hero, SummonBanner, PatrolMission, InventoryItem, EquipmentItem } from '../types/game';
import { INITIAL_HEROES } from '../data/heroesData';
import { BANNERS, PATROLS, INITIAL_INVENTORY, INITIAL_EQUIPMENT, SHOP_ITEMS } from '../data/gameContent';
import { sound } from '../services/soundService';
import { safeStorage, safeGetJSON } from '../utils/storage';
import { playGames } from '../services/playGamesService';

interface ActivePatrol {
  patrolId: string;
  heroIds: string[];
  startTime: number;
  endTime: number;
}

export interface MailItem {
  id: string;
  sender: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  claimed: boolean;
  rewardGold?: number;
  rewardCrystals?: number;
}

export interface ShelfItem {
  id: string;
  name: string;
  category: 'materials' | 'food' | 'tools' | 'cards' | 'equipment';
  count: number;
  icon: string;
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  description: string;
  priceGold: number;
  effectType?: 'xp' | 'gold' | 'stat';
  effectValue?: number;
}

interface GameContextType {
  gold: number;
  summonCrystals: number;
  astralShards: number;
  playerName: string;
  setPlayerName: (name: string) => void;
  heroes: Hero[];
  team: (string | null)[]; // 4 slots
  inventory: InventoryItem[];
  shelfInventory: ShelfItem[];
  addShelfItem: (item: {
    id?: string;
    name: string;
    category?: 'materials' | 'food' | 'tools' | 'cards' | 'equipment';
    count?: number;
    icon: string;
    description?: string;
    rarity?: 'R' | 'SR' | 'SSR' | 'UR';
    priceGold?: number;
    effectType?: 'xp' | 'gold' | 'stat';
    effectValue?: number;
  }) => void;
  consumeShelfItem: (itemId: string) => boolean;
  sellShelfItem: (itemId: string) => boolean;
  removeShelfItem: (itemId: string, count?: number) => boolean;
  resetInventory: () => void;
  getMaterialCount: (icon: string, name?: string) => number;
  deductMaterials: (requirements: { icon: string; name?: string; count: number }[]) => boolean;
  equipment: EquipmentItem[];
  activePatrols: ActivePatrol[];
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  navigateTo: (tab: string) => void;
  goBack: () => void;
  activeSanctuary: 'icespear' | 'mercado_negro';
  setActiveSanctuary: (sanctuary: 'icespear' | 'mercado_negro') => void;
  selectedBanner: SummonBanner;
  setSelectedBanner: (banner: SummonBanner) => void;
  questProgress: {
    chapter: number;
    completedMissions: string[];
    stars: Record<string, number>;
    allMissionsCompleted?: boolean;
  };
  isMissionCompleted: (missionId: string) => boolean;
  activeQuestChapter: number;
  setActiveQuestChapter: (chapter: number) => void;
  completeQuestMission: (missionId: string, stars: number) => void;
  completeAllMissions: () => void;
  selectedCombatMissionId: string | null;
  setSelectedCombatMissionId: (id: string | null) => void;
  // Mailbox & Options
  isMailboxOpen: boolean;
  setIsMailboxOpen: (open: boolean) => void;
  isOptionsOpen: boolean;
  setIsOptionsOpen: (open: boolean) => void;
  // Google Play Games
  isPlayGamesOpen: boolean;
  setIsPlayGamesOpen: (open: boolean) => void;
  openPlayGames: () => void;
  mailItems: MailItem[];
  claimMailReward: (id: string) => void;
  // Forge navigation state
  forgeCategory: string;
  setForgeCategory: (cat: string) => void;
  forgeSubcategory: string | null;
  setForgeSubcategory: (sub: string | null) => void;
  // Actions
  addGold: (amt: number) => void;
  addCrystals: (amt: number) => void;
  addAstralShards: (amt: number) => void;
  setTeamSlot: (slotIndex: number, heroId: string | null) => void;
  setEntireTeam: (newTeam: (string | null)[]) => void;
  summon: (bannerId: string, count: number) => { pulled: Hero[]; duplicates: number; bonusCoins: number };
  levelUpHero: (heroId: string) => boolean;
  startPatrol: (patrolId: string, heroIds: string[]) => boolean;
  claimPatrol: (patrolId: string) => boolean;
  equipHeroItem: (heroId: string, equipId: string) => void;
  unequipHeroItem: (heroId: string, slot: 'weapon' | 'armor' | 'accessory') => void;
  upgradeEquipmentItem: (equipId: string) => boolean;
  forgeNewEquipment: (type: 'weapon' | 'armor' | 'ring') => boolean;
  buyShopItem: (itemId: string) => boolean;
  useInventoryItem: (itemId: string, heroId?: string) => boolean;
  setHeroes: React.Dispatch<React.SetStateAction<Hero[]>>;
  banners: SummonBanner[];
  setBanners: React.Dispatch<React.SetStateAction<SummonBanner[]>>;
  isGitHubManagerOpen: boolean;
  setIsGitHubManagerOpen: (open: boolean) => void;
  claimIdleEarnings: () => number;
  idleEarningsAvailable: number;
  resetAllData: () => void;
  restoreGameState: (saved: any) => boolean;
}

const STORAGE_KEY = 'cdd_gacha_2_save_v1';

const DEFAULT_MAIL: MailItem[] = [
  {
    id: 'mail_welcome',
    sender: 'Capitán Gabriel',
    title: '¡Bienvenido al Bastión de Icespear!',
    body: 'Saludos, aventurero. Las tierras del norte son despiadadas, pero la guarnición te otorga estos suministros imperiales para tu viaje.',
    date: 'Hoy',
    read: false,
    claimed: false,
    rewardGold: 5000,
    rewardCrystals: 500,
  },
  {
    id: 'mail_cdd',
    sender: 'Culto a los Dragones',
    title: 'Tributo de las Cumbres Nevadas',
    body: 'Los ecos ancestrales despiertan en el pico helado. Acepta esta ofrenda en reconocimiento a tu valentía frente a las bestias.',
    date: 'Hoy',
    read: false,
    claimed: false,
    rewardGold: 3500,
    rewardCrystals: 350,
  },
  {
    id: 'mail_vigias',
    sender: 'Vigías de Ravenholm',
    title: 'Informe de Patrulla y Botín',
    body: 'Las rondas nocturnas han sido un éxito. Hemos asegurado el paso fronterizo y recuperado valiosas gemas de los asaltantes.',
    date: 'Ayer',
    read: false,
    claimed: false,
    rewardGold: 2500,
    rewardCrystals: 200,
  },
  {
    id: 'mail_magordito',
    sender: 'Magordito el Nigromante',
    title: 'Entrenamiento y Esencia de Muerte',
    body: 'Pásate por la taberna cuando gustes. Traigo nuevos pergaminos de almas y elixires revitalizantes para tus héroes.',
    date: 'Hace 2 días',
    read: false,
    claimed: false,
    rewardGold: 1000,
    rewardCrystals: 150,
  },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sanitizeTab = (saved: unknown): string => {
    const validTabs = ['quest', 'heroes', 'santuario', 'camp', 'draw', 'gacha', 'shop', 'forge', 'potions', 'tavern', 'world', 'combat', 'patrol', 'inventory', 'auction', 'order', 'clan'];
    if (typeof saved === 'string' && validTabs.includes(saved)) {
      return saved;
    }
    return 'quest';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const saved = safeGetJSON<string>(`${STORAGE_KEY}_current_tab`, 'quest');
    return sanitizeTab(saved);
  });
  const [activeSanctuary, setActiveSanctuary] = useState<'icespear' | 'mercado_negro'>(() => {
    const saved = safeGetJSON<string>(`${STORAGE_KEY}_active_sanctuary`, 'icespear');
    return saved === 'mercado_negro' ? 'mercado_negro' : 'icespear';
  });

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_active_sanctuary`, JSON.stringify(activeSanctuary));
  }, [activeSanctuary]);

  const [historyStack, setHistoryStack] = useState<string[]>(['quest']);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_current_tab`, JSON.stringify(currentTab));
  }, [currentTab]);

  const [playerName, setPlayerName] = useState<string>(() => {
    const saved = safeGetJSON<string>(`${STORAGE_KEY}_player_name`, 'Zer0_NadA');
    return typeof saved === 'string' && saved.trim().length > 0 ? saved : 'Zer0_NadA';
  });

  // Load safely from storage or fallback defaults
  const [gold, setGold] = useState<number>(() => {
    const val = safeGetJSON<number>(`${STORAGE_KEY}_gold`, 999951543);
    return typeof val === 'number' && !isNaN(val) ? val : 999951543;
  });

  const [summonCrystals, setSummonCrystals] = useState<number>(() => {
    const val = safeGetJSON<number>(`${STORAGE_KEY}_crystals`, 99999999);
    return typeof val === 'number' && !isNaN(val) ? val : 99999999;
  });

  const [astralShards, setAstralShards] = useState<number>(() => {
    const val = safeGetJSON<number>(`${STORAGE_KEY}_shards`, 99999999);
    return typeof val === 'number' && !isNaN(val) ? val : 99999999;
  });

  const [heroes, setHeroes] = useState<Hero[]>(() => {
    const saved = safeGetJSON<Hero[] | null>(`${STORAGE_KEY}_heroes`, null);
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
      return INITIAL_HEROES;
    }
    // Rehydrate saved heroes ensuring all required fields (skills, stats, equipped) exist
    const rehydrated = saved.map((h) => {
      const canonical = INITIAL_HEROES.find((ih) => ih.id === h.id) || INITIAL_HEROES[0];
      return {
        ...canonical,
        ...h,
        stats: {
          ...canonical.stats,
          ...(h.stats || {}),
        },
        skills:
          h.id === 'magordito' || h.id === 'ragnavaldr' || h.id === 'kairon'
            ? canonical.skills
            : Array.isArray(h.skills) && h.skills.length > 0
            ? h.skills
            : canonical.skills,
        title: canonical.title,
        bio: canonical.bio,
        quote: canonical.quote,
        equipped: h.equipped && typeof h.equipped === 'object' ? h.equipped : {},
      };
    });

    // Ensure all canonical heroes (like Ragnavaldr) exist even if localStorage was created previously
    const existingIds = new Set(rehydrated.map((h) => h.id));
    const missingHeroes = INITIAL_HEROES.filter((ih) => !existingIds.has(ih.id));
    return [...rehydrated, ...missingHeroes];
  });

  const [team, setTeam] = useState<(string | null)[]>(() => {
    const saved = safeGetJSON<unknown>(`${STORAGE_KEY}_team`, null);
    if (Array.isArray(saved) && saved.length === 4) {
      return saved.map((id) => (typeof id === 'string' ? id : null));
    }
    return ['edacorn', 'kairon', 'roxanne', 'magordito'];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = safeGetJSON<InventoryItem[] | null>(`${STORAGE_KEY}_inventory`, null);
    return Array.isArray(saved) ? saved : INITIAL_INVENTORY;
  });

  // Persistent shelf inventory: persists purchased and crafted items
  const STORAGE_SHELF_KEY = `${STORAGE_KEY}_shelf_inventory_v3`;
  const [shelfInventory, setShelfInventory] = useState<ShelfItem[]>(() => {
    const saved = safeGetJSON<ShelfItem[] | null>(STORAGE_SHELF_KEY, null);
    let items = Array.isArray(saved) ? saved : [];

    // Ensure player has base materials to craft swords in the forge
    const hasMango = items.some((it) => it.id === 'mango_espada' || it.name.toLowerCase().includes('mango'));
    if (!hasMango) {
      items.push({
        id: 'mango_espada',
        name: 'Mango de Espada',
        category: 'tools',
        count: 12,
        icon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        rarity: 'SR',
        description: 'Mango artesanal con guarda de bronce y empuñadura de cuero para forjar espadas.',
        priceGold: 150,
      });
    }

    const hasIron = items.some((it) => it.id === 'ingot_hierro' || it.name.toLowerCase().includes('hierro'));
    if (!hasIron) {
      items.push({
        id: 'ingot_hierro',
        name: 'Lingote de Hierro',
        category: 'materials',
        count: 18,
        icon: '/assets/items/lingote_app.png',
        rarity: 'R',
        description: 'Lingote de hierro templado indispensable para forjar espadas y armaduras.',
        priceGold: 200,
      });
    }

    const hasKit = items.some((it) => it.id === 'kit_herreria' || it.name.toLowerCase().includes('kit herrer'));
    if (!hasKit) {
      items.push({
        id: 'kit_herreria',
        name: 'Kit herrería',
        category: 'tools',
        count: 12,
        icon: '/assets/items/kit_de_herreria_app.png',
        rarity: 'R',
        description: 'Herramientas básicas para temple de aceros y armas.',
        priceGold: 150,
      });
    }

    const hasMangoLanza = items.some((it) => it.id === 'mango_lanza' || it.name.toLowerCase().includes('lanza'));
    if (!hasMangoLanza) {
      items.push({
        id: 'mango_lanza',
        name: 'Mango de Lanza',
        category: 'tools',
        count: 10,
        icon: '/assets/items/mango_lanza.png',
        rarity: 'R',
        description: 'Asta resistente reforzada para montar puntas de lanza y tridentes.',
        priceGold: 150,
      });
    }

    const hasQuitina = items.some((it) => it.name.toLowerCase().includes('quitina'));
    if (!hasQuitina) {
      items.push({
        id: 'fragmento_quitina',
        name: 'Fragmento de Quitina',
        category: 'materials',
        count: 16,
        icon: '/assets/items/fragmento de quitina.png',
        rarity: 'SR',
        description: 'Caparazón orgánico hiperresistente para forjas de afinidad natural.',
        priceGold: 250,
      });
    }

    const mangoHachaMartilloItem = items.find((it) => it.id === 'mango_hacha_martillo' || it.icon === '/assets/items/mango_hacha_martillo.png');
    if (!mangoHachaMartilloItem) {
      items.push({
        id: 'mango_hacha_martillo',
        name: 'Mango de Hacha y Martillo',
        category: 'tools',
        count: 12,
        icon: '/assets/items/mango_hacha_martillo.png',
        rarity: 'SR',
        description: 'Mango reforzado de madera oscura y engarces de bronce anaranjado para hachas de guerra y martillos pesados.',
        priceGold: 150,
      });
    } else if (mangoHachaMartilloItem.count < 6) {
      mangoHachaMartilloItem.count = 12;
      mangoHachaMartilloItem.icon = '/assets/items/mango_hacha_martillo.png';
    }

    const lomoItem = items.find((it) => it.id === 'lomo_libro' || it.icon === '/assets/items/lomo_libro.png');
    if (!lomoItem) {
      items.push({
        id: 'lomo_libro',
        name: 'Lomo de Grimorio',
        category: 'tools',
        count: 10,
        icon: '/assets/items/lomo_libro.png',
        rarity: 'SR',
        description: 'Lomo encuadernado en cuero y escamas de dragón para forjar grimorios arcanos.',
        priceGold: 200,
      });
    } else if (lomoItem.count < 4) {
      lomoItem.count = 10;
    }

    const kitInscripcionItem = items.find((it) => it.id === 'kit_inscripcion' || it.icon === '/assets/items/kit_de_inscripcion_app.png');
    if (!kitInscripcionItem) {
      items.push({
        id: 'kit_inscripcion',
        name: 'Kit de Inscripción',
        category: 'tools',
        count: 8,
        icon: '/assets/items/kit_de_inscripcion_app.png',
        rarity: 'SR',
        description: 'Tintas rúnicas, plumas y sellos para encantar grimorios.',
        priceGold: 250,
      });
    } else if (kitInscripcionItem.count < 4) {
      kitInscripcionItem.count = 8;
    }

    // Ensure player has a starter variety of combat banquet meals in their shelves
    const hasFood = items.some(
      (it) =>
        it.category === 'food' ||
        it.name.toLowerCase().includes('hamburguesa') ||
        it.name.toLowerCase().includes('ramen')
    );
    if (!hasFood) {
      items.push(
        {
          id: 'food_hamburguesa',
          name: 'Hamburguesa Artesanal',
          category: 'food',
          count: 4,
          icon: '/assets/items/hamburguesa.png',
          rarity: 'SR',
          description: 'Carne asada de Icespear. Otorga +25% Ataque Total en combate.',
          priceGold: 200,
        },
        {
          id: 'food_ramen',
          name: 'Ramen Humeante',
          category: 'food',
          count: 4,
          icon: '/assets/items/ramen.png',
          rarity: 'SR',
          description: 'Caldo caliente artesanal. Restaura 40 PV y regenera +8 PV/turno.',
          priceGold: 220,
        },
        {
          id: 'food_pizza',
          name: 'Pizza Fundida',
          category: 'food',
          count: 3,
          icon: '/assets/items/pizza.png',
          rarity: 'SR',
          description: 'Cuatro quesos al horno de piedra. Otorga +30% Defensa y Escudo Protector de 30 PV.',
          priceGold: 250,
        },
        {
          id: 'food_pan_ajo',
          name: 'Panes de Ajo Dorados',
          category: 'food',
          count: 5,
          icon: '/assets/items/panes_de_ajo.png',
          rarity: 'R',
          description: 'Bocados crujientes con mantequilla. Concede al instante +2 Orbes Definitivos.',
          priceGold: 180,
        },
        {
          id: 'food_quesarito',
          name: 'Quesarito Picante',
          category: 'food',
          count: 3,
          icon: '/assets/items/quesarito.png',
          rarity: 'SR',
          description: 'Quesadilla enrollada especiada. Aumenta un +35% la Tasa Crítica y +50% Daño Crítico.',
          priceGold: 240,
        },
        {
          id: 'food_tortilla',
          name: 'Tortilla de Patatas',
          category: 'food',
          count: 3,
          icon: '/assets/items/tortilla_patata.png',
          rarity: 'SR',
          description: 'Receta tradicional jugosa. Concede Evasión Total del siguiente golpe enemigo y purifica alteraciones.',
          priceGold: 220,
        },
        {
          id: 'pocion_vida_mayor',
          name: 'Poción de Vida Mayor',
          category: 'food',
          count: 5,
          icon: '/assets/items/boton_pocion.png',
          rarity: 'SR',
          description: 'Elixir revitalizante de manantial. Restaura 50 PV de Magordito de inmediato.',
          priceGold: 150,
        }
      );
    }

    return items;
  });

  useEffect(() => {
    safeStorage.setItem(STORAGE_SHELF_KEY, JSON.stringify(shelfInventory));
  }, [shelfInventory]);

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const saved = safeGetJSON<EquipmentItem[] | null>(`${STORAGE_KEY}_equipment`, null);
    return Array.isArray(saved) ? saved : INITIAL_EQUIPMENT;
  });

  const createQuestProgressState = (raw: {
    chapter?: number;
    completedMissions?: string[];
    stars?: Record<string, number>;
    allMissionsCompleted?: boolean;
  }): { chapter: number; completedMissions: string[]; stars: Record<string, number>; allMissionsCompleted?: boolean } => {
    const isAll = !!raw.allMissionsCompleted;
    const baseChapter = isAll ? 99 : (typeof raw.chapter === 'number' ? raw.chapter : 1);
    const baseCompleted = Array.isArray(raw.completedMissions) ? [...raw.completedMissions] : ['m1_tirano'];
    const baseStars: Record<string, number> = (raw.stars && typeof raw.stars === 'object') ? { ...raw.stars } : { m1_tirano: 3 };

    if (!isAll) {
      return {
        chapter: baseChapter,
        completedMissions: baseCompleted,
        stars: baseStars,
        allMissionsCompleted: false,
      };
    }

    // Proxy completedMissions array so .includes returns true for ANY mission ID (even ones not existing yet)
    const completedProxy = new Proxy(baseCompleted, {
      get(target, prop, receiver) {
        if (prop === 'includes') {
          return () => true;
        }
        if (prop === 'indexOf') {
          return () => 0;
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    // Proxy stars map so querying stars for ANY mission returns 3
    const starsProxy = new Proxy(baseStars, {
      get(target: Record<string, number>, prop: string, receiver) {
        if (typeof prop === 'string' && prop !== 'toJSON' && prop !== 'valueOf' && prop !== 'constructor') {
          return target[prop] ?? 3;
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    return {
      chapter: 99,
      completedMissions: completedProxy,
      stars: starsProxy,
      allMissionsCompleted: true,
    };
  };

  const [questProgress, setQuestProgress] = useState<{ chapter: number; completedMissions: string[]; stars: Record<string, number>; allMissionsCompleted?: boolean }>(() => {
    const defaultProgress = {
      chapter: 1,
      completedMissions: ['m1_tirano'],
      stars: { m1_tirano: 3 },
      allMissionsCompleted: false,
    };
    const saved = safeGetJSON<any>(`${STORAGE_KEY}_quest_progress`, null);
    if (!saved || typeof saved !== 'object') return createQuestProgressState(defaultProgress);
    return createQuestProgressState({
      chapter: typeof saved.chapter === 'number' ? saved.chapter : 1,
      completedMissions: Array.isArray(saved.completedMissions) ? saved.completedMissions : ['m1_tirano'],
      stars: saved.stars && typeof saved.stars === 'object' ? saved.stars : { m1_tirano: 3 },
      allMissionsCompleted: !!saved.allMissionsCompleted,
    });
  });

  const [activeQuestChapter, setActiveQuestChapterState] = useState<number>(() => {
    const saved = safeGetJSON<number | null>(`${STORAGE_KEY}_active_quest_chapter`, 1);
    return typeof saved === 'number' && saved >= 1 ? saved : 1;
  });

  const setActiveQuestChapter = (chapter: number) => {
    setActiveQuestChapterState(chapter);
    safeStorage.setItem(`${STORAGE_KEY}_active_quest_chapter`, JSON.stringify(chapter));
  };

  const [selectedCombatMissionId, setSelectedCombatMissionId] = useState<string | null>('m2_robo');

  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isPlayGamesOpen, setIsPlayGamesOpen] = useState(false);

  const openPlayGames = () => {
    sound.playSFX('click');
    setIsPlayGamesOpen(true);
  };
  const [mailItems, setMailItems] = useState<MailItem[]>(() => {
    const saved = safeGetJSON<MailItem[] | null>(`${STORAGE_KEY}_mail`, null);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_MAIL;
  });

  const [forgeCategory, setForgeCategory] = useState<string>('');
  const [forgeSubcategory, setForgeSubcategory] = useState<string | null>(null);

  const [activePatrols, setActivePatrols] = useState<ActivePatrol[]>(() => {
    const saved = safeGetJSON<ActivePatrol[] | null>(`${STORAGE_KEY}_patrols`, null);
    return Array.isArray(saved) ? saved : [];
  });

  const [isGitHubManagerOpen, setIsGitHubManagerOpen] = useState(false);

  const [banners, setBanners] = useState<SummonBanner[]>(() => {
    const saved = safeGetJSON<SummonBanner[] | null>(`${STORAGE_KEY}_banners`, null);
    return Array.isArray(saved) && saved.length > 0 ? saved : BANNERS;
  });

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_banners`, JSON.stringify(banners));
  }, [banners]);

  const [selectedBanner, setSelectedBanner] = useState<SummonBanner>(() => {
    return banners && banners.length > 0 ? banners[0] : ({} as SummonBanner);
  });

  const [lastIdleTimestamp, setLastIdleTimestamp] = useState<number>(() => {
    const val = safeGetJSON<number>(`${STORAGE_KEY}_idle_time`, Date.now());
    return typeof val === 'number' && !isNaN(val) ? val : Date.now();
  });

  const [idleEarningsAvailable, setIdleEarningsAvailable] = useState<number>(0);

  // Sync safely to storage
  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_gold`, JSON.stringify(gold));
  }, [gold]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_crystals`, JSON.stringify(summonCrystals));
  }, [summonCrystals]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_shards`, JSON.stringify(astralShards));
  }, [astralShards]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_heroes`, JSON.stringify(heroes));
  }, [heroes]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_team`, JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_inventory`, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_equipment`, JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_patrols`, JSON.stringify(activePatrols));
  }, [activePatrols]);

  // Idle gold calculation (5 gold per 10 seconds idle, up to 1000 max)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastIdleTimestamp) / 1000);
      const earned = Math.min(1000, Math.floor(elapsedSeconds / 10) * 8);
      setIdleEarningsAvailable(earned);
    }, 2000);
    return () => clearInterval(interval);
  }, [lastIdleTimestamp]);

  const claimIdleEarnings = () => {
    if (idleEarningsAvailable <= 0) return 0;
    const claimed = idleEarningsAvailable;
    setGold((prev) => prev + claimed);
    setLastIdleTimestamp(Date.now());
    setIdleEarningsAvailable(0);
    sound.playSFX('coin');
    return claimed;
  };

  const addGold = (amt: number) => {
    setGold((prev) => {
      const next = Math.max(0, prev + amt);
      if (next >= 25000) playGames.unlockAchievement('ach_wealthy');
      if (next >= 75000) playGames.unlockAchievement('ach_tycoon');
      return next;
    });
  };

  const addCrystals = (amt: number) => {
    setSummonCrystals((prev) => Math.max(0, prev + amt));
    setAstralShards((prev) => Math.max(0, prev + amt));
  };

  const addAstralShards = (amt: number) => {
    setAstralShards((prev) => Math.max(0, prev + amt));
    setSummonCrystals((prev) => Math.max(0, prev + amt));
  };

  const setTeamSlot = (slotIndex: number, heroId: string | null) => {
    setTeam((prev) => {
      const next = [...prev];
      // remove hero if already in another slot
      if (heroId) {
        for (let i = 0; i < next.length; i++) {
          if (next[i] === heroId) next[i] = null;
        }
      }
      next[slotIndex] = heroId;
      return next;
    });
    sound.playSFX('click');
  };

  const setEntireTeam = (newTeam: (string | null)[]) => {
    setTeam(newTeam);
  };

  const summon = (bannerId: string, count: number) => {
    const banner = BANNERS.find((b) => b.id === bannerId) || selectedBanner;
    const cost = count === 1 ? banner.costSingle : banner.costMulti;

    if (astralShards < cost) {
      sound.playSFX('hurt');
      return { pulled: [], duplicates: 0, bonusCoins: 0 };
    }

    setAstralShards((prev) => Math.max(0, prev - cost));
    setSummonCrystals((prev) => Math.max(0, prev - cost));
    sound.playSFX('gacha_pull');

    const pulled: Hero[] = [];
    let duplicates = 0;
    let bonusCoins = 0;

    const availablePool = INITIAL_HEROES;

    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      let targetRarity: 'UR' | 'SSR' | 'SR' | 'R' = 'R';

      if (roll < banner.dropRates.UR) {
        targetRarity = 'UR';
      } else if (roll < banner.dropRates.UR + banner.dropRates.SSR) {
        targetRarity = 'SSR';
      } else if (roll < banner.dropRates.UR + banner.dropRates.SSR + banner.dropRates.SR) {
        targetRarity = 'SR';
      } else {
        targetRarity = 'R';
      }

      // Check if featured
      let pool = availablePool.filter((h) => h.rarity === targetRarity);
      if (pool.length === 0) pool = availablePool;

      // 50% chance to pick featured if matches rarity
      const featuredMatches = pool.filter((h) => banner.featuredHeroIds.includes(h.id));
      let picked: Hero;
      if (featuredMatches.length > 0 && Math.random() < 0.5) {
        picked = featuredMatches[Math.floor(Math.random() * featuredMatches.length)];
      } else {
        picked = pool[Math.floor(Math.random() * pool.length)];
      }

      pulled.push(picked);
    }

    // Merge into owned heroes or award bonus stars/coins
    setHeroes((prev) => {
      const updated = [...prev];
      pulled.forEach((hero) => {
        const existingIdx = updated.findIndex((h) => h.id === hero.id);
        if (existingIdx >= 0) {
          duplicates++;
          bonusCoins += hero.rarity === 'UR' ? 50 : hero.rarity === 'SSR' ? 25 : hero.rarity === 'SR' ? 10 : 3;
          // upgrade star or stat
          updated[existingIdx] = {
            ...updated[existingIdx],
            stars: Math.min(6, updated[existingIdx].stars + 1),
            stats: {
              ...updated[existingIdx].stats,
              attack: Math.round(updated[existingIdx].stats.attack * 1.05),
              hp: Math.round(updated[existingIdx].stats.hp * 1.05),
              maxHp: Math.round(updated[existingIdx].stats.maxHp * 1.05),
            },
          };
        } else {
          updated.push({ ...hero, level: 1, currentXp: 0 });
        }
      });
      return updated;
    });

    if (bonusCoins > 0) {
      setAstralShards((prev) => prev + bonusCoins);
    }

    // Google Play Games Achievements
    playGames.unlockAchievement('ach_first_summon');
    if (pulled.some((h) => h.rarity === 'UR' || h.rarity === 'SSR')) {
      playGames.unlockAchievement('ach_rarity_ssr');
    }
    setTimeout(() => {
      setHeroes((curr) => {
        if (curr.length >= 6) playGames.unlockAchievement('ach_hero_collector');
        if (curr.length >= 12) playGames.unlockAchievement('ach_hero_master');
        return curr;
      });
    }, 100);

    return { pulled, duplicates, bonusCoins };
  };

  const levelUpHero = (heroId: string): boolean => {
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero) return false;

    // Cost scales with level
    const goldCost = hero.level * 150;
    if (gold < goldCost) {
      sound.playSFX('hurt');
      return false;
    }

    setGold((prev) => prev - goldCost);
    sound.playSFX('upgrade');

    const nextLevel = hero.level + 1;
    if (nextLevel >= 10) playGames.unlockAchievement('ach_level_10');
    if (nextLevel >= 25) playGames.unlockAchievement('ach_level_25');

    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== heroId) return h;
        const newLvl = h.level + 1;
        const statMult = 1.08;
        return {
          ...h,
          level: newLvl,
          currentXp: 0,
          xpToNextLevel: Math.round(h.xpToNextLevel * 1.25),
          stats: {
            ...h.stats,
            maxHp: Math.round(h.stats.maxHp * statMult),
            hp: Math.round(h.stats.maxHp * statMult),
            attack: Math.round(h.stats.attack * statMult),
            defense: Math.round(h.stats.defense * statMult),
          },
        };
      })
    );
    return true;
  };

  const startPatrol = (patrolId: string, heroIds: string[]): boolean => {
    const patrol = PATROLS.find((p) => p.id === patrolId);
    if (!patrol || heroIds.length === 0) return false;

    // Check if already active
    if (activePatrols.some((p) => p.patrolId === patrolId)) return false;

    const now = Date.now();
    const newActive: ActivePatrol = {
      patrolId,
      heroIds,
      startTime: now,
      endTime: now + patrol.durationSeconds * 1000,
    };

    setActivePatrols((prev) => [...prev, newActive]);
    // Mark heroes in patrol
    setHeroes((prev) =>
      prev.map((h) => (heroIds.includes(h.id) ? { ...h, inPatrol: true } : h))
    );

    sound.playSFX('click');
    return true;
  };

  const claimPatrol = (patrolId: string): boolean => {
    const active = activePatrols.find((p) => p.patrolId === patrolId);
    if (!active) return false;
    if (Date.now() < active.endTime) return false;

    const patrol = PATROLS.find((p) => p.id === patrolId);
    if (!patrol) return false;

    // Award rewards
    setGold((prev) => prev + patrol.rewards.gold);
    setSummonCrystals((prev) => prev + patrol.rewards.crystals);
    setAstralShards((prev) => prev + patrol.rewards.crystals);

    // Free heroes
    setHeroes((prev) =>
      prev.map((h) => {
        if (active.heroIds.includes(h.id)) {
          return {
            ...h,
            inPatrol: false,
            currentXp: h.currentXp + patrol.rewards.xp,
          };
        }
        return h;
      })
    );

    // Remove from active
    setActivePatrols((prev) => prev.filter((p) => p.patrolId !== patrolId));
    sound.playSFX('victory');
    playGames.unlockAchievement('ach_patrol_done');
    return true;
  };

  const equipHeroItem = (heroId: string, equipId: string) => {
    const item = equipment.find((e) => e.id === equipId);
    if (!item) return;

    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== heroId) return h;
        const newEquipped = { ...h.equipped };
        if (item.type === 'weapon') newEquipped.weapon = item;
        else if (item.type === 'armor') newEquipped.armor = item;
        else newEquipped.accessory = item;

        return { ...h, equipped: newEquipped };
      })
    );
    sound.playSFX('click');
  };

  const unequipHeroItem = (heroId: string, slot: 'weapon' | 'armor' | 'accessory') => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== heroId) return h;
        const newEquipped = { ...h.equipped };
        delete newEquipped[slot];
        return { ...h, equipped: newEquipped };
      })
    );
    sound.playSFX('click');
  };

  const upgradeEquipmentItem = (equipId: string): boolean => {
    const item = equipment.find((e) => e.id === equipId);
    if (!item) return false;
    const cost = item.level * 400;
    if (gold < cost) {
      sound.playSFX('hurt');
      return false;
    }

    setGold((prev) => prev - cost);
    sound.playSFX('upgrade');
    playGames.unlockAchievement('ach_forge_master');

    setEquipment((prev) =>
      prev.map((e) => {
        if (e.id !== equipId) return e;
        return {
          ...e,
          level: e.level + 1,
          stats: {
            ...e.stats,
            attack: e.stats.attack ? Math.round(e.stats.attack * 1.15) : undefined,
            defense: e.stats.defense ? Math.round(e.stats.defense * 1.15) : undefined,
            hp: e.stats.hp ? Math.round(e.stats.hp * 1.15) : undefined,
          },
        };
      })
    );
    return true;
  };

  const forgeNewEquipment = (type: 'weapon' | 'armor' | 'ring'): boolean => {
    const costGold = 1200;
    const ingots = inventory.find((i) => i.id === 'lingote_hierro');
    if (gold < costGold || !ingots || ingots.count < 5) {
      sound.playSFX('hurt');
      return false;
    }

    // deduct resources
    setGold((prev) => prev - costGold);
    setInventory((prev) =>
      prev.map((i) => (i.id === 'lingote_hierro' ? { ...i, count: i.count - 5 } : i))
    );

    const rarities: ('SR' | 'SSR' | 'UR')[] = ['SR', 'SR', 'SSR', 'UR'];
    const chosenRarity = rarities[Math.floor(Math.random() * rarities.length)];

    const id = `forge_${type}_${Date.now()}`;
    const nameMap = {
      weapon: 'Filo Templado de Icespear',
      armor: 'Armadura Pesada de las Cumbres',
      ring: 'Anillo de Amatista Purificada',
    };
    const iconMap = {
      weapon: '/assets/items/ESPADA LOUX.png',
      armor: '/assets/items/ARMADURA LOUX.png',
      ring: '/assets/items/ANILLO ORO.png',
    };

    const newItem: EquipmentItem = {
      id,
      name: `${nameMap[type]} (${chosenRarity})`,
      type,
      rarity: chosenRarity,
      level: 1,
      icon: iconMap[type],
      description: 'Una pieza de alta calidad recién moldeada en los fuegos de la herrería.',
      stats: {
        attack: type === 'weapon' || type === 'ring' ? Math.floor(Math.random() * 30 + 40) : undefined,
        defense: type === 'armor' || type === 'ring' ? Math.floor(Math.random() * 25 + 30) : undefined,
        hp: type === 'armor' ? Math.floor(Math.random() * 100 + 150) : undefined,
      },
    };

    setEquipment((prev) => [...prev, newItem]);
    sound.playSFX('victory');
    playGames.unlockAchievement('ach_forge_master');
    return true;
  };

  const buyShopItem = (itemId: string): boolean => {
    const item = SHOP_ITEMS.find((s) => s.id === itemId);
    if (!item) return false;
    if (gold < item.costGold) {
      sound.playSFX('hurt');
      return false;
    }

    setGold((prev) => prev - item.costGold);
    sound.playSFX('coin');

    if (item.id === 'shop_crystals_single') {
      setSummonCrystals((prev) => prev + 100);
      setAstralShards((prev) => prev + 100);
    } else if (item.id === 'shop_crystals_bundle') {
      setSummonCrystals((prev) => prev + 900);
      setAstralShards((prev) => prev + 900);
    } else if (item.id === 'shop_potions_pack') {
      setInventory((prev) =>
        prev.map((i) => (i.id === 'xp_potion_large' ? { ...i, count: i.count + 5 } : i))
      );
    } else if (item.id === 'shop_lingotes_pack') {
      setInventory((prev) =>
        prev.map((i) => (i.id === 'lingote_hierro' ? { ...i, count: i.count + 10 } : i))
      );
    } else if (item.id === 'shop_beer') {
      setInventory((prev) =>
        prev.map((i) => (i.id === 'food_ramen' ? { ...i, count: i.count + 3 } : i))
      );
    }

    return true;
  };

  const useInventoryItem = (itemId: string, heroId?: string): boolean => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item || item.count <= 0) return false;

    if (item.effect?.xpAmount && heroId) {
      setHeroes((prev) =>
        prev.map((h) => {
          if (h.id !== heroId) return h;
          const addedXp = item.effect!.xpAmount!;
          let newXp = h.currentXp + addedXp;
          let newLvl = h.level;
          let newReq = h.xpToNextLevel;
          while (newXp >= newReq) {
            newXp -= newReq;
            newLvl += 1;
            newReq = Math.round(newReq * 1.25);
          }
          return {
            ...h,
            level: newLvl,
            currentXp: newXp,
            xpToNextLevel: newReq,
            stats: {
              ...h.stats,
              attack: Math.round(h.stats.attack * Math.pow(1.08, newLvl - h.level)),
              maxHp: Math.round(h.stats.maxHp * Math.pow(1.08, newLvl - h.level)),
              hp: Math.round(h.stats.maxHp * Math.pow(1.08, newLvl - h.level)),
            },
          };
        })
      );
      sound.playSFX('upgrade');
    }

    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, count: i.count - 1 } : i)).filter((i) => i.count > 0)
    );
    return true;
  };

  const resetInventory = () => {
    setShelfInventory([]);
    safeStorage.setItem(STORAGE_SHELF_KEY, JSON.stringify([]));
    sound.playSFX('sparkle');
  };

  const addShelfItem = (itemToAdd: {
    id?: string;
    name: string;
    category?: 'materials' | 'food' | 'tools' | 'cards' | 'equipment';
    count?: number;
    icon: string;
    description?: string;
    rarity?: 'R' | 'SR' | 'SSR' | 'UR';
    priceGold?: number;
    effectType?: 'xp' | 'gold' | 'stat';
    effectValue?: number;
  }) => {
    setShelfInventory((prev) => {
      const cleanName = itemToAdd.name.trim();
      const itemId = itemToAdd.id || cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const addCount = Math.max(1, itemToAdd.count || 1);

      const existingIdx = prev.findIndex(
        (it) => it.id === itemId || it.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          count: copy[existingIdx].count + addCount,
        };
        return copy;
      }

      let cat = itemToAdd.category;
      if (!cat) {
        const lName = cleanName.toLowerCase();
        if (lName.includes('kit') || lName.includes('tinte')) {
          cat = 'tools';
        } else if (
          lName.includes('ramen') ||
          lName.includes('pizza') ||
          lName.includes('hamburguesa') ||
          lName.includes('pan') ||
          lName.includes('sushi') ||
          lName.includes('quesarito') ||
          lName.includes('comida') ||
          lName.includes('alimento') ||
          lName.includes('tortilla')
        ) {
          cat = 'food';
        } else if (lName.includes('grimorio') || lName.includes('carta') || lName.includes('baraja')) {
          cat = 'cards';
        } else if (lName.includes('anillo') || lName.includes('medallon') || lName.includes('marca')) {
          cat = 'equipment';
        } else {
          cat = 'materials';
        }
      }

      const newItem: ShelfItem = {
        id: itemId,
        name: cleanName,
        category: cat,
        count: addCount,
        icon: itemToAdd.icon,
        rarity: itemToAdd.rarity || 'SR',
        description: itemToAdd.description || `${cleanName} adquirido en el mercado de Icespear.`,
        priceGold: itemToAdd.priceGold || 150,
        effectType: itemToAdd.effectType || (cat === 'food' ? 'xp' : undefined),
        effectValue: itemToAdd.effectValue || (cat === 'food' ? 300 : undefined),
      };

      return [...prev, newItem];
    });
  };

  const consumeShelfItem = (itemId: string): boolean => {
    const item = shelfInventory.find((it) => it.id === itemId);
    if (!item || item.count <= 0) return false;

    if (item.effectType === 'xp' && item.effectValue) {
      const addedXp = item.effectValue;
      setHeroes((prev) =>
        prev.map((h) => {
          let newXp = h.currentXp + addedXp;
          let newLvl = h.level;
          let newReq = h.xpToNextLevel;
          while (newXp >= newReq) {
            newXp -= newReq;
            newLvl += 1;
            newReq = Math.round(newReq * 1.25);
          }
          return {
            ...h,
            level: newLvl,
            currentXp: newXp,
            xpToNextLevel: newReq,
          };
        })
      );
      sound.playSFX('upgrade');
    }

    setShelfInventory((prev) =>
      prev
        .map((it) => (it.id === itemId ? { ...it, count: it.count - 1 } : it))
        .filter((it) => it.count > 0)
    );
    return true;
  };

  const sellShelfItem = (itemId: string): boolean => {
    const item = shelfInventory.find((it) => it.id === itemId);
    if (!item || item.count <= 0) return false;

    addGold(item.priceGold);
    setShelfInventory((prev) =>
      prev
        .map((it) => (it.id === itemId ? { ...it, count: it.count - 1 } : it))
        .filter((it) => it.count > 0)
    );
    sound.playSFX('coin');
    return true;
  };

  const removeShelfItem = (itemId: string, count: number = 1): boolean => {
    let success = false;
    setShelfInventory((prev) => {
      const idx = prev.findIndex((it) => it.id === itemId);
      if (idx === -1 || prev[idx].count < count) return prev;
      success = true;
      const copy = [...prev];
      if (copy[idx].count <= count) {
        copy.splice(idx, 1);
      } else {
        copy[idx] = { ...copy[idx], count: copy[idx].count - count };
      }
      return copy;
    });
    return success;
  };

  const getMaterialCount = (icon: string, name?: string): number => {
    const clean = (s?: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const targetIcon = clean(icon);
    const targetName = clean(name);

    let total = 0;

    const matches = (itIconStr: string, itNameStr: string, itIdStr: string) => {
      const itIcon = clean(itIconStr);
      const itName = clean(itNameStr);
      const itId = clean(itIdStr);

      // Exact or substring path matching
      if (targetIcon && (itIcon === targetIcon || itIcon.includes(targetIcon) || targetIcon.includes(itIcon))) return true;
      if (targetName && (itName === targetName || itName.includes(targetName) || targetName.includes(itName))) return true;
      if (targetName && (itId.includes(targetName) || targetName.includes(itId))) return true;

      // Mango de Lanza vs Mango de Espada
      const targetIsLanzaHandle = targetIcon.includes('lanza') || targetName.includes('lanza');
      const itemIsLanzaHandle = itIcon.includes('lanza') || itName.includes('lanza') || itId.includes('lanza');
      if (targetIsLanzaHandle && itemIsLanzaHandle) return true;
      if (targetIsLanzaHandle && !itemIsLanzaHandle) return false;

      // Mango de Espada
      if (
        (targetIcon.includes('mango') || targetName.includes('mango')) &&
        (itIcon.includes('mango') || itName.includes('mango') || itId.includes('mango')) &&
        !itemIsLanzaHandle
      ) {
        return true;
      }

      // Lingote de Hierro
      const isTargetIron =
        (targetIcon.includes('lingote') || targetName.includes('hierro')) &&
        !targetIcon.includes('plata') &&
        !targetIcon.includes('oro') &&
        !targetIcon.includes('cobre') &&
        !targetIcon.includes('electrum') &&
        !targetIcon.includes('mithrill') &&
        !targetIcon.includes('netherita');
      if (
        isTargetIron &&
        (itName.includes('hierro') || itId.includes('hierro') || itIcon.includes('lingote_app'))
      ) {
        return true;
      }

      // Lingotes específicos
      if (targetIcon.includes('plata') && (itName.includes('plata') || itIcon.includes('plata') || itId.includes('plata'))) return true;
      if (targetIcon.includes('cobre') && (itName.includes('cobre') || itIcon.includes('cobre') || itId.includes('cobre'))) return true;
      if (targetIcon.includes('oro') && (itName.includes('oro') || itIcon.includes('oro') || itId.includes('oro'))) return true;
      if (targetIcon.includes('electrum') && (itName.includes('electrum') || itIcon.includes('electrum') || itId.includes('electrum'))) return true;
      if (targetIcon.includes('mithrill') && (itName.includes('mithrill') || itIcon.includes('mithrill') || itId.includes('mithrill'))) return true;
      if (targetIcon.includes('netherita') && (itName.includes('netherita') || itIcon.includes('netherita') || itId.includes('netherita'))) return true;
      if (targetIcon.includes('estelar') && (itName.includes('estelar') || itIcon.includes('estelar') || itId.includes('estelar'))) return true;

      // Quitina & Cryovain
      if (targetIcon.includes('quitina') && (itName.includes('quitina') || itIcon.includes('quitina') || itId.includes('quitina'))) return true;
      if (targetIcon.includes('cryovain') && (itName.includes('cryovain') || itIcon.includes('cryovain') || itId.includes('cryovain'))) return true;

      // Kits
      if (targetIcon.includes('herreria') && (itIcon.includes('herreria') || itName.includes('herreria') || itId.includes('herreria'))) return true;
      if (targetIcon.includes('joyeria') && (itIcon.includes('joyeria') || itName.includes('joyeria') || itId.includes('joyeria'))) return true;
      if (targetIcon.includes('inscripcion') && (itIcon.includes('inscripcion') || itName.includes('inscripcion') || itId.includes('inscripcion'))) return true;
      if (targetIcon.includes('peleteria') && (itIcon.includes('peleteria') || itName.includes('peleteria') || itId.includes('peleteria'))) return true;

      return false;
    };

    shelfInventory.forEach((it) => {
      if (matches(it.icon, it.name, it.id)) total += it.count;
    });

    inventory.forEach((it) => {
      if (matches(it.icon, it.name, it.id)) total += it.count;
    });

    return total;
  };

  const deductMaterials = (requirements: { icon: string; name?: string; count: number }[]): boolean => {
    // 1. Verify player has all materials first
    for (const req of requirements) {
      if (getMaterialCount(req.icon, req.name) < req.count) {
        return false;
      }
    }

    // 2. Deduct from shelfInventory
    setShelfInventory((prev) => {
      const copy = prev.map((item) => ({ ...item }));

      for (const req of requirements) {
        let needed = req.count;
        const clean = (s?: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        const targetIcon = clean(req.icon);
        const targetName = clean(req.name);

        for (let i = 0; i < copy.length && needed > 0; i++) {
          const it = copy[i];
          const itIcon = clean(it.icon);
          const itName = clean(it.name);
          const itId = clean(it.id);

          const isDirect = targetIcon && (itIcon === targetIcon || itIcon.includes(targetIcon) || targetIcon.includes(itIcon));
          const isName = targetName && (itName === targetName || itName.includes(targetName) || targetName.includes(itName));
          const isId = targetName && (itId.includes(targetName) || targetName.includes(itId));

          const isTargetLanzaHandle = targetIcon.includes('lanza') || targetName.includes('lanza');
          const isItemLanzaHandle = itIcon.includes('lanza') || itName.includes('lanza') || itId.includes('lanza');
          const isLanzaHandle = isTargetLanzaHandle && isItemLanzaHandle;

          const isSwordHilt =
            !isTargetLanzaHandle &&
            !isItemLanzaHandle &&
            (targetIcon.includes('mango') || targetName.includes('mango')) &&
            (itIcon.includes('mango') || itName.includes('mango') || itId.includes('mango'));

          const isTargetIron =
            (targetIcon.includes('lingote') || targetName.includes('hierro')) &&
            !targetIcon.includes('plata') &&
            !targetIcon.includes('oro') &&
            !targetIcon.includes('cobre') &&
            !targetIcon.includes('electrum') &&
            !targetIcon.includes('mithrill') &&
            !targetIcon.includes('netherita');
          const isIronIngot =
            isTargetIron &&
            (itName.includes('hierro') || itId.includes('hierro') || itIcon.includes('lingote_app'));

          const isPlata = targetIcon.includes('plata') && (itName.includes('plata') || itIcon.includes('plata') || itId.includes('plata'));
          const isCobre = targetIcon.includes('cobre') && (itName.includes('cobre') || itIcon.includes('cobre') || itId.includes('cobre'));
          const isOro = targetIcon.includes('oro') && (itName.includes('oro') || itIcon.includes('oro') || itId.includes('oro'));
          const isElectrum = targetIcon.includes('electrum') && (itName.includes('electrum') || itIcon.includes('electrum') || itId.includes('electrum'));
          const isQuitina = targetIcon.includes('quitina') && (itName.includes('quitina') || itIcon.includes('quitina') || itId.includes('quitina'));
          const isCryovain = targetIcon.includes('cryovain') && (itName.includes('cryovain') || itIcon.includes('cryovain') || itId.includes('cryovain'));
          const isKitHerreria = targetIcon.includes('herreria') && (itIcon.includes('herreria') || itName.includes('herreria') || itId.includes('herreria'));
          const isKitJoyeria = targetIcon.includes('joyeria') && (itIcon.includes('joyeria') || itName.includes('joyeria') || itId.includes('joyeria'));
          const isKitInscripcion = targetIcon.includes('inscripcion') && (itIcon.includes('inscripcion') || itName.includes('inscripcion') || itId.includes('inscripcion'));

          if (
            isDirect ||
            isName ||
            isId ||
            isLanzaHandle ||
            isSwordHilt ||
            isIronIngot ||
            isPlata ||
            isCobre ||
            isOro ||
            isElectrum ||
            isQuitina ||
            isCryovain ||
            isKitHerreria ||
            isKitJoyeria ||
            isKitInscripcion
          ) {
            const deduct = Math.min(it.count, needed);
            it.count -= deduct;
            needed -= deduct;
          }
        }
      }

      return copy.filter((it) => it.count > 0);
    });

    return true;
  };

  const resetAllData = () => {
    safeStorage.clear();
    setGold(3500);
    setSummonCrystals(1000);
    setAstralShards(120);
    setHeroes(INITIAL_HEROES.filter((h) => ['kairon', 'edacorn', 'roxanne', 'magordito'].includes(h.id)));
    setTeam(['edacorn', 'kairon', 'roxanne', 'magordito']);
    setInventory(INITIAL_INVENTORY);
    setShelfInventory([]);
    setEquipment(INITIAL_EQUIPMENT);
    setActivePatrols([]);
    setQuestProgress(createQuestProgressState({
      chapter: 1,
      completedMissions: ['m1_tirano'],
      stars: { m1_tirano: 3 },
      allMissionsCompleted: false,
    }));
    setMailItems(DEFAULT_MAIL);
  };

  const restoreGameState = (data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      if (typeof data.gold === 'number') setGold(data.gold);
      if (typeof data.summonCrystals === 'number') setSummonCrystals(data.summonCrystals);
      if (typeof data.astralShards === 'number') setAstralShards(data.astralShards);
      if (typeof data.playerName === 'string') setPlayerName(data.playerName);
      if (Array.isArray(data.heroes)) setHeroes(data.heroes);
      if (Array.isArray(data.team)) setTeam(data.team);
      if (Array.isArray(data.inventory)) setInventory(data.inventory);
      if (Array.isArray(data.shelfInventory)) setShelfInventory(data.shelfInventory);
      if (Array.isArray(data.equipment)) setEquipment(data.equipment);
      if (data.questProgress && typeof data.questProgress === 'object') setQuestProgress(createQuestProgressState(data.questProgress));
      return true;
    } catch (e) {
      console.error('Error restoring game state:', e);
      return false;
    }
  };

  const navigateTo = (tab: string) => {
    sound.playSFX('click');
    setHistoryStack((prev) => [...prev, tab]);
    setCurrentTab(tab);
  };

  const goBack = () => {
    sound.playSFX('click');
    if (currentTab === 'forge' || currentTab === 'potions') {
      if (forgeSubcategory) {
        setForgeSubcategory(null);
        return;
      }
      if (forgeCategory) {
        setForgeCategory('');
        return;
      }
    }
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop(); // remove current
      const prev = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      setCurrentTab(prev);
    } else {
      setCurrentTab('santuario');
      setHistoryStack(['santuario']);
    }
  };

  const isMissionCompleted = (missionId: string): boolean => {
    if (questProgress.allMissionsCompleted) return true;
    return questProgress.completedMissions.includes(missionId);
  };

  const completeQuestMission = (missionId: string, stars: number) => {
    setQuestProgress((prev) => {
      const completed = prev.completedMissions.includes(missionId)
        ? prev.completedMissions
        : [...prev.completedMissions, missionId];
      const newStars = {
        ...prev.stars,
        [missionId]: Math.max(prev.stars[missionId] || 0, stars),
      };
      let nextChapter = prev.chapter;
      if (missionId === 'm4_puertas_selladas') {
        nextChapter = Math.max(prev.chapter, 2);
      } else if (missionId === 'm7_epilogo_aldea') {
        nextChapter = Math.max(prev.chapter, 3);
      } else if (missionId === 'm10_hobgoblin_boss') {
        nextChapter = Math.max(prev.chapter, 4);
      }
      const updated = createQuestProgressState({
        chapter: prev.allMissionsCompleted ? 99 : nextChapter,
        completedMissions: completed,
        stars: newStars,
        allMissionsCompleted: prev.allMissionsCompleted,
      });
      safeStorage.setItem(`${STORAGE_KEY}_quest_progress`, JSON.stringify({
        chapter: updated.chapter,
        completedMissions: Array.isArray(updated.completedMissions) ? Array.from(updated.completedMissions) : completed,
        stars: updated.stars,
        allMissionsCompleted: updated.allMissionsCompleted,
      }));
      playGames.unlockAchievement('ach_first_victory');
      return updated;
    });
  };

  const completeAllMissions = () => {
    const allKnownMissionIds = [
      'm1_tirano',
      'm2_robo',
      'm3_bosque',
      'm4_puertas_selladas',
      'm5_minas_historia',
      'm3_cuevas_rojo',
      'm4_cuevas_azul',
      'm5_cuevas_zancudo',
      'm6_cuevas_titan',
      'm6_puerta_laberinto',
      'm7_cuevas_reina',
      'm7_epilogo_aldea',
      'm8_intro_capitulo3',
      'm9_emboscada_ferton',
      'm10_hobgoblin_boss',
    ];
    // Seed placeholder missions m11..m100 for all future missions and chapters
    for (let i = 11; i <= 100; i++) {
      allKnownMissionIds.push(`m${i}`);
    }

    const allStars: Record<string, number> = {};
    allKnownMissionIds.forEach((id) => {
      allStars[id] = 3;
    });

    const updated = createQuestProgressState({
      chapter: 99,
      completedMissions: allKnownMissionIds,
      stars: allStars,
      allMissionsCompleted: true,
    });

    setQuestProgress(updated);
    safeStorage.setItem(`${STORAGE_KEY}_quest_progress`, JSON.stringify({
      chapter: 99,
      completedMissions: allKnownMissionIds,
      stars: allStars,
      allMissionsCompleted: true,
    }));
    playGames.unlockAchievement('ach_first_victory');
    playGames.unlockAchievement('ach_chapter_1');
    sound.playSFX('powerup');
  };

  const claimMailReward = (id: string) => {
    setMailItems((prev) =>
      prev.map((m) => {
        if (m.id !== id || m.claimed) return m;
        if (m.rewardGold) addGold(m.rewardGold);
        if (m.rewardCrystals) addCrystals(m.rewardCrystals);
        sound.playSFX('coin');
        return { ...m, claimed: true, read: true };
      })
    );
  };

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_mail`, JSON.stringify(mailItems));
  }, [mailItems]);

  useEffect(() => {
    safeStorage.setItem(`${STORAGE_KEY}_player_name`, JSON.stringify(playerName));
  }, [playerName]);

  return (
    <GameContext.Provider
      value={{
        gold,
        summonCrystals,
        astralShards,
        playerName,
        setPlayerName,
        heroes,
        team,
        inventory,
        shelfInventory,
        addShelfItem,
        consumeShelfItem,
        sellShelfItem,
        removeShelfItem,
        resetInventory,
        equipment,
        activePatrols,
        currentTab,
        setCurrentTab,
        navigateTo,
        goBack,
        activeSanctuary,
        setActiveSanctuary,
        selectedBanner,
        setSelectedBanner,
        questProgress,
        isMissionCompleted,
        activeQuestChapter,
        setActiveQuestChapter,
        completeQuestMission,
        completeAllMissions,
        selectedCombatMissionId,
        setSelectedCombatMissionId,
        isMailboxOpen,
        setIsMailboxOpen,
        isOptionsOpen,
        setIsOptionsOpen,
        isPlayGamesOpen,
        setIsPlayGamesOpen,
        openPlayGames,
        mailItems,
        claimMailReward,
        forgeCategory,
        setForgeCategory,
        forgeSubcategory,
        setForgeSubcategory,
        addGold,
        addCrystals,
        addAstralShards,
        setTeamSlot,
        setEntireTeam,
        summon,
        levelUpHero,
        startPatrol,
        claimPatrol,
        equipHeroItem,
        unequipHeroItem,
        upgradeEquipmentItem,
        forgeNewEquipment,
        buyShopItem,
        useInventoryItem,
        setHeroes,
        banners,
        setBanners,
        isGitHubManagerOpen,
        setIsGitHubManagerOpen,
        claimIdleEarnings,
        idleEarningsAvailable,
        getMaterialCount,
        deductMaterials,
        resetAllData,
        restoreGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
