export type CombatConsumableBuffType =
  | 'atk_boost'
  | 'def_shield'
  | 'hp_regen'
  | 'ultimate_gauge'
  | 'crit_boost'
  | 'pierce'
  | 'evasion'
  | 'lifesteal'
  | 'haste'
  | 'fortune'
  | 'instant_heal';

export interface CombatConsumableDefinition {
  id: string;
  name: string;
  foodEffectTitle: string;
  foodEffectBadge: string;
  foodBuffType: CombatConsumableBuffType;
  detailedEffect: string;
  atkMultiplier?: number;
  defMultiplier?: number;
  shieldHp?: number;
  immediateHeal?: number;
  regenPerTurn?: number;
  ultGaugeBonus?: number;
  critRateBonus?: number;
  critDamageBonus?: number;
  pierceDefense?: boolean;
  evadeNextHit?: boolean;
  purifyDebuffs?: boolean;
  lifestealRate?: number;
  goldXpMultiplier?: number;
}

export interface ActiveCombatFoodBuff {
  id: string;
  name: string;
  icon: string;
  foodEffectTitle: string;
  foodEffectBadge: string;
  foodBuffType: CombatConsumableBuffType;
  detailedEffect: string;
  atkMultiplier?: number;
  defMultiplier?: number;
  shieldHp?: number;
  regenPerTurn?: number;
  critRateBonus?: number;
  critDamageBonus?: number;
  pierceDefense?: boolean;
  evadeNextHit?: boolean;
  lifestealRate?: number;
  goldXpMultiplier?: number;
}

/**
 * Authentic combat food matching and buff lookup
 */
