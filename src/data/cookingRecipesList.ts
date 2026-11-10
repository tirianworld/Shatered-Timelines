// 1-to-1 unique mapping for every single 3-ingredient combination in the tavern
// Generates all 3,276 unique dishes with zero collisions and 100% accurate ingredient representation
import type { CookingIngredient, CookingRecipe, IngredientCategory } from './cookingData';

const INGREDIENT_NAMES: Record<string, string> = {
  ing_pollo_calidad: 'Pollo de Corral',
  ing_carne_roja: 'Ternera Glacial',
  ing_carne_ahumada: 'Carne Ahumada',
  ing_lomo_jabali: 'Chuletón de Jabalí',
  ing_ajo_silvestre: 'Ajo Silvestre',
  ing_patata_montana: 'Patatas de Icespear',
  ing_hortalizas_huerto: 'Hortalizas de Huerto',
  ing_setas_cueva: 'Setas de las Minas',
  ing_harina_trigo: 'Harina de Trigo',
  ing_pan_rustico: 'Pan Rústico',
  ing_arroz_grano: 'Arroz de Montaña',
  ing_masa_madre: 'Masa Madre',
  ing_queso_cabra: 'Queso Madurado',
  ing_leche_fresca: 'Leche Fresca',
  ing_mantequilla_salada: 'Mantequilla Salada',
  ing_huevos_corral: 'Huevos Camperos',
  ing_especias_dragon: 'Especias de Dragón',
  ing_sal_glacial: 'Sal Marina Glacial',
  ing_hierbas_bosque: 'Hierbas del Bosque',
  ing_pimienta_negra: 'Pimienta Negra',
  ing_salmon_helado: 'Salmón del Río Helado',
  ing_trucha_arroyo: 'Trucha Plateada',
  ing_cangrejo_cueva: 'Cangrejo de Cueva',
  ing_carne_devorador: 'Carne de Devorador',
  ing_larvas_araknoide: 'Larvas de Araknoide',
  ing_huevos_araknoide: 'Huevos de Araknoide',
};

const CATEGORY_PRIORITY: Record<IngredientCategory, number> = {
  monstruos: 1,
  pescados: 2,
  carnes: 3,
  harinas: 4,
  verduras: 5,
  lacteos: 6,
  especias: 7,
};

// Curated Signature Recipes with canonical 7DS and Bastion dishes
const SIGNATURES: Record<
  string,
  {
    name: string;
    icon: string;
    rarity: 'R' | 'SR' | 'SSR' | 'UR';
    buffBadge: string;
    buffDescription: string;
    lore: string;
  }
