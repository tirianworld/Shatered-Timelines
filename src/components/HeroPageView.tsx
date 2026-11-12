import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Crown, Gem, Lock, Shirt, Sparkles, Sword, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameHeader } from './GameHeader';
import { sound } from '../services/soundService';
import { INITIAL_HEROES } from '../data/heroesData';

/**
 * Clon 1:1 de los menús de héroe de Unity (Cdd Idle MKIII).
 * Cada sección usa la plantilla original del juego como fondo y coloca
 * los datos encima, en los huecos reales de la plantilla.
 */

const A = '/assets/heropage';

type HeroTab = 'descripcion' | 'equipo' | 'nivel' | 'despertar' | 'skins';
type EquipmentCategory = 'helmet' | 'armor' | 'weapon' | 'ring' | 'accessory';

/** Páginas del héroe. `cropTop` recorta la franja oscura superior de cada plantilla. */
const PAGES: { id: HeroTab; label: string; template: string; width: number; height: number; cropTop: number }[] = [
  {
    id: 'descripcion',
    label: 'DESCRIPCIÓN',
    template: `${A}/fondo_personajes_1.png`,
    width: 841,
    height: 1871,
    cropTop: 0.155,
  },
  { id: 'equipo', label: 'EQUIPO', template: `${A}/fondo_equipo.png`, width: 852, height: 1846, cropTop: 0.15 },
  { id: 'nivel', label: 'NIVEL', template: `${A}/fondo_xp_pagina.png`, width: 853, height: 1844, cropTop: 0.15 },
  {
    id: 'despertar',
    label: 'DESPERTAR',
    template: `${A}/fondo_despertar_arlem.png`,
    width: 853,
    height: 1844,
    cropTop: 0.15,
  },
  { id: 'skins', label: 'SKINS', template: `${A}/marco_skin.png`, width: 863, height: 1823, cropTop: 0.178 },
];

const ATTRIBUTE_ORB: Record<string, string> = {
  Arcano: '/assets/items/atributo arcano.png',
  Natural: '/assets/items/atributo natural.png',
  Divino: '/assets/items/atributo fe.png',
  Profano: '/assets/items/atributo OSCURO.png',
  Hielo: '/assets/items/atributo natural.png',
};

/** Arte de cuerpo completo de cada héroe (sprites originales del proyecto Unity). */
const HERO_ART: Record<string, string> = {
  arlem_diaz: `${A}/arte_cruzado2.png`,
  kairon: `${A}/arte_kairon.png`,
  el_baron: `${A}/arte_el_baron.png`,
  pepe_loux: `${A}/arte_pepe_loux.png`,
  prometeo: `${A}/arte_prometeo.png`,
  roxanne: `${A}/arte_roxanne.png`,
  ragnavaldr: `${A}/arte_ragnavaldr.png`,
  smurph_draco: `${A}/arte_smurph_draco.png`,
  magordito: `${A}/arte_magordito.png`,
  edacorn: `${A}/arte_edacorn.png`,
};

/** Raza de cada héroe (icono + nombre) para el panel PERSONAJE. */
const HERO_RACE: Record<string, { label: string; icon: string }> = {
  edacorn: { label: 'Aasimar', icon: `${A}/raza_aasimar.png` },
  pepe_loux: { label: 'Enano', icon: `${A}/raza_enano.png` },
};
const DEFAULT_RACE = { label: 'Humano', icon: `${A}/raza_humano.png` };

const RARITY_BADGE: Record<string, string> = {
  SSR: `${A}/rarity_sr.png`,
  SR: `${A}/rarity_sr.png`,
  R: '/assets/ui/marco_r.png',
  UR: '/assets/ui/marco_ur.png',
};

/** Materiales de mejora del Despertar, tomados de Unity (Assets/Resources/Items Mejora). */
const AWAKEN_MATERIALS: Record<string, { name: string; icon: string; stars: number }> = {
  pergamino_natural: { name: 'Pergamino Natural', icon: `${A}/mat_pergamino_natural.png`, stars: 4 },
  pergamino_arcano: { name: 'Pergamino Arcano', icon: `${A}/mat_pergamino_arcano.png`, stars: 4 },
  pergamino_divino: { name: 'Pergamino Divino', icon: `${A}/mat_pergamino_divino.png`, stars: 4 },
  pergamino_oscuro: { name: 'Pergamino Oscuro', icon: `${A}/mat_pergamino_oscuro.png`, stars: 4 },
  grimorio_culto: { name: 'Grimorio del Culto a los Dragones', icon: `${A}/mat_grimorio_culto.png`, stars: 4 },
  grimorio_luz_solar: { name: 'Grimorio de la Luz Solar', icon: `${A}/mat_grimorio_luz_solar.png`, stars: 4 },
  grimorio_luna_oscura: { name: 'Grimorio de la Luna Oscura', icon: `${A}/mat_grimorio_luna_oscura.png`, stars: 4 },
  grimorio_piedad: { name: 'Grimorio de la Piedad', icon: `${A}/mat_grimorio_piedad.png`, stars: 4 },
  grimorio_tres_sables: { name: 'Grimorio de los Tres Sables', icon: `${A}/mat_grimorio_tres_sables.png`, stars: 4 },
  sello_caldo_dragon: { name: 'Sello Caldo de Dragón', icon: `${A}/mat_sello_caldo_dragon.png`, stars: 5 },
  emblema_mercado_negro: { name: 'Insignia Mercado Negro', icon: `${A}/mat_emblema_mercado_negro.png`, stars: 4 },
};

/** Set del panel Despertar de cada héroe en Unity: [pergamino, grimorio, sello/insignia]. */
const AWAKEN_KITS: Record<string, [string, string, string]> = {
  arlem_diaz: ['pergamino_arcano', 'grimorio_culto', 'sello_caldo_dragon'],
  kairon: ['pergamino_oscuro', 'grimorio_luz_solar', 'sello_caldo_dragon'],
  edacorn: ['pergamino_oscuro', 'grimorio_piedad', 'sello_caldo_dragon'],
  roxanne: ['pergamino_oscuro', 'grimorio_luna_oscura', 'sello_caldo_dragon'],
  el_baron: ['pergamino_oscuro', 'grimorio_tres_sables', 'emblema_mercado_negro'],
  prometeo: ['pergamino_oscuro', 'grimorio_piedad', 'sello_caldo_dragon'],
  ragnavaldr: ['pergamino_oscuro', 'grimorio_piedad', 'sello_caldo_dragon'],
  smurph_draco: ['pergamino_oscuro', 'grimorio_culto', 'sello_caldo_dragon'],
};

const ATTR_PERGAMINO: Record<string, string> = {
  Natural: 'pergamino_natural',
  Arcano: 'pergamino_arcano',
  Divino: 'pergamino_divino',
  Profano: 'pergamino_oscuro',
};

const AWAKEN_QTY = [5, 1, 10];
const AWAKEN_GOLD = 50000;

/** Cada tipo de objeto del inventario cae en una de las cinco categorías del Equipo. */
const equipCategoryOf = (type: string): EquipmentCategory => {
  if (type === 'helmet') return 'helmet';
  if (type === 'armor') return 'armor';
  if (type === 'weapon') return 'weapon';
  if (type === 'ring') return 'ring';
  return 'accessory';
};

const rarityDotColor = (rarity?: string) =>
  rarity === 'UR' ? '#f97316' : rarity === 'SSR' ? '#c084fc' : rarity === 'SR' ? '#6ee7ff' : '#fbbf24';

const EQUIP_CATEGORIES: { id: EquipmentCategory; label: string; Icon: typeof Sword }[] = [
  { id: 'helmet', label: 'Cascos', Icon: Crown },
  { id: 'armor', label: 'Armaduras', Icon: Shirt },
  { id: 'weapon', label: 'Armas', Icon: Sword },
  { id: 'ring', label: 'Anillos', Icon: Gem },
  { id: 'accessory', label: 'Abalorios', Icon: Sparkles },
];

/** Materiales de sastrería con los que se fabrican las skins (iconos del juego). */
const SKIN_MATS = {
  libro: { name: 'Libro Sagrado', icon: `${A}/skinmat_libro.png` },
  arapos: { name: 'Montón de Arapos', icon: `${A}/skinmat_arapos.png` },
  hadas: { name: 'Polvo de Hadas', icon: `${A}/skinmat_polvo_hadas.png` },
  paquetes: { name: 'Paquetes Sospechosos', icon: `${A}/skinmat_paquetes.png` },
  colmillos: { name: 'Colmillos Desgastados', icon: `${A}/skinmat_colmillo.png` },
  huesos: { name: 'Fragmentos Óseos', icon: `${A}/skinmat_huesos.png` },
  talisman: { name: 'Talismán de Jefe Orco', icon: `${A}/skinmat_talisman.png` },
};

const SKINS = [
  {
    id: 'clasico',
    name: 'Clásico',
    subtitle: 'Aspecto base del héroe',
    art: `${A}/skin_clasico.png`,
    description: 'Atuendo de bardo errante, cosido en la sastrería más prestigiosa de Moonhaven.',
    bonus: 'Sin bonificación adicional.',
    owned: true,
    materials: [
      { ...SKIN_MATS.libro, count: 1 },
      { ...SKIN_MATS['arapos'], count: 2 },
      { ...SKIN_MATS.hadas, count: 1 },
      { ...SKIN_MATS.paquetes, count: 1 },
    ],
  },
  {
    id: 'monje',
    name: 'Atuendo Monástico',
    subtitle: 'Ropajes de la iglesia',
    art: `${A}/skin_monje.png`,
    description: 'Ropajes prestados por la Iglesia de Freya al encontrarte desnudo en su puerta.',
    bonus: '+8% Defensa · reduce el daño recibido de Profano.',
    owned: false,
    materials: [
      { ...SKIN_MATS.libro, count: 1 },
      { ...SKIN_MATS['arapos'], count: 3 },
      { ...SKIN_MATS.hadas, count: 2 },
      { ...SKIN_MATS.paquetes, count: 2 },
    ],
  },
  {
    id: 'orco',
    name: 'Orco Ilusorio',
    subtitle: 'Ilusión de Gromock',
    art: `${A}/skin_orco.png`,
    description: 'Ilusión creada por Arlem para engañar a Gromock y a su horda.',
    bonus: '+15% al Ataque · cuenta como Semiorco.',
    owned: false,
    materials: [
      { ...SKIN_MATS.colmillos, count: 2 },
      { ...SKIN_MATS.huesos, count: 3 },
      { ...SKIN_MATS.hadas, count: 2 },
      { ...SKIN_MATS.talisman, count: 1 },
    ],
  },
];

