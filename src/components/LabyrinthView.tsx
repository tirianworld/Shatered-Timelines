import React, { useCallback, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import {
  Swords,
  Skull,
  Sparkles,
  ShoppingBag,
  Heart,
  Gem,
  Crown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  DoorOpen,
  Scroll,
  Zap,
  Footprints,
} from 'lucide-react';

const STORAGE_KEY = 'cdd_gacha_2_save_v1_labyrinth';
const COLS = 5;
const ROWS = 7;
const TOTAL_FLOORS = 3;

type PanelType = 'battle' | 'elite' | 'passive' | 'shop' | 'heal' | 'treasure' | 'boss';

interface Cell {
  type: PanelType;
  cleared: boolean;
}

interface RunState {
  floor: number;
  hp: number;
  maxHp: number;
  power: number;
  shards: number;
  x: number;
  y: number;
  grid: Cell[][];
  visited: string[];
  log: string[];
  finished: boolean;
  defeated: boolean;
}

interface Enemy {
  id: string;
  name: string;
  art: string;
  hp: number;
  maxHp: number;
  atk: number;
}

interface BattleState {
  kind: 'battle' | 'elite' | 'boss';
  wave: number;
  waves: number;
  enemies: Enemy[];
  log: string[];
  targetIndex: number;
}

interface Offer {
  id: string;
  name: string;
  description: string;
  cost: number;
  apply: (run: RunState) => Partial<RunState>;
}

interface BuffChoice {
  id: string;
  name: string;
  description: string;
  apply: (run: RunState) => Partial<RunState>;
}

const MINERALS = [
  { id: 'mineral_cobre', name: 'Mineral de Cobre', icon: '/assets/items/lingote cobre app.png', rarity: 'R' as const, count: 6 },
  { id: 'mineral_plata', name: 'Mineral de Plata', icon: '/assets/items/lingote plata app.png', rarity: 'SR' as const, count: 4 },
  { id: 'mineral_oro', name: 'Mineral de Oro', icon: '/assets/items/lingote oro  app.png', rarity: 'SSR' as const, count: 3 },
  { id: 'gema_primigenia', name: 'Gema Primigenia', icon: '/assets/items/arcano gema app.png', rarity: 'SSR' as const, count: 2 },
];

/** Enemigos del laberinto, con el arte de combate que ya usa el juego. */
const ENEMY_POOL = [
  { name: 'Orco de la galería', art: '/assets/combat/arlem_orco_clean.png' },
  { name: 'Goblin de la veta', art: '/assets/combat/goblin_garrote_clean.png' },
  { name: 'Araknoide de la grieta', art: '/assets/combat/araknoide_azul_clean.png' },
  { name: 'Bandido de la ruta', art: '/assets/combat/bandido_daga_attack.png' },
  { name: 'Guardia de hierro', art: '/assets/combat/guardia_pesado_clean.png' },
];

const BOSS_POOL = [
  { name: 'Celador del Sello', art: '/assets/combat/semiboss_zancudo_clean.png' },
  { name: 'Devorador de vetas', art: '/assets/combat/devorador_quitinoso_clean.png' },
  { name: 'Guardia de Lloth', art: '/assets/combat/guardia_pesado_clean.png' },
];

const BOSS_POWER = [18, 26, 36];

const pickWeighted = (): PanelType => {
  const r = Math.random();
  if (r < 0.1) return 'passive';
  if (r < 0.18) return 'treasure';
  if (r < 0.26) return 'heal';
  if (r < 0.34) return 'shop';
  if (r < 0.46) return 'elite';
  return 'battle';
};

const makeGrid = (): Cell[][] => {
  const grid: Cell[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < COLS; x++) row.push({ type: pickWeighted(), cleared: false });
    grid.push(row);
  }
  grid[ROWS - 1][Math.floor(COLS / 2)] = { type: 'battle', cleared: true };
  grid[0][Math.floor(COLS / 2)] = { type: 'boss', cleared: false };
  grid[ROWS - 2][1] = { type: 'passive', cleared: false };
  grid[ROWS - 3][COLS - 2] = { type: 'shop', cleared: false };
  return grid;
};

