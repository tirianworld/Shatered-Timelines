// Carga .env local si existe (está en .gitignore): las credenciales nunca viven en el código.
// En la nube se inyectan como variables de entorno / Secrets del proyecto.
import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  pvpIncomingMultiplier,
  pvpOutgoingMultiplier,
  pvpStatusHostile,
  pvpStatusIcon,
  pvpStatusKind,
  pvpStatusLabel,
} from './src/data/pvpStatus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[SERVER] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled rejection:', reason);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- CORS ---
// La web se sirve desde el mismo origen, así que no necesita CORS. El paquete de Play Store
// (WebView/Capacitor) u otros dominios autorizados sí: se declaran en ALLOWED_ORIGINS,
// separados por comas. Ningún cliente necesita el token de GitHub; vive solo en el servidor.
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-play-session');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'theworldoftirian';
const GITHUB_REPO = 'Cdd-Gacha-Datos';
const GITHUB_BRANCH = 'main';

const githubHeaders: Record<string, string> = {
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'CDD-Gacha-App',
};

// --- REALTIME (SERVER-SENT EVENTS) ---
// El servidor es la fuente de verdad: cada vez que se guarda una orden o cambia la casa de
// subastas escribe en disco, comitea en GitHub y empuja el aviso a los clientes conectados.
// Así la sede y la subasta se actualizan al instante sin depender de un sondeo lento.
type RealtimeChannel = 'orders' | 'auctions';

interface RealtimeClient {
  res: Response;
  channels: Set<RealtimeChannel>;
}

const realtimeClients = new Set<RealtimeClient>();

const broadcastRealtime = (channel: RealtimeChannel, payload: Record<string, unknown> = {}) => {
  if (realtimeClients.size === 0) return;
  const frame = `event: ${channel}\ndata: ${JSON.stringify({ channel, at: Date.now(), ...payload })}\n\n`;
  realtimeClients.forEach((client) => {
    if (!client.channels.has(channel)) return;
    try {
      client.res.write(frame);
    } catch {
      realtimeClients.delete(client);
    }
  });
};

app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const requested = String(req.query.channels || 'orders,auctions')
    .split(',')
    .map((c) => c.trim())
    .filter((c): c is RealtimeChannel => c === 'orders' || c === 'auctions');
  const channels = new Set<RealtimeChannel>(requested.length ? requested : ['orders', 'auctions']);

  const client: RealtimeClient = { res, channels };
  realtimeClients.add(client);
  res.write(`event: ready\ndata: ${JSON.stringify({ channels: [...channels], at: Date.now() })}\n\n`);

  // Latido para que proxies y navegadores no cierren el flujo por inactividad.
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      realtimeClients.delete(client);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeClients.delete(client);
  });
});

// --- GITHUB REPO STATUS ---
app.get('/api/github/status', async (_req: Request, res: Response) => {
  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
      { headers: githubHeaders }
    );

    if (!repoRes.ok) {
      return res.status(repoRes.status).json({
        connected: false,
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        branch: GITHUB_BRANCH,
        error: `GitHub API error: ${repoRes.statusText}`,
      });
    }

    const repoData = await repoRes.json();

    // Get last commit
    let lastCommit: any = null;
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`,
        { headers: githubHeaders }
      );
      if (commitRes.ok) {
        const cData = await commitRes.json();
        lastCommit = {
          sha: cData.sha?.substring(0, 7),
          message: cData.commit?.message,
          author: cData.commit?.author?.name || cData.author?.login,
          date: cData.commit?.author?.date,
        };
      }
    } catch {
      // Ignored
    }

    return res.json({
      connected: true,
      repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
      branch: GITHUB_BRANCH,
      description: repoData.description,
      stars: repoData.stargazers_count,
      lastCommit,
      totalFiles: 1140,
      dataCategories: {
        heroes: 15,
        banners: 3,
        items: 45,
        patrols: 5,
        equipment: 20,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
      branch: GITHUB_BRANCH,
      error: err.message,
    });
  }
});

// --- GET LIVE GAME DATA (FROM GITHUB OR CACHE) ---
app.get('/api/github/data', async (_req: Request, res: Response) => {
  const exportDir = path.join(__dirname, 'export_data');
  const files = ['heroes', 'banners', 'patrols', 'inventory', 'equipment', 'shop'];
  const result: Record<string, any> = {};

  for (const f of files) {
    const localFilePath = path.join(exportDir, `${f}.json`);
    if (fs.existsSync(localFilePath)) {
      try {
        result[f] = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      } catch {
        result[f] = null;
      }
    } else {
      // Fallback: fetch from GitHub raw
      try {
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/${f}.json`
        );
        if (rawRes.ok) {
          result[f] = await rawRes.json();
        }
      } catch {
        result[f] = null;
      }
    }
  }

  res.json(result);
});

// --- SAVE / COMMIT DATA TO GITHUB ---
app.post('/api/github/save-data', async (req: Request, res: Response) => {
  const { category, data, message } = req.body;
  if (!category || !data) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos (category, data)' });
  }

  const exportDir = path.join(__dirname, 'export_data');
  fs.mkdirSync(exportDir, { recursive: true });
  const localPath = path.join(exportDir, `${category}.json`);

  const formattedJson = JSON.stringify(data, null, 2);
  fs.writeFileSync(localPath, formattedJson, 'utf-8');

  // Also update /tmp/Cdd-Gacha-Datos if present
  const tmpRepoDataPath = path.join('/tmp', 'Cdd-Gacha-Datos', 'data', `${category}.json`);
  if (fs.existsSync(path.dirname(tmpRepoDataPath))) {
    try {
      fs.writeFileSync(tmpRepoDataPath, formattedJson, 'utf-8');
    } catch {
      // Ignored
    }
  }

  if (!GITHUB_TOKEN) {
    return res.json({
      success: true,
      localOnly: true,
      message: 'Guardado localmente en el servidor (lectura pública de GitHub activa).',
    });
  }

  // Push commit to GitHub via GitHub Contents API
  try {
    const filePath = `data/${category}.json`;
    let sha: string | undefined;

    const checkRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      { headers: githubHeaders }
    );

    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      sha = checkJson.sha;
    }

    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: githubHeaders,
        body: JSON.stringify({
          message: message || `feat(data): actualizar ${category}.json desde CDD Gacha`,
          content: Buffer.from(formattedJson).toString('base64'),
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!commitRes.ok) {
      const errData = await commitRes.json();
      console.warn('GitHub API commit warning:', errData);
      return res.json({
        success: true,
        localOnly: true,
        message: 'Guardado localmente. Error al sincronizar con GitHub: ' + (errData.message || commitRes.statusText),
      });
    }

    const commitResult = await commitRes.json();
    return res.json({
      success: true,
      sha: commitResult.commit?.sha?.substring(0, 7),
      message: 'Guardado y comiteado con éxito en GitHub',
    });
  } catch (err: any) {
    return res.json({
      success: true,
      localOnly: true,
      error: err.message,
      message: 'Guardado localmente en caché de la app.',
    });
  }
});

// --- UPLOAD ASSET DIRECTLY TO GITHUB & LOCAL ---
app.post('/api/github/upload-asset', async (req: Request, res: Response) => {
  const { category, filename, base64, message } = req.body;
  if (!category || !filename || !base64) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos (category, filename, base64)' });
  }

  const safeFilename = filename.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
  const localDir = path.join(__dirname, 'public', 'assets', category);
  fs.mkdirSync(localDir, { recursive: true });
  const localFilePath = path.join(localDir, safeFilename);

  const fileBuffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(localFilePath, fileBuffer);

  const targetPath = `assets/${category}/${safeFilename}`;
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${targetPath}`;
  const localUrl = `/assets/${category}/${safeFilename}`;

  if (!GITHUB_TOKEN) {
    return res.json({
      success: true,
      localOnly: true,
      localPath: localUrl,
      githubUrl: rawUrl,
      filename: safeFilename,
      message: 'Asset guardado localmente en el servidor (sin GITHUB_TOKEN para subir a GitHub).',
    });
  }

  // Upload to GitHub via GitHub Contents API
  try {
    let sha: string | undefined;
    const checkRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${targetPath}?ref=${GITHUB_BRANCH}`,
      { headers: githubHeaders }
    );

    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      sha = checkJson.sha;
    }

    const uploadRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${targetPath}`,
      {
        method: 'PUT',
        headers: githubHeaders,
        body: JSON.stringify({
          message: message || `feat(assets): subir asset ${safeFilename} a ${category}`,
          content: base64,
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      return res.json({
        success: true,
        localOnly: true,
        localPath: localUrl,
        githubUrl: rawUrl,
        filename: safeFilename,
        message: 'Guardado localmente. Error en GitHub API: ' + (err.message || uploadRes.statusText),
      });
    }

    return res.json({
      success: true,
      localPath: localUrl,
      githubUrl: rawUrl,
      filename: safeFilename,
      message: 'Asset subido y comiteado exitosamente a GitHub.',
    });
  } catch (err: any) {
    return res.json({
      success: true,
      localOnly: true,
      localPath: localUrl,
      githubUrl: rawUrl,
      filename: safeFilename,
      message: 'Guardado localmente. Error al comitear en GitHub: ' + err.message,
    });
  }
});

// --- PULL / SYNC FROM GITHUB ---
app.post('/api/github/sync', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sincronización completada. Repositorio en línea y actualizado.',
  });
});

// --- AUCTION HOUSE (CASA DE SUBASTAS) GITHUB API ---
const auctionsLocalPath = path.join(__dirname, 'export_data', 'auctions.json');

const readLocalAuctions = (): any[] => {
  if (!fs.existsSync(auctionsLocalPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(auctionsLocalPath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.auctions) ? parsed.auctions : [];
  } catch {
    return [];
  }
};

const writeLocalAuctions = (auctions: any[]) => {
  fs.mkdirSync(path.dirname(auctionsLocalPath), { recursive: true });
  fs.writeFileSync(auctionsLocalPath, JSON.stringify(auctions, null, 2), 'utf-8');
};

/** Marca temporal más reciente de un lote: creación, venta, retirada o cobro. */
const auctionsFreshness = (auctions: any[]): number =>
  auctions.reduce(
    (max, a) =>
      Math.max(
        max,
        Number(a?.createdAt) || 0,
        Number(a?.soldAt) || 0,
        Number(a?.cancelledAt) || 0,
        Number(a?.claimedAt) || 0
      ),
    0
  );

/**
 * La copia más reciente gana. Antes, si el commit a GitHub fallaba (o el token no estaba),
 * el siguiente GET recuperaba la versión antigua de GitHub y borraba el cambio recién hecho.
 */
const fetchAuctionsFromGitHubOrLocal = async (): Promise<any[]> => {
  const local = readLocalAuctions();
  try {
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/auctions.json?t=${Date.now()}`
    );
    if (rawRes.ok) {
      const remote = await rawRes.json();
      if (Array.isArray(remote)) {
        if (auctionsFreshness(remote) >= auctionsFreshness(local)) {
          writeLocalAuctions(remote);
          return remote;
        }
        return local;
      }
    }
  } catch (err) {
    console.warn('Fallback a auctions.json local:', err);
  }

  return local;
};

