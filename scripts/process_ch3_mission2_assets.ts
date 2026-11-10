import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs has no local typedef
import { PNG } from 'pngjs';

console.log('Processing Chapter 3 Mission 2 assets...');

// 1. Process Background: Camino Bosque Carromatos
const caminoBgSrc = 'src/assets/images/camino_bosque_carromatos_1794337267775.jpg';
if (fs.existsSync(caminoBgSrc)) {
  execSync(`convert "${caminoBgSrc}" -resize 1920x1080\\> "public/assets/backgrounds/camino_bosque_carromatos.png"`);
  console.log('✓ public/assets/backgrounds/camino_bosque_carromatos.png created');
}

// 2. Remove White Background function
function removeWhiteBackground(inputJpg: string, outputPngPath: string, threshold = 230) {
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
            const nidx = npos << 2;
            if (isBackground(nidx)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  // Defringe slightly: soften remaining near-white edge pixels
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      const idx = pos << 2;
      if (png.data[idx + 3] > 0) {
        // Check if neighboring transparent pixel
        const hasTransparentNeighbor =
          png.data[((y - 1) * w + x) * 4 + 3] === 0 ||
          png.data[((y + 1) * w + x) * 4 + 3] === 0 ||
          png.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
          png.data[(y * w + (x + 1)) * 4 + 3] === 0;

        if (hasTransparentNeighbor) {
          const r = png.data[idx];
          const g = png.data[idx + 1];
          const b = png.data[idx + 2];
          if (r > 200 && g > 200 && b > 200) {
            png.data[idx + 3] = Math.max(0, 255 - Math.round((Math.min(r, g, b) - 200) * 3.5));
          }
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(outputPngPath), { recursive: true });
  fs.writeFileSync(outputPngPath, PNG.sync.write(png));
  console.log(`✓ Processed ${outputPngPath}`);
}

function createThumbnail(srcPng: string, destThumb: string) {
  fs.mkdirSync(path.dirname(destThumb), { recursive: true });
  execSync(`convert "${srcPng}" -gravity north -crop 500x500+0+50 +repage -resize 256x256 "${destThumb}"`);
  console.log(`✓ Created thumbnail ${destThumb}`);
}

const itemsToProcess = [
  {
    src: 'src/assets/images/hobgoblin_capataz_1794337190018.jpg',
    sprite: 'public/assets/combat/hobgoblin_capataz_clean.png',
    thumb: 'public/assets/portraits/hobgoblin_capataz_thumb.png',
    threshold: 235,
  },
  {
    src: 'src/assets/images/guarda_negro_espada_1794337204333.jpg',
    sprite: 'public/assets/combat/guarda_negro_espada_clean.png',
    thumb: 'public/assets/portraits/guarda_negro_espada_thumb.png',
    threshold: 235,
  },
  {
    src: 'src/assets/images/guarda_negro_alabarda_1794337219196.jpg',
    sprite: 'public/assets/combat/guarda_negro_alabarda_clean.png',
    thumb: 'public/assets/portraits/guarda_negro_alabarda_thumb.png',
    threshold: 235,
  },
  {
    src: 'src/assets/images/guarda_negro_ballesta_1794337232762.jpg',
    sprite: 'public/assets/combat/guarda_negro_ballesta_clean.png',
    thumb: 'public/assets/portraits/guarda_negro_ballesta_thumb.png',
    threshold: 235,
  },
  {
    src: 'src/assets/images/guarda_negro_pesado_1794337246858.jpg',
    sprite: 'public/assets/combat/guarda_negro_pesado_clean.png',
    thumb: 'public/assets/portraits/guarda_negro_pesado_thumb.png',
    threshold: 235,
  },
];

for (const it of itemsToProcess) {
  if (fs.existsSync(it.src)) {
    removeWhiteBackground(it.src, it.sprite, it.threshold);
    createThumbnail(it.sprite, it.thumb);
  } else {
    console.warn(`File not found: ${it.src}`);
  }
}

console.log('All Mission 2 assets processed successfully!');
