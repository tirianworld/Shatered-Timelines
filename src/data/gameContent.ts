import { SummonBanner, PatrolMission, InventoryItem, EquipmentItem } from '../types/game';

export const BANNERS: SummonBanner[] = [
  {
    id: 'banner_icespear',
    name: 'Estandarte de Icespear',
    subtitle: 'La Vanguardia de la Luz Glacial',
    description: 'Mayor probabilidad de invocar a Kairon (UR Gunslinger) y Edacorn (SSR Vanguardia).',
    featuredHeroIds: ['kairon', 'edacorn', 'arthorius'],
    costSingle: 100,
    costMulti: 900,
    bannerImage: '/assets/backgrounds/icespear_banner.png',
    dropRates: {
      UR: 0.03, // 3%
      SSR: 0.12, // 12%
      SR: 0.35, // 35%
      R: 0.50, // 50%
    },
  },
  {
    id: 'banner_mercado_negro',
    name: 'Mercado Negro de las Sombras',
    subtitle: 'El Pacto Secreto de los Bajos Fondos',
    description: 'Probabilidad aumentada para El Barón (UR Hechicero) y Roxanne (SR Cazadora).',
    featuredHeroIds: ['el_baron', 'roxanne', 'chispo_deez'],
    costSingle: 100,
    costMulti: 900,
    bannerImage: '/assets/backgrounds/fondo_baron.png',
    dropRates: {
      UR: 0.035,
      SSR: 0.115,
      SR: 0.35,
      R: 0.50,
    },
  },
  {
    id: 'banner_loux_astral',
    name: 'Invocación de la Mansión Loux',
    subtitle: 'Linaje Ancestral y Arcanos',
    description: 'Probabilidad aumentada para Pepe Loux (UR Guerrero), Aeliana (SSR Archimaga) y Prometeo (SSR Mago).',
    featuredHeroIds: ['pepe_loux', 'aeliana', 'prometeo', 'smurph_draco'],
    costSingle: 100,
    costMulti: 900,
    bannerImage: '/assets/backgrounds/mansion_loux.png',
    dropRates: {
      UR: 0.03,
      SSR: 0.13,
      SR: 0.34,
      R: 0.50,
    },
  },
];