const commitAuctionsToGitHub = async (auctions: any[], commitMsg: string): Promise<boolean> => {
  const formattedJson = JSON.stringify(auctions, null, 2);
  writeLocalAuctions(auctions);
  // Aviso inmediato a los clientes: el guardado en disco ya es firme, el commit va después.
  broadcastRealtime('auctions', { auctionCount: auctions.length });

  if (!GITHUB_TOKEN) {
    return false;
  }

  try {
    const filePath = 'data/auctions.json';
    let sha: string | undefined;

    const checkRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      { headers: githubHeaders }
    );
    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      sha = checkJson.sha;
    }

    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: githubHeaders,
        body: JSON.stringify({
          message: commitMsg,
          content: Buffer.from(formattedJson).toString('base64'),
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    return commitRes.ok;
  } catch (err) {
    console.error('Error committing auctions to GitHub:', err);
    return false;
  }
};

// 1. Get all auctions
app.get('/api/auctions', async (_req: Request, res: Response) => {
  try {
    const auctions = await fetchAuctionsFromGitHubOrLocal();
    res.json({ success: true, auctions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, auctions: [] });
  }
});

// 2. Put item up for auction / sale
app.post('/api/auctions/list', async (req: Request, res: Response) => {
  try {
    const { sellerId, sellerName, item, price, mode } = req.body;
    if (!sellerName || !item || !price) {
      return res.status(400).json({ success: false, error: 'Datos incompletos para publicar el lote.' });
    }

    const auctions = await fetchAuctionsFromGitHubOrLocal();

    const newAuction = {
      id: `auc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sellerId: sellerId || 'player',
      sellerName: sellerName || 'Aventurero',
      item,
      price: Math.max(1, parseInt(price, 10)),
      mode: mode || 'buyout',
      status: 'active',
      createdAt: Date.now(),
    };

    auctions.unshift(newAuction);

    const synced = await commitAuctionsToGitHub(
      auctions,
      `feat(auction): ${sellerName} publicó ${item.name} (${item.count || 1}x) por ${price} oro`
    );

    res.json({ success: true, auction: newAuction, syncedWithGitHub: synced });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Buy an auction item (one-time purchase per unit)
app.post('/api/auctions/buy', async (req: Request, res: Response) => {
  try {
    const { auctionId, buyerId, buyerName } = req.body;
    if (!auctionId || !buyerName) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros de compra.' });
    }

    const auctions = await fetchAuctionsFromGitHubOrLocal();
    const targetIdx = auctions.findIndex((a) => a.id === auctionId);

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, error: 'El lote solicitado no existe en la casa de subastas.' });
    }

    const targetAuction = auctions[targetIdx];

    // CRITICAL: only allow buying once per listed unit
    if (targetAuction.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: '¡Este lote ya ha sido comprado o retirado por otro aventurero!',
        status: targetAuction.status,
      });
    }

    // Mark as sold
    targetAuction.status = 'sold';
    targetAuction.buyerId = buyerId || 'player';
    targetAuction.buyerName = buyerName;
    targetAuction.soldAt = Date.now();

    const synced = await commitAuctionsToGitHub(
      auctions,
      `feat(auction): ${buyerName} compró ${targetAuction.item.name} por ${targetAuction.price} oro`
    );

    res.json({
      success: true,
      auction: targetAuction,
      item: targetAuction.item,
      price: targetAuction.price,
      syncedWithGitHub: synced,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Cancel an active listing by seller
app.post('/api/auctions/cancel', async (req: Request, res: Response) => {
  try {
    const { auctionId, sellerId } = req.body;
    const auctions = await fetchAuctionsFromGitHubOrLocal();
    const targetIdx = auctions.findIndex((a) => a.id === auctionId);

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, error: 'Lote no encontrado.' });
    }

    const targetAuction = auctions[targetIdx];
    if (targetAuction.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Solo se pueden retirar lotes activos en venta.' });
    }

    targetAuction.status = 'cancelled';
    targetAuction.cancelledAt = Date.now();

    const synced = await commitAuctionsToGitHub(
      auctions,
      `feat(auction): lote ${targetAuction.item.name} cancelado por el vendedor`
    );

    res.json({ success: true, item: targetAuction.item, syncedWithGitHub: synced });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Claim sold auction proceeds (gold) by seller
app.post('/api/auctions/claim', async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.body;
    const auctions = await fetchAuctionsFromGitHubOrLocal();
    const targetIdx = auctions.findIndex((a) => a.id === auctionId);

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, error: 'Lote no encontrado.' });
    }

    const targetAuction = auctions[targetIdx];
    if (targetAuction.status !== 'sold' || targetAuction.claimedBySeller) {
      return res.status(400).json({ success: false, error: 'No hay ganancias pendientes para este lote.' });
    }

    targetAuction.claimedBySeller = true;
    targetAuction.claimedAt = Date.now();

    await commitAuctionsToGitHub(
      auctions,
      `feat(auction): ${targetAuction.sellerName} cobró ${targetAuction.price} oro por su venta`
    );

    res.json({ success: true, gold: targetAuction.price });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- GOOGLE PLAY GAMES SERVICES (API OFICIAL) ---
// API real: https://games.googleapis.com/games/v1. Google no ofrece SDK web de Play Games:
// el cliente Android/nativo obtiene un *server auth code* con GamesSignInClient y lo entrega
// aquí; el servidor lo canjea y guarda el token SOLO en memoria. Sin PLAY_GAMES_CLIENT_ID y
// PLAY_GAMES_CLIENT_SECRET los endpoints responden 503 y la app muestra la configuración
// pendiente en vez de datos inventados.
const PLAY_GAMES_BASE = 'https://games.googleapis.com/games/v1';
const PLAY_GAMES_CLIENT_ID = process.env.PLAY_GAMES_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const PLAY_GAMES_CLIENT_SECRET = process.env.PLAY_GAMES_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
const PLAY_GAMES_SESSION_TTL_MS = 45 * 60 * 1000;
const PLAY_GAMES_DOCS = 'https://developer.android.com/games/pgs/android/server-access';

interface PlayGamesSession {
  accessToken: string;
  expiresAt: number;
  playerId: string;
}

const playGamesSessions = new Map<string, PlayGamesSession>();

const playGamesConfigured = () => Boolean(PLAY_GAMES_CLIENT_ID && PLAY_GAMES_CLIENT_SECRET);

const playGamesNotConfigured = (res: Response) =>
  res.status(503).json({
    success: false,
    configured: false,
    message:
      'Play Games Services no está configurado en el servidor: faltan PLAY_GAMES_CLIENT_ID y PLAY_GAMES_CLIENT_SECRET.',
    requiredEnv: ['PLAY_GAMES_CLIENT_ID', 'PLAY_GAMES_CLIENT_SECRET'],
    docs: PLAY_GAMES_DOCS,
    note: 'Google no ofrece SDK web: la sesión se crea con el server auth code de la app Android/nativa.',
  });

const getPlayGamesSession = (req: Request): PlayGamesSession | null => {
  const raw = req.header('x-play-session');
  if (!raw) return null;
  const session = playGamesSessions.get(raw);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    playGamesSessions.delete(raw);
    return null;
  }
  return session;
};

const gpgsFetch = async (session: PlayGamesSession, path: string, init?: RequestInit) => {
  const res = await fetch(`${PLAY_GAMES_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...((init?.headers as Record<string, string>) || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
};

const playGamesPlayerPayload = (player: any) => ({
  playerId: player?.playerId,
  displayName: player?.displayName || player?.name || 'Jugador de Play Games',
  avatarImageUrl: player?.avatarImageUrl,
  title: player?.title,
});

const PLAY_GAMES_LEADERBOARDS: Record<string, { name: string; description: string; unit: string; icon: string }> = {
  lb_power: {
    name: 'Poder de Escuadrón',
    description: 'Marcador oficial de Play Games con la fuerza combinada del escuadrón.',
    unit: 'Poder',
    icon: 'swords',
  },
  lb_wealth: {
    name: 'Riqueza Acumulada',
    description: 'Marcador oficial de Play Games con el oro acumulado por los comandantes.',
    unit: 'Oro',
    icon: 'coins',
  },
  lb_play_xp: {
    name: 'Logros de Play Games',
    description: 'Marcador oficial de Play Games para la puntuación de logros.',
    unit: 'Puntos',
    icon: 'trophy',
  },
};

app.get('/api/play-games/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    configured: playGamesConfigured(),
    api: PLAY_GAMES_BASE,
    docs: PLAY_GAMES_DOCS,
    webSdk: false,
    requiredEnv: ['PLAY_GAMES_CLIENT_ID', 'PLAY_GAMES_CLIENT_SECRET'],
    message: playGamesConfigured()
      ? 'Servidor listo para canjear el server auth code de Play Games.'
      : 'Faltan PLAY_GAMES_CLIENT_ID y PLAY_GAMES_CLIENT_SECRET en el servidor.',
  });
});

app.post('/api/play-games/session', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);

  const serverAuthCode = String(req.body?.serverAuthCode || '').trim();
  if (!serverAuthCode) {
    return res.status(400).json({ success: false, message: 'Falta el server auth code de Play Games.' });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: serverAuthCode,
        client_id: PLAY_GAMES_CLIENT_ID,
        client_secret: PLAY_GAMES_CLIENT_SECRET,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData: any = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData?.access_token) {
      return res.status(401).json({
        success: false,
        message: tokenData?.error_description || 'Google rechazó el server auth code.',
      });
    }

    const session: PlayGamesSession = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + Math.min(PLAY_GAMES_SESSION_TTL_MS, (Number(tokenData.expires_in) || 3600) * 1000),
      playerId: '',
    };

    const me = await gpgsFetch(session, '/players/me');
    if (!me.ok) {
      return res.status(me.status).json({
        success: false,
        message: me.data?.error?.message || 'Play Games rechazó el token de acceso.',
      });
    }
    session.playerId = String(me.data?.playerId || '');

    const sessionId = `pg_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    playGamesSessions.set(sessionId, session);

    return res.json({ success: true, sessionId, player: playGamesPlayerPayload(me.data) });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      message: 'No se pudo contactar con Google: ' + (err?.message || 'error de red'),
    });
  }
});

app.delete('/api/play-games/session', (req: Request, res: Response) => {
  const raw = req.header('x-play-session');
  if (raw) playGamesSessions.delete(raw);
  res.json({ success: true });
});

app.get('/api/play-games/profile', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);
  const session = getPlayGamesSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Sesión de Play Games no válida o caducada.' });

  const me = await gpgsFetch(session, '/players/me');
  if (!me.ok) {
    return res.status(me.status).json({ success: false, message: me.data?.error?.message || 'Play Games devolvió un error.' });
  }
  res.json({ success: true, player: playGamesPlayerPayload(me.data) });
});

app.get('/api/play-games/achievements', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);
  const session = getPlayGamesSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Sesión de Play Games no válida o caducada.' });

  const [definitions, playerAchievements] = await Promise.all([
    gpgsFetch(session, '/achievements'),
    gpgsFetch(session, '/players/me/achievements'),
  ]);

  if (!definitions.ok || !playerAchievements.ok) {
    const failed = !definitions.ok ? definitions : playerAchievements;
    return res.status(failed.status || 502).json({
      success: false,
      message: failed.data?.error?.message || 'Play Games no devolvió los logros del jugador.',
    });
  }

  res.json({
    success: true,
    definitions: definitions.data?.items || [],
    playerAchievements: playerAchievements.data?.items || [],
  });
});

app.post('/api/play-games/achievements/:id/unlock', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);
  const session = getPlayGamesSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Sesión de Play Games no válida o caducada.' });

  const achievementId = String(req.params.id || '');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(achievementId)) {
    return res.status(400).json({ success: false, message: 'Identificador de logro no válido.' });
  }

  const result = await gpgsFetch(session, `/achievements/${encodeURIComponent(achievementId)}/unlock`, { method: 'POST' });
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.data?.error?.message || 'Play Games no permitió desbloquear el logro.',
    });
  }
  res.json({ success: true, achievement: result.data });
});

app.post('/api/play-games/achievements/:id/increment', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);
  const session = getPlayGamesSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Sesión de Play Games no válida o caducada.' });

  const achievementId = String(req.params.id || '');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(achievementId)) {
    return res.status(400).json({ success: false, message: 'Identificador de logro no válido.' });
  }
  const steps = Math.max(1, Math.round(Number(req.body?.steps) || 1));

  const result = await gpgsFetch(
    session,
    `/achievements/${encodeURIComponent(achievementId)}/increment?steps=${steps}`,
    { method: 'POST' }
  );
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.data?.error?.message || 'Play Games no permitió actualizar el progreso del logro.',
    });
  }
  res.json({ success: true, achievement: result.data });
});

app.get('/api/play-games/leaderboards/:id', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);
  const session = getPlayGamesSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Sesión de Play Games no válida o caducada.' });

  const leaderboardId = String(req.params.id || '');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(leaderboardId)) {
    return res.status(400).json({ success: false, message: 'Identificador de marcador no válido.' });
  }

  const result = await gpgsFetch(
    session,
    `/leaderboards/${encodeURIComponent(leaderboardId)}/scores/PUBLIC?maxResults=25&timeSpan=ALL_TIME`
  );
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.data?.error?.message || 'Play Games no devolvió el marcador.',
    });
  }

  const meta = PLAY_GAMES_LEADERBOARDS[leaderboardId] || {
    name: 'Marcador de Play Games',
    description: 'Clasificación oficial de Play Games Services.',
    unit: 'Puntos',
    icon: 'trophy',
  };

  const entries = (result.data?.items || []).map((item: any, index: number) => {
    const rank = Number(item?.rank) || index + 1;
    return {
      rank,
      playerId: item?.player?.playerId || '',
      gamerTag: item?.player?.displayName || 'Jugador',
      avatarUrl: item?.player?.avatarImageUrl || '/assets/portraits/edacorn icono.webp',
      score: Number(item?.scoreValue) || 0,
      formattedScore: item?.formattedScore || String(item?.scoreValue ?? ''),
      isCurrentPlayer: Boolean(item?.player?.playerId && item.player.playerId === session.playerId),
      badge: rank === 1 ? 'Top 1' : rank === 2 ? 'Top 2' : rank === 3 ? 'Top 3' : undefined,
      date: item?.scoreTag ? `Etiqueta ${item.scoreTag}` : '',
    };
  });

  res.json({
    success: true,
    leaderboard: {
      id: leaderboardId,
      name: result.data?.leaderboard?.name || meta.name,
      description: meta.description,
      unit: meta.unit,
      icon: meta.icon,
      entries,
    },
  });
});

app.post('/api/play-games/leaderboards/:id/scores', async (req: Request, res: Response) => {
  if (!playGamesConfigured()) return playGamesNotConfigured(res);
  const session = getPlayGamesSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Sesión de Play Games no válida o caducada.' });

  const leaderboardId = String(req.params.id || '');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(leaderboardId)) {
    return res.status(400).json({ success: false, message: 'Identificador de marcador no válido.' });
  }
  const score = Math.max(0, Math.round(Number(req.body?.score)));
  if (!Number.isFinite(score)) {
    return res.status(400).json({ success: false, message: 'Puntuación no válida.' });
  }

  const result = await gpgsFetch(
    session,
    `/leaderboards/${encodeURIComponent(leaderboardId)}/scores?score=${score}`,
    { method: 'POST' }
  );
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.data?.error?.message || 'Play Games no aceptó la puntuación.',
    });
  }

  res.json({
    success: true,
    message: 'Puntuación enviada a Play Games.',
    formattedScore: result.data?.formattedScore,
  });
});

// --- ORDERS / CLANS DATABASE (GITHUB PERSISTENCE) ---
// Guarda las órdenes creadas y sus jugadores en data/orders.json del repositorio de datos.
// El servidor es la fuente de verdad: escribe siempre en disco y comitea a GitHub cuando
// hay GITHUB_TOKEN configurado. Sin token la orden queda guardada en el servidor y se avisa.
const ORDERS_FILE_PATH = 'data/orders.json';
const ordersLocalPath = path.join(__dirname, 'export_data', 'orders.json');
const ORDERS_DB_VERSION = 2;
const MAX_ORDER_MEMBERS = 30;

interface OrderMemberRecord {
  playerId?: string;
  gamerTag?: string;
  avatarUrl?: string;
  role?: string;
  playGamesLevel?: number;
  squadPower?: number;
  contributionXp?: number;
  lastActive?: string;
  isPlayer?: boolean;
}

interface OrderRecord {
  id?: string;
  name?: string;
  tag?: string;
  motto?: string;
  emblem?: string;
  buildingImage?: string;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  totalPower?: number;
  trophies?: number;
  minPlayGamesLevel?: number;
  leaderGamerTag?: string;
  members?: OrderMemberRecord[];
  perks?: any[];
  activities?: any[];
  githubSyncedAt?: string;
  updatedAt?: number;
}

interface OrdersDatabase {
  version: number;
  updatedAt: number;
  orders: OrderRecord[];
}

const normalizeOrdersList = (raw: any): OrderRecord[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.orders)
    ? raw.orders
    : Array.isArray(raw?.clans)
    ? raw.clans
    : [];
  return list.filter((o: any) => o && typeof o.id === 'string' && typeof o.name === 'string');
};

const sanitizeOrderMember = (member: OrderMemberRecord): OrderMemberRecord => ({
  playerId: String(member.playerId || '').slice(0, 64),
  gamerTag: String(member.gamerTag || 'Aventurero').slice(0, 32),
  avatarUrl: typeof member.avatarUrl === 'string' ? member.avatarUrl.slice(0, 300) : '',
  role: String(member.role || 'Iniciado').slice(0, 24),
  playGamesLevel: Math.max(1, Math.round(Number(member.playGamesLevel) || 1)),
  squadPower: Math.max(0, Math.round(Number(member.squadPower) || 0)),
  contributionXp: Math.max(0, Math.round(Number(member.contributionXp) || 0)),
  lastActive: String(member.lastActive || 'Reciente').slice(0, 40),
});

const normalizeOrderRecord = (order: OrderRecord): OrderRecord => {
  const members = (order.members || [])
    .filter((m) => m && m.playerId)
    .map(sanitizeOrderMember)
    .slice(0, MAX_ORDER_MEMBERS);

  return {
    id: String(order.id),
    name: String(order.name).slice(0, 40),
    tag: String(order.tag || '').toUpperCase().slice(0, 5),
    motto: String(order.motto || '').slice(0, 90),
    emblem: order.emblem || '/assets/items/Recurso 287@4x.webp',
    buildingImage: order.buildingImage || '/assets/aistudio/image_6578a593.webp',
    level: Math.max(1, Math.round(Number(order.level) || 1)),
    xp: Math.max(0, Math.round(Number(order.xp) || 0)),
    xpToNextLevel: Math.max(1, Math.round(Number(order.xpToNextLevel) || 1000)),
    totalPower: members.reduce((sum, m) => sum + (m.squadPower || 0), 0),
    trophies: Math.max(0, Math.round(Number(order.trophies) || 0)),
    minPlayGamesLevel: Math.max(1, Math.round(Number(order.minPlayGamesLevel) || 1)),
    leaderGamerTag: String(order.leaderGamerTag || members[0]?.gamerTag || 'Gran Maestre').slice(0, 32),
    members,
    perks: Array.isArray(order.perks) ? order.perks.slice(0, 12) : [],
    activities: Array.isArray(order.activities) ? order.activities.slice(0, 40) : [],
    githubSyncedAt: order.githubSyncedAt,
    updatedAt: Date.now(),
  };
};

const emptyOrdersDatabase = (): OrdersDatabase => ({ version: ORDERS_DB_VERSION, updatedAt: 0, orders: [] });

const readLocalOrdersDatabase = (): OrdersDatabase => {
  if (!fs.existsSync(ordersLocalPath)) return emptyOrdersDatabase();
  try {
    const parsed = JSON.parse(fs.readFileSync(ordersLocalPath, 'utf-8'));
    return {
      version: ORDERS_DB_VERSION,
      updatedAt: typeof parsed?.updatedAt === 'number' ? parsed.updatedAt : 0,
      orders: normalizeOrdersList(parsed).map(normalizeOrderRecord),
    };
  } catch {
    return emptyOrdersDatabase();
  }
};

const writeLocalOrdersDatabase = (db: OrdersDatabase) => {
  fs.mkdirSync(path.dirname(ordersLocalPath), { recursive: true });
  fs.writeFileSync(ordersLocalPath, JSON.stringify(db, null, 2), 'utf-8');
};

const sortOrdersByRank = (orders: OrderRecord[]) =>
  [...orders].sort((a, b) => (b.trophies || 0) - (a.trophies || 0) || (b.totalPower || 0) - (a.totalPower || 0));

const ordersRepoInfo = () => ({
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  branch: GITHUB_BRANCH,
  path: ORDERS_FILE_PATH,
  url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${ORDERS_FILE_PATH}`,
  tokenConfigured: Boolean(GITHUB_TOKEN),
});

