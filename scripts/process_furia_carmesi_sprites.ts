import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks typedefs
import { PNG } from 'pngjs';

console.log('--- Processing Furia Carmesí Story and Combat Sprites (Zero White Background) ---');

// 1. Process Background
const bgSrc = 'src/assets/images/cueva_huevos_carmesis_1794137762171.jpg';
const bgDest = 'public/assets/backgrounds/cueva_huevos_carmesis.png';
if (fs.existsSync(bgSrc)) {
  execSync(`convert "${bgSrc}" -resize 1920x1080^ -gravity center -extent 1920x1080 "${bgDest}"`);
  console.log(`✓ Generated background: ${bgDest}`);
}

/**
 * Remove ALL white background, including outer boundaries, trapped inner loops (between legs,
 * claws, wings, and body), and edge fringes (anti-aliasing matte).
 */
function processSpriteClean(inputJpg: string, outCleanPath: string, borderPad = 12) {
  const tmpRaw = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_raw.png`;
  execSync(`convert "${inputJpg}" "${tmpRaw}"`);

  const png = PNG.sync.read(fs.readFileSync(tmpRaw));
  const w = png.width;
  const h = png.height;

  // Pass 1: Global white removal for all pixels that belong to white background
  // (Both exterior and interior trapped between legs/wings)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];

      const minC = Math.min(r, g, b);
      const maxC = Math.max(r, g, b);
      const diff = maxC - minC;

      // Solid white or very light neutral grey background
      if (minC >= 232 && diff <= 32) {
        png.data[idx + 3] = 0;
      } else if (minC >= 215 && diff <= 18) {
        // Subtle grey shadow / vignette background
        png.data[idx + 3] = 0;
      }
    }
  }

  // Pass 2: Edge smoothing & defringing.
  // Pixels adjacent to transparent pixels that have high brightness should have their alpha
  // smoothed and their RGB de-matted so no white rim or halo remains.
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const a = png.data[idx + 3];
        if (a === 0) continue;

        const hasTransNeighbor =
          png.data[((y - 1) * w + x) * 4 + 3] === 0 ||
          png.data[((y + 1) * w + x) * 4 + 3] === 0 ||
          png.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
          png.data[(y * w + (x + 1)) * 4 + 3] === 0;

        if (hasTransNeighbor) {
          const r = png.data[idx];
          const g = png.data[idx + 1];
          const b = png.data[idx + 2];
          const minC = Math.min(r, g, b);
          const maxC = Math.max(r, g, b);
          const diff = maxC - minC;

          if (minC >= 195 && diff <= 28) {
            const factor = Math.max(0, (232 - minC) / 37);
            const newAlpha = Math.round(a * factor * factor);
            png.data[idx + 3] = newAlpha;

            // De-matte the color to remove white halo
            if (newAlpha > 10 && factor < 0.9) {
              const alphaRatio = newAlpha / 255;
              png.data[idx] = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - alphaRatio)) / alphaRatio)));
              png.data[idx + 1] = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - alphaRatio)) / alphaRatio)));
              png.data[idx + 2] = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - alphaRatio)) / alphaRatio)));
            }
          }
        }
      }
    }
  }

  const tmpClean = `/tmp/${path.basename(inputJpg, path.extname(inputJpg))}_clean.png`;
  fs.writeFileSync(tmpClean, PNG.sync.write(png));

  // Trim transparent edges and add clean border
  execSync(`convert "${tmpClean}" -trim +repage -bordercolor none -border ${borderPad} "${outCleanPath}"`);
  console.log(`✓ Processed sprite with 100% transparent bg: ${outCleanPath}`);
}

function createThumb(cleanPng: string, outThumb: string, topCrop = 0.05, heightCrop = 0.4) {
  const info = execSync(`identify -format "%w %h" "${cleanPng}"`).toString().trim().split(' ');
  const w = parseInt(info[0], 10);
  const h = parseInt(info[1], 10);
  const size = Math.min(w, Math.round(h * heightCrop));
  const cropY = Math.round(h * topCrop);
  const cropX = Math.round((w - size) / 2);
  execSync(`convert "${cleanPng}" -crop ${size}x${size}+${cropX}+${cropY} +repage -resize 256x256 "${outThumb}"`);
  console.log(`✓ Processed thumb: ${outThumb}`);
}

// 2. Process Edacorn Wings
processSpriteClean('src/assets/images/edacorn_alas_idle_1794137779008.jpg', 'public/assets/combat/edacorn_alas_idle.png');
fs.copyFileSync('public/assets/combat/edacorn_alas_idle.png', 'public/assets/portraits/edacorn_alas_idle.png');
createThumb('public/assets/combat/edacorn_alas_idle.png', 'public/assets/portraits/edacorn_alas_thumb.png', 0.0, 0.4);

processSpriteClean('src/assets/images/edacorn_alas_attack_1794137794561.jpg', 'public/assets/combat/edacorn_alas_attack.png');
processSpriteClean('src/assets/images/edacorn_alas_hurt_1794137807723.jpg', 'public/assets/combat/edacorn_alas_hurt.png');

// 3. Process Araknoide Voraz
processSpriteClean('src/assets/images/arak_voraz_idle_1794137825741.jpg', 'public/assets/combat/araknoide_voraz_clean.png');
processSpriteClean('src/assets/images/arak_voraz_attack_1794137840258.jpg', 'public/assets/combat/araknoide_voraz_attack.png');
processSpriteClean('src/assets/images/arak_voraz_hurt_1794137854314.jpg', 'public/assets/combat/araknoide_voraz_hurt.png');
createThumb('public/assets/combat/araknoide_voraz_clean.png', 'public/assets/combat/araknoide_voraz_thumb.png', 0.05, 0.42);

// 4. Process Araknoide Espinoso
processSpriteClean('src/assets/images/arak_espinoso_idle_1794137870303.jpg', 'public/assets/combat/araknoide_espinoso_clean.png');
processSpriteClean('src/assets/images/arak_espinoso_attack_1794137883938.jpg', 'public/assets/combat/araknoide_espinoso_attack.png');
processSpriteClean('src/assets/images/arak_espinoso_hurt_1794137898059.jpg', 'public/assets/combat/araknoide_espinoso_hurt.png');
createThumb('public/assets/combat/araknoide_espinoso_clean.png', 'public/assets/combat/araknoide_espinoso_thumb.png', 0.05, 0.42);

// 5. Process Araknoide Ovíparo
processSpriteClean('src/assets/images/arak_oviparo_idle_1794137914069.jpg', 'public/assets/combat/araknoide_oviparo_clean.png');
processSpriteClean('src/assets/images/arak_oviparo_attack_1794137929284.jpg', 'public/assets/combat/araknoide_oviparo_attack.png');
processSpriteClean('src/assets/images/arak_oviparo_hurt_1794137942520.jpg', 'public/assets/combat/araknoide_oviparo_hurt.png');
createThumb('public/assets/combat/araknoide_oviparo_clean.png', 'public/assets/combat/araknoide_oviparo_thumb.png', 0.05, 0.42);

console.log('--- All Furia Carmesí assets processed with 100% transparent backgrounds! ---');
