import fs from 'fs';
import path from 'path';

export const CATEGORIES = [
  'carnes',
  'verduras',
  'harinas',
  'lacteos',
  'especias',
  'pescados',
  'monstruos',
] as const;

export type IngredientCategory = typeof CATEGORIES[number];

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

// 1. Signature Recipes from 7DS Grand Cross and key monsters
const SIGNATURE_RECIPES: CookingRecipe[] = [
  {
    id: 'rec_steak_and_chips',
    name: 'Steak & Chips de la Taberna',
    icon: '/assets/items/food_steak_chips.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN TOTAL & +25% ATK',
    buffDescription: 'Plato estrella de 7DS Grand Cross: Esquiva con certeza el primer golpe enemigo y otorga un 25% de ataque.',
    lore: 'El clásico insustituible del Sombrero de Jabalí: solomillo a la brasa servido con patatas doradas crujientes.',
    requiredCategories: ['carnes', 'verduras', 'harinas'],
    specificIngredientIds: ['ing_carne_roja', 'ing_patata_montana', 'ing_harina_trigo'],
    shelfItemId: 'food_steak_chips',
  },
  {
    id: 'rec_fish_and_chips',
    name: 'Fish & Chips Tradicional',
    icon: '/assets/items/food_fish_chips.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN DE DEBUFFS & VELOCIDAD',
    buffDescription: 'Plato de combate de 7DS: Inmune a congelación y venenos, y aumenta un 20% la velocidad de turno.',
    lore: 'Lomos de salmón del río helado rebozados en masa crujiente dorada con patatas fritas cortadas a mano.',
    requiredCategories: ['pescados', 'harinas', 'verduras'],
    specificIngredientIds: ['ing_salmon_helado', 'ing_harina_trigo', 'ing_patata_montana'],
    shelfItemId: 'food_fish_chips',
  },
  {
    id: 'rec_eggs_and_chips',
    name: 'Eggs & Chips Campestre',
    icon: '/assets/items/food_eggs_chips.png',
    rarity: 'SR',
    buffBadge: 'EVASIÓN DE 1 GOLPE',
    buffDescription: 'Famoso plato de 7DS: Esquiva con certeza total el siguiente ataque enemigo.',
    lore: 'Huevos de granja fritos con yema líquida servidos sobre abundante cama de patatas de montaña crujientes.',
    requiredCategories: ['lacteos', 'harinas', 'verduras'],
    specificIngredientIds: ['ing_huevos_corral', 'ing_pan_rustico', 'ing_patata_montana'],
    shelfItemId: 'food_eggs_chips',
  },
  {
    id: 'rec_tortilla_araknoide',
    name: 'Tortilla de Araknoide',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN 100% & +35% CELERIDAD',
    buffDescription: 'Esquiva con certeza total el próximo ataque enemigo, purifica debuffs y otorga un 35% extra de celeridad.',
    lore: 'Receta exótica batida con huevos de araknoide, patatas de montaña y ajo silvestre de las cuevas carmesí.',
    requiredCategories: ['monstruos', 'verduras', 'verduras'],
    specificIngredientIds: ['ing_huevos_araknoide', 'ing_patata_montana', 'ing_ajo_silvestre'],
    shelfItemId: 'food_tortilla_araknoide',
  },
  {
    id: 'rec_devorador_empanada',
    name: 'Milanesa de Devorador Empanada',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+35% ATAQUE & PERFORACIÓN 50%',
    buffDescription: 'Aumenta un 35% todo el daño físico y mágico de combate e ignora el 50% de la armadura enemiga.',
    lore: 'Filete magro del devorador macerado, rebozado con harina de trigo y huevo campero, dorado a punto crujiente.',
    requiredCategories: ['monstruos', 'harinas', 'lacteos'],
    specificIngredientIds: ['ing_carne_devorador', 'ing_harina_trigo', 'ing_huevos_corral'],
    shelfItemId: 'food_devorador_empanada',
  },
  {
    id: 'rec_larvas_crujientes',
    name: 'Salteado de Larvas al Wok',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SR',
    buffBadge: '+50 PV & +25% CRÍTICO',
    buffDescription: 'Restaura 50 PV de vitalidad de inmediato y aumenta un 25% la tasa y daño de impactos críticos.',
    lore: 'Larvas de la colonia carmesí salteadas a fuego vivo con hortalizas frescas y especias ardientes de dragón.',
    requiredCategories: ['monstruos', 'verduras', 'especias'],
    specificIngredientIds: ['ing_larvas_araknoide', 'ing_hortalizas_huerto', 'ing_especias_dragon'],
    shelfItemId: 'food_larvas_crujientes',
  },
  {
    id: 'rec_ramen',
    name: 'Ramen Tonkotsu de Icespear',
    icon: '/assets/items/ramen.png',
    rarity: 'SR',
    buffBadge: '+40 PV & +8 REGEN',
    buffDescription: 'Restaura 40 PV de inmediato y concede regeneración continua de +8 PV al inicio de cada turno.',
    lore: 'Fideos artesanos en caldo concentrado caliente con carne ahumada curada y hortalizas frescas del huerto.',
    requiredCategories: ['carnes', 'verduras', 'harinas'],
    specificIngredientIds: ['ing_carne_ahumada', 'ing_hortalizas_huerto', 'ing_harina_trigo'],
    shelfItemId: 'food_ramen',
  },
  {
    id: 'rec_pan_ajo',
    name: 'Pan de Ajo con Mantequilla Fundida',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+2 ORBES DEFINITIVOS',
    buffDescription: 'Empieza el próximo combate con 2 orbes de habilidad definitiva (Cataclismo Astral) listos.',
    lore: 'Hogaza tostada al horno bañada en mantequilla salada batida y abundante ajo silvestre picado.',
    requiredCategories: ['harinas', 'lacteos', 'verduras'],
    specificIngredientIds: ['ing_pan_rustico', 'ing_mantequilla_salada', 'ing_ajo_silvestre'],
    shelfItemId: 'food_pan_ajo',
  },
  {
    id: 'rec_tortitas',
    name: 'Pancakes con Crema y Mantequilla',
    icon: '/assets/items/tortitas.png',
    rarity: 'R',
    buffBadge: '+20% ORO & EXPERIENCIA',
    buffDescription: 'Otorga un 20% extra de Oro y EXP al completar el siguiente combate o patrulla.',
    lore: 'Torre de tortitas esponjosas bañadas en crema de leche dulce y una pizca de sal marina.',
    requiredCategories: ['harinas', 'lacteos', 'especias'],
    specificIngredientIds: ['ing_harina_trigo', 'ing_leche_fresca', 'ing_sal_glacial'],
    shelfItemId: 'food_tortitas',
  },
  {
    id: 'rec_estofado_magordito',
    name: 'Boeuf Bourguignon de la Taberna',
    icon: '/assets/items/food_bourguignon.png',
    rarity: 'SSR',
    buffBadge: '+20% TODOS STATS & +50 PV',
    buffDescription: 'Aumenta un 20% Ataque y Defensa, +50 PV Máx y regenera +15 PV por turno en combate.',
    lore: 'Estofado tradicional de chuletón de jabalí estofado a fuego lento con setas de bosque y mantequilla.',
    requiredCategories: ['carnes', 'verduras', 'lacteos'],
    specificIngredientIds: ['ing_lomo_jabali', 'ing_setas_cueva', 'ing_mantequilla_salada'],
    shelfItemId: 'food_estofado_magordito',
  },
];

