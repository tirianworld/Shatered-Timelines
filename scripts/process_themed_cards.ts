import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const SRC_GEN_DIR = path.join(ROOT, 'src', 'assets', 'images');
const OUT_SKILLS_DIR = path.join(ROOT, 'public', 'assets', 'skills');
const TMP_DIR = path.join(ROOT, '.tmp_cards');

fs.mkdirSync(OUT_SKILLS_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

type FrameMode = 'copper' | 'edacorn' | 'pepe_stone' | 'chispo_match';

interface SkillEntry {
  outBase: string;
  srcPattern?: RegExp;
  srcExactPath?: string;
  isMasterDirect?: boolean;
  useMasterMaskForSource?: boolean;
  padFrac?: number;
}

interface HeroDeckJob {
  hero: string;
  mode: FrameMode;
  masterSrcPattern?: RegExp;
  masterSrcExactPath?: string;
  clearMasterNeonGreen?: boolean;
  skills: SkillEntry[];
}

const HERO_DECKS: HeroDeckJob[] = [
  {
    hero: 'magordito',
    mode: 'copper',
    masterSrcExactPath: path.join(ROOT, 'public/assets/skills/fortalecer_marioneta.png'),
    clearMasterNeonGreen: true,
    skills: [
      { outBase: 'magordito_rayo', srcExactPath: path.join(ROOT, 'public/assets/ui/rayo_necrotico.png'), padFrac: 0.06 },
      { outBase: 'magordito_dios', srcExactPath: path.join(ROOT, 'public/assets/skills/fragmento_del_dios_oscuro.png'), padFrac: 0.04 },
      { outBase: 'magordito_drenar', srcExactPath: path.join(ROOT, 'public/assets/items/drenar_maldiciones.png'), padFrac: 0.06 },
      { outBase: 'magordito_marioneta', srcExactPath: path.join(ROOT, 'public/assets/skills/fortalecer_marioneta.png'), isMasterDirect: true },
    ],
  },
  {
    hero: 'edacorn',
    mode: 'edacorn',
    masterSrcExactPath: path.join(ROOT, 'public/assets/items/edacorn contra ataque.png'),
    skills: [
      { outBase: 'edacorn_ataque_furtivo', srcPattern: /^card_edacorn_daggers_\d+\.jpg$/, padFrac: 0.06 },
    ],
  },
  {
    hero: 'arlem',
    mode: 'copper',
    masterSrcExactPath: path.join(ROOT, 'public/assets/skills/inspiracion_bardica_tier_1.png'),
    skills: [
      { outBase: 'arlem_inspiracion', srcExactPath: path.join(ROOT, 'public/assets/skills/inspiracion_bardica_tier_1.png'), isMasterDirect: true },
      { outBase: 'arlem_curacion', srcExactPath: path.join(ROOT, 'public/assets/items/curacion.png'), padFrac: 0.06 },
      { outBase: 'arlem_estocada', srcPattern: /^card_arlem_rapier_\d+\.jpg$/, padFrac: 0.06 },
    ],
  },
  {
    hero: 'pepe',
    mode: 'pepe_stone',
    masterSrcExactPath: path.join(ROOT, 'public/assets/skills/golpe_hacha.png'),
    skills: [
      { outBase: 'pepe_ataque', srcExactPath: path.join(ROOT, 'public/assets/skills/golpe_hacha.png'), isMasterDirect: true },
      { outBase: 'pepe_remo', srcExactPath: path.join(ROOT, 'public/assets/skills/golpe_de_remo.png'), useMasterMaskForSource: true, padFrac: 0.02 },
      { outBase: 'pepe_escudo', srcPattern: /^card_pepe_shield_\d+\.jpg$/, padFrac: 0.05 },
    ],
  },
  {
    hero: 'chispo',
    mode: 'chispo_match',
    masterSrcExactPath: path.join(ROOT, 'public/assets/skills/rezo_divino_tier_1.png'),
    skills: [
      { outBase: 'chispo_martillo', srcPattern: /^card_chispo_hammer_\d+\.jpg$/, padFrac: 0.08 },
      { outBase: 'chispo_rezo', srcExactPath: path.join(ROOT, 'public/assets/skills/rezo_divino_tier_1.png'), isMasterDirect: true },
      { outBase: 'chispo_smite', srcExactPath: path.join(ROOT, 'public/assets/skills/smite_celestial.png'), padFrac: 0.06 },
    ],
  },
  {
    hero: 'giovani',
    mode: 'copper',
    masterSrcPattern: /^card_giovani_trick_\d+\.jpg$/,
    skills: [
      { outBase: 'giovani_plumas', srcPattern: /^card_giovani_feathers_\d+\.jpg$/, padFrac: 0.06 },
      { outBase: 'giovani_treta', srcPattern: /^card_giovani_trick_\d+\.jpg$/, isMasterDirect: true },
      { outBase: 'giovani_tomo', srcPattern: /^card_giovani_tome_\d+\.jpg$/, padFrac: 0.08 },
    ],
  },
  {
    hero: 'prometeo',
    mode: 'copper',
    masterSrcPattern: /^card_prometeo_greensword_\d+\.jpg$/,
    skills: [
      { outBase: 'prometeo_fire_bolt', srcPattern: /^card_prometeo_firebolt_\d+\.jpg$/, padFrac: 0.08 },
      { outBase: 'prometeo_espada_verde', srcPattern: /^card_prometeo_greensword_\d+\.jpg$/, isMasterDirect: true },
      { outBase: 'prometeo_bola_fuego', srcPattern: /^card_prometeo_fireball_\d+\.jpg$/, padFrac: 0.08 },
    ],
  },
  {
    hero: 'kairon',
    mode: 'copper',
    masterSrcPattern: /^card_kairon_doubleshot_\d+\.jpg$/,
    skills: [
      { outBase: 'kairon_tiro_doble', srcPattern: /^card_kairon_doubleshot_\d+\.jpg$/, isMasterDirect: true },
      { outBase: 'kairon_disparo_dual', srcPattern: /^card_kairon_dualpistol_\d+\.jpg$/, padFrac: 0.07 },
      { outBase: 'kairon_espadazo_largo', srcPattern: /^card_kairon_longsword_\d+\.jpg$/, padFrac: 0.08 },
    ],
  },
  {
    hero: 'ragnavaldr',
    mode: 'copper',
    masterSrcPattern: /^card_ragnavaldr_icedagger_\d+\.jpg$/,
    skills: [
      { outBase: 'ragnavaldr_doble_lanza', srcPattern: /^card_ragnavaldr_spears_\d+\.jpg$/, padFrac: 0.07 },
      { outBase: 'ragnavaldr_furia', srcPattern: /^card_ragnavaldr_fury_\d+\.jpg$/, padFrac: 0.06 },
      { outBase: 'ragnavaldr_cuchillo_hielo', srcPattern: /^card_ragnavaldr_icedagger_\d+\.jpg$/, isMasterDirect: true },
    ],
  },
  {
    hero: 'smurph',
    mode: 'copper',
    masterSrcPattern: /^card_smurph_fireballs_\d+\.jpg$/,
    skills: [
      { outBase: 'smurph_aterrizaje_heroico', srcPattern: /^card_smurph_landing_\d+\.jpg$/, padFrac: 0.09 },
      { outBase: 'smurph_bolas_fuego', srcPattern: /^card_smurph_fireballs_\d+\.jpg$/, isMasterDirect: true },
      { outBase: 'smurph_aliento_rayo', srcPattern: /^card_smurph_lightning_\d+\.jpg$/, padFrac: 0.08 },
    ],
  },
  {
    hero: 'roxanne',
    mode: 'copper',
    masterSrcPattern: /^card_roxanne_lyre_\d+\.jpg$/,
    skills: [
      { outBase: 'roxanne_inspiracion', srcPattern: /^card_roxanne_lyre_\d+\.jpg$/, isMasterDirect: true },
      { outBase: 'roxanne_velada', srcPattern: /^card_roxanne_charm_\d+\.jpg$/, padFrac: 0.09 },
      { outBase: 'roxanne_estocada', srcPattern: /^card_roxanne_rapier_\d+\.jpg$/, padFrac: 0.08 },
    ],
  },
  {
    hero: 'barled',
    mode: 'copper',
    masterSrcPattern: /^card_barled_heal_\d+\.jpg$/,
    skills: [
      { outBase: 'barled_inspiracion', srcPattern: /^card_barled_oud_\d+\.jpg$/, padFrac: 0.08 },
      { outBase: 'barled_fuego_feerico', srcPattern: /^card_barled_faerie_\d+\.jpg$/, padFrac: 0.09 },
      { outBase: 'barled_curacion', srcPattern: /^card_barled_heal_\d+\.jpg$/, isMasterDirect: true },
    ],
  },
  {
    hero: 'raxxar',
    mode: 'copper',
    masterSrcPattern: /^card_raxxar_sword_\d+\.jpg$/,
    skills: [
      { outBase: 'raxxar_espada', srcPattern: /^card_raxxar_sword_\d+\.jpg$/, isMasterDirect: true },
      { outBase: 'raxxar_escudo', srcPattern: /^card_raxxar_shield_\d+\.jpg$/, padFrac: 0.09 },
      { outBase: 'raxxar_lanza', srcPattern: /^card_raxxar_spear_\d+\.jpg$/, padFrac: 0.07 },
    ],
  },
];

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  ];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function resolveSrcPath(pattern?: RegExp, exactPath?: string): string {
  if (exactPath) {
    if (!fs.existsSync(exactPath)) throw new Error(`Missing file: ${exactPath}`);
    return exactPath;
  }
  if (pattern) {
    const files = fs.readdirSync(SRC_GEN_DIR).filter((f) => pattern.test(f)).sort();
    if (files.length === 0) throw new Error(`No generated file matching ${pattern}`);
    return path.join(SRC_GEN_DIR, files[files.length - 1]);
  }
  throw new Error('No source specified');
}