> = {
  'ing_carne_roja__ing_harina_trigo__ing_patata_montana': {
    name: 'Steak & Chips de la Taberna',
    icon: '/assets/items/food_steak_chips.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN TOTAL & +25% ATK',
    buffDescription: 'Plato estrella de 7DS Grand Cross: Esquiva con certeza el primer golpe enemigo y otorga un 25% de ataque.',
    lore: 'El clásico insustituible del Sombrero de Jabalí: solomillo a la brasa servido con patatas doradas crujientes.',
  },
  'ing_harina_trigo__ing_patata_montana__ing_salmon_helado': {
    name: 'Fish & Chips Tradicional de Salmón',
    icon: '/assets/items/salmon_dishes/salmon_ing_harina_trigo__ing_patata_montana__ing_salmon_helado.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN DE DEBUFFS & VELOCIDAD',
    buffDescription: 'Plato de combate de 7DS: Inmune a congelación y venenos, y aumenta un 20% la velocidad de turno.',
    lore: 'Lomos de salmón del río helado rebozados en masa crujiente dorada con patatas fritas cortadas a mano.',
  },
  'ing_huevos_corral__ing_pan_rustico__ing_patata_montana': {
    name: 'Eggs & Chips Campestre',
    icon: '/assets/items/food_eggs_chips.png',
    rarity: 'SR',
    buffBadge: 'EVASIÓN DE 1 GOLPE',
    buffDescription: 'Famoso plato de 7DS: Esquiva con certeza total el siguiente ataque enemigo.',
    lore: 'Huevos de granja fritos con yema líquida servidos sobre abundante cama de patatas de montaña crujientes.',
  },
  'ing_cangrejo_cueva__ing_harina_trigo__ing_huevos_corral': {
    name: 'Quiche Dorada de Cangrejo de Cueva y Huevos Camperos',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_harina_trigo__ing_huevos_corral.png',
    rarity: 'SR',
    buffBadge: '+25% DEF & ESCUDO 25 PV',
    buffDescription: 'Tarta salada horneada a leña: incrementa un 25% la armadura y crea una barrera de 25 PV protectores.',
    lore: 'Exquisita quiche de masa quebrada de harina de trigo rellena con carne tierna desmigada de cangrejo de cueva y huevos camperos.',
  },
  'ing_ajo_silvestre__ing_huevos_araknoide__ing_patata_montana': {
    name: 'Tortilla de Araknoide',
    icon: '/assets/items/food_tortilla_araknoide.png',
    rarity: 'SSR',
    buffBadge: 'EVASIÓN 100% & +35% CELERIDAD',
    buffDescription: 'Esquiva con certeza total el próximo ataque enemigo, purifica debuffs y otorga un 35% extra de celeridad.',
    lore: 'Receta exótica batida con huevos de araknoide, patatas de montaña y ajo silvestre de las cuevas carmesí.',
  },
  'ing_carne_devorador__ing_harina_trigo__ing_huevos_corral': {
    name: 'Milanesa de Devorador Empanada',
    icon: '/assets/items/food_devorador_empanada.png',
    rarity: 'SSR',
    buffBadge: '+35% ATAQUE & PERFORACIÓN 50%',
    buffDescription: 'Aumenta un 35% todo el daño físico y mágico de combate e ignora el 50% de la armadura enemiga.',
    lore: 'Filete magro del devorador macerado, rebozado con harina de trigo y huevo campero, dorado a punto crujiente.',
  },
  'ing_especias_dragon__ing_hortalizas_huerto__ing_larvas_araknoide': {
    name: 'Salteado de Larvas al Wok',
    icon: '/assets/items/food_larvas_crujientes.png',
    rarity: 'SR',
    buffBadge: '+50 PV & +25% CRÍTICO',
    buffDescription: 'Restaura 50 PV de vitalidad de inmediato y aumenta un 25% la tasa y daño de impactos críticos.',
    lore: 'Larvas de la colonia carmesí salteadas a fuego vivo con hortalizas frescas y especias ardientes de dragón.',
  },
  'ing_lomo_jabali__ing_mantequilla_salada__ing_setas_cueva': {
    name: 'Boeuf Bourguignon de la Taberna',
    icon: '/assets/items/food_bourguignon.png',
    rarity: 'SSR',
    buffBadge: '+20% TODOS STATS & +50 PV',
    buffDescription: 'Aumenta un 20% Ataque y Defensa, +50 PV Máx y regenera +15 PV por turno en combate.',
    lore: 'Estofado tradicional de chuletón de jabalí estofado a fuego lento con setas de bosque y mantequilla.',
  },
  'ing_carne_ahumada__ing_harina_trigo__ing_hortalizas_huerto': {
    name: 'Ramen Tonkotsu de Icespear',
    icon: '/assets/items/ramen.png',
    rarity: 'SR',
    buffBadge: '+40 PV & +8 REGEN',
    buffDescription: 'Restaura 40 PV de inmediato y concede regeneración continua de +8 PV al inicio de cada turno.',
    lore: 'Fideos artesanos en caldo concentrado caliente con carne ahumada curada y hortalizas frescas del huerto.',
  },
  'ing_ajo_silvestre__ing_mantequilla_salada__ing_pan_rustico': {
    name: 'Pan de Ajo con Mantequilla Fundida',
    icon: '/assets/items/panes_de_ajo.png',
    rarity: 'R',
    buffBadge: '+2 ORBES DEFINITIVOS',
    buffDescription: 'Empieza el próximo combate con 2 orbes de habilidad definitiva (Cataclismo Astral) listos.',
    lore: 'Hogaza tostada al horno bañada en mantequilla salada batida y abundante ajo silvestre picado.',
  },
  'ing_harina_trigo__ing_leche_fresca__ing_sal_glacial': {
    name: 'Pancakes con Crema y Mantequilla',
    icon: '/assets/items/tortitas.png',
    rarity: 'R',
    buffBadge: '+20% ORO & EXPERIENCIA',
    buffDescription: 'Otorga un 20% extra de Oro y EXP al completar el siguiente combate o patrulla.',
    lore: 'Torre de tortitas esponjosas bañadas en crema de leche dulce y una pizca de sal marina.',
  },
  'ing_carne_roja__ing_harina_trigo__ing_queso_cabra': {
    name: 'Lasaña Boloñesa Tradicional al Horno',
    icon: '/assets/items/food_lasana.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & ESCUDO 20 PV',
    buffDescription: 'Aumenta un 20% la defensa y añade una barrera de 20 PV absorbente.',
    lore: 'Capas de pasta fresca de trigo intercaladas con ragú de ternera glacial y queso de cabra gratinado.',
  },
  'ing_leche_fresca__ing_mantequilla_salada__ing_queso_cabra': {
    name: 'Fondue Suiza Tradicional al Horno',
    icon: '/assets/items/food_fondue.png',
    rarity: 'SR',
    buffBadge: '+35% DEF & ESCUDO 35 PV',
    buffDescription: 'Potencia la defensa en un 35% y envuelve a los héroes en un escudo de 35 PV.',
    lore: 'Cazuela burbujeante de queso curado madurado, mantequilla salada y leche fresca de los valles.',
  },
  'ing_arroz_grano__ing_sal_glacial__ing_salmon_helado': {
    name: 'Sushi Nigiri de Salmón Glacial',
    icon: '/assets/items/salmon_dishes/salmon_ing_arroz_grano__ing_sal_glacial__ing_salmon_helado.png',
    rarity: 'SR',
    buffBadge: '+15% VEL & CONGELACIÓN',
    buffDescription: 'Aumenta un 15% la velocidad y añade probabilidad de congelar al objetivo.',
    lore: 'Finos cortes de salmón ártico sobre arroz de montaña templado y cristales de sal marina glacial.',
  },
  'ing_especias_dragon__ing_sal_glacial__ing_salmon_helado': {
    name: 'Ceviche Clásico de Salmón Glacial',
    icon: '/assets/items/salmon_dishes/salmon_ing_especias_dragon__ing_sal_glacial__ing_salmon_helado.png',
    rarity: 'SR',
    buffBadge: '+25% VELOCIDAD & CRÍTICO +15%',
    buffDescription: 'Aumenta un 25% la velocidad de ataque y un 15% la probabilidad de golpe crítico.',
    lore: 'Dados de salmón fresco marinados con sal marina glacial y un toque de especias picantes de dragón.',
  },
  'ing_cangrejo_cueva__ing_especias_dragon__ing_sal_glacial': {
    name: 'Ceviche Picante de Cangrejo de Cueva',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_especias_dragon__ing_sal_glacial.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 30% el ataque y eleva la rapidez de acción en combate.',
    lore: 'Carne desmigada de cangrejo cavernario sazonada con especias de dragón y sal marina ártica.',
  },
  'ing_cangrejo_cueva__ing_mantequilla_salada__ing_queso_cabra': {
    name: 'Cangrejo de Cueva Termidor al Queso Fundido',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_mantequilla_salada__ing_queso_cabra.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ESCUDO 25 PV',
    buffDescription: 'Incrementa el ataque un 30% y añade un escudo de 25 PV absorbente.',
    lore: 'Receta termidor adaptada al bastión: pinzas de cangrejo gratinadas con mantequilla salada y queso madurado.',
  },
  'ing_ajo_silvestre__ing_cangrejo_cueva__ing_especias_dragon': {
    name: 'Cangrejo de Cueva al Ajillo Picante',
    icon: '/assets/items/crab_dishes/crab_ing_ajo_silvestre__ing_cangrejo_cueva__ing_especias_dragon.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & ROBO DE VIDA 15%',
    buffDescription: 'Aumenta un 30% el ataque y regenera salud equivalente al 15% del daño infligido.',
    lore: 'Pinzas de cangrejo de cueva salteadas con abundante ajo silvestre y guindillas molidas de dragón.',
  },
  'ing_cangrejo_cueva__ing_patata_montana__ing_trucha_arroyo': {
    name: 'Marmitako Marinero de Cangrejo y Trucha',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_patata_montana__ing_trucha_arroyo.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Aumenta un 20% el ataque y permite adelantarse en el turno de combate.',
    lore: 'Caldereta tradicional de patatas de montaña cocinadas lentamente con cangrejo de cueva y trucha fresca.',
  },
  'ing_arroz_grano__ing_cangrejo_cueva__ing_huevos_corral': {
    name: 'Arroz Salteado de Cangrejo con Huevo Campero',
    icon: '/assets/items/crab_dishes/crab_ing_arroz_grano__ing_cangrejo_cueva__ing_huevos_corral.png',
    rarity: 'SR',
    buffBadge: '+2 ORBES ULTI & +20% DEF',
    buffDescription: 'Concede 2 orbes de habilidad definitiva y refuerza la defensa de los combatientes.',
    lore: 'Grano de montaña salteado a fuego vivo con carne de cangrejo de cueva y huevos camperos en tiras doradas.',
  },
  'ing_cangrejo_cueva__ing_mantequilla_salada__ing_pan_rustico': {
    name: 'Roll Nórdico de Cangrejo de Cueva en Pan Rústico',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_mantequilla_salada__ing_pan_rustico.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & +30 PV REGEN',
    buffDescription: 'Pan artesano crujiente relleno de cangrejo desmigado y mantequilla salada. Otorga +25% Ataque y cura 30 PV.',
    lore: 'Bocadillo clásico marinero horneado con leña de pino y abundante marisco fresco de las cuevas.',
  },
  'ing_cangrejo_cueva__ing_carne_roja__ing_patata_montana': {
    name: 'Mar y Montaña de Cangrejo de Cueva y Ternera Glacial',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_carne_roja__ing_patata_montana.png',
    rarity: 'SSR',
    buffBadge: '+30% ATK & +25% DEF',
    buffDescription: 'Sartén de hierro fundido con pinzas de cangrejo a la brasa, chuletón y patatas crujientes.',
    lore: 'Plato festivo del bastión combinando lo mejor del mar subterráneo y el ganado de montaña.',
  },
  'ing_carne_devorador__ing_cangrejo_cueva__ing_setas_cueva': {
    name: 'Cazuela Abisal de Cangrejo y Carne de Devorador',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_carne_devorador__ing_setas_cueva.png',
    rarity: 'UR',
    buffBadge: '+40% ATK & PERFORACIÓN 60%',
    buffDescription: 'Guiso oscuro de las profundidades: desata poder destructor aumentando un 40% el daño físico e ignora el 60% de defensa.',
    lore: 'Olla de hierro rúnico con carne abisal del Devorador, pinzas gigantes de cangrejo y hongos bioluminiscentes.',
  },
  'ing_cangrejo_cueva__ing_masa_madre__ing_queso_cabra': {
    name: 'Pizza Artesana de Cangrejo de Cueva y Queso',
    icon: '/assets/items/crab_dishes/crab_ing_cangrejo_cueva__ing_masa_madre__ing_queso_cabra.png',
    rarity: 'SSR',
    buffBadge: '+25% DEF & ESCUDO 30 PV',
    buffDescription: 'Masa madre crujiente horneada con abundante queso de cabra y carne seleccionada de cangrejo.',
    lore: 'Pizza rústica de horno de leña con masa fermentada, base de queso madurado fundido y marisco cavernario.',
  },
  'ing_mantequilla_salada__ing_patata_montana__ing_trucha_arroyo': {
    name: 'Trucha Plateada Meunière con Patatas Doradas',
    icon: '/assets/items/trout_dishes/trout_ing_mantequilla_salada__ing_patata_montana__ing_trucha_arroyo.png',
    rarity: 'SR',
    buffBadge: '+20% VELOCIDAD & +30 PV REGEN',
    buffDescription: 'Lomos de trucha de arroyo a la plancha bañados en mantequilla dorada noisette y patatas de montaña.',
    lore: 'Receta clásica de alta taberna: pescado blanco fresco salteado con mantequilla salada espumosa y patatas tiernas.',
  },
  'ing_pan_rustico__ing_queso_cabra__ing_trucha_arroyo': {
    name: 'Tosta Nórdica de Trucha Ahumada y Queso',
    icon: '/assets/items/trout_dishes/trout_ing_pan_rustico__ing_queso_cabra__ing_trucha_arroyo.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% DEF',
    buffDescription: 'Rebanada tostada con finas láminas de trucha curada, queso madurado y hierbas aromáticas.',
    lore: 'Bocadillo tradicional nórdico servido sobre pan de pueblo horneado a leña con un toque de queso suave.',
  },
  'ing_especias_dragon__ing_sal_glacial__ing_trucha_arroyo': {
    name: 'Tartar Glacial de Trucha Plateada Picante',
    icon: '/assets/items/trout_dishes/trout_ing_especias_dragon__ing_sal_glacial__ing_trucha_arroyo.png',
    rarity: 'SR',
    buffBadge: '+25% CRÍTICO & +20% VEL',
    buffDescription: 'Dados de trucha fresca de deshielo macerados en cristales de sal marina y guindilla de dragón.',
    lore: 'Plato frío refrescante servido en copa de hielo, con intenso contraste entre el pescado gélido y el picante.',
  },
  'ing_ajo_silvestre__ing_hortalizas_huerto__ing_trucha_arroyo': {
    name: 'Caldera de Pescador de Trucha de Arroyo',
    icon: '/assets/items/trout_dishes/trout_ing_ajo_silvestre__ing_hortalizas_huerto__ing_trucha_arroyo.png',
    rarity: 'SR',
    buffBadge: '+35 PV & PURIFICA VENENO',
    buffDescription: 'Guiso marinero de arroyo cocinado lentamente a fuego de campamento con verduras y ajo silvestre.',
    lore: 'Olla reconfortante de los pescadores del río helado con hortalizas frescas y trozos jugosos de trucha.',
  },
  'ing_harina_trigo__ing_huevos_corral__ing_salmon_helado': {
    name: 'Tarta Quiche Nórdica de Salmón y Queso',
    icon: '/assets/items/salmon_dishes/salmon_ing_harina_trigo__ing_huevos_corral__ing_salmon_helado.png',
    rarity: 'SSR',
    buffBadge: '+25% DEF & +30 PV REGEN',
    buffDescription: 'Clásica tarta quiche horneada a leña con salmón del río helado, queso madurado y huevos camperos.',
    lore: 'La afamada quiche nórdica de la taberna con hojaldre crujiente y lascas tiernas de salmón rosado.',
  },
  'ing_leche_fresca__ing_patata_montana__ing_salmon_helado': {
    name: 'Sopa Lohikeitto Finlandesa de Salmón',
    icon: '/assets/items/salmon_dishes/salmon_ing_leche_fresca__ing_patata_montana__ing_salmon_helado.png',
    rarity: 'SR',
    buffBadge: '+35 PV & ESCUDO 25 PV',
    buffDescription: 'Sopa caliente y cremosa de salmón del ártico con patatas de montaña y eneldo.',
    lore: 'Caldo lechoso y mantecoso de pescadores norteños con generosos tacos de salmón jugoso.',
  },
  'ing_pan_rustico__ing_pimienta_negra__ing_salmon_helado': {
    name: 'Tosta de Salmón Gravlax Curado con Eneldo',
    icon: '/assets/items/salmon_dishes/salmon_ing_pan_rustico__ing_pimienta_negra__ing_salmon_helado.png',
    rarity: 'SR',
    buffBadge: '+20% ATK & +20% VELOCIDAD',
    buffDescription: 'Rebanada tostada con finas lonchas de salmón curado con sal glacial, pimienta y mostaza cremosa.',
    lore: 'Especialidad nórdica de salmón marinado lentamente y servido sobre pan de centeno rústico.',
  },
  'ing_ajo_silvestre__ing_patata_montana__ing_pollo_calidad': {
    name: 'Pollo Asado Rústico con Patatas y Ajo',
    icon: '/assets/items/chicken_dishes/chicken_ing_ajo_silvestre__ing_patata_montana__ing_pollo_calidad.png',
    rarity: 'SR',
    buffBadge: '+25% ATK & +30 PV',
    buffDescription: 'Pollo entero asado a la leña en cazuela de barro con patatas crujientes y cabezas de ajo silvestre.',
    lore: 'El festín de domingo predilecto de los granjeros del bastión, dorado con romero y manteca.',
  },
  'ing_harina_trigo__ing_huevos_corral__ing_pollo_calidad': {
    name: 'Empanada Criolla de Pollo y Huevo Campero',
    icon: '/assets/items/chicken_dishes/chicken_ing_harina_trigo__ing_huevos_corral__ing_pollo_calidad.png',
    rarity: 'SR',
    buffBadge: '+20% DEF & ESCUDO 25 PV',
    buffDescription: 'Pastel hojaldrado horneado relleno con pollo desmigado jugoso y trozos de huevo campero.',
    lore: 'Masa dorada al horno rellena generosamente con estofado suave de pollo de corral.',
  },
  'ing_arroz_grano__ing_especias_dragon__ing_pollo_calidad': {
    name: 'Brochetas Yakitori de Pollo Especiado al Fuego',
    icon: '/assets/items/chicken_dishes/chicken_ing_arroz_grano__ing_especias_dragon__ing_pollo_calidad.png',
    rarity: 'SR',
    buffBadge: '+2 ORBES ULTI & +20% ATK',
    buffDescription: 'Brochetas a la brasa glaseadas con salsa picante de dragón servidas sobre cama de arroz.',
    lore: 'Bocados tiernos de pollo y cebolletas asados al carbón que encienden el espíritu combativo.',
  },
  'ing_hortalizas_huerto__ing_setas_cueva__ing_pollo_calidad': {
    name: 'Guiso Campestre de Pollo con Setas de las Minas',
    icon: '/assets/items/chicken_dishes/chicken_ing_hortalizas_huerto__ing_setas_cueva__ing_pollo_calidad.png',
    rarity: 'SR',
    buffBadge: '+35 PV & +15 PV REGEN',
    buffDescription: 'Olla de barro con caldo concentrado de pollo, hortalizas frescas y setas cavernícolas.',
    lore: 'Caldo reconfortante de granjero que restaura la vitalidad tras una larga jornada en la nieve.',
  },
  'ing_hierbas_bosque__ing_masa_madre__ing_queso_cabra': {
    name: 'Pizza Margarita al Horno de Leña',
    icon: '/assets/items/pizza.png',
    rarity: 'SR',
    buffBadge: '+30% DEF & ESCUDO 30 PV',
    buffDescription: 'Reduce un 30% el daño recibido y otorga un escudo protector de 30 PV.',
    lore: 'Auténtica pizza con masa madre fermentada, queso de cabra fundido y finas hierbas del bosque.',
  },
  'ing_harina_trigo__ing_mantequilla_salada__ing_queso_cabra': {
    name: 'Arepas Caseras Rellenas de Queso',
    icon: '/assets/items/arepas.png',
    rarity: 'SR',
    buffBadge: '-20% DAÑO & +25 PV',
    buffDescription: 'Reduce el daño recibido un 20% y restaura 25 PV de vitalidad.',
    lore: 'Tortas doradas asadas al fuego rellenas generosamente con queso madurado fundido al calor de la cocina.',
  },
  'ing_ajo_silvestre__ing_hortalizas_huerto__ing_setas_cueva': {
    name: 'Ratatouille Clásico de la Huerta',
    icon: '/assets/items/food_ratatouille.png',
    rarity: 'R',
    buffBadge: '+40 PV REGEN & PURIFICA',
    buffDescription: 'Cura 40 PV de inmediato y disipa efectos de veneno y quemadura.',
    lore: 'Plato tradicional de finas láminas de hortalizas horneadas con ajo silvestre y setas de las minas.',
  },
  'ing_especias_dragon__ing_harina_trigo__ing_pimienta_negra': {
    name: 'Nachos Crujientes con Especias de Fuego',
    icon: '/assets/items/doritos.png',
    rarity: 'R',
    buffBadge: '+20% CRÍTICO & QUEMADURA',
    buffDescription: 'Eleva la probabilidad de asestar golpes críticos un 20% e inflige quemadura continua.',
    lore: 'Triángulos de harina fritos dorados y sazonados con una mezcla ardiente de pimentón y pimienta negra.',
  },
};

