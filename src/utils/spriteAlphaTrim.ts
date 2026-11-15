/**
 * Punta del arma de un sprite enemigo, medida sobre el propio PNG.
 *
 * Los sprites llevan padding transparente, así que el borde de la imagen no es el filo de la
 * lanza ni la punta de la flecha. Aquí se escanea el canal alfa desde la izquierda hasta el
 * primer píxel opaco: en las poses de ataque ese píxel es justo la punta del arma.
 *
 * El resultado se cachea por URL y se expresa en fracciones (0..1) del propio sprite, para que
 * valga igual con cualquier tamaño en pantalla.
 */
export interface SpriteWeaponTip {
  /** Fracción horizontal de la punta dentro del sprite. */
  fx: number;
  /** Fracción vertical de la punta dentro del sprite. */
  fy: number;
}

const cache = new Map<string, SpriteWeaponTip | null>();
const loading = new Set<string>();

/**
 * Devuelve la punta del arma del sprite o `null` mientras la imagen aún se está midiendo
 * (la primera llamada lanza la medición y las siguientes ya encuentran el valor cacheado).
 */
export const getSpriteWeaponTip = (url: string): SpriteWeaponTip | null => {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url) ?? null;
  if (loading.has(url) || typeof document === 'undefined') return null;

  loading.add(url);
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
      outer: for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          if (data[(y * canvas.width + x) * 4 + 3] > 24) {
            fx = x / canvas.width;
            fy = y / canvas.height;
            break outer;
          }
        }
      }
      cache.set(url, fx === null ? null : { fx, fy });
    } catch {
      cache.set(url, null);
    }
    loading.delete(url);
  };
  img.onerror = () => {
    cache.set(url, null);
    loading.delete(url);
  };
  img.src = url;
  return null;
};
