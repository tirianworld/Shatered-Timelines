import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface SpriteJob {
  id: string;
  sourceJpg: string;
  outputPng: string;
}

const JOBS: SpriteJob[] = [
  {
    id: 'devorador_quitinoso_attack',
    sourceJpg: 'src/assets/images/devorador_attack_1793959961435.jpg',
    outputPng: 'public/assets/combat/devorador_quitinoso_attack.png',
  },
  {
    id: 'devorador_quitinoso_hurt',
    sourceJpg: 'src/assets/images/devorador_hurt_1793959979816.jpg',
    outputPng: 'public/assets/combat/devorador_quitinoso_hurt.png',
  },
];

// Clean idle sprite directly from user's upload
const userUploadPath = 'public/assets/aistudio/image_ecafb4ee.png';
fs.copyFileSync(userUploadPath, 'public/assets/combat/devorador_quitinoso_clean.png');
console.log('devorador_quitinoso_clean.png copied from user upload.');

function processSprite(job: SpriteJob) {
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
              const fade = (240 - lum) / 30;
              png.data[idx + 3] = Math.round(255 * Math.max(0, Math.min(1, fade)));
            }
          }
        }
      }
    }
  }

  // Find bounding box of visible content
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = png.data[(y * w + x) * 4 + 3];
      if (a > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Generous padding around the trimmed bounds so no edges touch borders
  const pad = 24;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(h - cropY, (maxY - minY + 1) + pad * 2);

  const cropped = new PNG({ width: cropW, height: cropH });
  for (let cy = 0; cy < cropH; cy++) {
    for (let cx = 0; cx < cropW; cx++) {
      const srcIdx = ((cropY + cy) * w + (cropX + cx)) * 4;
      const dstIdx = (cy * cropW + cx) * 4;
      cropped.data[dstIdx] = png.data[srcIdx];
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1];
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2];
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }

  const outBuffer = PNG.sync.write(cropped);
  fs.writeFileSync(job.outputPng, outBuffer);
  console.log(`Saved ${job.outputPng}: ${cropW}x${cropH} (trimmed from ${w}x${h})`);
}

// Execute jobs
for (const job of JOBS) {
  processSprite(job);
}

// Generate thumbnail from user upload focused on head & upper claws
console.log('Generating Devorador thumbnail...');
const thumbCmd = `convert "${userUploadPath}" -crop 650x650+120+70 -resize 128x128 public/assets/combat/devorador_quitinoso_thumb.png`;
execSync(thumbCmd);
fs.copyFileSync('public/assets/combat/devorador_quitinoso_thumb.png', 'public/assets/portraits/devorador_quitinoso_thumb.png');
console.log('Thumbnail generated successfully.');