function getDishPreparation(ings: CookingIngredient[]): string {
  const ids = new Set(ings.map((i) => i.id));
  const cats = ings.map((i) => i.category);

  if (ids.has('ing_arroz_grano')) {
    if (cats.includes('pescados')) return 'Paella';
    if (cats.includes('monstruos') || cats.includes('carnes')) return 'Wok';
    return 'Risotto';
  }
  if (ids.has('ing_masa_madre')) return 'Pizza';
  if (
    ids.has('ing_harina_trigo') &&
    (ids.has('ing_huevos_corral') || ids.has('ing_queso_cabra') || ids.has('ing_leche_fresca'))
  ) {
    return 'Quiche';
  }
  if (ids.has('ing_harina_trigo')) return 'Empanada';
  if (ids.has('ing_pan_rustico')) return 'Tosta';
  if (ids.has('ing_huevos_corral') || ids.has('ing_huevos_araknoide')) return 'Tortilla';
  if (ids.has('ing_patata_montana') && cats.includes('carnes')) return 'Asado';
  if (ids.has('ing_patata_montana') && cats.includes('pescados')) return 'Parrillada';
  if (cats.includes('monstruos')) return 'Cazuela';
  if (cats.includes('pescados')) return 'Caldereta';
  if (cats.includes('carnes')) return 'Guiso';
  if (cats.includes('lacteos')) return 'Gratén';
  if (cats.includes('verduras')) return 'Salteado';
  return 'Adobo';
}

