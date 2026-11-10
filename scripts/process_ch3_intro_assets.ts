import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs has no local typedef
import { PNG } from 'pngjs';

console.log('Processing Chapter 3 Intro assets...');

// 1. Process Background: Campamento Orco Bosque
const campamentoBgSrc = 'src/assets/images/campamento_orco_bosque_1794335894608.jpg';
if (fs.existsSync(campamentoBgSrc)) {
  execSync(`convert "${campamentoBgSrc}" -resize 1920x1080\\> "public/assets/backgrounds/campamento_orco_bosque.png"`);
  console.log('✓ public/assets/backgrounds/campamento_orco_bosque.png created');
}

// 2. Remove White Background from Orco Regordete
function removeWhiteBackground(inputJpg: string, outputPngPath: string, threshold = 235) {
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
        [qx - 1, qy],
        [qx + 1, qy],
        [qx, qy - 1],
        [qx, qy + 1],
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

  // Defringe slight white halo near transparent pixels
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w; x++) {
      const idx = (y * w + x) << 2;
      if (png.data[idx + 3] > 0) {
        // If bordering completely transparent pixel and is very light, blend down
        const hasTransparentNeighbor =
          png.data[((y - 1) * w + x) << 2 + 3] === 0 ||
          png.data[((y + 1) * w + x) << 2 + 3] === 0 ||
          png.data[(y * w + (x - 1)) << 2 + 3] === 0 ||
          png.data[(y * w + (x + 1)) << 2 + 3] === 0;

        if (hasTransparentNeighbor && png.data[idx] > 220 && png.data[idx + 1] > 220 && png.data[idx + 2] > 220) {
          png.data[idx + 3] = 0;
        }
      }
    }
  }

  fs.writeFileSync(outputPngPath, PNG.sync.write(png));
  console.log(`✓ Clean cutout: ${outputPngPath}`);
}

const orcoRegordeteSrc = 'src/assets/images/orco_regordete_clean_1794335879871.jpg';
if (fs.existsSync(orcoRegordeteSrc)) {
  removeWhiteBackground(orcoRegordeteSrc, 'public/assets/combat/orco_regordete_clean.png');
  execSync('convert public/assets/combat/orco_regordete_clean.png -gravity Center -crop 500x500+0-120 -resize 128x128 public/assets/portraits/orco_regordete_thumb.png');
  console.log('✓ public/assets/portraits/orco_regordete_thumb.png created');
}

// 3. Transparent cutout for Arlem Orco from black background icon
function removeBlackBackground(inputPng: string, outputPngPath: string, threshold = 20) {
  const png = PNG.sync.read(fs.readFileSync(inputPng));
  const w = png.width;
  const h = png.height;

  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isBackground(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r <= threshold && g <= threshold && b <= threshold;
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
        [qx - 1, qy],
        [qx + 1, qy],
        [qx, qy - 1],
        [qx, qy + 1],
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

  fs.writeFileSync(outputPngPath, PNG.sync.write(png));
  console.log(`✓ Clean black cutout: ${outputPngPath}`);
}

const arlemOrcoFullSrc = 'src/assets/images/arlem_orco_full_1794335974524.jpg';
if (fs.existsSync(arlemOrcoFullSrc)) {
  removeWhiteBackground(arlemOrcoFullSrc, 'public/assets/combat/arlem_orco_clean.png');
  execSync('convert public/assets/combat/arlem_orco_clean.png -gravity North -crop 500x500+0+0 -resize 128x128 public/assets/portraits/arlem_orco_thumb.png');
  console.log('✓ public/assets/combat/arlem_orco_clean.png created');
  console.log('✓ public/assets/portraits/arlem_orco_thumb.png created');
}

console.log('Asset processing complete!');

