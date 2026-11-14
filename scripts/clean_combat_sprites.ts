import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const DIR = 'public/assets/combat';

interface Comp {
  pixels: number[];
  size: number;
  pureCount: number;
  purePct: number;
  touchesBorder: boolean;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function findWhiteComponents(
  png: PNG,
  minLum: number,
  maxSat: number,
  minAlpha: number = 140
): Comp[] {
  const { width: w, height: h, data } = png;
  const visited = new Uint8Array(w * h);
  const comps: Comp[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      const i = idx * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      const minC = Math.min(r, g, b);
      const maxC = Math.max(r, g, b);
      if (a >= minAlpha && minC >= minLum && maxC - minC <= maxSat) {
        const q: number[] = [idx];
        visited[idx] = 1;
        let pureCount = 0;
        let touchesBorder = false;
        let minX = x, maxX = x, minY = y, maxY = y;

        for (let qi = 0; qi < q.length; qi++) {
          const cur = q[qi];
          const cx = cur % w;
          const cy = (cur / w) | 0;
          const ci = cur * 4;
          if (data[ci] >= 248 && data[ci + 1] >= 248 && data[ci + 2] >= 248) pureCount++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          if (cx === 0 || cx === w - 1 || cy === 0 || cy === h - 1) touchesBorder = true;

          const nbs = [
            cx > 0 ? cur - 1 : -1,
            cx < w - 1 ? cur + 1 : -1,
            cy > 0 ? cur - w : -1,
            cy < h - 1 ? cur + w : -1,
          ];
          for (const nIdx of nbs) {
            if (nIdx < 0 || visited[nIdx]) continue;
            const ni = nIdx * 4;
            const nr = data[ni], ng = data[ni + 1], nb = data[ni + 2], na = data[ni + 3];
            const nMin = Math.min(nr, ng, nb);
            const nMax = Math.max(nr, ng, nb);
            if (na >= minAlpha && nMin >= minLum && nMax - nMin <= maxSat) {
              visited[nIdx] = 1;
              q.push(nIdx);
            }
          }
        }

        comps.push({
          pixels: q,
          size: q.length,
          pureCount,
          purePct: (pureCount / q.length) * 100,
          touchesBorder,
          minX,
          minY,
          maxX,
          maxY,
        });
      }
    }
  }
  return comps;
}

function eraseComponentsWithFeather(
  png: PNG,
  toErase: Comp[],
  featherLum: number = 212,
  featherSat: number = 28
): number {
  const { width: w, height: h, data } = png;
  const erasedMask = new Uint8Array(w * h);
  let removed = 0;

  for (const c of toErase) {
    for (const p of c.pixels) {
      data[p * 4 + 3] = 0;
      erasedMask[p] = 1;
      removed++;
    }
  }

  if (removed === 0) return 0;

  // Two-pass soft fringe cleanup for pixels directly bordering newly erased white regions
  const frontier: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (erasedMask[p]) continue;
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const x = p % w;
    const y = (p / w) | 0;
    const hasErasedNb =
      (x > 0 && erasedMask[p - 1]) ||
      (x < w - 1 && erasedMask[p + 1]) ||
      (y > 0 && erasedMask[p - w]) ||
      (y < h - 1 && erasedMask[p + w]) ||
      (x > 0 && y > 0 && erasedMask[p - w - 1]) ||
      (x < w - 1 && y > 0 && erasedMask[p - w + 1]) ||
      (x > 0 && y < h - 1 && erasedMask[p + w - 1]) ||
      (x < w - 1 && y < h - 1 && erasedMask[p + w + 1]);
    if (hasErasedNb) frontier.push(p);
  }

  for (const p of frontier) {
    const i = p * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    if (minC >= featherLum && maxC - minC <= featherSat) {
      if (minC >= 238) {
        data[i + 3] = 0;
      } else {
        const factor = Math.max(0, Math.min(1, (242 - minC) / (242 - featherLum)));
        data[i + 3] = Math.round(a * factor * 0.55);
      }
    }
  }

  return removed;
}

