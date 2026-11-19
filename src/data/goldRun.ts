/**
 * Expedición roguelite de la Mazmorra de Midas (menú de oro del Bastión).
 *
 * - Se avanza capítulo a capítulo con la vida y los orbes con los que terminaste la sala anterior.
 * - Si mueres, la expedición vuelve al Capítulo I con la vida llena y sin power-ups.
 * - Cada capítulo completado otorga un power-up que se mantiene durante el resto de la expedición.
 */

export interface GoldRunChapter {
  id: number;
  numeral: string;
  theme: string;
  short: string;
}

export const GOLD_RUN_CHAPTERS: GoldRunChapter[] = [
  { id: 1, numeral: 'CAP I', theme: 'Enjambre de Veneno', short: 'ENJAMBRE' },
  { id: 2, numeral: 'CAP II', theme: 'Tundra de Escarcha', short: 'TUNDRA' },
  { id: 3, numeral: 'CAP III', theme: 'Escudos de Dragón', short: 'ESCUDOS' },
  { id: 4, numeral: 'CAP IV', theme: 'Jauría Carmesí', short: 'DRACOS' },
  { id: 5, numeral: 'CAP V', theme: 'Campeones del Fuego', short: 'SEMIDRAG.' },
  { id: 6, numeral: 'CAP VI', theme: 'Antesala del Tirano', short: 'CULTO' },
];

/** Salas por capítulo: cada sala es una tarjeta del menú (10 salas + jefe). */
export const GOLD_RUN_LEVELS_PER_CHAPTER = 10;

/** Identificador de una sala de la expedición. */
export const goldRunLevelMissionId = (chapter: number, level: number): string =>
  `midas_lvl_${chapter}_${level}`;

export const parseGoldRunLevelMissionId = (
  missionId: string | null | undefined
): { chapter: number; level: number } | null => {
  if (!missionId) return null;
  const match = /^midas_lvl_(\d{1,2})_(\d{1,2})$/.exec(missionId);
  if (!match) return null;
  const chapter = Number(match[1]);
  const level = Number(match[2]);
  if (!Number.isFinite(chapter) || !Number.isFinite(level)) return null;
  if (chapter < 1 || chapter > GOLD_RUN_CHAPTERS.length) return null;
  if (level < 1 || level > GOLD_RUN_LEVELS_PER_CHAPTER) return null;
  return { chapter, level };
};

/**
 * Misión de oleadas que ambienta cada capítulo: de ahí salen el pool de enemigos,
 * el fondo y la dificultad de sus salas. El Capítulo I reparte sus diez salas
 * entre la fauna de la bóveda y la guardia áurea.
 */
const GOLD_RUN_CHAPTER_LEVEL_SOURCES: Record<number, string[]> = {
  1: ['midas_dungeon_easy_insectos', 'midas_dungeon_easy_aurumvorax'],
  2: ['midas_dungeon_n2_c1_kobolds_alados'],
  3: ['midas_dungeon_n2_c2_escudos_dragon'],
  4: ['midas_dungeon_n2_c3_dracos_guardianes'],
  5: ['midas_dungeon_n2_c4_semidragones_rojos'],
  6: ['midas_dungeon_n2_c5_horda_ignivrax'],
};

const chapterLevelMissionIds = (chapter: number): string[] =>
  Array.from({ length: GOLD_RUN_LEVELS_PER_CHAPTER }, (_, i) =>
    goldRunLevelMissionId(chapter, i + 1)
  );

/** Misiones que hay que superar para cerrar cada capítulo (en orden de expedición). */
export const GOLD_RUN_CHAPTER_MISSIONS: Record<number, string[]> = {
  1: [...chapterLevelMissionIds(1), 'midas_dungeon_boss_mimico'],
  2: [...chapterLevelMissionIds(2), 'midas_dungeon_boss_caballero'],
  3: chapterLevelMissionIds(3),
  4: chapterLevelMissionIds(4),
  5: chapterLevelMissionIds(5),
  6: [...chapterLevelMissionIds(6), 'midas_dungeon_boss_ignivrax'],
};

