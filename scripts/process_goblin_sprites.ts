import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface GoblinSpriteJob {
  id: string;
  sourceJpg: string;
  outputPng: string;
}

const JOBS: GoblinSpriteJob[] = [
  {
    id: 'goblin_daga_attack',
    sourceJpg: 'src/assets/images/gob_daga_atk_1793959279288.jpg',
    outputPng: 'public/assets/combat/goblin_daga_attack.png',
  },
  {
    id: 'goblin_daga_hurt',
    sourceJpg: 'src/assets/images/gob_daga_hurt_1793959281660.jpg',
    outputPng: 'public/assets/combat/goblin_daga_hurt.png',
  },
  {
    id: 'goblin_honda_attack',
    sourceJpg: 'src/assets/images/gob_honda_atk_1793959283039.jpg',
    outputPng: 'public/assets/combat/goblin_honda_attack.png',
  },
  {
    id: 'goblin_honda_hurt',
    sourceJpg: 'src/assets/images/gob_honda_hurt_1793959285611.jpg',
    outputPng: 'public/assets/combat/goblin_honda_hurt.png',
  },
  {
    id: 'goblin_chaman_attack',
    sourceJpg: 'src/assets/images/gob_chaman_atk_1793959287062.jpg',
    outputPng: 'public/assets/combat/goblin_chaman_attack.png',
  },
  {
    id: 'goblin_chaman_hurt',
    sourceJpg: 'src/assets/images/gob_chaman_hurt_1793959288230.jpg',
    outputPng: 'public/assets/combat/goblin_chaman_hurt.png',
  },
  {
    id: 'goblin_garrote_attack',
    sourceJpg: 'src/assets/images/gob_garrote_atk_1793959290591.jpg',
    outputPng: 'public/assets/combat/goblin_garrote_attack.png',
  },
  {
    id: 'goblin_garrote_hurt',
    sourceJpg: 'src/assets/images/gob_garrote_hurt_1793959289409.jpg',
    outputPng: 'public/assets/combat/goblin_garrote_hurt.png',
  },
];

// Copy clean idle attachments
fs.copyFileSync('public/assets/aistudio/image_3ed3f876.png', 'public/assets/combat/goblin_daga_clean.png');
fs.copyFileSync('public/assets/aistudio/image_92bf2875.png', 'public/assets/combat/goblin_honda_clean.png');
console.log('Clean goblin idle sprites updated successfully.');

function processSprite(job: GoblinSpriteJob) {
  console.log(`Processing ${job.id}...`);
  const tmpPng = `/tmp/${job.id}_raw.png`;
  execSync(`convert "${job.sourceJpg}" "${tmpPng}"`);
  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;

  // Flood-fill background from edges
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isWhiteBg(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r >= 235 && g >= 235 && b >= 235;
  }

  // Seed outer boundary pixels
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
      png.data[idx + 3] = 0; // transparent
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

  // Antialiasing pass on edges
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

  // Non-transparent bounds
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

  // Generous 24px padding around all 4 sides so zero weapon/body pixels are cropped
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

  fs.writeFileSync(job.outputPng, PNG.sync.write(croppedPng));
  console.log(`Saved ${job.outputPng} (${cropW}x${cropH}, bounds: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY})`);
}

for (const job of JOBS) {
  processSprite(job);
}

console.log('All 8 goblin combat sprites processed successfully with complete, uncropped silhouettes!');
