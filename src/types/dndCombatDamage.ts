/**
 * Dungeons & Dragons 5e Damage Types adapted for Gacha RPG Combat Engine.
 * 
 * Includes all 13 official D&D 5e Damage Types, each engineered with
 * dedicated turn-based Gacha mechanics (DoT, CC, Armor Penetration,
 * Lifesteal, Combo Stacking, Elemental Overload, Cleanse & True Damage).
 */

export type DndDamageType =
  | 'bludgeoning' // Contundente
  | 'piercing'    // Perforante
  | 'slashing'    // Cortante
  | 'fire'        // Fuego
  | 'cold'        // Frío
  | 'lightning'   // Relámpago
  | 'thunder'     // Trueno
  | 'acid'        // Ácido
  | 'poison'      // Veneno
  | 'necrotic'    // Necrótico
  | 'radiant'     // Radiante
  | 'force'       // Fuerza
  | 'psychic';    // Psíquico

export interface DndDamageTypeMeta {
  id: DndDamageType;
  nameEs: string;
  nameEn: string;
  icon: string;
  colorHex: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  gachaMechanicName: string;
  gachaMechanicSummary: string;
  tacticalDescription: string;
  floatingBadge: string;
  procBannerText: string;
  soundCue: string;
  vectorSvg: string;
}

