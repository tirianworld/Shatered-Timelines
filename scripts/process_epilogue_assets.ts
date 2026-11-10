import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks typedefs
import { PNG } from 'pngjs';

console.log('--- Processing Epilogue Assets ---');

// 1. Process Dwarf Village Background
const villageSrc = 'src/assets/images/aldea_enana_glimmerstone_1794333906973.jpg';
const villageDest = 'public/assets/backgrounds/aldea_enana_glimmerstone.png';
if (fs.existsSync(villageSrc)) {
  execSync(`convert "${villageSrc}" -resize 1920x1080^ -gravity center -extent 1920x1080 "${villageDest}"`);
  console.log(`✓ Generated village background: ${villageDest}`);
}

// 2. Process Interior Labyrinth Background
const labSrc = 'src/assets/images/interior_laberinto_lloth_1794333921479.jpg';
const labDest = 'public/assets/backgrounds/interior_laberinto_lloth.png';
if (fs.existsSync(labSrc)) {
  execSync(`convert "${labSrc}" -resize 1920x1080^ -gravity center -extent 1920x1080 "${labDest}"`);
  console.log(`✓ Generated labyrinth interior background: ${labDest}`);
}

// 3. Process Drow Despeinado Sprite
function removeWhiteBackground(
  inputJpg: string,
  outputPngPath: string,
  outputThumbPath: string,
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

  // Soften borders
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
          if (brightness > 215) {
            png.data[idx + 3] = Math.max(0, Math.round(255 - (brightness - 215) * 6.5));
          }
        }
      }
    }
  }

  // Bounding box
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
    const pad = 12;
    minX = Math.max(0, minX - pad);
    maxX = Math.min(w - 1, maxX + pad);
    minY = Math.max(0, minY - pad);
    maxY = Math.min(h - 1, maxY + pad);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const cropped = new PNG({ width: cropW, height: cropH });

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = ((minY + y) * w + (minX + x)) * 4;
        const dstIdx = (y * cropW + x) * 4;
        cropped.data[dstIdx] = png.data[srcIdx];
        cropped.data[dstIdx + 1] = png.data[srcIdx + 1];
        cropped.data[dstIdx + 2] = png.data[srcIdx + 2];
        cropped.data[dstIdx + 3] = png.data[srcIdx + 3];
      }
    }

    const outDir = path.dirname(outputPngPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(outputPngPath, PNG.sync.write(cropped));
    console.log(`✓ Saved clean sprite: ${outputPngPath}`);

    // Generate portrait thumb
    const thumbDir = path.dirname(outputThumbPath);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    const headH = Math.round(cropH * 0.4);
    const headW = Math.min(cropW, headH);
    const headX = Math.round((cropW - headW) / 2);

    execSync(
      `convert "${outputPngPath}" -crop ${headW}x${headH}+${headX}+0 +repage -resize 256x256^ -gravity center -extent 256x256 "${outputThumbPath}"`
    );
    console.log(`✓ Generated portrait thumb: ${outputThumbPath}`);
  }
}

const drowDespeinadoSrc = 'src/assets/images/drow_vaelas_despeinado_1794333943787.jpg';
if (fs.existsSync(drowDespeinadoSrc)) {
  removeWhiteBackground(
    drowDespeinadoSrc,
    'public/assets/combat/drow_vaelas_despeinado_clean.png',
    'public/assets/portraits/drow_vaelas_despeinado_thumb.png',
    238
  );
  fs.copyFileSync(
    'public/assets/combat/drow_vaelas_despeinado_clean.png',
    'public/assets/portraits/drow_vaelas_despeinado_clean.png'
  );
}

console.log('--- Epilogue Assets Processed Successfully ---');
