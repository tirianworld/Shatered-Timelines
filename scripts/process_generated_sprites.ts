import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions
import { PNG } from 'pngjs';

interface SpriteJob {
  name: string;
  jpgPath: string;
  cleanPath: string;
  outPath: string;
}

const JOBS: SpriteJob[] = [
  {
    name: 'guardia_lanza_attack',
    jpgPath: 'src/assets/images/guardia_lanza_attack_1793956484792.jpg',
    cleanPath: 'public/assets/combat/guardia_lanza_clean.png',
    outPath: 'public/assets/combat/guardia_lanza_attack.png',
  },
  {
    name: 'guardia_lanza_hurt',
    jpgPath: 'src/assets/images/guardia_lanza_hurt_1793956485720.jpg',
    cleanPath: 'public/assets/combat/guardia_lanza_clean.png',
    outPath: 'public/assets/combat/guardia_lanza_hurt.png',
  },
  {
    name: 'guardia_espada_attack',
    jpgPath: 'src/assets/images/guardia_espada_attack_1793956489889.jpg',
    cleanPath: 'public/assets/combat/guardia_espada_clean.png',
    outPath: 'public/assets/combat/guardia_espada_attack.png',
  },
  {
    name: 'guardia_espada_hurt',
    jpgPath: 'src/assets/images/guardia_espada_hurt_1793956487623.jpg',
    cleanPath: 'public/assets/combat/guardia_espada_clean.png',
    outPath: 'public/assets/combat/guardia_espada_hurt.png',
  },
  {
    name: 'guardia_ballesta_attack',
    jpgPath: 'src/assets/images/guardia_ballesta_atk_1793956488729.jpg',
    cleanPath: 'public/assets/combat/guardia_ballesta_clean.png',
    outPath: 'public/assets/combat/guardia_ballesta_attack.png',
  },
  {
    name: 'guardia_ballesta_hurt',
    jpgPath: 'src/assets/images/guardia_ballesta_hurt_1793956489476.jpg',
    cleanPath: 'public/assets/combat/guardia_ballesta_clean.png',
    outPath: 'public/assets/combat/guardia_ballesta_hurt.png',
  },
  {
    name: 'guardia_pesado_attack',
    jpgPath: 'src/assets/images/guardia_pesado_attack_1793956490193.jpg',
    cleanPath: 'public/assets/combat/guardia_pesado_clean.png',
    outPath: 'public/assets/combat/guardia_pesado_attack.png',
  },
  {
    name: 'guardia_pesado_hurt',
    jpgPath: 'src/assets/images/guardia_pesado_hurt_1793956495759.jpg',
    cleanPath: 'public/assets/combat/guardia_pesado_clean.png',
    outPath: 'public/assets/combat/guardia_pesado_hurt.png',
  },
  {
    name: 'medusa_attack',
    jpgPath: 'src/assets/images/medusa_attack_1793956492866.jpg',
    cleanPath: 'public/assets/combat/medusa_clean.png',
    outPath: 'public/assets/combat/medusa_attack.png',
  },
  {
    name: 'medusa_hurt',
    jpgPath: 'src/assets/images/medusa_hurt_1793956491656.jpg',
    cleanPath: 'public/assets/combat/medusa_clean.png',
    outPath: 'public/assets/combat/medusa_hurt.png',
  },
];

function analyzeNonTransparent(png: PNG) {
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) << 2;
      if (png.data[idx + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function processJob(job: SpriteJob) {
  console.log(`Processing ${job.name}...`);
  if (!fs.existsSync(job.jpgPath)) {
    console.warn(`JPG missing: ${job.jpgPath}`);
    return;
  }
  if (!fs.existsSync(job.cleanPath)) {
    console.warn(`Clean sprite missing: ${job.cleanPath}`);
    return;
  }

  // 1. Convert JPG to PNG with transparent background using convert -fuzz 12% -transparent white
  const tmpPngPath = `/tmp/${job.name}_raw.png`;
  execSync(`convert "${job.jpgPath}" -fuzz 14% -transparent white "${tmpPngPath}"`);

  const rawPng = PNG.sync.read(fs.readFileSync(tmpPngPath));
  const cleanPng = PNG.sync.read(fs.readFileSync(job.cleanPath));

  // 2. BFS flood fill to clean any isolated white background border artifacts
  const w = rawPng.width;
  const h = rawPng.height;
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

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
    const idx = (qy * w + qx) << 2;
    const a = rawPng.data[idx + 3];
    const r = rawPng.data[idx];
    const g = rawPng.data[idx + 1];
    const b = rawPng.data[idx + 2];

    const isLightBg = (a < 60) || (r > 230 && g > 230 && b > 230);
    if (isLightBg) {
      rawPng.data[idx + 3] = 0; // make completely transparent
      const neighbors = [[qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]];
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

  // 3. Find character bounds in clean sprite and in rawPng
  const cleanBounds = analyzeNonTransparent(cleanPng);
  const rawBounds = analyzeNonTransparent(rawPng);

  console.log(`  Clean bounds: ${cleanBounds.w}x${cleanBounds.h}, baseline maxY: ${cleanBounds.maxY}`);
  console.log(`  Raw new pose bounds: ${rawBounds.w}x${rawBounds.h}, maxY: ${rawBounds.maxY}`);

  // Scale raw pose to match clean character height
  const scale = cleanBounds.h / rawBounds.h;
  const scaledW = Math.round(rawBounds.w * scale);
  const scaledH = cleanBounds.h;

  // Create destination canvas with exact dimensions of clean sprite
  const destPng = new PNG({ width: cleanPng.width, height: cleanPng.height });

  // Place character centered horizontally, aligned to clean sprite's baseline maxY
  const destBaseline = cleanBounds.maxY;
  const destY = Math.max(0, destBaseline - scaledH + 1);
  const destX = Math.round((cleanPng.width - scaledW) / 2);

  for (let dy = 0; dy < scaledH; dy++) {
    const sy = rawBounds.minY + dy / scale;
    const iy = Math.min(Math.floor(sy), rawBounds.maxY);
    for (let dx = 0; dx < scaledW; dx++) {
      const sx = rawBounds.minX + dx / scale;
      const ix = Math.min(Math.floor(sx), rawBounds.maxX);
      const sidx = (iy * w + ix) << 2;
      const a = rawPng.data[sidx + 3];

      if (a > 15) {
        const tx = destX + dx;
        const ty = destY + dy;
        if (tx >= 0 && tx < destPng.width && ty >= 0 && ty < destPng.height) {
          const didx = (ty * destPng.width + tx) << 2;
          destPng.data[didx] = rawPng.data[sidx];
          destPng.data[didx + 1] = rawPng.data[sidx + 1];
          destPng.data[didx + 2] = rawPng.data[sidx + 2];
          destPng.data[didx + 3] = a;
        }
      }
    }
  }

  fs.writeFileSync(job.outPath, PNG.sync.write(destPng));
  console.log(`  -> Saved ${job.outPath} (${destPng.width}x${destPng.height})`);
}

for (const job of JOBS) {
  processJob(job);
}
console.log('All 10 enemy combat poses processed successfully!');