export const DND_DAMAGE_TYPES_REGISTRY: Record<DndDamageType, DndDamageTypeMeta> = {
  bludgeoning: {
    id: 'bludgeoning',
    nameEs: 'Contundente',
    nameEn: 'Bludgeoning',
    icon: '🔨',
    colorHex: '#d97706',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-600',
    glowColor: '#f59e0b',
    gachaMechanicName: 'Quiebre de Postura y Aturdimiento',
    gachaMechanicSummary: 'Impacto demoledor: Quiebra defensas e inflige Aturdimiento (Stun) al quebrar guardia.',
    tacticalDescription: 'Los ataques contundentes ignoran la resistencia física ligera. Al asestar golpe crítico o contra objetivos con menos del 50% de HP, aturde al objetivo durante 1 turno y sacude el campo de batalla.',
    floatingBadge: '🔨 ¡QUIEBRE DE POSTURA!',
    procBannerText: '¡QUIEBRE CONTUNDENTE: ATURDIMIENTO!',
    soundCue: 'critical',
    vectorSvg: '/assets/vector-fx/damage/dmg-bludgeoning.svg',
  },
  piercing: {
    id: 'piercing',
    nameEs: 'Perforante',
    nameEn: 'Piercing',
    icon: '🗡️',
    colorHex: '#94a3b8',
    textColor: 'text-slate-300',
    bgColor: 'bg-slate-900/80',
    borderColor: 'border-slate-500',
    glowColor: '#cbd5e1',
    gachaMechanicName: 'Penetración Pura + Sangrado Arterial',
    gachaMechanicSummary: 'Ignora el 50% de DEF y aplica Hemorragia (Bleed DoT) que no se mitiga.',
    tacticalDescription: 'Puntas y agujas finas que traspasan corazas. Causa daño perforante ignorando el 50% de la armadura del rival y desata Sangrado acumulable (daño que carcome al inicio del turno rival).',
    floatingBadge: '🗡️ ¡PERFORACIÓN + SANGRADO!',
    procBannerText: '¡PENETRACIÓN DEFENSA: HEMORRAGIA!',
    soundCue: 'laser2',
    vectorSvg: '/assets/vector-fx/damage/dmg-piercing.svg',
  },
  slashing: {
    id: 'slashing',
    nameEs: 'Cortante',
    nameEn: 'Slashing',
    icon: '⚔️',
    colorHex: '#ef4444',
    textColor: 'text-red-400',
    bgColor: 'bg-red-950/80',
    borderColor: 'border-red-600',
    glowColor: '#f87171',
    gachaMechanicName: 'Laceración de Combo (+% Daño Recibido)',
    gachaMechanicSummary: 'Aplica Laceración acumulable: +15% a TODO el daño recibido por cada carga activa.',
    tacticalDescription: 'Filos desgarradores ideales para iniciar cadenas de combo gacha. Cada acumulación de Laceración amplifica un +15% todo el daño subsiguiente de cartas, aliados y definitivos durante 3 turnos.',
    floatingBadge: '⚔️ ¡LACERACIÓN (+DMG)!',
    procBannerText: '¡LACERACIÓN PROFUNDA: VULNERABILIDAD!',
    soundCue: 'attack',
    vectorSvg: '/assets/vector-fx/damage/dmg-slashing.svg',
  },
  fire: {
    id: 'fire',
    nameEs: 'Fuego',
    nameEn: 'Fire',
    icon: '🔥',
    colorHex: '#ea580c',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-950/80',
    borderColor: 'border-orange-500',
    glowColor: '#f97316',
    gachaMechanicName: 'Quemadura Incinerante + Deflagración',
    gachaMechanicSummary: 'Aplica Quemadura (DoT). Si el objetivo ya ardía, detona una Deflagración explosiva instantánea.',
    tacticalDescription: 'Llamas ardientes que infligen daño de fuego por turno. Al golpear a un objetivo ya quemado, detona instantáneamente el 50% del daño restante de quemaduras como estallido explosivo inmediato.',
    floatingBadge: '🔥 ¡DEFLAGRACIÓN ÍGNEA!',
    procBannerText: '¡DEFLAGRACIÓN: ESTALLIDO DE LLAMAS!',
    soundCue: 'critical',
    vectorSvg: '/assets/vector-fx/damage/dmg-fire.svg',
  },
  cold: {
    id: 'cold',
    nameEs: 'Frío',
    nameEn: 'Cold',
    icon: '❄️',
    colorHex: '#38bdf8',
    textColor: 'text-sky-300',
    bgColor: 'bg-sky-950/80',
    borderColor: 'border-sky-500',
    glowColor: '#0ea5e9',
    gachaMechanicName: 'Escarcha -> Congelación Total Glacial',
    gachaMechanicSummary: 'Ralentiza con Escarcha (-20% ATK). A las 3 cargas congela por completo al objetivo.',
    tacticalDescription: 'Hipotermia gélida que ralentiza y entumece al rival. Al alcanzar 3 acumulaciones de Escarcha, el objetivo queda Congelado (Frozen): pierde su turno entero y el siguiente impacto sobre él causa +40% de Daño Crítico.',
    floatingBadge: '❄️ ¡CONGELACIÓN TOTAL!',
    procBannerText: '¡CONGELACIÓN GLACIAL: INCAPACITADO!',
    soundCue: 'laser',
    vectorSvg: '/assets/vector-fx/damage/dmg-cold.svg',
  },
  lightning: {
    id: 'lightning',
    nameEs: 'Relámpago',
    nameEn: 'Lightning',
    icon: '⚡',
    colorHex: '#06b6d4',
    textColor: 'text-cyan-300',
    bgColor: 'bg-cyan-950/80',
    borderColor: 'border-cyan-400',
    glowColor: '#22d3ee',
    gachaMechanicName: 'Sobrecarga Voltaica (+CRIT Rate & Parálisis)',
    gachaMechanicSummary: '+25% Tasa Crítica y +50% Daño Crítico. Al conectar crítico activa Parálisis total.',
    tacticalDescription: 'Arco voltaico de alta frecuencia. Tiene bonificador natural de probabilidad crítica (+25%) y daño crítico (+50%). Conectar un crítico eléctrico induce Parálisis que incapacita y garantiza críticos futuros.',
    floatingBadge: '⚡ ¡SOBRECARGA VOLTAICA!',
    procBannerText: '¡SOBRECARGA ELÉCTRICA: PARÁLISIS!',
    soundCue: 'necrotic',
    vectorSvg: '/assets/vector-fx/damage/dmg-lightning.svg',
  },
  thunder: {
    id: 'thunder',
    nameEs: 'Trueno',
    nameEn: 'Thunder',
    icon: '🔊',
    colorHex: '#818cf8',
    textColor: 'text-indigo-300',
    bgColor: 'bg-indigo-950/80',
    borderColor: 'border-indigo-500',
    glowColor: '#6366f1',
    gachaMechanicName: 'Onda Sónica Desestabilizadora + Drenaje de Definitivo',
    gachaMechanicSummary: 'Drena 1 Orbe de Definitivo rival y aturde el tímpano induciendo 40% de fallo (Miss).',
    tacticalDescription: 'Onda de choque acústica que hace vibrar la energía vital. Disipa y drena 1 Orbe de la barra de movimiento definitivo rival y causa Desorientación sónica (hace que los ataques enemigos fallen).',
    floatingBadge: '🔊 ¡DRENAJE DE DEFINITIVO!',
    procBannerText: '¡ONDA SÓNICA: ORBE DRENADO!',
    soundCue: 'powerup',
    vectorSvg: '/assets/vector-fx/damage/dmg-thunder.svg',
  },
  acid: {
    id: 'acid',
    nameEs: 'Ácido',
    nameEn: 'Acid',
    icon: '🧪',
    colorHex: '#84cc16',
    textColor: 'text-lime-400',
    bgColor: 'bg-lime-950/80',
    borderColor: 'border-lime-500',
    glowColor: '#a3e635',
    gachaMechanicName: 'Corrosión Cáustica Permanente (-DEF & -ATK)',
    gachaMechanicSummary: 'Disuelve equipo: -20% DEF y -15% ATK permanente acumulable en la sala.',
    tacticalDescription: 'Sustancia altamente corrosiva que funde armaduras y armas. Cada impacto de Ácido aplica Corrosión permanente durante todo el combate, reduciendo la defensa (-20% por acumulación, hasta -60%) y el poder ofensivo del enemigo.',
    floatingBadge: '🧪 ¡CORROSIÓN CÁUSTICA!',
    procBannerText: '¡CORROSIÓN: ARMADURA DISUELTA!',
    soundCue: 'pokemon_poison',
    vectorSvg: '/assets/vector-fx/damage/dmg-acid.svg',
  },
  poison: {
    id: 'poison',
    nameEs: 'Veneno',
    nameEn: 'Poison',
    icon: '☣️',
    colorHex: '#10b981',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-950/80',
    borderColor: 'border-emerald-500',
    glowColor: '#34d399',
    gachaMechanicName: 'Neurotoxina Acumulable + Anti-Curación',
    gachaMechanicSummary: 'Daño residual por turno progresivo (hasta x5) y reduce curaciones recibidas un 50%.',
    tacticalDescription: 'Toxina biológica que se propaga por el organismo. Causa daño multiplicativo al inicio de cada turno según las acumulaciones activas e inhabilita a la mitad (-50%) cualquier curación o regeneración que el objetivo intente realizar.',
    floatingBadge: '☣️ ¡NEUROTOXINA TÓXICA!',
    procBannerText: '¡NEUROTOXINA: ANTI-CURACIÓN!',
    soundCue: 'pokemon_poison',
    vectorSvg: '/assets/vector-fx/damage/dmg-poison.svg',
  },
  necrotic: {
    id: 'necrotic',
    nameEs: 'Necrótico',
    nameEn: 'Necrotic',
    icon: '💀',
    colorHex: '#a855f7',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-950/80',
    borderColor: 'border-purple-600',
    glowColor: '#c084fc',
    gachaMechanicName: 'Drenaje Vampírico de Ánima + Marchitamiento',
    gachaMechanicSummary: 'Roba vida: El atacante restaura el 35% del daño infligido y marchita al rival.',
    tacticalDescription: 'Energía entrópica del vacío que devora la fuerza vital. El 35% del daño infligido se transfiere instantáneamente como salud curada al portador y marchita la vitalidad del oponente.',
    floatingBadge: '💀 ¡ROBO DE VIDA VAMPÍRICO!',
    procBannerText: '¡DRENAJE DE ÁNIMA: SALUD RESTAURADA!',
    soundCue: 'dark_god',
    vectorSvg: '/assets/vector-fx/damage/dmg-necrotic.svg',
  },
  radiant: {
    id: 'radiant',
    nameEs: 'Radiante',
    nameEn: 'Radiant',
    icon: '✨',
    colorHex: '#fbbf24',
    textColor: 'text-amber-300',
    bgColor: 'bg-amber-950/90',
    borderColor: 'border-yellow-400',
    glowColor: '#fde047',
    gachaMechanicName: 'Juicio Divino (+40% vs Oscuros) + Purificación Heroica',
    gachaMechanicSummary: '+40% Daño a criaturas oscuras, purifica 1 debuff en el héroe y ciega al rival.',
    tacticalDescription: 'Luz sagrada de los planos celestiales. Inflige un +40% de daño bonus masivo contra no-muertos, aberraciones y bestias de la cueva (como Araknoides), disipa automáticamente 1 efecto negativo en Magordito y aplica Ceguera Divina.',
    floatingBadge: '✨ ¡JUICIO SAGRADO & PURIFICACIÓN!',
    procBannerText: '¡LUZ RADIANTE: PURIFICACIÓN Y JUICIO!',
    soundCue: 'powerup',
    vectorSvg: '/assets/vector-fx/damage/dmg-radiant.svg',
  },
  force: {
    id: 'force',
    nameEs: 'Fuerza',
    nameEn: 'Force',
    icon: '🔮',
    colorHex: '#e11d48',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-950/80',
    borderColor: 'border-rose-500',
    glowColor: '#f43f5e',
    gachaMechanicName: 'Energía Arcana Pura (Ignora Escudos +1 Orbe)',
    gachaMechanicSummary: 'Daño absoluto ineludible: Ignora el 100% de escudos y defensas, y recarga +1 Orbe.',
    tacticalDescription: 'Concentración de maná pura y sin diluir. Traspasa el 100% de cualquier escudo, barrera defensiva o resistencia elemental sin perder un ápice de potencia, y sintoniza el maná otorgando de inmediato +1 Orbe de Definitivo adicional.',
    floatingBadge: '🔮 ¡IGNORA ESCUDOS (+1 ORBE)!',
    procBannerText: '¡FUERZA ARCANA: DAÑO INELUDIBLE!',
    soundCue: 'laser1',
    vectorSvg: '/assets/vector-fx/damage/dmg-force.svg',
  },
  psychic: {
    id: 'psychic',
    nameEs: 'Psíquico',
    nameEn: 'Psychic',
    icon: '🧠',
    colorHex: '#f43f5e',
    textColor: 'text-pink-400',
    bgColor: 'bg-pink-950/80',
    borderColor: 'border-pink-500',
    glowColor: '#fb7185',
    gachaMechanicName: 'Colapso Mental + Confusión de Voluntad',
    gachaMechanicSummary: 'Ataque mental directo que ignora armadura e induce Confusión (35% autolesión).',
    tacticalDescription: 'Sobrecarga de ondas cerebrales que resquebraja la mente. No puede ser bloqueado físicamente y desata Confusión Mental en la víctima, obligándola a tener un 35% de probabilidad de atacarse a sí misma en su turno.',
    floatingBadge: '🧠 ¡CONFUSIÓN MENTAL!',
    procBannerText: '¡COLAPSO PSÍQUICO: AUTOLESIÓN!',
    soundCue: 'necrotic',
    vectorSvg: '/assets/vector-fx/damage/dmg-psychic.svg',
  },
};

