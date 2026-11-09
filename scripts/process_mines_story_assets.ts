import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks typedefs
import { PNG } from 'pngjs';

console.log('--- Processing Mines Story Assets ---');

// 1. Process Background
const bgSrc = 'src/assets/images/silver_mines_subterranean_1794134062832.jpg';
const bgDest = 'public/assets/backgrounds/minas_glimmerstone_profunda.png';

if (fs.existsSync(bgSrc)) {
  execSync(`convert "${bgSrc}" -resize 1920x1080^ -gravity center -extent 1920x1080 "${bgDest}"`);
  console.log(`✓ Generated background: ${bgDest}`);
} else {
  console.warn(`! Background source not found: ${bgSrc}`);
}

// 2. High Quality Background Removal & Thumbnail Generation
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
          if (brightness > 215) {
            png.data[idx + 3] = Math.max(0, Math.round(255 - (brightness - 215) * 6.5));
          }
        }
      }
    }
  }

  // Crop bounding box
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

    fs.writeFileSync(outputPngPath, PNG.sync.write(cropped));
    console.log(`✓ Created clean sprite: ${outputPngPath} (${cropW}x${cropH})`);

    // Create thumbnail focusing on upper body/face
    const thumbH = Math.round(cropH * 0.55);
    const tmpThumb = `/tmp/thumb_${path.basename(outputPngPath)}`;
    execSync(`convert "${outputPngPath}" -crop ${cropW}x${thumbH}+0+0 +repage -resize 256x256^ -gravity north -extent 256x256 "${tmpThumb}"`);
    fs.copyFileSync(tmpThumb, outputThumbPath);
    console.log(`✓ Created thumbnail: ${outputThumbPath}`);
  }
}

// Process Dwarf Siblings
const dwarfSrc = 'src/assets/images/dwarf_siblings_miners_1794134023844.jpg';
removeWhiteBackground(
  dwarfSrc,
  'public/assets/portraits/enanos_mineros_clean.png',
  'public/assets/portraits/enanos_mineros_thumb.png',
  238
);
// Also copy to combat directory for consistency
fs.copyFileSync('public/assets/portraits/enanos_mineros_clean.png', 'public/assets/combat/enanos_mineros_clean.png');
fs.copyFileSync('public/assets/portraits/enanos_mineros_thumb.png', 'public/assets/combat/enanos_mineros_thumb.png');

// Process Drow Emissary
const drowSrc = 'src/assets/images/drow_nobleman_underdark_1794134037185.jpg';
removeWhiteBackground(
  drowSrc,
  'public/assets/portraits/drow_emisario_clean.png',
  'public/assets/portraits/drow_emisario_thumb.png',
  238
);
// Also copy to combat directory for consistency
fs.copyFileSync('public/assets/portraits/drow_emisario_clean.png', 'public/assets/combat/drow_emisario_clean.png');
fs.copyFileSync('public/assets/portraits/drow_emisario_thumb.png', 'public/assets/combat/drow_emisario_thumb.png');

console.log('--- Assets processing complete! ---');
