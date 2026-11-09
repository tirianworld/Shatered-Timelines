import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs has no local typedef
import { PNG } from 'pngjs';

interface SpriteJob {
  id: string;
  sourceJpg: string;
  outputPng: string;
  thumbPng?: string;
  cropBounds?: boolean;
}

const JOBS: SpriteJob[] = [
  {
    id: 'bandido_daga_clean',
    sourceJpg: 'src/assets/images/bandido_daga_idle_1794050553460.jpg',
    outputPng: 'public/assets/combat/bandido_daga_clean.png',
    thumbPng: 'public/assets/combat/bandido_daga_thumb.png',
  },
  {
    id: 'bandido_daga_attack',
    sourceJpg: 'src/assets/images/bandido_daga_slash_1794050569814.jpg',
    outputPng: 'public/assets/combat/bandido_daga_attack.png',
  },
  {
    id: 'bandido_daga_hurt',
    sourceJpg: 'src/assets/images/bandido_daga_hurt_1794050504716.jpg',
    outputPng: 'public/assets/combat/bandido_daga_hurt.png',
  },
  {
    id: 'bandido_tirador_attack',
    sourceJpg: 'src/assets/images/bandido_tir_atk_1794050520686.jpg',
    outputPng: 'public/assets/combat/bandido_tirador_attack.png',
  },
  {
    id: 'bandido_tirador_hurt',
    sourceJpg: 'src/assets/images/bandido_tir_hurt_1794050521118.jpg',
    outputPng: 'public/assets/combat/bandido_tirador_hurt.png',
  },
  {
    id: 'bandido_lider_clean',
    sourceJpg: 'src/assets/images/bandido_lider_idle_1794050554076.jpg',
    outputPng: 'public/assets/combat/bandido_lider_clean.png',
    thumbPng: 'public/assets/combat/bandido_lider_thumb.png',
  },
  {
    id: 'bandido_lider_attack',
    sourceJpg: 'src/assets/images/bandido_lid_atk_1794050535784.jpg',
    outputPng: 'public/assets/combat/bandido_lider_attack.png',
  },
  {
    id: 'bandido_lider_hurt',
    sourceJpg: 'src/assets/images/bandido_lid_hurt_1794050537035.jpg',
    outputPng: 'public/assets/combat/bandido_lider_hurt.png',
  },
];

// 1. Process Backgrounds
console.log('Processing backgrounds...');
const cinematicaSrc = 'src/assets/images/emboscada_cinematica_1794050485592.jpg';
const combateSrc = 'src/assets/images/emboscada_combate_1794050486365.jpg';

if (fs.existsSync(cinematicaSrc)) {
  execSync(`convert "${cinematicaSrc}" -resize 1920x1080\\> "public/assets/backgrounds/emboscada_cinematica.png"`);
  console.log('✓ public/assets/backgrounds/emboscada_cinematica.png created');
}

if (fs.existsSync(combateSrc)) {
  execSync(`convert "${combateSrc}" -resize 1920x1080\\> "public/assets/backgrounds/emboscada_combate.png"`);
  console.log('✓ public/assets/backgrounds/emboscada_combate.png created');
}

// 2. Sprite background removal function (Flood-fill from border + threshold)
function removeWhiteBackground(inputJpg: string, outputPngPath: string) {
  const tmpRaw = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_temp.png`;
  execSync(`convert "${inputJpg}" "${tmpRaw}"`);

  const png = PNG.sync.read(fs.readFileSync(tmpRaw));
  const w = png.width;
  const h = png.height;

  // Flood fill from outer edges
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isBackground(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    // Pure white or very near white background
    return r >= 238 && g >= 238 && b >= 238;
  }

  // Seed outer frame
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

    if (isBackground(idx)) {
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

  // Antialiasing edge softening
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w; x++) {
      const pos = y * w + x;
      const idx = pos << 2;
      if (png.data[idx + 3] > 0) {
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        if (r > 230 && g > 230 && b > 230) {
          // If neighbor is transparent, soften alpha
          const hasTransparentNeighbor =
            png.data[((y - 1) * w + x) * 4 + 3] === 0 ||
            png.data[((y + 1) * w + x) * 4 + 3] === 0 ||
            png.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
            png.data[(y * w + (x + 1)) * 4 + 3] === 0;

          if (hasTransparentNeighbor) {
            const brightness = (r + g + b) / 3;
            const alphaFactor = Math.max(0, Math.min(255, (255 - brightness) * 4));
            png.data[idx + 3] = Math.min(png.data[idx + 3], alphaFactor);
          }
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(outputPngPath), { recursive: true });
  fs.writeFileSync(tmpRaw, PNG.sync.write(png));

  // Trim transparent border
  try {
    execSync(`convert "${tmpRaw}" -trim +repage "${outputPngPath}"`);
  } catch {
    fs.copyFileSync(tmpRaw, outputPngPath);
  }

  try {
    fs.unlinkSync(tmpRaw);
  } catch {}
}

for (const job of JOBS) {
  if (fs.existsSync(job.sourceJpg)) {
    console.log(`Processing sprite: ${job.id}...`);
    removeWhiteBackground(job.sourceJpg, job.outputPng);
    console.log(`✓ ${job.outputPng} created`);

    if (job.thumbPng) {
      console.log(`Creating thumb for ${job.id}...`);
      // Crop upper 45% (bust/face) for thumb
      execSync(`convert "${job.outputPng}" -gravity north -crop 90%x42%+0+0 +repage -resize 128x128 "${job.thumbPng}"`);
      console.log(`✓ ${job.thumbPng} created`);
    }
  } else {
    console.warn(`Source not found for ${job.id}: ${job.sourceJpg}`);
  }
}

console.log('All bandit sprites and backgrounds processed successfully!');