export function getCombatConsumableDefinition(
  itemId: string,
  itemName: string
): CombatConsumableDefinition {
  const norm = `${itemId} ${itemName}`.toLowerCase();

  // Steak & Chips (7DS - Evasión & +25% ATK)
  if (norm.includes('steak') && (norm.includes('chips') || norm.includes('patata'))) {
    return {
      id: 'food_steak_chips',
      name: 'Steak & Chips de la Taberna',
      foodEffectTitle: '🥩 Solomillo Legendario (Evasión 1 Golpe & +25% ATK)',
      foodEffectBadge: 'Evasión Total & +25% ATK',
      foodBuffType: 'evasion',
      evadeNextHit: true,
      atkMultiplier: 1.25,
      detailedEffect:
        'Banquete de 7DS Grand Cross: Esquiva con certeza total el siguiente golpe enemigo y aumenta un 25% el daño físico de tus guerreros.',
    };
  }

  // Fish & Chips (7DS - Evasión & Velocidad)
  if (norm.includes('fish') && norm.includes('chips')) {
    return {
      id: 'food_fish_chips',
      name: 'Fish & Chips Tradicional',
      foodEffectTitle: '🐟 Pescado Dorado (Evasión & +20% Velocidad)',
      foodEffectBadge: 'Evasión & +20% VEL',
      foodBuffType: 'evasion',
      evadeNextHit: true,
      purifyDebuffs: true,
      atkMultiplier: 1.15,
      detailedEffect:
        'Banquete de 7DS Grand Cross: Esquiva el próximo ataque, purifica todas las alteraciones de estado y aumenta un 20% la velocidad.',
    };
  }

  // Eggs & Chips (7DS - Evasión 1 Golpe)
  if (norm.includes('eggs') && norm.includes('chips')) {
    return {
      id: 'food_eggs_chips',
      name: 'Eggs & Chips Campestre',
      foodEffectTitle: '🍳 Huevos con Patatas (Evasión 1 Golpe)',
      foodEffectBadge: 'Evasión 100%',
      foodBuffType: 'evasion',
      evadeNextHit: true,
      purifyDebuffs: true,
      detailedEffect:
        'Banquete de 7DS Grand Cross: Esquiva con certeza total el siguiente golpe enemigo y purifica alteraciones.',
    };
  }

  // Boeuf Bourguignon (+20% Stats & +50 PV)
  if (norm.includes('bourguignon') || norm.includes('estofado_magordito')) {
    return {
      id: 'food_bourguignon',
      name: 'Boeuf Bourguignon de la Taberna',
      foodEffectTitle: '🍲 Banquete Bourguignon (+20% Stats & +50 PV)',
      foodEffectBadge: '+20% All Stats & +50 PV',
      foodBuffType: 'hp_regen',
      immediateHeal: 50,
      regenPerTurn: 15,
      atkMultiplier: 1.2,
      defMultiplier: 0.8,
      detailedEffect:
        'Clásico de la alta gastronomía: Aumenta un 20% Ataque y Defensa, otorga +50 PV inmediatos y regenera +15 PV por turno.',
    };
  }

  // Ratatouille Clásico (+40 PV Regen & Purifica)
  if (norm.includes('ratatouille')) {
    return {
      id: 'food_ratatouille',
      name: 'Ratatouille Clásico de la Huerta',
      foodEffectTitle: '🥘 Frescor Provenzal (+40 PV & Purificación)',
      foodEffectBadge: '+40 PV & Purifica',
      foodBuffType: 'hp_regen',
      immediateHeal: 40,
      regenPerTurn: 10,
      purifyDebuffs: true,
      detailedEffect:
        'Guiso tradicional provenzal: Restaura 40 PV de vitalidad, purifica todas las alteraciones y otorga regeneración constante.',
    };
  }

  // Lasaña Boloñesa (+20% DEF & Escudo 20 PV)
  if (norm.includes('lasa') || norm.includes('lasana') || norm.includes('lasaña')) {
    return {
      id: 'food_lasana',
      name: 'Lasaña Boloñesa Tradicional',
      foodEffectTitle: '🧀 Capas Blindadas (+20% DEF & Escudo 20 PV)',
      foodEffectBadge: '+20% DEF & Escudo 20',
      foodBuffType: 'def_shield',
      defMultiplier: 0.8,
      shieldHp: 20,
      immediateHeal: 25,
      detailedEffect:
        'Banquete de la taberna: Capas de pasta y queso gratinado que reducen un 20% el daño recibido y crean un escudo de 20 PV.',
    };
  }

  // Ceviche Clásico Peruano (+25% Velocidad & Evasión 1 Golpe)
  if (norm.includes('ceviche')) {
    return {
      id: 'food_ceviche',
      name: 'Ceviche Clásico Peruano',
      foodEffectTitle: '🐟 Agilidad Marina (Evasión 1 Golpe & Celeridad)',
      foodEffectBadge: 'Evasión Total & Celeridad',
      foodBuffType: 'evasion',
      evadeNextHit: true,
      purifyDebuffs: true,
      atkMultiplier: 1.15,
      detailedEffect:
        'Pescado fresco marinado en cítricos: Otorga reflejos para esquivar con certeza el próximo golpe enemigo y purifica efectos alterados.',
    };
  }

  // Fondue Suiza (+30% DEF & +40 Escudo)
  if (norm.includes('fondue')) {
    return {
      id: 'food_fondue',
      name: 'Fondue Suiza Tradicional',
      foodEffectTitle: '🫕 Coraza Alpina (+30% DEF & Escudo 40 PV)',
      foodEffectBadge: '+30% DEF & Escudo 40',
      foodBuffType: 'def_shield',
      defMultiplier: 0.7,
      shieldHp: 40,
      immediateHeal: 30,
      detailedEffect:
        'Queso alpino fundido al fuego: Refuerza la armadura reduciendo el daño recibido en un 30% y confiere un escudo de 40 PV.',
    };
  }

  // Tortilla de Araknoide (Evasión 100% & Celeridad)
  if (norm.includes('araknoide') && (norm.includes('tortilla') || norm.includes('huevo'))) {
    return {
      id: 'food_tortilla_araknoide',
      name: 'Tortilla de Araknoide',
      foodEffectTitle: '🥚 Reflejo Arácnido (Evasión 100% & +35% Celeridad)',
      foodEffectBadge: 'Evasión Total & +35% VEL',
      foodBuffType: 'evasion',
      evadeNextHit: true,
      purifyDebuffs: true,
      atkMultiplier: 1.2,
      detailedEffect:
        'Banquete Exótico: Esquiva al 100% el próximo golpe enemigo, purifica todas las alteraciones y otorga celeridad y reflejos arácnidos (+20% ATK).',
    };
  }

  // Carne de Devorador Empanada (+35% ATK & Perforación 50%)
  if (norm.includes('devorador')) {
    return {
      id: 'food_devorador_empanada',
      name: 'Carne de Devorador Empanada',
      foodEffectTitle: '🍖 Furia del Coloso (+35% ATK & Perforación 50%)',
      foodEffectBadge: 'ATK +35% & Perforación 50%',
      foodBuffType: 'atk_boost',
      atkMultiplier: 1.35,
      pierceDefense: true,
      detailedEffect:
        'Banquete Exótico: Desata la fuerza bruta del Devorador Quitinoso. Aumenta un 35% todo el daño infligido e ignora el 50% de la armadura enemiga.',
    };
  }

  // Salteado de Larvas Crujientes (+50 PV & +25% Crítico)
  if (norm.includes('larva') || norm.includes('larvas')) {
    return {
      id: 'food_larvas_crujientes',
      name: 'Salteado de Larvas Crujientes',
      foodEffectTitle: '🥢 Vitalidad Cavernícola (+50 PV & +25% CRIT)',
      foodEffectBadge: '+50 PV & CRIT +25%',
      foodBuffType: 'crit_boost',
      immediateHeal: 50,
      critRateBonus: 0.25,
      critDamageBonus: 0.4,
      detailedEffect:
        'Banquete Exótico: Restaura 50 PV de vitalidad al instante y aumenta un 25% la tasa crítica y un 40% el daño de impactos críticos.',
    };
  }

  // Hamburguesa (+25% ATK)
  if (norm.includes('hamburguesa') || norm.includes('burger')) {
    return {
      id: 'food_hamburguesa',
      name: 'Hamburguesa Artesanal',
      foodEffectTitle: '🍔 Festín de Fuerza (+25% ATK)',
      foodEffectBadge: 'ATK +25%',
      foodBuffType: 'atk_boost',
      atkMultiplier: 1.25,
      detailedEffect:
        'Banquete de Combate: Aumenta un 25% todo el daño físico y mágico de Magordito durante todo el combate.',
    };
  }

  // Pizza (+30% DEF & Escudo)
  if (norm.includes('pizza')) {
    return {
      id: 'food_pizza',
      name: 'Pizza Fundida',
      foodEffectTitle: '🍕 Manto de Queso (+30% DEF & Escudo 30 PV)',
      foodEffectBadge: 'DEF +30% & Escudo 30',
      foodBuffType: 'def_shield',
      defMultiplier: 0.7,
      shieldHp: 30,
      detailedEffect:
        'Banquete de Combate: Reduce un 30% el daño recibido y otorga un escudo protector mágico de 30 PV que absorbe golpes.',
    };
  }

  // Ramen (Sanación inmediata & Regen por Turno)
  if (norm.includes('ramen')) {
    return {
      id: 'food_ramen',
      name: 'Ramen Humeante de Icespear',
      foodEffectTitle: '🍜 Vitalidad Glacial (+40 PV & +8 Regen/Turno)',
      foodEffectBadge: '+40 PV & Regen +8',
      foodBuffType: 'hp_regen',
      immediateHeal: 40,
      regenPerTurn: 8,
      detailedEffect:
        'Banquete de Combate: Restaura 40 PV de inmediato y concede regeneración continua de +8 PV al inicio de cada turno.',
    };
  }

  // Panes de Ajo (+2 Orbes Definitivos / Ulti Gauge)
  if (norm.includes('pan') || norm.includes('ajo')) {
    return {
      id: 'food_pan_ajo',
      name: 'Panes de Ajo Dorados',
      foodEffectTitle: '🥖 Carga de Banquete (+2 Orbes Definitivos)',
      foodEffectBadge: '+2 Cargas Ulti ⚡',
      foodBuffType: 'ultimate_gauge',
      ultGaugeBonus: 2,
      detailedEffect:
        'Banquete de Combate: Otorga al instante +2 orbes al medidor de Movimiento Definitivo (Cataclismo Astral).',
    };
  }

  // Quesarito (+35% Crit Rate & +50% Crit Damage)
  if (norm.includes('quesarito')) {
    return {
      id: 'food_quesarito',
      name: 'Quesarito Picante',
      foodEffectTitle: '🌯 Impacto Picante (+35% CRIT & +50% Daño Crítico)',
      foodEffectBadge: 'CRIT +35% & Daño +50%',
      foodBuffType: 'crit_boost',
      critRateBonus: 0.35,
      critDamageBonus: 0.5,
      detailedEffect:
        'Banquete de Combate: Aumenta la Tasa Crítica un +35% y amplifica el daño de impactos críticos en +50%.',
    };
  }

  // Kebab (Perforación de defensa & Break)
  if (norm.includes('kebab')) {
    return {
      id: 'food_kebab',
      name: 'Kebab de Icespear',
      foodEffectTitle: '🥙 Filo Especiado (50% Perforación & Ruptura)',
      foodEffectBadge: 'Perforación 50% & Break',
      foodBuffType: 'pierce',
      pierceDefense: true,
      detailedEffect:
        'Banquete de Combate: Los ataques ignoran el 50% de la defensa enemiga e infligen Ruptura de Armadura (-35% DEF) al rival.',
    };
  }

  // Tortilla (100% Evasión del siguiente golpe & Purificación)
  if (norm.includes('tortilla')) {
    return {
      id: 'food_tortilla',
      name: 'Tortilla de Patatas',
      foodEffectTitle: '🍳 Reflejo Maestro (Evasión 100% & Purificación)',
      foodEffectBadge: 'Evasión Total & Purifica',
      foodBuffType: 'evasion',
      evadeNextHit: true,
      purifyDebuffs: true,
      detailedEffect:
        'Banquete de Combate: Esquiva con certeza total el siguiente ataque enemigo y purifica alteraciones (parálisis, veneno, aturdimiento).',
    };
  }

  // Arepas (Robo de Vida / Lifesteal)
  if (norm.includes('arepa')) {
    return {
      id: 'food_arepas',
      name: 'Arepas con Queso',
      foodEffectTitle: '🫓 Sazón Vampírica (+30% Robo de Vida)',
      foodEffectBadge: 'Vampirismo +30%',
      foodBuffType: 'lifesteal',
      lifestealRate: 0.3,
      detailedEffect:
        'Banquete de Combate: Drena la esencia vital enemiga, curando a Magordito un 30% del daño total que cause.',
    };
  }

  // McBites (Celeridad y Daño)
  if (norm.includes('mcbites') || norm.includes('pollo')) {
    return {
      id: 'food_mcbites',
      name: 'McBites Crujientes',
      foodEffectTitle: '🍗 Furia y Celeridad (+20% ATK & Prontitud)',
      foodEffectBadge: 'ATK +20% & Celeridad',
      foodBuffType: 'haste',
      atkMultiplier: 1.2,
      detailedEffect:
        'Banquete de Combate: Aumenta la velocidad y otorga +20% de daño adicional en combate.',
    };
  }

  // Tortitas (+50% Oro & Experiencia)
  if (norm.includes('tortita') || norm.includes('pancake')) {
    return {
      id: 'food_tortitas',
      name: 'Tortitas con Miel',
      foodEffectTitle: '🥞 Festín de la Victoria (+50% Oro & EXP)',
      foodEffectBadge: '+50% Oro & EXP',
      foodBuffType: 'fortune',
      goldXpMultiplier: 1.5,
      detailedEffect:
        'Banquete de Combate: Multiplica por 1.5x las recompensas de oro y experiencia obtenidas al ganar esta batalla.',
    };
  }

  // Sushi (Anti-Ceguera & Poder Ofensivo)
  if (norm.includes('shushi') || norm.includes('sushi')) {
    return {
      id: 'food_sushi',
      name: 'Bocado de Sushi Glacial',
      foodEffectTitle: '🍣 Concentración Astral (+20% ATK & Anti-Ceguera)',
      foodEffectBadge: 'Anti-Ceguera & +20% ATK',
      foodBuffType: 'atk_boost',
      atkMultiplier: 1.2,
      purifyDebuffs: true,
      detailedEffect:
        'Banquete de Combate: Purifica la ceguera y aumenta un 20% todo el poder ofensivo arcano.',
    };
  }

  // Doritos / Queso
  if (norm.includes('dorito') || norm.includes('queso')) {
    return {
      id: 'food_doritos',
      name: 'Triángulos Crujientes',
      foodEffectTitle: '🧀 Crujiente Festivo (+20% CRIT Rate & +30% Daño)',
      foodEffectBadge: 'CRIT +20% & Daño +30%',
      foodBuffType: 'crit_boost',
      critRateBonus: 0.2,
      critDamageBonus: 0.3,
      detailedEffect:
        'Banquete de Combate: Aumenta un 20% la probabilidad crítica y un 30% el daño crítico.',
    };
  }

  // Poción de Sangre / Furia
  if (norm.includes('sangre') || norm.includes('furia')) {
    return {
      id: 'potion_fury',
      name: 'Poción de Sangre Escarlata',
      foodEffectTitle: '🩸 Furia Escarlata (+20 PV & +30% ATK)',
      foodEffectBadge: '+20 PV & ATK +30%',
      foodBuffType: 'atk_boost',
      immediateHeal: 20,
      atkMultiplier: 1.3,
      detailedEffect:
        'Alquimia de Combate: Restaura 20 PV y desata sed de sangre con +30% de daño infligido.',
    };
  }

  // Poción de Vida
  if (norm.includes('pocion') || norm.includes('poción') || norm.includes('elixir') || norm.includes('potion')) {
    const isMayor = norm.includes('mayor') || norm.includes('large');
    const healAmount = isMayor ? 60 : 40;
    return {
      id: itemId,
      name: itemName || 'Poción de Vida',
      foodEffectTitle: `🧪 Poción Revitalizante (+${healAmount} PV)`,
      foodEffectBadge: `+${healAmount} PV`,
      foodBuffType: 'instant_heal',
      immediateHeal: healAmount,
      detailedEffect: `Alquimia de Combate: Restaura ${healAmount} PV de vitalidad a Magordito de inmediato.`,
    };
  }

  // Fallback / Banquete nutritivo
  return {
    id: itemId,
    name: itemName || 'Plato Nutritivo',
    foodEffectTitle: '🍲 Banquete Reconfortante (+30 PV & +15% ATK)',
    foodEffectBadge: '+30 PV & +15% ATK',
    foodBuffType: 'hp_regen',
    immediateHeal: 30,
    atkMultiplier: 1.15,
    detailedEffect:
      'Banquete de Combate: Restaura 30 PV y aumenta un 15% el daño total durante el combate.',
  };
}
