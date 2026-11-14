/**
 * Gacha RPG Combat Effects & Status System
 * Inspired by tactical turn-based RPGs (Epic Seven, Honkai: Star Rail).
 * Features clean Buffs, Debuffs, Turn-based DoTs, Crowd Controls, and Multi-turn Stacking.
 */

export type GachaEffectType =
  | 'poison'      // Veneno / Corrosión: Daño residual (DoT) al inicio de turno acumulable
  | 'atk_down'    // Reducción de Ataque (ATK Down): Reduce el daño infligido un 25% a 50%
  | 'def_break'   // Ruptura de Defensa (DEF Break): El objetivo recibe +30% a +60% de daño
  | 'stun'        // Aturdimiento: Incapacitación (pierde el turno de acción)
  | 'paralyze'    // Parálisis: Incapacitación total por sobrecarga voltaica + golpes críticos garantizados
  | 'blind'       // Ceguera / Falibilidad: Probabilidad de que los ataques fallen (Miss)
  | 'atk_buff'    // Ataque Potenciado (ATK UP): Aumenta el daño saliente un +25% a +65%
  | 'def_buff'    // Defensa Reforzada (DEF UP): Reduce el daño recibido un 30% a 50%
  | 'regen'       // Regeneración Continua (HoT): Recupera salud al inicio de cada turno
  | 'haste'       // Ímpetu Táctico: Evasión aumentada y bonus de velocidad ofensiva
  | 'frozen'      // Congelado: Aura glacial que incapacita o reduce velocidad
  | 'chilled'     // Escarcha: Ralentización y vulnerabilidad
  // D&D 5e Gacha Mechanics Conditions:
  | 'burn'        // Fuego: Quemadura DoT + Deflagración al re-aplicar
  | 'bleed'       // Perforante: Hemorragia arterial (True DoT que ignora armadura)
  | 'laceration'  // Cortante: Laceración acumulable (+15% a todo el daño recibido)
  | 'corrosion'   // Ácido: Corrosión cáustica permanente (-DEF & -ATK)
  | 'confused'    // Psíquico: Confusión mental (35% probabilidad de autolesión)
  | 'charmed'     // Bardo: Encantado por Roxanne (se ataca a sí mismo)
  | 'shock'       // Relámpago: Sobrecarga voltaica con críticos
  | 'decay'       // Necrótico: Marchitamiento vital
  | 'holy_blind'  // Radiante: Ceguera divina por resplandor
  | 'chill'       // Frío: Escarcha acumulable hacia congelación
  | 'faerie_fire' // Fuego Feérico: El enemigo recibe +15%/+20%/+25% más de daño según el Tier
  // Aliases for backwards compatibility:
  | 'poisoned'
  | 'frightened'
  | 'paralyzed'
  | 'stunned'
  | 'prone'
  | 'restrained'
  | 'blinded'
  | 'exhaustion'
  | 'blessed';

export interface GachaEffectMeta {
  type: GachaEffectType;
  canonicalType: GachaEffectType;
  name: string;
  nameEs: string;
  category: 'buff' | 'debuff';
  shortDesc: string;
  tacticalDesc: string;
  isBuff: boolean;
  maxStacks: number;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  particleType: 'poison' | 'atk_down' | 'def_break' | 'stun' | 'paralyze' | 'blind' | 'atk_buff' | 'def_buff' | 'regen' | 'haste';
}

export interface ActiveGachaEffect {
  id: string;
  type: GachaEffectType;
  canonicalType: GachaEffectType;
  name: string;
  description: string;
  turnsRemaining: number;
  stacks: number;
  maxStacks: number;
  tier: number; // Tier 1 (Bronce), 2 (Plata) o 3 (Oro) de la carta
  sourceSkill: string;
  isBuff: boolean;
  category: 'buff' | 'debuff';
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  icon: string;
}