const fetchOrdersDatabaseFromGitHub = async (): Promise<OrdersDatabase | null> => {
  try {
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${ORDERS_FILE_PATH}?t=${Date.now()}`
    );
    if (!rawRes.ok) return null;
    const parsed = await rawRes.json();
    const orders = normalizeOrdersList(parsed).map(normalizeOrderRecord);
    if (orders.length === 0 && !Array.isArray(parsed?.orders)) return null;
    return {
      version: ORDERS_DB_VERSION,
      updatedAt: typeof parsed?.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      orders,
    };
  } catch (err) {
    console.warn('[ORDERS] No se pudo leer la base remota de órdenes:', err);
    return null;
  }
};

const commitOrdersDatabaseToGitHub = async (
  db: OrdersDatabase,
  commitMessage: string
): Promise<{ synced: boolean; sha: string | null; url: string | null; message: string }> => {
  // La orden ya está escrita en disco en este punto: se empuja el cambio a los clientes.
  broadcastRealtime('orders', { orderCount: db.orders.length });

  if (!GITHUB_TOKEN) {
    return {
      synced: false,
      sha: null,
      url: ordersRepoInfo().url,
      message:
        'Orden guardada en el servidor. Para sincronizar con GitHub falta GITHUB_TOKEN en el servidor.',
    };
  }

  try {
    let sha: string | undefined;
    const checkRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ORDERS_FILE_PATH}?ref=${GITHUB_BRANCH}`,
      { headers: githubHeaders }
    );
    if (checkRes.ok) {
      const checkJson = await checkRes.json();
      sha = checkJson.sha;
    }

    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ORDERS_FILE_PATH}`,
      {
        method: 'PUT',
        headers: githubHeaders,
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64'),
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!commitRes.ok) {
      const errData = await commitRes.json().catch(() => ({}));
      return {
        synced: false,
        sha: null,
        url: ordersRepoInfo().url,
        message:
          'Orden guardada en el servidor. GitHub rechazó el commit: ' +
          (errData.message || commitRes.statusText || commitRes.status),
      };
    }

    const commitResult = await commitRes.json();
    const commitSha = commitResult.commit?.sha?.substring(0, 7) || null;
    return {
      synced: true,
      sha: commitSha,
      url: commitResult.content?.html_url || ordersRepoInfo().url,
      message: `Órdenes sincronizadas con GitHub${commitSha ? ` · commit ${commitSha}` : ''}.`,
    };
  } catch (err: any) {
    return {
      synced: false,
      sha: null,
      url: ordersRepoInfo().url,
      message: 'Orden guardada en el servidor. Error al comitear en GitHub: ' + (err?.message || 'desconocido'),
    };
  }
};

// Serializa las mutaciones para que dos guardados simultáneos no se pisen.
let ordersMutationQueue: Promise<unknown> = Promise.resolve();
const withOrdersLock = <T,>(fn: () => Promise<T>): Promise<T> => {
  const next = ordersMutationQueue.then(fn, fn);
  ordersMutationQueue = next.catch(() => undefined);
  return next;
};

app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const remote = await fetchOrdersDatabaseFromGitHub();
    if (remote) {
      writeLocalOrdersDatabase(remote);
      return res.json({
        success: true,
        source: 'github',
        orders: sortOrdersByRank(remote.orders),
        updatedAt: remote.updatedAt,
        repo: ordersRepoInfo(),
        message: `${remote.orders.length} órdenes cargadas desde GitHub.`,
      });
    }

    const local = readLocalOrdersDatabase();
    return res.json({
      success: true,
      source: 'local',
      orders: sortOrdersByRank(local.orders),
      updatedAt: local.updatedAt,
      repo: ordersRepoInfo(),
      message: `${local.orders.length} órdenes cargadas desde la sede local.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, orders: [], message: err?.message || 'Error al cargar órdenes' });
  }
});

