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
    id: 'ragnavaldr_idle',
    sourceJpg: 'src/assets/images/ragnavaldr_idle_clean_1794478348397.jpg',
    outputPng: 'public/assets/combat/ragnavaldr_idle.png',
    whiteThreshold: 236,
  },
  {
    id: 'ragnavaldr_hurt',
    sourceJpg: 'src/assets/images/ragnavaldr_hurt_clean_1794478327380.jpg',
    outputPng: 'public/assets/combat/ragnavaldr_hurt.png',
    whiteThreshold: 235,
  },
  {
    id: 'ragnavaldr_attack',
    sourceJpg: 'src/assets/images/ragnavaldr_attack_clean_1794478276837.jpg',
    outputPng: 'public/assets/combat/ragnavaldr_attack.png',
    whiteThreshold: 236,
  },
  {
    id: 'ragnavaldr_furia',
    sourceJpg: 'src/assets/images/ragnavaldr_furia_clean_1794478311872.jpg',
    outputPng: 'public/assets/combat/ragnavaldr_furia.png',
    whiteThreshold: 242,
  },
  {
    id: 'ragnavaldr_cast',
    sourceJpg: 'src/assets/images/ragnavaldr_cast_clean_1794478294543.jpg',
    outputPng: 'public/assets/combat/ragnavaldr_cast.png',
    whiteThreshold: 238,
  },
];

function processSprite(task: SpriteTask) {
  console.log(`Processing ${task.id}...`);
  const tmpPng = `/tmp/${task.id}_raw.png`;
  execSync(`convert "${task.sourceJpg}" "${tmpPng}"`);
  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;

  const threshold = task.whiteThreshold || 236;

  // Flood fill background from perimeter
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isBgPixel(idx: number, y: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    // White background
    if (r >= threshold && g >= threshold && b >= threshold) return true;
    // Floor shadow (tan oval near bottom)
    if (y > h * 0.82 && r >= 170 && g >= 140 && b >= 95 && Math.abs((r - g) - 36) < 30) {
      return true;
    }
    return false;
  }

  // Seed borders
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

    if (isBgPixel(idx, qy)) {
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

  const tmpOut = `/tmp/${task.id}_cropped.png`;
  fs.writeFileSync(tmpOut, PNG.sync.write(croppedPng));

  // Standardize sprite height to 1195px
  execSync(`convert "${tmpOut}" -resize x1195 "${task.outputPng}"`);
  console.log(`Saved transparent sprite to ${task.outputPng}`);
}

for (const task of TASKS) {
  processSprite(task);
}

// Generate portrait directly from the user's uploaded authentic image
console.log('Generating Ragnavaldr portrait from authentic attachment...');
execSync(`convert "public/assets/aistudio/ragnavaldr_noanim_266f9383.png" -crop 1280x1280+360+50 +repage -resize 512x512 "public/assets/portraits/ragnavaldr.png"`);
execSync(`convert "public/assets/portraits/ragnavaldr.png" -resize 256x256 "public/assets/portraits/ragnavaldr_icono.png"`);

// Generate authentic skill icons matching this exact character
console.log('Generating updated skill icons matching this exact character...');
// 1. Spear attack icon: from clean attack pose (spearheads and hands)
execSync(`convert "src/assets/images/ragnavaldr_attack_clean_1794478276837.jpg" -crop 550x550+440+200 +repage -resize 256x256 "public/assets/skills/ragnavaldr_doble_lanza.png"`);
// 2. Furia icon: roaring face with glowing eyes and fiery aura from clean furia pose
execSync(`convert "src/assets/images/ragnavaldr_furia_clean_1794478311872.jpg" -crop 520x520+240+110 +repage -resize 256x256 "public/assets/skills/ragnavaldr_furia.png"`);
// 3. Ice Knife icon: ice crystal and hand from clean cast pose
execSync(`convert "src/assets/images/ragnavaldr_cast_clean_1794478294543.jpg" -crop 480x480+500+20 +repage -resize 256x256 "public/assets/skills/ragnavaldr_cuchillo_hielo.png"`);

console.log('All authentic Ragnavaldr assets generated and saved successfully!');
