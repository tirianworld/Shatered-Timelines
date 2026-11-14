// Portadores de las Recompensas Diarias: el héroe asignado entrega el tributo
// del día con un diálogo propio (al estilo del maestro de ceremonias de 7DS GC).

export interface DailyPresenterLines {
  /** Frases antes de reclamar (se rota según el día de la racha). */
  greeting: string[];
  /** Frase especial cuando el premio del día es el gran cofre semanal. */
  grandPrize: string;
  /** Frase cuando el tributo de hoy ya se ha reclamado. */
  claimed: string;
  /** Confirmación al asignarlo como portador. */
  assigned: string;
}

export interface DailyPresenter {
  id: string;
  name: string;
  title: string;
  /** Sprite de cuerpo completo que aparece en escena. */
  sprite: string;
  portrait: string;
  /** Color de aura del personaje. */
  accent: string;
  attribute: string;
  lines: DailyPresenterLines;
}

export const DAILY_PRESENTERS: DailyPresenter[] = [
  {
    id: 'edacorn',
    name: 'Edacorn',
    title: 'Vanguardia de Acero',
    sprite: '/assets/combat/edacorn_idle.png',
    portrait: '/assets/portraits/edacorn_icono.png',
    accent: '#7dd3fc',
    attribute: 'Hielo',
    lines: {
      greeting: [
        'Centinela. El parte del día está sobre la mesa: suministros de la guarnición, ganados con disciplina.',
        'La frontera aguanta un día más gracias a ti. Toma lo que te corresponde, y sin demora.',
        'Revisé las reservas al alba. Esto es tuyo por derecho; el deber no se paga con palabras.',
      ],
      grandPrize:
        'Una semana entera sin ceder terreno. El Bastión abre su cofre mayor: que no te tiemble el pulso al reclamarlo.',
      claimed: 'Ya has cobrado el parte de hoy. Vuelve al alba; la guardia no duerme.',
      assigned: 'Si es voluntad del Bastión, seré yo quien te entregue el parte diario.',
    },
  },
  {
    id: 'magordito',
    name: 'Magordito',
    title: 'Nigromante Oscuro',
    sprite: '/assets/combat/magordito_idle.png',
    portrait: '/assets/portraits/Magordito.png',
    accent: '#a78bfa',
    attribute: 'Profano',
    lines: {
      greeting: [
        'Vaya, sigues vivo. Eso ya es motivo de recompensa, aunque sea por pura estadística.',
        'No me mires así: la guarnición paga y yo solo canalizo el reparto. La muerte no da propinas.',
        'Los muertos no reclaman. Tú sí. Aprovecha antes de que cambie de idea.',
      ],
      grandPrize:
        'Siete días sin desaparecer. Impresionante, incluso para un cadáver bien conservado. Toma el cofre y no me des las gracias.',
      claimed: 'Ya está cobrado. Ve a molestar a otro nigromante hasta mañana.',
      assigned: '¿Yo? Bien. Al menos así el reparto tendrá algo de estilo fúnebre.',
    },
  },
  {
    id: 'pepe_loux',
    name: 'Pepe Loux',
    title: 'Patriarca de la Mansión Loux',
    sprite: '/assets/combat/pepe_loux_idle.png',
    portrait: '/assets/portraits/pepe_loux.png',
    accent: '#fbbf24',
    attribute: 'Divino',
    lines: {
      greeting: [
        '¡Por el honor de la Casa Loux! Acepta este presente, digno de un aliado de nuestra estirpe.',
        'La munificencia es virtud de los grandes señores. Hoy, la Casa Loux es pródiga contigo.',
        'Nada hay más noble que recompensar el mérito. Extiende la mano, aventurero.',
      ],
      grandPrize:
        '¡Siete jornadas de lealtad! La Mansión Loux no olvida a quienes sirven con honor: abre el cofre de la semana.',
      claimed: 'El tributo de hoy ya está en tus arcas. La nobleza no se repite, amigo mío.',
      assigned: '¡Excelente elección! Nadie entrega un tributo con más distinción que un Loux.',
    },
  },
  {
    id: 'arlem_diaz',
    name: 'Arlem Díaz',
    title: 'Bardo Trovador',
    sprite: '/assets/combat/arlem_idle.png',
    portrait: '/assets/portraits/arlem_diaz_icono.png',
    accent: '#86efac',
    attribute: 'Natural',
    lines: {
      greeting: [
        '¡Ah, mi público favorito! Hoy tengo para ti una balada… y algo de oro en el compás final.',
        'Afina el oído: la fortuna suena mejor cuando la canta un trovador agradecido.',
        'Cada amanecer merece un verso, y cada verso, su recompensa. ¡Toma, amigo mío!',
      ],
      grandPrize:
        '¡Siete días de función sin desafinar! El Bis del Bastión es tuyo: ábrelo y que aplauda el destino.',
      claimed: 'La función de hoy ya terminó. Vuelve mañana y te dedico el bis.',
      assigned: '¿Yo de maestro de ceremonias? ¡Pues que empiece la música!',
    },
  },
];

export const DEFAULT_PRESENTER_ID = 'edacorn';

export const getDailyPresenter = (id: string | null | undefined): DailyPresenter =>
  DAILY_PRESENTERS.find((p) => p.id === id) ?? DAILY_PRESENTERS[0];

/** Frase que dice el portador según el estado del tributo. */
export const getPresenterLine = (
  presenter: DailyPresenter,
  options: { claimed: boolean; isGrandPrize: boolean; day: number; streak: number }
): string => {
  const { claimed, isGrandPrize, day, streak } = options;
  if (claimed) return presenter.lines.claimed;
  if (isGrandPrize) return presenter.lines.grandPrize;
  const index = Math.abs(day + streak) % presenter.lines.greeting.length;
  return presenter.lines.greeting[index];
};
