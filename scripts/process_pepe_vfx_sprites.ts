import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface VfxTask {
  id: string;
  sourceJpg: string;
  outputPng: string;
  removeEnclosedWhiteHoles: boolean;
  minHoleSizeForAutoClear: number;
}

const TASKS: VfxTask[] = [
  {
    id: 'pepe_vfx_hachazo_t1',
    sourceJpg: 'src/assets/images/pepe_vfx_hachazo_t1_1794572875905.jpg',
    outputPng: 'public/assets/combat/pepe_vfx_hachazo_t1.png',
    removeEnclosedWhiteHoles: false,
    minHoleSizeForAutoClear: 999999,
  },
  {
    id: 'pepe_vfx_hachazo_t2',
    sourceJpg: 'src/assets/images/pepe_vfx_hachazo_t2_1794572875623.jpg',
    outputPng: 'public/assets/combat/pepe_vfx_hachazo_t2.png',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 999999,
  },
  {
    id: 'pepe_vfx_hachazo_t3',
    sourceJpg: 'src/assets/images/pepe_vfx_hachazo_t3_1794572946693.jpg',
    outputPng: 'public/assets/combat/pepe_vfx_hachazo_t3.png',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 999999,
  },
  {
    id: 'pepe_vfx_remo_t1',
    sourceJpg: 'src/assets/images/pepe_vfx_remo_head_t1_1794573634225.jpg',
    outputPng: 'public/assets/combat/pepe_vfx_remo_t1.png',
    removeEnclosedWhiteHoles: false,
    minHoleSizeForAutoClear: 999999,
  },
  {
    id: 'pepe_vfx_remo_t2',
    sourceJpg: 'src/assets/images/pepe_vfx_remo_head_t2_1794573634042.jpg',
    outputPng: 'public/assets/combat/pepe_vfx_remo_t2.png',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 8000,
  },
  {
    id: 'pepe_vfx_remo_t3',
    sourceJpg: 'src/assets/images/pepe_vfx_remo_head_t3_1794573635184.jpg',
    outputPng: 'public/assets/combat/pepe_vfx_remo_t3.png',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 999999,
  },
  {
    id: 'arlem_vfx_slash',
    sourceJpg: 'src/assets/images/arlem_vfx_slash_1794573633241.jpg',
    outputPng: 'public/assets/combat/arlem_vfx_slash.png',
    removeEnclosedWhiteHoles: true,
    minHoleSizeForAutoClear: 3800,
  },
];

function isNearWhite(r: number, g: number, b: number, threshold = 234, maxSat = 18): boolean {
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  return r >= threshold && g >= threshold && b >= threshold && maxC - minC <= maxSat;
}

function processVfxSprite(task: VfxTask) {
  console.log(`Processing ${task.id}...`);
  const tmpPng = `/tmp/${task.id}_raw.png`;
  execSync(`convert "${task.sourceJpg}" "${tmpPng}"`);
  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;

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
    if (isNearWhite(png.data[idx], png.data[idx + 1], png.data[idx + 2], 232, 22)) {
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

  // 2. Optionally remove ink-enclosed white holes
  if (task.removeEnclosedWhiteHoles) {
    const holeVisited = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const pos = y * w + x;
        if (holeVisited[pos]) continue;
        const idx = pos << 2;
        if (png.data[idx + 3] === 0) continue;
        if (!isNearWhite(png.data[idx], png.data[idx + 1], png.data[idx + 2], 242, 10)) continue;

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
            if (isNearWhite(nr, ng, nb, 240, 12)) {
              holeVisited[npos] = 1;
              bq.push(nx, ny);
            } else {
              const lum = (nr + ng + nb) / 3;
              const sat = Math.max(nr, ng, nb) - Math.min(nr, ng, nb);
              if (lum < 95 || (lum < 185 && sat < 24)) darkBorderCount++;
              else coloredBorderCount++;
            }
          }
        }

        const totalBorder = darkBorderCount + coloredBorderCount;
        const isInkEnclosedHole = totalBorder > 0 && darkBorderCount / totalBorder > 0.55 && comp.length >= 25;
        const isLargeNeutralPocket = comp.length >= task.minHoleSizeForAutoClear && darkBorderCount >= 6;
        if (isInkEnclosedHole || isLargeNeutralPocket) {
          for (const cpos of comp) {
            png.data[(cpos << 2) + 3] = 0;
          }
        }
      }
    }
  }

  // 3. Soft edge antialiasing for pixels bordering transparent background
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      if (png.data[idx + 3] > 0) {
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        if (r > 205 && g > 205 && b > 205 && maxC - minC < 30) {
          let hasTransparentNeighbor = false;
          for (let dy = -1; dy <= 1; dy++) {
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
            if (hasTransparentNeighbor) break;
          }
          if (hasTransparentNeighbor) {
            const lum = (r + g + b) / 3;
            if (lum > 240) {
              png.data[idx + 3] = 0;
            } else {
              const fade = (240 - lum) / 35;
              png.data[idx + 3] = Math.round(255 * Math.max(0, Math.min(1, fade)));
            }
          }
        }
      }
    }
  }

  // 4. Trim to bounding box with clean padding
  let minX = w,
    maxX = 0,
    minY = h,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      if (png.data[idx + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 16;
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

  fs.mkdirSync(path.dirname(task.outputPng), { recursive: true });
  fs.writeFileSync(task.outputPng, PNG.sync.write(croppedPng));
  console.log(`Saved transparent VFX sprite to ${task.outputPng} (${cropW}x${cropH})`);
}

for (const task of TASKS) {
  processVfxSprite(task);
}
console.log('All Pepe Loux VFX sprites processed!');
