import type { DialogueLine } from './storyDialogueData';

/**
 * Primera visita a la Botica de Pociones de Icespear.
 * La bienvenida de Raxxar usa el mismo sistema de diálogo que las misiones
 * (AUTO / LOG / SKIP, retrato, placa de nombre y panel de texto) y después
 * arranca un tutorial guiado para destilar la primera Poción de Vida Menor.
 */

/** Claves de guardado local: cinemática vista y tutorial completado. */
export const BOTICA_INTRO_SEEN_KEY = 'cdd_botica_intro_seen_v1';
export const BOTICA_TUTORIAL_DONE_KEY = 'cdd_botica_tutorial_done_v1';

/** Identificador de misión ficticia que abre la cinemática de Raxxar. */
export const BOTICA_INTRO_MISSION_ID = 'botica_raxxar';

/** Pieza que enseña el tutorial y oro que Raxxar pone de su bolsa. */
export const BOTICA_TUTORIAL_ITEM_ID = 'pocion_vida_menor';
export const BOTICA_TUTORIAL_GOLD = 200;

/** Materiales que Raxxar deja sobre el alambique para la primera poción. */
export const BOTICA_TUTORIAL_MATERIALS = [
  { name: 'Hierba de Icespear', icon: '/assets/items/shop_herb.png', count: 3 },
  { name: 'Semilla de Experiencia', icon: '/assets/items/semilla_xp.png', count: 2 },
  { name: 'Frasco de Destilación', icon: '/assets/items/recurso_26_4x.png', count: 1 },
] as const;

const BOTICA_BACKGROUND = '/assets/aistudio/image_180f7992.png';

export const RAXXAR_BOTICA_DIALOGUE: DialogueLine[] = [
  {
    id: 'raxxar_botica_01',
    act: 1,
    actTitle: 'La Botica de Icespear',
    speakerId: 'raxxar',
    speakerName: 'Raxxar',
    speakerTitle: 'Boticario de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Rompejonjuros. Justo a quien quería ver. Raxxar, boticario de Icespear. Pasa y no toques los frascos sin permiso, muchacho.',
    background: BOTICA_BACKGROUND,
    emotion: 'contract',
    soundEffect: 'click',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'raxxar_botica_02',
    act: 1,
    actTitle: 'La Botica de Icespear',
    speakerId: 'raxxar',
    speakerName: 'Raxxar',
    speakerTitle: 'Boticario de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Esta es la Botica: aquí se destilan pociones, encantamientos y aceites. Un buen brebaje te saca de la tumba; uno malo te mete en ella.',
    background: BOTICA_BACKGROUND,
    soundEffect: 'whisper',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'raxxar_botica_03',
    act: 1,
    actTitle: 'La Botica de Icespear',
    speakerId: 'raxxar',
    speakerName: 'Raxxar',
    speakerTitle: 'Boticario de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Hoy vas a destilar tu primera Poción de Vida Menor. Hierba fresca, semilla y un frasco limpio: nada más, nada menos.',
    background: BOTICA_BACKGROUND,
    emotion: 'sparkle',
    soundEffect: 'whisper',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'raxxar_botica_04',
    act: 1,
    actTitle: 'La Botica de Icespear',
    speakerId: 'raxxar',
    speakerName: 'Raxxar',
    speakerTitle: 'Boticario de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Te dejo las hierbas, la semilla y el frasco sobre el alambique. El oro de este encargo corre de mi cuenta… esta única vez.',
    background: BOTICA_BACKGROUND,
    emotion: 'laugh',
    soundEffect: 'laugh',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'raxxar_botica_05',
    act: 1,
    actTitle: 'La Botica de Icespear',
    speakerId: 'raxxar',
    speakerName: 'Raxxar',
    speakerTitle: 'Boticario de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Elige Pociones, toca la Poción de Vida Menor y pulsa DESTILAR. Cuando el frasco humee, será tuya. Vamos.',
    background: BOTICA_BACKGROUND,
    soundEffect: 'fanfare',
    bgOverlay: 'tavern-warmth',
  },
];

/**
 * Recorrido del tutorial de Raxxar: enseña a moverse por las categorías de la
 * botica y a destilar la Poción de Vida Menor.
 */
export type BoticaTutorialStep =
  | { kind: 'category'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'craft'; id: string };

export const BOTICA_TUTORIAL_STEPS: BoticaTutorialStep[] = [
  { kind: 'category', id: 'Pociones' },
  { kind: 'item', id: BOTICA_TUTORIAL_ITEM_ID },
  { kind: 'craft', id: BOTICA_TUTORIAL_ITEM_ID },
];
