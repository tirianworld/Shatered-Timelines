import type { DialogueLine } from './storyDialogueData';

/**
 * Primera visita a la Sede de las Cumbres (Sede de Orden).
 * Nala, hija de Kurogame y jefa de la Sede de Gremios de Icespear, presenta el
 * nuevo mundo posterior al conjuro del mago negro y guía el uso de la sede.
 */

/** Claves de guardado local: cinemática vista y tutorial completado. */
export const ORDER_HQ_INTRO_SEEN_KEY = 'cdd_order_hq_intro_seen_v1';
export const ORDER_HQ_TUTORIAL_DONE_KEY = 'cdd_order_hq_tutorial_done_v1';

/** Identificador de misión ficticia que abre la cinemática de Nala. */
export const ORDER_HQ_INTRO_MISSION_ID = 'sede_nala';

const ORDER_HQ_BACKGROUND = '/assets/backgrounds/fondo_icespear_1.png';

export const NALA_ORDER_HQ_DIALOGUE: DialogueLine[] = [
  {
    id: 'nala_sede_01',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Así que tú eres quien ha estado moviendo la nieve de Icespear. Soy Nala, hija de Kurogame… y desde que mi padre colgó el escudo, la que responde por esta Sede de Gremios.',
    background: ORDER_HQ_BACKGROUND,
    soundEffect: 'click',
    bgOverlay: 'blizzard-frost',
  },
  {
    id: 'nala_sede_02',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Escúchame bien, porque esto no lo entenderás en la taberna. Desde que el mago negro lanzó su conjuro, el mundo dejó de ser el mapa que conocíamos.',
    background: ORDER_HQ_BACKGROUND,
    emotion: 'angry',
    soundEffect: 'whisper',
    bgOverlay: 'tense-shadow',
  },
  {
    id: 'nala_sede_03',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Cada semana aparecen rostros nuevos y misteriosos: guerreros que nadie ha visto nacer, bestias sin nombre y amenazas que ni los veteranos saben nombrar.',
    background: ORDER_HQ_BACKGROUND,
    emotion: 'sweat',
    soundEffect: 'click',
    bgOverlay: 'tense-shadow',
  },
  {
    id: 'nala_sede_04',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Lo que antes era una leyenda hoy es un aventurero más en la puerta. Y lo que acecha en el hielo ya no distingue entre soldados, aldeanos… o niños.',
    background: ORDER_HQ_BACKGROUND,
    soundEffect: 'whisper',
    bgOverlay: 'tense-shadow',
  },
  {
    id: 'nala_sede_05',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Por eso Alistar Vandimere abrió Sedes de Orden por todo Aeros… y más allá de donde alcanzan los caminos. Nadie sobrevive solo a lo que viene.',
    background: ORDER_HQ_BACKGROUND,
    emotion: 'exclamation',
    soundEffect: 'fanfare',
    bgOverlay: 'blizzard-frost',
  },
  {
    id: 'nala_sede_06',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Aquí se agrupan los aventureros fuertes. Se comparten bendiciones, se reparte el oro y se responde con acero cuando suena el cuerno de la Orden.',
    background: ORDER_HQ_BACKGROUND,
    soundEffect: 'click',
    bgOverlay: 'tavern-warmth',
  },
  {
    id: 'nala_sede_07',
    act: 1,
    actTitle: 'La Sede de las Cumbres',
    speakerId: 'nala',
    speakerName: 'Nala',
    speakerTitle: 'Jefa de la Sede de Gremios de Icespear',
    speakerSide: 'center',
    pose: 'default',
    text: 'Esta sede es tuya ahora. Funda tu propia Orden o únete a una que ya sangre por Icespear. Vamos, te enseño cómo se usa.',
    background: ORDER_HQ_BACKGROUND,
    emotion: 'laugh',
    soundEffect: 'laugh',
    bgOverlay: 'tavern-warmth',
  },
];

export type OrderHqTutorialTab = 'members' | 'perks' | 'leaderboard' | 'explore';

export interface OrderHqTutorialStep {
  tab: OrderHqTutorialTab;
  title: string;
  text: string;
}

/**
 * Tutorial guiado de Nala: cada paso pide tocar una pestaña concreta de la sede.
 * El último aviso cierra el tutorial y no vuelve a aparecer.
 */
export const ORDER_HQ_TUTORIAL_STEPS: OrderHqTutorialStep[] = [
  {
    tab: 'perks',
    title: 'Bendiciones',
    text: 'Abre Bendiciones. Son las mejoras que tu Orden compra con el oro de todos: cuanto más alto el rango, más fuertes salís todos.',
  },
  {
    tab: 'leaderboard',
    title: 'Ranking',
    text: 'Ahora el Ranking. Ahí verás qué Órdenes dominan Aeros. La tuya empieza abajo; el trabajo es lo único que la sube.',
  },
  {
    tab: 'explore',
    title: 'Órdenes',
    text: 'Por último, Órdenes. Puedes unirte a una hermandad ya fundada… o crear la tuya con nombre, lema y estandarte.',
  },
];

export const ORDER_HQ_TUTORIAL_FINAL = {
  title: 'La Sede es tuya',
  text: 'Eso es todo. La Hermandad guarda a los tuyos, las Bendiciones os hacen más fuertes, el Ranking mide vuestra gloria y las Órdenes os unen. Cuando el cuerno suene, responde.',
};