/** Misión de oleadas cuyo pool de enemigos usa una sala concreta. */
export const goldRunLevelSourceMission = (chapter: number, level: number): string => {
  const sources =
    GOLD_RUN_CHAPTER_LEVEL_SOURCES[chapter] ?? GOLD_RUN_CHAPTER_LEVEL_SOURCES[1];
  const perSource = GOLD_RUN_LEVELS_PER_CHAPTER / sources.length;
  const index = Math.min(
    sources.length - 1,
    Math.max(0, Math.floor((level - 1) / perSource))
  );
  return sources[index];
};

/** Última sala de cada tramo: ahí se entrega el botín de ese tramo. */
export const goldRunLevelDropMission = (
  missionId: string | null | undefined
): string | null => {
  const parsed = parseGoldRunLevelMissionId(missionId);
  if (!parsed) return null;
  const sources =
    GOLD_RUN_CHAPTER_LEVEL_SOURCES[parsed.chapter] ?? GOLD_RUN_CHAPTER_LEVEL_SOURCES[1];
  const perSource = GOLD_RUN_LEVELS_PER_CHAPTER / sources.length;
  const index = Math.min(
    sources.length - 1,
    Math.max(0, Math.floor((parsed.level - 1) / perSource))
  );
  const lastLevel = Math.min(
    GOLD_RUN_LEVELS_PER_CHAPTER,
    Math.round((index + 1) * perSource)
  );
  return parsed.level === lastLevel ? sources[index] : null;
};

const LEGACY_GOLD_RUN_MISSIONS = Object.values(GOLD_RUN_CHAPTER_LEVEL_SOURCES).flat();

export const isGoldRunMission = (missionId: string | null | undefined): boolean =>
  Boolean(
    missionId &&
      (LEGACY_GOLD_RUN_MISSIONS.includes(missionId) ||
        Object.values(GOLD_RUN_CHAPTER_MISSIONS).some((ids) => ids.includes(missionId)))
  );

export const goldRunChapterOfMission = (missionId: string | null | undefined): number | null => {
  if (!missionId) return null;
  const entry = Object.entries(GOLD_RUN_CHAPTER_MISSIONS).find(([, ids]) =>
    ids.includes(missionId)
  );
  if (entry) return Number(entry[0]);
  const legacyEntry = Object.entries(GOLD_RUN_CHAPTER_LEVEL_SOURCES).find(([, ids]) =>
    ids.includes(missionId)
  );
  return legacyEntry ? Number(legacyEntry[0]) : null;
};

export interface GoldRunBoon {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const GOLD_RUN_BOONS: GoldRunBoon[] = [
  {
    id: 'gold_atk',
    name: 'Furia Áurea',
    desc: '+12 % de ATQ durante el resto de la expedición.',
    icon: '⚔️',
  },
  {
    id: 'gold_hp',
    name: 'Corazón de Oro',
    desc: '+18 % de vida máxima en la expedición.',
    icon: '❤️',
  },
  {
    id: 'gold_orb',
    name: 'Chispa de Midas',
    desc: '+1 orbe de definitiva al empezar cada sala.',
    icon: '🔮',
  },
  {
    id: 'gold_regen',
    name: 'Bruma Restauradora',
    desc: 'Cura un 25 % de la vida al empezar cada sala.',
    icon: '✨',
  },
];

export interface GoldRunState {
  active: boolean;
  chapter: number;
  /** Vida con la que quedó el escuadrón (0-1 sobre la vida máxima). */
  hpPct: number;
  orbs: number;
  cleared: string[];
  boons: string[];
  lastBoon: string | null;
  finished: boolean;
  /** Semilla de la expedición: cada run nueva baraja las salas de la Mazmorra. */
  seed: number;
}

const STORAGE_KEY = 'cdd_gold_run_v1';

const freshRun = (): GoldRunState => ({
  active: false,
  chapter: 1,
  hpPct: 1,
  orbs: 0,
  cleared: [],
  boons: [],
  lastBoon: null,
  finished: false,
  seed: 1,
});

/** Semilla nueva: cada expedición (primera o tras morir) baraja las salas otra vez. */
const rollSeed = (): number => Math.floor(Math.random() * 1_000_000_000) + 1;

export const loadGoldRun = (): GoldRunState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshRun();
    const parsed = JSON.parse(raw) as Partial<GoldRunState>;
    return {
      ...freshRun(),
      ...parsed,
      cleared: Array.isArray(parsed.cleared) ? parsed.cleared : [],
      boons: Array.isArray(parsed.boons) ? parsed.boons : [],
      chapter: Math.min(6, Math.max(1, Number(parsed.chapter) || 1)),
      hpPct: Math.min(1, Math.max(0, Number(parsed.hpPct ?? 1))),
      orbs: Math.max(0, Number(parsed.orbs) || 0),
      seed: Math.max(1, Math.floor(Number(parsed.seed)) || 1),
    };
  } catch {
    return freshRun();
  }
};