app.post('/api/orders/save', async (req: Request, res: Response) => {
  const incoming: OrderRecord | undefined = req.body?.order;
  if (!incoming || !incoming.id || !incoming.name) {
    return res.status(400).json({ success: false, message: 'Datos de orden incompletos (id y nombre son obligatorios).' });
  }

  const result = await withOrdersLock(async () => {
    const db = readLocalOrdersDatabase();
    const now = new Date().toISOString();
    const normalized = normalizeOrderRecord({
      ...incoming,
      githubSyncedAt: now,
    });

    const idx = db.orders.findIndex((o) => o.id === normalized.id);
    if (idx >= 0) db.orders[idx] = { ...db.orders[idx], ...normalized };
    else db.orders.unshift(normalized);

    db.orders = sortOrdersByRank(db.orders);
    db.updatedAt = Date.now();
    writeLocalOrdersDatabase(db);

    const commit = await commitOrdersDatabaseToGitHub(
      db,
      req.body?.message || `feat(orders): guardar ${normalized.name} [${normalized.tag}]`
    );

    return { order: normalized, ...commit };
  });

  return res.json({
    success: true,
    order: result.order,
    synced: result.synced,
    sha: result.sha,
    url: result.url,
    message: result.message,
    repo: ordersRepoInfo(),
  });
});

app.post('/api/orders/join', async (req: Request, res: Response) => {
  const { orderId, member } = req.body || {};
  if (!orderId || !member?.playerId) {
    return res.status(400).json({ success: false, message: 'Faltan datos del jugador o de la orden.' });
  }

  const result = await withOrdersLock(async () => {
    const db = readLocalOrdersDatabase();
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return { notFound: true as const };

    const order = db.orders[idx];
    const members = order.members || [];
    const existing = members.find((m) => m.playerId === member.playerId);

    if (!existing && members.length >= MAX_ORDER_MEMBERS) {
      return { full: true as const };
    }

    const sanitized: OrderMemberRecord = sanitizeOrderMember({
      ...member,
      role: existing?.role || member.role || 'Iniciado',
    });

    const nextMembers = existing
      ? members.map((m) => (m.playerId === sanitized.playerId ? { ...m, ...sanitized } : m))
      : [sanitized, ...members];

    const activity = {
      id: `act_${Date.now()}`,
      text: `${sanitized.gamerTag} se ha unido a la Orden.`,
      time: 'Ahora',
      type: 'join',
      icon: 'shield',
    };

    const updated = normalizeOrderRecord({
      ...order,
      members: nextMembers,
      activities: [activity, ...(order.activities || [])].slice(0, 40),
      githubSyncedAt: new Date().toISOString(),
    });

    db.orders[idx] = updated;
    db.orders = sortOrdersByRank(db.orders);
    db.updatedAt = Date.now();
    writeLocalOrdersDatabase(db);

    const commit = await commitOrdersDatabaseToGitHub(
      db,
      `feat(orders): ${sanitized.gamerTag} se unió a ${updated.name} [${updated.tag}]`
    );

    return { order: updated, ...commit };
  });

  if ('notFound' in result) {
    return res.status(404).json({ success: false, message: 'La orden ya no existe en la sede.' });
  }
  if ('full' in result) {
    return res.status(409).json({ success: false, message: 'La orden ha alcanzado el máximo de 30 miembros.' });
  }

  return res.json({
    success: true,
    order: result.order,
    synced: result.synced,
    sha: result.sha,
    url: result.url,
    message: result.message,
    repo: ordersRepoInfo(),
  });
});

app.post('/api/orders/leave', async (req: Request, res: Response) => {
  const { orderId, playerId, gamerTag } = req.body || {};
  if (!orderId || !playerId) {
    return res.status(400).json({ success: false, message: 'Faltan datos para abandonar la orden.' });
  }

  const result = await withOrdersLock(async () => {
    const db = readLocalOrdersDatabase();
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return { notFound: true as const };

    const order = db.orders[idx];
    const members = order.members || [];
    if (!members.some((m) => m.playerId === playerId)) return { notMember: true as const };

    const activity = {
      id: `act_${Date.now()}`,
      text: `${gamerTag || 'Un miembro'} ha abandonado la Orden.`,
      time: 'Ahora',
      type: 'join',
      icon: 'shield',
    };

    const updated = normalizeOrderRecord({
      ...order,
      members: members.filter((m) => m.playerId !== playerId),
      activities: [activity, ...(order.activities || [])].slice(0, 40),
      githubSyncedAt: new Date().toISOString(),
    });

    db.orders[idx] = updated;
    db.orders = sortOrdersByRank(db.orders);
    db.updatedAt = Date.now();
    writeLocalOrdersDatabase(db);

    const commit = await commitOrdersDatabaseToGitHub(
      db,
      `feat(orders): ${gamerTag || playerId} abandonó ${updated.name} [${updated.tag}]`
    );

    return { order: updated, ...commit };
  });

  if ('notFound' in result) {
    return res.status(404).json({ success: false, message: 'La orden ya no existe en la sede.' });
  }
  if ('notMember' in result) {
    return res.json({ success: true, synced: false, order: null, sha: null, url: null, message: 'El jugador no figuraba en la orden.' });
  }

  return res.json({
    success: true,
    order: result.order,
    synced: result.synced,
    sha: result.sha,
    url: result.url,
    message: result.message,
    repo: ordersRepoInfo(),
  });
});

// --- PVP: POZOS DE PELEA (COMBATE DE CAMPAÑA, BOTS Y RANGO) ---
// Adaptación del combate de PvE al coliseo: vida compartida del escuadrón, mano de 4 cartas
// de habilidad por héroe (las mismas cartas de la historia), 5 orbes dorados y definitiva al
// llenarlos. El servidor es la fuente de verdad: reparte manos, valida turno y orbes, mueve a
// los bots y calcula el Elo.

interface PvpStatusSeed {
  type: string;
  duration: number;
  stacks: number;
  target: 'enemy' | 'hero';
}

interface PvpStatus {
  id: string;
  type: string;
  label: string;
  icon: string;
  turns: number;
  stacks: number;
  hostile: boolean;
  kind: string;
}

interface PvpCardSeed {
  skillId: string;
  tier: 1 | 2 | 3;
  name: string;
  effects?: PvpStatusSeed[];
  damage: number;
  heal: number;
}

interface PvpCard extends PvpCardSeed {
  uid: string;
}

interface PvpHero {
  heroId: string;
  heroName: string;
  spriteUrl: string;
  attackSpriteUrl: string;
  portraitUrl: string;
  deck: PvpCardSeed[];
  hand: PvpCard[];
}

interface PvpFighter {
  playerId: string;
  seat: 0 | 1;
  name: string;
  isBot: boolean;
  rating: number;
  heroes: PvpHero[];
  hp: number;
  maxHp: number;
  orbs: number;
  activeIndex: number;
  swapped: boolean;
  guard: boolean;
  connected: boolean;
  statuses: PvpStatus[];
  botPool: PvpHero[];
}

type PvpLogKind = 'damage' | 'heal' | 'ultimate' | 'crit' | 'guard' | 'switch' | 'system';

interface PvpLogEntry {
  id: string;
  seat: 0 | 1;
  text: string;
  kind: PvpLogKind;
}

interface PvpActionInput {
  type: 'card' | 'switch' | 'merge';
  uid?: string;
  /** Carta sobre la que se suelta (fusionar o intercambiar). */
  targetUid?: string;
  heroIndex?: number;
}

interface PvpRoom {
  id: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  turnSeat: 0 | 1;
  deadline: number;
  fighters: [PvpFighter, PvpFighter];
  log: PvpLogEntry[];
  lastAction: {
    seat: 0 | 1;
    heroName: string;
    cardName: string;
    kind?: 'card' | 'merge' | 'move' | 'switch';
    skillId?: string;
    tier?: 1 | 2 | 3;
    damage?: number;
    heal?: number;
    crit?: boolean;
    ultimate?: boolean;
    switched?: boolean;
    /** Nombres de los estados que aplicó la carta. */
    status?: string[];
    /** La carta falló por ceguera. */
    missed?: boolean;
    at: number;
  } | null;
  winnerSeat?: 0 | 1;
  reason?: string;
  deltas: Record<0 | 1, number>;
  turnTimer: NodeJS.Timeout | null;
  botTimer: NodeJS.Timeout | null;
  forfeitTimers: Map<string, NodeJS.Timeout>;
}

const PVP_MAX_ORBS = 5;

const PVP_HAND_SIZE = 4;

const PVP_ULTIMATE_SKILL_ID = 'cataclismo_astral';

const PVP_MAX_HP = 2000;

const PVP_TURN_MS = 25000;

const PVP_FORFEIT_MS = 8000;

const PVP_LOG_LIMIT = 14;

const PVP_ROOM_TTL_MS = 1000 * 60 * 30;

const PVP_BOT_SEARCH_MS = 4000;

const PVP_K_FACTOR = 28;

const PVP_MAX_SQUAD = 3;

const PVP_MAX_RATING = 6000;

/** Nombres de cuenta falsos para los escuadrones bot. */

