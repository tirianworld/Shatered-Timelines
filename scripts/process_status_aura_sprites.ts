import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface AuraSpriteTask {
  id: string;
  sourceJpg: string;
  outputPng: string;
  mode: 'inked' | 'glow_translucent';
  removeEnclosedWhiteHoles: boolean;
  minHoleSizeForAutoClear: number;
  clearLargeWhiteDiscs?: boolean;
  maxDimension: number;
}

const TASKS: AuraSpriteTask[] = [
  {
    id: 'aura_flames',
    sourceJpg: 'src/assets/images/aura_flames_vfx_1794711766106.jpg',
    outputPng: 'public/assets/combat/status/aura_flames.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 60,
    clearLargeWhiteDiscs: true,
    maxDimension: 520,
  },
  {
    id: 'aura_power',
    sourceJpg: 'src/assets/images/aura_power_vfx_1794711767206.jpg',
    outputPng: 'public/assets/combat/status/aura_power.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 60,
    clearLargeWhiteDiscs: true,
    maxDimension: 520,
  },
  {
    id: 'aura_frost',
    sourceJpg: 'src/assets/images/aura_frost_vfx_1794711766739.jpg',
    outputPng: 'public/assets/combat/status/aura_frost.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 180,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_lightning',
    sourceJpg: 'src/assets/images/aura_lightning_vfx_1794711768200.jpg',
    outputPng: 'public/assets/combat/status/aura_lightning.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 45,
    clearLargeWhiteDiscs: true,
    maxDimension: 520,
  },
  {
    id: 'aura_poison',
    sourceJpg: 'src/assets/images/aura_poison_vfx_1794711769506.jpg',
    outputPng: 'public/assets/combat/status/aura_poison.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 60,
    clearLargeWhiteDiscs: true,
    maxDimension: 520,
  },
  {
    id: 'aura_stun',
    sourceJpg: 'src/assets/images/aura_stun_vfx_1794711770529.jpg',
    outputPng: 'public/assets/combat/status/aura_stun.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 80,
    clearLargeWhiteDiscs: true,
    maxDimension: 384,
  },
  {
    id: 'aura_bleed',
    sourceJpg: 'src/assets/images/aura_bleed_vfx_1794711771944.jpg',
    outputPng: 'public/assets/combat/status/aura_bleed.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 120,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_shield',
    sourceJpg: 'src/assets/images/aura_shield_vfx_1794711770172.jpg',
    outputPng: 'public/assets/combat/status/aura_shield.png',
    mode: 'glow_translucent',
    removeEnclosedWhiteHoles: false,
    minHoleSizeForAutoClear: 500,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_regen',
    sourceJpg: 'src/assets/images/aura_regen_vfx_1794711770830.jpg',
    outputPng: 'public/assets/combat/status/aura_regen.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 120,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_wind',
    sourceJpg: 'src/assets/images/aura_wind_vfx_1794711772113.jpg',
    outputPng: 'public/assets/combat/status/aura_wind.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 120,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_charm',
    sourceJpg: 'src/assets/images/aura_charm_vfx_1794711773287.jpg',
    outputPng: 'public/assets/combat/status/aura_charm.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: false,
    minHoleSizeForAutoClear: 200,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_faerie',
    sourceJpg: 'src/assets/images/aura_faerie_vfx_1794711773874.jpg',
    outputPng: 'public/assets/combat/status/aura_faerie.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 60,
    clearLargeWhiteDiscs: true,
    maxDimension: 520,
  },
  {
    id: 'aura_confused',
    sourceJpg: 'src/assets/images/aura_confused_vfx_1794711775200.jpg',
    outputPng: 'public/assets/combat/status/aura_confused.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 60,
    clearLargeWhiteDiscs: true,
    maxDimension: 384,
  },
  {
    id: 'aura_shatter',
    sourceJpg: 'src/assets/images/aura_shatter_vfx_1794711775310.jpg',
    outputPng: 'public/assets/combat/status/aura_shatter.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 80,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_chains',
    sourceJpg: 'src/assets/images/aura_chains_vfx_1794711776427.jpg',
    outputPng: 'public/assets/combat/status/aura_chains.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 50,
    clearLargeWhiteDiscs: true,
    maxDimension: 520,
  },
  {
    id: 'aura_radiance',
    sourceJpg: 'src/assets/images/aura_radiance_vfx_1794711775107.jpg',
    outputPng: 'public/assets/combat/status/aura_radiance.png',
    mode: 'glow_translucent',
    removeEnclosedWhiteHoles: false,
    minHoleSizeForAutoClear: 500,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_shadow',
    sourceJpg: 'src/assets/images/aura_shadow_vfx_1794711776023.jpg',
    outputPng: 'public/assets/combat/status/aura_shadow.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 50,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
  {
    id: 'aura_decay',
    sourceJpg: 'src/assets/images/aura_decay_vfx_1794711776044.jpg',
    outputPng: 'public/assets/combat/status/aura_decay.png',
    mode: 'inked',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 50,
    clearLargeWhiteDiscs: false,
    maxDimension: 520,
  },
];

function isNearWhite(r: number, g: number, b: number, threshold = 234, maxSat = 20): boolean {
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  return r >= threshold && g >= threshold && b >= threshold && maxC - minC <= maxSat;
}

function unpremultiplyFromWhite(r: number, g: number, b: number, aNorm: number): [number, number, number] {
  if (aNorm <= 0.02) return [r, g, b];
  const inv = 1 / aNorm;
  const ur = Math.max(0, Math.min(255, Math.round((r - 255 * (1 - aNorm)) * inv)));
  const ug = Math.max(0, Math.min(255, Math.round((g - 255 * (1 - aNorm)) * inv)));
  const ub = Math.max(0, Math.min(255, Math.round((b - 255 * (1 - aNorm)) * inv)));
  return [ur, ug, ub];
}

function processAuraSprite(task: AuraSpriteTask) {
  console.log(`Processing ${task.id}...`);
  const tmpPng = `/tmp/${task.id}_raw.png`;
  execSync(`convert "${task.sourceJpg}" "${tmpPng}"`);
  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;

  if (task.mode === 'glow_translucent') {
    // Convert white background smoothly to alpha while recovering vivid energy colors
    for (let i = 0; i < w * h; i++) {
      const idx = i << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const maxDist = Math.max(255 - r, 255 - g, 255 - b);
      if (maxDist <= 6) {
        png.data[idx + 3] = 0;
        continue;
      }
      // Boost alpha cleanly so rim/rays stay vivid while white interior fades to true alpha
      const aNorm = Math.min(1, (maxDist / 255) * 2.1);
      const [ur, ug, ub] = unpremultiplyFromWhite(r, g, b, Math.max(0.2, aNorm));
      png.data[idx] = ur;
      png.data[idx + 1] = ug;
      png.data[idx + 2] = ub;
      png.data[idx + 3] = Math.round(aNorm * 255);
    }
  } else {
    // 1. Flood fill from perimeter
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    for (let x = 0; x < w; x++) {
      queue.push(x, 0);
      visited[x] = 1;
      queue.push(x, h - 1);
      visited[(h - 1) * w + x] = 1;
    }
    for (let y = 1; y < h - 1; y++) {
      queue.push(0, y);
      visited[y * w] = 1;
      queue.push(w - 1, y);
      visited[y * w + (w - 1)] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const qx = queue[head++];
      const qy = queue[head++];
      const idx = (qy * w + qx) << 2;
      if (isNearWhite(png.data[idx], png.data[idx + 1], png.data[idx + 2], 234, 24)) {
        png.data[idx + 3] = 0;
        const neighbors = [
          [qx + 1, qy],
          [qx - 1, qy],
          [qx, qy + 1],
          [qx, qy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const npos = ny * w + nx;
            if (!visited[npos]) {
              visited[npos] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    // 2. Remove enclosed neutral white pockets (including closed center rings)
    if (task.removeEnclosedWhiteHoles) {
      const holeVisited = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const pos = y * w + x;
          if (holeVisited[pos]) continue;
          const idx = pos << 2;
          if (png.data[idx + 3] === 0) continue;
          if (!isNearWhite(png.data[idx], png.data[idx + 1], png.data[idx + 2], 242, 14)) continue;

          const comp: number[] = [];
          const bq: number[] = [x, y];
          holeVisited[pos] = 1;
          let bh = 0;
          let darkBorderCount = 0;
          let coloredBorderCount = 0;

          while (bh < bq.length) {
            const cx = bq[bh++];
            const cy = bq[bh++];
            const cpos = cy * w + cx;
            comp.push(cpos);

            const dirs = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1],
            ];
            for (const [nx, ny] of dirs) {
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
              const npos = ny * w + nx;
              if (holeVisited[npos]) continue;
              const nidx = npos << 2;
              if (png.data[nidx + 3] === 0) continue;
              const nr = png.data[nidx];
              const ng = png.data[nidx + 1];
              const nb = png.data[nidx + 2];
              if (isNearWhite(nr, ng, nb, 240, 14)) {
                holeVisited[npos] = 1;
                bq.push(nx, ny);
              } else {
                const lum = (nr + ng + nb) / 3;
                if (lum < 95) darkBorderCount++;
                else coloredBorderCount++;
              }
            }
          }

          const totalBorder = darkBorderCount + coloredBorderCount;
          const isInkEnclosedHole = totalBorder > 0 && darkBorderCount / totalBorder > 0.35 && comp.length >= 25;
          const isLargeNeutralPocket = comp.length >= task.minHoleSizeForAutoClear && darkBorderCount >= 4;
          const isLargeGlowDisc = Boolean(task.clearLargeWhiteDiscs) && comp.length >= 2500;
          if (isInkEnclosedHole || isLargeNeutralPocket || isLargeGlowDisc) {
            for (const cpos of comp) {
              png.data[(cpos << 2) + 3] = 0;
            }
          }
        }
      }
    }

    // 3. Soft 2-pass edge antialiasing + white decontamination for fringe-free edges
    for (let pass = 0; pass < 2; pass++) {
      const updates: Array<{ idx: number; r: number; g: number; b: number; a: number }> = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) << 2;
          const curA = png.data[idx + 3];
          if (curA === 0) continue;
          const r = png.data[idx];
          const g = png.data[idx + 1];
          const b = png.data[idx + 2];
          const lum = (r + g + b) / 3;
          if (lum < 175) continue;

          let hasTransparentNeighbor = false;
          for (let dy = -1; dy <= 1 && !hasTransparentNeighbor; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (png.data[((ny * w + nx) << 2) + 3] === 0) {
                  hasTransparentNeighbor = true;
                  break;
                }
              }
            }
          }

          if (hasTransparentNeighbor) {
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const sat = maxC - minC;
            if (lum > 240 && sat < 24) {
              updates.push({ idx, r, g, b, a: 0 });
            } else if (sat < 36 && lum > 195) {
              const aNorm = Math.max(0, Math.min(1, (242 - lum) / 48));
              const [ur, ug, ub] = unpremultiplyFromWhite(r, g, b, Math.max(0.15, aNorm));
              updates.push({ idx, r: ur, g: ug, b: ub, a: Math.round(aNorm * 255) });
            } else if (minC > 190) {
              // Colored soft glow fringe against white -> convert white blend to true alpha
              const aNorm = Math.max(0.12, Math.min(1, (255 - minC) / 65));
              const [ur, ug, ub] = unpremultiplyFromWhite(r, g, b, aNorm);
              updates.push({ idx, r: ur, g: ug, b: ub, a: Math.round(aNorm * curA) });
            }
          }
        }
      }
      for (const u of updates) {
        png.data[u.idx] = u.r;
        png.data[u.idx + 1] = u.g;
        png.data[u.idx + 2] = u.b;
        png.data[u.idx + 3] = u.a;
      }
    }
  }

  // 4. Trim to bounding box with clean padding (preserving horizontal symmetry slightly if needed)
  let minX = w,
    maxX = 0,
    minY = h,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      if (png.data[idx + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    throw new Error(`Empty output bounding box for ${task.id}`);
  }

  const pad = 12;
  const cropMinX = Math.max(0, minX - pad);
  const cropMaxX = Math.min(w - 1, maxX + pad);
  const cropMinY = Math.max(0, minY - pad);
  const cropMaxY = Math.min(h - 1, maxY + pad);
  const cropW = cropMaxX - cropMinX + 1;
  const cropH = cropMaxY - cropMinY + 1;

  const croppedPng = new PNG({ width: cropW, height: cropH });
  for (let cy = 0; cy < cropH; cy++) {
    const sy = cropMinY + cy;
    for (let cx = 0; cx < cropW; cx++) {
      const sx = cropMinX + cx;
      const sidx = (sy * w + sx) << 2;
      const didx = (cy * cropW + cx) << 2;
      croppedPng.data[didx] = png.data[sidx];
      croppedPng.data[didx + 1] = png.data[sidx + 1];
      croppedPng.data[didx + 2] = png.data[sidx + 2];
      croppedPng.data[didx + 3] = png.data[sidx + 3];
    }
  }

  const tmpCropped = `/tmp/${task.id}_cropped.png`;
  fs.writeFileSync(tmpCropped, PNG.sync.write(croppedPng));
  fs.mkdirSync(path.dirname(task.outputPng), { recursive: true });
  execSync(`convert "${tmpCropped}" -resize "${task.maxDimension}x${task.maxDimension}>" "${task.outputPng}"`);
  console.log(`Saved ${task.outputPng}`);
}

for (const task of TASKS) {
  processAuraSprite(task);
}
console.log('All 18 status aura sprites processed!');