export const GACHA_EFFECTS_CATALOG: Record<string, GachaEffectMeta> = {
  poison: {
    type: 'poison',
    canonicalType: 'poison',
    name: 'Poison DoT',
    nameEs: 'Veneno Corrosivo',
    category: 'debuff',
    shortDesc: 'Daño residual por turno acumulable. Merma la vitalidad gradualmente.',
    tacticalDesc: 'Efecto de daño periódico (DoT). Al inicio de cada turno, inflige daño continuo multiplicativo por cada acumulación activa.',
    isBuff: false,
    maxStacks: 5,
    icon: '☣️',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/80',
    bgColor: 'bg-emerald-950/80',
    glowColor: '#10b981',
    particleType: 'poison',
  },
  poisoned: {
    type: 'poisoned',
    canonicalType: 'poison',
    name: 'Poison DoT',
    nameEs: 'Veneno Corrosivo',
    category: 'debuff',
    shortDesc: 'Daño residual por turno acumulable. Merma la vitalidad gradualmente.',
    tacticalDesc: 'Efecto de daño periódico (DoT). Al inicio de cada turno, inflige daño continuo multiplicativo por cada acumulación activa.',
    isBuff: false,
    maxStacks: 5,
    icon: '☣️',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/80',
    bgColor: 'bg-emerald-950/80',
    glowColor: '#10b981',
    particleType: 'poison',
  },
  atk_down: {
    type: 'atk_down',
    canonicalType: 'atk_down',
    name: 'ATK Down',
    nameEs: 'Ataque Reducido',
    category: 'debuff',
    shortDesc: 'Fatiga de combate: Reduce el daño infligido un 25% (+10% por acumulación).',
    tacticalDesc: 'Debilitamiento ofensivo. El objetivo pierde potencia de ataque físico y mágico mientras el efecto persista en combate.',
    isBuff: false,
    maxStacks: 3,
    icon: '🔻',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/80',
    bgColor: 'bg-purple-950/80',
    glowColor: '#a855f7',
    particleType: 'atk_down',
  },
  frightened: {
    type: 'frightened',
    canonicalType: 'atk_down',
    name: 'ATK Down',
    nameEs: 'Ataque Reducido',
    category: 'debuff',
    shortDesc: 'Fatiga de combate: Reduce el daño infligido un 25% (+10% por acumulación).',
    tacticalDesc: 'Debilitamiento ofensivo. El objetivo pierde potencia de ataque mientras el efecto persista en combate.',
    isBuff: false,
    maxStacks: 3,
    icon: '🔻',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/80',
    bgColor: 'bg-purple-950/80',
    glowColor: '#a855f7',
    particleType: 'atk_down',
  },
  exhaustion: {
    type: 'exhaustion',
    canonicalType: 'atk_down',
    name: 'Fatigue DoT',
    nameEs: 'Desgaste Vital',
    category: 'debuff',
    shortDesc: 'Erosión por turno y debilitamiento progresivo de fuerza física.',
    tacticalDesc: 'Drena salud y reduce el potencial ofensivo en cada fase de combate.',
    isBuff: false,
    maxStacks: 4,
    icon: '💀',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/80',
    bgColor: 'bg-rose-950/80',
    glowColor: '#f43f5e',
    particleType: 'atk_down',
  },
  def_break: {
    type: 'def_break',
    canonicalType: 'def_break',
    name: 'DEF Break',
    nameEs: 'Ruptura de Defensa',
    category: 'debuff',
    shortDesc: 'Armadura destrozada: Recibe +35% de daño adicional (+15% por acumulación).',
    tacticalDesc: 'Vulnerabilidad crítica en la coraza. Todos los impactos y habilidades contra el portador infligen daño severamente incrementado.',
    isBuff: false,
    maxStacks: 3,
    icon: '💔',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/80',
    bgColor: 'bg-orange-950/80',
    glowColor: '#f97316',
    particleType: 'def_break',
  },
  prone: {
    type: 'prone',
    canonicalType: 'def_break',
    name: 'DEF Break',
    nameEs: 'Ruptura de Defensa',
    category: 'debuff',
    shortDesc: 'Armadura destrozada: Recibe +35% de daño adicional (+15% por acumulación).',
    tacticalDesc: 'Vulnerabilidad crítica. Todos los ataques dirigidos al objetivo causan daño amplificado.',
    isBuff: false,
    maxStacks: 3,
    icon: '💔',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/80',
    bgColor: 'bg-orange-950/80',
    glowColor: '#f97316',
    particleType: 'def_break',
  },
  restrained: {
    type: 'restrained',
    canonicalType: 'def_break',
    name: 'Vulnerability',
    nameEs: 'Vulnerabilidad Táctica',
    category: 'debuff',
    shortDesc: 'Inmovilizado por ataduras mágicas: Recibe +30% de daño adicional.',
    tacticalDesc: 'El objetivo queda atrapado sin poder esquivar impactos directos.',
    isBuff: false,
    maxStacks: 3,
    icon: '🕸️',
    color: 'text-indigo-300',
    borderColor: 'border-indigo-400/80',
    bgColor: 'bg-indigo-950/80',
    glowColor: '#818cf8',
    particleType: 'def_break',
  },
  stun: {
    type: 'stun',
    canonicalType: 'stun',
    name: 'Stun',
    nameEs: 'Aturdimiento',
    category: 'debuff',
    shortDesc: 'Incapacitación de turno. Pierde la acción por completo en su siguiente turno.',
    tacticalDesc: 'Control de masas absoluto (Hard CC). Cancela por completo el ataque o acción enemiga durante la duración del efecto.',
    isBuff: false,
    maxStacks: 2,
    icon: '💫',
    color: 'text-amber-300',
    borderColor: 'border-amber-400/80',
    bgColor: 'bg-amber-950/80',
    glowColor: '#fbbf24',
    particleType: 'stun',
  },
  stunned: {
    type: 'stunned',
    canonicalType: 'stun',
    name: 'Stun',
    nameEs: 'Aturdimiento',
    category: 'debuff',
    shortDesc: 'Incapacitación de turno. Pierde la acción por completo en su siguiente turno.',
    tacticalDesc: 'Control de masas absoluto (Hard CC). Cancela el turno de la unidad afectada.',
    isBuff: false,
    maxStacks: 2,
    icon: '💫',
    color: 'text-amber-300',
    borderColor: 'border-amber-400/80',
    bgColor: 'bg-amber-950/80',
    glowColor: '#fbbf24',
    particleType: 'stun',
  },
  paralyze: {
    type: 'paralyze',
    canonicalType: 'paralyze',
    name: 'Electrocution',
    nameEs: 'Parálisis Eléctrica',
    category: 'debuff',
    shortDesc: '¡Sobrecarga total! Incapacitado y todos los impactos recibidos son CRÍTICOS.',
    tacticalDesc: 'Shock voltaico letal de Tier III. La unidad no puede actuar y cualquier ataque que reciba activa de forma garantizada un Golpe Crítico demoledor.',
    isBuff: false,
    maxStacks: 2,
    icon: '⚡',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-950/90',
    glowColor: '#00f7ff',
    particleType: 'paralyze',
  },
  paralyzed: {
    type: 'paralyzed',
    canonicalType: 'paralyze',
    name: 'Electrocution',
    nameEs: 'Parálisis Eléctrica',
    category: 'debuff',
    shortDesc: '¡Sobrecarga total! Incapacitado y todos los impactos recibidos son CRÍTICOS.',
    tacticalDesc: 'Shock voltaico letal de Tier III. La unidad no puede actuar y cualquier ataque que reciba activa de forma garantizada un Golpe Crítico demoledor.',
    isBuff: false,
    maxStacks: 2,
    icon: '⚡',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-950/90',
    glowColor: '#00f7ff',
    particleType: 'paralyze',
  },
  blind: {
    type: 'blind',
    canonicalType: 'blind',
    name: 'Blindness',
    nameEs: 'Ceguera de Seda',
    category: 'debuff',
    shortDesc: 'Falibilidad del 45%: Probabilidad elevada de fallar ataques con mensaje MISS.',
    tacticalDesc: 'Pérdida de puntería táctica. Reduce drásticamente la tasa de acierto en combate, provocando fallos de ataque.',
    isBuff: false,
    maxStacks: 2,
    icon: '🌑',
    color: 'text-slate-300',
    borderColor: 'border-slate-500/80',
    bgColor: 'bg-slate-900/90',
    glowColor: '#94a3b8',
    particleType: 'blind',
  },
  blinded: {
    type: 'blinded',
    canonicalType: 'blind',
    name: 'Blindness',
    nameEs: 'Ceguera de Seda',
    category: 'debuff',
    shortDesc: 'Falibilidad del 45%: Probabilidad elevada de fallar ataques con mensaje MISS.',
    tacticalDesc: 'Pérdida de puntería táctica. Reduce drásticamente la tasa de acierto en combate, provocando fallos de ataque.',
    isBuff: false,
    maxStacks: 2,
    icon: '🌑',
    color: 'text-slate-300',
    borderColor: 'border-slate-500/80',
    bgColor: 'bg-slate-900/90',
    glowColor: '#94a3b8',
    particleType: 'blind',
  },
  charmed: {
    type: 'charmed',
    canonicalType: 'charmed',
    name: 'Charmed',
    nameEs: 'Encantado',
    category: 'debuff',
    shortDesc: 'Seducido por la música de Roxanne: Al atacar se autolesiona con su propio daño.',
    tacticalDesc: 'Bajo influjo de la Velada Encantadora, el enemigo se ataca a sí mismo al ejecutar su turno ofensivo. En Tier II o III, además recibe un 10% adicional de su propio ataque.',
    isBuff: false,
    maxStacks: 1,
    icon: '💖',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/80',
    bgColor: 'bg-pink-950/80',
    glowColor: '#ec4899',
    particleType: 'haste',
  },
  atk_buff: {
    type: 'atk_buff',
    canonicalType: 'atk_buff',
    name: 'ATK UP',
    nameEs: 'Ataque Potenciado',
    category: 'buff',
    shortDesc: 'Potenciación ofensiva: Aumenta el daño de todas las cartas un +25% a +65%.',
    tacticalDesc: 'Multiplicador de daño ofensivo de gacha. Escala el daño base de todas las habilidades y ataques físicos/mágicos del héroe.',
    isBuff: true,
    maxStacks: 3,
    icon: '⚔️',
    color: 'text-amber-200',
    borderColor: 'border-yellow-400',
    bgColor: 'bg-amber-950/90',
    glowColor: '#f59e0b',
    particleType: 'atk_buff',
  },
  haste: {
    type: 'haste',
    canonicalType: 'haste',
    name: 'Tactical Speed',
    nameEs: 'Ímpetu Táctico',
    category: 'buff',
    shortDesc: 'Velocidad e ímpetu: +30% daño saliente y 25% de evasión táctica.',
    tacticalDesc: 'Mejora de agilidad de combate. Permite esquivar golpes enemigos y maximiza la cadencia ofensiva de las marionetas.',
    isBuff: true,
    maxStacks: 3,
    icon: '💨',
    color: 'text-amber-200',
    borderColor: 'border-yellow-400',
    bgColor: 'bg-amber-950/90',
    glowColor: '#fbbf24',
    particleType: 'haste',
  },
  regen: {
    type: 'regen',
    canonicalType: 'regen',
    name: 'Regen HoT',
    nameEs: 'Regeneración Vital',
    category: 'buff',
    shortDesc: 'Curación periódica continua (HoT). Restaura salud al iniciar cada fase de turno.',
    tacticalDesc: 'Soporte vital sostenido (Healing over Time). Mantiene al héroe en el combate restaurando puntos de vida en cada ronda.',
    isBuff: true,
    maxStacks: 3,
    icon: '🌿',
    color: 'text-emerald-300',
    borderColor: 'border-emerald-400',
    bgColor: 'bg-emerald-950/90',
    glowColor: '#34d399',
    particleType: 'regen',
  },
  blessed: {
    type: 'blessed',
    canonicalType: 'regen',
    name: 'Regen HoT',
    nameEs: 'Regeneración Vital',
    category: 'buff',
    shortDesc: 'Curación periódica continua (HoT) y bonificador a daño saliente.',
    tacticalDesc: 'Soporte vital sostenido (Healing over Time). Restaura puntos de vida en cada ronda de combate.',
    isBuff: true,
    maxStacks: 3,
    icon: '🌿',
    color: 'text-emerald-300',
    borderColor: 'border-emerald-400',
    bgColor: 'bg-emerald-950/90',
    glowColor: '#34d399',
    particleType: 'regen',
  },
  def_buff: {
    type: 'def_buff',
    canonicalType: 'def_buff',
    name: 'DEF UP',
    nameEs: 'Defensa Rúnica',
    category: 'buff',
    shortDesc: 'Mitigación de daño: Reduce el daño de golpes recibidos un 30%.',
    tacticalDesc: 'Barrera rúnica protectora. Absorbe y disipa el impacto de ataques enemigos directos.',
    isBuff: true,
    maxStacks: 2,
    icon: '🛡️',
    color: 'text-sky-300',
    borderColor: 'border-sky-400',
    bgColor: 'bg-sky-950/90',
    glowColor: '#38bdf8',
    particleType: 'def_buff',
  },
  frozen: {
    type: 'frozen',
    canonicalType: 'frozen',
    name: 'Glacial Freeze',
    nameEs: 'Congelación Glacial',
    category: 'debuff',
    shortDesc: 'Aura glacial: Cristales de hielo inmovilizan a la unidad y reducen su evasión a 0.',
    tacticalDesc: 'Incapacitación por frío extremo. La unidad queda congelada en un bloque de hielo puro durante su duración.',
    isBuff: false,
    maxStacks: 2,
    icon: '❄️',
    color: 'text-sky-300',
    borderColor: 'border-sky-400',
    bgColor: 'bg-sky-950/90',
    glowColor: '#38bdf8',
    particleType: 'def_buff',
  },
  chilled: {
    type: 'chilled',
    canonicalType: 'frozen',
    name: 'Chilled',
    nameEs: 'Escarcha Gélida',
    category: 'debuff',
    shortDesc: 'Ralentización por frío: -20% velocidad de acción.',
    tacticalDesc: 'Reduce la velocidad de acción y hace vulnerable a la unidad ante ataques de impacto.',
    isBuff: false,
    maxStacks: 3,
    icon: '🧊',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-950/90',
    glowColor: '#00f7ff',
    particleType: 'def_buff',
  },
  chill: {
    type: 'chill',
    canonicalType: 'frozen',
    name: 'Chilled',
    nameEs: 'Escarcha Gélida',
    category: 'debuff',
    shortDesc: 'Ralentización por frío: -20% velocidad de acción.',
    tacticalDesc: 'Reduce la velocidad de acción y hace vulnerable a la unidad ante ataques de impacto.',
    isBuff: false,
    maxStacks: 3,
    icon: '🧊',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-950/90',
    glowColor: '#00f7ff',
    particleType: 'def_buff',
  },
  burn: {
    type: 'burn',
    canonicalType: 'poison',
    name: 'Burn DoT',
    nameEs: 'Quemadura Incinerante',
    category: 'debuff',
    shortDesc: 'Daño ígneo por turno. Si se re-aplica genera Deflagración explosiva instantánea.',
    tacticalDesc: 'Las llamas consumen al objetivo al inicio de cada turno. Un nuevo impacto de Fuego detona instantáneamente el daño restante.',
    isBuff: false,
    maxStacks: 4,
    icon: '🔥',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/80',
    bgColor: 'bg-orange-950/80',
    glowColor: '#f97316',
    particleType: 'poison',
  },
  bleed: {
    type: 'bleed',
    canonicalType: 'poison',
    name: 'Bleed DoT',
    nameEs: 'Sangrado Arterial',
    category: 'debuff',
    shortDesc: 'Hemorragia continua que ignora la armadura por completo.',
    tacticalDesc: 'Heridas abiertas por armas punzantes. Drena puntos de vida sin ser mitigado por la defensa de la armadura.',
    isBuff: false,
    maxStacks: 5,
    icon: '🩸',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/80',
    bgColor: 'bg-rose-950/80',
    glowColor: '#f43f5e',
    particleType: 'poison',
  },
  laceration: {
    type: 'laceration',
    canonicalType: 'def_break',
    name: 'Laceration',
    nameEs: 'Laceración de Combo',
    category: 'debuff',
    shortDesc: '+15% a TODO el daño recibido por cada carga activa.',
    tacticalDesc: 'Cortes profundos que exponen puntos débiles del enemigo. Multiplica todo el daño subsiguiente recibido en cadena.',
    isBuff: false,
    maxStacks: 5,
    icon: '⚔️',
    color: 'text-red-400',
    borderColor: 'border-red-500/80',
    bgColor: 'bg-red-950/80',
    glowColor: '#ef4444',
    particleType: 'def_break',
  },
  corrosion: {
    type: 'corrosion',
    canonicalType: 'def_break',
    name: 'Corrosion',
    nameEs: 'Corrosión Cáustica',
    category: 'debuff',
    shortDesc: 'Corrosión ácida permanente: -20% DEF y -15% ATK por carga.',
    tacticalDesc: 'Disolución permanente del equipo defensivo durante toda la estancia en la sala.',
    isBuff: false,
    maxStacks: 3,
    icon: '🧪',
    color: 'text-lime-400',
    borderColor: 'border-lime-500/80',
    bgColor: 'bg-lime-950/80',
    glowColor: '#84cc16',
    particleType: 'def_break',
  },
  confused: {
    type: 'confused',
    canonicalType: 'blind',
    name: 'Confusion',
    nameEs: 'Confusión Mental',
    category: 'debuff',
    shortDesc: 'Colapso psicológico: 35% de probabilidad de atacarse a sí mismo en su turno.',
    tacticalDesc: 'El intelecto queda perturbado por asalto psíquico. Puede desviar el ataque enemigo contra sus propios aliados o contra sí mismo.',
    isBuff: false,
    maxStacks: 2,
    icon: '🧠',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/80',
    bgColor: 'bg-pink-950/80',
    glowColor: '#f43f5e',
    particleType: 'blind',
  },
  shock: {
    type: 'shock',
    canonicalType: 'paralyze',
    name: 'Shock Overload',
    nameEs: 'Sobrecarga Voltaica',
    category: 'debuff',
    shortDesc: 'Electrocución de alto voltaje: Incapacitado y los golpes recibidos son críticos.',
    tacticalDesc: 'Sobrecarga eléctrica inducida por daño de relámpago que paraliza el sistema motor.',
    isBuff: false,
    maxStacks: 2,
    icon: '⚡',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-950/90',
    glowColor: '#00f7ff',
    particleType: 'paralyze',
  },
  decay: {
    type: 'decay',
    canonicalType: 'atk_down',
    name: 'Decay',
    nameEs: 'Marchitamiento Necrótico',
    category: 'debuff',
    shortDesc: 'Erosión necrótica: Impide curación y reduce el ataque un 25%.',
    tacticalDesc: 'Miasma de muerte que devora el vigor vital impidiendo que el afectado recupere fuerzas.',
    isBuff: false,
    maxStacks: 3,
    icon: '💀',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/80',
    bgColor: 'bg-purple-950/80',
    glowColor: '#a855f7',
    particleType: 'atk_down',
  },
  holy_blind: {
    type: 'holy_blind',
    canonicalType: 'blind',
    name: 'Holy Blind',
    nameEs: 'Ceguera Sagrada',
    category: 'debuff',
    shortDesc: 'Deslumbramiento celestial: 50% de probabilidad de fallar ataques.',
    tacticalDesc: 'Resplandor divino que enceguece a criaturas sombrías y monstruos subterráneos.',
    isBuff: false,
    maxStacks: 2,
    icon: '✨',
    color: 'text-amber-300',
    borderColor: 'border-yellow-400/80',
    bgColor: 'bg-amber-950/80',
    glowColor: '#fbbf24',
    particleType: 'blind',
  },
  faerie_fire: {
    type: 'faerie_fire',
    canonicalType: 'faerie_fire',
    name: 'Faerie Fire',
    nameEs: 'Fuego Feérico',
    category: 'debuff',
    shortDesc: 'Resplandor feérico: Aumenta el daño recibido un +15% (Tier I), +20% (Tier II) o +25% (Tier III).',
    tacticalDesc: 'Llamas feéricas arcanas de Barled que envuelven a todos los enemigos y exponen sus puntos débiles, incrementando todo el daño recibido un +15% en Tier I, +20% en Tier II y +25% en Tier III.',
    isBuff: false,
    maxStacks: 1,
    icon: '✨',
    color: 'text-fuchsia-300',
    borderColor: 'border-fuchsia-400',
    bgColor: 'bg-fuchsia-950/90',
    glowColor: '#e879f9',
    particleType: 'def_break',
  },
};