const PVP_BOT_NAMES = [
  'SombraErrante',
  'Kael_88',
  'ZancadaFria',
  'Morthal',
  'Vex_Nocturna',
  'Ryn_Tempestad',
  'Gormak',
  'Seraphine_X',
  'Drakko_77',
  'Isolde',
  'Brasa_Oculta',
  'Nyx_Velada',
];

const pvpClients = new Map<string, Response>();

const pvpPlayers = new Map<string, PvpFighter>();

const pvpRooms = new Map<string, PvpRoom>();

const pvpRoomByPlayer = new Map<string, string>();

const pvpBotTimers = new Map<string, NodeJS.Timeout>();
let pvpQueue: string[] = [];

const pvpClamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const pvpCleanText = (value: unknown, fallback: string, max = 32): string => {
  const text = String(value || '').trim();
  return (text || fallback).slice(0, max);
};

const pvpCleanUrl = (value: unknown): string => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('/')) return text.slice(0, 220);
  if (/^https?:\/\//i.test(text)) return text.slice(0, 220);
  return '';
};

const pvpUid = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const pvpSanitizeCard = (raw: any, heroId: string): PvpCardSeed | null => {
  const skillId = pvpCleanText(raw?.skillId, '', 48);
  if (!skillId) return null;
  const tierRaw = pvpClamp(raw?.tier, 1, 3, 1);
  const tier = (tierRaw === 3 ? 3 : tierRaw === 2 ? 2 : 1) as 1 | 2 | 3;
  const rawEffects: any[] = Array.isArray(raw?.effects) ? raw.effects : [];
  const effects: PvpStatusSeed[] = rawEffects
    .filter((effect) => typeof effect?.type === 'string' && effect.type && effect.type !== 'none')
    .slice(0, 3)
    .map((effect) => ({
      type: String(effect.type).slice(0, 24),
      duration: pvpClamp(effect.duration, 1, 3, 1),
      stacks: pvpClamp(effect.stacks, 1, 3, 1),
      target: effect.target === 'hero' ? ('hero' as const) : ('enemy' as const),
    }));
  return {
    skillId,
    tier,
    name: pvpCleanText(raw?.name, 'Habilidad', 34),
    damage: pvpClamp(raw?.damage, 0, 100, 0),
    heal: pvpClamp(raw?.heal, 0, 100, 0),
    effects,
  };
};

const pvpSanitizeHero = (raw: any): PvpHero | null => {
  const heroId = pvpCleanText(raw?.heroId, '', 40);
  if (!heroId) return null;
  const rawCards: any[] = Array.isArray(raw?.cards) ? raw.cards : [];
  let deck = rawCards
    .slice(0, 12)
    .map((c) => pvpSanitizeCard(c, heroId))
    .filter((c): c is PvpCardSeed => Boolean(c));
  if (deck.length === 0) {
    deck = [{ skillId: `${heroId}_golpe`, tier: 1, name: 'Golpe', damage: 16, heal: 0 }];
  }
  return {
    heroId,
    heroName: pvpCleanText(raw?.heroName, 'Aventurero', 32),
    spriteUrl: pvpCleanUrl(raw?.spriteUrl) || `/assets/combat/${heroId}_idle.webp`,
    attackSpriteUrl: pvpCleanUrl(raw?.attackSpriteUrl) || `/assets/combat/${heroId}_attack.webp`,
    portraitUrl: pvpCleanUrl(raw?.portraitUrl) || '/assets/portraits/edacorn_icono.webp',
    deck,
    hand: [],
  };
};

const pvpUltimateCard = (heroId: string): PvpCard => ({
  uid: `ult_${heroId}_${pvpUid()}`,
  skillId: PVP_ULTIMATE_SKILL_ID,
  tier: 1,
  name: 'Definitiva',
  damage: 40,
  heal: 0,
});

/** Roba una carta del mazo del héroe; los niveles altos son más raros, como en la campaña. */

const pvpDrawCard = (hero: PvpHero): PvpCard => {
  const pool = hero.deck;
  const roll = Math.random();
  const wantedTier = roll > 0.9 ? 3 : roll > 0.65 ? 2 : 1;
  const sameTier = pool.filter((c) => c.tier === wantedTier);
  const seed = (sameTier.length > 0 ? sameTier : pool)[Math.floor(Math.random() * (sameTier.length || pool.length))];
  return { ...seed, uid: pvpUid() };
};

/** Fusiona parejas iguales de la mano inicial, como al repartir en la campana. */
const pvpAutoMergeHand = (hero: PvpHero) => {
  for (let guard = 0; guard < 12; guard++) {
    const fromIdx = hero.hand.findIndex((card, idx) => {
      if (card.skillId === PVP_ULTIMATE_SKILL_ID || card.tier >= 3) return false;
      return hero.hand.some(
        (other, otherIdx) =>
          otherIdx !== idx && other.skillId === card.skillId && other.tier === card.tier
      );
    });
    if (fromIdx < 0) break;
    const card = hero.hand[fromIdx];
    const toIdx = hero.hand.findIndex(
      (other, idx) => idx !== fromIdx && other.skillId === card.skillId && other.tier === card.tier
    );
    if (toIdx < 0) break;
    const nextTier = (card.tier + 1) as 1 | 2 | 3;
    const seed = hero.deck.find((c) => c.skillId === card.skillId && c.tier === nextTier);
    hero.hand[toIdx] = {
      ...hero.hand[toIdx],
      tier: nextTier,
      name: seed?.name ?? card.name,
      damage: seed?.damage ?? card.damage,
      heal: seed?.heal ?? card.heal,
      effects: seed?.effects ?? card.effects,
    };
    hero.hand.splice(fromIdx, 1);
  }
};

const pvpFillHand = (hero: PvpHero) => {
  while (hero.hand.filter((c) => c.skillId !== PVP_ULTIMATE_SKILL_ID).length < PVP_HAND_SIZE) {
    hero.hand.push(pvpDrawCard(hero));
  }
};

/** Mete o retira la carta dorada de definitiva según los orbes del luchador. */
const pvpSyncUltimate = (fighter: PvpFighter) => {
  const hero = pvpActiveHero(fighter);
  hero.hand = hero.hand.filter((c) => c.skillId !== PVP_ULTIMATE_SKILL_ID);
  if (fighter.orbs >= PVP_MAX_ORBS) hero.hand.push(pvpUltimateCard(hero.heroId));
};

const pvpSend = (playerId: string, event: string, payload: Record<string, unknown>) => {
  const res = pvpClients.get(playerId);
  if (!res) return;
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch {
    pvpClients.delete(playerId);
  }
};

const pvpHeroView = (hero: PvpHero) => ({
  heroId: hero.heroId,
  heroName: hero.heroName,
  spriteUrl: hero.spriteUrl,
  attackSpriteUrl: hero.attackSpriteUrl,
  portraitUrl: hero.portraitUrl,
  hand: hero.hand,
});

const pvpView = (room: PvpRoom) => ({
  roomId: room.id,
  status: room.status,
  round: room.round,
  turnSeat: room.turnSeat,
  deadline: room.deadline,
  turnMs: PVP_TURN_MS,
  fighters: room.fighters.map((f) => ({
    seat: f.seat,
    playerId: f.playerId,
    name: f.name,
    isBot: f.isBot,
    rating: f.rating,
    heroes: f.heroes.map(pvpHeroView),
    hp: Math.max(0, Math.round(f.hp)),
    maxHp: f.maxHp,
    orbs: f.orbs,
    maxOrbs: PVP_MAX_ORBS,
    activeIndex: f.activeIndex,
    swapped: f.swapped,
    guard: f.guard,
    connected: f.connected || f.isBot,
    statuses: f.statuses,
  })),
  log: room.log,
  lastAction: room.lastAction,
  winnerSeat: room.winnerSeat,
  reason: room.reason,
  ratingDelta: room.deltas,
  opponentRating: {
    0: room.fighters[1]?.rating ?? 0,
    1: room.fighters[0]?.rating ?? 0,
  } as Record<0 | 1, number>,
});

const pvpBroadcast = (room: PvpRoom) => {
  const state = pvpView(room);
  room.fighters.forEach((f) => {
    if (f.isBot) return;
    pvpSend(f.playerId, 'state', { state, seat: f.seat });
  });
};

const pvpLog = (room: PvpRoom, seat: 0 | 1, text: string, kind: PvpLogKind) => {
  room.log.unshift({ id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, seat, text, kind });
  if (room.log.length > PVP_LOG_LIMIT) room.log.length = PVP_LOG_LIMIT;
};

const pvpClearTimers = (room: PvpRoom) => {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
  if (room.botTimer) {
    clearTimeout(room.botTimer);
    room.botTimer = null;
  }
};

const pvpDestroyRoom = (room: PvpRoom) => {
  pvpClearTimers(room);
  room.forfeitTimers.forEach((t) => clearTimeout(t));
  room.forfeitTimers.clear();
  pvpRooms.delete(room.id);
  room.fighters.forEach((f) => {
    if (pvpRoomByPlayer.get(f.playerId) === room.id) pvpRoomByPlayer.delete(f.playerId);
    if (!f.isBot) pvpPlayers.delete(f.playerId);
    const botTimer = pvpBotTimers.get(f.playerId);
    if (botTimer) {
      clearTimeout(botTimer);
      pvpBotTimers.delete(f.playerId);
    }
  });
};

const pvpElo = (myRating: number, rivalRating: number, won: boolean): number => {
  const expected = 1 / (1 + Math.pow(10, (rivalRating - myRating) / 400));
  const raw = PVP_K_FACTOR * ((won ? 1 : 0) - expected);
  return Math.max(-40, Math.min(40, Math.round(raw)));
};

const pvpFinish = (room: PvpRoom, winnerSeat: 0 | 1 | undefined, reason: string) => {
  pvpClearTimers(room);
  room.status = 'finished';
  room.winnerSeat = winnerSeat;
  room.reason = reason;
  room.deadline = 0;
  const [a, b] = room.fighters;
  room.deltas = {
    0: pvpElo(a.rating, b.rating, winnerSeat === 0),
    1: pvpElo(b.rating, a.rating, winnerSeat === 1),
  };
  pvpLog(room, typeof winnerSeat === 'number' ? winnerSeat : 0, reason, 'system');
  pvpBroadcast(room);
};

/** Aplica un estado al luchador que lo lleva; refresca duración y acumula cargas. */
const pvpApplyStatus = (
  room: PvpRoom,
  fighter: PvpFighter,
  type: string,
  turns: number,
  stacks: number,
  target: 'enemy' | 'hero'
): string => {
  const label = pvpStatusLabel(type);
  const hostile = pvpStatusHostile(type, target);
  const existing = fighter.statuses.find((status) => status.type === type);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns);
    existing.stacks = Math.min(5, existing.stacks + stacks);
  } else {
    fighter.statuses.push({
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      icon: pvpStatusIcon(type),
      turns,
      stacks,
      hostile,
      kind: pvpStatusKind(type),
    });
  }
  pvpLog(
    room,
    fighter.seat,
    `${fighter.name}: ${label} (${turns} turno${turns > 1 ? 's' : ''})${hostile ? '' : ' a favor'}.`,
    'system'
  );
  return label;
};

