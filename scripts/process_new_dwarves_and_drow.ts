import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks types
import { PNG } from 'pngjs';

console.log('--- Processing New Dwarves and Drow Sprites ---');

const dwarfJpg = 'src/assets/images/enanos_mineros_hermanos_1794135984143.jpg';
const drowJpg = 'src/assets/images/drow_lord_vaelas_1794136002228.jpg';

function processSprite(
  inputJpg: string,
  outCleanPaths: string[],
  outThumbPaths: string[],
  thumbCropOpts: { topPercent: number; heightPercent: number },
  threshold = 240
) {
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
          if (brightness > 210) {
            png.data[idx + 3] = Math.max(0, Math.round(255 - (brightness - 210) * 7.5));
          }
        }
      }
    }
  }

  const tmpClean = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_clean.png`;
  fs.writeFileSync(tmpClean, PNG.sync.write(png));

  // Auto-trim transparent edges with slight margin
  const trimmed = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_trimmed.png`;
  execSync(`convert "${tmpClean}" -trim +repage -bordercolor none -border 12 "${trimmed}"`);

  // Write clean sprite to target destinations
  for (const dest of outCleanPaths) {
    fs.copyFileSync(trimmed, dest);
    console.log(`✓ Saved clean sprite: ${dest}`);
  }

  // Create close-up thumbnail
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
    fs.copyFileSync(thumbTmp, dest);
    console.log(`✓ Saved thumbnail: ${dest}`);
  }
}

// 1. Process Dwarf Siblings (Boran & Thora)
processSprite(
  dwarfJpg,
  [
    'public/assets/portraits/enanos_mineros_clean.png',
    'public/assets/combat/enanos_mineros_clean.png',
  ],
  [
    'public/assets/portraits/enanos_mineros_thumb.png',
    'public/assets/combat/enanos_mineros_thumb.png',
  ],
  { topPercent: 0.0, heightPercent: 0.52 }
);

// 2. Process Drow (Lord Vaelas)
processSprite(
  drowJpg,
  [
    'public/assets/portraits/drow_emisario_clean.png',
    'public/assets/combat/drow_emisario_clean.png',
  ],
  [
    'public/assets/portraits/drow_emisario_thumb.png',
    'public/assets/combat/drow_emisario_thumb.png',
  ],
  { topPercent: 0.0, heightPercent: 0.36 }
);

console.log('--- All sprites successfully processed! ---');
