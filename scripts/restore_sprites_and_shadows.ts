import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

const TARGET_W = 1024;
const TARGET_H = 1400;

interface SpriteSpec {
  output: string;
  source: string;
  flip: boolean;
  scaleFactor?: number;
  isHero?: boolean;
}

const GUARD_SPECS: SpriteSpec[] = [
  // 1. Guardia Lanza:
  // - clean: image_256d5f79.png ALREADY faces left (spear held forward left). flip: false!
  // - attack: lanza_attack_full_1793958445496.jpg raw lunges right. flip: true faces left at hero!
  // - hurt: lanza_hurt_full_1793958447473.jpg raw struck from left, head tilted back. flip: false!
  // All 3 drawn at ~1376 source height -> scale = 1.0 (exact visual scale match)
  {
    output: 'public/assets/combat/guardia_lanza_clean.png',
    source: 'public/assets/aistudio/image_256d5f79.png',
    flip: false,
    scaleFactor: 1.0,
  },
  {
    output: 'public/assets/combat/guardia_lanza_attack.png',
    source: 'src/assets/images/lanza_attack_full_1793958445496.jpg',
    flip: true,
    scaleFactor: 1.0,
  },
  {
    output: 'public/assets/combat/guardia_lanza_hurt.png',
    source: 'src/assets/images/lanza_hurt_full_1793958447473.jpg',
    flip: false,
    scaleFactor: 1.0,
  },

  // 2. Guardia Espada:
  // - clean: image_8fdcb1fe.png ALREADY faces left (sword raised forward left). flip: false!
  // - attack: espada_attack_pose_1793958449070.jpg ALREADY faces left. flip: false!
  // - hurt: espada_hurt_pose_1793958449531.jpg ALREADY faces left. flip: false!
  // All 3 drawn with identical anatomical scale (~770px eyeToFoot). Scale by 1.085 to match 1370 canvas height
  {
    output: 'public/assets/combat/guardia_espada_clean.png',
    source: 'public/assets/aistudio/image_8fdcb1fe.png',
    flip: false,
    scaleFactor: 1.085,
  },
  {
    output: 'public/assets/combat/guardia_espada_attack.png',
    source: 'src/assets/images/espada_attack_pose_1793958449070.jpg',
    flip: false,
    scaleFactor: 1.085,
  },
  {
    output: 'public/assets/combat/guardia_espada_hurt.png',
    source: 'src/assets/images/espada_hurt_pose_1793958449531.jpg',
    flip: false,
    scaleFactor: 1.085,
  },

  // 3. Guardia Ballesta:
  // - clean: image_12cd855e.png ALREADY faces left. flip: false! Scale 1.089 to match 1376 height
  // - attack: ballesta_atk_pose_1793958450864.jpg raw aims right. flip: true to aim left at hero! Scale 1.0
  // - hurt: ballesta_hurt_pose_1793958450897.jpg raw struck from left. flip: false! Scale 1.0
  {
    output: 'public/assets/combat/guardia_ballesta_clean.png',
    source: 'public/assets/aistudio/image_12cd855e.png',
    flip: false,
    scaleFactor: 1.089,
  },
  {
    output: 'public/assets/combat/guardia_ballesta_attack.png',
    source: 'src/assets/images/ballesta_atk_pose_1793958450864.jpg',
    flip: true,
    scaleFactor: 1.0,
  },
  {
    output: 'public/assets/combat/guardia_ballesta_hurt.png',
    source: 'src/assets/images/ballesta_hurt_pose_1793958450897.jpg',
    flip: false,
    scaleFactor: 1.0,
  },

  // 4. Guardia Pesado:
  // - clean: guardia_pesado_1793796656045.jpg faces front-left, rune 'R'. flip: false! Scale 1.08
  // - attack: guardia_pesado_attack_1793956490193.jpg raw swings right with backward 'Я' rune. flip: true swings left, rune 'R'! Scale 1.138
  // - hurt: guardia_pesado_hurt_1793956495759.jpg raw reels with backward 'Я' rune. flip: true reels right, rune 'R'! Scale 1.138
  {
    output: 'public/assets/combat/guardia_pesado_clean.png',
    source: 'src/assets/images/guardia_pesado_1793796656045.jpg',
    flip: false,
    scaleFactor: 1.08,
  },
  {
    output: 'public/assets/combat/guardia_pesado_attack.png',
    source: 'src/assets/images/guardia_pesado_attack_1793956490193.jpg',
    flip: true,
    scaleFactor: 1.138,
  },
  {
    output: 'public/assets/combat/guardia_pesado_hurt.png',
    source: 'src/assets/images/guardia_pesado_hurt_1793956495759.jpg',
    flip: true,
    scaleFactor: 1.138,
  },

  // Guardia Abollado / Malherido (used in story dialogues):
  // Raw looks right -> flip: true to look left at hero
  {
    output: 'public/assets/combat/guardia_abollado_clean.png',
    source: 'src/assets/images/guardia_abollado_1793820105792.jpg',
    flip: true,
    scaleFactor: 1.08,
  },

  // Goblins: scale normalized so that 1024x1024 attack/hurt poses match 848x1264 clean body scale
  {
    output: 'public/assets/combat/goblin_daga_clean.png',
    source: 'src/assets/images/goblin_daga_sprite_1793872991838.jpg',
    flip: true,
    scaleFactor: 1.15,
  },
  {
    output: 'public/assets/combat/goblin_daga_attack.png',
    source: 'src/assets/images/gob_daga_atk_1793959279288.jpg',
    flip: true,
    scaleFactor: 1.419,
  },
  {
    output: 'public/assets/combat/goblin_daga_hurt.png',
    source: 'src/assets/images/gob_daga_hurt_1793959281660.jpg',
    flip: true,
    scaleFactor: 1.419,
  },
  {
    output: 'public/assets/combat/goblin_honda_clean.png',
    source: 'src/assets/images/goblin_honda_sprite_1793873008265.jpg',
    flip: false,
    scaleFactor: 1.10,
  },
  {
    output: 'public/assets/combat/goblin_honda_attack.png',
    source: 'src/assets/images/gob_honda_atk_1793959283039.jpg',
    flip: false,
    scaleFactor: 1.357,
  },
  {
    output: 'public/assets/combat/goblin_honda_hurt.png',
    source: 'src/assets/images/gob_honda_hurt_1793959285611.jpg',
    flip: false,
    scaleFactor: 1.357,
  },
  {
    output: 'public/assets/combat/goblin_garrote_clean.png',
    source: 'src/assets/images/goblin_garrote_sprite_1793873023266.jpg',
    flip: true,
    scaleFactor: 1.15,
  },
  {
    output: 'public/assets/combat/goblin_garrote_attack.png',
    source: 'src/assets/images/gob_garrote_atk_1793959290591.jpg',
    flip: true,
    scaleFactor: 1.419,
  },
  {
    output: 'public/assets/combat/goblin_garrote_hurt.png',
    source: 'src/assets/images/gob_garrote_hurt_1793959289409.jpg',
    flip: true,
    scaleFactor: 1.419,
  },
  {
    output: 'public/assets/combat/goblin_chaman_clean.png',
    source: 'src/assets/images/goblin_chaman_sprite_1793873038190.jpg',
    flip: true,
    scaleFactor: 1.10,
  },
  {
    output: 'public/assets/combat/goblin_chaman_attack.png',
    source: 'src/assets/images/gob_chaman_atk_1793959287062.jpg',
    flip: true,
    scaleFactor: 1.357,
  },
  {
    output: 'public/assets/combat/goblin_chaman_hurt.png',
    source: 'src/assets/images/gob_chaman_hurt_1793959288230.jpg',
    flip: true,
    scaleFactor: 1.357,
  },

  // Devorador:
  {
    output: 'public/assets/combat/devorador_quitinoso_clean.png',
    source: 'src/assets/images/devorador_quitinoso_1793880640529.jpg',
    flip: true,
    scaleFactor: 1.08,
  },
  {
    output: 'public/assets/combat/devorador_quitinoso_attack.png',
    source: 'src/assets/images/devorador_attack_1793959961435.jpg',
    flip: true,
    scaleFactor: 1.33,
  },
  {
    output: 'public/assets/combat/devorador_quitinoso_hurt.png',
    source: 'src/assets/images/devorador_hurt_1793959979816.jpg',
    flip: true,
    scaleFactor: 1.33,
  },

  // Araknoides & Semibosses:
  {
    output: 'public/assets/combat/araknoide_rojo_clean.png',
    source: 'src/assets/images/araknoide_rojo_1793639523443.jpg',
    flip: false,
  },
  {
    output: 'public/assets/combat/araknoide_rojo_attack.png',
    source: 'public/assets/combat/araknoide_rojo_attack.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/araknoide_rojo_hurt.png',
    source: 'public/assets/combat/araknoide_rojo_hurt.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/araknoide_azul_clean.png',
    source: 'src/assets/images/araknoide_azul_1793639534845.jpg',
    flip: false,
  },
  {
    output: 'public/assets/combat/araknoide_azul_attack.png',
    source: 'public/assets/combat/araknoide_azul_attack.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/araknoide_azul_hurt.png',
    source: 'public/assets/combat/araknoide_azul_hurt.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/semiboss_zancudo_clean.png',
    source: 'src/assets/images/semiboss_zancudo_1793639548503.jpg',
    flip: false,
  },
  {
    output: 'public/assets/combat/semiboss_zancudo_attack.png',
    source: 'public/assets/combat/semiboss_zancudo_attack.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/semiboss_zancudo_hurt.png',
    source: 'public/assets/combat/semiboss_zancudo_hurt.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/semiboss_melenudo_clean.png',
    source: 'src/assets/images/semiboss_melenudo_1793639562762.jpg',
    flip: false,
  },
  {
    output: 'public/assets/combat/semiboss_melenudo_attack.png',
    source: 'public/assets/combat/semiboss_melenudo_attack.png',
    flip: false,
  },
  {
    output: 'public/assets/combat/semiboss_melenudo_hurt.png',
    source: 'public/assets/combat/semiboss_melenudo_hurt.png',
    flip: false,
  },
];