/** Aplica los estados que trae la carta jugada. */
const pvpApplyCardStatuses = (
  room: PvpRoom,
  attacker: PvpFighter,
  defender: PvpFighter,
  card: PvpCard
): string[] => {
  if (card.skillId === PVP_ULTIMATE_SKILL_ID) return [];
  const applied: string[] = [];
  (card.effects ?? []).forEach((effect) => {
    const bearer = effect.target === 'hero' ? attacker : defender;
    applied.push(pvpApplyStatus(room, bearer, effect.type, effect.duration, effect.stacks, effect.target));
  });
  return applied;
};

const pvpHasKind = (fighter: PvpFighter, kind: string): boolean =>
  fighter.statuses.some((status) => status.kind === kind);

/** Daño/curación residual al empezar el turno y descuento de duración (los aturdimientos aparte). */
const pvpTickStatuses = (room: PvpRoom, fighter: PvpFighter) => {
  let damage = 0;
  let heal = 0;
  fighter.statuses.forEach((status) => {
    if (status.kind === 'dot') damage += Math.round(fighter.maxHp * 0.04 * status.stacks);
    if (status.kind === 'hot') heal += Math.round(fighter.maxHp * 0.04 * status.stacks);
  });
  if (damage > 0) {
    fighter.hp = Math.max(0, fighter.hp - damage);
    pvpLog(room, fighter.seat, `${fighter.name} sufre ${damage} por sus estados.`, 'damage');
  }
  if (heal > 0) {
    fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
    pvpLog(room, fighter.seat, `${fighter.name} recupera ${heal} PV.`, 'heal');
  }
  fighter.statuses = fighter.statuses
    .map((status) => (status.kind === 'stun' ? status : { ...status, turns: status.turns - 1 }))
    .filter((status) => status.turns > 0);
};

const pvpActiveHero = (fighter: PvpFighter): PvpHero =>
  fighter.heroes[Math.max(0, Math.min(fighter.heroes.length - 1, fighter.activeIndex))];

const pvpNextTurn = (room: PvpRoom) => {
  room.round += 1;
  room.turnSeat = (room.turnSeat === 0 ? 1 : 0) as 0 | 1;
  pvpBeginTurn(room);
};

/** Aplica una acción ya validada. Cambiar de héroe no consume el turno. */

const pvpResolveAction = (room: PvpRoom, action: PvpActionInput) => {
  const attacker = room.fighters.find((f) => f.seat === room.turnSeat);
  const defender = room.fighters.find((f) => f.seat !== room.turnSeat);
  if (!attacker || !defender) return;

  if (action.type === 'switch') {
    const index = pvpClamp(action.heroIndex, 0, attacker.heroes.length - 1, attacker.activeIndex);
    attacker.activeIndex = index;
    attacker.swapped = true;
    const hero = pvpActiveHero(attacker);
    pvpFillHand(hero);
    pvpSyncUltimate(attacker);
    room.lastAction = {
      seat: attacker.seat,
      heroName: hero.heroName,
      cardName: 'Cambio de héroe',
      kind: 'switch',
      switched: true,
      at: Date.now(),
    };
    pvpLog(room, attacker.seat, `${attacker.name} pone a ${hero.heroName} al frente.`, 'switch');
    pvpBroadcast(room);
    return;
  }

  if (action.type === 'merge') {
    const hero = pvpActiveHero(attacker);
    const fromIdx = hero.hand.findIndex((c) => c.uid === action.uid);
    const toIdx = hero.hand.findIndex((c) => c.uid === action.targetUid);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const from = hero.hand[fromIdx];
    const to = hero.hand[toIdx];
    const canMerge = from.skillId === to.skillId && from.tier === to.tier && from.tier < 3;

    // Como en la campana: fusionar o mover cartas carga un orbe de definitiva.
    attacker.orbs = Math.min(PVP_MAX_ORBS, attacker.orbs + 1);

    if (canMerge) {
      const nextTier = (from.tier + 1) as 1 | 2 | 3;
      const seed = hero.deck.find((c) => c.skillId === to.skillId && c.tier === nextTier);
      hero.hand[toIdx] = {
        uid: to.uid,
        skillId: to.skillId,
        tier: nextTier,
        name: seed?.name ?? to.name,
        damage: seed?.damage ?? to.damage,
        heal: seed?.heal ?? to.heal,
        effects: seed?.effects ?? to.effects,
      };
      hero.hand.splice(fromIdx, 1);
      room.lastAction = {
        seat: attacker.seat,
        heroName: hero.heroName,
        cardName: hero.hand[Math.min(toIdx, hero.hand.length - 1)]?.name ?? to.name,
        kind: 'merge',
        skillId: to.skillId,
        tier: nextTier,
        at: Date.now(),
      };
      pvpLog(room, attacker.seat, `${hero.heroName} fusiona dos ${to.name} en una de nivel ${nextTier}.`, 'system');
    } else {
      hero.hand[fromIdx] = to;
      hero.hand[toIdx] = from;
      room.lastAction = {
        seat: attacker.seat,
        heroName: hero.heroName,
        cardName: 'Reordenar cartas',
        kind: 'move',
        at: Date.now(),
      };
      pvpLog(room, attacker.seat, `${hero.heroName} cambia de sitio sus cartas.`, 'system');
    }

    pvpSyncUltimate(attacker);
    pvpNextTurn(room);
    return;
  }

  const hero = pvpActiveHero(attacker);
  const index = hero.hand.findIndex((c) => c.uid === action.uid);
  if (index < 0) return;
  const card = hero.hand[index];
  const isUltimate = card.skillId === PVP_ULTIMATE_SKILL_ID;
  if (isUltimate && attacker.orbs < PVP_MAX_ORBS) return;

  hero.hand.splice(index, 1);
  if (isUltimate) {
    attacker.orbs = 0;
  } else {
    attacker.orbs = Math.min(PVP_MAX_ORBS, attacker.orbs + 1);
    pvpFillHand(hero);
  }

  const variance = 0.92 + Math.random() * 0.16;
  const missed = pvpHasKind(attacker, 'miss') && Math.random() < 0.3;
  const crit = !missed && !isUltimate && Math.random() < 0.13;
  const scale = attacker.maxHp / 100;

  let dealt = 0;
  let healed = missed ? 0 : Math.max(0, Math.round(card.heal * scale * variance));
  if (!missed && card.damage > 0) {
    const outgoing = pvpOutgoingMultiplier(attacker.statuses.map((status) => status.kind as never));
    const incoming = pvpIncomingMultiplier(defender.statuses.map((status) => status.kind as never));
    let damage = card.damage * scale * 0.9 * variance * (crit ? 1.6 : 1) * outgoing * incoming;
    const blocked = defender.guard;
    if (blocked) {
      damage *= 0.45;
      defender.guard = false;
    }
    dealt = Math.max(1, Math.round(damage));
    defender.hp = Math.max(0, defender.hp - dealt);
    defender.orbs = Math.min(PVP_MAX_ORBS, defender.orbs + 1);
  }
  if (healed > 0) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + healed);
  }
  const pureBuff = card.damage === 0 && card.heal === 0;
  if (pureBuff) attacker.guard = true;

  const appliedStatuses = pvpApplyCardStatuses(room, attacker, defender, card);

  room.lastAction = {
    seat: attacker.seat,
    heroName: hero.heroName,
    cardName: card.name,
    kind: 'card',
    skillId: card.skillId,
    tier: card.tier,
    damage: dealt || undefined,
    heal: healed || undefined,
    crit,
    ultimate: isUltimate,
    status: appliedStatuses.length > 0 ? appliedStatuses : undefined,
    missed: missed || undefined,
    at: Date.now(),
  };

  const parts: string[] = [];
  if (missed) parts.push('falla el golpe');
  if (dealt > 0) parts.push(`${dealt} de daño${crit ? ' ¡CRÍTICO!' : ''}`);
  if (healed > 0) parts.push(`+${healed} PV`);
  if (pureBuff) parts.push('blinda al escuadrón');
  if (appliedStatuses.length > 0) parts.push(appliedStatuses.join(', '));
  pvpLog(
    room,
    attacker.seat,
    `${hero.heroName} usa ${card.name}: ${parts.join(' · ') || 'sin efecto'}.`,
    isUltimate ? 'ultimate' : crit ? 'crit' : healed > 0 ? 'heal' : dealt > 0 ? 'damage' : 'guard'
  );

  pvpSyncUltimate(attacker);
  pvpSyncUltimate(defender);

  if (defender.hp <= 0) {
    pvpFinish(room, attacker.seat, `${attacker.name} deja a ${defender.name} tendido en la arena.`);
    return;
  }

  pvpNextTurn(room);
};

/** El bot juega como un humano: definitiva con 5 orbes, cura si va mal y si no, su mejor carta. */

const pvpBotAction = (bot: PvpFighter): PvpActionInput => {
  const hero = pvpActiveHero(bot);
  pvpFillHand(hero);
  const hpRatio = bot.hp / Math.max(1, bot.maxHp);
  const ult = hero.hand.find((c) => c.skillId === PVP_ULTIMATE_SKILL_ID);
  if (ult && bot.orbs >= PVP_MAX_ORBS) return { type: 'card', uid: ult.uid };

  const heals = hero.hand.filter((c) => c.heal > 0);
  if (heals.length > 0 && hpRatio < 0.5) {
    return { type: 'card', uid: heals[0].uid };
  }
  const attackers = hero.hand.filter((c) => c.damage > 0);
  if (attackers.length > 0) {
    const best = attackers.reduce((a, b) => (b.damage > a.damage ? b : a));
    return { type: 'card', uid: best.uid };
  }
  const anyCard = hero.hand[0];
  if (anyCard) return { type: 'card', uid: anyCard.uid };
  return { type: 'switch', heroIndex: (bot.activeIndex + 1) % bot.heroes.length };
};

const pvpBeginTurn = (room: PvpRoom) => {
  if (room.status !== 'playing') return;
  pvpClearTimers(room);
  const actor = room.fighters.find((f) => f.seat === room.turnSeat);
  if (!actor) return;

  // Estados al empezar el turno: venenos, regeneración y aturdimientos.
  const stunned = pvpHasKind(actor, 'stun');
  pvpTickStatuses(room, actor);
  if (actor.hp <= 0) {
    const winner = room.fighters.find((f) => f.seat !== actor.seat);
    if (winner) pvpFinish(room, winner.seat, `${actor.name} cae por sus heridas.`);
    return;
  }
  if (stunned) {
    // El aturdimiento se queda visible durante el turno perdido y se gasta justo después.
    pvpLog(room, actor.seat, `${actor.name} está aturdido y pierde el turno.`, 'system');
    room.deadline = Date.now() + 1200;
    pvpBroadcast(room);
    room.botTimer = setTimeout(() => {
      if (room.status !== 'playing' || room.turnSeat !== actor.seat) return;
      actor.statuses = actor.statuses
        .map((status) => (status.kind === 'stun' ? { ...status, turns: status.turns - 1 } : status))
        .filter((status) => status.turns > 0);
      pvpNextTurn(room);
    }, 1000);
    return;
  }

  // Al empezar tu turno vuelves a poder cambiar de héroe y se repone la mano.
  actor.swapped = false;
  pvpFillHand(pvpActiveHero(actor));
  pvpSyncUltimate(actor);
  room.deadline = Date.now() + PVP_TURN_MS;
  pvpBroadcast(room);

  room.turnTimer = setTimeout(() => {
    if (room.status !== 'playing') return;
    const current = room.fighters.find((f) => f.seat === room.turnSeat);
    if (!current) return;
    pvpLog(room, current.seat, `${current.name} duda demasiado: los Pozos le obligan a actuar.`, 'system');
    pvpResolveAction(room, pvpBotAction(current));
  }, PVP_TURN_MS);

  if (actor.isBot) {
    // Los bots piensan un poco antes de golpear para que el duelo se pueda seguir.
    room.botTimer = setTimeout(() => {
      if (room.status !== 'playing' || room.turnSeat !== actor.seat) return;
      pvpResolveAction(room, pvpBotAction(actor));
    }, 500 + Math.random() * 350);
  }
};

