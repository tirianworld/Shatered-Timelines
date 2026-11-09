import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

const TARGET_W = 1024;
const TARGET_H = 1400;
const BOTTOM_PAD = 32;

interface EnemyConfig {
  id: string;
  cleanSrc: string;
  attackSrc: string;
  hurtSrc: string;
  cleanFlip: boolean;
  attackFlip: boolean;
  hurtFlip: boolean;
  thumbSrc?: string;
  thumbCrop?: string;
}

const ENEMIES: EnemyConfig[] = [
  {
    id: 'guardia_lanza',
    cleanSrc: 'public/assets/combat/guardia_lanza_clean.png',
    attackSrc: 'public/assets/combat/guardia_lanza_attack.png',
    hurtSrc: 'public/assets/combat/guardia_lanza_hurt.png',
    cleanFlip: true,
    attackFlip: true,
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/guardia_lanza_clean.png',
    thumbCrop: '600x600+20+120',
  },
  {
    id: 'guardia_espada',
    cleanSrc: 'public/assets/combat/guardia_espada_clean.png',
    attackSrc: 'public/assets/combat/guardia_espada_attack.png',
    hurtSrc: 'public/assets/combat/guardia_espada_hurt.png',
    cleanFlip: true,
    attackFlip: true,
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/guardia_espada_clean.png',
    thumbCrop: '600x600+120+60',
  },
  {
    id: 'guardia_ballesta',
    cleanSrc: 'public/assets/combat/guardia_ballesta_clean.png',
    attackSrc: 'public/assets/combat/guardia_ballesta_attack.png',
    hurtSrc: 'public/assets/combat/guardia_ballesta_hurt.png',
    cleanFlip: false, // Already aiming and firing left!
    attackFlip: false,
    hurtFlip: false,
    thumbSrc: 'public/assets/combat/guardia_ballesta_clean.png',
    thumbCrop: '600x600+120+0',
  },
  {
    id: 'guardia_pesado',
    cleanSrc: 'public/assets/combat/guardia_pesado_clean.png',
    attackSrc: 'public/assets/combat/guardia_pesado_attack.png',
    hurtSrc: 'public/assets/combat/guardia_pesado_hurt.png',
    cleanFlip: true,
    attackFlip: false, // Already swinging down towards left
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/guardia_pesado_clean.png',
    thumbCrop: '600x600+120+70',
  },
  {
    id: 'goblin_daga',
    cleanSrc: 'public/assets/combat/goblin_daga_clean.png',
    attackSrc: 'public/assets/combat/goblin_daga_attack.png',
    hurtSrc: 'public/assets/combat/goblin_daga_hurt.png',
    cleanFlip: true,
    attackFlip: true,
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/goblin_daga_clean.png',
    thumbCrop: '650x650+60+0',
  },
  {
    id: 'goblin_honda',
    cleanSrc: 'public/assets/combat/goblin_honda_clean.png',
    attackSrc: 'public/assets/combat/goblin_honda_attack.png',
    hurtSrc: 'public/assets/combat/goblin_honda_hurt.png',
    cleanFlip: false, // Already facing/throwing left!
    attackFlip: false,
    hurtFlip: false,
    thumbSrc: 'public/assets/combat/goblin_honda_clean.png',
    thumbCrop: '600x600+50+150',
  },
  {
    id: 'goblin_garrote',
    cleanSrc: 'public/assets/combat/goblin_garrote_clean.png',
    attackSrc: 'public/assets/combat/goblin_garrote_attack.png',
    hurtSrc: 'public/assets/combat/goblin_garrote_hurt.png',
    cleanFlip: true,
    attackFlip: true,
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/goblin_garrote_clean.png',
    thumbCrop: '650x650+50+0',
  },
  {
    id: 'goblin_chaman',
    cleanSrc: 'public/assets/combat/goblin_chaman_clean.png',
    attackSrc: 'public/assets/combat/goblin_chaman_attack.png',
    hurtSrc: 'public/assets/combat/goblin_chaman_hurt.png',
    cleanFlip: true,
    attackFlip: true,
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/goblin_chaman_clean.png',
    thumbCrop: '650x650+0+0',
  },
  {
    id: 'devorador_quitinoso',
    cleanSrc: 'public/assets/combat/devorador_quitinoso_clean.png',
    attackSrc: 'public/assets/combat/devorador_quitinoso_attack.png',
    hurtSrc: 'public/assets/combat/devorador_quitinoso_hurt.png',
    cleanFlip: true,
    attackFlip: true,
    hurtFlip: true,
    thumbSrc: 'public/assets/combat/devorador_quitinoso_clean.png',
    thumbCrop: '650x650+120+70',
  },
  {
    id: 'araknoide_rojo',
    cleanSrc: 'public/assets/combat/araknoide_rojo_clean.png',
    attackSrc: 'public/assets/combat/araknoide_rojo_attack.png',
    hurtSrc: 'public/assets/combat/araknoide_rojo_hurt.png',
    cleanFlip: false, // Already facing left
    attackFlip: false,
    hurtFlip: false,
  },
  {
    id: 'araknoide_azul',
    cleanSrc: 'public/assets/combat/araknoide_azul_clean.png',
    attackSrc: 'public/assets/combat/araknoide_azul_attack.png',
    hurtSrc: 'public/assets/combat/araknoide_azul_hurt.png',
    cleanFlip: false,
    attackFlip: false,
    hurtFlip: false,
  },
  {
    id: 'semiboss_zancudo',
    cleanSrc: 'public/assets/combat/semiboss_zancudo_clean.png',
    attackSrc: 'public/assets/combat/semiboss_zancudo_attack.png',
    hurtSrc: 'public/assets/combat/semiboss_zancudo_hurt.png',
    cleanFlip: false,
    attackFlip: false,
    hurtFlip: false,
  },
  {
    id: 'semiboss_melenudo',
    cleanSrc: 'public/assets/combat/semiboss_melenudo_clean.png',
    attackSrc: 'public/assets/combat/semiboss_melenudo_attack.png',
    hurtSrc: 'public/assets/combat/semiboss_melenudo_hurt.png',
    cleanFlip: false,
    attackFlip: false,
    hurtFlip: false,
  },
  {
    id: 'araknoide',
    cleanSrc: 'public/assets/aistudio/araknoide_clean.png',
    attackSrc: 'public/assets/combat/araknoide_attack.png',
    hurtSrc: 'public/assets/combat/araknoide_hurt.png',
    cleanFlip: false,
    attackFlip: false,
    hurtFlip: false,
  },
  {
    id: 'medusa',
    cleanSrc: 'public/assets/combat/medusa_clean.png',
    attackSrc: 'public/assets/combat/medusa_attack.png',
    hurtSrc: 'public/assets/combat/medusa_hurt.png',
    cleanFlip: false,
    attackFlip: false,
    hurtFlip: false,
  },
];