/** Skins desbloqueadas (se guardan aparte de la partida en curso). */
const SKIN_STORE_KEY = 'cdd_gacha_2_save_v1_unlocked_skins';

/** Posición de los cuatro huecos de material que trae la plantilla de skins. */
const SKIN_SLOT_LEFT = ['11%', '29.5%', '48%', '66.5%'];

const fmt = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

const starCountFor = (rarity?: string) => (rarity === 'SSR' || rarity === 'UR' ? 5 : rarity === 'SR' ? 4 : 3);

const StatTile: React.FC<{ icon: string; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="relative my-[15px] mx-[-0.5px] h-[75px] grow-0 self-stretch flex flex-col items-center justify-center rounded-[7px] border-[4px] border-[#2e1100] bg-[#06112a] text-black shadow-[inset_0_1px_0_rgba(255,196,110,0.25),0_2px_4px_rgba(0,0,0,0.45)] py-[3px]">
    <img src={icon} alt="" className="w-[21px] h-[21px] object-contain drop-shadow" />
    <span className="mt-[1px] font-mono text-[10.5px] font-black leading-none text-[#f6c46a]">{value}</span>
    <span className="text-[7.5px] font-black uppercase leading-tight tracking-[0.02em] text-[#f6c46a]/80">
      {label}
    </span>
  </div>
);

const DarkSlot: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full h-full rounded-[6px] border border-[#6b3a14] bg-[#23100a] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
    {children}
  </div>
);

interface HeroPageViewProps {
  heroId: string;
  onClose: () => void;
}