export const saveGoldRun = (run: GoldRunState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch {
    // sin persistencia: la expedición sigue viva en memoria de la partida
  }
};

/** Empieza una expedición nueva desde el Capítulo I con la vida llena. */
export const startGoldRun = (): GoldRunState => {
  const run: GoldRunState = { ...freshRun(), active: true, seed: rollSeed() };
  saveGoldRun(run);
  return run;
};

/** Muerte en la expedición: se vuelve al principio (Capítulo I, vida llena, sin power-ups). */
export const resetGoldRun = (): GoldRunState => {
  const run: GoldRunState = { ...freshRun(), active: true, seed: rollSeed() };
  saveGoldRun(run);
  return run;
};

/** Guarda la vida/orbes con los que vas terminando cada sala. */
export const recordGoldRunProgress = (hpPct: number, orbs: number): GoldRunState => {
  const run = loadGoldRun();
  const next: GoldRunState = {
    ...run,
    active: true,
    hpPct: Math.min(1, Math.max(0, hpPct)),
    orbs: Math.max(0, Math.round(orbs)),
  };
  saveGoldRun(next);
  return next;
};

export const goldRunBoonCount = (boons: string[], id: string): number =>
  boons.filter((b) => b === id).length;

export const goldRunMaxHpMultiplier = (boons: string[]): number =>
  1 + 0.18 * goldRunBoonCount(boons, 'gold_hp');

export const goldRunAtkMultiplier = (boons: string[]): number =>
  1 + 0.12 * goldRunBoonCount(boons, 'gold_atk');

export const goldRunStartOrbs = (boons: string[]): number => goldRunBoonCount(boons, 'gold_orb');

export const goldRunRoomHealPct = (boons: string[]): number => 0.25 * goldRunBoonCount(boons, 'gold_regen');

/**
 * Marca una misión de la expedición como superada y, si con ella se cierra el capítulo,
 * entrega un power-up y abre el siguiente capítulo.
 */
export const clearGoldRunMission = (
  missionId: string
): { run: GoldRunState; chapterCompleted: boolean; boon: GoldRunBoon | null } => {
  const run = loadGoldRun();
  if (!isGoldRunMission(missionId)) return { run, chapterCompleted: false, boon: null };

  const alreadyCleared = run.cleared.includes(missionId);
  const cleared = alreadyCleared ? run.cleared : [...run.cleared, missionId];
  const chapter = goldRunChapterOfMission(missionId) ?? run.chapter;
  const chapterMissions = GOLD_RUN_CHAPTER_MISSIONS[chapter] ?? [];
  const chapterDone =
    chapterMissions.length > 0 && chapterMissions.every((id) => cleared.includes(id));
  const shouldGrant = chapterDone && !alreadyCleared && run.chapter <= chapter && !run.finished;

  let next: GoldRunState = { ...run, active: true, cleared };

  if (shouldGrant) {
    const owned = new Set(run.boons);
    const pool = GOLD_RUN_BOONS.filter((b) => !owned.has(b.id));
    const boon = (pool.length > 0 ? pool : GOLD_RUN_BOONS)[
      Math.floor(Math.random() * (pool.length > 0 ? pool.length : GOLD_RUN_BOONS.length))
    ];
    const nextChapter = Math.min(6, chapter + 1);
    next = {
      ...next,
      chapter: nextChapter,
      boons: [...run.boons, boon.id],
      lastBoon: boon.id,
      finished: chapter === 6,
    };
    saveGoldRun(next);
    return { run: next, chapterCompleted: true, boon };
  }

  saveGoldRun(next);
  return { run: next, chapterCompleted: false, boon: null };
};