function getDishIcon(ings: CookingIngredient[]): string {
  const ids = new Set(ings.map((i) => i.id));
  const cats = ings.map((i) => i.category);

  // Cada combinación individual de Cangrejo de Cueva tiene su propio sprite único e irrepetible
  if (ids.has('ing_cangrejo_cueva')) {
    const sorted = ings.map((i) => i.id).sort().join('__');
    return `/assets/items/crab_dishes/crab_${sorted}.png`;
  }

  // Cada combinación individual de Trucha Plateada tiene su propio sprite único e irrepetible
  if (ids.has('ing_trucha_arroyo')) {
    const sorted = ings.map((i) => i.id).sort().join('__');
    return `/assets/items/trout_dishes/trout_${sorted}.png`;
  }

  // Cada combinación individual de Salmón del Río Helado tiene su propio sprite único e irrepetible
  if (ids.has('ing_salmon_helado')) {
    const sorted = ings.map((i) => i.id).sort().join('__');
    return `/assets/items/salmon_dishes/salmon_${sorted}.png`;
  }

  // Cada combinación individual de Pollo de Corral tiene su propio sprite único e irrepetible
  if (ids.has('ing_pollo_calidad')) {
    const sorted = ings.map((i) => i.id).sort().join('__');
    return `/assets/items/chicken_dishes/chicken_${sorted}.png`;
  }

  if (ids.has('ing_huevos_araknoide')) return '/assets/items/food_tortilla_araknoide.png';
  if (ids.has('ing_larvas_araknoide')) return '/assets/items/food_larvas_crujientes.png';
  if (ids.has('ing_carne_devorador')) return '/assets/items/food_devorador_empanada.png';

  if (ids.has('ing_masa_madre')) return '/assets/items/pizza.png';
  if (ids.has('ing_arroz_grano')) {
    if (cats.includes('pescados')) return '/assets/items/Shushi.png';
    return '/assets/items/ramen.png';
  }
  if (ids.has('ing_harina_trigo') && ids.has('ing_leche_fresca')) return '/assets/items/tortitas.png';
  if (ids.has('ing_pan_rustico') && ids.has('ing_ajo_silvestre')) return '/assets/items/panes_de_ajo.png';
  if (ids.has('ing_queso_cabra') && ids.has('ing_harina_trigo')) return '/assets/items/arepas.png';

  if (ids.has('ing_patata_montana')) {
    if (cats.includes('carnes')) return '/assets/items/food_steak_chips.png';
    if (cats.includes('pescados')) return '/assets/items/food_fish_chips.png';
    if (ids.has('ing_huevos_corral')) return '/assets/items/food_eggs_chips.png';
    return '/assets/items/tortilla_patata.png';
  }

  if (ids.has('ing_salmon_helado') && ids.has('ing_arroz_grano')) {
    return '/assets/items/food_sushi_salmon.png';
  }

  if (cats.includes('pescados')) {
    if (ids.has('ing_especias_dragon') || ids.has('ing_sal_glacial')) return '/assets/items/food_ceviche.png';
    return '/assets/items/food_fish_chips.png';
  }

  if (cats.includes('carnes')) {
    if (ids.has('ing_lomo_jabali')) return '/assets/items/food_bourguignon.png';
    if (ids.has('ing_especias_dragon')) return '/assets/items/kebab.png';
    if (ids.has('ing_pan_rustico') || ids.has('ing_harina_trigo')) return '/assets/items/hamburguesa.png';
    return '/assets/items/food_bourguignon.png';
  }

  if (cats.includes('lacteos')) {
    if (ids.has('ing_queso_cabra') && ids.has('ing_leche_fresca')) return '/assets/items/food_fondue.png';
    if (ids.has('ing_huevos_corral')) return '/assets/items/tortilla_patata.png';
    return '/assets/items/quesarito.png';
  }

  if (cats.every((c) => c === 'verduras')) return '/assets/items/food_ratatouille.png';
  if (cats.includes('especias')) return '/assets/items/doritos.png';

  return '/assets/items/castillo_sopa.png';
}