function loadNormalizedPng(srcPath: string, tag: string): PNG {
  const tmpPng = path.join(TMP_DIR, `${tag}_norm.png`);
  execFileSync('convert', [
    srcPath,
    '-resize', '600x900',
    '-gravity', 'center',
    '-background', 'none',
    '-extent', '600x900',
    tmpPng,
  ]);
  return PNG.sync.read(fs.readFileSync(tmpPng));
}

/**
 * Topological Cavity Mask:
 * 1) Removes outer white background to alpha=0.
 * 2) Finds the exact contiguous pure-black interior cavity (#000000 canvas inside the frame)
 *    using a BFS restricted strictly to dark black pixels inside the inner 76% bounds.
 * 3) Marks ALL enclosed holes inside that black cavity (the centered floating drawing!)
 *    without ever touching any outer frame ornament, moon, jewel, dragon head, or ruby.
 */
function buildTopologicalWindowMask(
  png: PNG,
  clearNeonGreen = false
): { mask: Uint8Array; minX: number; maxX: number; minY: number; maxY: number } {
  const { width: w, height: h, data } = png;

  // Step 1: Identify outside white background
  const bg = new Uint8Array(w * h);
  const bgQ = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;
  const isBgWhite = (idx: number) => {
    const off = idx * 4;
    if (data[off + 3] < 25) return true;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    return min >= 220 && max - min <= 28;
  };
  const pushBg = (idx: number) => {
    if (bg[idx]) return;
    bg[idx] = 1;
    bgQ[qt++] = idx;
  };
  for (let x = 0; x < w; x++) {
    if (isBgWhite(x)) pushBg(x);
    if (isBgWhite((h - 1) * w + x)) pushBg((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    if (isBgWhite(y * w)) pushBg(y * w);
    if (isBgWhite(y * w + (w - 1))) pushBg(y * w + (w - 1));
  }
  while (qh < qt) {
    const idx = bgQ[qh++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0 && isBgWhite(idx - 1)) pushBg(idx - 1);
    if (x + 1 < w && isBgWhite(idx + 1)) pushBg(idx + 1);
    if (y > 0 && isBgWhite(idx - w)) pushBg(idx - w);
    if (y + 1 < h && isBgWhite(idx + w)) pushBg(idx + w);
  }

  // Step 2: Find the contiguous pure-black interior cavity (#000000 canvas + faint dark inner aura <= 35)
  // Morphological opening (erode by 4px -> keep central components -> dilate by 5px clipped to pureBlack)
  // eliminates thin dark ink outlines (<= 8px) so BFS never leaks into gems, moons, snouts, or corners.
  const bxLo = Math.floor(w * 0.13);
  const bxHi = Math.floor(w * 0.87);
  const byLo = Math.floor(h * 0.10);
  const byHi = Math.floor(h * 0.90);

  const pureBlack = new Uint8Array(w * h);
  for (let y = byLo; y <= byHi; y++) {
    for (let x = bxLo; x <= bxHi; x++) {
      const idx = y * w + x;
      if (bg[idx]) continue;
      const off = idx * 4;
      if (data[off + 3] >= 220 && data[off] <= 26 && data[off + 1] <= 26 && data[off + 2] <= 26) {
        pureBlack[idx] = 1;
      }
    }
  }

  // Erode pureBlack by 4px so dark ink outlines (up to 8px wide) vanish
  const eroded = erodeMask(pureBlack, w, h, 4);

  // Keep ONLY large connected components of eroded (>= 500px) that touch the central interior box
  // [0.25w..0.75w, 0.22h..0.78h] — bezel creases & wing/armor shadows can never reach 500px there!
  const visitedE = new Uint8Array(w * h);
  const coreCav = new Uint8Array(w * h);
  const cavQ = new Int32Array(w * h);
  for (let y = Math.floor(h * 0.22); y <= Math.floor(h * 0.78); y += 2) {
    for (let x = Math.floor(w * 0.25); x <= Math.floor(w * 0.75); x += 2) {
      const seed = y * w + x;
      if (!eroded[seed] || visitedE[seed]) continue;
      let qh2 = 0, qt2 = 0;
      visitedE[seed] = 1;
      cavQ[qt2++] = seed;
      while (qh2 < qt2) {
        const idx = cavQ[qh2++];
        const cx = idx % w;
        const cy = (idx - cx) / w;
        if (cx > bxLo && eroded[idx - 1] && !visitedE[idx - 1]) {
          visitedE[idx - 1] = 1;
          cavQ[qt2++] = idx - 1;
        }
        if (cx < bxHi && eroded[idx + 1] && !visitedE[idx + 1]) {
          visitedE[idx + 1] = 1;
          cavQ[qt2++] = idx + 1;
        }
        if (cy > byLo && eroded[idx - w] && !visitedE[idx - w]) {
          visitedE[idx - w] = 1;
          cavQ[qt2++] = idx - w;
        }
        if (cy < byHi && eroded[idx + w] && !visitedE[idx + w]) {
          visitedE[idx + w] = 1;
          cavQ[qt2++] = idx + w;
        }
      }
      if (qt2 >= 500) {
        for (let k = 0; k < qt2; k++) coreCav[cavQ[k]] = 1;
      }
    }
  }

  // Dilate coreCav back by 5px strictly constrained to pureBlack
  let blackCav = new Uint8Array(coreCav);
  for (let step = 0; step < 5; step++) {
    const next = new Uint8Array(blackCav);
    for (let y = byLo; y <= byHi; y++) {
      for (let x = bxLo; x <= bxHi; x++) {
        const idx = y * w + x;
        if (!pureBlack[idx] || blackCav[idx]) continue;
        if (blackCav[idx - 1] || blackCav[idx + 1] || blackCav[idx - w] || blackCav[idx + w]) {
          next[idx] = 1;
        }
      }
    }
    blackCav = next;
  }

  // Seal C-shaped / U-shaped / diagonal gaps where an icon touches one side of the inner border:
  // 1) In the ornament-free mid-band [0.25h..0.77h], span horizontally between leftmost & rightmost blackCav
  // 2) Across all columns, span vertically between topmost & bottommost blackCav (never touches top/bottom ornaments!)
  const sealedCav = new Uint8Array(blackCav);
  const midYLo = Math.floor(h * 0.27);
  const midYHi = Math.floor(h * 0.75);
  for (let y = midYLo; y <= midYHi; y++) {
    let lx = w, rx = -1;
    for (let x = bxLo; x <= bxHi; x++) {
      if (blackCav[y * w + x]) {
        if (x < lx) lx = x;
        if (x > rx) rx = x;
      }
    }
    if (lx < w * 0.45 && rx > w * 0.55) {
      for (let x = lx; x <= rx; x++) sealedCav[y * w + x] = 1;
    }
  }
  for (let x = bxLo; x <= bxHi; x++) {
    let ty = h, by = -1;
    for (let y = byLo; y <= byHi; y++) {
      if (blackCav[y * w + x]) {
        if (y < ty) ty = y;
        if (y > by) by = y;
      }
    }
    if (ty < h * 0.45 && by > h * 0.55) {
      for (let y = ty; y <= by; y++) sealedCav[y * w + x] = 1;
    }
  }

  // Step 3: Exterior flood-fill from image border over pixels NOT in sealedCav.
  // Any pixel enclosed inside sealedCav IS the inner window + centered drawing!
  const reachableFromOutside = new Uint8Array(w * h);
  qh = 0;
  qt = 0;
  const pushOut = (idx: number) => {
    if (reachableFromOutside[idx] || sealedCav[idx]) return;
    reachableFromOutside[idx] = 1;
    cavQ[qt++] = idx;
  };
  for (let x = 0; x < w; x++) {
    pushOut(x);
    pushOut((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    pushOut(y * w);
    pushOut(y * w + (w - 1));
  }
  while (qh < qt) {
    const idx = cavQ[qh++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) pushOut(idx - 1);
    if (x + 1 < w) pushOut(idx + 1);
    if (y > 0) pushOut(idx - w);
    if (y + 1 < h) pushOut(idx + w);
  }

  const mask = new Uint8Array(w * h);
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!reachableFromOutside[idx]) {
        mask[idx] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Special safety for Magordito (chains touch inner black border at top-left/right corners)
  if (clearNeonGreen) {
    for (let y = Math.floor(h * 0.11); y <= Math.floor(h * 0.89); y++) {
      for (let x = Math.floor(w * 0.14); x <= Math.floor(w * 0.86); x++) {
        const idx = y * w + x;
        const off = idx * 4;
        if (data[off + 3] < 200) continue;
        const r = data[off], g = data[off + 1], b = data[off + 2];
        if (g > r + 12 && g > b + 12 && g > 24) {
          mask[idx] = 1;
        }
      }
    }
  }

  // Clear isolated trapped white pockets strictly outside mask (between wing/horn loops)
  const visited = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (bg[i] || visited[i] || mask[i]) continue;
    const off = i * 4;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    if (Math.min(r, g, b) < 238 || Math.max(r, g, b) - Math.min(r, g, b) > 18) continue;
    const island: number[] = [i];
    visited[i] = 1;
    let p = 0;
    let touchesInner = false;
    while (p < island.length) {
      const cur = island[p++];
      const cx = cur % w;
      const cy = (cur - cx) / w;
      const nbrs = [
        cx > 0 ? cur - 1 : -1,
        cx + 1 < w ? cur + 1 : -1,
        cy > 0 ? cur - w : -1,
        cy + 1 < h ? cur + w : -1,
      ];
      for (const n of nbrs) {
        if (n < 0 || visited[n] || bg[n]) continue;
        if (mask[n]) {
          touchesInner = true;
          continue;
        }
        const noff = n * 4;
        const nr = data[noff], ng = data[noff + 1], nb = data[noff + 2];
        if (Math.min(nr, ng, nb) >= 232 && Math.max(nr, ng, nb) - Math.min(nr, ng, nb) <= 22) {
          visited[n] = 1;
          island.push(n);
        }
      }
    }
    if (!touchesInner && island.length >= 6 && island.length < w * h * 0.08) {
      for (const idx of island) bg[idx] = 1;
    }
  }

  // Apply transparent alpha & feather white edge halo
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) {
      const off = i * 4;
      data[off] = 0;
      data[off + 1] = 0;
      data[off + 2] = 0;
      data[off + 3] = 0;
    }
  }
  const toFeather: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (bg[idx] || mask[idx]) continue;
      if (bg[idx - 1] || bg[idx + 1] || bg[idx - w] || bg[idx + w]) {
        toFeather.push(idx);
      }
    }
  }
  for (const idx of toFeather) {
    const off = idx * 4;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    const lum = (r + g + b) / 3;
    if (max - min <= 35 && lum > 155) {
      const factor = clamp((235 - lum) / 80, 0, 1);
      data[off + 3] = Math.round(data[off + 3] * factor);
      data[off] = Math.round(r * 0.45);
      data[off + 1] = Math.round(g * 0.45);
      data[off + 2] = Math.round(b * 0.45);
    }
  }

  return { mask, minX, maxX, minY, maxY };
}