interface Rule {
  minLum?: number;
  maxSat?: number;
  featherLum?: number;
  featherSat?: number;
  shouldErase: (c: Comp, w: number, h: number) => boolean;
}

const RULES: Record<string, Rule> = {
  'araknoide_glacial_attack.png': {
    minLum: 228,
    maxSat: 25,
    shouldErase: (c) => c.touchesBorder || c.size >= 400,
  },
  'araknoide_glacial_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 500 && (c.maxY < 150 || (c.minY > 450 && c.minX > 410))),
  },
  'araknoide_rojo_clean.png': {
    minLum: 195,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || (c.minY >= 1240 && c.size >= 800),
  },
  'arlem_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) =>
      c.touchesBorder || (c.size >= 500 && !(c.minX >= 380 && c.maxY <= 400)),
  },
  'arlem_cast_balada.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || (c.size >= 400 && c.minX >= 550),
  },
  'arlem_cast_estocada.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 400,
  },
  'arlem_cast_inspiracion.png': {
    minLum: 232,
    maxSat: 24,
    shouldErase: (c) => c.touchesBorder || (c.size >= 250 && (c.minX >= 640 || c.maxX <= 170)),
  },
  'arlem_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || (c.size >= 500 && c.minY >= 350),
  },
  'arlem_idle.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || (c.size >= 400 && c.maxX <= 140),
  },
  'arlem_orco_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 400,
  },
  'chispo_attack.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 500,
  },
  'chispo_cast.png': {
    minLum: 232,
    maxSat: 24,
    // Keep eyes/wings only inside face/helmet center; remove all trapped rays/gaps
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 250 && !(c.minX >= 420 && c.maxX <= 540 && c.minY >= 310 && c.maxY <= 410)),
  },
  'chispo_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 800,
  },
  'chispo_idle.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 800,
  },
  'drow_vaelas_llave_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || (c.size >= 500 && c.minY >= 400),
  },
  'edacorn_attack.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 300,
  },
  'edacorn_cast_furtivo.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 300,
  },
  'edacorn_cast_sigilo.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 300,
  },
  'figura_chasquido_clean.png': {
    minLum: 215,
    maxSat: 24,
    shouldErase: (c) => c.touchesBorder || c.size >= 350,
  },
  'guarda_negro_alabarda_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'guarda_negro_alabarda_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'guarda_negro_ballesta_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'guarda_negro_ballesta_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'guarda_negro_ballesta_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'guarda_negro_espada_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 400,
  },
  'guarda_negro_pesado_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 400,
  },
  'hobgoblin_capataz_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase1_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase1_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase1_idle.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase2_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase2_idle.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase3_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase3_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'hobgoblin_fase3_idle.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'kairon_attack.png': {
    minLum: 235,
    maxSat: 20,
    // Keep chest white shirt (y < 600), remove lower coat-tail background gaps (y >= 650)
    shouldErase: (c) => c.touchesBorder || (c.size >= 150 && c.minY >= 650),
  },
  'kairon_attack_dual.png': {
    minLum: 235,
    maxSat: 20,
    // Remove upper right hand/muzzle gap & lower coat-tail gaps, keep chest shirt
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 150 && (c.minY >= 640 || (c.minX >= 450 && c.maxY <= 310))),
  },
  'kairon_cast.png': {
    minLum: 235,
    maxSat: 20,
    // Keep chest shirt (purePct < 20% at [340..430, 540..625]) and top sword glint, remove pure white pockets
    shouldErase: (c) => c.touchesBorder || (c.size >= 300 && c.purePct >= 50),
  },
  'kairon_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || (c.size >= 200 && c.minY >= 620),
  },
  'orco_hacha_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 300,
  },
  'orco_lanza_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 300,
  },
  'orco_lanza_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 300,
  },
  'orco_regordete_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 250,
  },
  'pepe_loux_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 150 &&
        ((c.minX >= 250 && c.maxX <= 390 && c.minY >= 230 && c.maxY <= 330) ||
          (c.minX >= 520 && c.minY >= 280 && c.maxY <= 440))),
  },
  'pepe_loux_cast_hacha.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 150 &&
        ((c.minX >= 250 && c.maxX <= 390 && c.minY >= 230 && c.maxY <= 330) ||
          (c.minX >= 520 && c.minY >= 280 && c.maxY <= 440))),
  },
  'pepe_loux_cast_mandoble.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 150 &&
        ((c.minX >= 250 && c.maxX <= 390 && c.minY >= 230 && c.maxY <= 330) ||
          (c.minX >= 520 && c.minY >= 280 && c.maxY <= 440))),
  },
  'prometeo_attack.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 150,
  },
  'prometeo_cast.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 110,
  },
  'prometeo_hurt.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 150,
  },
  'prometeo_idle.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 150,
  },
  'ragnavaldr_attack.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 500,
  },
  'ragnavaldr_cast.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 350 &&
        ((c.minX >= 740 && c.maxX <= 940 && c.minY >= 460 && c.maxY <= 1030) ||
          (c.minX >= 380 && c.maxX <= 460 && c.minY >= 450 && c.maxY <= 600))),
  },
  'ragnavaldr_furia.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 500,
  },
  'ragnavaldr_hurt.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 500,
  },
  'ragnavaldr_idle.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 500,
  },
  'raxxar_spear.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || (c.size >= 120 && c.maxY <= 320),
  },
  'roxanne_attack.png': {
    // Notice pink musical glow around rapier has R>=232, G>=218, B>=230, so handle rapier trail + lyre slots carefully!
    minLum: 228,
    maxSat: 36,
    featherLum: 208,
    featherSat: 45,
    shouldErase: (c) =>
      c.touchesBorder ||
      // Lyre string gaps on left [80..240, 480..625]
      (c.size >= 250 && c.minX >= 75 && c.maxX <= 255 && c.minY >= 470 && c.maxY <= 630) ||
      // Leg/belt gap [260..320, 555..645]
      (c.size >= 250 && c.minX >= 260 && c.maxX <= 325 && c.minY >= 555 && c.maxY <= 645) ||
      // Huge musical rapier trail pocket [440..930, 175..580]
      (c.size >= 2000 && c.minX >= 440 && c.minY >= 175 && c.maxY <= 585),
  },
  'roxanne_cast.png': {
    minLum: 232,
    maxSat: 24,
    shouldErase: (c) =>
      c.touchesBorder ||
      // Lyre string gaps [155..260, 430..555]
      (c.size >= 200 && c.minX >= 155 && c.maxX <= 260 && c.minY >= 430 && c.maxY <= 555) ||
      // Waist/sword hilt gap [380..420, 485..540]
      (c.size >= 200 && c.minX >= 380 && c.maxX <= 425 && c.minY >= 485 && c.maxY <= 540),
  },
  'roxanne_hurt.png': {
    minLum: 232,
    maxSat: 24,
    // Lyre string gaps on right [540..720, 290..535]
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 200 && c.minX >= 540 && c.maxX <= 720 && c.minY >= 290 && c.maxY <= 535),
  },
  'roxanne_idle.png': {
    minLum: 232,
    maxSat: 24,
    // Lyre string gaps on left [70..200, 315..430]
    shouldErase: (c) =>
      c.touchesBorder ||
      (c.size >= 200 && c.minX >= 70 && c.maxX <= 200 && c.minY >= 315 && c.maxY <= 430),
  },
  'smurph_attack.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'smurph_cast.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'smurph_flight.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 180,
  },
  'smurph_hurt.png': {
    minLum: 232,
    maxSat: 22,
    // Keep teeth in mouth [560..640, 120..180] (tiny anyway), remove all >= 250 px gaps
    shouldErase: (c) => c.touchesBorder || (c.size >= 250 && c.minY >= 300),
  },
  'smurph_idle.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'smurph_landing.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || c.size >= 200,
  },
  'smurph_lightning.png': {
    minLum: 232,
    maxSat: 22,
    shouldErase: (c) => c.touchesBorder || (c.size >= 200 && c.minY >= 300),
  },
  'tiefling_familia_clean.png': {
    minLum: 235,
    maxSat: 20,
    shouldErase: (c) => c.touchesBorder || c.size >= 250,
  },
};