function calculateBuff(ings: CookingIngredient[]): {
  buffBadge: string;
  buffDescription: string;
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
} {
  const ids = new Set(ings.map((i) => i.id));
  const rarities = ings.map((i) => i.rarity);
  const ssrCount = rarities.filter((r) => r === 'SSR').length;
  const srCount = rarities.filter((r) => r === 'SR').length;

  let rarity: 'R' | 'SR' | 'SSR' | 'UR' = 'R';
  if (ssrCount >= 2 || (ssrCount >= 1 && srCount >= 2)) {
    rarity = 'UR';
  } else if (ssrCount >= 1 || srCount >= 2) {
    rarity = 'SSR';
  } else if (srCount >= 1) {
    rarity = 'SR';
  }

  if (ids.has('ing_carne_devorador')) {
    return {
      rarity,
      buffBadge: '+35% ATK & PERFORACIÓN 50%',
      buffDescription: 'Carne abisal: aumenta un 35% el poder de ataque e ignora el 50% de la armadura enemiga.',
    };
  }
  if (ids.has('ing_huevos_araknoide')) {
    return {
      rarity,
      buffBadge: 'EVASIÓN 100% & +35% CELERIDAD',
      buffDescription: 'Esquiva con certeza total el próximo golpe y aumenta un 35% la agilidad de combate.',
    };
  }
  if (ids.has('ing_cangrejo_cueva')) {
    return {
      rarity,
      buffBadge: '+25% DEF & ESCUDO 25 PV',
      buffDescription: 'Coraza cavernaria: incrementa un 25% la armadura de combate y otorga un escudo de 25 PV.',
    };
  }
  if (ids.has('ing_larvas_araknoide')) {
    return {
      rarity,
      buffBadge: '+50 PV & +25% CRÍTICO',
      buffDescription: 'Proteína bioluminiscente: restaura 50 PV de vitalidad y aumenta un 25% la tasa crítica.',
    };
  }
  if (ids.has('ing_salmon_helado')) {
    return {
      rarity,
      buffBadge: 'INMUNIDAD HELADA & +20% VEL',
      buffDescription: 'Vitalidad ártica: inmunidad contra efectos de congelación y +20% a la velocidad de turno.',
    };
  }
  if (ids.has('ing_trucha_arroyo')) {
    return {
      rarity,
      buffBadge: '+20% VELOCIDAD & +20 PV',
      buffDescription: 'Agilidad de torrente: aumenta un 20% la presteza en combate y restaura 20 PV de vida.',
    };
  }
  if (ids.has('ing_lomo_jabali')) {
    return {
      rarity,
      buffBadge: '+30% ATK & +20% CRÍTICO',
      buffDescription: 'Fuerza salvaje de montaña: incrementa un 30% el ataque y eleva un 20% los impactos críticos.',
    };
  }
  if (ids.has('ing_especias_dragon')) {
    return {
      rarity,
      buffBadge: '+30% DAÑO FUEGO & QUEMADURA',
      buffDescription: 'Fuego ardiente: imbuye ataques con +30% de daño ígneo y quema a los adversarios.',
    };
  }
  if (ids.has('ing_arroz_grano')) {
    return {
      rarity,
      buffBadge: '+2 ORBES ULTI & +15% ATK',
      buffDescription: 'Concentración marcial: inicia la batalla con 2 orbes de habilidad definitiva y +15% de ataque.',
    };
  }
  if (ids.has('ing_queso_cabra')) {
    return {
      rarity,
      buffBadge: '+20% DEF & +25 PV REGEN',
      buffDescription: 'Riqueza alpina: aumenta la defensa en un 20% y regenera 25 PV continuos.',
    };
  }
  if (ids.has('ing_ajo_silvestre')) {
    return {
      rarity,
      buffBadge: 'PURIFICA DEBUFFS & +30 PV',
      buffDescription: 'Propiedades curativas: disipa alteraciones de estado dañinas y restaura 30 PV de inmediato.',
    };
  }

  return {
    rarity,
    buffBadge: '+15% ATK & DEF',
    buffDescription: 'Receta equilibrada de la taberna: otorga +15% de ataque y defensa en combate.',
  };
}