export const DND_DAMAGE_TYPES_LIST: DndDamageType[] = [
  'bludgeoning',
  'piercing',
  'slashing',
  'fire',
  'cold',
  'lightning',
  'thunder',
  'acid',
  'poison',
  'necrotic',
  'radiant',
  'force',
  'psychic',
];

/**
 * Helper to calculate D&D Damage modifiers, procs and tactical gacha outcomes.
 */
export interface DndDamageResult {
  finalDamage: number;
  isCrit: boolean;
  procs: string[];
  bannerNotice?: string;
  lifestealHealed?: number;
  orbsGainedBonus?: number;
  enemyOrbsDrained?: number;
  cleanseHero?: boolean;
  extraStatusEffects?: {
    type: import('./gachaCombatEffects').GachaEffectType;
    duration: number;
    stacks: number;
    target: 'enemy' | 'hero';
  }[];
  dndType: DndDamageType;
  meta: DndDamageTypeMeta;
}

export function evaluateDndDamageMechanic(
  damageType: DndDamageType,
  baseDamage: number,
  tier: number,
  targetConditions: { type: string; stacks: number }[],
  isTargetDarkCreature: boolean = true
): DndDamageResult {
  const meta = DND_DAMAGE_TYPES_REGISTRY[damageType] || DND_DAMAGE_TYPES_REGISTRY.force;
  let finalDmg = baseDamage;
  let isCrit = tier === 3;
  const procs: string[] = [];
  let lifesteal = 0;
  let orbsBonus = 0;
  let orbsDrained = 0;
  let cleanseHero = false;
  let bannerNotice: string | undefined;
  const extraStatusEffects: {
    type: import('./gachaCombatEffects').GachaEffectType;
    duration: number;
    stacks: number;
    target: 'enemy' | 'hero';
  }[] = [];

  switch (damageType) {
    case 'bludgeoning': {
      // Impacto Contundente: Quiebre de Postura y Aturdimiento
      // Ignora armadura ligera (+15% dmg) y a tier 2+ o en crítico aturde
      finalDmg = Math.round(finalDmg * 1.15);
      procs.push('🔨 Quiebre de Postura');
      const rollStun = isCrit || tier >= 2 || Math.random() < 0.45;
      if (rollStun) {
        procs.push('💫 Aturdimiento Sísmico');
        bannerNotice = meta.procBannerText;
        extraStatusEffects.push({
          type: 'stun',
          duration: tier === 3 ? 2 : 1,
          stacks: 1,
          target: 'enemy',
        });
      }
      extraStatusEffects.push({
        type: 'def_break',
        duration: 2,
        stacks: 1,
        target: 'enemy',
      });
      break;
    }

    case 'piercing': {
      // Perforante: Penetración de armadura pura (+25% daño directo) + Hemorragia arterial (True DoT)
      finalDmg = Math.round(finalDmg * 1.25);
      procs.push('🗡️ Penetración de Armadura (50% Ignorada)');
      procs.push('🩸 Sangrado Arterial');
      bannerNotice = meta.procBannerText;
      extraStatusEffects.push({
        type: 'bleed',
        duration: 3,
        stacks: tier >= 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'slashing': {
      // Cortante: Laceración acumulable (+15% a TODO el daño recibido por cada carga)
      const existingLaceration = targetConditions.find(
        (c) => c.type === 'laceration' || c.type === 'def_break'
      );
      const stacks = existingLaceration ? existingLaceration.stacks : 0;
      finalDmg = Math.round(finalDmg * (1 + stacks * 0.15));
      procs.push(`⚔️ Laceración de Combo x${stacks + 1} (+${(stacks + 1) * 15}% Daño)`);
      bannerNotice = meta.procBannerText;
      extraStatusEffects.push({
        type: 'laceration',
        duration: 3,
        stacks: tier === 3 ? 3 : tier === 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'fire': {
      // Fuego: Quemadura continua. Si el rival ya ardía, detona en Deflagración instantánea (+40% daño)
      const isBurning = targetConditions.some((c) => c.type === 'burn');
      if (isBurning) {
        finalDmg = Math.round(finalDmg * 1.40);
        procs.push('🔥 ¡Deflagración Ígnea Detonada!');
        bannerNotice = '¡DEFLAGRACIÓN DE FUEGO DETONADA (+40%)!';
        extraStatusEffects.push({
          type: 'burn',
          duration: 3,
          stacks: tier >= 2 ? 2 : 1,
          target: 'enemy',
        });
      } else {
        procs.push('🔥 Quemadura Incinerante');
        bannerNotice = meta.procBannerText;
        extraStatusEffects.push({
          type: 'burn',
          duration: 3,
          stacks: tier === 3 ? 3 : tier === 2 ? 2 : 1,
          target: 'enemy',
        });
      }
      break;
    }

    case 'cold': {
      // Frío: Escarcha acumulable (-20% ATK). A 2+ cargas congela al instante
      const existingChill = targetConditions.find(
        (c) => c.type === 'chilled' || c.type === 'chill' || c.type === 'frozen'
      );
      const chills = existingChill ? existingChill.stacks : 0;
      if (chills >= 2 || tier === 3) {
        finalDmg = Math.round(finalDmg * 1.35);
        isCrit = true;
        procs.push('❄️ ¡Congelación Glacial Absoluta!');
        bannerNotice = '¡CONGELACIÓN TOTAL: ENVOLTORIO DE HIELO!';
        extraStatusEffects.push({
          type: 'frozen',
          duration: 1,
          stacks: 1,
          target: 'enemy',
        });
      } else {
        procs.push(`❄️ Escarcha Gélida x${chills + 1}`);
        bannerNotice = meta.procBannerText;
        extraStatusEffects.push({
          type: 'chilled',
          duration: 3,
          stacks: 1,
          target: 'enemy',
        });
      }
      break;
    }

    case 'lightning': {
      // Relámpago: Sobrecarga voltaica con +30% probabilidad crítica y +50% daño crítico
      const rollCrit = Math.random() < 0.45 || tier === 3;
      if (rollCrit) {
        isCrit = true;
        finalDmg = Math.round(finalDmg * 1.50);
        procs.push('⚡ ¡Sobrecarga Voltaica Crítica!');
        bannerNotice = '¡CRÍTICO VOLTAICO: PARÁLISIS!';
        extraStatusEffects.push({
          type: 'paralyze',
          duration: tier === 3 ? 2 : 1,
          stacks: 1,
          target: 'enemy',
        });
      } else {
        procs.push('⚡ Descarga Eléctrica');
        extraStatusEffects.push({
          type: 'def_break',
          duration: 2,
          stacks: 1,
          target: 'enemy',
        });
      }
      break;
    }

    case 'thunder': {
      // Trueno: Conmoción sónica que drena 1-2 orbes de definitivo e induce ceguera
      orbsDrained = tier >= 2 ? 2 : 1;
      procs.push(`🔊 Drenaje de ${orbsDrained} Orbe(s) Definitivo`);
      procs.push('🔊 Desorientación Sónica (Ceguera)');
      bannerNotice = meta.procBannerText;
      extraStatusEffects.push({
        type: 'blind',
        duration: tier === 3 ? 3 : 2,
        stacks: tier >= 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'acid': {
      // Ácido: Corrosión permanente (-20% DEF y -15% ATK acumulable)
      procs.push('🧪 Corrosión Cáustica Permanente');
      bannerNotice = meta.procBannerText;
      extraStatusEffects.push({
        type: 'corrosion',
        duration: 5,
        stacks: tier === 3 ? 3 : tier === 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'poison': {
      // Veneno: Neurotoxina acumulable con inhibición de curación al 50%
      procs.push('☣️ Neurotoxina Letal Acumulable');
      procs.push('☣️ Inhibición de Curación (-50%)');
      bannerNotice = meta.procBannerText;
      extraStatusEffects.push({
        type: 'poison',
        duration: 4,
        stacks: tier === 3 ? 3 : tier === 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'necrotic': {
      // Necrótico: Drenaje vampírico del 35% del daño infligido a salud del atacante
      lifesteal = Math.max(2, Math.round(finalDmg * 0.35));
      procs.push(`💀 Drenaje Vampírico (+${lifesteal} PV)`);
      procs.push('💀 Marchitamiento Vital');
      bannerNotice = `¡ROBO DE VIDA VAMPÍRICO: +${lifesteal} PV!`;
      extraStatusEffects.push({
        type: 'decay',
        duration: 3,
        stacks: tier >= 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'radiant': {
      // Radiante: Juicio Sagrado contra criaturas de oscuridad (+40% daño) + Purifica estados
      if (isTargetDarkCreature) {
        finalDmg = Math.round(finalDmg * 1.40);
        procs.push('✨ Juicio Sagrado vs Oscuros (+40%)');
      }
      cleanseHero = true;
      procs.push('✨ Purificación de Estados en el Héroe');
      bannerNotice = '¡PURIFICACIÓN SAGRADA & CASTIGO DIVINO!';
      extraStatusEffects.push({
        type: 'holy_blind',
        duration: 2,
        stacks: tier >= 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }

    case 'force': {
      // Fuerza: Energía de maná puro indestructible. Ignora 100% de escudos y otorga +1 Orbe
      orbsBonus = 1;
      finalDmg = Math.round(finalDmg * 1.20); // Pure damage amplification
      procs.push('🔮 Ignora Defensas y Escudos al 100%');
      procs.push('🔮 +1 Orbe de Definitivo de Maná');
      bannerNotice = '¡FUERZA ARCANA: +1 ORBE DE DEFINITIVO!';
      extraStatusEffects.push({
        type: 'stun',
        duration: 1,
        stacks: 1,
        target: 'enemy',
      });
      break;
    }

    case 'psychic': {
      // Psíquico: Colapso mental directo que induce Confusión (35% riesgo de autolesión)
      procs.push('🧠 Colapso Mental Psíquico');
      procs.push('🧠 Confusión de Voluntad (35% Autolesión)');
      bannerNotice = meta.procBannerText;
      extraStatusEffects.push({
        type: 'confused',
        duration: tier === 3 ? 3 : 2,
        stacks: tier >= 2 ? 2 : 1,
        target: 'enemy',
      });
      break;
    }
  }

  return {
    finalDamage: finalDmg,
    isCrit,
    procs,
    bannerNotice,
    lifestealHealed: lifesteal,
    orbsGainedBonus: orbsBonus,
    enemyOrbsDrained: orbsDrained,
    cleanseHero,
    extraStatusEffects,
    dndType: damageType,
    meta,
  };
}
