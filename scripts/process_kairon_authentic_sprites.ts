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
    id: 'kairon_hurt',
    sourceJpg: 'src/assets/images/kairon_authentic_hurt_1794473940853.jpg',
    outputPng: 'public/assets/combat/kairon_hurt.png',
    whiteThreshold: 236,
  },
  {
    id: 'kairon_attack',
    sourceJpg: 'src/assets/images/kairon_authentic_double_tap_1794473961707.jpg',
    outputPng: 'public/assets/combat/kairon_attack.png',
    whiteThreshold: 238,
  },
  {
    id: 'kairon_attack_dual',
    sourceJpg: 'src/assets/images/kairon_authentic_dual_shot_1794473981122.jpg',
    outputPng: 'public/assets/combat/kairon_attack_dual.png',
    whiteThreshold: 238,
  },
  {
    id: 'kairon_cast',
    sourceJpg: 'src/assets/images/kairon_authentic_sword_slash_1794474000743.jpg',
    outputPng: 'public/assets/combat/kairon_cast.png',
    whiteThreshold: 238,
  },
];

function processJpgSprite(task: SpriteTask) {
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

  const tmpOut = `/tmp/${task.id}_authentic_cropped.png`;
  fs.writeFileSync(tmpOut, PNG.sync.write(croppedPng));

  // Resize to standardized ~1195px height
  execSync(`convert "${tmpOut}" -resize x1195 "${task.outputPng}"`);
  console.log(`Saved transparent sprite to ${task.outputPng} (height: 1195px)`);
}

function processAuthenticIdle() {
  console.log('Processing authentic Kairon idle from user banner...');
  const bannerPng = PNG.sync.read(fs.readFileSync('public/assets/aistudio/kairon_banner_80a689d1.png'));
  const w = bannerPng.width;
  const h = bannerPng.height;

  // Remove the orange/peach ground shadow at the bottom (y > 3600)
  for (let y = 3600; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      if (bannerPng.data[idx + 3] > 0) {
        const r = bannerPng.data[idx];
        const g = bannerPng.data[idx + 1];
        const b = bannerPng.data[idx + 2];
        // Orange/peach floor shadow: r > 220, g in 130..220, b < 140
        if (r > 210 && g > 120 && g < 225 && b < 140) {
          bannerPng.data[idx + 3] = 0;
        }
        // Also remove any stray low alpha residue under feet
        if (bannerPng.data[idx + 3] < 30) {
          bannerPng.data[idx + 3] = 0;
        }
      }
    }
  }

  // Find tight bounding box of character
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = bannerPng.data[((y * w + x) << 2) + 3];
      if (a > 20) {
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

  const cropped = new PNG({ width: cropW, height: cropH });
  for (let cy = 0; cy < cropH; cy++) {
    const sy = cropMinY + cy;
    for (let cx = 0; cx < cropW; cx++) {
      const sx = cropMinX + cx;
      const sidx = (sy * w + sx) << 2;
      const didx = (cy * cropW + cx) << 2;
      cropped.data[didx] = bannerPng.data[sidx];
      cropped.data[didx + 1] = bannerPng.data[sidx + 1];
      cropped.data[didx + 2] = bannerPng.data[sidx + 2];
      cropped.data[didx + 3] = bannerPng.data[sidx + 3];
    }
  }

  const tmpOut = '/tmp/kairon_idle_authentic.png';
  fs.writeFileSync(tmpOut, PNG.sync.write(cropped));
  execSync(`convert "${tmpOut}" -resize x1195 "public/assets/combat/kairon_idle.png"`);
  console.log('Saved public/assets/combat/kairon_idle.png (height: 1195px)');

  // Also create portrait directly from user banner
  console.log('Creating authentic portrait from user banner...');
  execSync(`convert "public/assets/aistudio/kairon_banner_80a689d1.png" -crop 1700x1700+1800+100 +repage -resize 1024x1024 "public/assets/portraits/kairon.png"`);
  execSync(`convert "public/assets/aistudio/kairon_banner_80a689d1.png" -crop 1700x1700+1800+100 +repage -resize 256x256 "public/assets/portraits/kairon_icono.png"`);
  console.log('Saved public/assets/portraits/kairon.png and kairon_icono.png');
}

// Process all actions
processAuthenticIdle();

for (const task of TASKS) {
  processJpgSprite(task);
}

// Generate updated skill icons from authentic action poses
console.log('Generating updated skill icons...');
execSync(`convert "src/assets/images/kairon_authentic_double_tap_1794473961707.jpg" -crop 500x500+20+120 +repage -resize 256x256 "public/assets/skills/kairon_tiro_doble.png"`);
execSync(`convert "src/assets/images/kairon_authentic_dual_shot_1794473981122.jpg" -crop 520x520+520+120 +repage -resize 256x256 "public/assets/skills/kairon_disparo_dual.png"`);
execSync(`convert "src/assets/images/kairon_authentic_sword_slash_1794474000743.jpg" -crop 620x620+350+40 +repage -resize 256x256 "public/assets/skills/kairon_espadazo_largo.png"`);

// Clean up test file
if (fs.existsSync('public/assets/combat/test_kairon_idle.png')) {
  fs.unlinkSync('public/assets/combat/test_kairon_idle.png');
}

console.log('All authentic Kairon assets processed and saved successfully!');