type RecipeBlueprint = Omit<CookingRecipe, 'id' | 'shelfItemId' | 'requiredCategories'>;

// 2. All 84 authentic real-world culinary recipes mapped to each category trio
export const REAL_RECIPES_MAP: Record<string, RecipeBlueprint> = {
  // --- CARNES COMBINACIONES ---
  'carnes,carnes,carnes': {
    name: 'Parrillada Mixta de Carnes al Carbón',
    icon: '/assets/items/hamburguesa.png',
    rarity: 'SSR',
    buffBadge: '+35% ATAQUE FÍSICO PURO',
    buffDescription: 'Carne asada a fuego vivo: aumenta un 35% el daño físico directo de todos los combatientes.',
    lore: 'Selección suprema de chuletón de jabalí, pollo de corral y carne curada asados sobre brasas de encina.',
  },
  'carnes,carnes,verduras': {
    name: 'Goulash Tradicional de Ternera',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & +15 PV REGEN',
    buffDescription: 'Aumenta un 25% el ataque y concede regeneración continua de vitalidad tras cada turno.',
    lore: 'Guiso húngaro espeso de dados tiernos de carne cocinados con patatas, ajo y hortalizas estofadas.',
  },
  'carnes,carnes,harinas': {
    name: 'Hamburguesa Doble de Buey al Carbón',
    icon: '/assets/items/hamburguesa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & ESCUDO 25 PV',
    buffDescription: 'Hamburguesa gourmet al fuego vivo: otorga +20% de ataque y una barrera protectora de 25 PV.',
    lore: 'Doble medallón de ternera asado sobre brasas servido en panecillo de sésamo con cebolla caramelizada.',
  },
  'carnes,carnes,lacteos': {
    name: 'Milanesa a la Napolitana con Queso Fundido',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +30 PV REGEN',
    buffDescription: 'Aumenta un 20% la armadura y regenera 30 PV de vitalidad inmediata en combate.',
    lore: 'Filetes de carne empanados cubiertos con salsa y abundante queso de cabra fundido al horno.',
  },
  'carnes,carnes,especias': {
    name: 'Chili con Carne Tradicional al Fuego',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+30% DAÑO FUEGO & SANGRADO',
    buffDescription: 'Imbuye los ataques con daño ígneo ardiente y provoca sangrado continuo a los enemigos.',
    lore: 'Receta tex-mex auténtica con carne picada macerada en pimienta negra y especias de dragón.',
  },
  'carnes,carnes,pescados': {
    name: 'Plato Mar y Montaña de Solomillo y Salmón',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+25% ATK & +20% VELOCIDAD',
    buffDescription: 'Clásico de la alta cocina: otorga +25% de ataque y aumenta la velocidad de acción.',
    lore: 'Armoniosa unión de solomillo de res al punto y lomos de salmón fresco pasados por plancha de hierro.',
  },
  'carnes,carnes,monstruos': {
    name: 'Guiso Bárbaro de Jabalí y Devorador',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+40% DAÑO & PERFORACIÓN 30%',
    buffDescription: 'Desata una furia atroz aumentando el daño en un 40% e ignorando el 30% de la defensa enemiga.',
    lore: 'Plato opulento de la taberna que mezcla cortes de jabalí salvaje con la musculatura firme del devorador.',
  },
  'carnes,verduras,verduras': {
    name: 'Salteado Campestre de Ternera con Setas',
    icon: '/assets/items/ramen.png',
    rarity: 'R',
    buffBadge: '+15% DEF & +20 PV',
    buffDescription: 'Restaura 20 PV y concede un 15% adicional de defensa frente a ataques enemigos.',
    lore: 'Tiras finas de lomo salteadas en wok con setas de cueva, ajo silvestre y verduras del huerto.',
  },
  'carnes,harinas,verduras': {
    name: 'Steak & Chips de la Taberna',
    icon: '/assets/items/food_steak_chips.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN TOTAL & +25% ATK',
    buffDescription: 'Plato estrella de 7DS Grand Cross: Esquiva con certeza el primer golpe enemigo y otorga un 25% de ataque.',
    lore: 'El clásico insustituible del Sombrero de Jabalí: solomillo a la brasa servido con patatas doradas crujientes.',
  },
  'carnes,lacteos,verduras': {
    name: 'Boeuf Bourguignon de la Taberna',
    icon: '/assets/items/food_bourguignon.png',
    rarity: 'SSR',
    buffBadge: '+20% TODOS STATS & +50 PV',
    buffDescription: 'Aumenta un 20% Ataque y Defensa, +50 PV Máx y regenera +15 PV por turno en combate.',
    lore: 'Estofado tradicional de chuletón de jabalí estofado a fuego lento con setas de bosque y mantequilla.',
  },
  'carnes,especias,verduras': {
    name: 'Kebab de Ternera con Salsa Especiada',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+20% DAÑO FUEGO',
    buffDescription: 'Imbuye tus armas con +20% de daño ígneo y provoca quemadura al enemigo.',
    lore: 'Carne adobada y asada al espetón vertical, servida con vegetales frescos y salsa picante.',
  },
  'carnes,pescados,verduras': {
    name: 'Zarzuela de Carne, Pescado y Hortalizas',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & INMUNIDAD HELADA',
    buffDescription: 'Aumenta un 20% el daño e inmuniza contra efectos de congelación y lentitud.',
    lore: 'Guiso tradicional en cazuela de barro con rodajas de trucha, dados de carne y verduras de invierno.',
  },
  'carnes,monstruos,verduras': {
    name: 'Wok Asiático de Devorador y Brotes Verdes',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20% CRÍTICO',
    buffDescription: 'Aumenta un 30% el ataque y eleva la tasa de impactos críticos un 20%.',
    lore: 'Finas tiras de devorador salteadas a fuego infernal con ajo silvestre, setas y hojas crujientes.',
  },
  'carnes,harinas,harinas': {
    name: 'Ramen Tonkotsu de Icespear',
    icon: '/assets/items/ramen.png',
    rarity: 'SR',
    buffBadge: '+40 PV & +8 REGEN',
    buffDescription: 'Restaura 40 PV de inmediato y concede regeneración continua de +8 PV al inicio de cada turno.',
    lore: 'Fideos artesanos en caldo concentrado caliente con carne ahumada curada y hortalizas frescas del huerto.',
  },
  'carnes,harinas,lacteos': {
    name: 'Lasaña Boloñesa Tradicional al Horno',
    icon: '/assets/items/food_lasana.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & ESCUDO 20 PV',
    buffDescription: 'Aumenta un 20% la defensa y añade una barrera de 20 PV absorbente.',
    lore: 'Capas de pasta fresca de trigo intercaladas con ragú de carne y bechamel sedosa gratinada con queso.',
  },
  'carnes,especias,harinas': {
    name: 'Pollo Frito Crujiente al Estilo Sureño',
    icon: '/assets/items/mcbites.png',
    rarity: 'R',
    buffBadge: '+15% DAÑO FÍSICO',
    buffDescription: 'Aumenta un 15% el daño físico cuerpo a cuerpo de tus guerreros.',
    lore: 'Bocados tiernos de pollo marinados en especias y rebozados en harina crujiente bien dorada.',
  },
  'carnes,harinas,pescados': {
    name: 'Dumplings Mixtos de Ternera y Salmón',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% VELOCIDAD',
    buffDescription: 'Aumenta un 20% el ataque y concede un 15% extra de velocidad de acción.',
    lore: 'Empanadillas finas de masa de arroz al vapor rellenas con picadillo jugoso de mar y prado.',
  },
  'carnes,harinas,monstruos': {
    name: 'Katsu Crujiente de Carne de Devorador',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ROBO DE VIDA 15%',
    buffDescription: 'Aumenta un 30% el poder ofensivo y restaura en salud el 15% del daño infligido.',
    lore: 'Filete grueso empanado en panko y frito hasta alcanzar el punto dorado perfecto, servido con arroz.',
  },
  'carnes,lacteos,lacteos': {
    name: 'Gratén de Carne al Cuatro Quesos',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +25 PV REGEN',
    buffDescription: 'Refuerza la armadura un 25% y otorga regeneración prolongada de salud.',
    lore: 'Dados de ternera braseados sumergidos en una crema densa de queso madurado y mantequilla.',
  },
  'carnes,especias,lacteos': {
    name: 'Quesarito Picante Relleno de Carne',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+35% CRÍTICO & +50% DMG',
    buffDescription: 'Aumenta un 35% la probabilidad de golpe crítico y un 50% el daño crítico infligido.',
    lore: 'Tortilla enrollada con queso hilado fundido, carne de bestia especiada y salsa brava.',
  },
  'carnes,lacteos,pescados': {
    name: 'Guiso Nórdico de Salmón y Ternera a la Crema',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% DEF',
    buffDescription: 'Otorga un equilibrado +20% tanto al ataque como a la defensa durante todo el combate.',
    lore: 'Receta escandinava que une filetes de salmón y ternera cocinados lentamente en leche y mantequilla.',
  },
  'carnes,lacteos,monstruos': {
    name: 'Cazuela Gratinada de Devorador al Horno',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 35 PV',
    buffDescription: 'Aumenta un 30% el poder de ataque y levanta un escudo mágico de 35 PV al inicio de la pelea.',
    lore: 'Guiso intenso de carne de monstruo con bechamel espesa y una corteza dorada de queso tostado.',
  },
  'carnes,especias,especias': {
    name: 'Costillar a la Barbacoa Extra Picante',
    icon: '/assets/items/doritos.png',
    rarity: 'SR',
    buffBadge: '+30% DAÑO & BURNOUT',
    buffDescription: 'Aumenta el daño un 30% e inflige quemaduras que debilitan el ataque rival.',
    lore: 'Costillas glaseadas con salsa barbacoa cargada de pimienta negra molida y chilis ahumados.',
  },
  'carnes,especias,pescados': {
    name: 'Brochetas Teriyaki de Salmón y Pollo',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & CONGELACIÓN',
    buffDescription: 'Aumenta el ataque un 25% y da probabilidad de inmovilizar al objetivo con hielo.',
    lore: 'Trozos alternados de ave y salmón ártico macerados en salsa especiada dulce y tostados al fuego.',
  },
  'carnes,especias,monstruos': {
    name: 'Fajitas de Monstruo Salteadas con Pimientos',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+35% ATK & ROBO DE VIDA 20%',
    buffDescription: 'Aumenta un 35% el ataque y recupera un 20% del daño en forma de puntos de vida.',
    lore: 'Tiras de devorador salteadas con abundante pimienta negra y especias ardientes al estilo tex-mex.',
  },
  'carnes,pescados,pescados': {
    name: 'Dúo de Salmón y Trucha con Dados de Jamón',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% VELOCIDAD & +20 PV',
    buffDescription: 'Aumenta un 20% la velocidad de turno y cura 20 PV inmediatamente.',
    lore: 'Receta tradicional inspirada en la trucha a la navarra: lomos de pescado fresco sellados con dados de jamón.',
  },
  'carnes,monstruos,pescados': {
    name: 'Caldereta Tríptico de Pescador y Caverna',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & PURIFICA DEBUFFS',
    buffDescription: 'Aumenta un 30% el ataque y disipa todas las penalizaciones y venenos de tus héroes.',
    lore: 'Sopa reconstituyente que aúna pez de río helado, carne de granja y esencias purificadas de monstruo.',
  },
  'carnes,monstruos,monstruos': {
    name: 'Festín Colosal de Caza Abisal',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+45% ATK & FURIA IMPARABLE',
    buffDescription: 'Aumenta un colosal 45% el ataque, otorga inmunidad a aturdimiento y regenera 20 PV/turno.',
    lore: 'Banquete legendario para guerreros que desafían los nidos más oscuros. Pura fuerza destructiva.',
  },

  // --- VERDURAS COMBINACIONES ---
  'verduras,verduras,verduras': {
    name: 'Ratatouille Clásico de la Huerta',
    icon: '/assets/items/food_ratatouille.png',
    rarity: 'R',
    buffBadge: '+40 PV REGEN & PURIFICA',
    buffDescription: 'Cura 40 PV de inmediato y disipa efectos de veneno y quemadura.',
    lore: 'Famoso plato provenzal de finas láminas de verduras horneadas con ajo silvestre y aceite aromático.',
  },
  'harinas,verduras,verduras': {
    name: 'Quiche Campestre de Espinacas y Patatas',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+15% DEF & +25 PV',
    buffDescription: 'Aumenta un 15% la armadura y concede 25 PV de salud máxima.',
    lore: 'Tarta salada francesa horneada con base de masa quebrada y relleno tierno de hortalizas y patatas.',
  },
  'lacteos,verduras,verduras': {
    name: 'Gratén Dauphinois de Patatas al Horno',
    icon: '/assets/items/tortilla_patata.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +30 PV REGEN',
    buffDescription: 'Aumenta un 25% la resistencia y proporciona regeneración constante de vida.',
    lore: 'Finas láminas de patata horneadas lentamente en leche entera y nata con un toque de ajo y mantequilla.',
  },
  'especias,verduras,verduras': {
    name: 'Curry Verde de Hongos y Raíces Silvestres',
    icon: '/assets/items/ramen.png',
    rarity: 'SR',
    buffBadge: '+20% DAÑO & RESISTENCIA ELEMENTAL',
    buffDescription: 'Aumenta un 20% el daño general y otorga un 25% de resistencia a frío y fuego.',
    lore: 'Guiso oriental aromático de setas cavernícolas cocinadas con hierbas de bosque y pimienta fresca.',
  },
  'pescados,verduras,verduras': {
    name: 'Pescado en Papillote con Verduras de Temporada',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% VELOCIDAD & +20 PV REGEN',
    buffDescription: 'Incrementa la presteza en combate un 20% y cura 20 PV cada turno.',
    lore: 'Lomos de trucha plateada cocinados al vapor en su propio jugo sobre juliana de verduras y setas.',
  },
  'monstruos,verduras,verduras': {
    name: 'Tortilla de Araknoide',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN 100% & +35% CELERIDAD',
    buffDescription: 'Esquiva con certeza total el próximo ataque enemigo, purifica debuffs y otorga un 35% extra de celeridad.',
    lore: 'Elaborada batiendo huevos de araknoide con patatas de montaña y ajo silvestre de las cuevas carmesí.',
  },
  'harinas,harinas,verduras': {
    name: 'Pan de Ajo con Mantequilla Fundida',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+2 ORBES DEFINITIVOS',
    buffDescription: 'Empieza el próximo combate con 2 orbes de habilidad definitiva (Cataclismo Astral) listos.',
    lore: 'Hogaza tostada al horno bañada en mantequilla salada batida y abundante ajo silvestre picado.',
  },
  'harinas,lacteos,verduras': {
    name: 'Eggs & Chips Campestre',
    icon: '/assets/items/food_eggs_chips.png',
    rarity: 'SR',
    buffBadge: 'EVASIÓN DE 1 GOLPE',
    buffDescription: 'Famoso plato de 7DS: Esquiva con certeza total el siguiente ataque enemigo.',
    lore: 'Huevos de granja fritos con yema líquida servidos sobre abundante cama de patatas de montaña crujientes.',
  },
  'especias,harinas,verduras': {
    name: 'Gnocchis de Patata a la Mantequilla y Salvia',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+15% VELOCIDAD & +15 PV',
    buffDescription: 'Aumenta la agilidad un 15% y aporta vitalidad para maniobrar.',
    lore: 'Bolitas tiernas de patata y harina doradas en sartén con hierbas aromáticas y pimienta negra.',
  },
  'harinas,pescados,verduras': {
    name: 'Fish & Chips Tradicional',
    icon: '/assets/items/food_fish_chips.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN DE DEBUFFS & VELOCIDAD',
    buffDescription: 'Plato de combate de 7DS: Inmune a congelación y venenos, y aumenta un 20% la velocidad de turno.',
    lore: 'Lomos de salmón del río helado rebozados en masa crujiente dorada con patatas fritas cortadas a mano.',
  },
  'harinas,monstruos,verduras': {
    name: 'Empanadillas de la Cueva con Puré Campestre',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20 PV REGEN',
    buffDescription: 'Aumenta un 30% el daño infligido y regenera 20 PV tras cada acción.',
    lore: 'Masa fina dorada rellena con carne de monstruo salteada con ajo silvestre y patatas de montaña.',
  },
  'lacteos,lacteos,verduras': {
    name: 'Crema Parmentier de Setas y Queso Alpino',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +35 PV',
    buffDescription: 'Refuerza la constitución con un 25% de defensa y regenera 35 PV.',
    lore: 'Sopa francesa aterciopelada de patatas y setas enriquecida con mantequilla y queso curado.',
  },
  'especias,lacteos,verduras': {
    name: 'Tortilla Española de Patatas Tradicional',
    icon: '/assets/items/tortilla_patata.png',
    rarity: 'SR',
    buffBadge: 'EVASIÓN TOTAL & PURIFICA',
    buffDescription: 'Esquiva al 100% el siguiente golpe enemigo y purifica alteraciones de estado.',
    lore: 'La receta española más universal: patatas pochadas despacio, huevos frescos y sal gema al punto jugoso.',
  },
  'lacteos,pescados,verduras': {
    name: 'Cazuela de Trucha a la Crema con Espinacas',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & ESCUDO 25 PV',
    buffDescription: 'Otorga un 20% más de armadura y un escudo mágico de 25 PV.',
    lore: 'Filetes de trucha tiernos horneados sobre lecho de verduras con salsa cremosa de leche y queso.',
  },
  'lacteos,monstruos,verduras': {
    name: 'Revuelto de Huevos de Colonia con Setas Silvestres',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN 100% & +25 PV REGEN',
    buffDescription: 'Otorga esquiva garantizada para el primer impacto y regenera 25 PV continuos.',
    lore: 'Huevos de colonia carmesí batidos con mantequilla fundida y salteados con hongos bioluminiscentes.',
  },
  'especias,especias,verduras': {
    name: 'Patatas Bravas Picantes de la Taberna',
    icon: '/assets/items/doritos.png',
    rarity: 'R',
    buffBadge: '+20% DAÑO & QUEMADURA',
    buffDescription: 'Aumenta un 20% el ataque y prende en llamas a los enemigos impactados.',
    lore: 'Dados de patata crujientes bañados en auténtica salsa brava de pimentón picante y ajo.',
  },
  'especias,pescados,verduras': {
    name: 'Ceviche Clásico Peruano de Pescado',
    icon: '/assets/items/food_ceviche.png',
    rarity: 'SR',
    buffBadge: '+25% VELOCIDAD & CRÍTICO +15%',
    buffDescription: 'Aumenta un 25% la velocidad de ataque y un 15% la probabilidad de golpe crítico.',
    lore: 'Dados de pescado fresco macerados con sal marina glacial, guindilla y hierbas aromáticas.',
  },
  'especias,monstruos,verduras': {
    name: 'Salteado de Larvas Crujientes al Dragón',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SR',
    buffBadge: '+50 PV & +25% CRÍTICO',
    buffDescription: 'Restaura 50 PV de vitalidad de inmediato y aumenta un 25% la tasa y daño de impactos críticos.',
    lore: 'Larvas salteadas con fuego directo, hortalizas crujientes y especias ardientes de dragón.',
  },
  'pescados,pescados,verduras': {
    name: 'Marmitako Tradicional del Norte',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 20% el ataque y permite adelantarse en el turno de combate.',
    lore: 'Caldereta marinera vasca de dados de salmón y trucha estofados con patatas y verduras de huerto.',
  },
  'monstruos,pescados,verduras': {
    name: 'Salteado Marino de Cangrejo de Cueva y Brotes',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +15% DEF',
    buffDescription: 'Otorga una mejora masiva de combate con +30% de ataque y +15% de defensa.',
    lore: 'Carne desmigada de cangrejo y trozos de devorador salteados al wok con hortalizas frescas.',
  },
  'monstruos,monstruos,verduras': {
    name: 'Sopa Nutritiva de Nidos Carmesí',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: '+35% ATK & EVASIÓN 50%',
    buffDescription: 'Eleva el poder destructivo un 35% y concede un 50% de probabilidad de esquivar.',
    lore: 'Concentrado de caldo elaborado con huevos y larvas de la colonia, templado con ajo y setas.',
  },

  // --- HARINAS COMBINACIONES ---
  'harinas,harinas,harinas': {
    name: 'Pan de Masa Madre de Fermentación Lenta',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+2 ORBES ULTI & +20 PV',
    buffDescription: 'Empieza la contienda con 2 orbes de Cataclismo Astral y 20 PV suplementarios.',
    lore: 'Hogaza de pan con corteza crujiente y miga esponjosa horneada en horno de piedra centenario.',
  },
  'harinas,harinas,lacteos': {
    name: 'Arepas Caseras Rellenas de Queso',
    icon: '/assets/items/arepas.png',
    rarity: 'SR',
    buffBadge: '-20% DAÑO & +25 PV',
    buffDescription: 'Reduce el daño recibido un 20% y restaura 25 PV de vitalidad.',
    lore: 'Tortas doradas asadas al budare rellenas generosamente con queso fresco fundido al calor.',
  },
  'especias,harinas,harinas': {
    name: 'Pancakes con Crema y Mantequilla',
    icon: '/assets/items/tortitas.png',
    rarity: 'R',
    buffBadge: '+20% ORO & EXPERIENCIA',
    buffDescription: 'Otorga un 20% extra de Oro y EXP al completar el siguiente combate o patrulla.',
    lore: 'Torre de tortitas esponjosas bañadas en crema de leche dulce y una pizca de sal marina.',
  },
  'harinas,harinas,pescados': {
    name: 'Tempura Crujiente de Pescado Blanco',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% DEF',
    buffDescription: 'Aumenta el ataque un 20% y la armadura un 15% durante toda la batalla.',
    lore: 'Filetes de pescado blanco envueltos en masa crujiente frita al estilo de las tabernas portuarias.',
  },
  'harinas,harinas,monstruos': {
    name: 'Empanada Hojaldrada de Larvas Doradas',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 30 PV',
    buffDescription: 'Incrementa un 30% el ataque y despliega un escudo de 30 PV protectores.',
    lore: 'Pastel de hojaldre relleno con guiso especiado de larvas cavernícolas y granos de montaña.',
  },
  'harinas,lacteos,lacteos': {
    name: 'Soufflé de Queso Gruyère Horneado',
    icon: '/assets/items/pizza.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +30 PV',
    buffDescription: 'Aumenta un 25% la defensa frente a impactos y restaura 30 PV de vitalidad.',
    lore: 'Plato clásico francés que se infla en el fogón con corazón esponjoso y cremoso de queso curado.',
  },
  'especias,harinas,lacteos': {
    name: 'Pizza Margarita al Horno de Leña',
    icon: '/assets/items/pizza.png',
    rarity: 'SR',
    buffBadge: '+30% DEF & ESCUDO 30',
    buffDescription: 'Reduce un 30% el daño recibido y otorga un escudo protector de 30 PV.',
    lore: 'Auténtica pizza napolitana con masa madre crujiente, mozzarella fundida y orégano aromático.',
  },
  'harinas,lacteos,pescados': {
    name: 'Tarta Quiche de Salmón y Queso Cremoso',
    icon: '/assets/items/food_fish_chips.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +25 PV REGEN',
    buffDescription: 'Incrementa la defensa un 20% y regenera 25 PV de salud por turno.',
    lore: 'Fondo crujiente de masa de trigo con salmón ahumado y bechamel batida con mantequilla.',
  },
  'harinas,lacteos,monstruos': {
    name: 'Milanesa de Devorador Empanada',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+35% ATAQUE & PERFORACIÓN 50%',
    buffDescription: 'Aumenta un 35% todo el daño físico y mágico de combate e ignora el 50% de la armadura enemiga.',
    lore: 'Filete magro del devorador macerado, rebozado con harina de trigo y huevo campero, dorado a punto crujiente.',
  },
  'especias,especias,harinas': {
    name: 'Nachos Crujientes con Especias de Fuego',
    icon: '/assets/items/doritos.png',
    rarity: 'R',
    buffBadge: '+20% CRÍTICO & QUEMADURA',
    buffDescription: 'Eleva la probabilidad de asestar golpes críticos un 20% e inflige quemadura.',
    lore: 'Triángulos de harina de maíz fritos y sazonados con una mezcla ardiente de pimentón y pimienta.',
  },
  'especias,harinas,pescados': {
    name: 'Sushi Nigiri de Salmón Glacial',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+15% VEL & CONGELACIÓN',
    buffDescription: 'Aumenta un 15% la velocidad y añade probabilidad de congelar al objetivo.',
    lore: 'Finos cortes de salmón ártico sobre lecho de arroz aderezado con vinagre de arroz y sal gema.',
  },
  'especias,harinas,monstruos': {
    name: 'Tempura de Devorador con Salsa Agridulce',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & PERFORACIÓN 30%',
    buffDescription: 'Aumenta un 30% el ataque y permite ignorar el 30% de la armadura del objetivo.',
    lore: 'Bocados de monstruo rebozados en tempura finísima y fritos al punto crujiente y ligero.',
  },
  'harinas,pescados,pescados': {
    name: 'Pastel Gallego de Trucha y Salmón',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Concede un 20% más de daño y un 20% de incremento en la rapidez de turno.',
    lore: 'Masa fina horneada que encierra un relleno abundante de dos pescados de las aguas de Icespear.',
  },
  'harinas,monstruos,pescados': {
    name: 'Tacos de Cangrejo de Cueva con Salsa Suave',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 30% el poder destructivo y otorga gran movilidad en combate.',
    lore: 'Carne jugosa de cangrejo subterráneo desmigada y servida en tortillas de trigo recién hechas.',
  },
  'harinas,monstruos,monstruos': {
    name: 'Pastel Imperial de la Colonia de Nidos',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+40% ATK & ESCUDO 40 PV',
    buffDescription: 'Aumenta un 40% el daño e invoca una formidable barrera protectora de 40 PV.',
    lore: 'Masa dorada rellena con estofado de dos partes selectas de criaturas de las profundidades.',
  },

  // --- LÁCTEOS COMBINACIONES ---
  'lacteos,lacteos,lacteos': {
    name: 'Fondue Suiza Tradicional al Horno',
    icon: '/assets/items/food_fondue.png',
    rarity: 'SR',
    buffBadge: '+35% DEF & ESCUDO 35 PV',
    buffDescription: 'Potencia la defensa en un 35% y envuelve a los héroes en un escudo de 35 PV.',
    lore: 'Famoso plato de los Alpes: cazuela burbujeante de queso curado, mantequilla salada y leche fresca.',
  },
  'especias,lacteos,lacteos': {
    name: 'Dip de Queso Crema a las Cuatro Pimientas',
    icon: '/assets/items/food_fondue.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +25% CRÍTICO',
    buffDescription: 'Aumenta un 25% la armadura y eleva la probabilidad crítica en un 25%.',
    lore: 'Crema batida untable con quesos alpinos madurados y una mezcla aromática de pimienta y sal gema.',
  },
  'lacteos,lacteos,pescados': {
    name: 'Clam Chowder Cremoso de Salmón',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +35 PV REGEN',
    buffDescription: 'Incrementa la defensa un 20% y proporciona abundante regeneración de salud.',
    lore: 'Clásico chowder norteamericano de pescado blanco cocinado a fuego lento en leche entera y mantequilla.',
  },
  'lacteos,lacteos,monstruos': {
    name: 'Flan Salado de Huevos de Colonia al Gratén',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: '+30% DEF & ESCUDO 30 PV',
    buffDescription: 'Refuerza la defensa un 30% y protege con una barrera mágica de 30 PV.',
    lore: 'Cuajada horneada de huevos de araknoide emulsionados con leche fresca y queso madurado derretido.',
  },
  'especias,especias,lacteos': {
    name: 'Mantequilla Especiada de Hierbas y Ajo (Beurre Maître d\'Hôtel)',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+25% CRÍTICO & +35% DMG',
    buffDescription: 'Aumenta un 25% la tasa crítica y un 35% el daño crítico infligido.',
    lore: 'Clásica mantequilla francesa batida con pimienta negra, sal marina y finas hierbas aromáticas.',
  },
  'especias,lacteos,pescados': {
    name: 'Trucha a la Meunière con Mantequilla y Eneldo',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% VELOCIDAD',
    buffDescription: 'Aumenta el daño un 20% y aporta agilidad de reflejos a los héroes.',
    lore: 'Filetes de trucha a la sartén bañados con salsa francesa de mantequilla salada, pimienta y sal marina.',
  },
  'especias,lacteos,monstruos': {
    name: 'Cazuela de Queso Fundido con Larvas Salteadas',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +25% CRÍTICO',
    buffDescription: 'Eleva el ataque un 30% y multiplica la probabilidad de asestar golpes críticos.',
    lore: 'Queso curado fundido en cazuela de hierro con larvas tostadas y pimentón picante ahumado.',
  },
  'lacteos,pescados,pescados': {
    name: 'Gratinado Escandinavo de Salmón y Trucha',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% DEF',
    buffDescription: 'Equilibrio perfecto de combate con +20% de daño y +20% de resistencia.',
    lore: 'Lomos de dos pescados árticos cocinados suavemente bajo un manto dorado de queso y mantequilla.',
  },
  'lacteos,monstruos,pescados': {
    name: 'Cangrejo de Cueva Termidor al Queso Fundido',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 25 PV',
    buffDescription: 'Incrementa el ataque un 30% y añade un escudo de 25 PV absorbente.',
    lore: 'Receta clásica thermidor adaptada con cangrejo cavernario, mantequilla salada y queso gratinado.',
  },
  'lacteos,monstruos,monstruos': {
    name: 'Tarta Suprema de la Madre de Nidos',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'UR',
    buffBadge: 'EVASIÓN 100% & +40 PV REGEN',
    buffDescription: 'Esquiva garantizada del primer golpe recibido y regeneración masiva de vida.',
    lore: 'Elaboración celestial que funde huevos y larvas de nido con el mejor queso curado del bastión.',
  },

  // --- ESPECIAS COMBINACIONES ---
  'especias,especias,especias': {
    name: 'Salsa Brava Furia del Dragón',
    icon: '/assets/items/doritos.png',
    rarity: 'SR',
    buffBadge: '+35% DAÑO FUEGO & CRÍTICO 30%',
    buffDescription: 'Imbuye todos los ataques con daño ígneo devastador y dispara la probabilidad crítica.',
    lore: 'Concentrado abrasador de especias de dragón, granos de pimienta negra y cristales de sal marina.',
  },
  'especias,especias,pescados': {
    name: 'Salmón a la Veracruzana Extra Especiado',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & QUEMADURA',
    buffDescription: 'Aumenta un 25% el ataque e inflige quemadura abrasadora a los contrincantes.',
    lore: 'Pescado sellado a fuego vivo con costra de chilis molidos, sal pura glacial y granos de pimienta.',
  },
  'especias,especias,monstruos': {
    name: 'Adobo Concentrado de Furia Carmesí',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+35% ATK & PERFORACIÓN 40%',
    buffDescription: 'Incrementa un 35% el daño total e ignora el 40% de la resistencia enemiga.',
    lore: 'Maceración de carne de monstruo con doble ración de especias picantes que desatan una ferocidad temible.',
  },
  'especias,pescados,pescados': {
    name: 'Pescado a la Sal Marina con Finas Hierbas',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta el ataque un 20% y otorga ventaja en la velocidad del escuadrón.',
    lore: 'Trucha y salmón horneados bajo costra sólida de sal glacial con ramas de romero y laurel.',
  },
  'especias,monstruos,pescados': {
    name: 'Cangrejo de Cueva al Ajillo Picante',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ROBO DE VIDA 15%',
    buffDescription: 'Aumenta un 30% el ataque y regenera salud equivalente al 15% del daño infligido.',
    lore: 'Pinzas de cangrejo salteadas en cazuela con guindillas de dragón, sal gema y granos de pimienta.',
  },
  'especias,monstruos,monstruos': {
    name: 'Guiso Picante del Nido Infernal',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+45% ATK & DAÑO DE SANGRADO',
    buffDescription: 'Aumenta un 45% el ataque y desgasta la salud de los rivales con sangrado continuo.',
    lore: 'Plato especiado extremo elaborado con dobles porciones de monstruo y fuego culinario concentrado.',
  },

  // --- PESCADOS & MONSTRUOS COMBINACIONES ---
  'pescados,pescados,pescados': {
    name: 'Gran Parrillada de Pescadores del Fiordo',
    icon: '/assets/items/shushi.png',
    rarity: 'SSR',
    buffBadge: '+30% VELOCIDAD & +30 PV REGEN',
    buffDescription: 'Concede un 30% de aceleración de turnos y cura 30 PV de inmediato.',
    lore: 'Festín opulento de lomos de trucha, salmón ártico y cangrejo de aguas subterráneas asados al vapor.',
  },
  'monstruos,pescados,pescados': {
    name: 'Caldereta Marinera con Pinzas de Devorador',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & INMUNIDAD CONGELACIÓN',
    buffDescription: 'Aumenta un 30% el ataque y protege al grupo contra efectos de frío o inmovilización.',
    lore: 'Sopa marinera robusta que combina la delicadeza del salmón fresco con la fuerza de la carne quitinosa.',
  },
  'monstruos,monstruos,pescados': {
    name: 'Ceviche Negro de Cangrejo y Larvas Cavernarias',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'UR',
    buffBadge: '+40% ATK & EVASIÓN 40%',
    buffDescription: 'Aumenta un 40% el daño ofensivo y otorga un 40% de probabilidad de esquivar golpes.',
    lore: 'Plato legendario de sabor profundo a marisco con la vitalidad regeneradora de las larvas de nido.',
  },
  'monstruos,monstruos,monstruos': {
    name: 'Corazón de la Colonia Cocinado al Vacío',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+50% ATK & VIDA ETERNA +50 PV',
    buffDescription: 'El buff culinario definitivo: +50% a todo el daño, +50 PV al instante y regeneración +20 PV/turno.',
    lore: 'La cumbre de la cocina clandestina de la taberna. Una sinfonía colosal de huevos, larvas y carne quitinosa.',
  },
};