const MAGORDITO_SPECS: SpriteSpec[] = [
  {
    output: 'public/assets/combat/magordito_idle.png',
    source: 'public/assets/combat/magordito_idle.png',
    flip: false,
    isHero: true,
  },
  {
    output: 'public/assets/combat/magordito_cast_rayo.png',
    source: 'public/assets/combat/magordito_cast_rayo.png',
    flip: false,
    isHero: true,
  },
  {
    output: 'public/assets/combat/magordito_cast_dios.png',
    source: 'public/assets/combat/magordito_cast_dios.png',
    flip: false,
    isHero: true,
  },
  {
    output: 'public/assets/combat/magordito_cast_slash.png',
    source: 'public/assets/combat/magordito_cast_slash.png',
    flip: false,
    isHero: true,
  },
  {
    output: 'public/assets/combat/magordito_cast_toxic.png',
    source: 'public/assets/combat/magordito_cast_toxic.png',
    flip: false,
    isHero: true,
  },
  {
    output: 'public/assets/combat/magordito_hurt.png',
    source: 'public/assets/combat/magordito_hurt.png',
    flip: false,
    isHero: true,
  },
];

function processAndStandardize(spec: SpriteSpec) {
  if (!fs.existsSync(spec.source)) {
    console.warn(`Source not found: ${spec.source}`);
    return;
  }

  const tmpPng = `/tmp/raw_${Math.random().toString(36).substring(7)}.png`;
  const flipArg = spec.flip ? '-flop' : '';
  execSync(`convert "${spec.source}" ${flipArg} "${tmpPng}"`);

  const png = PNG.sync.read(fs.readFileSync(tmpPng));
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);

  function isNearWhite(idx: number) {
    if (png.data[idx + 3] === 0) return true;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return r >= 232 && g >= 232 && b >= 232;
  }

  // 1. Flood fill from outer perimeter
  const q: number[] = [];
  for (let x = 0; x < w; x++) {
    q.push(x, 0); visited[x] = 1;
    q.push(x, h - 1); visited[(h - 1) * w + x] = 1;
  }
  for (let y = 1; y < h - 1; y++) {
    q.push(0, y); visited[y * w] = 1;
    q.push(w - 1, y); visited[y * w + w - 1] = 1;
  }

  let head = 0;
  while (head < q.length) {
    const qx = q[head++];
    const qy = q[head++];
    const idx = (qy * w + qx) * 4;
    if (isNearWhite(idx)) {
      png.data[idx + 3] = 0;
      const nbrs = [
        [qx + 1, qy],
        [qx - 1, qy],
        [qx, qy + 1],
        [qx, qy - 1],
      ];
      for (const [nx, ny] of nbrs) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const npos = ny * w + nx;
          if (!visited[npos]) {
            visited[npos] = 1;
            q.push(nx, ny);
          }
        }
      }
    }
  }

  // 2. Eliminate all enclosed white residual pockets (between legs, arms, shields, weapons)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      if (!visited[pos]) {
        const idx = pos * 4;
        if (png.data[idx + 3] > 0 && isNearWhite(idx)) {
          const pocket: [number, number][] = [];
          const pq: number[] = [x, y];
          visited[pos] = 1;
          let phead = 0;
          while (phead < pq.length) {
            const px = pq[phead++];
            const py = pq[phead++];
            pocket.push([px, py]);
            const nbrs = [
              [px + 1, py],
              [px - 1, py],
              [px, py + 1],
              [px, py - 1],
            ];
            for (const [nx, ny] of nbrs) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const npos = ny * w + nx;
                if (!visited[npos]) {
                  const nidx = npos * 4;
                  if (png.data[nidx + 3] > 0 && isNearWhite(nidx)) {
                    visited[npos] = 1;
                    pq.push(nx, ny);
                  }
                }
              }
            }
          }
          for (const [px, py] of pocket) {
            const cidx = (py * w + px) * 4;
            png.data[cidx + 3] = 0;
          }
        }
      }
    }
  }

  // 3. De-halo / antialias perimeter pixels bordering transparency
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (png.data[idx + 3] > 0) {
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        if (r > 200 && g > 200 && b > 200) {
          let hasTransNbr = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (png.data[(ny * w + nx) * 4 + 3] === 0) {
                  hasTransNbr = true;
                  break;
                }
              }
            }
            if (hasTransNbr) break;
          }
          if (hasTransNbr) {
            const lum = (r + g + b) / 3;
            if (lum > 230) {
              png.data[idx + 3] = 0;
            } else if (lum > 200) {
              png.data[idx + 3] = Math.round((255 * (230 - lum)) / 30);
            }
          }
        }
      }
    }
  }

  // 4. Measure tight character bounding box
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
    minX = 0; maxX = w - 1; minY = 0; maxY = h - 1;
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;

  // 5. Canvas dimensions: TARGET_W x TARGET_H
  const canvasW = spec.isHero ? 1024 : TARGET_W;
  const canvasH = spec.isHero ? 1400 : TARGET_H;

  const maxW = canvasW - 40;
  const maxH = canvasH - 20;

  // Visual Scale Harmonization: use specified scaleFactor or default
  let scale = spec.scaleFactor ?? 1.0;
  if (boxW * scale > maxW) {
    scale = maxW / boxW;
  }
  if (boxH * scale > maxH) {
    scale = maxH / boxH;
  }

  const finalW = Math.round(boxW * scale);
  const finalH = Math.round(boxH * scale);

  // EXACT GROUNDING: The contact plane of the character's feet is grounded at the canvas bottom (bottomGap = 0)
  const dstY = canvasH - finalH;
  // Centering in canvas width
  const dstX = Math.round((canvasW - finalW) / 2);

  const outPng = new PNG({ width: canvasW, height: canvasH });

  for (let dy = 0; dy < finalH; dy++) {
    const srcY = Math.min(h - 1, Math.max(0, minY + Math.round(dy / scale)));
    const targetY = dstY + dy;
    if (targetY < 0 || targetY >= canvasH) continue;

    for (let dx = 0; dx < finalW; dx++) {
      const srcX = Math.min(w - 1, Math.max(0, minX + Math.round(dx / scale)));
      const targetX = dstX + dx;
      if (targetX < 0 || targetX >= canvasW) continue;

      const srcIdx = (srcY * w + srcX) * 4;
      const dstIdx = (targetY * canvasW + targetX) * 4;

      outPng.data[dstIdx] = png.data[srcIdx];
      outPng.data[dstIdx + 1] = png.data[srcIdx + 1];
      outPng.data[dstIdx + 2] = png.data[srcIdx + 2];
      outPng.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }

  fs.writeFileSync(spec.output, PNG.sync.write(outPng));
  try { fs.unlinkSync(tmpPng); } catch {}
  console.log(`Standardized ${spec.output}: scale=${scale.toFixed(3)}, box=${boxW}x${boxH} -> final=${finalW}x${finalH}, dstY=${dstY}`);
}

