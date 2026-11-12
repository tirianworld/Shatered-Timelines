// Evento de Bienvenida: 14 días de recompensas para jugadores nuevos.
// Se abre al cerrar las Recompensas Diarias y termina con la elección de un héroe.

export interface NewPlayerRewardItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  category: 'materials' | 'food' | 'tools' | 'cards' | 'equipment';
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  description: string;
  priceGold: number;
}

export interface NewPlayerEventStep {
  day: number;
  title: string;
  subtitle: string;
  icon: string;
  gold?: number;
  crystals?: number;
  items?: NewPlayerRewardItem[];
  /** Último paso: el jugador elige uno de los héroes de bienvenida. */
  heroChoice?: boolean;
}

export interface NewPlayerHeroChoice {
  id: string;
  name: string;
  title: string;
  portrait: string;
  sprite: string;
  accent: string;
  attribute: string;
  quote: string;
}

export const NEW_PLAYER_EVENT_DAYS = 14;

export const NEW_PLAYER_HERO_CHOICES: NewPlayerHeroChoice[] = [
  {
    id: 'chispo_deez',
    name: 'Chispo Deez',
    title: 'Paladín Enano Alado',
    portrait: '/assets/portraits/chispo_deez_icono.png',
    sprite: '/assets/combat/chispo_idle.png',
    accent: '#fbbf24',
    attribute: 'Divino',
    quote: '¡Por la luz divina y el peso sagrado de este martillo, serás juzgado!',
  },
  {
    id: 'giovani',
    name: 'Giovani Vázquez',
    title: 'Bribón Emplumado',
    portrait: '/assets/portraits/giovani_vazquez_icono.png',
    sprite: '/assets/combat/giovani_idle.png',
    accent: '#a78bfa',
    attribute: 'Profano',
    quote: '¿Crees que puedes atrapar a una sombra con plumas? Mira de cerca...',
  },
];

export const NEW_PLAYER_EVENT_STEPS: NewPlayerEventStep[] = [
  {
    day: 1,
    title: 'Suministros de Bienvenida',
    subtitle: 'El Bastión recibe a un nuevo aventurero con oro para empezar.',
    icon: '/assets/items/moneda_de_moonhaven.png',
    gold: 3000,
  },
  {
    day: 2,
    title: 'Cristales del Recuerdo',
    subtitle: 'Esencia astral para tus primeros sellos.',
    icon: '/assets/items/gema_del_recuerdo.png',
    crystals: 100,
  },
  {
    day: 3,
    title: 'Ración de Campaña',
    subtitle: 'Comida caliente del Fogón para el primer combate.',
    icon: '/assets/items/hamburguesa.png',
    items: [
      {
        id: 'food_hamburguesa',
        name: 'Hamburguesa Artesanal',
        icon: '/assets/items/hamburguesa.png',
        count: 2,
        category: 'food',
        rarity: 'SR',
        description: 'Carne asada de Icespear. Otorga +25% Ataque Total en combate.',
        priceGold: 200,
      },
    ],
  },
  {
    day: 4,
    title: 'Bolsa del Aventurero',
    subtitle: 'Lo que todo recluta necesita para no morir en la nieve.',
    icon: '/assets/items/moneda_de_moonhaven.png',
    gold: 6000,
  },
  {
    day: 5,
    title: 'Esencia Astral',
    subtitle: 'Los cristales del recuerdo guardan ecos de vidas pasadas.',
    icon: '/assets/items/gema_del_recuerdo.png',
    crystals: 150,
  },
  {
    day: 6,
    title: 'Rancho Caliente',
    subtitle: 'Un cuenco humeante para recuperar fuerzas entre oleadas.',
    icon: '/assets/items/ramen.png',
    items: [
      {
        id: 'food_ramen',
        name: 'Ramen Humeante',
        icon: '/assets/items/ramen.png',
        count: 2,
        category: 'food',
        rarity: 'SR',
        description: 'Caldo caliente artesanal. Restaura 40 PV y regenera +8 PV/turno.',
        priceGold: 220,
      },
    ],
  },
  {
    day: 7,
    title: 'Tributo del Bastión',
    subtitle: 'Media semana de servicio: oro y cristales de la guarnición.',
    icon: '/assets/items/gema_del_recuerdo.png',
    gold: 9000,
    crystals: 180,
  },
  {
    day: 8,
    title: 'Horno del Fogón',
    subtitle: 'Panes dorados que otorgan Orbes Definitivos.',
    icon: '/assets/items/panes_de_ajo.png',
    items: [
      {
        id: 'food_pan_ajo',
        name: 'Panes de Ajo Dorados',
        icon: '/assets/items/panes_de_ajo.png',
        count: 3,
        category: 'food',
        rarity: 'R',
        description: 'Bocados crujientes con mantequilla. Concede al instante +2 Orbes Definitivos.',
        priceGold: 180,
      },
    ],
  },
  {
    day: 9,
    title: 'Cofre de Cristales',
    subtitle: 'Una reserva generosa para tentar al destino en el gacha.',
    icon: '/assets/items/gema_del_recuerdo.png',
    crystals: 240,
  },
  {
    day: 10,
    title: 'Arcas del Norte',
    subtitle: 'El capitán Gabriel paga bien a quien sostiene la frontera.',
    icon: '/assets/items/moneda_de_moonhaven.png',
    gold: 14000,
  },
  {
    day: 11,
    title: 'Banquete del Gremio',
    subtitle: 'Pizza fundida, el favorito de la taberna de Arlem.',
    icon: '/assets/items/pizza.png',
    items: [
      {
        id: 'food_pizza',
        name: 'Pizza Fundida',
        icon: '/assets/items/pizza.png',
        count: 2,
        category: 'food',
        rarity: 'SR',
        description: 'Cuatro quesos al horno de piedra. Otorga +30% Defensa y Escudo Protector de 30 PV.',
        priceGold: 250,
      },
    ],
  },
  {
    day: 12,
    title: 'Tesoro de la Guarida',
    subtitle: 'Botín recuperado de las cuevas de Icespear.',
    icon: '/assets/items/moneda_de_moonhaven.png',
    gold: 18000,
    crystals: 300,
  },
  {
    day: 13,
    title: 'Víspera de la Elección',
    subtitle: 'Mañana elegirás a tu nuevo compañero de armas.',
    icon: '/assets/items/quesarito.png',
    crystals: 400,
    items: [
      {
        id: 'food_quesarito',
        name: 'Quesarito Picante',
        icon: '/assets/items/quesarito.png',
        count: 2,
        category: 'food',
        rarity: 'SR',
        description: 'Quesadilla enrollada especiada. Aumenta un +35% la Tasa Crítica y +50% Daño Crítico.',
        priceGold: 240,
      },
    ],
  },
  {
    day: 14,
    title: 'Héroe de Bienvenida',
    subtitle: 'Elige entre Chispo Deez y Giovani Vázquez para tu equipo.',
    icon: '/assets/portraits/chispo_deez_icono.png',
    heroChoice: true,
  },
];

export const getNewPlayerEventStep = (step: number): NewPlayerEventStep =>
  NEW_PLAYER_EVENT_STEPS[Math.min(Math.max(step, 1), NEW_PLAYER_EVENT_STEPS.length) - 1];
