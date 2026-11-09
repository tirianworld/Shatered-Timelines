import { safeStorage, safeGetJSON } from '../utils/storage';

export type IngredientCategory =
  | 'carnes'
  | 'verduras'
  | 'harinas'
  | 'lacteos'
  | 'especias'
  | 'pescados'
  | 'monstruos';

export interface CookingIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  icon: string;
  rarity: 'R' | 'SR' | 'SSR';
  description: string;
  priceGold: number;
}

export interface CookingRecipe {
  id: string;
  name: string;
  icon: string;
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  buffBadge: string;
  buffDescription: string;
  lore: string;
  requiredCategories: [IngredientCategory, IngredientCategory, IngredientCategory];
  specificIngredientIds?: string[];
  shelfItemId: string;
}

export const INGREDIENT_CATEGORIES: {
  id: IngredientCategory;
  name: string;
  iconText: string;
  imageIcon: string;
  color: string;
  bgGlow: string;
}[] = [
  {
    id: 'carnes',
    name: 'Carnes',
    iconText: '🥩',
    imageIcon: '/assets/items/ing_carne_roja.png',
    color: '#ef4444',
    bgGlow: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'verduras',
    name: 'Verduras',
    iconText: '🥬',
    imageIcon: '/assets/items/ing_hortalizas.png',
    color: '#22c55e',
    bgGlow: 'rgba(34, 197, 94, 0.4)',
  },
  {
    id: 'harinas',
    name: 'Harinas',
    iconText: '🌾',
    imageIcon: '/assets/items/ing_harina_trigo.png',
    color: '#eab308',
    bgGlow: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'lacteos',
    name: 'Lácteos',
    iconText: '🧀',
    imageIcon: '/assets/items/ing_leche_fresca.png',
    color: '#f59e0b',
    bgGlow: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'especias',
    name: 'Especias',
    iconText: '🧂',
    imageIcon: '/assets/items/ing_especias_chili.png',
    color: '#f97316',
    bgGlow: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'pescados',
    name: 'Pescados',
    iconText: '🐟',
    imageIcon: '/assets/items/ing_salmon_fresco.png',
    color: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.4)',
  },
  {
    id: 'monstruos',
    name: 'Monstruos',
    iconText: '👾',
    imageIcon: '/assets/items/ing_carne_devorador.png',
    color: '#c084fc',
    bgGlow: 'rgba(192, 132, 252, 0.4)',
  },
];