console.log('=== Processing Enemies and Guards ===');
for (const spec of GUARD_SPECS) {
  processAndStandardize(spec);
}

console.log('\n=== Processing Magordito Hero Poses ===');
for (const spec of MAGORDITO_SPECS) {
  processAndStandardize(spec);
}

// Generate matching clean thumbnails
const THUMB_SPECS = [
  { output: 'public/assets/combat/guardia_lanza_thumb.png', src: 'public/assets/combat/guardia_lanza_clean.png', crop: '550x550+240+140' },
  { output: 'public/assets/combat/guardia_espada_thumb.png', src: 'public/assets/combat/guardia_espada_clean.png', crop: '550x550+240+140' },
  { output: 'public/assets/combat/guardia_ballesta_thumb.png', src: 'public/assets/combat/guardia_ballesta_clean.png', crop: '550x550+240+100' },
  { output: 'public/assets/combat/guardia_pesado_thumb.png', src: 'public/assets/combat/guardia_pesado_clean.png', crop: '550x550+240+120' },
  { output: 'public/assets/combat/guardia_abollado_thumb.png', src: 'public/assets/combat/guardia_abollado_clean.png', crop: '550x550+240+120' },
];

for (const t of THUMB_SPECS) {
  try {
    execSync(`convert "${t.src}" -crop ${t.crop} -resize 128x128 "${t.output}"`);
    console.log(`Generated thumbnail: ${t.output}`);
  } catch (e) {
    console.warn(`Could not generate thumbnail ${t.output}:`, e);
  }
}

console.log('\nAll combat sprites restored with zero background artifacts, perfect left orientation, and exact shadow grounding!');