// Normalize keys
const NORMALIZED_MAP: Record<string, RecipeBlueprint> = {};
for (const [k, v] of Object.entries(REAL_RECIPES_MAP)) {
  const sortedKey = k.split(',').sort().join(',');
  NORMALIZED_MAP[sortedKey] = v;
}

const allRecipes: CookingRecipe[] = [];

// Add all 84 category combinations (1 unique dish per combination, 84 dishes total)
for (let i = 0; i < CATEGORIES.length; i++) {
  for (let j = i; j < CATEGORIES.length; j++) {
    for (let k = j; k < CATEGORIES.length; k++) {
      const c1 = CATEGORIES[i];
      const c2 = CATEGORIES[j];
      const c3 = CATEGORIES[k];
      const sortedKey = [c1, c2, c3].sort().join(',');
      const bp = NORMALIZED_MAP[sortedKey];

      if (!bp) {
        console.error(`Missing recipe for: ${sortedKey}`);
        continue;
      }

      allRecipes.push({
        id: `rec_combo_${c1}_${c2}_${c3}`,
        name: bp.name,
        icon: bp.icon,
        rarity: bp.rarity,
        buffBadge: bp.buffBadge,
        buffDescription: bp.buffDescription,
        lore: bp.lore,
        requiredCategories: [c1, c2, c3],
        shelfItemId: `food_combo_${c1}_${c2}_${c3}`,
      });
    }
  }
}

console.log(`Generated ${allRecipes.length} recipes in total.`);

// Write to src/data/cookingRecipesList.ts
const fileHeader = `// AUTO-GENERATED COMPLETE RECIPES LIST FOR CDD GACHA 2 TAVERN COOKING
// Real culinary recipes from 7DS Grand Cross and traditional world gastronomy
export type IngredientCategory =
  | 'carnes'
  | 'verduras'
  | 'harinas'
  | 'lacteos'
  | 'especias'
  | 'pescados'
  | 'monstruos';

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

export const COMPLETE_COOKING_RECIPES: CookingRecipe[] = ${JSON.stringify(allRecipes, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/cookingRecipesList.ts'), fileHeader, 'utf-8');
console.log('src/data/cookingRecipesList.ts successfully updated with real recipes!');
