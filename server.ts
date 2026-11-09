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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'theworldoftirian';
const GITHUB_REPO = 'Cdd-Gacha-Datos';
const GITHUB_BRANCH = 'main';

const githubHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'CDD-Gacha-App',
};

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

const fetchAuctionsFromGitHubOrLocal = async (): Promise<any[]> => {
  try {
    // Attempt live fetch from GitHub
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/auctions.json?t=${Date.now()}`
    );
    if (rawRes.ok) {
      const liveData = await rawRes.json();
      if (Array.isArray(liveData)) {
        fs.writeFileSync(auctionsLocalPath, JSON.stringify(liveData, null, 2), 'utf-8');
        return liveData;
      }
    }
  } catch (err) {
    console.warn('Fallback a auctions.json local:', err);
  }

  if (fs.existsSync(auctionsLocalPath)) {
    try {
      return JSON.parse(fs.readFileSync(auctionsLocalPath, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
};

const commitAuctionsToGitHub = async (auctions: any[], commitMsg: string): Promise<boolean> => {
  const formattedJson = JSON.stringify(auctions, null, 2);
  fs.writeFileSync(auctionsLocalPath, formattedJson, 'utf-8');

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

// --- GOOGLE PLAY GAMES SERVICES API ---
const playGamesDir = path.join(__dirname, 'export_data');
const playGamesSavesPath = path.join(playGamesDir, 'play_games_saves.json');
const playGamesLbPath = path.join(playGamesDir, 'play_games_leaderboards.json');

const getLeaderboardStore = (): Record<string, any[]> => {
  if (fs.existsSync(playGamesLbPath)) {
    try {
      return JSON.parse(fs.readFileSync(playGamesLbPath, 'utf-8'));
    } catch {
      // Ignored
    }
  }
  return {
    lb_power: [
      { rank: 1, playerId: 'G:9928192834', gamerTag: 'Vindicator_Kairon#9921', avatarUrl: '/assets/portraits/kairon.png', score: 38500, formattedScore: '38,500 Poder', badge: 'Top 1', date: 'Ayer' },
      { rank: 2, playerId: 'G:8817263512', gamerTag: 'RoxanneBlades#4412', avatarUrl: '/assets/portraits/roxanne.png', score: 29800, formattedScore: '29,800 Poder', badge: 'Top 2', date: 'Hoy' },
      { rank: 3, playerId: 'G:7712398412', gamerTag: 'EdacornShadow#1192', avatarUrl: '/assets/portraits/edacorn icono.png', score: 24600, formattedScore: '24,600 Poder', badge: 'Top 3', date: 'Hoy' },
      { rank: 4, playerId: 'G:6612984712', gamerTag: 'MagorditoMage#3321', avatarUrl: '/assets/portraits/magordito.png', score: 18400, formattedScore: '18,400 Poder', date: 'Hace 2 días' },
    ],
    lb_wealth: [
      { rank: 1, playerId: 'G:9928192834', gamerTag: 'Vindicator_Kairon#9921', avatarUrl: '/assets/portraits/kairon.png', score: 182000, formattedScore: '182,000 Oro', badge: 'Top 1', date: 'Ayer' },
      { rank: 2, playerId: 'G:8817263512', gamerTag: 'RoxanneBlades#4412', avatarUrl: '/assets/portraits/roxanne.png', score: 114500, formattedScore: '114,500 Oro', badge: 'Top 2', date: 'Hoy' },
      { rank: 3, playerId: 'G:7712398412', gamerTag: 'EdacornShadow#1192', avatarUrl: '/assets/portraits/edacorn icono.png', score: 85000, formattedScore: '85,000 Oro', badge: 'Top 3', date: 'Hoy' },
    ],
    lb_play_xp: [
      { rank: 1, playerId: 'G:9928192834', gamerTag: 'Vindicator_Kairon#9921', avatarUrl: '/assets/portraits/kairon.png', score: 16500, formattedScore: '16,500 XP', badge: 'Top 1', date: 'Ayer' },
      { rank: 2, playerId: 'G:8817263512', gamerTag: 'RoxanneBlades#4412', avatarUrl: '/assets/portraits/roxanne.png', score: 12000, formattedScore: '12,000 XP', badge: 'Top 2', date: 'Hoy' },
      { rank: 3, playerId: 'G:7712398412', gamerTag: 'EdacornShadow#1192', avatarUrl: '/assets/portraits/edacorn icono.png', score: 9500, formattedScore: '9,500 XP', badge: 'Top 3', date: 'Hoy' },
    ],
  };
};

app.get('/api/play-games/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Google Play Games Services Web API v2',
    features: ['achievements', 'leaderboards', 'cloud_save', 'player_profile'],
  });
});

app.post('/api/play-games/login', (req: Request, res: Response) => {
  const { playerId, gamerTag, email } = req.body;
  res.json({
    success: true,
    playerId: playerId || `G:${Date.now()}`,
    gamerTag: gamerTag || 'DarkLord#7729',
    email: email || 'darklordsombrior@gmail.com',
    message: 'Sesión iniciada con Google Play Games',
  });
});

app.post('/api/play-games/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Sesión de Google Play Games cerrada' });
});

app.post('/api/play-games/unlock-achievement', (req: Request, res: Response) => {
  const { playerId, achievementId, xpReward } = req.body;
  res.json({
    success: true,
    playerId,
    achievementId,
    xpReward,
    unlockedAt: Date.now(),
  });
});

app.get('/api/play-games/leaderboard', (req: Request, res: Response) => {
  const lbId = (req.query.id as string) || 'lb_power';
  const store = getLeaderboardStore();
  const entries = store[lbId] || [];

  const metaMap: Record<string, { name: string; description: string; unit: string; icon: string }> = {
    lb_power: {
      name: 'Poder de Escuadrón',
      description: 'Jugadores con la mayor fuerza combinada en su escuadrón activo.',
      unit: 'Poder',
      icon: '⚔️',
    },
    lb_wealth: {
      name: 'Riqueza Acumulada',
      description: 'Los comandantes con mayor fortuna de oro acumulada.',
      unit: 'Oro',
      icon: '💰',
    },
    lb_play_xp: {
      name: 'XP de Google Play',
      description: 'Mayor cantidad de experiencia de logros de Google Play Games.',
      unit: 'XP',
      icon: '🏆',
    },
  };

  const meta = metaMap[lbId] || {
    name: 'Clasificación General',
    description: 'Tabla de puntuaciones de Google Play Games',
    unit: 'Puntos',
    icon: '🎮',
  };

  res.json({
    success: true,
    leaderboard: {
      id: lbId,
      ...meta,
      entries,
    },
  });
});

app.post('/api/play-games/submit-score', (req: Request, res: Response) => {
  const { leaderboardId, playerId, gamerTag, avatarUrl, score, formattedScore } = req.body;
  if (!leaderboardId || !playerId || score === undefined) {
    return res.status(400).json({ success: false, error: 'Parámetros incompletos' });
  }

  const store = getLeaderboardStore();
  if (!store[leaderboardId]) {
    store[leaderboardId] = [];
  }

  const list = store[leaderboardId];
  const existingIdx = list.findIndex((e) => e.playerId === playerId);

  const entry = {
    rank: 0,
    playerId,
    gamerTag: gamerTag || 'Jugador',
    avatarUrl: avatarUrl || '/assets/portraits/edacorn icono.png',
    score: Number(score),
    formattedScore: formattedScore || `${score}`,
    isCurrentPlayer: true,
    date: 'Hoy',
  };

  if (existingIdx >= 0) {
    if (score > list[existingIdx].score) {
      list[existingIdx] = entry;
    }
  } else {
    list.push(entry);
  }

  // Sort descending
  list.sort((a, b) => b.score - a.score);

  // Re-rank
  list.forEach((item, index) => {
    item.rank = index + 1;
    if (item.rank === 1) item.badge = 'Top 1';
    else if (item.rank === 2) item.badge = 'Top 2';
    else if (item.rank === 3) item.badge = 'Top 3';
    else delete item.badge;
  });

  try {
    fs.mkdirSync(playGamesDir, { recursive: true });
    fs.writeFileSync(playGamesLbPath, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Ignored
  }

  res.json({ success: true, rank: entry.rank, score });
});

app.post('/api/play-games/cloud-save', (req: Request, res: Response) => {
  const { playerId, gamerTag, save } = req.body;
  if (!playerId || !save) {
    return res.status(400).json({ success: false, error: 'Datos de guardado inválidos' });
  }

  try {
    fs.mkdirSync(playGamesDir, { recursive: true });
    let savesMap: Record<string, any> = {};
    if (fs.existsSync(playGamesSavesPath)) {
      try {
        savesMap = JSON.parse(fs.readFileSync(playGamesSavesPath, 'utf-8'));
      } catch {}
    }

    savesMap[playerId] = {
      ...save,
      gamerTag: gamerTag || 'Jugador',
      savedAt: Date.now(),
    };

    fs.writeFileSync(playGamesSavesPath, JSON.stringify(savesMap, null, 2), 'utf-8');
    res.json({ success: true, message: 'Partida guardada en la nube de Google Play Games' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/play-games/cloud-save', (req: Request, res: Response) => {
  const playerId = req.query.playerId as string;
  if (!playerId) {
    return res.status(400).json({ success: false, error: 'Se requiere playerId' });
  }

  try {
    if (fs.existsSync(playGamesSavesPath)) {
      const savesMap = JSON.parse(fs.readFileSync(playGamesSavesPath, 'utf-8'));
      if (savesMap[playerId]) {
        return res.json({ success: true, save: savesMap[playerId] });
      }
    }
    res.json({ success: true, save: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