export const PATROLS: PatrolMission[] = [
  {
    id: 'patrol_1',
    name: 'Murallas de Icespear',
    region: 'Frontera Norte',
    durationSeconds: 30, // 30s for quick action, or scaling
    description: 'Vigilar los torreones de hielo frente a merodeadores orcos y lobos hambrientos.',
    bgImage: '/assets/backgrounds/fondo_icespear.png',
    recommendedPower: 400,
    rewards: {
      gold: 250,
      xp: 150,
      crystals: 15,
      materials: ['Hierro Gélido', 'Ración de Viaje'],
    },
  },
  {
    id: 'patrol_2',
    name: 'Cuevas de Icespear',
    region: 'Grutas Profundas',
    durationSeconds: 60,
    description: 'Adentrarse en las grutas subterráneas en busca de vetas de amatista y minerales preciosos.',
    bgImage: '/assets/backgrounds/cuevas_de_icespear.png',
    recommendedPower: 700,
    rewards: {
      gold: 500,
      xp: 320,
      crystals: 30,
      materials: ['Cristal de Amatista', 'Lingote de Plata'],
    },
  },
  {
    id: 'patrol_3',
    name: 'Mazmorra de la Taberna',
    region: 'Sótanos Clandestinos',
    durationSeconds: 120,
    description: 'Investigar los misteriosos ruidos y túneles ocultos bajo la bodega de la taberna.',
    bgImage: '/assets/backgrounds/mazmorra_taverna_icespear.png',
    recommendedPower: 1100,
    rewards: {
      gold: 900,
      xp: 600,
      crystals: 50,
      materials: ['Llave Misteriosa', 'Esencia de Sombra'],
    },
  },
  {
    id: 'patrol_4',
    name: 'Santuario de Cryovain',
    region: 'Cumbre Helada',
    durationSeconds: 180,
    description: 'Expedición de élite al altar del dragón de hielo para recuperar reliquias astrales.',
    bgImage: '/assets/backgrounds/icespear_combate_guardias.png',
    recommendedPower: 1600,
    rewards: {
      gold: 1600,
      xp: 1200,
      crystals: 100,
      materials: ['Escama de Cryovain', 'Núcleo Astral'],
    },
  },
  // --- Silverpeack (Pico de Plata): patrullas de mina, más largas y mejor pagadas ---
  {
    id: 'patrol_silverpeack_1',
    name: 'Galerías Superficiales',
    region: 'Silverpeack',
    durationSeconds: 300,
    description:
      'Peinar las galerías altas de la colonia en busca de vetas de plata recién expuestas y despejar de alimañas los raíles.',
    bgImage: '/assets/backgrounds/silverpeack.png',
    recommendedPower: 900,
    rewards: {
      gold: 0,
      xp: 0,
      crystals: 0,
      items: [
        { id: 'mineral_cobre', name: 'Mineral de Cobre', count: 12, icon: '/assets/items/lingote cobre app.png', rarity: 'R' },
        { id: 'gema_comun', name: 'Gema Común', count: 3, icon: '/assets/items/gema.png', rarity: 'R' },
      ],
    },
  },
  {
    id: 'patrol_silverpeack_2',
    name: 'Pozo Profundo de Glimmerstone',
    region: 'Silverpeack',
    durationSeconds: 900,
    description:
      'Descender con la vagoneta hasta los pozos inundados de la colonia antigua, donde la plata se mezcla con cristales azules.',
    bgImage: '/assets/backgrounds/minas_glimmerstone_profunda.png',
    recommendedPower: 1500,
    rewards: {
      gold: 0,
      xp: 0,
      crystals: 0,
      items: [
        { id: 'mineral_cobre', name: 'Mineral de Cobre', count: 25, icon: '/assets/items/lingote cobre app.png', rarity: 'R' },
        { id: 'mineral_plata', name: 'Mineral de Plata', count: 18, icon: '/assets/items/lingote plata app.png', rarity: 'SR' },
        { id: 'gema_azul', name: 'Gema Azul', count: 6, icon: '/assets/items/amatista app.png', rarity: 'SR' },
      ],
    },
  },
  {
    id: 'patrol_silverpeack_3',
    name: 'Puerta Sellada de los Cristales',
    region: 'Silverpeack',
    durationSeconds: 1800,
    description:
      'Expedición de élite a la puerta arcana del fondo de la colonia: vigilar el sello de Lloth y extraer los cristales que rezuman.',
    bgImage: '/assets/backgrounds/puertas_selladas_glimmerstone.png',
    recommendedPower: 2400,
    rewards: {
      gold: 0,
      xp: 0,
      crystals: 0,
      items: [
        { id: 'mineral_plata', name: 'Mineral de Plata', count: 40, icon: '/assets/items/lingote plata app.png', rarity: 'SR' },
        { id: 'mineral_oro', name: 'Mineral de Oro', count: 20, icon: '/assets/items/lingote oro  app.png', rarity: 'SSR' },
        { id: 'gema_primigenia', name: 'Gema Primigenia', count: 12, icon: '/assets/items/arcano gema app.png', rarity: 'SSR' },
      ],
    },
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'xp_potion_small',
    name: 'Poción de EXP Pequeña',
    type: 'consumable',
    rarity: 'R',
    count: 10,
    icon: '/assets/items/POCION ROJA.png',
    description: 'Otorga 150 puntos de experiencia a un héroe seleccionado.',
    usable: true,
    effect: { xpAmount: 150 },
  },
  {
    id: 'xp_potion_large',
    name: 'Elixir de EXP Mayor',
    type: 'consumable',
    rarity: 'SR',
    count: 4,
    icon: '/assets/items/POCION AZUL.png',
    description: 'Otorga 500 puntos de experiencia a un héroe seleccionado.',
    usable: true,
    effect: { xpAmount: 500 },
  },
  {
    id: 'lingote_hierro',
    name: 'Lingote de Hierro Gélido',
    type: 'material',
    rarity: 'R',
    count: 25,
    icon: '/assets/items/LINGOTE ACERO.png',
    description: 'Material indispensable para forjar y reforzar armas en la herrería.',
  },
  {
    id: 'amatista_astral',
    name: 'Cristal de Amatista Astral',
    type: 'material',
    rarity: 'SSR',
    count: 6,
    icon: '/assets/items/amatista_app.png',
    description: 'Gema imbuida con resonancia cósmica, usada para ascender equipo legendario.',
  },
];

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'espada_hielo_1',
    name: 'Espada de Acero de Icespear',
    type: 'weapon',
    rarity: 'SR',
    level: 1,
    stats: { attack: 45, critRate: 0.05 },
    icon: '/assets/items/ESPADA LOUX.png',
    description: 'Forjada en los hornos de Icespear con temple de nieve.',
  },
  {
    id: 'armadura_centinela_1',
    name: 'Coraza del Centinela',
    type: 'armor',
    rarity: 'SR',
    level: 1,
    stats: { hp: 200, defense: 35 },
    icon: '/assets/items/ARMADURA LOUX.png',
    description: 'Placas de metal pulido capaces de resistir el embate de las bestias.',
  },
  {
    id: 'anillo_astral_1',
    name: 'Sello de la Casa Loux',
    type: 'ring',
    rarity: 'SSR',
    level: 1,
    stats: { attack: 30, defense: 20, hp: 120 },
    icon: '/assets/items/ANILLO ORO.png',
    description: 'Grabado con el blasón de la dinastía Loux.',
  },
];

export const SHOP_ITEMS = [
  {
    id: 'shop_crystals_single',
    name: 'Cristales de Invocación x100',
    type: 'currency',
    amount: 100,
    costGold: 1000,
    icon: '/assets/items/amatista_app.png',
    description: 'Permite realizar 1 tirada en cualquier estandarte.',
  },
  {
    id: 'shop_crystals_bundle',
    name: 'Lote de Invocación x900',
    type: 'currency',
    amount: 900,
    costGold: 8500,
    icon: '/assets/items/amatista_app.png',
    description: 'Suficiente para una tirada múltiple de 10 héroes.',
  },
  {
    id: 'shop_potions_pack',
    name: 'Pack de Pociones de EXP x5',
    type: 'consumable',
    amount: 5,
    costGold: 600,
    icon: '/assets/items/POCION AZUL.png',
    description: 'Para subir de nivel rápidamente a tus héroes.',
  },
  {
    id: 'shop_lingotes_pack',
    name: 'Lote de Lingotes x10',
    type: 'material',
    amount: 10,
    costGold: 1200,
    icon: '/assets/items/LINGOTE ACERO.png',
    description: 'Materiales esenciales de forja para la herrería.',
  },
  {
    id: 'shop_beer',
    name: 'Cerveza de Raíz Enana',
    type: 'consumable',
    amount: 3,
    costGold: 450,
    icon: '/assets/items/Bebida.png',
    description: 'Bebida espumosa favorita de los aventureros en la taberna.',
  },
];
