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

// 1. Signature Recipes (Triggered when specific key ingredients are used)
const SIGNATURE_RECIPES: CookingRecipe[] = [
  {
    id: 'rec_tortilla_araknoide',
    name: 'Tortilla de Araknoide',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN 100% & +35% CELERIDAD',
    buffDescription: 'Esquiva con certeza total el próximo ataque enemigo, purifica debuffs y otorga un 35% extra de celeridad.',
    lore: 'Elaborada batiendo huevos de araknoide con patatas de montaña y ajo silvestre de las cuevas carmesí.',
    requiredCategories: ['monstruos', 'verduras', 'verduras'],
    specificIngredientIds: ['ing_huevos_araknoide', 'ing_patata_montana', 'ing_ajo_silvestre'],
    shelfItemId: 'food_tortilla_araknoide',
  },
  {
    id: 'rec_devorador_empanada',
    name: 'Carne de Devorador Empanada',
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
    name: 'Salteado de Larvas Crujientes',
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
    name: 'Ramen Humeante de Icespear',
    icon: '/assets/items/ramen.png',
    rarity: 'SR',
    buffBadge: '+40 PV & +8 REGEN',
    buffDescription: 'Restaura 40 PV de inmediato y concede regeneración continua de +8 PV al inicio de cada turno.',
    lore: 'Fideos artesanos en caldo concentrado caliente con carne ahumada y hortalizas frescas del huerto.',
    requiredCategories: ['carnes', 'verduras', 'harinas'],
    specificIngredientIds: ['ing_carne_ahumada', 'ing_hortalizas_huerto', 'ing_harina_trigo'],
    shelfItemId: 'food_ramen',
  },
  {
    id: 'rec_pan_ajo',
    name: 'Panes de Ajo Dorados',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+2 ORBES DEFINITIVOS',
    buffDescription: 'Empieza el próximo combate con 2 orbes de habilidad definitiva (Cataclismo Astral) listos.',
    lore: 'Hogaza tostada bañada en mantequilla salada batida y ajo silvestre de las laderas nevadas.',
    requiredCategories: ['harinas', 'lacteos', 'verduras'],
    specificIngredientIds: ['ing_pan_rustico', 'ing_mantequilla_salada', 'ing_ajo_silvestre'],
    shelfItemId: 'food_pan_ajo',
  },
  {
    id: 'rec_tortitas',
    name: 'Tortitas de Miel y Crema',
    icon: '/assets/items/tortitas.png',
    rarity: 'R',
    buffBadge: '+20% ORO & EXPERIENCIA',
    buffDescription: 'Otorga un 20% extra de Oro y EXP al completar el siguiente combate o patrulla.',
    lore: 'Torre de tortitas esponjosas bañadas en crema dulce y sal marina pura de las colinas de Icespear.',
    requiredCategories: ['harinas', 'lacteos', 'especias'],
    specificIngredientIds: ['ing_harina_trigo', 'ing_leche_fresca', 'ing_sal_glacial'],
    shelfItemId: 'food_tortitas',
  },
  {
    id: 'rec_estofado_magordito',
    name: 'Estofado Legendario de Icespear',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+20% TODOS STATS & +50 PV',
    buffDescription: 'Aumenta un 20% Ataque y Defensa, +50 PV Máx y regenera +15 PV por turno en combate.',
    lore: 'La obra maestra culinaria del fogón. Un caldero que revitaliza hasta las almas caídas en batalla.',
    requiredCategories: ['carnes', 'verduras', 'lacteos'],
    specificIngredientIds: ['ing_lomo_jabali', 'ing_setas_cueva', 'ing_mantequilla_salada'],
    shelfItemId: 'food_estofado_magordito',
  },
];

// Helper to define recipes for all 84 category trios
type RecipeBlueprint = Omit<CookingRecipe, 'id' | 'shelfItemId' | 'requiredCategories'>;

