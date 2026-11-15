/**
 * Catálogo de la Botica de Icespear: categorías, recetas destilables y los
 * materiales que consume cada una. Vive separado del menú para poder cambiar
 * precios o ingredientes sin tocar la interfaz.
 */

export type PotionCategoryId = 'Pociones' | 'Encantamientos' | 'Aceites para Armas';

export interface PotionCategory {
  id: PotionCategoryId;
  name: string;
  icon: string;
}

export interface PotionIngredientSpec {
  icon: string;
  name: string;
  need: number;
}

export interface PotionRecipe {
  id: string;
  name: string;
  category: PotionCategoryId;
  level: number;
  stars: number;
  icon: string;
  element: string;
  elementOrb: string;
  costGold: number;
  ingredients: PotionIngredientSpec[];
}

/** Nombres legibles de los materiales que aparecen en las recetas. */
export const POTION_MATERIAL_NAMES: Record<string, string> = {
  '/assets/items/shop_herb.png': 'Hierba de Icespear',
  '/assets/items/semilla_xp.png': 'Semilla de Experiencia',
  '/assets/items/planta_xp.png': 'Planta de Experiencia',
  '/assets/items/recurso_26_4x.png': 'Frasco de Destilación',
  '/assets/items/rubi_app.png': 'Rubí',
  '/assets/items/zafiro_app.png': 'Zafiro',
  '/assets/items/salvaje_gema_app.png': 'Gema Salvaje',
  '/assets/items/fragmento de quitina.png': 'Fragmento de Quitina',
  '/assets/items/kit_de_herreria_app.png': 'Kit de Herrería',
  '/assets/items/kit_de_joyeria_app.png': 'Kit de Joyería',
  '/assets/items/lingote_electrum_app.png': 'Lingote de Electrum',
  '/assets/items/lingote_oro_app.png': 'Lingote de Oro',
  '/assets/items/lingote_plata_app.png': 'Lingote de Plata',
  '/assets/items/lingote_cobre_app.png': 'Lingote de Cobre',
  '/assets/items/escamas_de_cryovain.png': 'Escamas de Cryovain',
  '/assets/items/medallon moonhaven app.png': 'Medallón de Moonhaven',
  '/assets/items/moneda de moonhaven.png': 'Moneda de Moonhaven',
};

export const POTION_CATEGORIES: readonly PotionCategory[] = [
  { id: 'Pociones', name: 'Pociones', icon: '/assets/aistudio/btn_pociones.png' },
  { id: 'Encantamientos', name: 'Encantamientos', icon: '/assets/aistudio/btn_encantamientos.png' },
  { id: 'Aceites para Armas', name: 'Aceites', icon: '/assets/aistudio/btn_aceites.png' },
];

const HERB = '/assets/items/shop_herb.png';
const SEED = '/assets/items/semilla_xp.png';
const PLANT = '/assets/items/planta_xp.png';
const FLASK = '/assets/items/recurso_26_4x.png';
const RUBY = '/assets/items/rubi_app.png';
const SAPPHIRE = '/assets/items/zafiro_app.png';
const WILD_GEM = '/assets/items/salvaje_gema_app.png';
const CHITIN = '/assets/items/fragmento de quitina.png';
const SMITH_KIT = '/assets/items/kit_de_herreria_app.png';
const JEWEL_KIT = '/assets/items/kit_de_joyeria_app.png';
const ELECTRUM = '/assets/items/lingote_electrum_app.png';
const GOLD_INGOT = '/assets/items/lingote_oro_app.png';
const SILVER_INGOT = '/assets/items/lingote_plata_app.png';
const COPPER_INGOT = '/assets/items/lingote_cobre_app.png';
const CRYOVAIN = '/assets/items/escamas_de_cryovain.png';
const MOONHAVEN_MEDAL = '/assets/items/medallon moonhaven app.png';
const MOONHAVEN_COIN = '/assets/items/moneda de moonhaven.png';

const NATURAL = '/assets/items/atributo_natural.png';
const ARCANE = '/assets/items/atributo_arcano.png';
const DIVINE = '/assets/items/atributo_fe.png';
const PROFANE = '/assets/items/atributo_oscuro.png';

const ing = (icon: string, need: number): PotionIngredientSpec => ({
  icon,
  name: POTION_MATERIAL_NAMES[icon] ?? 'Material',
  need,
});