const ALL_FILES = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.png') && !f.endsWith('_thumb.png') && !f.endsWith('_badge.png'))
  .sort();

let totalPixelsRemoved = 0;
let modifiedFiles: string[] = [];

for (const f of ALL_FILES) {
  const fullPath = path.join(DIR, f);
  const png = PNG.sync.read(fs.readFileSync(fullPath));
  const rule = RULES[f];

  const minLum = rule?.minLum ?? 242;
  const maxSat = rule?.maxSat ?? 14;

  const comps = findWhiteComponents(png, minLum, maxSat, 140);
  const toErase = comps.filter((c) => {
    if (rule) return rule.shouldErase(c, png.width, png.height);
    // For sprites without trapped interior holes, only remove stray border-touching pure white pixels
    return c.touchesBorder;
  });

  if (toErase.length > 0) {
    const removed = eraseComponentsWithFeather(
      png,
      toErase,
      rule?.featherLum ?? 215,
      rule?.featherSat ?? 24
    );
    if (removed > 0) {
      fs.writeFileSync(fullPath, PNG.sync.write(png));
      totalPixelsRemoved += removed;
      modifiedFiles.push(f);
      console.log(`Cleaned ${f.padEnd(36)} (${toErase.length} regions, ${removed} px removed)`);
    }
  }
}