function erodeMask(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  let cur = new Uint8Array(mask);
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(cur);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (!cur[idx]) continue;
        if (!cur[idx - 1] || !cur[idx + 1] || !cur[idx - w] || !cur[idx + w]) {
          next[idx] = 0;
        }
      }
    }
    cur = next;
  }
  return cur;
}

function compositeSkillIntoMasterFrame(
  masterPng: PNG,
  masterMask: Uint8Array,
  masterBounds: { minX: number; maxX: number; minY: number; maxY: number },
  skillPng: PNG,
  skillMask: Uint8Array,
  padFrac: number,
  clearNeonGreen = false
): PNG {
  const { width: w, height: h } = masterPng;
  const out = new PNG({ width: w, height: h });
  masterPng.data.copy(out.data);

  // Clear interior black canvas on master to spotless #000000 (and wipe all neon-green remnants without erosion)
  const safeMasterInner = erodeMask(masterMask, w, h, 1);
  for (let i = 0; i < w * h; i++) {
    const off = i * 4;
    const isGreenStub =
      clearNeonGreen &&
      masterMask[i] &&
      out.data[off + 1] > out.data[off] + 8 &&
      out.data[off + 1] > out.data[off + 2] + 8;
    if (safeMasterInner[i] || isGreenStub) {
      out.data[off] = 0;
      out.data[off + 1] = 0;
      out.data[off + 2] = 0;
      out.data[off + 3] = 255;
    }
  }

  // Tightly bound glowing icon inside the source's inner window (8px inset avoids catching frame borders)
  const safeSkillInner = erodeMask(skillMask, w, h, 8);
  let sx0 = w, sx1 = 0, sy0 = h, sy1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!safeSkillInner[idx]) continue;
      const off = idx * 4;
      const maxC = Math.max(skillPng.data[off], skillPng.data[off + 1], skillPng.data[off + 2]);
      if (maxC > 22 && skillPng.data[off + 3] > 180) {
        if (x < sx0) sx0 = x;
        if (x > sx1) sx1 = x;
        if (y < sy0) sy0 = y;
        if (y > sy1) sy1 = y;
      }
    }
  }

  if (sx1 <= sx0 || sy1 <= sy0) return out;

  const winW = masterBounds.maxX - masterBounds.minX + 1;
  const winH = masterBounds.maxY - masterBounds.minY + 1;
  const availW = winW * (1 - padFrac * 2);
  const availH = winH * (1 - padFrac * 2);
  const srcW = sx1 - sx0 + 1;
  const srcH = sy1 - sy0 + 1;
  const scale = Math.min(availW / srcW, availH / srcH);
  const dstW = srcW * scale;
  const dstH = srcH * scale;
  const dstCx = (masterBounds.minX + masterBounds.maxX) / 2;
  const dstCy = (masterBounds.minY + masterBounds.maxY) / 2;
  const dx0 = dstCx - dstW / 2;
  const dy0 = dstCy - dstH / 2;

  for (let y = Math.max(0, Math.floor(dy0)); y <= Math.min(h - 1, Math.ceil(dy0 + dstH)); y++) {
    for (let x = Math.max(0, Math.floor(dx0)); x <= Math.min(w - 1, Math.ceil(dx0 + dstW)); x++) {
      const idx = y * w + x;
      if (!safeMasterInner[idx]) continue;

      const fx = sx0 + ((x - dx0) / dstW) * (srcW - 1);
      const fy = sy0 + ((y - dy0) / dstH) * (srcH - 1);
      if (fx < sx0 || fx > sx1 || fy < sy0 || fy > sy1) continue;

      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = fx - ix;
      const ty = fy - iy;
      const ix1 = Math.min(w - 1, ix + 1);
      const iy1 = Math.min(h - 1, iy + 1);

      const sample = (px: number, py: number, c: number) => {
        const pidx = py * w + px;
        if (!safeSkillInner[pidx]) return 0;
        return skillPng.data[pidx * 4 + c];
      };

      const r =
        sample(ix, iy, 0) * (1 - tx) * (1 - ty) +
        sample(ix1, iy, 0) * tx * (1 - ty) +
        sample(ix, iy1, 0) * (1 - tx) * ty +
        sample(ix1, iy1, 0) * tx * ty;
      const g =
        sample(ix, iy, 1) * (1 - tx) * (1 - ty) +
        sample(ix1, iy, 1) * tx * (1 - ty) +
        sample(ix, iy1, 1) * (1 - tx) * ty +
        sample(ix1, iy1, 1) * tx * ty;
      const b =
        sample(ix, iy, 2) * (1 - tx) * (1 - ty) +
        sample(ix1, iy, 2) * tx * (1 - ty) +
        sample(ix, iy1, 2) * (1 - tx) * ty +
        sample(ix1, iy1, 2) * tx * ty;

      const edgeDist = Math.min(fx - sx0, sx1 - fx, fy - sy0, sy1 - fy);
      const edgeFade = clamp(edgeDist / 6, 0, 1);
      const off = idx * 4;
      out.data[off] = Math.round(clamp(r * edgeFade, 0, 255));
      out.data[off + 1] = Math.round(clamp(g * edgeFade, 0, 255));
      out.data[off + 2] = Math.round(clamp(b * edgeFade, 0, 255));
      out.data[off + 3] = 255;
    }
  }
  return out;
}

