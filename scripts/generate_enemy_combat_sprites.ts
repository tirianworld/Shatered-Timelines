import fs from 'fs';
// @ts-expect-error pngjs lacks type definitions in local config
import { PNG } from 'pngjs';

interface EnemySpriteSpec {
  id: string;
  cleanFile: string;
  attackFile: string;
  hurtFile: string;
  theme: 'steel' | 'spear' | 'crossbow' | 'heavy' | 'dagger' | 'rock' | 'club' | 'shaman' | 'red_spider' | 'blue_spider' | 'zancudo' | 'titan' | 'queen' | 'medusa' | 'beast';
}

const ENEMIES: EnemySpriteSpec[] = [
  {
    id: 'guardia_lanza',
    cleanFile: 'public/assets/combat/guardia_lanza_clean.png',
    attackFile: 'public/assets/combat/guardia_lanza_attack.png',
    hurtFile: 'public/assets/combat/guardia_lanza_hurt.png',
    theme: 'spear',
  },
  {
    id: 'guardia_espada',
    cleanFile: 'public/assets/combat/guardia_espada_clean.png',
    attackFile: 'public/assets/combat/guardia_espada_attack.png',
    hurtFile: 'public/assets/combat/guardia_espada_hurt.png',
    theme: 'steel',
  },
  {
    id: 'guardia_ballesta',
    cleanFile: 'public/assets/combat/guardia_ballesta_clean.png',
    attackFile: 'public/assets/combat/guardia_ballesta_attack.png',
    hurtFile: 'public/assets/combat/guardia_ballesta_hurt.png',
    theme: 'crossbow',
  },
  {
    id: 'guardia_pesado',
    cleanFile: 'public/assets/combat/guardia_pesado_clean.png',
    attackFile: 'public/assets/combat/guardia_pesado_attack.png',
    hurtFile: 'public/assets/combat/guardia_pesado_hurt.png',
    theme: 'heavy',
  },
  {
    id: 'goblin_daga',
    cleanFile: 'public/assets/combat/goblin_daga_clean.png',
    attackFile: 'public/assets/combat/goblin_daga_attack.png',
    hurtFile: 'public/assets/combat/goblin_daga_hurt.png',
    theme: 'dagger',
  },
  {
    id: 'goblin_honda',
    cleanFile: 'public/assets/combat/goblin_honda_clean.png',
    attackFile: 'public/assets/combat/goblin_honda_attack.png',
    hurtFile: 'public/assets/combat/goblin_honda_hurt.png',
    theme: 'rock',
  },
  {
    id: 'goblin_garrote',
    cleanFile: 'public/assets/combat/goblin_garrote_clean.png',
    attackFile: 'public/assets/combat/goblin_garrote_attack.png',
    hurtFile: 'public/assets/combat/goblin_garrote_hurt.png',
    theme: 'club',
  },
  {
    id: 'goblin_chaman',
    cleanFile: 'public/assets/combat/goblin_chaman_clean.png',
    attackFile: 'public/assets/combat/goblin_chaman_attack.png',
    hurtFile: 'public/assets/combat/goblin_chaman_hurt.png',
    theme: 'shaman',
  },
  {
    id: 'araknoide_rojo',
    cleanFile: 'public/assets/combat/araknoide_rojo_clean.png',
    attackFile: 'public/assets/combat/araknoide_rojo_attack.png',
    hurtFile: 'public/assets/combat/araknoide_rojo_hurt.png',
    theme: 'red_spider',
  },
  {
    id: 'araknoide_azul',
    cleanFile: 'public/assets/combat/araknoide_azul_clean.png',
    attackFile: 'public/assets/combat/araknoide_azul_attack.png',
    hurtFile: 'public/assets/combat/araknoide_azul_hurt.png',
    theme: 'blue_spider',
  },
  {
    id: 'semiboss_zancudo',
    cleanFile: 'public/assets/combat/semiboss_zancudo_clean.png',
    attackFile: 'public/assets/combat/semiboss_zancudo_attack.png',
    hurtFile: 'public/assets/combat/semiboss_zancudo_hurt.png',
    theme: 'zancudo',
  },
  {
    id: 'semiboss_melenudo',
    cleanFile: 'public/assets/combat/semiboss_melenudo_clean.png',
    attackFile: 'public/assets/combat/semiboss_melenudo_attack.png',
    hurtFile: 'public/assets/combat/semiboss_melenudo_hurt.png',
    theme: 'titan',
  },
  {
    id: 'araknoide',
    cleanFile: 'public/assets/aistudio/araknoide_clean.png',
    attackFile: 'public/assets/combat/araknoide_attack.png',
    hurtFile: 'public/assets/combat/araknoide_hurt.png',
    theme: 'queen',
  },
  {
    id: 'medusa',
    cleanFile: 'public/assets/combat/medusa_clean.png',
    attackFile: 'public/assets/combat/medusa_attack.png',
    hurtFile: 'public/assets/combat/medusa_hurt.png',
    theme: 'medusa',
  },
  {
    id: 'bestia_jaula',
    cleanFile: 'public/assets/combat/bestia_jaula_clean.png',
    attackFile: 'public/assets/combat/bestia_jaula_attack.png',
    hurtFile: 'public/assets/combat/bestia_jaula_hurt.png',
    theme: 'beast',
  },
];