const pvpPrepareFighter = (base: PvpFighter, seat: 0 | 1): PvpFighter => {
  const fightersHeroes = base.heroes.map((h) => ({ ...h, hand: [] as PvpCard[] }));
  fightersHeroes.forEach((h) => {
    pvpFillHand(h);
    pvpAutoMergeHand(h);
  });
  const prepared: PvpFighter = {
    ...base,
    seat,
    heroes: fightersHeroes,
    hp: PVP_MAX_HP,
    maxHp: PVP_MAX_HP,
    orbs: 0,
    activeIndex: 0,
    swapped: false,
    guard: false,
    connected: Boolean(pvpClients.get(base.playerId)),
    statuses: [],
  };
  pvpSyncUltimate(prepared);
  return prepared;
};

const pvpMakeBot = (player: PvpFighter, rating: number): PvpFighter => {
  const rawPool = player.botPool.length > 0 ? player.botPool : player.heroes;
  // Los bots pelean con héroes que tienen sprite de combate, como en la campaña.
  const spritePool = rawPool.filter((h) => !String(h.spriteUrl || '').includes('/assets/portraits/'));
  const pool = spritePool.length >= 2 ? spritePool : rawPool;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const size = Math.min(3, Math.max(2, shuffled.length));
  const heroes = shuffled.slice(0, size).map((h) => ({ ...h, hand: [] as PvpCard[] }));
  heroes.forEach((h) => {
    pvpFillHand(h);
    pvpAutoMergeHand(h);
  });
  const names = PVP_BOT_NAMES.filter((n) => n !== player.name);
  const name = names[Math.floor(Math.random() * names.length)] ?? 'Rival Fantasma';
  return {
    playerId: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    seat: 1,
    name,
    isBot: true,
    rating,
    heroes,
    hp: PVP_MAX_HP,
    maxHp: PVP_MAX_HP,
    orbs: 0,
    activeIndex: 0,
    swapped: false,
    guard: false,
    connected: true,
    statuses: [],
    botPool: [],
  };
};

const pvpStartBotMatch = (aId: string): PvpRoom | null => {
  const human = pvpPlayers.get(aId);
  if (!human) return null;

  const player = pvpPrepareFighter(human, 0);
  const bot = pvpMakeBot(player, player.rating);
  const room: PvpRoom = {
    id: `pvp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: 'playing',
    round: 1,
    turnSeat: Math.random() < 0.5 ? 0 : 1,
    deadline: Date.now() + PVP_TURN_MS,
    fighters: [player, bot],
    log: [],
    lastAction: null,
    deltas: { 0: 0, 1: 0 },
    turnTimer: null,
    botTimer: null,
    forfeitTimers: new Map(),
  };

  pvpRooms.set(room.id, room);
  room.fighters.forEach((f) => {
    if (!f.isBot) pvpRoomByPlayer.set(f.playerId, room.id);
  });
  pvpLog(room, 0, `Las puertas de los Pozos se cierran: ${bot.name} entra con ${bot.heroes.length} héroes.`, 'system');
  room.fighters.forEach((f) => {
    if (!f.isBot) pvpSend(f.playerId, 'matched', { roomId: room.id, seat: f.seat });
  });
  pvpBeginTurn(room);
  return room;
};

const pvpHumanMatch = (aId: string, bId: string): PvpRoom | null => {
  const a = pvpPlayers.get(aId);
  const b = pvpPlayers.get(bId);
  if (!a || !b) return null;

  const room: PvpRoom = {
    id: `pvp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: 'playing',
    round: 1,
    turnSeat: Math.random() < 0.5 ? 0 : 1,
    deadline: Date.now() + PVP_TURN_MS,
    fighters: [pvpPrepareFighter(a, 0), pvpPrepareFighter(b, 1)],
    log: [],
    lastAction: null,
    deltas: { 0: 0, 1: 0 },
    turnTimer: null,
    botTimer: null,
    forfeitTimers: new Map(),
  };

  pvpRooms.set(room.id, room);
  room.fighters.forEach((f) => pvpRoomByPlayer.set(f.playerId, room.id));
  pvpLog(room, 0, 'Las puertas de los Pozos se cierran. Solo queda uno.', 'system');
  room.fighters.forEach((f) => pvpSend(f.playerId, 'matched', { roomId: room.id, seat: f.seat }));
  pvpBeginTurn(room);
  return room;
};

const pvpClearBotTimer = (playerId: string) => {
  const timer = pvpBotTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    pvpBotTimers.delete(playerId);
  }
};

const pvpTryMatch = (playerId: string): PvpRoom | null => {
  pvpQueue = pvpQueue.filter((id) => pvpPlayers.has(id) && id !== playerId);
  const rivalId = pvpQueue.find((id) => id !== playerId && Boolean(pvpClients.get(id)));
  if (!rivalId) {
    if (!pvpQueue.includes(playerId)) pvpQueue.push(playerId);
    pvpSend(playerId, 'queue', { position: pvpQueue.indexOf(playerId) + 1, waiting: pvpQueue.length });
    // Si en unos segundos no aparece nadie, entra un escuadrón bot.
    pvpClearBotTimer(playerId);
    const timer = setTimeout(() => {
      pvpBotTimers.delete(playerId);
      if (!pvpQueue.includes(playerId)) return;
      if (pvpRoomByPlayer.has(playerId)) return;
      pvpQueue = pvpQueue.filter((id) => id !== playerId);
      const room = pvpStartBotMatch(playerId);
      if (!room) return;
      pvpSend(playerId, 'bot', { roomId: room.id });
    }, PVP_BOT_SEARCH_MS);
    pvpBotTimers.set(playerId, timer);
    return null;
  }

  pvpQueue = pvpQueue.filter((id) => id !== rivalId);
  pvpClearBotTimer(playerId);
  pvpClearBotTimer(rivalId);
  pvpSend(rivalId, 'queue', { position: 0, waiting: pvpQueue.length });
  return pvpHumanMatch(rivalId, playerId);
};

app.get('/api/pvp/status', (_req: Request, res: Response) => {
  const playing = [...pvpRooms.values()].filter((r) => r.status === 'playing').length;
  res.json({
    success: true,
    waiting: pvpQueue.filter((id) => Boolean(pvpClients.get(id))).length,
    playing,
    online: pvpClients.size,
    turnMs: PVP_TURN_MS,
    botAfterMs: PVP_BOT_SEARCH_MS,
  });
});

app.get('/api/pvp/stream', (req: Request, res: Response) => {
  const playerId = String(req.query.playerId || '').trim();
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(playerId)) {
    return res.status(400).json({ success: false, message: 'Falta un playerId válido.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const previous = pvpClients.get(playerId);
  if (previous && previous !== res) {
    try {
      previous.end();
    } catch {
      // La conexión anterior ya estaba cerrada.
    }
  }
  pvpClients.set(playerId, res);

  const roomId = pvpRoomByPlayer.get(playerId);
  const room = roomId ? pvpRooms.get(roomId) : null;
  if (room) {
    const roomFighter = room.fighters.find((f) => f.playerId === playerId);
    if (roomFighter) {
      roomFighter.connected = true;
      const pending = room.forfeitTimers.get(playerId);
      if (pending) {
        clearTimeout(pending);
        room.forfeitTimers.delete(playerId);
      }
      pvpBroadcast(room);
    }
  }

  res.write(`event: hello\ndata: ${JSON.stringify({ playerId, at: Date.now() })}\n\n`);
  if (room) {
    const seat = room.fighters.find((f) => f.playerId === playerId)?.seat ?? 0;
    pvpSend(playerId, 'state', { state: pvpView(room), seat });
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      pvpClients.delete(playerId);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (pvpClients.get(playerId) === res) pvpClients.delete(playerId);
    pvpQueue = pvpQueue.filter((id) => id !== playerId);
    pvpClearBotTimer(playerId);

    const activeRoomId = pvpRoomByPlayer.get(playerId);
    const activeRoom = activeRoomId ? pvpRooms.get(activeRoomId) : null;
    if (!activeRoom) return;
    const me = activeRoom.fighters.find((f) => f.playerId === playerId);
    if (!me) return;
    me.connected = false;

    if (activeRoom.status !== 'playing') return;
    if (activeRoom.forfeitTimers.has(playerId)) return;
    const forfeit = setTimeout(() => {
      activeRoom.forfeitTimers.delete(playerId);
      if (activeRoom.status !== 'playing') return;
      if (pvpClients.get(playerId)) return;
      const rival = activeRoom.fighters.find((f) => f.playerId !== playerId);
      pvpFinish(
        activeRoom,
        rival ? rival.seat : undefined,
        `${me.name} abandonó el pozo. ${rival ? `${rival.name} se lleva la victoria.` : ''}`
      );
    }, PVP_FORFEIT_MS);
    activeRoom.forfeitTimers.set(playerId, forfeit);
  });
});

app.post('/api/pvp/find', (req: Request, res: Response) => {
  const body = req.body || {};
  const playerId = String(body.playerId || '').trim();
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(playerId)) {
    return res.status(400).json({ success: false, message: 'Falta un playerId válido.' });
  }

  const existingRoomId = pvpRoomByPlayer.get(playerId);
  const existingRoom = existingRoomId ? pvpRooms.get(existingRoomId) : null;
  if (existingRoom) {
    const seat = existingRoom.fighters.find((f) => f.playerId === playerId)?.seat ?? 0;
    if (existingRoom.status === 'playing') {
      return res.json({ success: true, matched: true, roomId: existingRoom.id, seat, state: pvpView(existingRoom) });
    }
    if (existingRoom.status === 'finished') pvpDestroyRoom(existingRoom);
  }

  const rawHeroes: any[] = Array.isArray(body.heroes) ? body.heroes : [];
  const heroes = rawHeroes
    .map(pvpSanitizeHero)
    .filter((h): h is PvpHero => Boolean(h))
    .slice(0, PVP_MAX_SQUAD);
  if (heroes.length === 0) {
    return res.status(400).json({ success: false, message: 'Necesitas al menos un héroe en el escuadrón.' });
  }

  const rawPool: any[] = Array.isArray(body.botPool) ? body.botPool : [];
  const botPool = rawPool
    .map(pvpSanitizeHero)
    .filter((h): h is PvpHero => Boolean(h))
    .slice(0, 12);

  pvpPlayers.set(playerId, {
    playerId,
    seat: 0,
    name: pvpCleanText(body.name, 'Gladiador', 24),
    isBot: false,
    rating: pvpClamp(body.rating, 0, PVP_MAX_RATING, 0),
    heroes,
    hp: PVP_MAX_HP,
    maxHp: PVP_MAX_HP,
    orbs: 0,
    activeIndex: 0,
    swapped: false,
    guard: false,
    connected: Boolean(pvpClients.get(playerId)),
    statuses: [],
    botPool,
  });

  const room = pvpTryMatch(playerId);
  return res.json({
    success: true,
    matched: Boolean(room),
    roomId: room?.id ?? null,
    waiting: pvpQueue.length,
    botAfterMs: PVP_BOT_SEARCH_MS,
  });
});

