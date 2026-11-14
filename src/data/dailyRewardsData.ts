// Recompensas diarias del Bastión de Icespear.
// Ciclo de 7 días: al reclamar el día 7, la racha vuelve al día 1.
// Se entregan al cargar el juego por primera vez en el día (estilo 7DS GC / Tensura / Fate).

export interface DailyRewardItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  category: 'materials' | 'food' | 'tools' | 'cards' | 'equipment';
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  description: string;
  priceGold: number;
}

export interface DailyRewardDay {
  day: number;
  title: string;
  subtitle: string;
  /** Icono principal que se muestra en el foco del día. */
  icon: string;
  gold?: number;
  crystals?: number;
  items?: DailyRewardItem[];
  /** El día 7 es el gran premio: se destaca en ámbar. */
  grand?: boolean;
}

export const DAILY_REWARDS: DailyRewardDay[] = [
  {
    day: 1,
    title: 'Ración del Alba',
    subtitle: 'La guarnición reparte el primer rancho del día.',
    icon: '/assets/items/moneda_de_moonhaven.png',
    gold: 2000,
    crystals: 60,
  },
  {
    day: 2,
    title: 'Suministros de Patrulla',
    subtitle: 'El botín de las rondas nocturnas de Ravenholm.',
    icon: '/assets/items/moneda_de_moonhaven.png',
    gold: 3000,
    crystals: 90,
  },
  {
    day: 3,
    title: 'Víveres del Fogón',
    subtitle: 'Pan recién horneado por el cocinero de Icespear.',
    icon: '/assets/items/panes_de_ajo.png',
    crystals: 120,
    items: [
      {
        id: 'food_pan_ajo',
        name: 'Panes de Ajo Dorados',
        icon: '/assets/items/panes_de_ajo.png',
        count: 2,
        category: 'food',
        rarity: 'R',
        description: 'Bocados crujientes con mantequilla. Concede al instante +2 Orbes Definitivos.',
        priceGold: 180,
      },
    ],
  },
  {
    day: 4,
    title: 'Tributo del Bastión',
    subtitle: 'El capitán reconoce tu servicio en la frontera.',
    icon: '/assets/items/gema_del_recuerdo.png',
    gold: 5000,
    crystals: 150,
  },
  {
    day: 5,
    title: 'Veta de la Herrería',
    subtitle: 'Metal templado listo para el yunque de Goryn.',
    icon: '/assets/items/lingote_app.png',
    crystals: 200,
    items: [
      {
        id: 'ingot_hierro',
        name: 'Lingote de Hierro',
        icon: '/assets/items/lingote_app.png',
        count: 3,
        category: 'materials',
        rarity: 'R',
        description: 'Lingote de hierro templado indispensable para forjar espadas y armaduras.',
        priceGold: 200,
      },
    ],
  },
  {
    day: 6,
    title: 'Elixir de Campaña',
    subtitle: 'Reservas del botiquín para las noches más frías.',
    icon: '/assets/items/boton_pocion.png',
    crystals: 300,
    items: [
      {
        id: 'pocion_vida_mayor',
        name: 'Poción de Vida Mayor',
        icon: '/assets/items/boton_pocion.png',
        count: 2,
        category: 'food',
        rarity: 'SR',
        description: 'Elixir revitalizante de manantial. Restaura 50 PV de Magordito de inmediato.',
        priceGold: 150,
      },
    ],
  },
  {
    day: 7,
    title: 'Cofre del Bastión',
    subtitle: 'Botín mayor por completar la semana de servicio.',
    icon: '/assets/items/cofre_de_tintes_app.png',
    gold: 25000,
    crystals: 800,
    grand: true,
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
];

export const getDailyReward = (day: number): DailyRewardDay =>
  DAILY_REWARDS.find((r) => r.day === day) ?? DAILY_REWARDS[0];