export const COOKING_INGREDIENTS: CookingIngredient[] = [
  // --- CARNES ---
  {
    id: 'ing_pollo_calidad',
    name: 'Pollo de Corral',
    category: 'carnes',
    icon: '/assets/items/ing_pollo_corral.png',
    rarity: 'R',
    description: 'Pollo fresco criado en las granjas bajas del bastión. Carne tierna y jugosa.',
    priceGold: 80,
  },
  {
    id: 'ing_carne_roja',
    name: 'Carne Glacial',
    category: 'carnes',
    icon: '/assets/items/ing_carne_roja.png',
    rarity: 'SR',
    description: 'Carne roja magra de bestias del valle de Icespear. Alto contenido proteico.',
    priceGold: 120,
  },
  {
    id: 'ing_carne_ahumada',
    name: 'Carne Seca Curada',
    category: 'carnes',
    icon: '/assets/items/ing_carne_seca.png',
    rarity: 'R',
    description: 'Carne adobada y ahumada lentamente con leña de abeto. Gran sabor concentrado.',
    priceGold: 95,
  },
  {
    id: 'ing_lomo_jabali',
    name: 'Chuletón de Jabalí',
    category: 'carnes',
    icon: '/assets/items/ing_lomo_jabali.png',
    rarity: 'SR',
    description: 'Corte selecto de jabalí salvaje. Otorga contundencia y fuerza a los platos.',
    priceGold: 150,
  },

  // --- VERDURAS ---
  {
    id: 'ing_ajo_silvestre',
    name: 'Ajo Silvestre',
    category: 'verduras',
    icon: '/assets/items/ajo.png',
    rarity: 'R',
    description: 'Ajo silvestre recolectado en las laderas nevadas. Olor intenso y propiedades curativas.',
    priceGold: 70,
  },
  {
    id: 'ing_patata_montana',
    name: 'Patata de Icespear',
    category: 'verduras',
    icon: '/assets/items/ing_patata_rara.png',
    rarity: 'R',
    description: 'Tubérculo dorado resistente a las heladas. Base fundamental de la cocina norteña.',
    priceGold: 60,
  },
  {
    id: 'ing_hortalizas_huerto',
    name: 'Hortalizas de Huerto',
    category: 'verduras',
    icon: '/assets/items/ing_hortalizas.png',
    rarity: 'R',
    description: 'Hojas verdes, tomates y verduras frescas cultivadas en invernaderos geotérmicos.',
    priceGold: 75,
  },
  {
    id: 'ing_setas_cueva',
    name: 'Setas de las Minas',
    category: 'verduras',
    icon: '/assets/items/ing_setas_cueva.png',
    rarity: 'SR',
    description: 'Hongos cavernícolas bioluminiscentes con notas terrosas de umami puro.',
    priceGold: 130,
  },

  // --- HARINAS & GRANOS ---
  {
    id: 'ing_harina_trigo',
    name: 'Harina de Trigo',
    category: 'harinas',
    icon: '/assets/items/ing_harina_trigo.png',
    rarity: 'R',
    description: 'Harina finamente molida en los molinos de viento de Icespear.',
    priceGold: 60,
  },
  {
    id: 'ing_pan_rustico',
    name: 'Pan Rústico',
    category: 'harinas',
    icon: '/assets/items/pan.png',
    rarity: 'R',
    description: 'Hogaza de pan con corteza crujiente y miga tierna, horneada a leña.',
    priceGold: 85,
  },
  {
    id: 'ing_arroz_grano',
    name: 'Arroz de Montaña',
    category: 'harinas',
    icon: '/assets/items/ing_arroz_grano.png',
    rarity: 'R',
    description: 'Grano blanco pulido cultivado en terrazas fluviales. Ideal para platos orientales.',
    priceGold: 90,
  },
  {
    id: 'ing_masa_madre',
    name: 'Masa Madre Fermentada',
    category: 'harinas',
    icon: '/assets/items/ing_masa_madre.png',
    rarity: 'SR',
    description: 'Masa fermentada lentamente para masas de pizza y panes dorados crujientes.',
    priceGold: 110,
  },

  // --- LÁCTEOS & HUEVOS ---
  {
    id: 'ing_queso_cabra',
    name: 'Queso Madurado',
    category: 'lacteos',
    icon: '/assets/items/queso.png',
    rarity: 'R',
    description: 'Rueda de queso curado de cabras alpinas. Textura mantecosa y sabor potente.',
    priceGold: 90,
  },
  {
    id: 'ing_leche_fresca',
    name: 'Jarra de Leche',
    category: 'lacteos',
    icon: '/assets/items/ing_leche_fresca.png',
    rarity: 'R',
    description: 'Leche entera fresca recién ordeñada en las granjas del bastión.',
    priceGold: 70,
  },
  {
    id: 'ing_mantequilla_salada',
    name: 'Mantequilla Salada',
    category: 'lacteos',
    icon: '/assets/items/ing_mantequilla_bloque.png',
    rarity: 'SR',
    description: 'Mantequilla batida artesanal con sal gema. Aporta brillo y sedosidad a las salsas.',
    priceGold: 100,
  },
  {
    id: 'ing_huevos_corral',
    name: 'Huevos de Granja',
    category: 'lacteos',
    icon: '/assets/items/ing_huevos_corral.png',
    rarity: 'R',
    description: 'Huevos frescos de yema anaranjada para tortillas y rebozados.',
    priceGold: 75,
  },

  // --- ESPECIAS & CONDIMENTOS ---
  {
    id: 'ing_especias_dragon',
    name: 'Especias de Dragón',
    category: 'especias',
    icon: '/assets/items/ing_especias_chili.png',
    rarity: 'SR',
    description: 'Pimientos picantes secos molidos que prenden el paladar y encienden el espíritu.',
    priceGold: 120,
  },
  {
    id: 'ing_sal_glacial',
    name: 'Sal Marina Glacial',
    category: 'especias',
    icon: '/assets/items/ing_sal_glacial.png',
    rarity: 'R',
    description: 'Cristales de sal pura extraídos de las costas heladas. Realza todo sabor.',
    priceGold: 50,
  },
  {
    id: 'ing_hierbas_bosque',
    name: 'Hierbas del Bosque',
    category: 'especias',
    icon: '/assets/items/ing_hierbas_bosque.png',
    rarity: 'R',
    description: 'Romero, tomillo y laurel recogidos bajo las copas nevadas del bosque.',
    priceGold: 65,
  },
  {
    id: 'ing_pimienta_negra',
    name: 'Pimienta Negra',
    category: 'especias',
    icon: '/assets/items/ing_pimienta_negra.png',
    rarity: 'R',
    description: 'Granos de pimienta negra aromática molidos en mortero de piedra.',
    priceGold: 80,
  },

  // --- PESCADOS ---
  {
    id: 'ing_salmon_helado',
    name: 'Salmón del Río Helado',
    category: 'pescados',
    icon: '/assets/items/ing_salmon_fresco.png',
    rarity: 'SR',
    description: 'Salmón ártico de carne anaranjada capturado en los torrentes de Icespear.',
    priceGold: 140,
  },
  {
    id: 'ing_trucha_arroyo',
    name: 'Trucha Plateada',
    category: 'pescados',
    icon: '/assets/items/ing_trucha_arroyo.png',
    rarity: 'R',
    description: 'Pescado blanco de arroyo de deshielo. Ligero, sabroso y fácil de cocinar.',
    priceGold: 95,
  },
  {
    id: 'ing_cangrejo_cueva',
    name: 'Cangrejo de Cueva',
    category: 'pescados',
    icon: '/assets/items/ing_cangrejo_cueva.png',
    rarity: 'SR',
    description: 'Cangrejo acorazado de aguas subterráneas, de sabor intenso a marisco salvaje.',
    priceGold: 160,
  },

  // --- MONSTRUOS ---
  {
    id: 'ing_carne_devorador',
    name: 'Carne de Devorador',
    category: 'monstruos',
    icon: '/assets/items/ing_carne_devorador.png',
    rarity: 'SSR',
    description: 'Carne densa y marmolada protegida por la coraza quitinosa del Devorador. Jugosa, potente y digna de un banquete colosal.',
    priceGold: 240,
  },
  {
    id: 'ing_larvas_araknoide',
    name: 'Larvas de Araknoide',
    category: 'monstruos',
    icon: '/assets/items/ing_larvas_araknoide.png',
    rarity: 'SR',
    description: 'Larvas cavernícolas ricas en proteínas y maná residual. Crujientes al saltear y de gran valor culinario.',
    priceGold: 150,
  },
  {
    id: 'ing_huevos_araknoide',
    name: 'Huevos de Araknoide',
    category: 'monstruos',
    icon: '/assets/items/ing_huevos_araknoide.png',
    rarity: 'SR',
    description: 'Huevos translúcidos recolectados en los nidos carmesíes de la colonia. Ingrediente exótico con suave luminiscencia nutritiva.',
    priceGold: 160,
  },
];