function makeTierVariant(base: PNG, innerMask: Uint8Array, mode: FrameMode, tier: 1 | 2 | 3): PNG {
  const out = new PNG({ width: base.width, height: base.height });
  base.data.copy(out.data);
  if (tier === 1 && mode !== 'pepe_stone') return out;

  const { width: w, height: h, data } = out;
  for (let i = 0; i < w * h; i++) {
    if (innerMask[i]) continue;
    const off = i * 4;
    if (data[off + 3] === 0) continue;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    const [hue, s, l] = rgbToHsl(r, g, b);

    if (l < 0.14) continue;

    if (mode === 'copper' || mode === 'chispo_match') {
      const isPaleIvory = l > 0.67 && s < 0.48;
      // Chispo rezo_divino_tier_1 has brassy-yellow trim (~hue 46..54); copper has ~10..48
      const hueMax = mode === 'chispo_match' ? 62 : 48;
      const isTrim = hue >= 10 && hue <= hueMax && s >= 0.34 && !isPaleIvory;
      if (!isTrim) continue;

      if (tier === 2) {
        const [nr, ng, nb] = hslToRgb(215, 0.06, clamp(l * 1.15 + 0.08, 0.22, 0.88));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      } else if (tier === 3) {
        const [nr, ng, nb] = hslToRgb(45, clamp(s * 1.06, 0.78, 0.96), clamp(l * 1.1 + 0.03, 0.22, 0.78));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      }
    } else if (mode === 'edacorn') {
      if (s < 0.25) continue;
      if (tier === 2) {
        const [nr, ng, nb] = hslToRgb(210, 0.03, clamp(l * 1.08 + 0.04, 0.2, 0.84));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      } else if (tier === 3) {
        const [nr, ng, nb] = hslToRgb(38, 0.9, clamp(l * 1.12 + 0.02, 0.18, 0.74));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      }
    } else if (mode === 'pepe_stone') {
      if (tier === 1) {
        const [nr, ng, nb] = hslToRgb(28, 0.38, clamp(l * 1.05, 0.16, 0.74));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      } else if (tier === 2) {
        const [nr, ng, nb] = hslToRgb(212, 0.08, clamp(l * 1.38 + 0.07, 0.24, 0.86));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      } else if (tier === 3) {
        const [nr, ng, nb] = hslToRgb(43, 0.78, clamp(l * 1.32 + 0.05, 0.22, 0.78));
        data[off] = nr;
        data[off + 1] = ng;
        data[off + 2] = nb;
      }
    }
  }
  return out;
}

