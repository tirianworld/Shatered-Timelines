export interface GitHubRepoStatus {
  connected: boolean;
  repo: string;
  branch: string;
  lastCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  totalFiles?: number;
  dataCategories?: {
    heroes: number;
    banners: number;
    items: number;
    patrols: number;
    equipment: number;
  };
  error?: string;
}

export interface AssetUploadResult {
  success: boolean;
  localPath: string;
  githubUrl: string;
  filename: string;
  message?: string;
}

export const GITHUB_CONFIG = {
  owner: 'theworldoftirian',
  repo: 'Cdd-Gacha-Datos',
  branch: 'main',
  repoUrl: 'https://github.com/theworldoftirian/Cdd-Gacha-Datos',
  rawBaseUrl: 'https://raw.githubusercontent.com/theworldoftirian/Cdd-Gacha-Datos/main',
};

class GitHubService {
  /**
   * Obtiene el estado actual de sincronización con el repositorio de GitHub
   */
  async getStatus(): Promise<GitHubRepoStatus> {
    try {
      const response = await fetch('/api/github/status');
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      return {
        connected: false,
        repo: `${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`,
        branch: GITHUB_CONFIG.branch,
        error: err.message || 'No se pudo conectar al servidor de sincronización',
      };
    }
  }

  /**
   * Carga los datos maestros de juego directamente desde GitHub o caché local
   */
  async fetchLiveGameData(): Promise<{
    heroes?: any[];
    banners?: any[];
    patrols?: any[];
    inventory?: any[];
    equipment?: any[];
    shop?: any[];
  } | null> {
    try {
      const response = await fetch('/api/github/data');
      if (!response.ok) throw new Error('Error al consultar datos');
      return await response.json();
    } catch (err) {
      console.warn('Fallback a datos locales:', err);
      return null;
    }
  }

  /**
   * Guarda y comitea datos específicos en el repositorio de GitHub
   */
  async saveData(category: 'heroes' | 'banners' | 'patrols' | 'inventory' | 'equipment' | 'shop', payload: any, message?: string): Promise<{ success: boolean; sha?: string; error?: string }> {
    try {
      const res = await fetch('/api/github/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          data: payload,
          message: message || `chore(data): actualizar ${category} desde el gestor de juego`,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error de conexión al guardar datos en GitHub',
      };
    }
  }

  /**
   * Sube un asset de imagen directamente al repositorio y lo guarda localmente
   */
  async uploadAsset(
    category: 'portraits' | 'skills' | 'items' | 'backgrounds' | 'ui' | 'forge',
    filename: string,
    fileBase64: string,
    commitMessage?: string
  ): Promise<AssetUploadResult> {
    try {
      const res = await fetch('/api/github/upload-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          filename,
          base64: fileBase64,
          message: commitMessage || `feat(assets): subir asset ${filename} a ${category}`,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        localPath: '',
        githubUrl: '',
        filename,
        message: err.message || 'Error al subir asset a GitHub',
      };
    }
  }

  /**
   * Sincroniza y descarga las últimas actualizaciones desde el repo
   */
  async pullLatest(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/github/sync', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Fallo de sincronización' };
    }
  }

  /**
   * Resuelve una URL de asset, prefiriendo la ruta local si está presente o el CDN de GitHub
   */
  resolveAssetUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    // Si empieza con /assets/, podemos referenciar local o GitHub Raw
    return path;
  }
}

export const githubService = new GitHubService();
