import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface SpriteTask {
  id: string;
  sourceJpg: string;
  outputPng: string;
  whiteThreshold?: number;
}

const TASKS: SpriteTask[] = [
  {
    id: 'prometeo_idle',
    sourceJpg: 'src/assets/images/prometeo_combat_idle_1794404179926.jpg',
    outputPng: 'public/assets/combat/prometeo_idle.png',
  },
  {
    id: 'prometeo_hurt',
    sourceJpg: 'src/assets/images/prometeo_combat_hurt_1794404193701.jpg',
    outputPng: 'public/assets/combat/prometeo_hurt.png',
  },
  {
    id: 'prometeo_attack',
    sourceJpg: 'src/assets/images/prometeo_combat_attack_1794404206813.jpg',
    outputPng: 'public/assets/combat/prometeo_attack.png',
  },
  {
    id: 'prometeo_cast',
    sourceJpg: 'src/assets/images/prometeo_combat_cast_1794404220288.jpg',
    outputPng: 'public/assets/combat/prometeo_cast.png',
  },
];

function processSprite(task: SpriteTask) {
  console.log(`Processing ${task.id}...`);
  const tmpPng = `/tmp/${task.id}_raw.png`;
  execSync(`convert "${task.sourceJpg}" "${tmpPng}"`);
  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;

  const threshold = task.whiteThreshold || 238;

  // Connected component flood fill from all perimeter pixels
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isWhiteBg(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r >= threshold && g >= threshold && b >= threshold;
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

  // Edge smoothing and antialiasing on outer boundaries
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

  fs.writeFileSync(task.outputPng, PNG.sync.write(croppedPng));
  console.log(`Saved transparent sprite to ${task.outputPng} (${cropW}x${cropH})`);
}

for (const task of TASKS) {
  processSprite(task);
}

// Convert Skill icons to public/assets/skills/
console.log('Converting skill icons...');
execSync(`convert "src/assets/images/prometeo_skill_fireball_1794404234329.jpg" -resize 256x256 "public/assets/skills/prometeo_bola_fuego.png"`);
execSync(`convert "src/assets/images/prometeo_skill_greenblade_1794404247607.jpg" -resize 256x256 "public/assets/skills/prometeo_espada_verde.png"`);
execSync(`convert "src/assets/images/prometeo_skill_firebolt_1794404259777.jpg" -resize 256x256 "public/assets/skills/prometeo_fire_bolt.png"`);

// Also create a polished portrait from idle image if needed
execSync(`convert "src/assets/images/prometeo_combat_idle_1794404179926.jpg" -crop 650x650+180+10 -resize 256x256 "public/assets/portraits/prometeo_cazador.png"`);

console.log('All Prometeo assets processed successfully!');
