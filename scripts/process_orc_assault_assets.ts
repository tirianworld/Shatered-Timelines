import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs has no local typedef
import { PNG } from 'pngjs';

// 1. Process Backgrounds
console.log('Processing backgrounds for Asalto Orco...');
const cinematicaSrc = 'src/assets/images/asalto_orco_cinematica_1794057523601.jpg';
const combateSrc = 'src/assets/images/asalto_orco_combate_1794057537019.jpg';

if (fs.existsSync(cinematicaSrc)) {
  execSync(`convert "${cinematicaSrc}" -resize 1920x1080\\> "public/assets/backgrounds/asalto_orco_cinematica.png"`);
  console.log('✓ public/assets/backgrounds/asalto_orco_cinematica.png created');
}

if (fs.existsSync(combateSrc)) {
  execSync(`convert "${combateSrc}" -resize 1920x1080\\> "public/assets/backgrounds/asalto_orco_combate.png"`);
  console.log('✓ public/assets/backgrounds/asalto_orco_combate.png created');
}

// 2. High-Quality Background Removal (Flood fill from border on white background)
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
        // Check if adjacent to transparent pixel
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

// 3. Process sprites
console.log('Processing sprites...');

removeWhiteBackground(
  'src/assets/images/tiefling_familia_dialogo_1794057417061.jpg',
  'public/assets/combat/tiefling_familia_clean.png',
  235
);

// Create portrait / thumb for tiefling mother & child
execSync(`convert "public/assets/combat/tiefling_familia_clean.png" -gravity North -crop 100%x65%+0+0 +repage -resize 256x256^ -gravity Center -extent 256x256 "public/assets/combat/tiefling_familia_thumb.png"`);
console.log('✓ public/assets/combat/tiefling_familia_thumb.png created');

// Orc Caudillo Attack & Hurt
removeWhiteBackground(
  'src/assets/images/orco_caudillo_attack_1794057433780.jpg',
  'public/assets/combat/orco_caudillo_attack.png',
  235
);
removeWhiteBackground(
  'src/assets/images/orco_caudillo_hurt_1794057449734.jpg',
  'public/assets/combat/orco_caudillo_hurt.png',
  235
);

// Orc Hacha Attack & Hurt
removeWhiteBackground(
  'src/assets/images/orco_hacha_attack_1794057463952.jpg',
  'public/assets/combat/orco_hacha_attack.png',
  235
);
removeWhiteBackground(
  'src/assets/images/orco_hacha_hurt_1794057479197.jpg',
  'public/assets/combat/orco_hacha_hurt.png',
  235
);

// Orc Lanza Attack & Hurt
removeWhiteBackground(
  'src/assets/images/orco_lanza_attack_1794057494492.jpg',
  'public/assets/combat/orco_lanza_attack.png',
  235
);
removeWhiteBackground(
  'src/assets/images/orco_lanza_hurt_1794057508812.jpg',
  'public/assets/combat/orco_lanza_hurt.png',
  235
);

console.log('All Orc Assault assets processed successfully!');