import { generateAllCookingRecipes } from './cookingRecipesList';

export const COOKING_RECIPES: CookingRecipe[] = generateAllCookingRecipes(COOKING_INGREDIENTS);
export const COMPLETE_COOKING_RECIPES: CookingRecipe[] = COOKING_RECIPES;

export const SURPRISE_DISH: CookingRecipe = {
  id: 'rec_sorpresa',
  name: 'Salteado Sorpresa de Icespear',
  icon: '/assets/items/doritos.png',
  rarity: 'R',
  buffBadge: '+10% ATK & DEF',
  buffDescription: 'Otorga +10% Ataque y Defensa durante todo el próximo combate.',
  lore: 'Un plato improvisado en el fogón con lo que había a mano. ¡Sorprendentemente delicioso!',
  requiredCategories: ['carnes', 'verduras', 'harinas'],
  shelfItemId: 'food_doritos',
};

const INGREDIENTS_STOCK_KEY = 'cdd_tavern_ingredients_stock_v3';
const CHEF_AFFECTION_KEY = 'cdd_tavern_chef_affection_v3';
const DISCOVERED_RECIPES_KEY = 'cdd_tavern_discovered_recipes_v3';

export interface TavernCookingStock {
  [ingredientId: string]: number;
}

export interface ChefAffectionData {
  points: number;
  level: number;
  unlockedBonuses: string[];
}

