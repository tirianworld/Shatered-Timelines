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
    jpgPath: 'src/assets/images/cangrejo_cueva_1794215558220.jpg',
    outPngPath: 'public/assets/items/ing_cangrejo_cueva.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/trucha_arroyo_1794215573748.jpg',
    outPngPath: 'public/assets/items/ing_trucha_arroyo.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/sal_glacial_1794215588398.jpg',
    outPngPath: 'public/assets/items/ing_sal_glacial.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/pimienta_negra_1794215602322.jpg',
    outPngPath: 'public/assets/items/ing_pimienta_negra.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/chuletoc_jabali_1794215615391.jpg',
    outPngPath: 'public/assets/items/ing_lomo_jabali.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/arroz_grano_1794215628119.jpg',
    outPngPath: 'public/assets/items/ing_arroz_grano.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/masa_madre_1794215642670.jpg',
    outPngPath: 'public/assets/items/ing_masa_madre.png',
    threshold: 235,
  },
  {
    jpgPath: 'src/assets/images/hierbas_bosque_1794215657132.jpg',
    outPngPath: 'public/assets/items/ing_hierbas_bosque.png',
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
        // check if neighbor is transparent
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
  console.log(`✓ Processed transparent ingredient: ${outputPng}`);
}

for (const job of JOBS) {
  removeWhiteBackground(job.jpgPath, job.outPngPath, job.threshold ?? 235);
}

console.log('All missing ingredients successfully converted to transparent PNG sprites!');