export const POTION_RECIPES: readonly PotionRecipe[] = [
  // --- POCIONES ---
  {
    id: 'pocion_vida_menor',
    name: 'Poción de Vida Menor',
    category: 'Pociones',
    level: 1,
    stars: 2,
    icon: '/assets/items/vida_ui.png',
    element: 'Natural',
    elementOrb: NATURAL,
    costGold: 200,
    ingredients: [ing(HERB, 3), ing(SEED, 2), ing(FLASK, 1)],
  },
  {
    id: 'pocion_sangre_escarlata',
    name: 'Poción de Sangre Escarlata',
    category: 'Pociones',
    level: 2,
    stars: 3,
    icon: '/assets/items/vida_ui.png',
    element: 'Natural',
    elementOrb: NATURAL,
    costGold: 450,
    ingredients: [ing(HERB, 5), ing(RUBY, 2), ing(FLASK, 1)],
  },
  {
    id: 'elixir_rejuvenecimiento',
    name: 'Elixir de Rejuvenecimiento',
    category: 'Pociones',
    level: 3,
    stars: 3,
    icon: '/assets/items/boton_pocion.png',
    element: 'Divino',
    elementOrb: DIVINE,
    costGold: 900,
    ingredients: [ing(PLANT, 4), ing(SAPPHIRE, 2), ing(FLASK, 2)],
  },
  {
    id: 'lagrima_fenix_sagrado',
    name: 'Lágrima del Fénix Sagrado',
    category: 'Pociones',
    level: 4,
    stars: 4,
    icon: '/assets/items/raxxar_pocion.png',
    element: 'Divino',
    elementOrb: DIVINE,
    costGold: 1800,
    ingredients: [ing(PLANT, 8), ing(WILD_GEM, 3), ing(FLASK, 2)],
  },
  {
    id: 'frasco_eter_arcano',
    name: 'Frasco de Éter Arcano',
    category: 'Pociones',
    level: 2,
    stars: 3,
    icon: '/assets/items/zafiro_app.png',
    element: 'Arcano',
    elementOrb: ARCANE,
    costGold: 480,
    ingredients: [ing(HERB, 4), ing(SAPPHIRE, 2), ing(FLASK, 1)],
  },
  {
    id: 'furia_barbara_pocion',
    name: 'Brebaje de Furia Bárbara',
    category: 'Pociones',
    level: 2,
    stars: 3,
    icon: '/assets/items/rubi_app.png',
    element: 'Profano',
    elementOrb: PROFANE,
    costGold: 550,
    ingredients: [ing(HERB, 5), ing(RUBY, 2), ing(FLASK, 1)],
  },
  {
    id: 'unguento_piel_piedra',
    name: 'Ungüento de Piel de Piedra',
    category: 'Pociones',
    level: 2,
    stars: 2,
    icon: '/assets/items/planta_xp.png',
    element: 'Natural',
    elementOrb: NATURAL,
    costGold: 380,
    ingredients: [ing(HERB, 4), ing(SEED, 3), ing(FLASK, 1)],
  },
  {
    id: 'brebaje_secreto_raxxar',
    name: 'Brebaje Secreto de Raxxar',
    category: 'Pociones',
    level: 5,
    stars: 5,
    icon: '/assets/items/raxxar_pocion.png',
    element: 'Arcano',
    elementOrb: ARCANE,
    costGold: 2600,
    ingredients: [ing(PLANT, 8), ing(WILD_GEM, 3), ing(FLASK, 3)],
  },

  // --- ENCANTAMIENTOS ---
  {
    id: 'encantamiento_flamigero',
    name: 'Encantamiento de Filo Flamígero',
    category: 'Encantamientos',
    level: 2,
    stars: 3,
    icon: '/assets/items/rubi_app.png',
    element: 'Profano',
    elementOrb: PROFANE,
    costGold: 650,
    ingredients: [ing(RUBY, 3), ing(CHITIN, 2), ing(SMITH_KIT, 1)],
  },
  {
    id: 'runa_concentracion',
    name: 'Runa Arcana de Concentración',
    category: 'Encantamientos',
    level: 3,
    stars: 3,
    icon: '/assets/items/zafiro_app.png',
    element: 'Arcano',
    elementOrb: ARCANE,
    costGold: 850,
    ingredients: [ing(SAPPHIRE, 3), ing(ELECTRUM, 2), ing(JEWEL_KIT, 1)],
  },
  {
    id: 'sello_luz_sagrada',
    name: 'Sello de Luz Sagrada',
    category: 'Encantamientos',
    level: 3,
    stars: 4,
    icon: '/assets/items/salvaje_gema_app.png',
    element: 'Divino',
    elementOrb: DIVINE,
    costGold: 1400,
    ingredients: [ing(GOLD_INGOT, 3), ing(WILD_GEM, 2), ing(JEWEL_KIT, 2)],
  },
  {
    id: 'glifo_escudo_espectral',
    name: 'Glifo de Escudo Espectral',
    category: 'Encantamientos',
    level: 2,
    stars: 3,
    icon: '/assets/items/recurso_26_4x.png',
    element: 'Arcano',
    elementOrb: ARCANE,
    costGold: 950,
    ingredients: [ing(SILVER_INGOT, 3), ing(CRYOVAIN, 2), ing(SMITH_KIT, 1)],
  },
  {
    id: 'encantamiento_astral_moonhaven',
    name: 'Encantamiento Astral de Moonhaven',
    category: 'Encantamientos',
    level: 4,
    stars: 5,
    icon: '/assets/items/medallon moonhaven app.png',
    element: 'Arcano',
    elementOrb: ARCANE,
    costGold: 2400,
    ingredients: [ing(GOLD_INGOT, 5), ing(MOONHAVEN_COIN, 3), ing(JEWEL_KIT, 3)],
  },

  // --- ACEITES PARA ARMAS ---
  {
    id: 'aceite_filo_acero',
    name: 'Aceite de Filo Afilado',
    category: 'Aceites para Armas',
    level: 1,
    stars: 2,
    icon: '/assets/items/shop_herb.png',
    element: 'Natural',
    elementOrb: NATURAL,
    costGold: 280,
    ingredients: [ing(HERB, 4), ing(COPPER_INGOT, 2), ing(FLASK, 1)],
  },
  {
    id: 'veneno_sombra_profana',
    name: 'Veneno de Sombra Profana',
    category: 'Aceites para Armas',
    level: 2,
    stars: 3,
    icon: '/assets/items/fragmento de quitina.png',
    element: 'Profano',
    elementOrb: PROFANE,
    costGold: 580,
    ingredients: [ing(CHITIN, 4), ing(PLANT, 3), ing(FLASK, 1)],
  },
  {
    id: 'aceite_igneo_dragon',
    name: 'Aceite Ígneo de Dragón',
    category: 'Aceites para Armas',
    level: 3,
    stars: 4,
    icon: '/assets/items/rubi_app.png',
    element: 'Profano',
    elementOrb: PROFANE,
    costGold: 1250,
    ingredients: [ing(RUBY, 3), ing(CHITIN, 4), ing(FLASK, 2)],
  },
  {
    id: 'unguento_congelante_cryovain',
    name: 'Ungüento Congelante de Cryovain',
    category: 'Aceites para Armas',
    level: 3,
    stars: 4,
    icon: '/assets/items/escamas_de_cryovain.png',
    element: 'Natural',
    elementOrb: NATURAL,
    costGold: 1350,
    ingredients: [ing(CRYOVAIN, 3), ing(SILVER_INGOT, 3), ing(FLASK, 2)],
  },
  {
    id: 'balsamo_sagrado_exorcista',
    name: 'Bálsamo Sagrado del Exorcista',
    category: 'Aceites para Armas',
    level: 4,
    stars: 5,
    icon: '/assets/items/zafiro_app.png',
    element: 'Divino',
    elementOrb: DIVINE,
    costGold: 2200,
    ingredients: [ing(SAPPHIRE, 3), ing(GOLD_INGOT, 4), ing(FLASK, 3)],
  },
];

/** Materiales que la Botica usa, sin repetir, para la despensa. */
export const POTION_MATERIALS: readonly PotionIngredientSpec[] = Array.from(
  new Map(
    POTION_RECIPES.flatMap((r) => r.ingredients).map((i) => [i.icon, { ...i, need: 0 }])
  ).values()
);