// Ingredientes de despensa: no dan nombre al plato por sí solos (harina, sal, arroz...)
const PANTRY_INGREDIENT_IDS = new Set([
  'ing_harina_trigo',
  'ing_sal_glacial',
  'ing_arroz_grano',
  'ing_masa_madre',
  'ing_pan_rustico',
  'ing_mantequilla_salada',
  'ing_leche_fresca',
]);

interface DishIngredientName {
  label: string;
  feminine: boolean;
  plural: boolean;
}

// Nombre corto (una palabra) de cada ingrediente para que el plato quepa en 4 palabras
const SHORT_INGREDIENT_NAMES: Record<string, DishIngredientName> = {
  ing_pollo_calidad: { label: 'Pollo', feminine: false, plural: false },
  ing_carne_roja: { label: 'Ternera', feminine: true, plural: false },
  ing_carne_ahumada: { label: 'Costilla', feminine: true, plural: false },
  ing_lomo_jabali: { label: 'Jabalí', feminine: false, plural: false },
  ing_ajo_silvestre: { label: 'Ajo', feminine: false, plural: false },
  ing_patata_montana: { label: 'Patata', feminine: true, plural: false },
  ing_hortalizas_huerto: { label: 'Huerta', feminine: true, plural: false },
  ing_setas_cueva: { label: 'Setas', feminine: true, plural: true },
  ing_harina_trigo: { label: 'Harina', feminine: true, plural: false },
  ing_pan_rustico: { label: 'Pan', feminine: false, plural: false },
  ing_arroz_grano: { label: 'Arroz', feminine: false, plural: false },
  ing_masa_madre: { label: 'Masa', feminine: true, plural: false },
  ing_queso_cabra: { label: 'Queso', feminine: false, plural: false },
  ing_leche_fresca: { label: 'Leche', feminine: true, plural: false },
  ing_mantequilla_salada: { label: 'Mantequilla', feminine: true, plural: false },
  ing_huevos_corral: { label: 'Huevo', feminine: false, plural: false },
  ing_especias_dragon: { label: 'Dragón', feminine: false, plural: false },
  ing_sal_glacial: { label: 'Sal', feminine: true, plural: false },
  ing_hierbas_bosque: { label: 'Hierbas', feminine: true, plural: true },
  ing_pimienta_negra: { label: 'Pimienta', feminine: true, plural: false },
  ing_salmon_helado: { label: 'Salmón', feminine: false, plural: false },
  ing_trucha_arroyo: { label: 'Trucha', feminine: true, plural: false },
  ing_cangrejo_cueva: { label: 'Cangrejo', feminine: false, plural: false },
  ing_carne_devorador: { label: 'Devorador', feminine: false, plural: false },
  ing_larvas_araknoide: { label: 'Larvas', feminine: true, plural: true },
  ing_huevos_araknoide: { label: 'Arácnido', feminine: false, plural: false },
};

