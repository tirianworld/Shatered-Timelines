/**
 * Punta del arma de un sprite enemigo, medida sobre el propio PNG.
 *
 * Los sprites llevan padding transparente, así que el borde de la imagen no es el filo de la
 * lanza ni la punta de la flecha. Aquí se escanea el canal alfa desde un borde hasta el primer
 * píxel opaco: en las poses de ataque ese píxel es justo la punta del arma.
 *
 * El lado del escaneo importa: las poses espejadas para mirar a la izquierda llevan el arma en
 * el borde derecho (la bandeja del bugbear, por ejemplo), así que ahí hay que escanear desde la
 * derecha o la «punta» sale del otro extremo del dibujo.
 *
 * El resultado se cachea por URL y lado, y se expresa en fracciones (0..1) del propio sprite,
 * para que valga igual con cualquier tamaño en pantalla.
 */
export interface SpriteWeaponTip {
  /** Fracción horizontal de la punta dentro del sprite. */
  fx: number;
  /** Fracción vertical de la punta dentro del sprite. */
  fy: number;
}

export type WeaponTipSide = 'left' | 'right';

const cache = new Map<string, SpriteWeaponTip | null>();
const loading = new Set<string>();

const cacheKey = (url: string, side: WeaponTipSide) => `${side}|${url}`;

/**
 * Devuelve la punta del arma del sprite o `null` mientras la imagen aún se está midiendo
 * (la primera llamada lanza la medición y las siguientes ya encuentran el valor cacheado).
 */
export const getSpriteWeaponTip = (url: string, side: WeaponTipSide = 'left'): SpriteWeaponTip | null => {
  if (!url) return null;
  const key = cacheKey(url, side);
  if (cache.has(key)) return cache.get(key) ?? null;
  if (loading.has(key) || typeof document === 'undefined') return null;

  loading.add(key);
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('sin contexto 2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let fx: number | null = null;
      let fy = 0.5;
      const lastX = canvas.width - 1;
      const step = side === 'right' ? -1 : 1;
      let x = side === 'right' ? lastX : 0;
      outer: for (; x >= 0 && x <= lastX; x += step) {
        for (let y = 0; y < canvas.height; y++) {
          if (data[(y * canvas.width + x) * 4 + 3] > 24) {
            fx = x / canvas.width;
            fy = y / canvas.height;
            break outer;
          }
        }
      }
      cache.set(key, fx === null ? null : { fx, fy });
    } catch {
      cache.set(key, null);
    }
    loading.delete(key);
  };
  img.onerror = () => {
    cache.set(key, null);
    loading.delete(key);
  };
  img.src = url;
  return null;
};
