/**
 * Ficha de inspección de enemigos (mantener pulsado sobre un enemigo en el combate).
 *
 * Reúne lo que el combate ya sabe de cada enemigo: sus tres habilidades con su daño, el
 * efecto que aplican y las mecánicas especiales de los jefes. El juego no guarda nivel ni
 * ataque propios del enemigo, así que aquí se derivan de sus datos reales (daño de sus
 * habilidades y PV máximos) para poder mostrarlos como en la ficha de referencia.
 */

export interface DossierSkillSource {
  name: string;
  desc: string;
  damage: number | [number, number];
  dndDamageType?: string;
  condition?: { type?: string; duration?: number; stacks?: number; title?: string };
}

export interface EnemyDossierSource {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  isBoss?: boolean;
  isSemiboss?: boolean;
  isMineral?: boolean;
  hasPhaseTwo?: boolean;
  normalSkill: DossierSkillSource;
  specialSkill: DossierSkillSource;
  ultimateSkill: DossierSkillSource;
}

export interface DossierSkill {
  label: string;
  name: string;
  desc: string;
  damage: string;
  typeLabel: string;
  typeIcon: string;
  typeColor: string;
  effect?: string;
}

export interface EnemyDossier {
  level: number;
  attack: number;
  defense: number;
  role: string;
  passives: string[];
  resistances: string[];
  immunities: string[];
  badges: { icon: string; label: string }[];
  skills: DossierSkill[];
}

const DAMAGE_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  slashing: { label: 'Cortante', icon: '⚔️', color: '#f87171' },
  piercing: { label: 'Perforante', icon: '🗡️', color: '#fbbf24' },
  bludgeoning: { label: 'Contundente', icon: '🔨', color: '#f59e0b' },
  fire: { label: 'Fuego', icon: '🔥', color: '#fb923c' },
  cold: { label: 'Frío', icon: '❄️', color: '#67e8f9' },
  lightning: { label: 'Rayo', icon: '⚡', color: '#facc15' },
  thunder: { label: 'Trueno', icon: '🔊', color: '#a78bfa' },
  poison: { label: 'Veneno', icon: '☠️', color: '#84cc16' },
  acid: { label: 'Ácido', icon: '🧪', color: '#a3e635' },
  necrotic: { label: 'Necrótico', icon: '💀', color: '#c084fc' },
  psychic: { label: 'Psíquico', icon: '🌀', color: '#f472b6' },
  force: { label: 'Fuerza', icon: '💥', color: '#38bdf8' },
  radiant: { label: 'Radiante', icon: '✨', color: '#fde68a' },
};

const FALLBACK_TYPE = { label: 'Físico', icon: '⚔️', color: '#d6d3d1' };

/** Mecánicas que el propio combate implementa para estos enemigos. */
const SIGNATURE: Record<
  string,
  { passives?: string[]; resistances?: string[]; immunities?: string[]; defense?: number }
> = {
  arana_acorazada_boss: {
    passives: [
      'Acecha colgada de las telarañas del techo y desciende en picado para barrer la arena.',
      'Capullo de Ceniza: si no recibe daño en el turno, la seda ígnea sella sus heridas y le devuelve vida.',
      'Al aterrizar sacude el suelo y deja una onda sísmica que golpea a toda la vanguardia.',
    ],
    resistances: ['Quitina Blindada: reduce el daño recibido un 25 % durante 2 turnos'],
    defense: 25,
  },
  cryovain_boss: {
    passives: [
      'Ruge para ganar resistencia al daño y potencia de ataque durante varios turnos.',
      'Aliento de Niebla Gélida: puede helar hasta un cuarto de los PV del grupo en un solo aliento.',
      'Alterna mordiscos, zarpazos, pisotones y aliento según la fase en la que esté.',
    ],
    resistances: ['Rugido de escarcha: gana resistencia al daño mientras ruge'],
    defense: 20,
  },
  devorador_quitinoso: {
    passives: [
      'Fase 2 al caer por debajo de la mitad de PV: muda la coraza y se vuelve mucho más agresivo.',
      'Roba vida con sus colmillos mientras está desatado.',
    ],
    resistances: ['Definitivos 50 %'],
  },
};

