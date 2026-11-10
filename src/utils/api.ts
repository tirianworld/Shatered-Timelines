/**
 * Base de la API del juego.
 *
 * - En la web (y en la TWA de Play Store que carga el mismo dominio) está vacía: las
 *   peticiones van al mismo origen que sirve el juego.
 * - Si el juego se empaqueta en una WebView/Capacitor que vive en otro origen, define
 *   VITE_API_BASE_URL en el build con la URL pública del servidor.
 *
 * El token de GitHub nunca viaja al cliente: lo usa únicamente el servidor.
 */
const RAW_API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

export const API_BASE = String(RAW_API_BASE).replace(/\/+$/, '');

/** Devuelve la URL absoluta de un endpoint de la API. */
export const apiUrl = (path: string): string => (path.startsWith('/api') ? `${API_BASE}${path}` : path);
