import { apiUrl } from '../utils/api';

type RealtimeChannel = 'orders' | 'auctions';
type RealtimeHandler = (payload: Record<string, unknown>) => void;

/**
 * Canal en tiempo real del servidor (Server-Sent Events).
 *
 * El servidor empuja un evento cada vez que guarda una orden o cambia la casa de subastas,
 * así que la sede y el mercado se actualizan al instante. Los componentes que lo usan
 * mantienen un sondeo lento de respaldo por si el flujo no está disponible.
 */
class RealtimeService {
  private source: EventSource | null = null;
  private handlers = new Map<RealtimeChannel, Set<RealtimeHandler>>();

  private ensureConnection() {
    if (this.source || typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      const source = new EventSource(apiUrl('/api/realtime/stream'));
      (['orders', 'auctions'] as RealtimeChannel[]).forEach((channel) => {
        source.addEventListener(channel, (event) => {
          let payload: Record<string, unknown> = {};
          try {
            payload = JSON.parse((event as MessageEvent).data || '{}');
          } catch {
            // Payload vacío: el evento sigue siendo válido como aviso de cambio.
          }
          this.handlers.get(channel)?.forEach((handler) => {
            try {
              handler(payload);
            } catch (err) {
              console.error(`Error en el manejador de tiempo real (${channel}):`, err);
            }
          });
        });
      });
      this.source = source;
    } catch (err) {
      console.warn('Tiempo real no disponible:', err);
    }
  }

  /** Suscribe un manejador a los cambios de un canal. Devuelve la función para desuscribirse. */
  public subscribe(channel: RealtimeChannel, handler: RealtimeHandler): () => void {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
    this.ensureConnection();

    return () => {
      this.handlers.get(channel)?.delete(handler);
    };
  }
}

export const realtime = new RealtimeService();