// Adjetivos de la casa (con género) para distinguir recetas del mismo plato base
const DISH_ADJECTIVES: { m: string; f: string }[] = [
  { m: 'Rústico', f: 'Rústica' },
  { m: 'Picante', f: 'Picante' },
  { m: 'Crujiente', f: 'Crujiente' },
  { m: 'Dorado', f: 'Dorada' },
  { m: 'Ahumado', f: 'Ahumada' },
  { m: 'Cremoso', f: 'Cremosa' },
  { m: 'Especiado', f: 'Especiada' },
  { m: 'Tradicional', f: 'Tradicional' },
  { m: 'Salvaje', f: 'Salvaje' },
  { m: 'Glacial', f: 'Glacial' },
  { m: 'Suave', f: 'Suave' },
  { m: 'Fuerte', f: 'Fuerte' },
  { m: 'Fresco', f: 'Fresca' },
  { m: 'Secreto', f: 'Secreta' },
  { m: 'Ancestral', f: 'Ancestral' },
  { m: 'Montaraz', f: 'Montaraz' },
  { m: 'Marino', f: 'Marina' },
  { m: 'Campestre', f: 'Campestre' },
  { m: 'Tostado', f: 'Tostada' },
  { m: 'Curado', f: 'Curada' },
  { m: 'Intenso', f: 'Intensa' },
  { m: 'Ligero', f: 'Ligera' },
  { m: 'Profundo', f: 'Profunda' },
  { m: 'Delicado', f: 'Delicada' },
  { m: 'Generoso', f: 'Generosa' },
  { m: 'Sedoso', f: 'Sedosa' },
  { m: 'Fragante', f: 'Fragante' },
  { m: 'Templado', f: 'Templada' },
  { m: 'Casero', f: 'Casera' },
  { m: 'Familiar', f: 'Familiar' },
  { m: 'Artesano', f: 'Artesana' },
  { m: 'Bravío', f: 'Bravía' },
  { m: 'Montuno', f: 'Montuna' },
  { m: 'Alpino', f: 'Alpina' },
  { m: 'Nórdico', f: 'Nórdica' },
  { m: 'Sureño', f: 'Sureña' },
  { m: 'Espléndido', f: 'Espléndida' },
  { m: 'Rotundo', f: 'Rotunda' },
  { m: 'Sencillo', f: 'Sencilla' },
  { m: 'Esmerado', f: 'Esmerada' },
  { m: 'Popular', f: 'Popular' },
  { m: 'Elegante', f: 'Elegante' },
  { m: 'Brillante', f: 'Brillante' },
  { m: 'Ardiente', f: 'Ardiente' },
  { m: 'Humoso', f: 'Humosa' },
  { m: 'Oloroso', f: 'Olorosa' },
  { m: 'Dulce', f: 'Dulce' },
  { m: 'Fino', f: 'Fina' },
  { m: 'Señorial', f: 'Señorial' },
  { m: 'Cortesano', f: 'Cortesana' },
  { m: 'Tabernero', f: 'Tabernera' },
  { m: 'Cazador', f: 'Cazadora' },
  { m: 'Minero', f: 'Minera' },
  { m: 'Peregrino', f: 'Peregrina' },
  { m: 'Errante', f: 'Errante' },
  { m: 'Viajero', f: 'Viajera' },
  { m: 'Nómada', f: 'Nómada' },
  { m: 'Fronterizo', f: 'Fronteriza' },
  { m: 'Invernal', f: 'Invernal' },
  { m: 'Otoñal', f: 'Otoñal' },
  { m: 'Exquisito', f: 'Exquisita' },
  { m: 'Selecto', f: 'Selecta' },
  { m: 'Refinado', f: 'Refinada' },
  { m: 'Famoso', f: 'Famosa' },
  { m: 'Legendario', f: 'Legendaria' },
  { m: 'Heroico', f: 'Heroica' },
  { m: 'Vigoroso', f: 'Vigorosa' },
  { m: 'Robusto', f: 'Robusta' },
  { m: 'Sabroso', f: 'Sabrosa' },
  { m: 'Aromático', f: 'Aromática' },
  { m: 'Jugoso', f: 'Jugosa' },
  { m: 'Tierno', f: 'Tierna' },
];

