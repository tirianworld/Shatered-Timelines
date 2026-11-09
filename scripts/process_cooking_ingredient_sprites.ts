import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks typedefs
import { PNG } from 'pngjs';

interface SpriteJob {
  jpgPath: string;
  outPngPath: string;
}

const JOBS: SpriteJob[] = [
  {
    jpgPath: 'src/assets/images/ing_huevos_araknoide_1794150542429.jpg',
    outPngPath: 'public/assets/items/ing_huevos_araknoide.png',
  },
  {
    jpgPath: 'src/assets/images/ing_larvas_araknoide_1794150558676.jpg',
    outPngPath: 'public/assets/items/ing_larvas_araknoide.png',
  },
  {
    jpgPath: 'src/assets/images/ing_carne_devorador_1794150574918.jpg',
    outPngPath: 'public/assets/items/ing_carne_devorador.png',
  },
  {
    jpgPath: 'src/assets/images/food_tortilla_araknoide_1794150592029.jpg',
    outPngPath: 'public/assets/items/food_tortilla_araknoide.png',
  },
  {
    jpgPath: 'src/assets/images/food_devorador_empanada_1794150605777.jpg',
    outPngPath: 'public/assets/items/food_devorador_empanada.png',
  },
  {
    jpgPath: 'src/assets/images/food_larvas_crujientes_1794150621842.jpg',
    outPngPath: 'public/assets/items/food_larvas_crujientes.png',
  },
];

function removeWhiteBackground(inputJpg: string, outputPng: string, threshold = 238) {
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
      png.data[idx + 3] = 0; // Transparent!

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

  fs.mkdirSync(path.dirname(outputPng), { recursive: true });
  fs.writeFileSync(outputPng, PNG.sync.write(png));
  if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
  console.log(`✓ Generated transparent sprite: ${outputPng}`);
}

for (const job of JOBS) {
  removeWhiteBackground(job.jpgPath, job.outPngPath);
}
console.log('All araknoide and devorador sprites processed successfully!');
