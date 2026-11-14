// Marco del enemigo activo, normalizado (0..1) respecto al área de combate.
// Permite que los efectos de ataque del héroe apunten al cuerpo o a la cabeza del enemigo
// real, sea cual sea su sprite, su tamaño o su posición.
export interface EnemyVfxFrame {
  /** Centro horizontal del cuerpo. */
  x: number;
  /** Punto de impacto: mitad entre la cabeza y los pies. */
  y: number;
  headX: number;
  headY: number;
  /** Alto y ancho del sprite respecto al área de combate. */
  height: number;
  width: number;
}

// Valores de referencia: el enemigo "estándar" (un guardia de Icespear) para el que estaban
// calibrados los efectos. Su alto real medido ronda el 46% del área de combate, así que ese
// valor deja el factor de escala en 1 para los enemigos normales.
export const DEFAULT_ENEMY_FRAME: EnemyVfxFrame = {
  x: 0.772,
  y: 0.62,
  headX: 0.768,
  headY: 0.46,
  height: 0.46,
  width: 0.2,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Traduce el marco normalizado a píxeles del lienzo del efecto y calcula el factor de escala
 * del enemigo respecto al de referencia (para agrandar o encoger los efectos con él).
 */
export const resolveEnemyVfxFrame = (
  frame: EnemyVfxFrame | null | undefined,
  width: number,
  height: number
) => {
  const f = frame ?? DEFAULT_ENEMY_FRAME;
  return {
    enemyX: width * f.x,
    enemyY: height * f.y,
    headX: width * f.headX,
    headY: height * f.headY,
    enemyScale: clamp(f.height / DEFAULT_ENEMY_FRAME.height, 0.55, 2.1),
  };
};
