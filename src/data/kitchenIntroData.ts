import type { DialogueLine } from './storyDialogueData';
import type { IngredientCategory } from './cookingData';

/**
 * Primera visita al Fogón de Icespear.
 * La bienvenida de Paco se reproduce con el mismo sistema de diálogo que las misiones
 * (AUTO / LOG / SKIP, retrato, placa de nombre y panel de texto).
 */

/** Claves de guardado local: cinemática vista y tutorial completado. */
export const KITCHEN_INTRO_SEEN_KEY = 'cdd_kitchen_intro_seen_v1';
export const KITCHEN_TUTORIAL_DONE_KEY = 'cdd_kitchen_tutorial_done_v1';

/** Identificador de misión ficticia que abre la cinemática de Paco. */
export const KITCHEN_INTRO_MISSION_ID = 'cocina_paco';

/**
 * Primera vez que se abre la rueda de Monstruos: Paco explica de dónde salen
 * los materiales exóticos y que se pueden cocinar.
 */
export const KITCHEN_MONSTERS_INTRO_SEEN_KEY = 'cdd_kitchen_monsters_intro_seen_v1';
export const KITCHEN_MONSTERS_INTRO_PENDING_KEY = 'cdd_kitchen_monsters_intro_pending_v1';
export const KITCHEN_MONSTERS_INTRO_MISSION_ID = 'cocina_monstruos';
/** La cocina de monstruos se desbloquea al conseguir el primer componente. */
export const KITCHEN_MONSTERS_UNLOCK_KEY = 'cdd_kitchen_monsters_unlocked_v1';

export const PACO_FOGON_DIALOGUE: DialogueLine[] = [
  {
    id: 'paco_fogon_01',
    act: 1,
    actTitle: 'El Fogón de Icespear',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: '¡Rompejonjuros! Vaya, vaya… no esperaba verte tan pronto por aquí. ¡Y justo en mis fogones!',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    emotion: 'beer',
    soundEffect: 'drink',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'paco_fogon_02',
    act: 1,
    actTitle: 'El Fogón de Icespear',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Pasa, pasa, ponte cómodo. Esta es mi cocina, el Fogón de Icespear: aquí se cocina con fuego lento y buen ojo.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    soundEffect: 'click',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'paco_fogon_03',
    act: 1,
    actTitle: 'El Fogón de Icespear',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Y mira qué oportuno: acabo de recibir una nueva orden de ingredientes. Todo fresco, recién bajado del mercado.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    emotion: 'sparkle',
    soundEffect: 'whisper',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'paco_fogon_04',
    act: 1,
    actTitle: 'El Fogón de Icespear',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Eso sí, que quede claro: no te acostumbres a la comida gratis. Aquí cada plato se cocina, se sirve… y se gana.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    emotion: 'laugh',
    soundEffect: 'laugh',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'paco_fogon_05',
    act: 1,
    actTitle: 'El Fogón de Icespear',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'La cocina es toda tuya, Rompejonjuros. Vamos, te enseño lo básico con el asado del día.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    soundEffect: 'fanfare',
    bgOverlay: 'tavern-warmth',
  },
];

export const PACO_MONSTERS_DIALOGUE: DialogueLine[] = [
  {
    id: 'paco_monstruos_01',
    act: 1,
    actTitle: 'Cocina Exótica',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Vaya, vaya… no sabía que tenías gustos tan exóticos, Rompejonjuros.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    emotion: 'sparkle',
    soundEffect: 'whisper',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'paco_monstruos_02',
    act: 1,
    actTitle: 'Cocina Exótica',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Algunos monstruos que mates podrás extraer sus componentes… y, por supuesto, cocinarlos.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    soundEffect: 'click',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'paco_monstruos_03',
    act: 1,
    actTitle: 'Cocina Exótica',
    speakerId: 'paco',
    speakerName: 'Paco',
    speakerTitle: 'Cocinero de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Carne de Devorador, larvas y huevos de Araknoide… con eso se hace cocina exótica. Aquí no se desperdicia nada, ni lo que sale de una cripta.',
    background: '/assets/backgrounds/cocina_taverna_icespear.png',
    emotion: 'laugh',
    soundEffect: 'laugh',
    bgOverlay: 'tavern-warmth',
  },
];

/**
 * Ingredientes del tutorial, en orden: pollo de corral, patata de Icespear y sal marina.
 */
export const KITCHEN_TUTORIAL_INGREDIENT_IDS = [
  'ing_pollo_calidad',
  'ing_patata_montana',
  'ing_sal_glacial',
] as const;

/**
 * Recorrido del tutorial de Paco: enseña a moverse por el menú (flecha atrás,
 * categoría e ingrediente) antes de cada uno de los tres ingredientes del asado.
 */
export type KitchenTutorialStep =
  | { kind: 'back' }
  | { kind: 'category'; category: IngredientCategory }
  | { kind: 'ingredient'; ingredientId: string };

export const KITCHEN_TUTORIAL_STEPS: KitchenTutorialStep[] = [
  { kind: 'category', category: 'carnes' },
  { kind: 'ingredient', ingredientId: 'ing_pollo_calidad' },
  { kind: 'back' },
  { kind: 'category', category: 'verduras' },
  { kind: 'ingredient', ingredientId: 'ing_patata_montana' },
  { kind: 'back' },
  { kind: 'category', category: 'especias' },
  { kind: 'ingredient', ingredientId: 'ing_sal_glacial' },
];