/**
 * Apply or stack a Gacha combat effect on an active list of conditions.
 */
export function stackGachaEffect(
  currentEffects: ActiveGachaEffect[],
  type: GachaEffectType,
  duration: number,
  stacksToAdd: number,
  tier: number,
  sourceSkill: string
): { updatedEffects: ActiveGachaEffect[]; isNew: boolean; currentStacks: number; totalTurns: number } {
  const meta = GACHA_EFFECTS_CATALOG[type] || GACHA_EFFECTS_CATALOG.poison;
  const canonical = meta.canonicalType;

  const existingIdx = currentEffects.findIndex(
    (c) => c.type === type || c.canonicalType === canonical
  );

  if (existingIdx >= 0) {
    const existing = currentEffects[existingIdx];
    const newTurns = Math.min(6, existing.turnsRemaining + duration);
    const newStacks = Math.min(meta.maxStacks, existing.stacks + stacksToAdd);
    const highestTier = Math.max(existing.tier, tier);

    const updatedList = [...currentEffects];
    updatedList[existingIdx] = {
      ...existing,
      turnsRemaining: newTurns,
      stacks: newStacks,
      tier: highestTier,
      sourceSkill,
    };

    return {
      updatedEffects: updatedList,
      isNew: false,
      currentStacks: newStacks,
      totalTurns: newTurns,
    };
  }

  const newEffect: ActiveGachaEffect = {
    id: `fx_${canonical}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    canonicalType: canonical,
    name: meta.nameEs,
    description: meta.shortDesc,
    turnsRemaining: duration,
    stacks: Math.min(meta.maxStacks, Math.max(1, stacksToAdd)),
    maxStacks: meta.maxStacks,
    tier,
    sourceSkill,
    isBuff: meta.isBuff,
    category: meta.category,
    color: meta.color,
    borderColor: meta.borderColor,
    bgColor: meta.bgColor,
    glowColor: meta.glowColor,
    icon: meta.icon,
  };

  return {
    updatedEffects: [...currentEffects, newEffect],
    isNew: true,
    currentStacks: newEffect.stacks,
    totalTurns: duration,
  };
}

/**
 * Tick active effects at the end of each turn phase: decrements turn counter, returns expired ones.
 */
export function tickGachaEffects(effects: ActiveGachaEffect[]): {
  remainingEffects: ActiveGachaEffect[];
  expiredEffects: ActiveGachaEffect[];
} {
  const remainingEffects: ActiveGachaEffect[] = [];
  const expiredEffects: ActiveGachaEffect[] = [];

  for (const eff of effects) {
    const nextTurns = eff.turnsRemaining - 1;
    if (nextTurns > 0) {
      remainingEffects.push({
        ...eff,
        turnsRemaining: nextTurns,
      });
    } else {
      expiredEffects.push(eff);
    }
  }

  return { remainingEffects, expiredEffects };
}

// Backward-compatible type aliases for seamless integration
export type DndConditionType = GachaEffectType;
export type ActiveCondition = ActiveGachaEffect;
export const DND_CONDITIONS_CATALOG = GACHA_EFFECTS_CATALOG;
export const stackDndCondition = stackGachaEffect;
export const tickConditions = tickGachaEffects;