export function loadTavernCookingStock(): TavernCookingStock {
  const saved = safeGetJSON<TavernCookingStock | null>(INGREDIENTS_STOCK_KEY, null);
  if (saved && typeof saved === 'object') {
    const merged = { ...saved };
    COOKING_INGREDIENTS.forEach((ing) => {
      if (typeof merged[ing.id] !== 'number') {
        merged[ing.id] = ing.rarity === 'SSR' ? 3 : 5;
      }
    });
    return merged;
  }

  const initialStock: TavernCookingStock = {};
  COOKING_INGREDIENTS.forEach((ing) => {
    initialStock[ing.id] = ing.rarity === 'SSR' ? 2 : ing.rarity === 'SR' ? 4 : 6;
  });
  saveTavernCookingStock(initialStock);
  return initialStock;
}

export function saveTavernCookingStock(stock: TavernCookingStock): void {
  safeStorage.setItem(INGREDIENTS_STOCK_KEY, JSON.stringify(stock));
}

export function loadChefAffection(): ChefAffectionData {
  const saved = safeGetJSON<ChefAffectionData | null>(CHEF_AFFECTION_KEY, null);
  if (saved && typeof saved.points === 'number') {
    return saved;
  }
  return {
    points: 4479,
    level: 24,
    unlockedBonuses: ['Gusto Magistral', 'Aura Culinaria'],
  };
}

export function saveChefAffection(data: ChefAffectionData): void {
  safeStorage.setItem(CHEF_AFFECTION_KEY, JSON.stringify(data));
}

export const RECIPES_BY_ID = new Map<string, CookingRecipe>();
COOKING_RECIPES.forEach((rec) => {
  RECIPES_BY_ID.set(rec.id, rec);
});

export function getRecipeById(id: string): CookingRecipe | undefined {
  return RECIPES_BY_ID.get(id);
}

