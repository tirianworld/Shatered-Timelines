import { ClanData, ClanMember, GitHubSyncStatus } from '../types/clan';
import { safeStorage } from '../utils/storage';
import { apiUrl } from '../utils/api';

const STATUS_STORAGE_KEY = 'cdd_orders_sync_status_v2';
const REQUEST_TIMEOUT_MS = 12000;

export interface OrdersSnapshot {
  orders: ClanData[];
  source: 'github' | 'local';
  syncedAt: number | null;
}

export interface OrderMutationResult {
  success: boolean;
  synced: boolean;
  order?: ClanData;
  sha: string | null;
  url: string | null;
  message: string;
}

interface OrdersApiResponse {
  success?: boolean;
  orders?: ClanData[];
  order?: ClanData;
  source?: 'github' | 'local';
  updatedAt?: number;
  synced?: boolean;
  sha?: string | null;
  url?: string | null;
  message?: string;
  repo?: {
    url?: string;
    path?: string;
    tokenConfigured?: boolean;
  };
}

const REPO_URL = 'https://github.com/theworldoftirian/Cdd-Gacha-Datos';

type StatusListener = (status: GitHubSyncStatus) => void;

const fetchWithTimeout = async (input: string, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const formatSyncTime = () =>
  new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * Cliente de la base de órdenes alojada en GitHub.
 * No guarda ningún token en el navegador: el servidor es quien comitea con sus credenciales.
 */
class GitHubClanService {
  private status: GitHubSyncStatus = {
    lastSyncTime: null,
    lastCommitSha: null,
    lastSyncStatus: 'idle',
    errorMessage: null,
    remoteUrl: REPO_URL,
    source: null,
    orderCount: 0,
  };
  private listeners: Set<StatusListener> = new Set();

  constructor() {
    try {
      const raw = safeStorage.getItem(STATUS_STORAGE_KEY);
      if (raw) {
        this.status = { ...this.status, ...JSON.parse(raw) };
      }
    } catch {
      // Estado por defecto si la caché está corrupta
    }
  }

  private saveStatus() {
    try {
      safeStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(this.status));
    } catch {
      // Ignorado: la sincronización no depende de la caché
    }
    this.notify();
  }

  public subscribeStatus(cb: StatusListener): () => void {
    this.listeners.add(cb);
    cb(this.getStatus());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const snapshot = this.getStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getStatus(): GitHubSyncStatus {
    return { ...this.status };
  }

  public getRepoUrl(): string {
    return this.status.remoteUrl || REPO_URL;
  }

  private beginSync() {
    this.status.lastSyncStatus = 'syncing';
    this.status.errorMessage = null;
    this.notify();
  }

  private applySuccess(repoUrl?: string, sha?: string | null, orderCount?: number, source?: 'github' | 'local') {
    this.status.lastSyncStatus = 'success';
    this.status.lastSyncTime = formatSyncTime();
    this.status.errorMessage = null;
    if (sha) this.status.lastCommitSha = sha;
    if (repoUrl) this.status.remoteUrl = repoUrl;
    if (typeof orderCount === 'number') this.status.orderCount = orderCount;
    if (source) this.status.source = source;
    this.saveStatus();
  }

  private applyLocalOnly(message: string, orderCount?: number) {
    this.status.lastSyncStatus = 'local';
    this.status.lastSyncTime = formatSyncTime();
    this.status.errorMessage = message;
    if (typeof orderCount === 'number') this.status.orderCount = orderCount;
    this.saveStatus();
  }

  private applyError(message: string) {
    this.status.lastSyncStatus = 'error';
    this.status.errorMessage = message;
    this.saveStatus();
  }

  /** Descarga todas las órdenes (y sus jugadores) desde la base de GitHub. */
  public async loadOrders(): Promise<OrdersSnapshot | null> {
    this.beginSync();
    try {
      const res = await fetchWithTimeout(apiUrl('/api/orders'), { cache: 'no-store' });
      const data = (await res.json()) as OrdersApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.message || `El servidor respondió ${res.status}`);
      }

      const orders = Array.isArray(data.orders) ? data.orders : [];
      this.applySuccess(data.repo?.url, null, orders.length, data.source);
      return { orders, source: data.source || 'local', syncedAt: data.updatedAt ?? null };
    } catch (err: any) {
      this.applyError(
        err?.name === 'AbortError'
          ? 'La sede tardó demasiado en responder.'
          : err?.message || 'No se pudo conectar con la sede remota.'
      );
      return null;
    }
  }

  /** Crea o actualiza una orden completa, incluida su plantilla de jugadores. */
  public async saveOrder(order: ClanData, message?: string): Promise<OrderMutationResult> {
    return this.mutate('/api/orders/save', { order, message });
  }

  /** Añade o actualiza un jugador dentro de una orden existente. */
  public async joinOrder(orderId: string, member: ClanMember): Promise<OrderMutationResult> {
    return this.mutate('/api/orders/join', { orderId, member });
  }

  /** Elimina a un jugador de una orden existente. */
  public async leaveOrder(orderId: string, playerId: string, gamerTag?: string): Promise<OrderMutationResult> {
    return this.mutate('/api/orders/leave', { orderId, playerId, gamerTag });
  }

  private async mutate(path: string, body: Record<string, unknown>): Promise<OrderMutationResult> {
    this.beginSync();
    try {
      const res = await fetchWithTimeout(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as OrdersApiResponse;

      if (!res.ok || !data.success) {
        const message = data.message || `El servidor respondió ${res.status}`;
        this.applyError(message);
        return { success: false, synced: false, sha: null, url: null, message };
      }

      const synced = Boolean(data.synced);
      if (synced) {
        this.applySuccess(data.url || undefined, data.sha ?? null, data.repo ? undefined : this.status.orderCount);
      } else {
        this.applyLocalOnly(data.message || 'Guardado en el servidor, pendiente de GitHub.');
      }

      return {
        success: true,
        synced,
        order: data.order,
        sha: data.sha ?? null,
        url: data.url ?? data.repo?.url ?? null,
        message: data.message || 'Orden guardada.',
      };
    } catch (err: any) {
      const message =
        err?.name === 'AbortError' ? 'La sede tardó demasiado en responder.' : err?.message || 'Error de red.';
      this.applyError(message);
      return { success: false, synced: false, sha: null, url: null, message };
    }
  }
}

export const githubClanService = new GitHubClanService();
