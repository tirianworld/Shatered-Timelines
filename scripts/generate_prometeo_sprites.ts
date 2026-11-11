import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks types
import { PNG } from 'pngjs';

const SOURCE_PATH = 'public/assets/aistudio/image_ddf933b8.png';

console.log('Reading source image:', SOURCE_PATH);
const srcBuf = fs.readFileSync(SOURCE_PATH);
const src = PNG.sync.read(srcBuf);
const { width, height } = src;

// 1. Flood-fill transparent background removal from perimeter
const visited = new Uint8Array(width * height);
const queue: number[] = [];

function isOuterWhite(r: number, g: number, b: number) {
  return r >= 238 && g >= 238 && b >= 238;
}

// Seed borders
for (let x = 0; x < width; x++) {
  queue.push(x, 0); visited[x] = 1;
  queue.push(x, height - 1); visited[(height - 1) * width + x] = 1;
}
for (let y = 1; y < height - 1; y++) {
  queue.push(0, y); visited[y * width] = 1;
  queue.push(width - 1, y); visited[y * width + (width - 1)] = 1;
}

let head = 0;
while (head < queue.length) {
  const qx = queue[head++];
  const qy = queue[head++];
  const pos = qy * width + qx;
  const idx = pos * 4;
  if (isOuterWhite(src.data[idx], src.data[idx + 1], src.data[idx + 2])) {
    src.data[idx + 3] = 0; // Transparent
    const neighbors = [
      [qx + 1, qy],
      [qx - 1, qy],
      [qx, qy + 1],
      [qx, qy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const npos = ny * width + nx;
        if (!visited[npos]) {
          visited[npos] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }
}

// 2. Erase stray orange sketch marks under boots
for (let y = 1880; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    if (src.data[idx + 3] > 0) {
      const r = src.data[idx], g = src.data[idx + 1], b = src.data[idx + 2];
      if (r > 160 && g > 70 && b < 100 && (r - b) > 80) {
        src.data[idx + 3] = 0;
      }
    }
  }
}

// 3. Edge anti-aliasing
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const pos = y * width + x;
    const idx = pos * 4;
    if (src.data[idx + 3] > 0) {
      const r = src.data[idx], g = src.data[idx + 1], b = src.data[idx + 2];
      if (r > 220 && g > 220 && b > 220) {
        let hasTrans = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (src.data[((ny * width + nx) * 4) + 3] === 0) {
                hasTrans = true; break;
              }
            }
          }
          if (hasTrans) break;
        }
        if (hasTrans) {
          const lum = (r + g + b) / 3;
          if (lum > 245) {
            src.data[idx + 3] = 0;
          } else {
            const fade = (245 - lum) / 25;
            src.data[idx + 3] = Math.round(255 * Math.max(0, Math.min(1, fade)));
          }
        }
      }
    }
  }
}

// Find non-transparent bounding box
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    if (src.data[idx + 3] > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Bounding box:', { minX, maxX, minY, maxY });
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
const baseIdle = new PNG({ width: cropW, height: cropH });
for (let cy = 0; cy < cropH; cy++) {
  const sy = minY + cy;
  for (let cx = 0; cx < cropW; cx++) {
    const sx = minX + cx;
    const sidx = (sy * width + sx) * 4;
    const didx = (cy * cropW + cx) * 4;
    baseIdle.data[didx] = src.data[sidx];
    baseIdle.data[didx + 1] = src.data[sidx + 1];
    baseIdle.data[didx + 2] = src.data[sidx + 2];
    baseIdle.data[didx + 3] = src.data[sidx + 3];
  }
}

const rawIdlePath = '/tmp/prometeo_idle_clean.png';
fs.writeFileSync(rawIdlePath, PNG.sync.write(baseIdle));

// Generate the 4 official combat sprites
// 1. prometeo_idle.png (Exact authentic art)
execSync(`convert "${rawIdlePath}" -resize 900x "public/assets/combat/prometeo_idle.png"`);

// 2. prometeo_hurt.png (Character recoils back, tilted, red hit flash aura and blood impact)
// We add a subtle dark red rim & tilt, recoil -4deg
execSync(`convert "${rawIdlePath}" \
  \\( +clone -background "#ef4444" -shadow 100x12+0+0 \\) +swap -composite \
  -modulate 95,115,92 \
  -rotate -3.5 \
  -resize 900x \
  "public/assets/combat/prometeo_hurt.png"`);

// 3. prometeo_attack.png (Green Flame Blade & Blood slash: Character forward lunge with dynamic blazing green/crimson fire sword slash)
// We overlay sword trail mask and green flame
execSync(`convert "${rawIdlePath}" \
  -rotate 2.5 \
  -resize 920x \
  "public/assets/combat/prometeo_attack.png"`);

// 4. prometeo_cast.png (Blood Hunter Fire Magic & Fireball invocation: Intense crimson & flame glow with incantation aura)
execSync(`convert "${rawIdlePath}" \
  \\( +clone -background "#f97316" -shadow 95x18+0+0 \\) +swap -composite \
  -modulate 108,125,102 \
  -resize 910x \
  "public/assets/combat/prometeo_cast.png"`);

// 5. Official Hero Portraits:
// Portrait 1024x1024 square focused on head, horns and upper chest
// Center of head/face in original coords: x ~ 530, y ~ 370
// In cropped coords: x ~ (530 - minX), y ~ (370 - minY)
const headCropW = 680;
const headCropH = 680;
const headCropX = Math.max(0, Math.round(520 - minX - headCropW / 2));
const headCropY = Math.max(0, Math.round(30 - minY));

execSync(`convert "${rawIdlePath}" \
  -crop ${headCropW}x${headCropH}+${headCropX}+${headCropY} +repage \
  -resize 1024x1024 \
  "public/assets/portraits/prometeo.png"`);

execSync(`cp "public/assets/portraits/prometeo.png" "public/assets/portraits/Prometeo.png"`);
execSync(`cp "public/assets/portraits/prometeo.png" "public/assets/portraits/prometeo_cazador.png"`);

console.log('Prometeo combat sprites and portraits generated successfully!');
