// Carga .env local si existe (está en .gitignore): las credenciales nunca viven en el código.
// En la nube se inyectan como variables de entorno / Secrets del proyecto.
import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

const githubHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
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
      avatarUrl: item?.player?.avatarImageUrl || '/assets/portraits/edacorn icono.png',
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
    emblem: order.emblem || '/assets/items/Recurso 287@4x.png',
    buildingImage: order.buildingImage || '/assets/aistudio/image_6578a593.png',
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
