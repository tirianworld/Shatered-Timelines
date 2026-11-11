import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface SpriteTask {
  id: string;
  sourceJpg: string;
  outputPng: string;
  cleanFloatingText?: boolean;
}

const TASKS: SpriteTask[] = [
  {
    id: 'pepe_loux_idle',
    sourceJpg: 'src/assets/images/pepe_loux_idle_1794397357181.jpg',
    outputPng: 'public/assets/combat/pepe_loux_idle.png',
  },
  {
    id: 'pepe_loux_hurt',
    sourceJpg: 'src/assets/images/pepe_loux_hurt_1794397358993.jpg',
    outputPng: 'public/assets/combat/pepe_loux_hurt.png',
  },
  {
    id: 'pepe_loux_attack',
    sourceJpg: 'src/assets/images/pepe_loux_skill_1794397359898.jpg',
    outputPng: 'public/assets/combat/pepe_loux_attack.png',
  },
  {
    id: 'arlem_idle',
    sourceJpg: 'src/assets/images/arlem_bard_idle_1794399125118.jpg',
    outputPng: 'public/assets/combat/arlem_idle.png',
  },
  {
    id: 'arlem_hurt',
    sourceJpg: 'src/assets/images/arlem_bard_hurt_1794399156114.jpg',
    outputPng: 'public/assets/combat/arlem_hurt.png',
  },
  {
    id: 'arlem_attack',
    sourceJpg: 'src/assets/images/arlem_bard_attack_1794399142764.jpg',
    outputPng: 'public/assets/combat/arlem_attack.png',
  },
  {
    id: 'edacorn_idle',
    sourceJpg: 'src/assets/images/edacorn_idle_1794397363606.jpg',
    outputPng: 'public/assets/combat/edacorn_idle.png',
  },
  {
    id: 'edacorn_hurt',
    sourceJpg: 'src/assets/images/edacorn_hurt_1794397366376.jpg',
    outputPng: 'public/assets/combat/edacorn_hurt.png',
    cleanFloatingText: true,
  },
  {
    id: 'edacorn_attack',
    sourceJpg: 'src/assets/images/edacorn_skill_1794397365246.jpg',
    outputPng: 'public/assets/combat/edacorn_attack.png',
  },
];

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

  // If floating text cleanup requested (e.g. comic text 'OUCH!' and '75' near the very top of edacorn_hurt)
  if (task.cleanFloatingText) {
    // In top 12% of the image, remove any small text blobs outside the helmet (x < 0.42*w or x > 0.68*w)
    for (let y = 0; y < Math.floor(h * 0.12); y++) {
      for (let x = 0; x < w; x++) {
        if (x < w * 0.45 || x > w * 0.68) {
          const idx = (y * w + x) << 2;
          png.data[idx + 3] = 0;
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
        if (r > 215 && g > 215 && b > 215) {
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
              const fade = (240 - lum) / 25;
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

  const pad = 20;
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
  console.log(`Saved transparent sprite to ${task.outputPng} (${cropW}x${cropH})`);
}

for (const task of TASKS) {
  processSprite(task);
}

console.log('All hero combat sprites processed successfully!');