const newRun = (power: number): RunState => ({
  floor: 1,
  hp: 100,
  maxHp: 100,
  power,
  shards: 0,
  x: Math.floor(COLS / 2),
  y: ROWS - 1,
  grid: makeGrid(),
  visited: [`${Math.floor(COLS / 2)},${ROWS - 1}`],
  log: ['La puerta de Lloth se cierra a tu espalda. Solo queda bajar.'],
  finished: false,
  defeated: false,
});

const isVisible = (run: RunState, x: number, y: number): boolean => {
  if (run.visited.includes(`${x},${y}`)) return true;
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx, dy]) => run.visited.includes(`${x + dx},${y + dy}`));
};

const panelIcon = (type: PanelType) => {
  const cls = 'w-5 h-5 sm:w-6 sm:h-6';
  switch (type) {
    case 'battle':
      return <Swords className={cls} />;
    case 'elite':
      return <Skull className={cls} />;
    case 'passive':
      return <Sparkles className={cls} />;
    case 'shop':
      return <ShoppingBag className={cls} />;
    case 'heal':
      return <Heart className={cls} />;
    case 'treasure':
      return <Gem className={cls} />;
    case 'boss':
      return <Crown className={cls} />;
  }
};

const panelTone = (type: PanelType): string => {
  switch (type) {
    case 'battle':
      return 'from-[#7d3b34] to-[#4a1f1b] border-[#c9776a]';
    case 'elite':
      return 'from-[#6b3f7d] to-[#3a2148] border-[#b98cd4]';
    case 'passive':
      return 'from-[#3f6b4a] to-[#1e3a26] border-[#8fc79a]';
    case 'shop':
      return 'from-[#7d6231] to-[#463417] border-[#d8b866]';
    case 'heal':
      return 'from-[#2f5f7d] to-[#163648] border-[#7fc0dd]';
    case 'treasure':
      return 'from-[#3f587d] to-[#1c2942] border-[#8fb4e8]';
    case 'boss':
      return 'from-[#8a3b2a] to-[#4a150c] border-[#f0b27a]';
  }
};

const rnd = (max: number) => Math.floor(Math.random() * max);
const decay = (n: number) => Math.max(0, n);

const makeEnemies = (kind: BattleState['kind'], floor: number): Enemy[] => {
  const build = (i: number, boss: boolean): Enemy => {
    const pick = boss ? BOSS_POOL[rnd(BOSS_POOL.length)] : ENEMY_POOL[rnd(ENEMY_POOL.length)];
    const hp = boss ? 120 + floor * 55 : kind === 'elite' ? 46 + floor * 14 : 30 + floor * 10;
    const atk = boss ? 10 + floor * 2 : kind === 'elite' ? 5 + floor : 3 + floor;
    return { id: `${kind}-${floor}-${i}-${Date.now()}`, name: pick.name, art: pick.art, hp, maxHp: hp, atk };
  };

  if (kind === 'boss') return [build(0, true)];
  if (kind === 'elite') return [build(0, false), build(1, false)];
  return Math.random() < 0.5 ? [build(0, false)] : [build(0, false), build(1, false)];
};

