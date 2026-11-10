import type { DialogueLine } from './storyDialogueData';

/**
 * Primera visita a la Forja de Icespear.
 * La bienvenida de Goryn usa el mismo sistema de diálogo que las misiones
 * (AUTO / LOG / SKIP, retrato, placa de nombre y panel de texto) y después
 * arranca un tutorial guiado para forjar la primera Espada de Hierro.
 */

/** Claves de guardado local: cinemática vista y tutorial completado. */
export const FORGE_INTRO_SEEN_KEY = 'cdd_forge_intro_seen_v1';
export const FORGE_TUTORIAL_DONE_KEY = 'cdd_forge_tutorial_done_v1';

/** Identificador de misión ficticia que abre la cinemática de Goryn. */
export const FORGE_INTRO_MISSION_ID = 'forja_goryn';

/** Pieza que enseña el tutorial y oro que Goryn pone de su bolsa. */
export const FORGE_TUTORIAL_ITEM_ID = 'espada_hierro';
export const FORGE_TUTORIAL_GOLD = 500;

/** Materiales que Goryn deja apartados en el yunque para la primera espada. */
export const FORGE_TUTORIAL_MATERIALS = [
  { name: 'Lingote de Hierro', icon: '/assets/items/lingote_app.png', count: 6 },
  {
    name: 'Mango de Espada',
    icon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
    count: 1,
  },
  { name: 'Kit de Herrería', icon: '/assets/items/kit_de_herreria_app.png', count: 1 },
] as const;

const FORGE_BACKGROUND = '/assets/backgrounds/herreria_fondo_icespear.png';

export const GORYN_FORGE_DIALOGUE: DialogueLine[] = [
  {
    id: 'goryn_forja_01',
    act: 1,
    actTitle: 'La Forja de Icespear',
    speakerId: 'goryn',
    speakerName: 'Goryn',
    speakerTitle: 'Herrero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Así que tú eres Rompejonjuros. Goryn, herrero de Icespear. El yunque no espera a nadie, muchacho: presta atención.',
    background: FORGE_BACKGROUND,
    emotion: 'contract',
    soundEffect: 'slam',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'goryn_forja_02',
    act: 1,
    actTitle: 'La Forja de Icespear',
    speakerId: 'goryn',
    speakerName: 'Goryn',
    speakerTitle: 'Herrero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Esta es la Forja de Icespear. Aquí el hierro se convierte en algo que te mantiene vivo un invierno más.',
    background: FORGE_BACKGROUND,
    soundEffect: 'click',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'goryn_forja_03',
    act: 1,
    actTitle: 'La Forja de Icespear',
    speakerId: 'goryn',
    speakerName: 'Goryn',
    speakerTitle: 'Herrero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Hoy vas a forjar tu primera Espada de Hierro. Nada de encantos ni florituras: acero honesto y bien templado.',
    background: FORGE_BACKGROUND,
    emotion: 'sparkle',
    soundEffect: 'whisper',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'goryn_forja_04',
    act: 1,
    actTitle: 'La Forja de Icespear',
    speakerId: 'goryn',
    speakerName: 'Goryn',
    speakerTitle: 'Herrero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Te dejo el lingote, el mango y el kit de herrería sobre la mesa. El oro de esta pieza corre de mi cuenta… una sola vez.',
    background: FORGE_BACKGROUND,
    emotion: 'laugh',
    soundEffect: 'laugh',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'goryn_forja_05',
    act: 1,
    actTitle: 'La Forja de Icespear',
    speakerId: 'goryn',
    speakerName: 'Goryn',
    speakerTitle: 'Herrero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Elige Armas, luego Espadas, y toca la Espada de Hierro. Cuando el yunque cante, será tuya. Vamos.',
    background: FORGE_BACKGROUND,
    soundEffect: 'fanfare',
    bgOverlay: 'tavern-warmth',
  },
];

/**
 * Recorrido del tutorial de Goryn: enseña a moverse por las categorías de la
 * forja y a fabricar la Espada de Hierro.
 */
export type ForgeTutorialStep =
  | { kind: 'category'; id: string }
  | { kind: 'subcategory'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'craft'; id: string };

export const FORGE_TUTORIAL_STEPS: ForgeTutorialStep[] = [
  { kind: 'category', id: 'Armas' },
  { kind: 'subcategory', id: 'Espadas' },
  { kind: 'item', id: FORGE_TUTORIAL_ITEM_ID },
  { kind: 'craft', id: FORGE_TUTORIAL_ITEM_ID },
];
