/**
 * Fusión automática de cartas en la mano: dos cartas del mismo skill y del mismo tier que
 * quedan contiguas se combinan en una sola de tier superior (el tope es tier 3).
 *
 * La lógica vive aquí, separada del componente, para poder probarla sin montar el combate.
 */
export interface AutoMergeableCard {
  skillId: string;
  tier: number;
}

/** Índice de la primera pareja contigua fusionable, o -1 si no hay ninguna. */
export const findAutoMergePair = (hand: readonly AutoMergeableCard[]): number => {
  for (let i = 0; i < hand.length - 1; i++) {
    const left = hand[i];
    const right = hand[i + 1];
    if (!left || !right) continue;
    if (left.skillId === right.skillId && left.tier === right.tier && left.tier < 3) return i;
  }
  return -1;
};

/**
 * Fusiona la pareja que empieza en `pairIdx`: la carta de la izquierda sube de tier y la de la
 * derecha desaparece. Si la pareja ya no es válida devuelve el array original sin tocarlo.
 */
export const applyAutoMerge = <T extends AutoMergeableCard>(
  hand: readonly T[],
  pairIdx: number
): T[] => {
  const left = hand[pairIdx];
  const right = hand[pairIdx + 1];
  if (!left || !right) return hand as T[];
  if (left.skillId !== right.skillId || left.tier !== right.tier || left.tier >= 3) {
    return hand as T[];
  }
  const next = [...hand];
  next[pairIdx] = { ...left, tier: Math.min(3, left.tier + 1) };
  next.splice(pairIdx + 1, 1);
  return next;
};

/**
 * Resuelve todas las parejas en cadena (por ejemplo tres cartas iguales: la primera pareja sube
 * a tier 2 y se queda esperando otra tier 2). Devuelve la mano final y cuántas fusiones hubo.
 */
export const resolveAutoMerges = <T extends AutoMergeableCard>(
  hand: readonly T[]
): { hand: T[]; merges: number } => {
  // Se mantiene la referencia original mientras no haya fusiones, para que quien llame pueda
  // comparar por identidad y no dispare renders (ni bucles) cuando no hay nada que fusionar.
  let current: readonly T[] = hand;
  let merges = 0;
  for (let guard = 0; guard < 24; guard++) {
    const pairIdx = findAutoMergePair(current);
    if (pairIdx === -1) break;
    const next = applyAutoMerge(current, pairIdx);
    if (next === current) break;
    current = next;
    merges++;
  }
  return { hand: current as T[], merges };
};