const formatDamage = (damage: number | [number, number]): string => {
  if (Array.isArray(damage)) return `${damage[0]}–${damage[1]}`;
  return `${damage}`;
};

const averageDamage = (damage: number | [number, number]): number =>
  Array.isArray(damage) ? (damage[0] + damage[1]) / 2 : damage;

const buildSkill = (source: DossierSkillSource, label: string): DossierSkill => {
  const type = DAMAGE_TYPES[source.dndDamageType ?? ''] ?? FALLBACK_TYPE;
  const effect = source.condition
    ? `${source.condition.title ?? 'Efecto'}${source.condition.duration ? ` · ${source.condition.duration} turnos` : ''}${
        source.condition.stacks && source.condition.stacks > 1 ? ` · ×${source.condition.stacks}` : ''
      }`
    : undefined;
  return {
    label,
    name: source.name,
    desc: source.desc,
    damage: formatDamage(source.damage),
    typeLabel: type.label,
    typeIcon: type.icon,
    typeColor: type.color,
    effect,
  };
};

/**
 * Construye la ficha del enemigo a partir de su configuración de combate y de su vida actual.
 */
export const buildEnemyDossier = (source: EnemyDossierSource, hp: number): EnemyDossier => {
  const signature = SIGNATURE[source.id] ?? {};
  const skills = [
    buildSkill(source.normalSkill, 'Habilidad 1'),
    buildSkill(source.specialSkill, 'Habilidad 2'),
    buildSkill(source.ultimateSkill, 'Definitiva'),
  ];

  const passives = [...(signature.passives ?? [])];
  if (source.hasPhaseTwo && !passives.some((p) => p.toLowerCase().includes('fase 2'))) {
    passives.push('Segunda fase: al bajar de la mitad de PV cambia de patrón y se vuelve más peligroso.');
  }
  if (source.isMineral) {
    passives.push('Cuerpo mineral: masa pétrea sin puntos débiles, apenas siente los golpes.');
  }
  if (source.isBoss) {
    passives.push('Jefe de cámara: acumula orbes de definitiva y golpea más fuerte que la tropa.');
  } else if (source.isSemiboss) {
    passives.push('Semijefe de oleada: más resistente y con definitiva propia.');
  }
  const appliedEffects = skills.filter((s) => s.effect).map((s) => s.effect as string);
  if (appliedEffects.length > 0) {
    passives.push(`Aplica ${appliedEffects.join(' · ')}.`);
  }

  // Defensa: la reducción de daño que el combate le concede con sus propios buffos de coraza.
  const hasGuard = [source.normalSkill, source.specialSkill, source.ultimateSkill].some(
    (s) => s.condition?.type === 'def_buff'
  );
  const defense = Math.max(hasGuard ? 25 : 0, signature.defense ?? 0);

  const resistances = [...(signature.resistances ?? [])];
  if (hasGuard && resistances.length === 0) {
    resistances.push('Daño físico reducido mientras mantiene la coraza');
  }
  const role = source.isBoss ? 'Jefe' : source.isSemiboss ? 'Semijefe' : 'Enemigo';
  const badges = [
    { icon: source.isBoss ? '👑' : source.isSemiboss ? '🎖️' : '⚔️', label: role },
    ...skills.map((s) => ({ icon: s.typeIcon, label: s.name })),
  ];

  return {
    level: Math.max(1, Math.round(source.maxHp / 12)),
    attack: Math.round(
      averageDamage(source.ultimateSkill.damage) +
        (source.isBoss ? 12 : source.isSemiboss ? 6 : 0)
    ),
    defense,
    role,
    passives,
    resistances,
    immunities: signature.immunities ?? [],
    badges,
    skills,
  };
};
