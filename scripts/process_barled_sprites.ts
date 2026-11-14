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
    id: 'barled_idle',
    sourceJpg: 'src/assets/images/barled_combat_idle_1794563352298.jpg',
    outputPng: 'public/assets/combat/barled_idle.png',
    whiteThreshold: 238,
  },
  {
    id: 'barled_attack',
    sourceJpg: 'src/assets/images/barled_combat_attack_1794563353487.jpg',
    outputPng: 'public/assets/combat/barled_attack.png',
    whiteThreshold: 238,
  },
  {
    id: 'barled_cast',
    sourceJpg: 'src/assets/images/barled_combat_cast_1794563353536.jpg',
    outputPng: 'public/assets/combat/barled_cast.png',
    whiteThreshold: 238,
  },
  {
    id: 'barled_hurt',
    sourceJpg: 'src/assets/images/barled_combat_hurt_1794563354394.jpg',
    outputPng: 'public/assets/combat/barled_hurt.png',
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

  const threshold = task.whiteThreshold || 238;

  // 1. Flood fill background from perimeter
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isBgPixel(idx: number, y: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    if (r >= threshold && g >= threshold && b >= threshold) return true;
    if (y > h * 0.88 && r >= 160 && g >= 140 && b >= 110 && Math.abs(r - g) < 35 && Math.abs(g - b) < 40) {
      return true;
    }
    return false;
  }

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

  // 2. Also remove enclosed pure-white gaps (e.g., between arm, tunic, and spear shaft)
  // Keep tiny bright areas (like eyes/teeth) untouched by requiring component size >= 250px and y > h*0.25
  const compVisited = new Uint8Array(w * h);
  for (let y = Math.floor(h * 0.25); y < h; y++) {
    for (let x = 0; x < w; x++) {
      const startPos = y * w + x;
      if (compVisited[startPos]) continue;
      const startIdx = startPos << 2;
      if (png.data[startIdx + 3] === 0) continue;
      const r = png.data[startIdx];
      const g = png.data[startIdx + 1];
      const b = png.data[startIdx + 2];
      if (r < 245 || g < 245 || b < 245) continue;

      const compPixels: number[] = [];
      const cQueue: number[] = [x, y];
      compVisited[startPos] = 1;
      let chead = 0;
      let touchesFace = false;

      while (chead < cQueue.length) {
        const cx = cQueue[chead++];
        const cy = cQueue[chead++];
        const cpos = cy * w + cx;
        compPixels.push(cpos);
        if (cy < h * 0.28) touchesFace = true;

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const npos = ny * w + nx;
            if (!compVisited[npos]) {
              const nidx = npos << 2;
              if (
                png.data[nidx + 3] > 0 &&
                png.data[nidx] >= 242 &&
                png.data[nidx + 1] >= 242 &&
                png.data[nidx + 2] >= 242
              ) {
                compVisited[npos] = 1;
                cQueue.push(nx, ny);
              }
            }
          }
        }
      }

      if (!touchesFace && compPixels.length >= 250) {
        for (const p of compPixels) {
          png.data[(p << 2) + 3] = 0;
        }
      }
    }
  }

  // 3. Edge smoothing and antialiasing
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
            if (lum > 242) {
              png.data[idx + 3] = 0;
            } else {
              const fade = (242 - lum) / 25;
              png.data[idx + 3] = Math.round(255 * Math.max(0, Math.min(1, fade)));
            }
          }
        }
      }
    }
  }

  // 4. Measure non-transparent bounding box
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

  fs.mkdirSync('public/assets/combat', { recursive: true });
  execSync(`convert "${tmpOut}" -resize x1195 "${task.outputPng}"`);
  console.log(`Saved transparent sprite to ${task.outputPng}`);
}

for (const task of TASKS) {
  processSprite(task);
}

// Process Barled skill card icons with Tier 1 (Bronze), Tier 2 (Silver), Tier 3 (Gold) variants
fs.mkdirSync('public/assets/skills', { recursive: true });
const SKILL_CARDS = [
  {
    base: 'barled_inspiracion',
    src: 'src/assets/images/barled_skill_inspiracion_1794563354455.jpg',
  },
  {
    base: 'barled_fuego_feerico',
    src: 'src/assets/images/barled_skill_fuego_feerico_1794563354934.jpg',
  },
  {
    base: 'barled_curacion',
    src: 'src/assets/images/barled_skill_curacion_1794563355633.jpg',
  },
];

for (const sk of SKILL_CARDS) {
  execSync(`convert "${sk.src}" -resize 256x341! "public/assets/skills/${sk.base}.png"`);
  execSync(`convert "${sk.src}" -resize 244x329! -bordercolor "#b45309" -border 6 "public/assets/skills/${sk.base}_tier_1.png"`);
  execSync(`convert "${sk.src}" -modulate 106,115,100 -resize 244x329! -bordercolor "#cbd5e1" -border 6 "public/assets/skills/${sk.base}_tier_2.png"`);
  execSync(`convert "${sk.src}" -modulate 112,132,100 -resize 244x329! -bordercolor "#facc15" -border 6 "public/assets/skills/${sk.base}_tier_3.png"`);
  console.log(`Generated skill tiers for ${sk.base}`);
}

console.log('All Barled assets processed successfully!');