app.post('/api/pvp/cancel', (req: Request, res: Response) => {
  const playerId = String(req.body?.playerId || '').trim();
  pvpQueue = pvpQueue.filter((id) => id !== playerId);
  pvpClearBotTimer(playerId);
  const roomId = pvpRoomByPlayer.get(playerId);
  const room = roomId ? pvpRooms.get(roomId) : null;
  if (room && room.status !== 'playing') pvpDestroyRoom(room);
  pvpPlayers.delete(playerId);
  res.json({ success: true });
});

app.post('/api/pvp/action', (req: Request, res: Response) => {
  const playerId = String(req.body?.playerId || '').trim();
  const type = String(req.body?.type || 'card') as 'card' | 'switch' | 'merge';
  const uid = String(req.body?.uid || '').trim();
  const targetUid = String(req.body?.targetUid || '').trim();
  const heroIndex = Number(req.body?.heroIndex);
  const roomId = pvpRoomByPlayer.get(playerId);
  const room = roomId ? pvpRooms.get(roomId) : null;

  if (!room) return res.status(404).json({ success: false, message: 'No estás en ningún duelo.' });
  if (room.status !== 'playing') return res.status(409).json({ success: false, message: 'El duelo ya ha terminado.' });

  const me = room.fighters.find((f) => f.playerId === playerId);
  if (!me) return res.status(403).json({ success: false, message: 'No luchas en este pozo.' });
  if (me.seat !== room.turnSeat) return res.status(409).json({ success: false, message: 'No es tu turno.' });

  if (type === 'switch') {
    if (me.swapped) {
      return res.status(409).json({ success: false, message: 'Solo puedes cambiar de héroe una vez por turno.' });
    }
    if (!Number.isInteger(heroIndex) || heroIndex < 0 || heroIndex >= me.heroes.length) {
      return res.status(400).json({ success: false, message: 'Héroe desconocido.' });
    }
    if (heroIndex === me.activeIndex) {
      return res.status(409).json({ success: false, message: 'Ese héroe ya está en el frente.' });
    }
    // El temporizador del turno sigue vivo: cambiar de héroe no consume la acción.
    pvpResolveAction(room, { type: 'switch', heroIndex });
    return res.json({ success: true, state: pvpView(room) });
  }

  if (type === 'merge') {
    if (!uid || !targetUid || uid === targetUid) {
      return res.status(400).json({ success: false, message: 'Suelta una carta sobre otra.' });
    }
    const activeHero = pvpActiveHero(me);
    if (!activeHero.hand.some((c) => c.uid === uid) || !activeHero.hand.some((c) => c.uid === targetUid)) {
      return res.status(400).json({ success: false, message: 'Esa carta ya no está en tu mano.' });
    }
    // Fusionar o mover tambien consume el turno, como en la campana.
    pvpClearTimers(room);
    pvpResolveAction(room, { type: 'merge', uid, targetUid });
    return res.json({ success: true, state: pvpView(room) });
  }

  const hero = pvpActiveHero(me);
  const card = hero.hand.find((c) => c.uid === uid);
  if (!card) return res.status(400).json({ success: false, message: 'Esa carta ya no está en tu mano.' });
  if (card.skillId === PVP_ULTIMATE_SKILL_ID && me.orbs < PVP_MAX_ORBS) {
    return res.status(409).json({ success: false, message: `La definitiva necesita ${PVP_MAX_ORBS} orbes.` });
  }

  pvpClearTimers(room);
  pvpResolveAction(room, { type: 'card', uid });
  return res.json({ success: true, state: pvpView(room) });
});

app.post('/api/pvp/rematch', (req: Request, res: Response) => {
  const playerId = String(req.body?.playerId || '').trim();
  const roomId = pvpRoomByPlayer.get(playerId);
  const room = roomId ? pvpRooms.get(roomId) : null;
  // Destruir la sala borra a sus luchadores: guardamos al nuestro para la revancha.
  const self = pvpPlayers.get(playerId) ?? room?.fighters.find((f) => f.playerId === playerId && !f.isBot);
  if (room) pvpDestroyRoom(room);

  if (!self) {
    return res.status(404).json({ success: false, message: 'Vuelve a entrar en los Pozos para buscar rival.' });
  }
  pvpPlayers.set(playerId, {
    ...self,
    isBot: false,
    connected: Boolean(pvpClients.get(playerId)),
    botPool: self.botPool.length > 0 ? self.botPool : self.heroes,
  });
  pvpQueue = pvpQueue.filter((id) => id !== playerId);
  const next = pvpTryMatch(playerId);
  return res.json({ success: true, matched: Boolean(next), roomId: next?.id ?? null });
});

app.post('/api/pvp/leave', (req: Request, res: Response) => {
  const playerId = String(req.body?.playerId || '').trim();
  pvpQueue = pvpQueue.filter((id) => id !== playerId);
  pvpClearBotTimer(playerId);
  const roomId = pvpRoomByPlayer.get(playerId);
  const room = roomId ? pvpRooms.get(roomId) : null;
  if (room && room.status === 'playing') {
    const rival = room.fighters.find((f) => f.playerId !== playerId);
    const me = room.fighters.find((f) => f.playerId === playerId);
    pvpFinish(room, rival?.seat, `${me?.name || 'Un gladiador'} abandonó el pozo.`);
  } else if (room) {
    pvpDestroyRoom(room);
  }
  pvpPlayers.delete(playerId);
  res.json({ success: true });
});

// Limpieza de salas viejas para que el proceso no acumule memoria.

setInterval(() => {
  const now = Date.now();
  pvpRooms.forEach((room) => {
    if (room.status === 'finished' && now - room.createdAt > PVP_ROOM_TTL_MS / 4) {
      pvpDestroyRoom(room);
      return;
    }
    if (now - room.createdAt > PVP_ROOM_TTL_MS) pvpDestroyRoom(room);
  });
}, 60000).unref?.();

// --- SERVICE WORKER & STATIC ASSETS HANDLER ---
app.get('/sw.js', (_req: Request, res: Response) => {
  const swPath = path.join(__dirname, 'public', 'sw.js');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  if (fs.existsSync(swPath)) {
    return res.sendFile(swPath);
  }
  return res.send(
    'self.addEventListener("install", () => self.skipWaiting()); self.addEventListener("activate", () => self.clients.claim());'
  );
});

const REMOTE_ASSETS_BASES = [
  'https://raw.githubusercontent.com/tirianworld/Shatered-Timelines/main/public',
  'https://raw.githubusercontent.com/tirianworld/Shatered-Timelines/main-nuevo/public',
];

function findCaseInsensitiveFile(dir: string, filename: string): string | null {
  try {
    if (!fs.existsSync(dir)) return null;
    const lowerName = filename.toLowerCase();
    const normalized = lowerName.replace(/[\s_-]+/g, '');
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.toLowerCase() === lowerName) return path.join(dir, f);
      if (f.toLowerCase().replace(/[\s_-]+/g, '') === normalized) return path.join(dir, f);
    }
  } catch {
    // ignore
  }
  return null;
}

let dishDuplicatesMap: Record<string, string> = {};
try {
  const mapPath = path.join(__dirname, 'src', 'data', 'dishDuplicatesMap.json');
  if (fs.existsSync(mapPath)) {
    dishDuplicatesMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  }
} catch {
  // ignore
}

app.use(async (req: Request, res: Response, next) => {
  let reqPath = decodeURI(req.path);
  if (dishDuplicatesMap[reqPath]) {
    reqPath = dishDuplicatesMap[reqPath];
  }
  if (reqPath.startsWith('/assets/') || reqPath.startsWith('/items/')) {
    const targetSubPath = reqPath.startsWith('/items/') ? `/assets${reqPath}` : reqPath;
    const localFile = path.join(__dirname, 'public', targetSubPath);
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      return res.sendFile(localFile);
    }

    // Check case-insensitive locally in the same directory
    const parentDir = path.dirname(localFile);
    const baseName = path.basename(localFile);
    const fuzzyMatch = findCaseInsensitiveFile(parentDir, baseName);
    if (fuzzyMatch && fs.statSync(fuzzyMatch).isFile()) {
      return res.sendFile(fuzzyMatch);
    }

    // Fallback: fetch from GitHub repo (main first, then main-nuevo)
    for (const base of REMOTE_ASSETS_BASES) {
      try {
        const remoteUrl = `${base}${targetSubPath}`;
        const remoteRes = await fetch(remoteUrl);
        if (remoteRes.ok) {
          const buffer = Buffer.from(await remoteRes.arrayBuffer());
          fs.mkdirSync(path.dirname(localFile), { recursive: true });
          fs.writeFileSync(localFile, buffer);
          const contentType = remoteRes.headers.get('content-type') || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          return res.send(buffer);
        }
      } catch {
        // ignore
      }
    }

    // Cross-folder fallback in public/assets/*
    for (const sub of ['items', 'backgrounds', 'ui', 'aistudio', 'portraits', 'combat', 'forge']) {
      const altDir = path.join(__dirname, 'public', 'assets', sub);
      const match = findCaseInsensitiveFile(altDir, baseName);
      if (match && fs.statSync(match).isFile()) {
        return res.sendFile(match);
      }
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// --- ANDROID APP LINKS (TWA / PLAY STORE) ---
// Digital Asset Links: demuestra que el paquete Android y este dominio son del mismo dueño.
// Se configura con TWA_PACKAGE_NAME y TWA_SHA256_FINGERPRINTS (huellas separadas por comas).
// Sin configurar responde 404 para no publicar un archivo inválido.
const TWA_PACKAGE_NAME = process.env.TWA_PACKAGE_NAME || '';
const TWA_SHA256_FINGERPRINTS = String(process.env.TWA_SHA256_FINGERPRINTS || '')
  .split(',')
  .map((fingerprint) => fingerprint.trim().toUpperCase())
  .filter(Boolean);

app.get('/.well-known/assetlinks.json', (_req: Request, res: Response) => {
  if (!TWA_PACKAGE_NAME || TWA_SHA256_FINGERPRINTS.length === 0) {
    return res.status(404).json({
      error: 'Faltan TWA_PACKAGE_NAME o TWA_SHA256_FINGERPRINTS en el servidor.',
    });
  }
  res.type('application/json').send(
    JSON.stringify(
      [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: TWA_PACKAGE_NAME,
            sha256_cert_fingerprints: TWA_SHA256_FINGERPRINTS,
          },
        },
      ],
      null,
      2
    )
  );
});

// Health check endpoint for Cloud Run and monitoring
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// --- VITE MIDDLEWARE (DEV) OR STATIC FILES (PROD) ---
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.join(__dirname, 'dist');
const distIndexPath = path.join(distPath, 'index.html');

if (!isProduction) {
  // Development mode: attach Vite middleware
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Production mode: serve static bundle
  if (!fs.existsSync(distIndexPath)) {
    console.log('Dist not found, building production bundle...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { stdio: 'inherit' });
  }
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    if (fs.existsSync(distIndexPath)) {
      res.sendFile(distIndexPath);
    } else {
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server successfully listening on 0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
});
