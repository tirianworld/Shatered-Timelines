import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface SpriteTask {
  id: string;
  sourceJpg: string;
  outputPng: string;
}

const TASKS: SpriteTask[] = [
  {
    id: 'guardia_lanza_attack',
    sourceJpg: 'src/assets/images/lanza_atk_zoomed_1793958606202.jpg',
    outputPng: 'public/assets/combat/guardia_lanza_attack.png',
  },
  {
    id: 'guardia_lanza_hurt',
    sourceJpg: 'src/assets/images/lanza_hurt_zoomed_1793958605923.jpg',
    outputPng: 'public/assets/combat/guardia_lanza_hurt.png',
  },
  {
    id: 'guardia_espada_attack',
    sourceJpg: 'src/assets/images/espada_atk_uncut_1793958681675.jpg',
    outputPng: 'public/assets/combat/guardia_espada_attack.png',
  },
  {
    id: 'guardia_espada_hurt',
    sourceJpg: 'src/assets/images/espada_hurt_uncut_1793958683098.jpg',
    outputPng: 'public/assets/combat/guardia_espada_hurt.png',
  },
  {
    id: 'guardia_ballesta_attack',
    sourceJpg: 'src/assets/images/ballesta_atk_uncut_1793958684621.jpg',
    outputPng: 'public/assets/combat/guardia_ballesta_attack.png',
  },
  {
    id: 'guardia_ballesta_hurt',
    sourceJpg: 'src/assets/images/ballesta_hurt_uncut_1793958684860.jpg',
    outputPng: 'public/assets/combat/guardia_ballesta_hurt.png',
  },
];

// 1. Copy user-provided pristine idle sprites
fs.copyFileSync('public/assets/aistudio/image_256d5f79.png', 'public/assets/combat/guardia_lanza_clean.png');
fs.copyFileSync('public/assets/aistudio/image_8fdcb1fe.png', 'public/assets/combat/guardia_espada_clean.png');
fs.copyFileSync('public/assets/aistudio/image_12cd855e.png', 'public/assets/combat/guardia_ballesta_clean.png');
console.log('Clean idle sprites copied successfully.');

function processSprite(task: SpriteTask) {
  console.log(`Processing ${task.id}...`);
  const tmpPng = `/tmp/${task.id}_raw.png`;
  execSync(`convert "${task.sourceJpg}" "${tmpPng}"`);
  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;

  // Connected component flood fill from all perimeter pixels
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isWhiteBg(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    // Threshold for off-white background with slight JPEG variance
    return r >= 235 && g >= 235 && b >= 235;
  }

  // Seed all borders
  for (let x = 0; x < w; x++) {
    queue.push(x, 0); visited[x] = 1;
    queue.push(x, h - 1); visited[(h - 1) * w + x] = 1;
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push(0, y); visited[y * w] = 1;
    queue.push(w - 1, y); visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const qx = queue[head++];
    const qy = queue[head++];
    const pos = qy * w + qx;
    const idx = pos << 2;

    if (isWhiteBg(idx)) {
      png.data[idx + 3] = 0; // Transparent
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

  // Edge smoothing and subtle antialiasing for outline preservation
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      const idx = pos << 2;
      if (png.data[idx + 3] > 0) {
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        if (r > 210 && g > 210 && b > 210) {
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
              const fade = (240 - lum) / 30;
              png.data[idx + 3] = Math.round(255 * Math.max(0, Math.min(1, fade)));
            }
          }
        }
      }
    }
  }

  // Measure non-transparent bounding box
  let minX = w, maxX = 0, minY = h, maxY = 0;
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

  // Add generous 24px padding around all 4 sides so zero weapon/character edges are cut
  const pad = 24;
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

  fs.writeFileSync(task.outputPng, PNG.sync.write(croppedPng));
  console.log(`Saved ${task.outputPng} (${cropW}x${cropH}, bounds: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY})`);
}

for (const task of TASKS) {
  processSprite(task);
}

console.log('All guard sprites processed successfully with complete, uncropped silhouettes!');
