import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks typedef
import { PNG } from 'pngjs';

function removeWhiteBackground(inputJpg: string, outputPngPath: string, threshold = 238) {
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

  // Soften outer borders / anti-aliasing
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
          if (brightness > 220) {
            png.data[idx + 3] = Math.max(0, Math.round(255 - (brightness - 220) * 7));
          }
        }
      }
    }
  }

  // Tight crop
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (png.data[(y * w + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX <= maxX && minY <= maxY) {
    const pad = 6;
    const cMinX = Math.max(0, minX - pad);
    const cMaxX = Math.min(w - 1, maxX + pad);
    const cMinY = Math.max(0, minY - pad);
    const cMaxY = Math.min(h - 1, maxY + pad);
    const cropW = cMaxX - cMinX + 1;
    const cropH = cMaxY - cMinY + 1;

    const cropped = new PNG({ width: cropW, height: cropH });
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcPos = (cMinY + y) * w + (cMinX + x);
        const destIdx = (y * cropW + x) * 4;
        cropped.data[destIdx] = png.data[srcPos * 4];
        cropped.data[destIdx + 1] = png.data[srcPos * 4 + 1];
        cropped.data[destIdx + 2] = png.data[srcPos * 4 + 2];
        cropped.data[destIdx + 3] = png.data[srcPos * 4 + 3];
      }
    }
    fs.writeFileSync(outputPngPath, PNG.sync.write(cropped));
  } else {
    fs.writeFileSync(outputPngPath, PNG.sync.write(png));
  }
  console.log(`✓ ${outputPngPath} processed.`);
}

console.log('Processing Magordito Mazado (2m Necromancer)...');
const srcJpg = 'src/assets/images/magordito_nigromante_mazado_1794128050166.jpg';

// 1. Transparent clean full body sprite
removeWhiteBackground(srcJpg, 'public/assets/combat/magordito_clean.png', 235);

// Duplicate to standing / idle positions
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/combat/magordito_idle.png');
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/items/magordito_arms_crossed.png');
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/items/magordito app.png');
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/items/magordito idl cara destapada.png');
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/items/magordito idl capa.png');
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/aistudio/magordito_clean.png');
fs.copyFileSync('public/assets/combat/magordito_clean.png', 'public/assets/aistudio/magordito_arms_crossed.png');

// 2. Generate Close-Up Portrait for Heroes Roster & Dialogue
// Crop upper chest & head with eye flame and skull pauldron
execSync(
  `convert "${srcJpg}" -gravity North -crop 100%x48%+0+0 +repage -resize 512x512^ -gravity Center -extent 512x512 "public/assets/portraits/magordito.png"`
);
console.log('✓ public/assets/portraits/magordito.png created');

// 3. Splashart for combat cut-ins
execSync(
  `convert "${srcJpg}" -gravity North -crop 100%x60%+0+0 +repage -resize 800x800^ -gravity Center -extent 800x800 "public/assets/aistudio/splashart_magordito_c1637d56.png"`
);
console.log('✓ public/assets/aistudio/splashart_magordito_c1637d56.png created');

console.log('All Magordito 2m Mazado assets created successfully!');
