import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks types
import { PNG } from 'pngjs';

console.log('Restoring Magordito previous sprite and portrait assets...');

// 1. Restore portrait
fs.copyFileSync('public/assets/portraits/Magordito.png', 'public/assets/portraits/magordito.png');
console.log('✓ Restored public/assets/portraits/magordito.png from original Magordito.png');

// 2. Restore items & story dialogue sprites
fs.copyFileSync('public/assets/items/magordito_cruado_de_brazos.png', 'public/assets/items/magordito_arms_crossed.png');
fs.copyFileSync('public/assets/items/magordito_cruado_de_brazos.png', 'public/assets/items/magordito cruado de brazos.png');
fs.copyFileSync('public/assets/items/magordito_app.png', 'public/assets/items/magordito app.png');
fs.copyFileSync('public/assets/items/magordito_idl_capa.png', 'public/assets/items/magordito idl capa.png');
fs.copyFileSync('public/assets/items/magordito_idl_cara_destapada.png', 'public/assets/items/magordito idl cara destapada.png');
fs.copyFileSync('public/assets/items/magordito_cruado_de_brazos.png', 'public/assets/combat/magordito_clean.png');
fs.copyFileSync('public/assets/items/magordito_cruado_de_brazos.png', 'public/assets/aistudio/magordito_clean.png');
fs.copyFileSync('public/assets/items/magordito_cruado_de_brazos.png', 'public/assets/aistudio/magordito_arms_crossed.png');
console.log('✓ Restored dialogue and item sprites');

// 3. Restore splashart from authentic original portrait
execSync(
  `convert "public/assets/portraits/Magordito.png" -resize 800x800^ -gravity Center -extent 800x800 "public/assets/aistudio/splashart_magordito_c1637d56.png"`
);
console.log('✓ Restored public/assets/aistudio/splashart_magordito_c1637d56.png');

// 4. Standardize combat idle sprite to 1024x1400 canvas, centered & bottom aligned
const baseSpritePath = 'public/assets/items/magordito_cruado_de_brazos.png';
const png = PNG.sync.read(fs.readFileSync(baseSpritePath));
const w = png.width;
const h = png.height;

// Find tight bounding box
let minX = w, maxX = 0, minY = h, maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (png.data[(y * w + x) * 4 + 3] > 15) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const boxW = maxX - minX + 1;
const boxH = maxY - minY + 1;

const TARGET_W = 1024;
const TARGET_H = 1400;
const maxW = TARGET_W - 40;
const maxH = TARGET_H - 24;

let scale = 1.0;
if (boxW > maxW) scale = maxW / boxW;
if (boxH * scale > maxH) scale = maxH / boxH;

const finalW = Math.round(boxW * scale);
const finalH = Math.round(boxH * scale);
const dstY = TARGET_H - finalH;
const dstX = Math.round((TARGET_W - finalW) / 2);

const outPng = new PNG({ width: TARGET_W, height: TARGET_H });

for (let dy = 0; dy < finalH; dy++) {
  const srcY = Math.min(h - 1, Math.max(0, minY + Math.round(dy / scale)));
  const targetY = dstY + dy;
  if (targetY < 0 || targetY >= TARGET_H) continue;

  for (let dx = 0; dx < finalW; dx++) {
    const srcX = Math.min(w - 1, Math.max(0, minX + Math.round(dx / scale)));
    const targetX = dstX + dx;
    if (targetX < 0 || targetX >= TARGET_W) continue;

    const srcIdx = (srcY * w + srcX) * 4;
    const dstIdx = (targetY * TARGET_W + targetX) * 4;

    outPng.data[dstIdx] = png.data[srcIdx];
    outPng.data[dstIdx + 1] = png.data[srcIdx + 1];
    outPng.data[dstIdx + 2] = png.data[srcIdx + 2];
    outPng.data[dstIdx + 3] = png.data[srcIdx + 3];
  }
}

fs.writeFileSync('public/assets/combat/magordito_idle.png', PNG.sync.write(outPng));
console.log(`✓ Standardized public/assets/combat/magordito_idle.png (1024x1400, scaled to ${finalW}x${finalH}, dstY=${dstY})`);

console.log('Magordito previous sprite and portrait fully restored!');
