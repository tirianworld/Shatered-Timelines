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
    id: 'kairon_idle',
    sourceJpg: 'src/assets/images/kairon_tiefling_v2_idle_1794473473779.jpg',
    outputPng: 'public/assets/combat/kairon_idle.png',
    whiteThreshold: 238,
  },
  {
    id: 'kairon_hurt',
    sourceJpg: 'src/assets/images/kairon_tiefling_v2_hurt_1794473488309.jpg',
    outputPng: 'public/assets/combat/kairon_hurt.png',
    whiteThreshold: 236,
  },
  {
    id: 'kairon_attack',
    sourceJpg: 'src/assets/images/kairon_tiefling_v2_double_tap_1794473504751.jpg',
    outputPng: 'public/assets/combat/kairon_attack.png',
    whiteThreshold: 238,
  },
  {
    id: 'kairon_attack_dual',
    sourceJpg: 'src/assets/images/kairon_tiefling_v2_dual_shot_1794473524539.jpg',
    outputPng: 'public/assets/combat/kairon_attack_dual.png',
    whiteThreshold: 238,
  },
  {
    id: 'kairon_cast',
    sourceJpg: 'src/assets/images/kairon_tiefling_v2_sword_slash_1794473537859.jpg',
    outputPng: 'public/assets/combat/kairon_cast.png',
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

  // Flood fill background from perimeter
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isWhiteBg(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r >= threshold && g >= threshold && b >= threshold;
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

  const tmpOut = `/tmp/${task.id}_tiefling_cropped.png`;
  fs.writeFileSync(tmpOut, PNG.sync.write(croppedPng));

  // Resize to standardized ~1195px height
  execSync(`convert "${tmpOut}" -resize x1195 "${task.outputPng}"`);
  console.log(`Saved transparent tiefling sprite to ${task.outputPng} (height: 1195px)`);
}

for (const task of TASKS) {
  processSprite(task);
}

// Generate updated tiefling skill icons
console.log('Generating updated Kairon tiefling skill icons...');
execSync(`convert "src/assets/images/kairon_tiefling_v2_double_tap_1794473504751.jpg" -crop 450x450+10+120 +repage -resize 256x256 "public/assets/skills/kairon_tiro_doble.png"`);
execSync(`convert "src/assets/images/kairon_tiefling_v2_dual_shot_1794473524539.jpg" -crop 560x560+230+100 +repage -resize 256x256 "public/assets/skills/kairon_disparo_dual.png"`);
execSync(`convert "src/assets/images/kairon_tiefling_v2_sword_slash_1794473537859.jpg" -crop 580x580+250+40 +repage -resize 256x256 "public/assets/skills/kairon_espadazo_largo.png"`);

// Generate updated hero portrait with the broken horns visible from dedicated portrait
console.log('Generating updated Kairon tiefling portrait with broken horns and black tail...');
execSync(`convert "src/assets/images/kairon_tiefling_v2_portrait_1794473552573.jpg" -resize 1024x1024 "public/assets/portraits/kairon.png"`);
execSync(`convert "src/assets/images/kairon_tiefling_v2_portrait_1794473552573.jpg" -resize 256x256 "public/assets/portraits/kairon_icono.png"`);

console.log('All Kairon Tiefling assets processed successfully!');