export function loadDiscoveredRecipes(): string[] {
  const saved = safeGetJSON<string[] | null>(DISCOVERED_RECIPES_KEY, null);
  const base = [
    'rec_ing_carne_roja__ing_harina_trigo__ing_patata_montana', // Steak & Chips
    'rec_ing_harina_trigo__ing_patata_montana__ing_salmon_helado', // Fish & Chips
    'rec_ing_huevos_corral__ing_pan_rustico__ing_patata_montana', // Eggs & Chips
    'rec_ing_cangrejo_cueva__ing_harina_trigo__ing_huevos_corral', // Quiche de Cangrejo de Cueva y Huevos Camperos
    'rec_ing_cangrejo_cueva__ing_mantequilla_salada__ing_queso_cabra', // Cangrejo al Termidor
    'rec_ing_arroz_grano__ing_cangrejo_cueva__ing_huevos_corral', // Arroz Salteado de Cangrejo
    'rec_ing_ajo_silvestre__ing_cangrejo_cueva__ing_especias_dragon', // Cangrejo al Ajillo
    'rec_ing_cangrejo_cueva__ing_especias_dragon__ing_sal_glacial', // Ceviche Picante de Cangrejo
    'rec_ing_cangrejo_cueva__ing_patata_montana__ing_trucha_arroyo', // Marmitako Marinero de Cangrejo y Trucha
    'rec_ing_mantequilla_salada__ing_patata_montana__ing_trucha_arroyo', // Trucha Meunière
    'rec_ing_pan_rustico__ing_queso_cabra__ing_trucha_arroyo', // Tosta de Trucha Ahumada
    'rec_ing_especias_dragon__ing_sal_glacial__ing_trucha_arroyo', // Tartar de Trucha
    'rec_ing_ajo_silvestre__ing_hortalizas_huerto__ing_trucha_arroyo', // Caldera de Trucha
    'rec_ing_cangrejo_cueva__ing_mantequilla_salada__ing_pan_rustico', // Roll Nórdico de Cangrejo
    'rec_ing_cangrejo_cueva__ing_carne_roja__ing_patata_montana', // Mar y Montaña de Cangrejo y Ternera
    'rec_ing_carne_devorador__ing_cangrejo_cueva__ing_setas_cueva', // Cazuela Abisal de Cangrejo y Devorador
    'rec_ing_ajo_silvestre__ing_huevos_araknoide__ing_patata_montana', // Tortilla de Araknoide
    'rec_ing_carne_devorador__ing_harina_trigo__ing_huevos_corral', // Milanesa de Devorador Empanada
    'rec_ing_especias_dragon__ing_hortalizas_huerto__ing_larvas_araknoide', // Salteado de Larvas al Wok
    'rec_ing_lomo_jabali__ing_mantequilla_salada__ing_setas_cueva', // Boeuf Bourguignon
    'rec_ing_carne_ahumada__ing_harina_trigo__ing_hortalizas_huerto', // Ramen Tonkotsu
    'rec_ing_ajo_silvestre__ing_mantequilla_salada__ing_pan_rustico', // Pan de Ajo
    'rec_ing_harina_trigo__ing_leche_fresca__ing_sal_glacial', // Pancakes
    'rec_ing_carne_roja__ing_harina_trigo__ing_queso_cabra', // Lasaña Boloñesa
    'rec_ing_leche_fresca__ing_mantequilla_salada__ing_queso_cabra', // Fondue Suiza
    'rec_ing_arroz_grano__ing_sal_glacial__ing_salmon_helado', // Sushi de Salmón
    'rec_ing_especias_dragon__ing_sal_glacial__ing_salmon_helado', // Ceviche de Salmón
    'rec_ing_harina_trigo__ing_huevos_corral__ing_salmon_helado', // Quiche Nórdica de Salmón
    'rec_ing_leche_fresca__ing_patata_montana__ing_salmon_helado', // Sopa Lohikeitto
    'rec_ing_pan_rustico__ing_pimienta_negra__ing_salmon_helado', // Tosta de Salmón Gravlax
    'rec_ing_ajo_silvestre__ing_patata_montana__ing_pollo_calidad', // Pollo Asado con Patatas
    'rec_ing_harina_trigo__ing_huevos_corral__ing_pollo_calidad', // Empanada de Pollo
    'rec_ing_arroz_grano__ing_especias_dragon__ing_pollo_calidad', // Yakitori de Pollo
    'rec_ing_hortalizas_huerto__ing_setas_cueva__ing_pollo_calidad', // Guiso Campestre de Pollo
    'rec_ing_hierbas_bosque__ing_masa_madre__ing_queso_cabra', // Pizza Margarita
    'rec_ing_harina_trigo__ing_mantequilla_salada__ing_queso_cabra', // Arepas Caseras
    'rec_ing_ajo_silvestre__ing_hortalizas_huerto__ing_setas_cueva', // Ratatouille
  ];

  if (Array.isArray(saved) && saved.length > 0) {
    const validIds = new Set(COOKING_RECIPES.map((r) => r.id));
    // Filter out obsolete signature IDs and keep valid ones plus base
    const validSaved = saved.filter((id) => validIds.has(id));
    const merged = Array.from(new Set([...base, ...validSaved]));
    return merged;
  }

  saveDiscoveredRecipes(base);
  return base;
}

export function saveDiscoveredRecipes(recipes: string[]): void {
  safeStorage.setItem(DISCOVERED_RECIPES_KEY, JSON.stringify(recipes));
}

/**
 * Deterministic 1-to-1 matching:
 * Every combination of 3 specific ingredients yields its own unique authentic dish.
 * No two ingredient combinations ever produce the same dish.
 */
export function matchRecipe(
  ingredients: [CookingIngredient, CookingIngredient, CookingIngredient]
): CookingRecipe {
  if (ingredients.length < 3 || ingredients.some((ing) => !ing)) {
    return SURPRISE_DISH;
  }

  const sortedIds = ingredients.map((i) => i.id).sort();
  const targetKey = sortedIds.join('__');
  const targetId = `rec_${targetKey}`;

  const matched = RECIPES_BY_ID.get(targetId);
  if (matched) {
    return matched;
  }

  return SURPRISE_DISH;
}