export const LabyrinthView: React.FC = () => {
  const { heroes, team, addShelfItem, addGold, navigateTo } = useGame();

  const [run, setRun] = useState<RunState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RunState;
        if (parsed && Array.isArray(parsed.grid) && parsed.grid.length === ROWS) return parsed;
      }
    } catch {
      /* guardado corrupto */
    }
    return null;
  });

  const [buffChoices, setBuffChoices] = useState<BuffChoice[] | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const teamPower = useCallback((): number => {
    const picked = heroes.filter((h) => team.includes(h.id));
    const source = picked.length > 0 ? picked : [...heroes].sort((a, b) => b.stats.attack - a.stats.attack).slice(0, 3);
    const atk = source.reduce((sum, h) => sum + h.stats.attack, 0);
    return Math.max(12, 10 + Math.floor(atk / 90));
  }, [heroes, team]);

  const partyHeroes = (() => {
    const picked = heroes.filter((h) => team.includes(h.id));
    return (picked.length > 0 ? picked : [...heroes].sort((a, b) => b.stats.attack - a.stats.attack)).slice(0, 4);
  })();

  useEffect(() => {
    if (run) localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
    else localStorage.removeItem(STORAGE_KEY);
  }, [run]);

  const startRun = () => {
    sound.playSFX('fanfare');
    setBattle(null);
    setResultOpen(false);
    setRun(newRun(teamPower()));
  };

  const addLog = (line: string) => (r: RunState) => ({ log: [...r.log.slice(-6), line] });

  const grantMineral = (tier: number) => {
    const pool = MINERALS.slice(0, 2 + tier);
    const item = pool[Math.floor(Math.random() * pool.length)];
    addShelfItem({ ...item, count: item.count, description: 'Extraído del Laberinto de Lloth, bajo Silverpeack.' });
    return item.name;
  };

  const clearCurrentCell = (r: RunState): Cell[][] =>
    r.grid.map((row, ry) => row.map((c, cx) => (cx === r.x && ry === r.y ? { ...c, cleared: true } : c)));

  const openBattle = (kind: BattleState['kind']) => {
    if (!run) return;
    setBattle({
      kind,
      wave: 1,
      waves: kind === 'elite' ? 2 : 1,
      enemies: makeEnemies(kind, run.floor),
      log: [
        kind === 'boss'
          ? 'El sello de Lloth revienta en luz violeta.'
          : kind === 'elite'
          ? 'Una patrulla de élite bloquea la galería.'
          : '¡Emboscada en la galería!',
      ],
      targetIndex: 0,
    });
    sound.playSFX(kind === 'boss' ? 'roar' : 'slam');
  };

  const move = (dx: number, dy: number) => {
    if (!run || run.finished || run.defeated || buffChoices || shopOpen || battle || resultOpen) return;
    const nx = run.x + dx;
    const ny = run.y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;

    const cell = run.grid[ny][nx];
    const nextBase: RunState = {
      ...run,
      x: nx,
      y: ny,
      visited: run.visited.includes(`${nx},${ny}`) ? run.visited : [...run.visited, `${nx},${ny}`],
    };
    setRun({ ...nextBase, log: [...run.log.slice(-6), cell.cleared ? 'Pasillo despejado.' : 'Avanzas por la galería.'] });

    if (cell.cleared) {
      sound.playSFX('click');
      return;
    }

    switch (cell.type) {
      case 'battle':
      case 'elite':
      case 'boss': {
        setRun(nextBase);
        openBattle(cell.type);
        break;
      }
      case 'heal': {
        const healed = Math.min(nextBase.maxHp, nextBase.hp + 28);
        sound.playSFX('drink');
        setRun({
          ...nextBase,
          hp: healed,
          grid: clearCurrentCell(nextBase),
          log: [...nextBase.log.slice(-6), `Fuente de la mina: +${healed - nextBase.hp} PV`],
        });
        break;
      }
      case 'treasure': {
        const name = grantMineral(1);
        const bonus = 15 + rnd(15);
        sound.playSFX('util');
        setRun({
          ...nextBase,
          shards: nextBase.shards + bonus,
          grid: clearCurrentCell(nextBase),
          log: [...nextBase.log.slice(-6), `Cofre de los enanos: ${name}, +${bonus} fragmentos`],
        });
        break;
      }
      case 'passive': {
        sound.playSFX('click');
        setBuffChoices([
          {
            id: 'power',
            name: 'Filo de plata',
            description: '+8 de fuerza para el resto de la incursión.',
            apply: (r) => ({ power: r.power + 8 }),
          },
          {
            id: 'vitality',
            name: 'Corazón de granito',
            description: '+20 PV máximos y cura esa misma cantidad.',
            apply: (r) => ({ maxHp: r.maxHp + 20, hp: r.hp + 20 }),
          },
          {
            id: 'shards',
            name: 'Veta rica',
            description: '+45 fragmentos del laberinto.',
            apply: (r) => ({ shards: r.shards + 45 }),
          },
        ]);
        break;
      }
      case 'shop': {
        sound.playSFX('click');
        setShopOpen(true);
        break;
      }
    }
  };

  const advanceFloor = (r: RunState, hp: number): RunState => {
    const isLast = r.floor >= TOTAL_FLOORS;
    const shardsGain = 80 + r.floor * 30;
    if (isLast) {
      grantMineral(3);
      grantMineral(3);
      addGold(4500);
      sound.playSFX('victory');
      return {
        ...r,
        hp,
        shards: r.shards + shardsGain,
        grid: clearCurrentCell(r),
        finished: true,
        log: [...r.log.slice(-6), '¡Sello de Lloth roto! El laberinto queda abierto.'],
      };
    }
    grantMineral(2);
    sound.playSFX('victory');
    return {
      ...r,
      floor: r.floor + 1,
      hp: Math.min(r.maxHp, hp + 15),
      shards: r.shards + shardsGain,
      x: Math.floor(COLS / 2),
      y: ROWS - 1,
      grid: makeGrid(),
      visited: [`${Math.floor(COLS / 2)},${ROWS - 1}`],
      power: r.power + 4,
      log: [...r.log.slice(-6), `Piso ${r.floor} despejado. Bajas al piso ${r.floor + 1}.`],
    };
  };

  const finishBattle = (r: RunState, kind: BattleState['kind'], hp: number): RunState => {
    if (kind === 'boss') return advanceFloor(r, hp);
    const shardsGain = (kind === 'elite' ? 34 : 18) + r.floor * 6;
    const lootChance = kind === 'elite' ? 0.9 : 0.45;
    let lootLine = '';
    if (Math.random() < lootChance) lootLine = `, ${grantMineral(kind === 'elite' ? 2 : 0)}`;
    return {
      ...r,
      hp,
      shards: r.shards + shardsGain,
      grid: clearCurrentCell(r),
      log: [...r.log.slice(-6), `Victoria: +${shardsGain} fragmentos${lootLine}`],
    };
  };

  const playerAttack = (special: boolean) => {
    if (!run || !battle) return;
    if (special && run.shards < 15) return;

    const alive = battle.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return;

    const target = battle.enemies[battle.targetIndex]?.hp > 0 ? battle.targetIndex : battle.enemies.findIndex((e) => e.hp > 0);
    const base = Math.max(4, Math.round(run.power / 2) + rnd(6));
    const dmg = special ? Math.round(base * 2.1) : base;

    const enemies = battle.enemies.map((e, i) => (i === target ? { ...e, hp: decay(e.hp - dmg) } : e));
    const shards = special ? run.shards - 15 : run.shards;
    const lines = [...battle.log.slice(-4), `${special ? 'Tajo de plata' : 'Ataque'} sobre ${battle.enemies[target].name}: ${dmg} de daño.`];
    sound.playSFX(special ? 'furious' : 'slam');

    const remaining = enemies.filter((e) => e.hp > 0);
    if (remaining.length === 0) {
      const nextWave = battle.wave + 1;
      if (nextWave <= battle.waves) {
        setBattle({
          ...battle,
          enemies: makeEnemies(battle.kind, run.floor),
          wave: nextWave,
          log: [...lines, `Oleada ${battle.wave} superada. Llega la oleada ${nextWave}.`],
          targetIndex: 0,
        });
        setRun({ ...run, shards });
        return;
      }
      const finished = finishBattle({ ...run, shards }, battle.kind, run.hp);
      setBattle(null);
      setRun(finished);
      setResultOpen(battle.kind === 'boss' || finished.finished);
      return;
    }

    // Contraataque enemigo
    const incoming = remaining.reduce((sum, e) => sum + e.atk + rnd(3), 0);
    const hp = decay(run.hp - incoming);
    const dead = hp <= 0;

    setBattle({
      ...battle,
      enemies,
      log: [...lines, `Los enemigos golpean: -${incoming} PV.`],
      targetIndex: remaining[0] ? enemies.findIndex((e) => e.id === remaining[0].id) : 0,
    });
    setRun({
      ...run,
      shards,
      hp,
      defeated: dead,
      log: [...run.log.slice(-6), `${special ? 'Tajo de plata' : 'Ataque'}: -${incoming} PV`],
    });
    if (dead) {
      setBattle(null);
      setResultOpen(true);
      sound.playSFX('furious');
    }
  };

  const fleeBattle = () => {
    if (!run) return;
    setBattle(null);
    setRun({ ...run, hp: decay(run.hp - 8), log: [...run.log.slice(-6), 'Te retiras por la grieta: -8 PV.'] });
    sound.playSFX('whisper');
  };

  const openShopOffers = (): Offer[] => {
    if (!run) return [];
    return [
      {
        id: 'heal',
        name: 'Cataplasma de mina',
        description: 'Recupera 40 PV.',
        cost: 40,
        apply: (r) => ({ hp: Math.min(r.maxHp, r.hp + 40) }),
      },
      {
        id: 'power',
        name: 'Reforjar el filo',
        description: '+10 de fuerza permanente.',
        cost: 70,
        apply: (r) => ({ power: r.power + 10 }),
      },
      {
        id: 'loot',
        name: 'Mapa del capataz',
        description: 'Gema Primigenia y 25 fragmentos.',
        cost: 55,
        apply: (r) => {
          grantMineral(3);
          return { shards: r.shards + 25 };
        },
      },
    ];
  };

  const buyOffer = (offer: Offer) => {
    if (!run || run.shards < offer.cost) return;
    const patch = offer.apply(run);
    const gainedShards = (patch.shards ?? run.shards) - run.shards;
    setRun({
      ...run,
      ...patch,
      shards: run.shards - offer.cost + gainedShards,
      log: [...run.log.slice(-6), `Compra: ${offer.name} (-${offer.cost} fragmentos)`],
      grid: clearCurrentCell(run),
    });
    sound.playSFX('upgrade');
  };

  const chooseBuff = (buff: BuffChoice) => {
    if (!run) return;
    const patch = buff.apply(run);
    setRun({
      ...run,
      ...patch,
      hp: Math.max(0, Math.min(patch.maxHp ?? run.maxHp, patch.hp ?? run.hp)),
      log: [...run.log.slice(-6), `Pasiva obtenida: ${buff.name}`],
      grid: clearCurrentCell(run),
    });
    setBuffChoices(null);
    sound.playSFX('sparkle');
  };

  if (!run) {
    return (
      <div className="relative w-full h-full flex-1 overflow-y-auto no-scrollbar pb-28 text-stone-100 select-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/assets/backgrounds/silverpeack.png')" }}
        />
        <div className="absolute inset-0 bg-[#0a0604]/88" />
        <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-5">
          <div className="rounded-2xl border-2 border-[#7a5a2a]/70 bg-[#241708]/92 p-5 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-[#e8c87a]">
              <DoorOpen className="w-6 h-6" />
              <h2 className="font-serif font-black text-xl">Laberinto de Lloth</h2>
            </div>
            <img
              src="/assets/labyrinth/puerta_sello.png"
              alt="Puerta sellada de Lloth"
              className="w-28 sm:w-32 mx-auto rounded-lg border border-[#6d5940] shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            />
            <p className="text-xs text-stone-300 leading-relaxed">
              Tras la puerta sellada de los cristales baja una red de galerías trazada por los enanos y corrompida por el sello de
              Lloth. Elige camino panel a panel, recoge pasivas, compra en la tienda del capataz y rompe el sello de los tres
              pisos.
            </p>
            <ul className="text-[11px] text-stone-400 space-y-1">
              <li>· 3 pisos de 5×7 paneles con niebla: solo ves lo que tienes al lado.</li>
              <li>· Los paneles de combate, élite y jefe abren una pelea por turnos.</li>
              <li>· Cada piso termina en un guardián del sello.</li>
              <li>· Lo que saquees se guarda en tu inventario al instante.</li>
            </ul>
            <button
              onClick={startRun}
              className="w-full py-3 rounded-xl border-2 border-[#e7c78e] bg-gradient-to-b from-[#d8a862] via-[#a86f31] to-[#77481d] text-[#24150a] font-serif font-black text-sm shadow-[0_4px_0_#4b2a0c] hover:brightness-110 cursor-pointer"
            >
              Entrar al laberinto · fuerza {teamPower()}
            </button>
          </div>
          <button
            onClick={() => navigateTo('santuario')}
            className="w-full py-2.5 rounded-xl border border-stone-700 bg-stone-900/80 text-stone-300 text-xs font-bold cursor-pointer"
          >
            Volver a Silverpeack
          </button>
        </div>
      </div>
    );
  }

  const bossNeed = BOSS_POWER[run.floor - 1];
  const hpPct = Math.round((run.hp / run.maxHp) * 100);

  return (
    <div className="relative w-full h-full flex-1 overflow-y-auto no-scrollbar pb-28 select-none text-stone-100">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/assets/backgrounds/silverpeack.png')" }}
      />
      <div className="absolute inset-0 bg-[#0a0604]/90" />
      <div className="relative z-10 max-w-xl mx-auto px-3 pt-3 pb-40 space-y-2.5">
        <div className="rounded-xl border-2 border-[#6d5940] bg-gradient-to-b from-[#3a2f24]/95 to-[#1d1610]/95 p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#e8a75a]" />
              <h2 className="font-serif font-black text-[#f2ddb2] text-base">
                Piso {run.floor} de {TOTAL_FLOORS}
              </h2>
            </div>
            <button
              onClick={() => navigateTo('santuario')}
              className="text-[10px] px-2 py-1 rounded border border-stone-600 bg-black/40 text-stone-300 cursor-pointer"
            >
              Salir
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-black/60 border border-stone-700 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-stone-300 shrink-0">
              {run.hp}/{run.maxHp}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[#f0c477]">
              Fuerza {run.power} / guardián {bossNeed}
            </span>
            <span className="text-[#9fd4f0]">{run.shards} fragmentos</span>
          </div>
        </div>

        <div
          className="rounded-xl border-2 border-[#4a3c2b] bg-[#15100b]/95 p-2 sm:p-2.5 shadow-[inset_0_0_40px_rgba(0,0,0,0.7)] max-w-[300px] w-full mx-auto"
          style={{ backgroundImage: "url('/assets/labyrinth/losa.png')", backgroundSize: 'cover' }}
        >
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {run.grid.map((row, y) =>
              row.map((cell, x) => {
                const visible = isVisible(run, x, y);
                const here = run.x === x && run.y === y;
                const adjacent = Math.abs(run.x - x) + Math.abs(run.y - y) === 1;
                const clearedStyle = cell.cleared && !here;

                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => {
                      if (!here && adjacent) move(x - run.x, y - run.y);
                    }}
                    className={`relative aspect-square rounded-md border-2 flex items-center justify-center transition-all ${
                      !visible
                        ? 'border-[#2c231a] bg-[#0d0906] text-transparent'
                        : clearedStyle
                        ? 'border-[#3b3226] bg-[#1a140e] text-[#5a4a35] opacity-70'
                        : `bg-gradient-to-b ${panelTone(cell.type)} text-white/95 shadow-[0_2px_0_rgba(0,0,0,0.6)]`
                    } ${adjacent ? 'ring-1 ring-[#e8c87a]/60 cursor-pointer hover:brightness-115' : ''} ${
                      here ? 'ring-2 ring-[#f3dfb2] scale-[1.03]' : ''
                    }`}
                    title={visible ? (clearedStyle ? 'Panel despejado' : 'Panel del laberinto') : 'Niebla'}
                  >
                    {visible ? panelIcon(cell.type) : <span className="text-[#3a2f24] text-[10px]">?</span>}
                    {here && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#f3dfb2] border border-[#4b2a0c] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7a5a2a]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="grid grid-cols-3 gap-1.5">
            <span />
            <button
              onClick={() => move(0, -1)}
              className="w-11 h-11 rounded-lg border border-stone-600 bg-stone-800/90 flex items-center justify-center cursor-pointer active:translate-y-[1px]"
              title="Arriba"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <span />
            <button
              onClick={() => move(-1, 0)}
              className="w-11 h-11 rounded-lg border border-stone-600 bg-stone-800/90 flex items-center justify-center cursor-pointer active:translate-y-[1px]"
              title="Izquierda"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => move(0, 1)}
              className="w-11 h-11 rounded-lg border border-stone-600 bg-stone-800/90 flex items-center justify-center cursor-pointer active:translate-y-[1px]"
              title="Abajo"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => move(1, 0)}
              className="w-11 h-11 rounded-lg border border-stone-600 bg-stone-800/90 flex items-center justify-center cursor-pointer active:translate-y-[1px]"
              title="Derecha"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 rounded-lg border border-stone-700 bg-black/50 p-2 h-[86px] overflow-hidden">
            {run.log.slice(-3).map((line, i) => (
              <p key={i} className="text-[9.5px] leading-tight text-stone-400">
                {line}
              </p>
            ))}
          </div>
        </div>

        {buffChoices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <div className="w-full max-w-sm rounded-xl border-2 border-[#6d5940] bg-[#241b12] p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#f2ddb2]">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-serif font-black text-sm">Panel de pasiva</h3>
              </div>
              <p className="text-[11px] text-stone-400">Elige una mejora permanente para esta incursión.</p>
              {buffChoices.map((buff) => (
                <button
                  key={buff.id}
                  onClick={() => chooseBuff(buff)}
                  className="w-full text-left rounded-lg border border-stone-600 bg-stone-900/80 p-2.5 hover:border-[#c9a15d] cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#f0c477]">{buff.name}</div>
                  <div className="text-[10.5px] text-stone-400">{buff.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {shopOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <div className="w-full max-w-sm rounded-xl border-2 border-[#6d5940] bg-[#241b12] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#f2ddb2]">
                  <ShoppingBag className="w-4 h-4" />
                  <h3 className="font-serif font-black text-sm">Tienda del capataz</h3>
                </div>
                <span className="text-[10px] font-bold text-[#9fd4f0]">{run.shards} fr.</span>
              </div>
              {openShopOffers().map((offer) => (
                <button
                  key={offer.id}
                  disabled={run.shards < offer.cost}
                  onClick={() => buyOffer(offer)}
                  className={`w-full text-left rounded-lg border p-2.5 ${
                    run.shards >= offer.cost
                      ? 'border-stone-600 bg-stone-900/80 hover:border-[#c9a15d] cursor-pointer'
                      : 'border-stone-800 bg-stone-950/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-[#f0c477]">{offer.name}</span>
                    <span className="text-[10px] text-[#9fd4f0]">{offer.cost} fr.</span>
                  </div>
                  <div className="text-[10.5px] text-stone-400">{offer.description}</div>
                </button>
              ))}
              <button
                onClick={() => {
                  setShopOpen(false);
                  setRun({ ...run, grid: clearCurrentCell(run) });
                }}
                className="w-full py-2 rounded-lg border border-stone-600 bg-stone-800 text-xs font-bold cursor-pointer"
              >
                Seguir bajando
              </button>
            </div>
          </div>
        )}

        {/* Combate */}
        {battle && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0705]/97 p-3 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#f0b27a]">
                  {battle.kind === 'boss' ? <Crown className="w-5 h-5" /> : battle.kind === 'elite' ? <Skull className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
                  <h3 className="font-serif font-black text-sm">
                    {battle.kind === 'boss' ? 'Guardián del sello' : battle.kind === 'elite' ? 'Patrulla de élite' : 'Combate en la galería'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  Oleada {battle.wave}/{battle.waves}
                </span>
              </div>

              {/* Enemigos */}
              <div className="flex items-end justify-center gap-2 min-h-[150px] rounded-xl border border-[#4a2a20] bg-gradient-to-b from-[#241310] to-[#140a07] p-2">
                {battle.enemies.map((enemy, i) => {
                  const dead = enemy.hp <= 0;
                  const targeted = battle.targetIndex === i && !dead;
                  return (
                    <button
                      key={enemy.id}
                      onClick={() => setBattle({ ...battle, targetIndex: i })}
                      className={`relative flex-1 max-w-[130px] rounded-lg border-2 p-1 transition-all ${
                        dead ? 'border-stone-800 opacity-30 grayscale' : targeted ? 'border-[#f0b27a] ring-2 ring-[#f0b27a]/40' : 'border-stone-700'
                      } cursor-pointer`}
                    >
                      <img src={enemy.art} alt={enemy.name} className="w-full h-24 object-contain" />
                      <div className="mt-1 h-1.5 rounded-full bg-black/70 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-700 to-rose-400" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                      </div>
                      <div className="text-[9px] text-stone-300 truncate mt-0.5">{enemy.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* Héroes */}
              <div className="flex items-center justify-center gap-1.5">
                {partyHeroes.map((h) => (
                  <div key={h.id} className="w-12 h-12 rounded-lg overflow-hidden border border-[#c9a758] bg-black shrink-0">
                    <img src={h.portrait} alt={h.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <div className="flex-1 h-2 rounded-full bg-black/60 border border-stone-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400" style={{ width: `${hpPct}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-stone-300">
                      {run.hp}/{run.maxHp}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#9fd4f0] mt-0.5">{run.shards} fragmentos</div>
                </div>
              </div>

              {/* Registro del combate */}
              <div className="rounded-lg border border-stone-700 bg-black/60 p-2 h-20 overflow-hidden">
                {battle.log.slice(-3).map((line, i) => (
                  <p key={i} className="text-[9.5px] leading-tight text-stone-400">
                    {line}
                  </p>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={() => playerAttack(false)}
                  className="flex-1 py-3 rounded-lg border-2 border-[#f0e2b6] bg-gradient-to-b from-[#63b3c9] via-[#3d879f] to-[#2a6272] text-white font-serif font-black text-xs shadow-[0_3px_0_#123f4c] cursor-pointer"
                >
                  Atacar
                </button>
                <button
                  disabled={run.shards < 15}
                  onClick={() => playerAttack(true)}
                  className={`flex-1 py-3 rounded-lg border-2 font-serif font-black text-xs flex items-center justify-center gap-1 ${
                    run.shards >= 15
                      ? 'border-[#fbeec2] bg-gradient-to-b from-[#f2d582] via-[#d9a94b] to-[#a97b26] text-[#3a2508] cursor-pointer'
                      : 'border-stone-700 bg-stone-900 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Tajo de plata (15 fr.)
                </button>
                <button
                  onClick={fleeBattle}
                  className="px-3 py-3 rounded-lg border border-stone-600 bg-stone-800 text-stone-300 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                >
                  <Footprints className="w-3.5 h-3.5" /> Huir
                </button>
              </div>
            </div>
          </div>
        )}

        {resultOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/88 p-4">
            <div className="w-full max-w-sm rounded-xl border-2 border-[#6d5940] bg-[#241b12] p-4 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-[#f2ddb2]">
                {run.finished ? <Crown className="w-5 h-5" /> : run.defeated ? <Skull className="w-5 h-5" /> : <Scroll className="w-5 h-5" />}
                <h3 className="font-serif font-black text-base">
                  {run.finished ? '¡Sello roto!' : run.defeated ? 'La oscuridad te reclama' : `Piso ${run.floor} superado`}
                </h3>
              </div>
              <p className="text-[11px] text-stone-300">
                {run.finished
                  ? 'Has abierto el Laberinto de Lloth. El botín mineral ya está en tu inventario.'
                  : run.defeated
                  ? 'Tus héroes se retiran del laberinto. Lo saqueado se queda en el inventario.'
                  : 'La puerta al piso siguiente está abierta.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setResultOpen(false);
                    if (run.finished || run.defeated) setRun(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-[#c9b189] bg-stone-800 text-xs font-bold cursor-pointer"
                >
                  {run.finished || run.defeated ? 'Cerrar' : 'Continuar'}
                </button>
                {(run.finished || run.defeated) && (
                  <button
                    onClick={() => {
                      setResultOpen(false);
                      startRun();
                    }}
                    className="flex-1 py-2.5 rounded-lg border-2 border-[#e7c78e] bg-gradient-to-b from-[#d8a862] via-[#a86f31] to-[#77481d] text-[#24150a] font-serif font-black text-xs cursor-pointer"
                  >
                    Nueva incursión
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