// El protagonista del nombre debe ser algo comestible de verdad: proteína primero,
// luego verdura o lácteo. Nunca especias ni ingredientes de despensa.
const PROTEIN_CATEGORIES = new Set<IngredientCategory>(['monstruos', 'pescados', 'carnes']);
const SUPPORT_CATEGORIES = new Set<IngredientCategory>(['verduras', 'lacteos']);

interface DishNameCandidate {
  prefix: string;
  feminine: boolean;
  plural: boolean;
}

function getDishNameStars(ings: CookingIngredient[]): DishNameCandidate[] {
  const pick = (categories: Set<IngredientCategory>) => {
    const seen = new Set<string>();
    const stars: DishNameCandidate[] = [];
    for (const ing of ings) {
      if (!categories.has(ing.category) || PANTRY_INGREDIENT_IDS.has(ing.id)) continue;
      const info = SHORT_INGREDIENT_NAMES[ing.id];
      if (!info || seen.has(info.label)) continue;
      seen.add(info.label);
      stars.push({ prefix: info.label, feminine: info.feminine, plural: info.plural });
    }
    return stars;
  };

  const proteins = pick(PROTEIN_CATEGORIES);
  if (proteins.length > 0) return proteins;
  const support = pick(SUPPORT_CATEGORIES);
  if (support.length > 0) return support;
  return [{ prefix: 'Despensa', feminine: true, plural: false }];
}

/** El adjetivo concuerda con el protagonista ("Guiso de Larvas Rústicas"). */
function pluralizeAdjective(word: string): string {
  if (/[aeiouáéíóú]$/.test(word)) return `${word}s`;
  if (word.endsWith('z')) return `${word.slice(0, -1)}ces`;
  return `${word}es`;
}

/**
 * Nombres base posibles: "Asado de Pollo", "Asado con Pollo", "Asado de Ternera"...
 */
function getDishNameCandidates(ings: CookingIngredient[]): DishNameCandidate[] {
  const prep = getDishPreparation(ings);
  const candidates: DishNameCandidate[] = [];
  for (const star of getDishNameStars(ings)) {
    for (const connector of ['de', 'con']) {
      candidates.push({
        prefix: `${prep} ${connector} ${star.prefix}`,
        feminine: star.feminine,
        plural: star.plural,
      });
    }
  }
  return candidates;
}

/**
 * Nombre de plato de 4 palabras: "Asado de Pollo Rústico", "Quiche con Queso Picante".
 * `adjectiveIndex` reparte adjetivos distintos entre recetas del mismo nombre base.
 */
function generateDishName(candidate: DishNameCandidate, adjectiveIndex = 0): string {
  const adjective = DISH_ADJECTIVES[adjectiveIndex % DISH_ADJECTIVES.length];
  let word = candidate.feminine ? adjective.f : adjective.m;
  if (candidate.plural) word = pluralizeAdjective(word);
  return `${candidate.prefix} ${word}`;
}

export function generateAllCookingRecipes(ingredients: CookingIngredient[]): CookingRecipe[] {
  const recipes: CookingRecipe[] = [];
  // Cuántas variantes de adjetivo lleva ya cada plato base (preparación + protagonista)
  const nameStyleCounters = new Map<string, number>();

  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i; j < ingredients.length; j++) {
      for (let k = j; k < ingredients.length; k++) {
        const ing0 = ingredients[i];
        const ing1 = ingredients[j];
        const ing2 = ingredients[k];
        const ings: [CookingIngredient, CookingIngredient, CookingIngredient] = [ing0, ing1, ing2];

        const sortedIds = [ing0.id, ing1.id, ing2.id].sort();
        const canonicalKey = sortedIds.join('__');
        const sig = SIGNATURES[canonicalKey];

        let dishName: string;
        if (sig) {
          dishName = sig.name;
        } else {
          // Elige el nombre base menos usado para repartir los 3.276 platos
          const candidates = getDishNameCandidates(ings);
          let chosen = candidates[0];
          let bestScore = Number.POSITIVE_INFINITY;
          for (const candidate of candidates) {
            const used = nameStyleCounters.get(candidate.prefix) || 0;
            // "de" manda hasta agotar su cupo de adjetivos; "con" es la válvula de escape
            const full = used >= DISH_ADJECTIVES.length;
            const score = (full ? 10000 : used) + (candidate.prefix.includes(' con ') ? 500 : 0);
            if (score < bestScore) {
              bestScore = score;
              chosen = candidate;
            }
          }
          // El contador real del nombre elegido, no la puntuación
          const chosenCount = nameStyleCounters.get(chosen.prefix) || 0;
          nameStyleCounters.set(chosen.prefix, chosenCount + 1);
          dishName = generateDishName(chosen, chosenCount);
        }
        const icon = sig ? sig.icon : getDishIcon(ings);
        const buff = sig
          ? { buffBadge: sig.buffBadge, buffDescription: sig.buffDescription, rarity: sig.rarity }
          : calculateBuff(ings);
        const lore = sig
          ? sig.lore
          : `Plato único cocinado al fuego del bastión con ${INGREDIENT_NAMES[ing0.id] || ing0.name}, ${
              INGREDIENT_NAMES[ing1.id] || ing1.name
            } y ${INGREDIENT_NAMES[ing2.id] || ing2.name}. Receta exclusiva de Icespear.`;

        recipes.push({
          id: `rec_${canonicalKey}`,
          name: dishName,
          icon,
          rarity: buff.rarity,
          buffBadge: buff.buffBadge,
          buffDescription: buff.buffDescription,
          lore,
          requiredCategories: [ing0.category, ing1.category, ing2.category],
          specificIngredientIds: [sortedIds[0], sortedIds[1], sortedIds[2]],
          shelfItemId: `food_${canonicalKey}`,
        });
      }
    }
  }

  return recipes;
}