export const HeroPageView: React.FC<HeroPageViewProps> = ({ heroId, onClose }) => {
  const {
    heroes,
    gold,
    addGold,
    astralShards,
    inventory,
    shelfInventory,
    deductMaterials,
    getMaterialCount,
    useInventoryItem,
    awakenHero,
    equipment,
    getOwnedEquipment,
    equipHeroItem,
    unequipHeroItem,
    upgradeEquipmentItem,
  } = useGame();
  const [tab, setTab] = useState<HeroTab>('descripcion');
  const [skinIndex, setSkinIndex] = useState(0);
  // Skins desbloqueadas: se fabrican con materiales y se guardan aparte.
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SKIN_STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === 'string');
    } catch {
      /* guardado ilegible: se usan las skins de serie */
    }
    return SKINS.filter((s) => s.owned).map((s) => s.id);
  });
  const [equipTab, setEquipTab] = useState<EquipmentCategory>('weapon');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeItemId, setUpgradeItemId] = useState<string | null>(null);
  const [kitAssigned, setKitAssigned] = useState(0);
  const kitAssignedRef = useRef(0);
  const kitLimitsRef = useRef({ need: 0, remaining: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [assigned, setAssigned] = useState<Record<string, number>>({});
  const assignedRef = useRef<Record<string, number>>({});
  const [matAssigned, setMatAssigned] = useState<Record<string, number>>({});
  const matAssignedRef = useRef<Record<string, number>>({});
  const pressRef = useRef<{
    itemId: string;
    direction: 1 | -1;
    mode: 'xp' | 'mat' | 'kit';
    x: number;
    y: number;
    timer: number | null;
    ticks: number;
    moved: boolean;
  } | null>(null);

  const baseHero = useMemo(() => INITIAL_HEROES.find((h) => h.id === heroId), [heroId]);
  const ownedHero = useMemo(() => heroes.find((h) => h.id === heroId), [heroes, heroId]);

  if (!baseHero) return null;

  const hero = ownedHero ?? baseHero;
  const stats = hero.stats;
  const stars = Math.min(5, Math.max(1, hero.stars ?? 1));
  const isArlem = hero.id === 'arlem_diaz';
  const level = hero.level ?? 1;
  const maxLevel = 60;
  const activeSkin = SKINS[skinIndex] ?? SKINS[0];

  const isSkinUnlocked = (id: string) => unlockedSkins.includes(id);
  const skinHas = (m: { icon: string; name: string }) => getMaterialCount(m.icon, m.name);
  const canCraftSkin = (skin: (typeof SKINS)[number]) =>
    !isSkinUnlocked(skin.id) && skin.materials.every((m) => skinHas(m) >= m.count);

  const craftSkin = () => {
    const skin = SKINS[skinIndex];
    if (!skin || isSkinUnlocked(skin.id)) return;
    const requirements = skin.materials.map((m) => ({ icon: m.icon, name: m.name, count: m.count }));
    if (!deductMaterials(requirements)) {
      sound.playSFX('hurt');
      return;
    }
    const next = [...unlockedSkins, skin.id];
    setUnlockedSkins(next);
    try {
      localStorage.setItem(SKIN_STORE_KEY, JSON.stringify(next));
    } catch {
      /* sin persistencia: la skin queda desbloqueada en esta sesión */
    }
    sound.playSFX('click');
  };

  const hp = Math.round(stats.hp);
  const atk = Math.round(stats.attack * 10) / 10;
  const def = Math.round(stats.defense * 10) / 10;
  const energy = Math.round(stats.speed);
  const luck = Math.round(stats.critRate * 1000) / 10;

  const statCards = [
    { label: 'Vida', value: fmt(hp), icon: `${A}/stat_vida.png` },
    { label: 'Ataque', value: fmt(atk), icon: `${A}/stat_ataque.png` },
    { label: 'Defensa', value: fmt(def), icon: `${A}/stat_defensa.png` },
    { label: 'Energía', value: fmt(energy), icon: `${A}/stat_energia.png` },
    { label: 'Suerte', value: fmt(luck), icon: `${A}/stat_suerte.png` },
  ];

  const goTab = (next: HeroTab) => {
    sound.playSFX('click');
    setTab(next);
  };

  /* ---- Asignación de pociones de EXP: toque = 1, mantener = uno a uno acelerando ---- */

  const xpPotions = inventory.filter((i) => (i.effect?.xpAmount ?? 0) > 0);
  const potionsRef = useRef(xpPotions);
  potionsRef.current = xpPotions;

  /* ---- Materiales del Despertar: mismo set que el panel de Unity ---- */

  const awakenKit: string[] =
    AWAKEN_KITS[hero.id] ?? [
      ATTR_PERGAMINO[hero.attribute] ?? 'pergamino_natural',
      'grimorio_culto',
      'sello_caldo_dragon',
    ];
  const awakenRequirements = awakenKit.map((id, i) => {
    const material = AWAKEN_MATERIALS[id] ?? AWAKEN_MATERIALS.pergamino_natural;
    return {
      ...material,
      id,
      need: AWAKEN_QTY[i] ?? 1,
      owned: inventory.find((it) => it.id === id)?.count ?? 0,
    };
  });
  const awakenReqRef = useRef(awakenRequirements);
  awakenReqRef.current = awakenRequirements;

  const matAssignedTotal = awakenRequirements.reduce((sum, r) => sum + (matAssigned[r.id] ?? 0), 0);
  const matNeedTotal = awakenRequirements.reduce((sum, r) => sum + r.need, 0);
  const allMaterialsAssigned = awakenRequirements.every((r) => (matAssigned[r.id] ?? 0) >= r.need);
  const canAwaken = allMaterialsAssigned && gold >= AWAKEN_GOLD;

  const applyAwakening = () => {
    const pending = awakenRequirements.map((r) => ({ id: r.id, count: matAssigned[r.id] ?? 0 }));
    if (pending.some((p, i) => p.count < awakenRequirements[i].need)) {
      sound.playSFX('hurt');
      return;
    }
    if (!awakenHero(hero.id, pending, AWAKEN_GOLD)) return;
    matAssignedRef.current = {};
    setMatAssigned({});
  };

  const writeAssigned = (next: Record<string, number>) => {
    assignedRef.current = next;
    setAssigned(next);
  };

  /**
   * Asigna (o retira) UNA poción. Al asignar desde un tier superior, cuando ese
   * tier se agota sigue con los tiers inferiores, como en 7DS. Al retirar hace
   * lo mismo hacia abajo (primero el tier pulsado y luego los más baratos).
   *
   * En modo `mat` asigna materiales del Despertar, sin cascada y sin pasar de
   * lo que pide el Despertar ni de lo que hay en el inventario.
   */
  const stepAssign = (itemId: string, direction: 1 | -1, mode: 'xp' | 'mat' | 'kit' = 'xp'): boolean => {
    if (mode === 'kit') {
      const limit = kitLimitsRef.current;
      const current = kitAssignedRef.current;
      if (direction === 1) {
        if (current >= limit.need || current >= limit.remaining) return false;
        kitAssignedRef.current = current + 1;
        setKitAssigned(current + 1);
        return true;
      }
      if (current <= 0) return false;
      kitAssignedRef.current = current - 1;
      setKitAssigned(current - 1);
      return true;
    }

    if (mode === 'mat') {
      const requirement = awakenReqRef.current.find((r) => r.id === itemId);
      if (!requirement) return false;
      const current = matAssignedRef.current;
      const qty = current[itemId] ?? 0;
      if (direction === 1) {
        if (qty >= requirement.need || qty >= requirement.owned) return false;
        const next = { ...current, [itemId]: qty + 1 };
        matAssignedRef.current = next;
        setMatAssigned(next);
        return true;
      }
      if (qty <= 0) return false;
      const next = { ...current, [itemId]: qty - 1 };
      matAssignedRef.current = next;
      setMatAssigned(next);
      return true;
    }

    const list = potionsRef.current;
    const startIdx = list.findIndex((p) => p.id === itemId);
    if (startIdx < 0) return false;

    const current = assignedRef.current;
    for (let i = startIdx; i >= 0; i -= 1) {
      const potion = list[i];
      const qty = current[potion.id] ?? 0;
      const canChange = direction === 1 ? potion.count - qty > 0 : qty > 0;
      if (canChange) {
        writeAssigned({ ...current, [potion.id]: qty + direction });
        return true;
      }
    }
    return false;
  };

  const stopPress = () => {
    const press = pressRef.current;
    if (press && press.timer !== null) window.clearTimeout(press.timer);
    pressRef.current = null;
  };

  const pressTick = (press: {
    itemId: string;
    direction: 1 | -1;
    mode: 'xp' | 'mat' | 'kit';
    timer: number | null;
    ticks: number;
    moved: boolean;
  }) => {
    if (pressRef.current !== press || press.moved) return;
    press.timer = null;
    if (!stepAssign(press.itemId, press.direction, press.mode)) return;
    sound.playSFX('click');
    press.ticks += 1;
    // Cada vez más rápido: 150 ms y bajando hasta 45 ms.
    press.timer = window.setTimeout(() => pressTick(press), Math.max(45, 150 - press.ticks * 9));
  };

  const beginPress = (
    e: React.PointerEvent,
    itemId: string,
    direction: 1 | -1,
    mode: 'xp' | 'mat' | 'kit' = 'xp'
  ) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stopPress();
    const press = {
      itemId,
      direction,
      mode,
      x: e.clientX,
      y: e.clientY,
      timer: null as number | null,
      ticks: 0,
      moved: false,
    };
    pressRef.current = press;
    press.timer = window.setTimeout(() => pressTick(press), 300);
  };

  /** Cualquier arrastre (scroll) cancela la pulsación: nunca asigna de más. */
  const movePress = (e: React.PointerEvent) => {
    const press = pressRef.current;
    if (!press) return;
    if (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10) {
      press.moved = true;
      stopPress();
    }
  };

  const endPress = (e: React.PointerEvent) => {
    const press = pressRef.current;
    if (!press) return;
    const isQuickTap = !press.moved && press.ticks === 0;
    stopPress();
    if (isQuickTap && e.type === 'pointerup') {
      if (stepAssign(press.itemId, press.direction, press.mode)) sound.playSFX('click');
    }
  };

  // Soltar fuera de la casilla o cancelar el gesto nunca asigna.
  useEffect(() => {
    const cancel = () => stopPress();
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, []);

  /** Coste en oro de la EXP asignada (mismo criterio que la pantalla de Unity). */
  const goldCostForXp = (xp: number) => Math.round(xp / 5);

  const applyAssignedPotions = () => {
    const pending = Object.entries(assigned).filter(([, qty]) => qty > 0);
    if (pending.length === 0) {
      sound.playSFX('click');
      return;
    }
    const totalXp = pending.reduce((sum, [itemId, qty]) => {
      const potion = inventory.find((i) => i.id === itemId);
      return sum + (potion?.effect?.xpAmount ?? 0) * qty;
    }, 0);
    const cost = goldCostForXp(totalXp);
    if (gold < cost) {
      sound.playSFX('hurt');
      return;
    }
    addGold(-cost);
    stopPress();
    pending.forEach(([itemId, qty]) => {
      for (let i = 0; i < qty; i += 1) useInventoryItem(itemId, hero.id);
    });
    writeAssigned({});
  };

  const page = PAGES.find((p) => p.id === tab)!;

  // Arte real del héroe; si el personaje no tiene sprite propio se usa su retrato.
  const heroArt = HERO_ART[hero.id] ?? hero.portrait ?? hero.backgroundArt ?? `${A}/arte_cruzado2.png`;

  /* ======================= Secciones ======================= */

  const renderDescripcion = () => (
    <>
      {/* PERSONAJE */}
      <div className="absolute left-[7%] top-[18%] w-[86%] h-[32.6%]">
        <img
          src={RARITY_BADGE[hero.rarity] ?? RARITY_BADGE.SR}
          alt={hero.rarity}
          className="absolute left-[1.5%] top-[2%] w-[23%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
        />
        <div className="absolute left-[27%] top-[4%] z-[1] w-[46%] leading-tight">
          <p className="font-serif text-[11px] font-black text-[#a85a1c]">[Caldo de Dragón]</p>
          <p className="font-serif text-[19px] font-black leading-none text-[#8a3b0e] drop-shadow-[0_1px_0_rgba(255,242,210,0.9)]">
            {hero.name}
          </p>
        </div>

        <div className="absolute left-[3%] top-[33%] w-[52%]">
          <p className="font-serif text-[20px] font-black text-[#40200a]">Despertar:</p>
          <div className="mt-[2px] flex items-center gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <img
                key={i}
                src={`${A}/estrella_mejora.png`}
                alt=""
                className={`w-[28px] h-[28px] object-contain ${i < stars ? '' : 'opacity-25 grayscale'}`}
              />
            ))}
          </div>
        </div>

        <div className="absolute left-[3%] top-[54%] w-[46%]">
          <p className="font-serif text-[20px] font-black text-[#40200a]">Atributo:</p>
          <div className="mt-[2px] flex items-center gap-[5px]">
            <img
              src={ATTRIBUTE_ORB[hero.attribute] ?? ATTRIBUTE_ORB.Natural}
              alt=""
              className="w-[34px] h-[34px] object-contain"
            />
            <span className="text-[20px] font-black text-[#3b1c06]">{hero.attribute}</span>
          </div>
        </div>

        <div className="absolute left-[3%] top-[76%] w-[52%]">
          <p className="font-serif text-[20px] font-black text-[#40200a]">Raza:</p>
          <div className="mt-[2px] flex items-center gap-[5px]">
            <img
              src={(HERO_RACE[hero.id] ?? DEFAULT_RACE).icon}
              alt=""
              className="w-[34px] h-[34px] object-contain"
            />
            <span className="text-[20px] font-black text-[#3b1c06]">{(HERO_RACE[hero.id] ?? DEFAULT_RACE).label}</span>
          </div>
        </div>

        {/* Retrato: enmascarado al hueco del panel para que el sprite no se salga del marco */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[53%] overflow-hidden">
          <img
            src={heroArt}
            alt={hero.name}
            className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.28)] ${
              isArlem
                ? // Doble de tamaño y enmascarado por el cuadro: solo se ve de rodillas hacia arriba.
                  'origin-top scale-[1.45] object-top'
                : 'origin-bottom object-bottom'
            }`}
          />
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="absolute left-[7%] top-[54.6%] w-[86%] h-[11%] grid grid-cols-5 gap-[3px]">
        {statCards.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* HABILIDAD PASIVA */}
      <img
        src={isArlem ? `${A}/pasiva_arlem.png` : `/assets/portraits/${hero.id}_icono.png`}
        alt="Habilidad pasiva"
        className="absolute left-[12%] top-[69.4%] w-[13%] object-contain drop-shadow"
      />
      <div className="absolute left-[28%] top-[69.6%] w-[56%]">
        <p className="mr-auto my-[10px] border-0 text-[13px] font-bold leading-[1.15] text-[#40200a]">
          Aumenta un 15% la defensa de todos los aliados de Atributo{' '}
          <span className="mr-auto text-[#1a91c9]">{hero.attribute}</span>
        </p>
      </div>

      {/* RANGO */}
      <img
        src={RARITY_BADGE[hero.rarity] ?? RARITY_BADGE.SR}
        alt={hero.rarity}
        className="absolute left-[8%] top-[79.8%] w-[18%] object-contain"
      />
      <div className="absolute left-[29%] top-[80.6%] w-[38%] leading-tight">
        <p className="mx-[2px] my-[8px] text-[10px] font-black text-[#5b3a1c]">
          {hero.rarity === 'SSR' ? 'Súper Raro' : hero.rarity === 'SR' ? 'Super Raro' : 'Raro'}
        </p>
        <p className="my-[-8px] text-[10.5px] font-black text-[#3b1c06]">Máximo Nivel:{maxLevel}</p>
      </div>
      <button
        type="button"
        onClick={() => sound.playSFX('click')}
        className="absolute right-[7%] top-[79.9%] w-[26%] h-[6%] rounded-[5px] border border-[#8a4a10] bg-gradient-to-b from-[#f0a03a] to-[#d97a12] text-[10.5px] font-black uppercase tracking-wide text-[#3a1a00] shadow-[inset_0_1px_0_rgba(255,225,160,0.7)] cursor-pointer active:scale-95 transition-transform"
      >
        Mejorar
      </button>

      {/* INFORMACIÓN */}
      <p className="absolute left-[7%] top-[91.2%] my-[2px] w-[86%] text-center font-[Palatino,serif] text-[14px] italic font-semibold leading-[1.2] text-[#40200a]">
        {hero.bio}
      </p>
    </>
  );

  const renderEquipo = () => {
    // Compatibilidad: antes los anillos se guardaban en el hueco de abalorios.
    const legacyRing = hero.equipped?.accessory?.type === 'ring' ? hero.equipped.accessory : undefined;

    const slotDefs = [
      { key: 'helmet' as const, label: 'Casco', item: hero.equipped?.helmet, side: 'left' as const },
      { key: 'armor' as const, label: 'Armadura', item: hero.equipped?.armor, side: 'left' as const },
      { key: 'weapon' as const, label: 'Arma', item: hero.equipped?.weapon, side: 'left' as const },
      { key: 'ring' as const, label: 'Anillo', item: hero.equipped?.ring ?? legacyRing, side: 'right' as const },
      {
        key: 'accessory' as const,
        label: 'Abalorio',
        item: legacyRing ? undefined : hero.equipped?.accessory,
        side: 'right' as const,
      },
    ];

    // Los objetos que lleva otro héroe no se ofrecen aquí.
    const equippedElsewhere = new Set<string>();
    heroes.forEach((h) => {
      if (h.id === hero.id) return;
      Object.values(h.equipped ?? {}).forEach((it) => {
        if (it?.id) equippedElsewhere.add(it.id);
      });
    });
    const equippedHere = new Set(
      Object.values(hero.equipped ?? {})
        .map((it) => it?.id)
        .filter((id): id is string => Boolean(id))
    );

    // Todo el inventario de equipo: piezas equipables + objetos forjados/comprados de la estantería.
    const ownedGear = getOwnedEquipment();
    const available = ownedGear.filter(
      (it) => !equippedElsewhere.has(it.id) && !equippedHere.has(it.id) && equipCategoryOf(it.type) === equipTab
    );
    const visible = available;

    const bonus = { hp: 0, attack: 0, defense: 0, speed: 0, critRate: 0 };
    Object.values(hero.equipped ?? {}).forEach((it) => {
      if (!it) return;
      bonus.hp += it.stats.hp ?? 0;
      bonus.attack += it.stats.attack ?? 0;
      bonus.defense += it.stats.defense ?? 0;
      bonus.speed += it.stats.speed ?? 0;
      bonus.critRate += it.stats.critRate ?? 0;
    });

    const bonusTiles = [
      { label: 'Vida', value: fmt(Math.round(bonus.hp)), icon: `${A}/stat_vida.png` },
      { label: 'Ataque', value: fmt(Math.round(bonus.attack)), icon: `${A}/stat_ataque.png` },
      { label: 'Defensa', value: fmt(Math.round(bonus.defense)), icon: `${A}/stat_defensa.png` },
      { label: 'Energía', value: fmt(Math.round(bonus.speed)), icon: `${A}/stat_energia.png` },
      { label: 'Suerte', value: fmt(Math.round(bonus.critRate * 1000) / 10), icon: `${A}/stat_suerte.png` },
    ];

    const tabs = EQUIP_CATEGORIES;
    const categoryCount = (id: EquipmentCategory) =>
      ownedGear.filter(
        (it) => !equippedElsewhere.has(it.id) && !equippedHere.has(it.id) && equipCategoryOf(it.type) === id
      ).length;

    return (
      <>
        {/* Arte del héroe: recortado al hueco del panel para que no se salga del marco */}
        <div className="pointer-events-none absolute left-[25%] top-[19.6%] h-[32%] w-[50%] overflow-hidden">
          <img
            src={heroArt}
            alt={hero.name}
            className="absolute bottom-0 left-0 h-full w-full object-contain object-bottom drop-shadow-[0_4px_8px_rgba(0,0,0,0.28)]"
          />
        </div>

        {/* Ranuras reales del héroe: casco, armadura y arma a la izquierda; anillo y abalorio a la derecha */}
        {slotDefs.map((slot) => {
          const item = slot.item;
          const indexInSide = slotDefs.filter((s) => s.side === slot.side).findIndex((s) => s.key === slot.key);
          return (
            <button
              key={slot.key}
              type="button"
              title={
                item
                  ? `${slot.label}: ${item.name} (Nv ${item.level}) · toca para quitar`
                  : `${slot.label} vacío`
              }
              onClick={() => {
                if (item) unequipHeroItem(hero.id, slot.key);
                else sound.playSFX('click');
              }}
              className={`absolute flex items-center justify-center overflow-hidden rounded-[6px] border transition-transform active:scale-95 ${
                item
                  ? 'border-[#e6a13a] bg-[#1d0e07] shadow-[0_0_8px_rgba(255,190,90,0.35)] cursor-pointer'
                  : 'border-[#6b3a14] bg-[#23100a] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)] cursor-default'
              }`}
              style={{
                ...(slot.side === 'left' ? { left: '4.6%' } : { right: '4.6%' }),
                top: `${21 + indexInSide * 11}%`,
                width: '10.5%',
                height: '9.6%',
              }}
            >
              {item ? (
                <>
                  <img src={item.icon} alt={item.name} className="h-[70%] w-[70%] object-contain" />
                  <span className="absolute left-0 top-0 bg-[#160a04]/85 px-[2px] text-[6px] font-black text-[#f6c46a]">
                    Nv {item.level}
                  </span>
                </>
              ) : (
                <Lock className="h-2.5 w-2.5 text-[#c8862f]/40" />
              )}
            </button>
          );
        })}

        {/* BONIFICACIONES TOTALES (suma de lo equipado) */}
        <div className="absolute left-[7.7%] top-[57.4%] w-[84.3%] h-[6.8%] grid grid-cols-5 gap-[4px]">
          {bonusTiles.map((s) => (
            <StatTile key={s.label} icon={s.icon} value={s.value} label={s.label} />
          ))}
        </div>

        {/* INVENTARIO DE EQUIPO: categorías */}
        <div className="absolute left-[7.7%] top-[69.7%] w-[84.3%] h-[2.8%] grid grid-cols-5 gap-[3px]">
          {tabs.map(({ id, label, Icon }) => {
            const active = equipTab === id;
            const count = categoryCount(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  setEquipTab(id);
                }}
                title={label}
                className={`flex items-center justify-center gap-1 rounded-[5px] border cursor-pointer transition-colors ${
                  active
                    ? 'border-[#e6a13a] bg-[#3a1b09] text-[#f6c46a]'
                    : 'border-[#6b3a14] bg-[#24110a] text-[#c8862f]/70 hover:text-[#e8bd7e]'
                }`}
              >
                <Icon className="w-2.5 h-2.5 shrink-0" />
                <span className="text-[5.5px] font-black uppercase tracking-[0.04em]">{label}</span>
                {count > 0 && (
                  <span className="rounded-[2px] bg-[#160a04]/80 px-[2px] text-[5.5px] font-black leading-none text-[#f6c46a]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* INVENTARIO: objetos reales disponibles para este héroe */}
        <div className="absolute left-[7.7%] top-[73.4%] w-[84.3%] h-[16.5%] grid grid-cols-5 grid-rows-2 gap-[4px]">
          {Array.from({ length: 10 }).map((_, i) => {
            const item = visible[i];
            if (!item) {
              return (
                <div
                  key={`eq-empty-${i}`}
                  className="rounded-[5px] border border-[#6b3a14]/50 bg-[#1a0d07]/40 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]"
                />
              );
            }
            const rarityColor = rarityDotColor(item.rarity);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => equipHeroItem(hero.id, item.id)}
                title={`${item.name} · Nv ${item.level} · ${item.description}`}
                className="relative flex items-center justify-center overflow-hidden rounded-[5px] border border-[#6b3a14] bg-[#24110a] cursor-pointer transition-transform active:scale-95 hover:border-[#e6a13a]"
              >
                <img src={item.icon} alt={item.name} className="h-[72%] w-[72%] object-contain" />
                <span className="absolute left-0 top-0 bg-[#160a04]/85 px-[2px] text-[6px] font-black text-[#f6c46a]">
                  Nv {item.level}
                </span>
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rarityColor }} />
              </button>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="pointer-events-none absolute left-[7.7%] top-[73.4%] z-10 flex h-[16.5%] w-[84.3%] items-center justify-center text-[7px] font-black uppercase tracking-[0.08em] text-[#f0c68a]/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Sin {tabs.find((t) => t.id === equipTab)?.label.toLowerCase()} en el inventario
          </p>
        )}

        {/* Botones */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            setUpgradeItemId(hero.equipped?.weapon?.id ?? getOwnedEquipment()[0]?.id ?? null);
            kitAssignedRef.current = 0;
            setKitAssigned(0);
            setUpgradeOpen(true);
          }}
          className="absolute left-[17%] top-[91.2%] w-[30%] h-[3.6%] rounded-[5px] border border-[#274b74] bg-gradient-to-b from-[#2f4f78] to-[#1b3252] text-[7.5px] font-black uppercase tracking-wide text-[#cfe3ff] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
        >
          <Sword className="w-2.5 h-2.5" /> Mejorar equipo
        </button>
        <button
          type="button"
          onClick={() => sound.playSFX('click')}
          className="absolute right-[17%] top-[91.2%] w-[30%] h-[3.6%] rounded-[5px] border border-[#1f4a2a] bg-gradient-to-b from-[#2f7546] to-[#1c4a2b] text-[7.5px] font-black uppercase tracking-wide text-[#d7f7dd] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
        >
          <Gem className="w-2.5 h-2.5" /> Vender equipo
        </button>
      </>
    );
  };

  const renderNivel = () => {
    const potions = inventory.filter((i) => (i.effect?.xpAmount ?? 0) > 0);
    const assignedXp = potions.reduce((sum, p) => sum + (assigned[p.id] ?? 0) * (p.effect?.xpAmount ?? 0), 0);

    let projXp = (hero.currentXp ?? 0) + assignedXp;
    let projLevel = level;
    let projReq = hero.xpToNextLevel ?? 100;
    while (projXp >= projReq && projLevel < maxLevel) {
      projXp -= projReq;
      projLevel += 1;
      projReq = Math.round(projReq * 1.25);
    }
    const fillPct = Math.min(100, Math.round((projXp / Math.max(1, projReq)) * 100));
    const pendingLevels = projLevel - level;

    return (
    <>
      {/* Nombre + gremio */}
      <div className="absolute left-[30%] top-[16.6%] w-[46%]">
        <p className="font-serif text-[7px] font-black uppercase leading-none tracking-[0.18em] text-[#8a4a1a]/85">
          [Caldo de Dragón]
        </p>
        <p className="mt-[2px] font-serif text-[17px] font-black leading-[1.05] text-[#6d3308] drop-shadow-[0_1px_0_rgba(255,238,205,0.9)]">
          {hero.name}
        </p>
        <div className="mt-[3px] h-[2px] w-[64%] rounded-full bg-gradient-to-r from-[#b5641a] via-[#e0a44a]/45 to-transparent" />
      </div>

      {/* Nivel + barra de EXP */}
      <div className="absolute left-[5%] top-[23%] w-[44%]">
        <div className="my-[10px] flex items-end gap-[4px]">
          <span className="rounded-[4px] border border-[#8a4a10]/80 bg-gradient-to-b from-[#3a1c0a] to-[#251006] px-[6px] py-[2px] text-[10.5px] font-black uppercase leading-none tracking-[0.1em] text-[#ffd98a] shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            Lv.
          </span>
          <span className="font-serif text-[20px] font-black leading-none tabular-nums text-[#552006]">{level}</span>
          {pendingLevels > 0 && (
            <>
              <span className="text-[13px] font-black leading-none text-[#0d6f96]">→</span>
              <span className="font-serif text-[20px] font-black leading-none tabular-nums text-[#0d6f96]">
                {projLevel}
              </span>
            </>
          )}
        </div>

        <div
          className="relative mt-[4px] h-[20px] overflow-hidden rounded-[4px] border border-[#2c1004] bg-[#3a1206]"
          style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,235,195,0.35)' }}
        >
          <div
            className="absolute inset-y-[1.5px] left-[1.5px] rounded-[2px] bg-gradient-to-b from-[#ffd97a] via-[#f2a33c] to-[#c65a0b] transition-all duration-300"
            style={{
              width: `calc(${Math.max(2, fillPct)}% - 3px)`,
              boxShadow: 'inset 0 1px 0 rgba(255,243,200,0.75), 0 0 6px rgba(255,170,60,0.35)',
            }}
          />
          <div className="pointer-events-none absolute inset-x-[2px] top-[1.5px] h-[2px] rounded-full bg-white/25" />
          <span className="pointer-events-none absolute inset-y-0 right-[5px] flex items-center text-[9px] font-black leading-none tabular-nums text-[#ffe9c6]/85 drop-shadow-[0_1px_1px_rgba(60,20,0,0.8)]">
            {fmt(projXp)} / {fmt(projReq)}
          </span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="absolute left-[5%] top-[31.6%] w-[50%] space-y-[4px]">
                  {[
            { key: 'Vida', icon: `${A}/stat_vida.png`, value: hp },
            { key: 'Ataque', icon: `${A}/stat_ataque.png`, value: atk },
            { key: 'Defensa', icon: `${A}/stat_defensa.png`, value: def },
            { key: 'Energía', icon: `${A}/stat_energia.png`, value: energy },
            { key: 'Suerte', icon: `${A}/stat_suerte.png`, value: luck },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-[6px]">
            <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[4px] border border-[#8a4a10]/70 bg-[#2a1206] shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)]">
              <img src={row.icon} alt="" className="h-[13px] w-[13px] object-contain" />
            </span>
            <span className="w-[44px] shrink-0 text-[9.5px] font-black uppercase leading-none tracking-[0.04em] text-[#5a2a08]">
              {row.key}
            </span>
            <span className="ml-[9px] text-[13.5px] font-black leading-none tabular-nums text-[#0b6b92] drop-shadow-[0_1px_0_rgba(255,245,215,0.9)]">
              {fmt(row.value)}
            </span>
            <span className="text-[9.5px] font-black leading-none tabular-nums text-[#0b6b92]/55">
              /{fmt(row.value)}
            </span>
          </div>
        ))}
      </div>

      {/* MATERIALES NECESARIOS: fila superior con las pociones asignadas */}
      <div className="absolute left-[20%] right-[14%] top-[62.4%] h-[5%] flex items-center gap-[6px]">
        {assignedXp === 0 ? (
          <p className="px-1 text-[7px] font-black leading-tight text-[#ffeccd]/75 drop-shadow-[0_1px_1px_rgba(60,25,0,0.7)]">
            Toca una poción para asignarla · mantén pulsado para asignarlas todas
          </p>
        ) : (
          potions
            .filter((p) => (assigned[p.id] ?? 0) > 0)
            .map((p) => {
              const qty = assigned[p.id] ?? 0;
              return (
                <button
                  key={`sel-${p.id}`}
                  type="button"
                  title={`${p.name}: ${qty} asignada(s) · toca para quitar una, mantén para quitar varias`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    beginPress(e, p.id, -1);
                  }}
                  onPointerMove={movePress}
                  onPointerUp={endPress}
                  onPointerCancel={stopPress}
                  onPointerLeave={stopPress}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative h-full aspect-square shrink-0 cursor-pointer select-none touch-pan-y active:scale-95 transition-transform"
                >
                  <div className="absolute inset-0 rounded-[9px] bg-[#120806]" />
                  <img
                    src={`${A}/marco_item.png`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  />
                  <img
                    src={p.icon}
                    alt={p.name}
                    className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 h-[58%] max-w-[62%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]"
                  />
                  <span className="absolute bottom-[15%] left-[22%] text-[9px] font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                    {qty}
                  </span>
                  <div className="absolute bottom-[7%] left-0 right-0 flex justify-center gap-[0.5px]">
                    {Array.from({ length: starCountFor(p.rarity) }).map((_, s) => (
                      <img key={s} src={`${A}/estrella_mejora.png`} alt="" className="w-[5px] h-[5px] object-contain" />
                    ))}
                  </div>
                </button>
              );
            })
        )}
      </div>

      {/* MATERIALES NECESARIOS: fila inferior con todas las pociones de EXP */}
      <div className="absolute left-[10.5%] right-[10.5%] top-[68.2%] h-[6.4%] grid grid-cols-5 gap-[6px]">
        {Array.from({ length: 5 }).map((_, i) => {
          const potion = potions[i];
          if (!potion) {
            return (
              <div key={`empty-${i}`} className="relative">
                <img src={`${A}/marco_item.png`} alt="" className="absolute inset-0 w-full h-full object-fill opacity-50" />
              </div>
            );
          }
          const owned = potion.count;
          const qty = assigned[potion.id] ?? 0;
          const remaining = owned - qty;
          return (
            <div
              key={potion.id}
              role="button"
              tabIndex={0}
              title={`${potion.name} · +${potion.effect?.xpAmount ?? 0} EXP · quedan ${remaining} · toca para asignar una, mantén para asignar varias`}
              onPointerDown={(e) => {
                e.preventDefault();
                beginPress(e, potion.id, 1);
              }}
              onPointerMove={movePress}
              onPointerUp={endPress}
              onPointerCancel={stopPress}
              onPointerLeave={stopPress}
              onContextMenu={(e) => e.preventDefault()}
              className="relative select-none touch-pan-y cursor-pointer active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 rounded-[9px] bg-[#120806]" />
              <img
                src={`${A}/marco_item.png`}
                alt=""
                className={`absolute inset-0 w-full h-full object-fill pointer-events-none ${qty > 0 ? 'drop-shadow-[0_0_6px_rgba(255,190,90,0.55)]' : ''}`}
              />
              <img
                src={potion.icon}
                alt={potion.name}
                className={`absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 h-[60%] max-w-[64%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)] ${
                  remaining === 0 ? 'opacity-30 grayscale' : ''
                }`}
              />
              <span className="absolute bottom-[15%] left-[21%] text-[11px] font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                {remaining}
              </span>
              <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-[0.5px]">
                {Array.from({ length: starCountFor(potion.rarity) }).map((_, s) => (
                  <img
                    key={s}
                    src={`${A}/estrella_mejora.png`}
                    alt=""
                    className={`w-[6px] h-[6px] object-contain ${remaining === 0 ? 'opacity-40' : ''}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* COSTE / APLICAR */}
      <button
        type="button"
        onClick={applyAssignedPotions}
        title="Aplicar las pociones asignadas"
        className={`absolute left-[10.5%] top-[81.2%] w-[37%] h-[5.6%] rounded-[5px] border flex flex-col items-center justify-center leading-none transition-all ${
          assignedXp > 0
            ? 'border-[#8a4a10] bg-gradient-to-b from-[#ffc76a] to-[#e08a16] text-[#3a1a00] shadow-[0_0_10px_rgba(255,190,90,0.6)] animate-pulse cursor-pointer active:scale-95'
            : 'border-[#8a4a10]/70 bg-gradient-to-b from-[#e0a44a] to-[#b9701a] text-[#3a1a00]/75 cursor-pointer active:scale-95'
        }`}
      >
        <span className="flex items-center gap-1 text-[10.5px] font-black">
          <img src="/assets/items/moneda_de_moonhaven.png" alt="" className="w-3.5 h-3.5 object-contain" />
          {fmt(goldCostForXp(assignedXp))}
        </span>
        <span className="mt-[1px] text-[6px] font-black uppercase tracking-[0.1em]">Aplicar EXP</span>
      </button>
      <button
        type="button"
        onClick={() => sound.playSFX('click')}
        className="absolute right-[10.5%] top-[81.2%] w-[37%] h-[5.6%] rounded-[5px] border border-[#2a6a86] bg-gradient-to-b from-[#4aa6c9] to-[#1f7fa3] flex items-center justify-center gap-1 text-[10.5px] font-black text-[#062a36] cursor-pointer active:scale-95 transition-transform"
      >
        <Gem className="w-3.5 h-3.5" /> 0
      </button>
    </>
    );
  };

  const renderDespertar = () => {
    const requirements = awakenRequirements;
    const filledStars = Math.min(5, Math.max(0, stars));

    return (
      <>
        {/* Nombre + gremio */}
        <div className="absolute left-[30%] top-[16.6%] w-[46%]">
          <p className="font-serif text-[7px] font-black uppercase leading-none tracking-[0.18em] text-[#8a4a1a]/85">
            [Caldo de Dragón]
          </p>
          <p className="mt-[2px] font-serif text-[17px] font-black leading-[1.05] text-[#6d3308] drop-shadow-[0_1px_0_rgba(255,238,205,0.9)]">
            {hero.name}
          </p>
          <div className="mt-[3px] h-[2px] w-[64%] rounded-full bg-gradient-to-r from-[#b5641a] via-[#e0a44a]/45 to-transparent" />
        </div>

        {/* Estrellas actuales */}
        <div className="absolute left-[5%] top-[25.2%] flex w-[62%] items-center gap-[7px]">
          <span className="flex items-center gap-[3px] rounded-[4px] border border-[#8a4a10]/80 bg-gradient-to-b from-[#3a1c0a] to-[#251006] px-[6px] py-[2px] text-[10.5px] font-black uppercase leading-none tracking-[0.1em] text-[#ffd98a] shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <img src={`${A}/estrella_mejora.png`} alt="" className="h-[10px] w-[10px] object-contain" />
            Despertar
          </span>
          <span className="font-serif text-[20px] font-black leading-none tabular-nums text-[#552006]">{stars}</span>
          <span className="text-[9px] font-black uppercase leading-none tracking-[0.08em] text-[#8a4a1a]/75">/ 5</span>
          {allMaterialsAssigned && stars < 5 && (
            <>
              <span className="text-[13px] font-black leading-none text-[#0d6f96]">→</span>
              <span className="font-serif text-[20px] font-black leading-none tabular-nums text-[#0d6f96]">
                {Math.min(5, stars + 1)}
              </span>
            </>
          )}
          <div className="ml-[4px] flex items-center gap-[3px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <img
                key={i}
                src={`${A}/estrella_mejora.png`}
                alt=""
                className={`h-[19px] w-[19px] object-contain drop-shadow-[0_1px_1px_rgba(60,20,0,0.35)] ${
                  i < filledStars ? '' : 'opacity-25 grayscale'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="absolute left-[5%] top-[31.2%] w-[50%] space-y-[4px]">
          {[
            { key: 'Vida', icon: `${A}/stat_vida.png`, value: hp },
            { key: 'Ataque', icon: `${A}/stat_ataque.png`, value: atk },
            { key: 'Defensa', icon: `${A}/stat_defensa.png`, value: def },
            { key: 'Energía', icon: `${A}/stat_energia.png`, value: energy },
            { key: 'Suerte', icon: `${A}/stat_suerte.png`, value: luck },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-[6px]">
              <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[4px] border border-[#8a4a10]/70 bg-[#2a1206] shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)]">
                <img src={row.icon} alt="" className="h-[13px] w-[13px] object-contain" />
              </span>
              <span className="w-[44px] shrink-0 text-[9.5px] font-black uppercase leading-none tracking-[0.04em] text-[#5a2a08]">
                {row.key}
              </span>
              <span className="ml-[9px] text-[13.5px] font-black leading-none tabular-nums text-[#0b6b92] drop-shadow-[0_1px_0_rgba(255,245,215,0.9)]">
                {fmt(row.value)}
              </span>
              <span className="text-[9.5px] font-black leading-none tabular-nums text-[#0b6b92]/55">/{fmt(row.value)}</span>
            </div>
          ))}
        </div>

        {/* MATERIALES NECESARIOS — fila superior: materiales asignados (preview) */}
        <div className="absolute left-[9%] right-[9%] top-[62.4%] h-[5.4%] flex items-center justify-center gap-[7px]">
          {matAssignedTotal === 0 ? (
            <p className="px-1 text-center text-[7px] font-black leading-tight text-[#ffeccd]/75 drop-shadow-[0_1px_1px_rgba(60,25,0,0.7)]">
              Toca un material para asignarlo · mantén pulsado para asignar varios
            </p>
          ) : (
            requirements
              .filter((r) => (matAssigned[r.id] ?? 0) > 0)
              .map((r) => {
                const qty = matAssigned[r.id] ?? 0;
                return (
                  <div
                    key={`sel-${r.id}`}
                    role="button"
                    tabIndex={0}
                    title={`${r.name}: ${qty} asignado(s) · toca para quitar uno, mantén para quitar varios`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      beginPress(e, r.id, -1, 'mat');
                    }}
                    onPointerMove={movePress}
                    onPointerUp={endPress}
                    onPointerCancel={stopPress}
                    onPointerLeave={stopPress}
                    onContextMenu={(e) => e.preventDefault()}
                    className="relative h-full aspect-square shrink-0 select-none touch-pan-y cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="absolute inset-0 rounded-[9px] bg-[#120806]" />
                    <img
                      src={`${A}/marco_item.png`}
                      alt=""
                      className="absolute inset-0 h-full w-full object-fill pointer-events-none drop-shadow-[0_0_6px_rgba(255,190,90,0.55)]"
                    />
                    <img
                      src={r.icon}
                      alt={r.name}
                      className="absolute left-1/2 top-[43%] h-[58%] max-w-[62%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]"
                    />
                    <span className="absolute bottom-[15%] left-[22%] text-[9px] font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                      {qty}
                    </span>
                    <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-[0.5px]">
                      {Array.from({ length: r.stars }).map((_, s) => (
                        <img key={s} src={`${A}/estrella_mejora.png`} alt="" className="h-[5px] w-[5px] object-contain" />
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* MATERIALES NECESARIOS — fila inferior: materiales disponibles */}
        <div className="absolute left-[9%] right-[9%] top-[68.4%] h-[5.4%] flex items-center justify-center gap-[7px]">
          {requirements.map((r) => {
            const qty = matAssigned[r.id] ?? 0;
            const remaining = r.owned - qty;
            const missing = qty < r.need;
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                title={`${r.name} · quedan ${remaining} de ${r.owned} · necesitas ${r.need} · toca para asignar uno, mantén para asignar varios`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  beginPress(e, r.id, 1, 'mat');
                }}
                onPointerMove={movePress}
                onPointerUp={endPress}
                onPointerCancel={stopPress}
                onPointerLeave={stopPress}
                onContextMenu={(e) => e.preventDefault()}
                className="relative h-full aspect-square shrink-0 select-none touch-pan-y cursor-pointer active:scale-95 transition-transform"
              >
                <div className="absolute inset-0 rounded-[9px] bg-[#120806]" />
                <img
                  src={`${A}/marco_item.png`}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-fill pointer-events-none ${
                    qty > 0 ? 'drop-shadow-[0_0_6px_rgba(255,190,90,0.55)]' : ''
                  }`}
                />
                <img
                  src={r.icon}
                  alt={r.name}
                  className={`absolute left-1/2 top-[43%] h-[60%] max-w-[64%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)] ${
                    remaining === 0 || !missing ? 'opacity-50' : ''
                  }`}
                />
                <span className="absolute right-[5%] top-[4%] rounded-[2px] bg-[#160a04]/80 px-[2px] text-[6px] font-black leading-none text-[#f6c46a]">
                  x{r.need}
                </span>
                <span className="absolute bottom-[15%] left-[21%] text-[11px] font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {remaining}
                </span>
                <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-[0.5px]">
                  {Array.from({ length: r.stars }).map((_, s) => (
                    <img
                      key={s}
                      src={`${A}/estrella_mejora.png`}
                      alt=""
                      className={`h-[6px] w-[6px] object-contain ${remaining === 0 ? 'opacity-40' : ''}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* COSTE / DESPERTAR */}
        <button
          type="button"
          onClick={applyAwakening}
          disabled={!canAwaken}
          title={
            canAwaken
              ? 'Despertar al héroe: sube una estrella'
              : `Asigna todos los materiales y reúne ${fmt(AWAKEN_GOLD)} de oro`
          }
          className={`absolute left-[8%] top-[81.2%] w-[40%] h-[5%] rounded-[5px] border flex flex-col items-center justify-center leading-none transition-all ${
            canAwaken
              ? 'border-[#8a4a10] bg-gradient-to-b from-[#ffc76a] to-[#e08a16] text-[#3a1a00] shadow-[0_0_10px_rgba(255,190,90,0.6)] animate-pulse cursor-pointer active:scale-95'
              : 'border-[#8a4a10]/70 bg-gradient-to-b from-[#e0a44a] to-[#b9701a] text-[#3a1a00]/75 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-1 text-[10px] font-black">
            <img src="/assets/items/moneda_de_moonhaven.png" alt="" className="h-3.5 w-3.5 object-contain" />
            {fmt(AWAKEN_GOLD)}
          </span>
          <span className="mt-[1px] text-[6px] font-black uppercase tracking-[0.1em]">
            Despertar {matAssignedTotal}/{matNeedTotal}
          </span>
        </button>
        <button
          type="button"
          onClick={() => sound.playSFX('click')}
          className="absolute right-[8%] top-[81.2%] w-[40%] h-[5%] rounded-[5px] border border-[#2a6a86] bg-gradient-to-b from-[#4aa6c9] to-[#1f7fa3] flex items-center justify-center gap-1 text-[10px] font-black text-[#062a36] cursor-pointer active:scale-95 transition-transform"
        >
          <Gem className="h-3.5 w-3.5" /> 0
        </button>
      </>
    );
  };

  /** Menú de mejorar equipo (mismo esquema que el panel "Mejorar equipo" de Unity). */
  const renderEquipoUpgrade = () => {
    const owned = getOwnedEquipment();
    const selected = owned.find((it) => it.id === upgradeItemId) ?? owned[0];
    // Material de forja que muestra el panel (informativo, como en la pantalla de Unity).
    const forgeKit = shelfInventory.find((it) => /kit/i.test(it.name));
    const forgeKitCount = forgeKit?.count ?? 0;
    const cost = (selected?.level ?? 1) * 400;
    // Kits de herrería que pide la mejora (9 como máximo, como en el panel de Unity).
    const kitsNeeded = Math.min(9, 3 + (selected?.level ?? 1) * 2);
    const kitRemaining = Math.max(0, forgeKitCount - kitAssigned);
    const kitIcon = forgeKit?.icon ?? '/assets/items/kit de herreria app.png';
    const canUpgrade = Boolean(selected) && gold >= cost && kitAssigned >= kitsNeeded;
    kitLimitsRef.current = { need: kitsNeeded, remaining: forgeKitCount };

    const equippedBonus = { hp: 0, attack: 0, defense: 0, speed: 0, critRate: 0 };
    Object.values(hero.equipped ?? {}).forEach((it) => {
      if (!it) return;
      equippedBonus.hp += it.stats.hp ?? 0;
      equippedBonus.attack += it.stats.attack ?? 0;
      equippedBonus.defense += it.stats.defense ?? 0;
      equippedBonus.speed += it.stats.speed ?? 0;
      equippedBonus.critRate += it.stats.critRate ?? 0;
    });
    const bonusTiles = [
      { label: 'Vida', value: fmt(Math.round(equippedBonus.hp)), icon: `${A}/stat_vida.png` },
      { label: 'Ataque', value: fmt(Math.round(equippedBonus.attack)), icon: `${A}/stat_ataque.png` },
      { label: 'Defensa', value: fmt(Math.round(equippedBonus.defense)), icon: `${A}/stat_defensa.png` },
      { label: 'Energía', value: fmt(Math.round(equippedBonus.speed)), icon: `${A}/stat_energia.png` },
      { label: 'Suerte', value: fmt(Math.round(equippedBonus.critRate * 1000) / 10), icon: `${A}/stat_suerte.png` },
    ];

    const close = () => {
      sound.playSFX('click');
      setUpgradeOpen(false);
    };

    const upgradeSelected = () => {
      if (!selected) return;
      if (!canUpgrade) {
        sound.playSFX('hurt');
        return;
      }
      if (!upgradeEquipmentItem(selected.id)) {
        sound.playSFX('hurt');
        return;
      }
      if (forgeKit && kitAssigned > 0) {
        deductMaterials([{ icon: forgeKit.icon, name: forgeKit.name, count: kitAssigned }]);
      }
      kitAssignedRef.current = 0;
      setKitAssigned(0);
    };

    const ribbon = (label: string) => (
      <div className="relative z-10 mx-auto mt-[6px] w-[74%] rounded-[4px] border border-[#8a4a10] bg-gradient-to-b from-[#4a2209] to-[#2a1206] py-[2px] text-center shadow-[0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,210,140,0.3)]">
        <span className="font-serif text-[7.5px] font-black uppercase tracking-[0.16em] text-[#ffd98a]">{label}</span>
      </div>
    );

    const list = owned.filter((it) => equipCategoryOf(it.type) === equipTab);

    return (
      <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#e2b077] animate-fade-in">
        <img
          src="/assets/backgrounds/fondo_personajes.png"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90 select-none"
        />
        <div className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-[#8a4a10]/55 shadow-[inset_0_0_14px_rgba(120,60,15,0.25)]" />

        {/* Cabecera */}
        <div className="relative z-10 mt-[8px] flex items-center justify-between px-[12px]">
          <button
            type="button"
            onClick={close}
            className="rounded-[4px] border border-[#8a4a10] bg-gradient-to-b from-[#3a1c0a] to-[#251006] px-[6px] py-[2px] text-[6px] font-black uppercase tracking-[0.12em] text-[#ffd98a] cursor-pointer active:scale-95"
          >
            Volver
          </button>
          <p className="font-serif text-[9px] font-black uppercase tracking-[0.2em] text-[#6d3308] drop-shadow-[0_1px_0_rgba(255,238,205,0.9)]">
            Mejorar equipo
          </p>
          <button
            type="button"
            onClick={close}
            title="Cerrar"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-[#8a4a10] bg-[#2a1206] text-[#ffd98a] cursor-pointer active:scale-95"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Pieza seleccionada */}
        <div className="relative z-10 mt-[2px] flex justify-center">
          <div className="relative aspect-square w-[34%]">
            <div className="absolute inset-0 rounded-[6px] bg-[#2a1206]" />
            <img src={`${A}/marco_item.png`} alt="" className="absolute inset-0 h-full w-full object-fill" />
            {selected && (
              <img
                src={selected.icon}
                alt={selected.name}
                className="absolute left-1/2 top-[52%] h-[58%] max-w-[62%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
              />
            )}
            <span className="absolute left-[4%] top-[3%] text-[10px] font-black leading-none text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]">
              Nv {selected?.level ?? 0}
            </span>
            <span className="absolute right-[2%] top-[2%] h-[14%] w-[14%] rounded-full border border-[#8a5a12] bg-[radial-gradient(circle_at_35%_30%,#fff8d0,#efc257_45%,#a97413)] shadow-[0_1px_3px_rgba(0,0,0,0.65)]" />
          </div>
        </div>

        {/* Kits asignados (preview) */}
        <div className="relative z-10 mx-[7%] mt-[7px] flex h-[9.5%] items-center justify-center gap-[6px] rounded-[9px] border border-[#8a4a10] bg-[#2a1006]/85 px-[8px] shadow-[inset_0_2px_7px_rgba(0,0,0,0.6)]">
          {kitAssigned === 0 ? (
            <p className="text-center text-[7px] font-black leading-tight text-[#ffe6c0]/85 drop-shadow-[0_1px_1px_rgba(60,25,0,0.75)]">
              Toca el kit para asignarlo · mantén pulsado para asignar varios
            </p>
          ) : (
            <div
              role="button"
              tabIndex={0}
              title={`${kitAssigned} kit(s) asignados · toca para quitar uno, mantén para quitar varios`}
              onPointerDown={(e) => {
                e.preventDefault();
                beginPress(e, 'kit', -1, 'kit');
              }}
              onPointerMove={movePress}
              onPointerUp={endPress}
              onPointerCancel={stopPress}
              onPointerLeave={stopPress}
              onContextMenu={(e) => e.preventDefault()}
              className="relative h-[74%] aspect-square shrink-0 cursor-pointer select-none touch-pan-y transition-transform active:scale-95"
            >
              <div className="absolute inset-0 rounded-[7px] bg-[#120806]" />
              <img src={`${A}/marco_item.png`} alt="" className="absolute inset-0 h-full w-full object-fill" />
              <img
                src={kitIcon}
                alt=""
                className="absolute left-1/2 top-[44%] h-[56%] max-w-[60%] -translate-x-1/2 -translate-y-1/2 object-contain"
              />
              <span className="absolute bottom-[15%] left-[20%] text-[9px] font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                {kitAssigned}
              </span>
            </div>
          )}
        </div>

        {/* Kit disponible + cuántos hacen falta */}
        <div className="relative z-10 mt-[6px] flex flex-col items-center">
          <div
            role="button"
            tabIndex={0}
            title={`${forgeKit?.name ?? 'Kit de herrería'} · quedan ${kitRemaining} · necesitas ${kitsNeeded} · toca para asignar uno, mantén para asignar varios`}
            onPointerDown={(e) => {
              e.preventDefault();
              beginPress(e, 'kit', 1, 'kit');
            }}
            onPointerMove={movePress}
            onPointerUp={endPress}
            onPointerCancel={stopPress}
            onPointerLeave={stopPress}
            onContextMenu={(e) => e.preventDefault()}
            className="relative w-[13%] aspect-square shrink-0 cursor-pointer select-none touch-pan-y transition-transform active:scale-95"
          >
            <div className="absolute inset-0 rounded-[7px] bg-[#120806]" />
            <img
              src={`${A}/marco_item.png`}
              alt=""
              className={`absolute inset-0 h-full w-full object-fill ${kitAssigned > 0 ? 'drop-shadow-[0_0_6px_rgba(255,190,90,0.5)]' : ''}`}
            />
            <img
              src={kitIcon}
              alt=""
              className={`absolute left-1/2 top-[44%] h-[58%] max-w-[62%] -translate-x-1/2 -translate-y-1/2 object-contain ${
                kitRemaining === 0 ? 'opacity-40 grayscale' : ''
              }`}
            />
            <span className="absolute bottom-[15%] left-[20%] text-[9px] font-black leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {kitRemaining}
            </span>
          </div>
          <span className="mt-[1px] text-[7px] font-black leading-none text-[#5a2a08] drop-shadow-[0_1px_0_rgba(255,238,205,0.85)]">
            {kitsNeeded}
          </span>
        </div>

        {/* Coste */}
        <div className="relative z-10 mt-[6px] flex items-center justify-center gap-[7px]">
          <button
            type="button"
            onClick={upgradeSelected}
            disabled={!canUpgrade}
            title={
              canUpgrade
                ? `Mejorar ${selected?.name} con ${kitAssigned} kit(s)`
                : `Asigna ${kitsNeeded} kit(s) y reúne ${fmt(cost)} de oro`
            }
            className={`flex w-[42%] items-center justify-center gap-[4px] rounded-[6px] border-2 px-[6px] py-[5px] text-[9.5px] font-black leading-none transition-all ${
              canUpgrade
                ? 'border-[#8a4a10] bg-gradient-to-b from-[#ffcf7a] to-[#dfa02f] text-[#3a1a00] shadow-[0_2px_0_rgba(120,60,10,0.5)] cursor-pointer active:scale-95'
                : 'border-[#a9672a]/70 bg-gradient-to-b from-[#e8bf80] to-[#c08c3e] text-[#4a2a0a]/70 cursor-not-allowed'
            }`}
          >
            <img src="/assets/items/moneda_de_moonhaven.png" alt="" className="h-3.5 w-3.5 object-contain" />
            Oro: {fmt(cost)}
          </button>
          <div className="flex w-[42%] items-center justify-center gap-[4px] rounded-[6px] border-2 border-[#2a6a86] bg-gradient-to-b from-[#5cc3ee] to-[#2385c4] px-[6px] py-[5px] text-[9.5px] font-black leading-none text-[#062a36]">
            <Gem className="h-3.5 w-3.5" />
            {fmt(astralShards)}
          </div>
        </div>

        {/* Bonificaciones totales */}
        {ribbon('Bonificaciones totales')}
        <div className="relative z-10 mx-[7%] mt-[4px] rounded-[8px] border border-[#8a4a10]/70 bg-[#2a1006]/45 p-[4px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-5 gap-[4px]">
            {bonusTiles.map((s) => (
              <StatTile key={s.label} icon={s.icon} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        {/* Inventario de equipo */}
        {ribbon('Inventario de equipo')}
        <div className="relative z-10 mx-[7%] mt-[3px] grid grid-cols-5 gap-[3px]">
          {EQUIP_CATEGORIES.map(({ id, label, Icon }) => {
            const active = equipTab === id;
            return (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => {
                  sound.playSFX('click');
                  setEquipTab(id);
                }}
                className={`flex items-center justify-center gap-[3px] rounded-[5px] border py-[4px] cursor-pointer transition-colors ${
                  active
                    ? 'border-[#e6a13a] bg-[#3a1b09] text-[#f6c46a]'
                    : 'border-[#6b3a14] bg-[#24110a]/85 text-[#c8862f]/70 hover:text-[#e8bd7e]'
                }`}
              >
                <Icon className="h-2.5 w-2.5" />
              </button>
            );
          })}
        </div>

        <div className="relative z-10 mx-[7%] mb-[6px] mt-[3px] grid grid-cols-5 gap-[3px]">
          {Array.from({ length: 10 }).map((_, i) => {
            const item = list[i];
            if (!item) {
              return (
                <div
                  key={`up-empty-${i}`}
                  className="aspect-square rounded-[4px] border border-[#6b3a14]/50 bg-[#1a0d07]/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                />
              );
            }
            const isSelected = item.id === selected?.id;
            return (
              <button
                key={item.id}
                type="button"
                title={`${item.name} · Nv ${item.level}`}
                onClick={() => {
                  sound.playSFX('click');
                  setUpgradeItemId(item.id);
                  kitAssignedRef.current = 0;
                  setKitAssigned(0);
                }}
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[4px] border bg-[#24110a] cursor-pointer active:scale-95 transition-all ${
                  isSelected ? 'border-[#f0b95a] shadow-[0_0_7px_rgba(255,205,120,0.8)]' : 'border-[#6b3a14]'
                }`}
              >
                <img src={item.icon} alt={item.name} className="h-[72%] w-[72%] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                <span className="absolute left-0 top-0 bg-[#160a04]/85 px-[2px] text-[6px] font-black leading-none text-[#f6c46a]">
                  Nv {item.level}
                </span>
                <span
                  className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: rarityDotColor(item.rarity) }}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSkins = () => (
    <>

      {/* Lista de skins: cada una se desbloquea fabricándola */}
      <div className="absolute left-[4.6%] top-[18.3%] w-[42%] space-y-[5px]">
        {SKINS.map((skin, i) => {
          const active = i === skinIndex;
          const open = isSkinUnlocked(skin.id);
          return (
            <button
              key={skin.id}
              type="button"
              title={`${skin.name} · ${open ? 'desbloqueada' : 'bloqueada · fabrícala con materiales'}`}
              onClick={() => {
                sound.playSFX('click');
                setSkinIndex(i);
              }}
              className={`w-full text-left rounded-[5px] border px-[4px] py-[3px] flex items-center gap-[5px] cursor-pointer transition-all ${
                active
                  ? 'border-[#e6a13a] bg-[#3a1b09] shadow-[0_0_8px_rgba(240,185,90,0.3)]'
                  : 'border-[#6b3a14] bg-[#24110a]/90 hover:border-[#a5681f]'
              }`}
            >
              <div className="h-[30px] w-[26px] shrink-0 overflow-hidden rounded-[3px] border border-[#6b3a14] bg-[#120806]">
                <img src={skin.art} alt="" className="h-full w-full object-contain object-top" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9.5px] font-black leading-none text-[#ffe9c2]">{skin.name}</p>
                <p
                  className={`truncate text-[6.5px] font-bold leading-tight ${
                    open ? 'text-[#8fd6a5]' : 'text-[#e59a76]'
                  }`}
                >
                  {open ? 'Desbloqueada' : 'Bloqueada'}
                </p>
              </div>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  open ? 'border-[#7fe0a3] bg-[#2f7546]' : 'border-[#d4764f] bg-[#7a2418]'
                }`}
              >
                {open ? (
                  <Check className="h-2.5 w-2.5 text-[#d9ffe6]" strokeWidth={4} />
                ) : (
                  <Lock className="h-2.5 w-2.5 text-[#ffd9c9]" strokeWidth={3} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vista previa */}
      <button
        type="button"
        onClick={() => {
          sound.playSFX('click');
          setSkinIndex((i) => (i - 1 + SKINS.length) % SKINS.length);
        }}
        className="absolute left-[47.5%] top-[32%] w-[5%] h-[5%] flex items-center justify-center text-[#f0b95a] cursor-pointer"
        aria-label="Skin anterior"
      >
        <img src={`${A}/boton_flecha.png`} alt="" className="w-full h-full object-contain -scale-x-100" />
      </button>
      {/* Skin: enmascarada al hueco de la vista previa */}
      <div className="pointer-events-none absolute left-[51%] top-[21%] h-[36%] w-[40%] overflow-hidden">
        <img
          src={activeSkin.art}
          alt={activeSkin.name}
          className="absolute inset-0 h-full w-full origin-top scale-[2] object-contain object-top drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          sound.playSFX('click');
          setSkinIndex((i) => (i + 1) % SKINS.length);
        }}
        className="absolute right-[4.5%] top-[32%] w-[5%] h-[5%] flex items-center justify-center cursor-pointer"
        aria-label="Skin siguiente"
      >
        <img src={`${A}/boton_flecha.png`} alt="" className="w-full h-full object-contain" />
      </button>

      {/* Descripción de la skin: en el marco que queda bajo la vista previa */}
      <div className="absolute left-[49%] top-[57.6%] flex h-[10.8%] w-[44%] flex-col justify-center text-center">
        <p className="mx-auto mt-[-41px] mb-[-32px] h-[95px] text-[12px] leading-[1.25] text-[#f0dcbc]/90">{activeSkin.description}</p>
      </div>

      {/* Bonificación de la skin (dentro del marco del panel) */}
      <div className="absolute left-[49%] top-[69.2%] flex h-[3.2%] w-[44%] items-center justify-center px-2">
        <p className="h-[40px] text-center text-[7.5px] font-semibold leading-tight text-[#f0dcbc]/90">{activeSkin.bonus}</p>
      </div>

      {/* FABRICAR SKIN: materiales + botón (los huecos están en la plantilla) */}
      {activeSkin.materials.map((mat, i) => {
        const have = skinHas(mat);
        const enough = have >= mat.count;
        return (
          <div
            key={`${activeSkin.id}-${mat.name}`}
            className="absolute"
            style={{
              left:
                mat.name === 'Montón de Arapos'
                  ? '142px'
                  : mat.name === 'Polvo de Hadas'
                    ? '209.2px'
                    : SKIN_SLOT_LEFT[i],
              top: '83.6%',
              width: '14%',
              height: '9%',
              ...(mat.name === 'Polvo de Hadas' ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
            }}
            title={`${mat.name} · tienes ${have} de ${mat.count}`}
          >
            <img
              src={mat.icon}
              alt={mat.name}
              className={`absolute inset-x-0 mx-auto h-[62%] w-[84%] object-contain ${
                enough ? '' : 'opacity-40 grayscale'
              }`}
              style={{
                top: '-13px',
                ...(mat.name === 'Montón de Arapos'
                  ? { left: '-6px' }
                  : mat.name === 'Polvo de Hadas'
                    ? { left: '29px' }
                    : mat.name === 'Paquetes Sospechosos'
                      ? { left: '37px' }
                      : {}),
                ...(mat.name === 'Libro Sagrado' ? { marginRight: 'auto' } : {}),
              }}
            />
            <span
              className={`absolute top-[43.6px] text-[11px] font-black leading-none ${
                enough ? 'text-[#ffe9c2]' : 'text-[#e59a76]'
              }`}
              style={{
                left:
                  mat.name === 'Montón de Arapos'
                    ? '46px'
                    : mat.name === 'Polvo de Hadas'
                      ? '56px'
                      : '20px',
              }}
            >
              {Math.min(have, mat.count)}/{mat.count}
            </span>
          </div>
        );
      })}

      <button
        type="button"
        onClick={craftSkin}
        disabled={isSkinUnlocked(activeSkin.id) || !canCraftSkin(activeSkin)}
        title={
          isSkinUnlocked(activeSkin.id)
            ? `${activeSkin.name} ya está desbloqueada`
            : canCraftSkin(activeSkin)
              ? `Fabricar ${activeSkin.name}`
              : 'Faltan materiales para fabricar esta skin'
        }
        className={`absolute z-10 flex items-center justify-center rounded-[6px] border-2 text-[11px] font-black uppercase tracking-[0.08em] transition-all ${
          isSkinUnlocked(activeSkin.id)
            ? 'border-[#7a4a14] bg-[#2a1206] text-[#c8955a] cursor-default'
            : canCraftSkin(activeSkin)
              ? 'border-[#8a4a10] bg-gradient-to-b from-[#ffcf7a] to-[#dfa02f] text-[#3a1a00] shadow-[0_2px_0_rgba(120,60,10,0.5)] cursor-pointer active:scale-95'
              : 'border-[#7a4a14]/70 bg-gradient-to-b from-[#c8a06a] to-[#8a5c22] text-[#3a1a00]/60 cursor-not-allowed'
        }`}
        style={{ left: '27%', top: '93%', width: '46%', height: '4.2%' }}
      >
        {isSkinUnlocked(activeSkin.id) ? 'Desbloqueada' : 'Fabricar'}
      </button>

    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-center bg-[#1a0a04] select-none animate-fade-in">
      <div className="relative w-full max-w-[440px] h-full flex flex-col overflow-hidden bg-[#1a0a04]">
        {/* Barra superior del juego */}
        <GameHeader onBack={onClose} />

        {/* Páginas del héroe (arriba, como el menú del juego) */}
        <div className="relative z-20 flex items-stretch gap-[3px] px-1.5 py-1 bg-[#240d05] border-b-2 border-[#3d1405]">
          {PAGES.map((p) => {
            const active = p.id === tab;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => goTab(p.id)}
                className={`relative flex-1 rounded-[3px] border px-[2px] py-[6px] text-[6.5px] font-black uppercase tracking-[0.03em] transition-all cursor-pointer ${
                  active
                    ? 'border-[#f0b95a] bg-gradient-to-b from-[#4a2209] to-[#2a1206] text-[#ffd98a] shadow-[0_0_7px_rgba(240,185,90,0.45)]'
                    : 'border-[#7a3e1a] bg-[#2a1206] text-[#c8955a] hover:text-[#e8bd7e]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Página */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-[#1c0a04]">
          <div
            className="relative h-full max-w-full"
            style={{ aspectRatio: `${page.width} / ${Math.round(page.height * (1 - page.cropTop))}` }}
          >
            <div
              className="absolute left-0 w-full"
              style={{
                top: `${(-page.cropTop / (1 - page.cropTop)) * 100}%`,
                height: `${100 / (1 - page.cropTop)}%`,
              }}
            >
              <img
                src={page.template}
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
              {tab === 'descripcion' && renderDescripcion()}
              {tab === 'equipo' && renderEquipo()}
              {tab === 'nivel' && renderNivel()}
              {tab === 'despertar' && renderDespertar()}
              {tab === 'skins' && renderSkins()}
            </div>
          </div>

          {upgradeOpen && renderEquipoUpgrade()}
        </div>

        {/* Modal de detalles */}
        {showInfo && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInfo(false);
            }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          >
            <div className="relative w-full rounded-xl border border-[#7a3e1a] bg-[#1b0a04] p-3">
              <div className="flex items-start justify-between">
                <p className="font-serif text-[11.5px] font-black uppercase tracking-[0.12em] text-amber-200">
                  {hero.name}
                </p>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="text-amber-300/70 hover:text-amber-200 cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="mt-2 space-y-1 text-[9.5px] text-[#e8cfa4]/90">
                <li>Clase: {hero.heroClass}</li>
                <li>Atributo: {hero.attribute}</li>
                <li>Alianza: {hero.alliance ?? 'Caldo de Dragón'}</li>
                <li>Rareza: {hero.rarity}</li>
                <li>Nivel: {level} / {maxLevel}</li>
                <li>Estrellas: {stars} / 5</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