for (const deck of HERO_DECKS) {
  const masterSrc = resolveSrcPath(deck.masterSrcPattern, deck.masterSrcExactPath);
  const masterPng = loadNormalizedPng(masterSrc, `${deck.hero}_master`);
  const masterWin = buildTopologicalWindowMask(masterPng, deck.clearMasterNeonGreen);

  for (const sk of deck.skills) {
    let composed: PNG;
    if (sk.isMasterDirect) {
      composed = masterPng;
    } else {
      const skSrc = resolveSrcPath(sk.srcPattern, sk.srcExactPath);
      const skPng = loadNormalizedPng(skSrc, sk.outBase);
      const skWin = sk.useMasterMaskForSource
        ? { mask: erodeMask(masterWin.mask, masterPng.width, masterPng.height, 4) }
        : buildTopologicalWindowMask(skPng, false);
      composed = compositeSkillIntoMasterFrame(
        masterPng,
        masterWin.mask,
        masterWin,
        skPng,
        skWin.mask,
        sk.padFrac ?? 0.06,
        Boolean(deck.clearMasterNeonGreen)
      );
    }

    for (const tier of [1, 2, 3] as const) {
      const variant = makeTierVariant(composed, masterWin.mask, deck.mode, tier);
      const outPath = path.join(OUT_SKILLS_DIR, `${sk.outBase}_tier_${tier}.png`);
      fs.writeFileSync(outPath, PNG.sync.write(variant));
    }
    console.log(`Unified ${deck.hero} -> ${sk.outBase} (tiers 1-3)`);
  }
}