function placeOnStandardCanvas(srcPath: string, destPath: string, shouldFlip: boolean) {
  if (!fs.existsSync(srcPath)) {
    console.warn(`Source not found: ${srcPath}`);
    return;
  }

  // First optionally flip with ImageMagick convert
  const tmpPath = `/tmp/std_${Math.random().toString(36).substring(7)}.png`;
  if (shouldFlip) {
    execSync(`convert "${srcPath}" -flop "${tmpPath}"`);
  } else {
    fs.copyFileSync(srcPath, tmpPath);
  }

  const png = PNG.sync.read(fs.readFileSync(tmpPath));
  const w = png.width;
  const h = png.height;

  // Find tight bounding box of visible content
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = png.data[(y * w + x) * 4 + 3];
      if (a > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    // Empty image fallback
    minX = 0; maxX = w - 1; minY = 0; maxY = h - 1;
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;

  // Check if character exceeds canvas (with margins)
  const maxAvailW = TARGET_W - 32;
  const maxAvailH = TARGET_H - BOTTOM_PAD - 20;

  let scale = 1.0;
  if (boxW > maxAvailW || boxH > maxAvailH) {
    scale = Math.min(maxAvailW / boxW, maxAvailH / boxH);
  }

  // Create target canvas: 1024 x 1400, completely transparent
  const outPng = new PNG({ width: TARGET_W, height: TARGET_H });
  // All pixels initialize to 0 (RGBA 0,0,0,0)

  if (Math.abs(scale - 1.0) < 0.001) {
    // 1:1 pixel copy without interpolation
    // Align bottom at TARGET_H - BOTTOM_PAD
    const dstY = TARGET_H - BOTTOM_PAD - boxH;
    const dstX = Math.round((TARGET_W - boxW) / 2);

    for (let by = 0; by < boxH; by++) {
      for (let bx = 0; bx < boxW; bx++) {
        const srcX = minX + bx;
        const srcY = minY + by;
        const srcIdx = (srcY * w + srcX) * 4;

        const targetX = dstX + bx;
        const targetY = dstY + by;
        if (targetX >= 0 && targetX < TARGET_W && targetY >= 0 && targetY < TARGET_H) {
          const dstIdx = (targetY * TARGET_W + targetX) * 4;
          outPng.data[dstIdx] = png.data[srcIdx];
          outPng.data[dstIdx + 1] = png.data[srcIdx + 1];
          outPng.data[dstIdx + 2] = png.data[srcIdx + 2];
          outPng.data[dstIdx + 3] = png.data[srcIdx + 3];
        }
      }
    }
  } else {
    // Scaled placement
    const scaledW = Math.round(boxW * scale);
    const scaledH = Math.round(boxH * scale);
    const dstY = TARGET_H - BOTTOM_PAD - scaledH;
    const dstX = Math.round((TARGET_W - scaledW) / 2);

    // Binlinear/nearest neighbor sample
    for (let sy = 0; sy < scaledH; sy++) {
      for (let sx = 0; sx < scaledW; sx++) {
        const origX = Math.min(w - 1, Math.max(0, minX + Math.round(sx / scale)));
        const origY = Math.min(h - 1, Math.max(0, minY + Math.round(sy / scale)));
        const srcIdx = (origY * w + origX) * 4;

        const targetX = dstX + sx;
        const targetY = dstY + sy;
        if (targetX >= 0 && targetX < TARGET_W && targetY >= 0 && targetY < TARGET_H) {
          const dstIdx = (targetY * TARGET_W + targetX) * 4;
          outPng.data[dstIdx] = png.data[srcIdx];
          outPng.data[dstIdx + 1] = png.data[srcIdx + 1];
          outPng.data[dstIdx + 2] = png.data[srcIdx + 2];
          outPng.data[dstIdx + 3] = png.data[srcIdx + 3];
        }
      }
    }
  }

  fs.writeFileSync(destPath, PNG.sync.write(outPng));
  try { fs.unlinkSync(tmpPath); } catch {}
  console.log(`Placed ${destPath}: ${TARGET_W}x${TARGET_H} (box: ${boxW}x${boxH}, flip: ${shouldFlip})`);
}

// Process each enemy
for (const enemy of ENEMIES) {
  console.log(`\n=== Standardizing ${enemy.id} ===`);
  const cleanDst = enemy.id === 'araknoide' ? 'public/assets/aistudio/araknoide_clean.png' : `public/assets/combat/${enemy.id}_clean.png`;
  const attackDst = `public/assets/combat/${enemy.id}_attack.png`;
  const hurtDst = `public/assets/combat/${enemy.id}_hurt.png`;

  placeOnStandardCanvas(enemy.cleanSrc, cleanDst, enemy.cleanFlip);
  placeOnStandardCanvas(enemy.attackSrc, attackDst, enemy.attackFlip);
  placeOnStandardCanvas(enemy.hurtSrc, hurtDst, enemy.hurtFlip);

  // Update thumbnail if thumbSrc provided
  if (enemy.thumbSrc && enemy.thumbCrop) {
    const thumbFile = `public/assets/combat/${enemy.id}_thumb.png`;
    const flopArg = enemy.cleanFlip ? '-flop' : '';
    try {
      execSync(`convert "${cleanDst}" -crop ${enemy.thumbCrop} -resize 128x128 "${thumbFile}"`);
      console.log(`Updated thumbnail: ${thumbFile}`);
    } catch (e) {
      console.warn(`Could not update thumb for ${enemy.id}:`, e);
    }
  }
}

console.log('\nAll sprites standardized successfully to 1024x1400 facing LEFT!');
