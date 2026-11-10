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
    id: 'hobgoblin_fase1_attack',
    sourceJpg: 'src/assets/images/hobgoblin_fase1_attack_1794341790761.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase1_attack.png',
  },
  {
    id: 'hobgoblin_fase1_hurt',
    sourceJpg: 'src/assets/images/hobgoblin_fase1_hurt_1794341811934.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase1_hurt.png',
  },
  {
    id: 'hobgoblin_fase2_idle',
    sourceJpg: 'src/assets/images/hobgoblin_fase2_idle_1794341834871.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase2_idle.png',
  },
  {
    id: 'hobgoblin_fase2_attack',
    sourceJpg: 'src/assets/images/hobgoblin_fase2_attack_1794341853520.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase2_attack.png',
  },
  {
    id: 'hobgoblin_fase2_hurt',
    sourceJpg: 'src/assets/images/hobgoblin_fase2_hurt_1794341871434.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase2_hurt.png',
  },
  {
    id: 'hobgoblin_fase3_idle',
    sourceJpg: 'src/assets/images/hobgoblin_fase3_idle_1794341890087.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase3_idle.png',
  },
  {
    id: 'hobgoblin_fase3_attack',
    sourceJpg: 'src/assets/images/hobgoblin_fase3_attack_1794341909863.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase3_attack.png',
  },
  {
    id: 'hobgoblin_fase3_hurt',
    sourceJpg: 'src/assets/images/hobgoblin_fase3_hurt_1794341928967.jpg',
    outputPng: 'public/assets/combat/hobgoblin_fase3_hurt.png',
  },
];

// Phase 1 idle is already clean in public/assets/combat/hobgoblin_capataz_clean.png
fs.copyFileSync(
  'public/assets/combat/hobgoblin_capataz_clean.png',
  'public/assets/combat/hobgoblin_fase1_idle.png'
);
console.log('Copied hobgoblin_fase1_idle.png from clean sprite.');

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

  // Edge smoothing and antialiasing
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
  console.log(`Saved ${task.outputPng} (${cropW}x${cropH})`);
}

for (const task of TASKS) {
  processSprite(task);
}

console.log('All Hobgoblin 3-phase combat sprites processed successfully!');
