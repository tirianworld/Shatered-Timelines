/**
 * Tutorial de las minas de Silverpeack (Capítulo II).
 * Boran y Thora ya conocen a Caldo de Dragón: no se presentan, le hablan como
 * a un compañero de fatigas mientras le señalan qué tocar en el tablón.
 * Cada paso del tutorial muestra su línea de diálogo, que aparece y desaparece
 * igual que el globo de Paco o Goryn en la cocina y la forja.
 */

/** Clave de guardado local: tutorial completado. */
export const MINES_TUTORIAL_DONE_KEY = 'cdd_mines_tutorial_done_v1';

/** Galería que se despliega en el tutorial (la más corta, 5 minutos). */
export const MINES_TUTORIAL_PATROL_ID = 'patrol_silverpeack_1';

/** Retrato compartido de los hermanos mineros. */
export const MINES_BROTHERS_PORTRAIT = '/assets/portraits/enanos_mineros_thumb.png';

export interface MinesTutorialLine {
  step: number;
  speaker: 'Boran' | 'Thora';
  title: string;
  text: string;
}

/** Una línea por paso, mezclada con el tutorial mientras el jugador pulsa. */
export const MINES_TUTORIAL_LINES: MinesTutorialLine[] = [
  {
    step: 0,
    speaker: 'Thora',
    title: 'Capataza de la Veta',
    text: 'Caldo, la Galería Superficial son cinco minutos y no se derrumba. Toca Desplegar ahí y te dejamos el pico listo.',
  },
  {
    step: 1,
    speaker: 'Boran',
    title: 'Hermano Mayor',
    text: 'Manda hasta tres héroes a la veta. Con uno ya arranca; con tres, el mineral sale antes de que se enfríe la lámpara.',
  },
  {
    step: 2,
    speaker: 'Thora',
    title: 'Capataza de la Veta',
    text: 'Ahora clava Desplegar patrulla y a picar. Nosotros nos quedamos vigilando que la galería aguante.',
  },
];

/** Despedida al completar el despliegue. */
export const MINES_TUTORIAL_FAREWELL: { speaker: 'Boran' | 'Thora'; title: string; text: string } = {
  speaker: 'Boran',
  title: 'Hermano Mayor',
  text: 'Así se hace. Cuando vuelvan, el renglón brilla y reclamas el mineral. Y recuerda: un héroe por galería.',
};

/**
 * Recorrido del tutorial: desplegar la galería de cobre, asignar héroes y
 * confirmar la partida.
 */
export type MinesTutorialStep = { kind: 'dispatch' } | { kind: 'heroes' } | { kind: 'confirm' };

export const MINES_TUTORIAL_STEPS: MinesTutorialStep[] = [
  { kind: 'dispatch' },
  { kind: 'heroes' },
  { kind: 'confirm' },
];
