import { ClanData, GitHubSyncConfig, GitHubSyncStatus } from '../types/clan';
import { safeStorage } from '../utils/storage';

const CONFIG_STORAGE_KEY = 'cdd_github_orders_sync_cfg_v1';
const STATUS_STORAGE_KEY = 'cdd_github_orders_sync_status_v1';

const DEFAULT_CONFIG: GitHubSyncConfig = {
  token: '',
  owner: 'SUPERWEB-AYM-NANO',
  repo: 'icespear-orders-data',
  branch: 'main',
  filePath: 'orders_database.json',
  gistId: '',
  useGist: false,
  autoSync: true,
};

type StatusListener = (status: GitHubSyncStatus) => void;

class GitHubClanService {
  private config: GitHubSyncConfig = DEFAULT_CONFIG;
  private status: GitHubSyncStatus = {
    lastSyncTime: null,
    lastCommitSha: null,
    lastSyncStatus: 'idle',
    errorMessage: null,
    remoteUrl: null,
    authenticatedUser: null,
  };
  private listeners: Set<StatusListener> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const rawCfg = safeStorage.getItem(CONFIG_STORAGE_KEY);
      if (rawCfg) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(rawCfg) };
      }
      const rawStatus = safeStorage.getItem(STATUS_STORAGE_KEY);
      if (rawStatus) {
        this.status = { ...this.status, ...JSON.parse(rawStatus) };
      }
    } catch (e) {
      console.warn('Error loading GitHub sync state:', e);
    }
  }

  private saveState() {
    try {
      safeStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      safeStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(this.status));
    } catch (e) {
      console.warn('Error saving GitHub sync state:', e);
    }
    this.notify();
  }

  public subscribeStatus(cb: StatusListener): () => void {
    this.listeners.add(cb);
    cb(this.status);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.status);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getConfig(): GitHubSyncConfig {
    return { ...this.config };
  }

  public getStatus(): GitHubSyncStatus {
    return { ...this.status };
  }

  public saveConfig(partial: Partial<GitHubSyncConfig>): void {
    this.config = { ...this.config, ...partial };
    this.saveState();
  }

  public async testConnection(customToken?: string): Promise<{
    success: boolean;
    username?: string;
    avatarUrl?: string;
    message: string;
  }> {
    const token = (customToken !== undefined ? customToken : this.config.token).trim();
    if (!token) {
      return { success: false, message: 'Ingresa un Personal Access Token (PAT) de GitHub para conectar.' };
    }

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err.message || `Error ${res.status}: Token inválido o permisos insuficientes.`,
        };
      }

      const user = await res.json();
      this.status.authenticatedUser = user.login;
      if (!this.config.owner || this.config.owner === 'SUPERWEB-AYM-NANO') {
        this.config.owner = user.login;
      }
      this.saveState();

      return {
        success: true,
        username: user.login,
        avatarUrl: user.avatar_url,
        message: `¡Conexión exitosa con GitHub como @${user.login}!`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Error de red al conectar con api.github.com',
      };
    }
  }

  public exportOrdersJson(allClans: ClanData[], currentClan: ClanData | null): string {
    const payload = {
      appletId: '5bd34417-4600-43a0-9f03-b2d58b50aec1',
      version: '2.0.0',
      syncedAt: new Date().toISOString(),
      currentClanId: currentClan?.id || null,
      totalOrders: allClans.length,
      orders: allClans,
      currentOrder: currentClan,
    };
    return JSON.stringify(payload, null, 2);
  }

  public downloadJsonFile(allClans: ClanData[], currentClan: ClanData | null): void {
    const content = this.exportOrdersJson(allClans, currentClan);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icespear_ordenes_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public async pushOrdersToGitHub(
    allClans: ClanData[],
    currentClan: ClanData | null
  ): Promise<{ success: boolean; message: string; sha?: string; url?: string }> {
    const token = this.config.token.trim();
    if (!token) {
      return {
        success: false,
        message: 'Configura tu Token de GitHub para habilitar el guardado remoto de las órdenes.',
      };
    }

    this.status.lastSyncStatus = 'syncing';
    this.status.errorMessage = null;
    this.notify();

    const jsonString = this.exportOrdersJson(allClans, currentClan);

    try {
      if (this.config.useGist) {
        return await this.pushToGist(token, jsonString);
      } else {
        return await this.pushToRepository(token, jsonString);
      }
    } catch (e: any) {
      const errMsg = e?.message || 'Error desconocido al guardar en GitHub';
      this.status.lastSyncStatus = 'error';
      this.status.errorMessage = errMsg;
      this.saveState();
      return { success: false, message: errMsg };
    }
  }

  private async pushToGist(
    token: string,
    content: string
  ): Promise<{ success: boolean; message: string; sha?: string; url?: string }> {
    const fileName = 'icespear_ordenes.json';

    if (this.config.gistId?.trim()) {
      const gistId = this.config.gistId.trim();
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Base de datos de Órdenes y Hermandades de Icespear',
          files: {
            [fileName]: { content },
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status} al actualizar Gist de GitHub`);
      }

      const gist = await res.json();
      const sha = gist.history?.[0]?.version || gist.id.substring(0, 7);
      this.status.lastSyncStatus = 'success';
      this.status.lastSyncTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.status.lastCommitSha = sha;
      this.status.remoteUrl = gist.html_url;
      this.saveState();

      return {
        success: true,
        message: '¡Datos de órdenes guardados exitosamente en GitHub Gist!',
        sha,
        url: gist.html_url,
      };
    } else {
      // Create new Gist
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Base de datos de Órdenes y Hermandades de Icespear',
          public: false,
          files: {
            [fileName]: { content },
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status} al crear Gist en GitHub`);
      }

      const gist = await res.json();
      this.config.gistId = gist.id;
      this.status.lastSyncStatus = 'success';
      this.status.lastSyncTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.status.lastCommitSha = gist.id.substring(0, 7);
      this.status.remoteUrl = gist.html_url;
      this.saveState();

      return {
        success: true,
        message: `¡Gist de GitHub creado y sincronizado exitosamente! ID: ${gist.id}`,
        sha: gist.id.substring(0, 7),
        url: gist.html_url,
      };
    }
  }

  private async pushToRepository(
    token: string,
    content: string
  ): Promise<{ success: boolean; message: string; sha?: string; url?: string }> {
    const owner = this.config.owner.trim();
    const repo = this.config.repo.trim();
    const branch = this.config.branch.trim() || 'main';
    const filePath = this.config.filePath.trim() || 'orders_database.json';

    if (!owner || !repo) {
      throw new Error('Debes especificar el propietario (owner) y repositorio (repo) de GitHub.');
    }

    // 1. Check if file already exists to get its SHA
    let existingSha: string | undefined;
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }

    // Unicode safe Base64 encode
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const now = new Date().toISOString();
    const commitMessage = existingSha
      ? `Actualizar base de datos de Órdenes de Icespear [${now}]`
      : `Crear base de datos de Órdenes de Icespear [${now}]`;

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          branch,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `Error ${putRes.status} al guardar en GitHub ${owner}/${repo}`);
    }

    const result = await putRes.json();
    const sha = result.commit?.sha?.substring(0, 7) || result.content?.sha?.substring(0, 7) || 'ok';
    const remoteUrl = result.content?.html_url || `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;

    this.status.lastSyncStatus = 'success';
    this.status.lastSyncTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.status.lastCommitSha = sha;
    this.status.remoteUrl = remoteUrl;
    this.saveState();

    return {
      success: true,
      message: `¡Órdenes guardadas con éxito en GitHub! Commit: ${sha}`,
      sha,
      url: remoteUrl,
    };
  }

  public async pullOrdersFromGitHub(): Promise<{
    success: boolean;
    allClans?: ClanData[];
    currentClan?: ClanData | null;
    message: string;
  }> {
    const token = this.config.token.trim();
    if (!token) {
      return { success: false, message: 'Configura tu Token de GitHub para descargar las órdenes.' };
    }

    this.status.lastSyncStatus = 'syncing';
    this.notify();

    try {
      let rawJson: string;

      if (this.config.useGist) {
        const gistId = (this.config.gistId || '').trim();
        if (!gistId) throw new Error('No hay ID de Gist configurado para descargar.');
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status} al consultar el Gist de GitHub.`);
        const gist = await res.json();
        const file = Object.values(gist.files)[0] as any;
        if (!file || !file.content) throw new Error('No se encontró archivo de órdenes en el Gist.');
        rawJson = file.content;
      } else {
        const owner = this.config.owner.trim();
        const repo = this.config.repo.trim();
        const branch = this.config.branch.trim() || 'main';
        const filePath = this.config.filePath.trim() || 'orders_database.json';

        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (!res.ok) {
          throw new Error(`Error ${res.status}: El archivo ${filePath} no existe aún en ${owner}/${repo}`);
        }
        const data = await res.json();
        // Decode base64
        const cleanContent = data.content.replace(/\s/g, '');
        rawJson = decodeURIComponent(escape(atob(cleanContent)));
      }

      const parsed = JSON.parse(rawJson);
      const orders = Array.isArray(parsed.orders)
        ? parsed.orders
        : Array.isArray(parsed.clans)
        ? parsed.clans
        : [];
      const currentOrder = parsed.currentOrder || parsed.currentClan || null;

      this.status.lastSyncStatus = 'success';
      this.status.lastSyncTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.saveState();

      return {
        success: true,
        allClans: orders,
        currentClan: currentOrder,
        message: `¡Se cargaron ${orders.length} órdenes correctamente desde GitHub!`,
      };
    } catch (e: any) {
      const errMsg = e?.message || 'Error al descargar datos de GitHub';
      this.status.lastSyncStatus = 'error';
      this.status.errorMessage = errMsg;
      this.saveState();
      return { success: false, message: errMsg };
    }
  }
}

export const githubClanService = new GitHubClanService();