// Complete dictionary of all 84 category trios (sorted alphabetically)
const TRIO_RECIPES: Record<string, RecipeBlueprint> = {
  // --- CARNES COMBOS ---
  'carnes,carnes,carnes': {
    name: 'Asado Tríptico de los Titanes',
    icon: '/assets/items/hamburguesa.png',
    rarity: 'SSR',
    buffBadge: '+35% ATAQUE FÍSICO PURO',
    buffDescription: 'Otorga un 35% extra de daño físico directo y aumenta la fuerza de impacto de los guerreros.',
    lore: 'Banquete colosal compuesto exclusivamente por cortes selectos a la brasa. Pura energía carnívora.',
  },
  'carnes,carnes,verduras': {
    name: 'Costillar Braseado con Brotes Glaciares',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & +10 PV REGEN',
    buffDescription: 'Incrementa un 25% el daño físico y regenera 10 PV por turno durante la contienda.',
    lore: 'Carne asada lentamente sobre brasas de roble, guarnecida con verduras de huerto escarchadas.',
  },
  'carnes,carnes,harinas': {
    name: 'Pastel de Carne del Bastión',
    icon: '/assets/items/hamburguesa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & ESCUDO 25 PV',
    buffDescription: 'Concede un bono de +20% al ataque e imbuye al combatiente con un escudo de 25 PV.',
    lore: 'Masa dorada rellena de carne picada sazonada con el jugo de los mejores asados de Icespear.',
  },
  'carnes,carnes,lacteos': {
    name: 'Carne Mechada Fundida a los Tres Quesos',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +30 PV REGEN',
    buffDescription: 'Aumenta un 20% la defensa y regenera 30 PV de vitalidad inmediata en combate.',
    lore: 'Hebras tiernas de carne cubiertas con una capa espesa de queso derretido al horno.',
  },
  'carnes,carnes,especias': {
    name: 'Guiso Ígneo de Doble Carne',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+30% DAÑO FUEGO & SANGRADO',
    buffDescription: 'Imbuye los ataques con +30% de daño de fuego y aplica sangrado a los objetivos golpeados.',
    lore: 'Carne magra y ahumada cocinada con especias de dragón que hacen hervir la sangre de valor.',
  },
  'carnes,carnes,pescados': {
    name: 'Mar y Montaña de los Cielos',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+25% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 25% el ataque general y acelera el turno de acción de todos los héroes.',
    lore: 'Combinación magistral de carnes de caza terrestre y salmón de los ríos helados en un plato opulento.',
  },
  'carnes,carnes,monstruos': {
    name: 'Parrillada de Bestias Abisales',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+40% DAÑO & PERFORACIÓN 30%',
    buffDescription: 'Desata una furia atroz aumentando el daño en un 40% e ignorando el 30% de la defensa enemiga.',
    lore: 'Cortes colosales de res y jabalí marinados con carne de devorador para una potencia brutal.',
  },
  'carnes,verduras,verduras': {
    name: 'Salteado Campero con Lomo Asado',
    icon: '/assets/items/ramen.png',
    rarity: 'R',
    buffBadge: '+15% DEF & +20 PV',
    buffDescription: 'Restaura 20 PV y concede un 15% adicional de defensa frente a ataques enemigos.',
    lore: 'Tiras finas de lomo salteadas con abundante ajo silvestre, setas de cueva y hortalizas frescas.',
  },
  'carnes,harinas,verduras': {
    name: 'Hamburguesa Artesanal',
    icon: '/assets/items/hamburguesa.png',
    rarity: 'SR',
    buffBadge: '+25% ATAQUE',
    buffDescription: 'Aumenta un 25% todo el daño físico y mágico en el próximo combate.',
    lore: 'Carne a la brasa con queso fundido y hortalizas crujientes en pan de sésamo.',
  },
  'carnes,lacteos,verduras': {
    name: 'Cazuela Glacial de Ternera y Nata',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +35 PV',
    buffDescription: 'Aumenta un 20% la defensa y restaura 35 PV de salud al escuadrón.',
    lore: 'Guiso cremoso donde la carne se deshace entre patatas de montaña y mantequilla batida.',
  },
  'carnes,especias,verduras': {
    name: 'Kebab Carmesí de Bestia',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+20% DAÑO FUEGO',
    buffDescription: 'Imbuye tus armas con +20% de daño ígneo y provoca quemadura al enemigo.',
    lore: 'Carne adobada asada al espetón, servida con vegetales y salsa picante en pan fino.',
  },
  'carnes,pescados,verduras': {
    name: 'Caldereta Mixta de Río y Valle',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & INMUNIDAD HELADA',
    buffDescription: 'Aumenta un 20% el daño e inmuniza contra efectos de congelación y lentitud.',
    lore: 'Sopa reconstituyente de trozos de trucha, carne de granja y hortalizas aromáticas.',
  },
  'carnes,monstruos,verduras': {
    name: 'Wok Cavernario de Devorador',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20% CRÍTICO',
    buffDescription: 'Aumenta un 30% el ataque y eleva la tasa de impactos críticos un 20%.',
    lore: 'Salteado a fuego alto de carne de monstruo con verduras crujientes recién cosechadas.',
  },
  'carnes,harinas,harinas': {
    name: 'Pastel Hojaldrado Relleno de Asado',
    icon: '/assets/items/hamburguesa.png',
    rarity: 'R',
    buffBadge: '+15% ATK & +15 PV',
    buffDescription: 'Aumenta un 15% el daño y otorga 15 PV de vitalidad extra.',
    lore: 'Doble capa de hojaldre crujiente rellena con estofado jugoso de carne desmigada.',
  },
  'carnes,harinas,lacteos': {
    name: 'Lasaña Rústica del Bastión',
    icon: '/assets/items/pizza.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & ESCUDO 20 PV',
    buffDescription: 'Aumenta un 20% la defensa y añade una barrera de 20 PV absorbente.',
    lore: 'Láminas de masa de trigo intercaladas con carne picada y bechamel de leche fresca dorada.',
  },
  'carnes,especias,harinas': {
    name: 'Bocados Crujientes McBites',
    icon: '/assets/items/mcbites.png',
    rarity: 'R',
    buffBadge: '+15% DAÑO FÍSICO',
    buffDescription: 'Aumenta un 15% el daño físico cuerpo a cuerpo de tus guerreros.',
    lore: 'Deliciosos bocados de pollo empanado especiado ideales para comer durante la marcha.',
  },
  'carnes,harinas,pescados': {
    name: 'Dumplings Dorados de Carne y Salmón',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% VELOCIDAD',
    buffDescription: 'Aumenta un 20% el ataque y concede un 15% extra de velocidad de acción.',
    lore: 'Empanadillas al vapor y tostadas en sartén rellenas de picadillo mixto de río y granja.',
  },
  'carnes,harinas,monstruos': {
    name: 'Pojarsky de Bestia Quitinosa',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ROBO DE VIDA 15%',
    buffDescription: 'Aumenta un 30% el poder ofensivo y restaura en salud el 15% del daño infligido.',
    lore: 'Milanesa gruesa moldeada con carnes selectas y esencias de monstruo, rebozada en pan rallado fino.',
  },
  'carnes,lacteos,lacteos': {
    name: 'Gratinado de Lomo al Doble Queso',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +25 PV REGEN',
    buffDescription: 'Refuerza la armadura un 25% y otorga regeneración prolongada de salud.',
    lore: 'Lomo tierno bañado en una salsa densa de mantequilla salada y abundante queso alpino curado.',
  },
  'carnes,especias,lacteos': {
    name: 'Quesarito Picante',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+35% CRÍTICO & +50% DMG',
    buffDescription: 'Aumenta un 35% la probabilidad de golpe crítico y un 50% el daño crítico infligido.',
    lore: 'Tortilla enrollada con queso hilado fundido, carne de bestia y especias ardientes de dragón.',
  },
  'carnes,lacteos,pescados': {
    name: 'Guiso Boreal de Salmón y Ternera a la Crema',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% DEF',
    buffDescription: 'Otorga un equilibrado +20% tanto al ataque como a la defensa durante todo el combate.',
    lore: 'Fusión suculenta de filetes marinos y terrestres cocinados en una crema suave con leche de montaña.',
  },
  'carnes,lacteos,monstruos': {
    name: 'Cazuela Carmesí con Queso Gratinado',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 35 PV',
    buffDescription: 'Aumenta un 30% el poder de ataque y levanta un escudo mágico de 35 PV al inicio de la pelea.',
    lore: 'Carne densa de monstruo estofada y sellada bajo una capa burbujeante de queso gratinado.',
  },
  'carnes,especias,especias': {
    name: 'Chili Dragontino del Fogón',
    icon: '/assets/items/doritos.png',
    rarity: 'SR',
    buffBadge: '+30% DAÑO & BURNOUT',
    buffDescription: 'Aumenta el daño un 30% e inflige quemaduras que debilitan el ataque rival.',
    lore: 'Carne picada bañada en una combinación abrasadora de chilis y pimienta negra molida.',
  },
  'carnes,especias,pescados': {
    name: 'Brochetas Glaciales de Mar y Brasa',
    icon: '/assets/items/kebab.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & CONGELACIÓN',
    buffDescription: 'Aumenta el ataque un 25% y da probabilidad de inmovilizar al objetivo con hielo.',
    lore: 'Dados alternados de carne curada y salmón adobados con sal pura y especias de dragón.',
  },
  'carnes,especias,monstruos': {
    name: 'Carne de Monstruo en Adobo Escarlata',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+35% ATK & ROBO DE VIDA 20%',
    buffDescription: 'Aumenta un 35% el ataque y recupera un 20% del daño en forma de puntos de vida.',
    lore: 'Maceración de carne de devorador con especias ardientes, dorada a fuego vivo para fijar sus jugos.',
  },
  'carnes,pescados,pescados': {
    name: 'Corona Marina con Dados de Ave',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% VELOCIDAD & +20 PV',
    buffDescription: 'Aumenta un 20% la velocidad de turno y cura 20 PV inmediatamente.',
    lore: 'Dúo de salmón ártico y trucha plateada entrelazados con dados de pollo tierno al vapor.',
  },
  'carnes,monstruos,pescados': {
    name: 'Guiso Abisal de Tres Reinos',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & PURIFICA DEBUFFS',
    buffDescription: 'Aumenta un 30% el ataque y disipa todas las penalizaciones y venenos de tus héroes.',
    lore: 'Plato singular que aúna pez de río helado, carne de granja y esencias purificadas de monstruo.',
  },
  'carnes,monstruos,monstruos': {
    name: 'Festín Colosal de la Horda',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+45% ATK & FURIA IMPARABLE',
    buffDescription: 'Aumenta un colosal 45% el ataque, otorga inmunidad a aturdimiento y regenera 20 PV/turno.',
    lore: 'Un festín monstruoso digno de los reyes bárbaros del cataclismo. El poder supremo de la carne.',
  },

  // --- VERDURAS COMBOS ---
  'verduras,verduras,verduras': {
    name: 'Ensalada Primordial de las Nieves',
    icon: '/assets/items/ramen.png',
    rarity: 'R',
    buffBadge: '+40 PV REGEN & PURIFICA',
    buffDescription: 'Cura 40 PV de inmediato y disipa efectos de veneno y quemadura.',
    lore: 'Mezcla revitalizante de ajo silvestre, hortalizas de huerto y setas bioluminiscentes de mina.',
  },
  'harinas,verduras,verduras': {
    name: 'Quiche Rústica de la Cosecha',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+15% DEF & +25 PV',
    buffDescription: 'Aumenta un 15% la armadura y concede 25 PV de salud máxima.',
    lore: 'Pastel salado horneado a la leña relleno de verduras de invierno y patata rallada dorada.',
  },
  'lacteos,verduras,verduras': {
    name: 'Gratinado Campestre de Patatas y Ajo',
    icon: '/assets/items/tortilla_patata.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +30 PV REGEN',
    buffDescription: 'Aumenta un 25% la resistencia y proporciona regeneración constante de vida.',
    lore: 'Patatas de Icespear cortadas finas, cocidas en crema de leche y cubiertas de queso tostado.',
  },
  'especias,verduras,verduras': {
    name: 'Curry Verde de Hongos y Raíces',
    icon: '/assets/items/ramen.png',
    rarity: 'SR',
    buffBadge: '+20% DAÑO & RESISTENCIA ELEMENTAL',
    buffDescription: 'Aumenta un 20% el daño general y otorga un 25% de resistencia a frío y fuego.',
    lore: 'Guiso aromático de setas cavernícolas y ajo con hierbas del bosque y pimienta negra molida.',
  },
  'pescados,verduras,verduras': {
    name: 'Trucha al Horno sobre Cama Silvestre',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% VELOCIDAD & +20 PV REGEN',
    buffDescription: 'Incrementa la presteza en combate un 20% y cura 20 PV cada turno.',
    lore: 'Trucha plateada cocinada en papillote con hortalizas de huerto y rodajas de patata al romero.',
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
    name: 'Focaccia Nevada de Ajo y Romero',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+15% DEF & +1 ORBE ULTI',
    buffDescription: 'Aumenta un 15% la defensa y suma 1 orbe al medidor de habilidad definitiva.',
    lore: 'Pan esponjoso de masa madre impregnado de aceite, sal marina y brotes aromáticos de bosque.',
  },
  'harinas,lacteos,verduras': {
    name: 'Arepas Doradas de la Reina',
    icon: '/assets/items/arepas.png',
    rarity: 'SR',
    buffBadge: '-20% DAÑO & +25 PV',
    buffDescription: 'Reduce el daño recibido un 20% y restaura 25 PV de vitalidad.',
    lore: 'Masa de maíz y harina asada al budare rellena con queso madurado derretido.',
  },
  'especias,harinas,verduras': {
    name: 'Gnocchis Dorados a las Finas Hierbas',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+15% VELOCIDAD & +15 PV',
    buffDescription: 'Aumenta la agilidad un 15% y aporta vitalidad para maniobrar.',
    lore: 'Bocados de masa de patata dorados en sartén con sal gema, pimienta y hierbas frescas.',
  },
  'harinas,pescados,verduras': {
    name: 'Tarta Hojaldrada de Salmón y Brotes',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% DEF',
    buffDescription: 'Proporciona un balance óptimo con +20% ataque y +15% defensa en batalla.',
    lore: 'Hojaldre fino relleno de filetes jugosos de pescado de río y setas de cueva.',
  },
  'harinas,monstruos,verduras': {
    name: 'Pellizcos de Devorador con Puré Rústico',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20 PV REGEN',
    buffDescription: 'Aumenta un 30% el daño infligido y regenera 20 PV tras cada acción.',
    lore: 'Guiso espeso de carne cavernaria acompañada de pan rústico y puré de patatas de montaña.',
  },
  'lacteos,lacteos,verduras': {
    name: 'Sopa Cremosa de Setas y Tres Quesos',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +35 PV',
    buffDescription: 'Refuerza la constitución con un 25% de defensa y regenera 35 PV.',
    lore: 'Crema aterciopelada de hongos cavernícolas emulsionados con leche fresca y mantequilla.',
  },
  'especias,lacteos,verduras': {
    name: 'Tortilla de Patatas',
    icon: '/assets/items/tortilla_patata.png',
    rarity: 'SR',
    buffBadge: 'EVASIÓN TOTAL & PURIFICA',
    buffDescription: 'Esquiva al 100% el siguiente golpe enemigo y purifica alteraciones de estado.',
    lore: 'Receta tradicional jugosa y en su punto, cocinada con patatas de montaña y huevos camperos.',
  },
  'lacteos,pescados,verduras': {
    name: 'Cazuela de Salmón al Gratén Suizo',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & ESCUDO 25 PV',
    buffDescription: 'Otorga un 20% más de armadura y un escudo mágico de 25 PV.',
    lore: 'Filetes de salmón cocidos suavemente con hortalizas de huerto y queso gratinado al horno.',
  },
  'lacteos,monstruos,verduras': {
    name: 'Revuelto de Huevos Carmesí y Setas',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN 100% & +25 PV REGEN',
    buffDescription: 'Otorga esquiva garantizada para el primer impacto y regenera 25 PV continuos.',
    lore: 'Huevos de colonia batidos con mantequilla salada y salteados con setas bioluminiscentes.',
  },
  'especias,especias,verduras': {
    name: 'Salteado Ardiente de Raíces Glaciares',
    icon: '/assets/items/doritos.png',
    rarity: 'R',
    buffBadge: '+20% DAÑO & QUEMADURA',
    buffDescription: 'Aumenta un 20% el ataque y prende en llamas a los enemigos impactados.',
    lore: 'Patatas y ajo silvestre cocinados con doble ración de especias de dragón y pimienta.',
  },
  'especias,pescados,verduras': {
    name: 'Ceviche Glacial con Finas Hierbas',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+25% VELOCIDAD & CRÍTICO +15%',
    buffDescription: 'Aumenta un 25% la velocidad de ataque y un 15% la probabilidad de golpe crítico.',
    lore: 'Pescado fresco marinado en sal gema, hierbas silvestres y dados de patata crujiente.',
  },
  'especias,monstruos,verduras': {
    name: 'Salteado de Larvas Crujientes',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SR',
    buffBadge: '+50 PV & +25% CRÍTICO',
    buffDescription: 'Restaura 50 PV de vitalidad de inmediato y aumenta un 25% la tasa y daño de impactos críticos.',
    lore: 'Larvas de la colonia carmesí salteadas a fuego vivo con hortalizas frescas y especias ardientes de dragón.',
  },
  'pescados,pescados,verduras': {
    name: 'Banquetillo Marinero de las Nieves',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 20% el ataque y permite adelantarse en el turno de combate.',
    lore: 'Combinación generosa de trucha y salmón cocinados al vapor con setas de mina y ajo.',
  },
  'monstruos,pescados,verduras': {
    name: 'Mariscada Abisal con Brotes Silvestres',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +15% DEF',
    buffDescription: 'Otorga una mejora masiva de combate con +30% de ataque y +15% de defensa.',
    lore: 'Cangrejo de cueva y carne de monstruo salteados con verduras frescas de huerto.',
  },
  'monstruos,monstruos,verduras': {
    name: 'Brebaje Denso de la Reina de Nidos',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: '+35% ATK & EVASIÓN 50%',
    buffDescription: 'Eleva el poder destructivo un 35% y concede un 50% de probabilidad de esquivar.',
    lore: 'Concentrado de huevos y larvas de araknoide con hierbas maceradas para apaciguar su ferocidad.',
  },

  // --- HARINAS COMBOS ---
  'harinas,harinas,harinas': {
    name: 'Torre de Panes de Cuatro Estaciones',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+2 ORBES ULTI & +20 PV',
    buffDescription: 'Empieza la contienda con 2 orbes de Cataclismo Astral y 20 PV suplementarios.',
    lore: 'Muestra variada de panes rústicos horneados con harinas selectas de grano de montaña.',
  },
  'harinas,harinas,lacteos': {
    name: 'Panecillos Brioche con Mantequilla Batida',
    icon: '/assets/items/tortitas.png',
    rarity: 'R',
    buffBadge: '+20% ORO & +15 PV',
    buffDescription: 'Incrementa un 20% el botín de oro tras vencer y aporta salud inicial.',
    lore: 'Masa enriquecida con leche entera y mantequilla salada, tierna como la nieve recién caída.',
  },
  'especias,harinas,harinas': {
    name: 'Crackers Especiados de Grano Puro',
    icon: '/assets/items/doritos.png',
    rarity: 'R',
    buffBadge: '+15% CRÍTICO & +15% VEL',
    buffDescription: 'Aumenta un 15% la tasa de golpes críticos y mejora la celeridad en batalla.',
    lore: 'Galletas saladas horneadas muy finas, espolvoreadas con sal marina y pimienta negra molida.',
  },
  'harinas,harinas,pescados': {
    name: 'Fish & Chips Tradicional de Icespear',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% DEF',
    buffDescription: 'Aumenta el ataque un 20% y la armadura un 15% durante toda la batalla.',
    lore: 'Filetes de trucha y salmón rebozados con masa crujiente de cerveza y harina dorada.',
  },
  'harinas,harinas,monstruos': {
    name: 'Hojaldre Relleno de Larvas Glaseadas',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 30 PV',
    buffDescription: 'Incrementa un 30% el ataque y despliega un escudo de 30 PV protectores.',
    lore: 'Empanada hojaldrada rellena con larvas y carne picada de monstruo sazonada al punto.',
  },
  'harinas,lacteos,lacteos': {
    name: 'Soufflé Fundido al Doble Queso',
    icon: '/assets/items/pizza.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +30 PV',
    buffDescription: 'Aumenta un 25% la defensa frente a impactos y restaura 30 PV de vitalidad.',
    lore: 'Masa esponjosa que se infla en el fogón con un corazón cremoso de quesos madurados.',
  },
  'especias,harinas,lacteos': {
    name: 'Pizza Fundida',
    icon: '/assets/items/pizza.png',
    rarity: 'SR',
    buffBadge: '+30% DEF & ESCUDO 30',
    buffDescription: 'Reduce un 30% el daño recibido y otorga un escudo protector de 30 PV.',
    lore: 'Masa crujiente horneada a la leña con abundante queso madurado y especias aromáticas.',
  },
  'harinas,lacteos,pescados': {
    name: 'Tarta Marinera de Pescado a la Bechamel',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +25 PV REGEN',
    buffDescription: 'Incrementa la defensa un 20% y regenera 25 PV de salud por turno.',
    lore: 'Fondo de masa de trigo cubierto de salmón y salsa bechamel sedosa de mantequilla.',
  },
  'harinas,lacteos,monstruos': {
    name: 'Carne de Devorador Empanada',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+35% ATAQUE & PERFORACIÓN 50%',
    buffDescription: 'Aumenta un 35% todo el daño físico y mágico de combate e ignora el 50% de la armadura enemiga.',
    lore: 'Filete magro del devorador macerado, rebozado con harina de trigo y huevo campero, dorado a punto crujiente.',
  },
  'especias,especias,harinas': {
    name: 'Tortillas de Maíz y Pimienta Ardiente',
    icon: '/assets/items/doritos.png',
    rarity: 'R',
    buffBadge: '+20% CRÍTICO & QUEMADURA',
    buffDescription: 'Eleva la probabilidad de asestar golpes críticos un 20% e inflige quemadura.',
    lore: 'Masa fina tostada en plancha de hierro con abundante pimienta y especias de dragón.',
  },
  'especias,harinas,pescados': {
    name: 'Sushi Glacial de Salmón',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+15% VEL & CONGELACIÓN',
    buffDescription: 'Aumenta un 15% la velocidad y añade probabilidad de congelar al objetivo.',
    lore: 'Salmón ártico fresco fileteado sobre montículos de arroz avinagrado de montaña con especias.',
  },
  'especias,harinas,monstruos': {
    name: 'Tempura Crujiente del Abismo',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & PERFORACIÓN 30%',
    buffDescription: 'Aumenta un 30% el ataque y permite ignorar el 30% de la armadura del objetivo.',
    lore: 'Tiras de devorador y larvas rebozadas en tempura fina especiada y fritas a alta temperatura.',
  },
  'harinas,pescados,pescados': {
    name: 'Pastel Doble de Pescados del Fiordo',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Concede un 20% más de daño y un 20% de incremento en la rapidez de turno.',
    lore: 'Empanada dorada rellena con trozos tiernos de salmón y trucha sazonados con sal gema.',
  },
  'harinas,monstruos,pescados': {
    name: 'Tacos de Cangrejo de Cueva y Grano Fino',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 30% el poder destructivo y otorga gran movilidad en combate.',
    lore: 'Carne jugosa de cangrejo y trozos de devorador servidos sobre obleas tostadas de trigo.',
  },
  'harinas,monstruos,monstruos': {
    name: 'Corona Imperial del Devorador',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+40% ATK & ESCUDO 40 PV',
    buffDescription: 'Aumenta un 40% el daño e invoca una formidable barrera protectora de 40 PV.',
    lore: 'Masa dorada rellena con un guiso concentrado de dos partes de monstruos cavernícolas.',
  },

  // --- LÁCTEOS COMBOS ---
  'lacteos,lacteos,lacteos': {
    name: 'Trilogía Suprema de Quesos Madurados',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+35% DEF & ESCUDO 35 PV',
    buffDescription: 'Potencia la defensa en un 35% y envuelve a los héroes en un escudo de 35 PV.',
    lore: 'Fundición magistral de queso de cabra, mantequilla artesanal y leche fresca concentrada.',
  },
  'especias,lacteos,lacteos': {
    name: 'Fondue Alpina a las Cuatro Pimientas',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & +25% CRÍTICO',
    buffDescription: 'Aumenta un 25% la armadura y eleva la probabilidad crítica en un 25%.',
    lore: 'Olla de queso derretido sazonada con pimienta negra recién molida y sal marina glacial.',
  },
  'lacteos,lacteos,pescados': {
    name: 'Chowder Cremoso del Pescador',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & +35 PV REGEN',
    buffDescription: 'Incrementa la defensa un 20% y proporciona abundante regeneración de salud.',
    lore: 'Sopa espesa y reconfortante de salmón fresco cocinado a fuego lento en leche y mantequilla.',
  },
  'lacteos,lacteos,monstruos': {
    name: 'Flan Salado de Huevos de Colonia',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: '+30% DEF & ESCUDO 30 PV',
    buffDescription: 'Refuerza la defensa un 30% y protege con una barrera mágica de 30 PV.',
    lore: 'Cuajada horneada de huevos de araknoide emulsionados con nata densa de leche alpina.',
  },
  'especias,especias,lacteos': {
    name: 'Mantequilla Clarificada con Especias de Fuego',
    icon: '/assets/items/quesarito.png',
    rarity: 'SR',
    buffBadge: '+25% CRÍTICO & +35% DMG',
    buffDescription: 'Aumenta un 25% la tasa crítica y un 35% el daño crítico infligido.',
    lore: 'Ghee aromático infusionado con chilis de dragón y cristales de sal gema pura.',
  },
  'especias,lacteos,pescados': {
    name: 'Trucha en Salsa Mantecosa de Eneldo y Pimienta',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +15% VELOCIDAD',
    buffDescription: 'Aumenta el daño un 20% y aporta agilidad de reflejos a los héroes.',
    lore: 'Filetes dorados a la plancha bañados en salsa espumosa de mantequilla y pimienta aromática.',
  },
  'especias,lacteos,monstruos': {
    name: 'Dip Picante de Larvas con Queso Hilado',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +25% CRÍTICO',
    buffDescription: 'Eleva el ataque un 30% y multiplica la probabilidad de asestar golpes críticos.',
    lore: 'Cazuela hirviente de queso fundido con larvas tostadas y especias ardientes de dragón.',
  },
  'lacteos,pescados,pescados': {
    name: 'Dúo de Salmón y Trucha a la Meunière',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% DEF',
    buffDescription: 'Equilibrio perfecto de combate con +20% de daño y +20% de resistencia.',
    lore: 'Dos pescados del río cocinados a fuego suave con mantequilla noisette y leche batida.',
  },
  'lacteos,monstruos,pescados': {
    name: 'Cangrejo de Cueva al Gratén de Queso',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 25 PV',
    buffDescription: 'Incrementa el ataque un 30% y añade un escudo de 25 PV absorbente.',
    lore: 'Pinzas de cangrejo cubiertas de bechamel espesa y queso curado, gratinadas con llama directa.',
  },
  'lacteos,monstruos,monstruos': {
    name: 'Tarta Suprema de la Madre de Nidos',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'UR',
    buffBadge: 'EVASIÓN 100% & +40 PV REGEN',
    buffDescription: 'Esquiva garantizada del primer golpe recibido y regeneración masiva de vida.',
    lore: 'Elaboración celestial que funde huevos y larvas de nido con el mejor queso del bastión.',
  },

  // --- ESPECIAS COMBOS ---
  'especias,especias,especias': {
    name: 'Elixir de las Siete Brasas',
    icon: '/assets/items/doritos.png',
    rarity: 'SR',
    buffBadge: '+35% DAÑO FUEGO & CRÍTICO 30%',
    buffDescription: 'Imbuye todos los ataques con daño ígneo devastador y dispara la probabilidad crítica.',
    lore: 'Concentrado abrasador de especias de dragón, pimienta negra y cristales de sal glacial pura.',
  },
  'especias,especias,pescados': {
    name: 'Salmón a la Diabla de Icespear',
    icon: '/assets/items/shushi.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & QUEMADURA',
    buffDescription: 'Aumenta un 25% el ataque e inflige quemadura abrasadora a los contrincantes.',
    lore: 'Filetes de salmón marcados a fuego vivo con costra de chilis, sal gema y pimienta molida.',
  },
  'especias,especias,monstruos': {
    name: 'Concentrado Ígneo de Colonia Carmesí',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+35% ATK & PERFORACIÓN 40%',
    buffDescription: 'Incrementa un 35% el daño total e ignora el 40% de la resistencia enemiga.',
    lore: 'Larvas y huevos marinados en especias concentradas que despiertan una agresividad indómita.',
  },
  'especias,pescados,pescados': {
    name: 'Cazuela Boreal de Marisco al Azafrán',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta el ataque un 20% y otorga ventaja en la velocidad del escuadrón.',
    lore: 'Sopa clara de trucha y salmón perfumada con laurel, romero y granos de pimienta negra.',
  },
  'especias,monstruos,pescados': {
    name: 'Cangrejo Picante en Salsa Carmesí',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ROBO DE VIDA 15%',
    buffDescription: 'Aumenta un 30% el ataque y regenera salud equivalente al 15% del daño infligido.',
    lore: 'Cangrejo acorazado cocinado con especias ardientes y esencias de monstruo cavernícola.',
  },
  'especias,monstruos,monstruos': {
    name: 'Guiso Despiadado del Nido Infernal',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'UR',
    buffBadge: '+45% ATK & DAÑO DE SANGRADO',
    buffDescription: 'Aumenta un 45% el ataque y desgasta la salud de los rivales con sangrado continuo.',
    lore: 'Plato picante extremo elaborado con dobles porciones de monstruo y fuego culinario.',
  },

  // --- PESCADOS & MONSTRUOS COMBOS ---
  'pescados,pescados,pescados': {
    name: 'Festín Tri-Oceánico de Icespear',
    icon: '/assets/items/shushi.png',
    rarity: 'SSR',
    buffBadge: '+30% VELOCIDAD & +30 PV REGEN',
    buffDescription: 'Concede un 30% de aceleración de turnos y cura 30 PV de inmediato.',
    lore: 'Selección suprema de truchas, salmones y cangrejos de las aguas más puras del norte.',
  },
  'monstruos,pescados,pescados': {
    name: 'Caldereta Marina de las Cuevas Profundas',
    icon: '/assets/items/castillo_sopa.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & INMUNIDAD CONGELACIÓN',
    buffDescription: 'Aumenta un 30% el ataque y protege al grupo contra efectos de frío o inmovilización.',
    lore: 'Guiso caliente de peces árticos cocinados junto a carnes nutritivas del devorador.',
  },
  'monstruos,monstruos,pescados': {
    name: 'Sopa Negra de Larvas y Cangrejo Abisal',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'UR',
    buffBadge: '+40% ATK & EVASIÓN 40%',
    buffDescription: 'Aumenta un 40% el daño ofensivo y otorga un 40% de probabilidad de esquivar golpes.',
    lore: 'Caldo oscuro y denso con sabor intenso a marisco y el vigor sobrenatural de las larvas.',
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

// Normalize TRIO_RECIPES dictionary so keys are sorted
const NORMALIZED_TRIO_RECIPES: Record<string, RecipeBlueprint> = {};
for (const [key, value] of Object.entries(TRIO_RECIPES)) {
  const sortedKey = key.split(',').sort().join(',');
  NORMALIZED_TRIO_RECIPES[sortedKey] = value;
}

// Compile all 84 category recipes + signature recipes
const allRecipes: CookingRecipe[] = [];

// First add signature recipes (they take priority on specific items)
SIGNATURE_RECIPES.forEach((rec) => allRecipes.push(rec));

// Generate and add all 84 category combination recipes
for (let i = 0; i < CATEGORIES.length; i++) {
  for (let j = i; j < CATEGORIES.length; j++) {
    for (let k = j; k < CATEGORIES.length; k++) {
      const c1 = CATEGORIES[i];
      const c2 = CATEGORIES[j];
      const c3 = CATEGORIES[k];
      const sortedKey = [c1, c2, c3].sort().join(',');
      const blueprint = NORMALIZED_TRIO_RECIPES[sortedKey];

      if (!blueprint) {
        console.error(`Missing blueprint for combination: ${sortedKey}`);
        continue;
      }

      const id = `rec_combo_${c1}_${c2}_${c3}`;
      const shelfItemId = `food_combo_${c1}_${c2}_${c3}`;

      allRecipes.push({
        id,
        name: blueprint.name,
        icon: blueprint.icon,
        rarity: blueprint.rarity,
        buffBadge: blueprint.buffBadge,
        buffDescription: blueprint.buffDescription,
        lore: blueprint.lore,
        requiredCategories: [c1, c2, c3],
        shelfItemId,
      });
    }
  }
}

console.log(`Successfully generated ${allRecipes.length} recipes in total!`);

// Write to src/data/cookingRecipesList.ts
const fileHeader = `// AUTO-GENERATED COMPLETE RECIPES LIST FOR CDD GACHA 2 TAVERN COOKING
// Covers all 84 unique 3-category combinations + signature ingredient recipes
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
console.log('Saved src/data/cookingRecipesList.ts successfully!');