// Helper to blend a color with alpha over a pixel
function blendPixel(png: PNG, x: number, y: number, r: number, g: number, b: number, a: number) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || ix >= png.width || iy < 0 || iy >= png.height) return;
  const idx = (iy * png.width + ix) << 2;
  const srcA = a / 255;
  const dstA = png.data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;

  png.data[idx] = Math.round((r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
  png.data[idx + 1] = Math.round((g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
  png.data[idx + 2] = Math.round((b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
  png.data[idx + 3] = Math.round(outA * 255);
}

// Draw a filled glowing circle
function drawGlowCircle(png: PNG, cx: number, cy: number, radius: number, r: number, g: number, b: number, maxAlpha = 220) {
  const minX = Math.max(0, Math.floor(cx - radius * 1.5));
  const maxX = Math.min(png.width - 1, Math.ceil(cx + radius * 1.5));
  const minY = Math.max(0, Math.floor(cy - radius * 1.5));
  const maxY = Math.min(png.height - 1, Math.ceil(cy + radius * 1.5));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= radius) {
        const falloff = 1 - (dist / radius);
        const a = Math.round(maxAlpha * Math.pow(falloff, 1.2));
        blendPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

// Draw an anti-aliased thick line
function drawThickLine(png: PNG, x0: number, y0: number, x1: number, y1: number, thickness: number, r: number, g: number, b: number, a = 255) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const steps = Math.ceil(len * 2);
  const halfThick = thickness / 2;

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    for (let ox = -halfThick; ox <= halfThick; ox += 0.8) {
      for (let oy = -halfThick; oy <= halfThick; oy += 0.8) {
        const dist = Math.hypot(ox, oy);
        if (dist <= halfThick) {
          const falloff = 1 - (dist / halfThick) * 0.4;
          blendPixel(png, px + ox, py + oy, r, g, b, Math.round(a * falloff));
        }
      }
    }
  }
}

// Draw a cartoon slash arc (curved crescent blade swing)
function drawSlashArc(
  png: PNG,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  thickness: number,
  colorCore: [number, number, number],
  colorGlow: [number, number, number]
) {
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    const px = cx + Math.cos(angle) * rx;
    const py = cy + Math.sin(angle) * ry;

    // Taper ends
    const taper = Math.sin(t * Math.PI);
    const currThick = thickness * taper;

    // Glow
    drawGlowCircle(png, px, py, currThick * 1.8, colorGlow[0], colorGlow[1], colorGlow[2], 140 * taper);
    // Core
    drawGlowCircle(png, px, py, currThick * 0.65, colorCore[0], colorCore[1], colorCore[2], 255 * taper);
  }
}

// Find non-transparent bounds and center of mass
function analyzeSprite(png: PNG) {
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
  let sumX = 0, sumY = 0, count = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) << 2;
      const a = png.data[idx + 3];
      if (a > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  const charH = maxY - minY + 1;
  const charW = maxX - minX + 1;
  const chestY = minY + Math.round(charH * 0.42);
  const headY = minY + Math.round(charH * 0.18);
  const centerX = count ? Math.round(sumX / count) : Math.round((minX + maxX) / 2);

  return { minX, maxX, minY, maxY, charW, charH, centerX, chestY, headY };
}

// GENERATE ATTACK SPRITE (Preserves exact silhouette, adds striking weapon/claws energy & battle eye flare)
function generateAttackSprite(cleanPath: string, outPath: string, spec: EnemySpriteSpec) {
  const cleanBuf = fs.readFileSync(cleanPath);
  const cleanPng = PNG.sync.read(cleanBuf);
  const attackPng = new PNG({ width: cleanPng.width, height: cleanPng.height });
  cleanPng.data.copy(attackPng.data);

  const { minX, maxX, minY, maxY, charW, charH, centerX, chestY, headY } = analyzeSprite(cleanPng);

  // Attack visual orientation: Enemies are on the right side of battlefield facing left towards hero
  // Strike direction is towards left (decreasing x)
  const frontX = minX + Math.round(charW * 0.15); // front-left leading edge of enemy
  const midFrontX = minX + Math.round(charW * 0.35);

  let coreColor: [number, number, number] = [255, 255, 255];
  let glowColor: [number, number, number] = [239, 68, 68]; // crimson
  let slashRadiusX = charW * 0.45;
  let slashRadiusY = charH * 0.32;
  let arcCy = chestY + charH * 0.05;

  if (spec.theme === 'blue_spider') {
    glowColor = [56, 189, 248]; // icy cyan
  } else if (spec.theme === 'medusa') {
    glowColor = [34, 211, 238]; // plasma cyan
    slashRadiusY = charH * 0.4;
  } else if (spec.theme === 'zancudo' || spec.theme === 'shaman') {
    glowColor = [168, 85, 247]; // shadow purple
  } else if (spec.theme === 'heavy' || spec.theme === 'steel') {
    glowColor = [245, 158, 11]; // amber spark
  } else if (spec.theme === 'crossbow') {
    glowColor = [251, 146, 60]; // fiery bolt orange
  }

  // 1. Draw dynamic cartoon striking slash wave extending towards the player (facing left)
  drawSlashArc(
    attackPng,
    midFrontX + slashRadiusX * 0.2,
    arcCy,
    slashRadiusX,
    slashRadiusY,
    Math.PI * 0.65,
    Math.PI * 1.35,
    Math.max(14, Math.round(charW * 0.045)),
    coreColor,
    glowColor
  );

  // Second smaller cutting echo arc
  drawSlashArc(
    attackPng,
    midFrontX + slashRadiusX * 0.1,
    arcCy + charH * 0.08,
    slashRadiusX * 0.75,
    slashRadiusY * 0.7,
    Math.PI * 0.75,
    Math.PI * 1.3,
    Math.max(8, Math.round(charW * 0.025)),
    [255, 255, 255],
    glowColor
  );

  // 2. Kinetic speed lines rushing forward towards the left edge
  for (let i = -2; i <= 2; i++) {
    const ly = arcCy + i * (charH * 0.07);
    const lx0 = frontX + (charW * 0.25);
    const lx1 = Math.max(0, frontX - (charW * 0.22) - Math.abs(i) * 15);
    drawThickLine(attackPng, lx0, ly, lx1, ly, Math.max(3, charW * 0.008), 255, 255, 255, 220);
    drawThickLine(attackPng, lx0 + 10, ly, lx1 - 10, ly, Math.max(6, charW * 0.016), glowColor[0], glowColor[1], glowColor[2], 140);
  }

  // 3. Battle eye glare (menacing glowing horizontal eye flare)
  const eyeX = minX + Math.round(charW * 0.35);
  const eyeY = headY;
  // Eye flash streak
  drawThickLine(attackPng, eyeX + charW * 0.1, eyeY, eyeX - charW * 0.18, eyeY, Math.max(3, charW * 0.01), 255, 255, 255, 255);
  drawGlowCircle(attackPng, eyeX - charW * 0.05, eyeY, charW * 0.06, glowColor[0], glowColor[1], glowColor[2], 230);
  drawGlowCircle(attackPng, eyeX - charW * 0.05, eyeY, charW * 0.025, 255, 255, 255, 255);

  fs.writeFileSync(outPath, PNG.sync.write(attackPng));
  console.log(`Generated attack sprite: ${outPath} (${attackPng.width}x${attackPng.height})`);
}

// GENERATE HURT SPRITE (Preserves exact silhouette, adds visceral cartoon impact burst, cross slashes & blood/spark droplets)
function generateHurtSprite(cleanPath: string, outPath: string, spec: EnemySpriteSpec) {
  const cleanBuf = fs.readFileSync(cleanPath);
  const cleanPng = PNG.sync.read(cleanBuf);
  const hurtPng = new PNG({ width: cleanPng.width, height: cleanPng.height });
  cleanPng.data.copy(hurtPng.data);

  const { minX, maxX, minY, maxY, charW, charH, centerX, chestY } = analyzeSprite(cleanPng);

  // Subtle impact damage redness on the character's torso without shifting or deforming outline
  for (let y = minY + Math.round(charH * 0.25); y < minY + Math.round(charH * 0.65); y++) {
    for (let x = minX + Math.round(charW * 0.15); x < minX + Math.round(charW * 0.85); x++) {
      const idx = (y * hurtPng.width + x) << 2;
      const a = hurtPng.data[idx + 3];
      if (a > 50) {
        const dist = Math.hypot(x - centerX, y - chestY);
        const radius = charW * 0.35;
        if (dist < radius) {
          const factor = (1 - dist / radius) * 0.35;
          hurtPng.data[idx] = Math.min(255, hurtPng.data[idx] + Math.round(180 * factor));
          hurtPng.data[idx + 1] = Math.max(0, hurtPng.data[idx + 1] - Math.round(60 * factor));
          hurtPng.data[idx + 2] = Math.max(0, hurtPng.data[idx + 2] - Math.round(60 * factor));
        }
      }
    }
  }

  // 1. Dual explosive diagonal cross-slashes (damage impact marks across torso)
  const slashLen = charW * 0.32;
  const slashThick = Math.max(7, Math.round(charW * 0.022));

  // Slash 1: Top-left to bottom-right
  const s1x0 = centerX - slashLen * 0.9;
  const s1y0 = chestY - slashLen * 0.75;
  const s1x1 = centerX + slashLen * 0.9;
  const s1y1 = chestY + slashLen * 0.75;

  // Slash 2: Top-right to bottom-left
  const s2x0 = centerX + slashLen * 0.8;
  const s2y0 = chestY - slashLen * 0.8;
  const s2x1 = centerX - slashLen * 0.8;
  const s2y1 = chestY + slashLen * 0.8;

  // Outer red glow
  drawThickLine(hurtPng, s1x0, s1y0, s1x1, s1y1, slashThick * 2.2, 239, 68, 68, 180);
  drawThickLine(hurtPng, s2x0, s2y0, s2x1, s2y1, slashThick * 2.2, 239, 68, 68, 180);

  // Black incision rim
  drawThickLine(hurtPng, s1x0, s1y0, s1x1, s1y1, slashThick * 1.2, 30, 10, 10, 255);
  drawThickLine(hurtPng, s2x0, s2y0, s2x1, s2y1, slashThick * 1.2, 30, 10, 10, 255);

  // Pure white/yellow blazing hot cut core
  drawThickLine(hurtPng, s1x0, s1y0, s1x1, s1y1, slashThick * 0.5, 254, 240, 138, 255);
  drawThickLine(hurtPng, s2x0, s2y0, s2x1, s2y1, slashThick * 0.5, 254, 240, 138, 255);

  // 2. Central radiant 4-point impact star flash
  const starRadius = charW * 0.22;
  // Radiant spikes
  drawThickLine(hurtPng, centerX - starRadius, chestY, centerX + starRadius, chestY, Math.max(5, charW * 0.015), 255, 255, 255, 255);
  drawThickLine(hurtPng, centerX, chestY - starRadius, centerX, chestY + starRadius, Math.max(5, charW * 0.015), 255, 255, 255, 255);
  // Diagonal mini spikes
  const diagR = starRadius * 0.65;
  drawThickLine(hurtPng, centerX - diagR, chestY - diagR, centerX + diagR, chestY + diagR, Math.max(3, charW * 0.01), 254, 202, 202, 220);
  drawThickLine(hurtPng, centerX + diagR, chestY - diagR, centerX - diagR, chestY + diagR, Math.max(3, charW * 0.01), 254, 202, 202, 220);

  // Yellow-gold aura and white core
  drawGlowCircle(hurtPng, centerX, chestY, charW * 0.16, 250, 204, 21, 200);
  drawGlowCircle(hurtPng, centerX, chestY, charW * 0.08, 255, 255, 255, 255);

  // 3. Dynamic spray of 16 cartoon blood / spark droplets bursting outward
  const dropletAngles = [
    -0.2, 0.3, 0.8, 1.4, 1.9, 2.5, 3.1, 3.6, 4.2, 4.8, 5.4, 5.9,
    -0.6, 1.1, 2.8, 4.5
  ];
  const ichorColor: [number, number, number] = spec.theme === 'blue_spider' ? [56, 189, 248] : [220, 38, 38];

  for (let i = 0; i < dropletAngles.length; i++) {
    const angle = dropletAngles[i];
    const dist = charW * (0.16 + (i % 4) * 0.07);
    const dropX = centerX + Math.cos(angle) * dist;
    const dropY = chestY + Math.sin(angle) * (dist * 0.78);
    const dropSize = Math.max(3, Math.round(charW * (0.012 + (i % 3) * 0.006)));

    // Outer dark outline
    drawGlowCircle(hurtPng, dropX, dropY, dropSize * 1.4, 50, 10, 10, 230);
    // Colored droplet body
    drawGlowCircle(hurtPng, dropX, dropY, dropSize, ichorColor[0], ichorColor[1], ichorColor[2], 255);
    // Specular shine
    drawGlowCircle(hurtPng, dropX - dropSize * 0.25, dropY - dropSize * 0.25, dropSize * 0.45, 255, 255, 255, 240);
  }

  fs.writeFileSync(outPath, PNG.sync.write(hurtPng));
  console.log(`Generated hurt sprite: ${outPath} (${hurtPng.width}x${hurtPng.height})`);
}

// MAIN EXECUTION FOR ALL 15 ENEMIES
console.log('--- Generating High-Fidelity Enemy Combat Sprites (Zero Rotation, Zero Distortion) ---');
for (const enemy of ENEMIES) {
  if (!fs.existsSync(enemy.cleanFile)) {
    console.warn(`Clean sprite missing for ${enemy.id}: ${enemy.cleanFile}`);
    continue;
  }
  generateAttackSprite(enemy.cleanFile, enemy.attackFile, enemy);
  generateHurtSprite(enemy.cleanFile, enemy.hurtFile, enemy);
}
console.log('--- All Enemy Combat Sprites Successfully Generated ---');
