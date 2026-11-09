import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks typedefs
import { PNG } from 'pngjs';

interface SpriteJob {
  jpgPath: string;
  outPngPath: string;
  threshold?: number;
}

const JOBS: SpriteJob[] = [
  {
    jpgPath: 'src/assets/images/food_steak_chips_1794218027736.jpg',
    outPngPath: 'public/assets/items/food_steak_chips.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_fish_chips_1794218042869.jpg',
    outPngPath: 'public/assets/items/food_fish_chips.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_eggs_chips_1794218056130.jpg',
    outPngPath: 'public/assets/items/food_eggs_chips.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_bourguignon_1794218070010.jpg',
    outPngPath: 'public/assets/items/food_bourguignon.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_ratatouille_1794218083900.jpg',
    outPngPath: 'public/assets/items/food_ratatouille.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_lasana_1794218099281.jpg',
    outPngPath: 'public/assets/items/food_lasana.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_ceviche_1794218113243.jpg',
    outPngPath: 'public/assets/items/food_ceviche.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/food_fondue_1794218126530.jpg',
    outPngPath: 'public/assets/items/food_fondue.png',
    threshold: 235,
  },
];

function removeWhiteBackground(inputJpg: string, outputPng: string, threshold = 235) {
  if (!fs.existsSync(inputJpg)) {
    console.warn(`File not found: ${inputJpg}`);
    return;
  }

  const tmpRaw = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_temp.png`;
  execSync(`convert "${inputJpg}" -resize 512x512 "${tmpRaw}"`);

  const png = PNG.sync.read(fs.readFileSync(tmpRaw));
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  function isWhite(idx: number) {
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r >= threshold && g >= threshold && b >= threshold;
  }

  // Flood fill from outer 4 borders
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    visited[x] = 1;
    queue.push(x, h - 1);
    visited[(h - 1) * w + x] = 1;
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push(0, y);
    visited[y * w] = 1;
    queue.push(w - 1, y);
    visited[y * w + (w - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = (y * w + x) * 4;

    if (isWhite(idx)) {
      png.data[idx + 3] = 0; // Transparent

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nPos = ny * w + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = nPos * 4;
            if (isWhite(nIdx)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  // Feather edges slightly
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (png.data[idx + 3] > 0) {
        const hasTransparentNeighbor =
          png.data[((y - 1) * w + x) * 4 + 3] === 0 ||
          png.data[((y + 1) * w + x) * 4 + 3] === 0 ||
          png.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
          png.data[(y * w + (x + 1)) * 4 + 3] === 0;

        if (hasTransparentNeighbor && isWhite(idx)) {
          png.data[idx + 3] = 0;
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(outputPng), { recursive: true });
  fs.writeFileSync(outputPng, PNG.sync.write(png));
  if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
  console.log(`✓ Processed transparent food sprite: ${outputPng}`);
}

for (const job of JOBS) {
  removeWhiteBackground(job.jpgPath, job.outPngPath, job.threshold ?? 235);
}

console.log('All 8 new food sprites successfully processed!');