console.log(`\nTotal modified: ${modifiedFiles.length} files, ${totalPixelsRemoved} pixels removed.`);

// Render after-verification sheets of all modified sprites (where >= 50 px removed)
const sheetFiles = modifiedFiles.filter((f) => RULES[f]);
const cols = 4, rows = 4, cellW = 320, cellH = 320;
const perSheet = cols * rows;
const numSheets = Math.ceil(sheetFiles.length / perSheet);
fs.mkdirSync('.tmp_sheets', { recursive: true });

for (let s = 0; s < numSheets; s++) {
  const sheet = new PNG({ width: cols * cellW, height: rows * cellH });
  for (let y = 0; y < sheet.height; y++) {
    for (let x = 0; x < sheet.width; x++) {
      const i = (y * sheet.width + x) * 4;
      const checker = ((x >> 4) + (y >> 4)) & 1;
      sheet.data[i] = checker ? 30 : 42;
      sheet.data[i + 1] = checker ? 34 : 46;
      sheet.data[i + 2] = checker ? 44 : 56;
      sheet.data[i + 3] = 255;
    }
  }
  const slice = sheetFiles.slice(s * perSheet, (s + 1) * perSheet);
  slice.forEach((f, idx) => {
    const col = idx % cols, row = (idx / cols) | 0;
    const ox = col * cellW, oy = row * cellH;
    const src = PNG.sync.read(fs.readFileSync(path.join(DIR, f)));
    const scale = Math.min((cellW - 12) / src.width, (cellH - 12) / src.height);
    const dw = Math.round(src.width * scale), dh = Math.round(src.height * scale);
    const dx = ox + Math.round((cellW - dw) / 2);
    const dy = oy + Math.round((cellH - dh) / 2);
    for (let y = 0; y < dh; y++) {
      const sy = Math.min(src.height - 1, Math.floor(y / scale));
      for (let x = 0; x < dw; x++) {
        const sx = Math.min(src.width - 1, Math.floor(x / scale));
        const si = (sy * src.width + sx) * 4;
        const a = src.data[si + 3] / 255;
        if (a > 0) {
          const di = ((dy + y) * sheet.width + (dx + x)) * 4;
          sheet.data[di] = Math.round(src.data[si] * a + sheet.data[di] * (1 - a));
          sheet.data[di + 1] = Math.round(src.data[si + 1] * a + sheet.data[di + 1] * (1 - a));
          sheet.data[di + 2] = Math.round(src.data[si + 2] * a + sheet.data[di + 2] * (1 - a));
        }
      }
    }
  });
  fs.writeFileSync(`.tmp_sheets/after_${s + 1}.png`, PNG.sync.write(sheet));
  console.log(`Saved .tmp_sheets/after_${s + 1}.png`);
}
