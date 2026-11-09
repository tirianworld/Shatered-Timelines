import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks types
import { PNG } from 'pngjs';

console.log('--- Processing Glacial Infection & Araknoide Sprites ---');

const dwarfJpg = 'src/assets/images/enano_incrustado_glacial_1794142668974.jpg';
const arakGlacialJpg = 'src/assets/images/araknoide_glacial_variant_1794142671576.jpg';
const arakAttackJpg = 'src/assets/images/araknoide_glacial_attack_1794142671160.jpg';
const arakHurtJpg = 'src/assets/images/araknoide_glacial_hurt_1794142671801.jpg';

function processSprite(
  inputJpg: string,
  outCleanPaths: string[],
  outThumbPaths: string[] = [],
  thumbCropOpts = { topPercent: 0.05, heightPercent: 0.45 },
  threshold = 238
) {
  console.log(`Processing ${inputJpg}...`);
  const tmpRaw = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_temp.png`;
  execSync(`convert "${inputJpg}" "${tmpRaw}"`);

  const png = PNG.sync.read(fs.readFileSync(tmpRaw));
  const w = png.width;
  const h = png.height;

  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isBackground(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r >= threshold && g >= threshold && b >= threshold;
  }

  // Seed outer border
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

  // Anti-aliasing borders
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      const idx = pos << 2;
      if (png.data[idx + 3] > 0) {
        const hasTransNeighbor =
          png.data[((y - 1) * w + x) * 4 + 3] === 0 ||
          png.data[((y + 1) * w + x) * 4 + 3] === 0 ||
          png.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
          png.data[(y * w + (x + 1)) * 4 + 3] === 0;

        if (hasTransNeighbor) {
          const r = png.data[idx];
          const g = png.data[idx + 1];
          const b = png.data[idx + 2];
          const brightness = (r + g + b) / 3;
          if (brightness > 205) {
            png.data[idx + 3] = Math.max(0, Math.round(255 - (brightness - 205) * 6.5));
          }
        }
      }
    }
  }

  const tmpClean = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_clean.png`;
  fs.writeFileSync(tmpClean, PNG.sync.write(png));

  // Auto-trim transparent edges with margin
  const trimmed = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_trimmed.png`;
  execSync(`convert "${tmpClean}" -trim +repage -bordercolor none -border 12 "${trimmed}"`);

  // Write clean sprite to target destinations
  for (const dest of outCleanPaths) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(trimmed, dest);
    console.log(`✓ Saved clean sprite: ${dest}`);
  }

  // Create close-up thumbnail if requested
  if (outThumbPaths.length > 0) {
    const thumbTmp = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_thumb.png`;
    const info = execSync(`identify -format "%w %h" "${trimmed}"`).toString().trim().split(' ');
    const curW = parseInt(info[0], 10);
    const curH = parseInt(info[1], 10);

    const cropY = Math.max(0, Math.round(curH * thumbCropOpts.topPercent));
    const cropH = Math.round(curH * thumbCropOpts.heightPercent);
    const cropSize = Math.min(curW, cropH);
    const cropX = Math.round((curW - cropSize) / 2);

    execSync(
      `convert "${trimmed}" -crop ${cropSize}x${cropSize}+${cropX}+${cropY} +repage -resize 256x256 "${thumbTmp}"`
    );

    for (const dest of outThumbPaths) {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(thumbTmp, dest);
      console.log(`✓ Saved thumbnail: ${dest}`);
    }
  }
}

// 1. Process Enano Incrustado (Durnik el Picador)
processSprite(
  dwarfJpg,
  [
    'public/assets/portraits/enano_infectado_clean.png',
    'public/assets/combat/enano_infectado_clean.png',
  ],
  [
    'public/assets/portraits/enano_infectado_thumb.png',
    'public/assets/combat/enano_infectado_thumb.png',
  ],
  { topPercent: 0.02, heightPercent: 0.48 }
);

// 2. Process Glacial Araknoide (Acechador Glacial) - Idle
processSprite(
  arakGlacialJpg,
  [
    'public/assets/combat/araknoide_glacial_clean.png',
  ],
  [
    'public/assets/combat/araknoide_glacial_thumb.png',
    'public/assets/portraits/araknoide_glacial_thumb.png',
  ],
  { topPercent: 0.15, heightPercent: 0.40 }
);

// 3. Process Glacial Araknoide - Attack
processSprite(
  arakAttackJpg,
  [
    'public/assets/combat/araknoide_glacial_attack.png',
  ],
  [],
  undefined,
  235
);

// 4. Process Glacial Araknoide - Hurt
processSprite(
  arakHurtJpg,
  [
    'public/assets/combat/araknoide_glacial_hurt.png',
  ],
  [],
  undefined,
  235
);

console.log('--- All glacial infection and araknoide assets processed! ---');
