import fs from 'fs';
import { execSync } from 'child_process';
// @ts-expect-error pngjs lacks types in tsconfig
import { PNG } from 'pngjs';

interface Task {
  id: string;
  sourceJpg: string;
  outputPng: string;
  additionalOutputs?: string[];
}

const SPRITE_TASKS: Task[] = [
  {
    id: 'idle',
    sourceJpg: 'src/assets/images/smurph_combat_idle_1794481180687.jpg',
    outputPng: 'public/assets/combat/smurph_idle.png',
  },
  {
    id: 'landing',
    sourceJpg: 'src/assets/images/smurph_hero_landing_1794481194693.jpg',
    outputPng: 'public/assets/combat/smurph_landing.png',
    additionalOutputs: ['public/assets/combat/smurph_attack.png'],
  },
  {
    id: 'lightning',
    sourceJpg: 'src/assets/images/smurph_breath_lightning_1794481209537.jpg',
    outputPng: 'public/assets/combat/smurph_lightning.png',
  },
  {
    id: 'flight',
    sourceJpg: 'src/assets/images/smurph_flight_pose_1794481224034.jpg',
    outputPng: 'public/assets/combat/smurph_flight.png',
  },
  {
    id: 'cast',
    sourceJpg: 'src/assets/images/smurph_fireball_pose_1794481237396.jpg',
    outputPng: 'public/assets/combat/smurph_cast.png',
  },
  {
    id: 'hurt',
    sourceJpg: 'src/assets/images/smurph_hurt_pose_1794481250839.jpg',
    outputPng: 'public/assets/combat/smurph_hurt.png',
  },
];

async function processSprites() {
  for (const task of SPRITE_TASKS) {
    console.log(`Processing Smurph Draco sprite ${task.id}...`);
    const tempRawPng = `/tmp/raw_smurph_${task.id}.png`;
    execSync(`convert "${task.sourceJpg}" "${tempRawPng}"`);

    const fileBuf = fs.readFileSync(tempRawPng);
    const png = PNG.sync.read(fileBuf);
    const { width, height, data } = png;

    const isBg = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    const isWhite = (x: number, y: number): boolean => {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return r > 232 && g > 232 && b > 232 && Math.abs(r - g) < 25 && Math.abs(r - b) < 25;
    };

    // Seed borders
    for (let x = 0; x < width; x++) {
      queue.push(x, 0);
      queue.push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      queue.push(0, y);
      queue.push(width - 1, y);
    }

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const cPos = cy * width + cx;
      if (visited[cPos]) continue;
      visited[cPos] = 1;

      if (!isWhite(cx, cy)) continue;
      isBg[cPos] = 1;

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nPos = ny * width + nx;
          if (!visited[nPos] && isWhite(nx, ny)) {
            queue.push(nx, ny);
          }
        }
      }
    }

    // Apply alpha to background pixels and anti-alias boundary
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = y * width + x;
        const idx = pos * 4;
        if (isBg[pos]) {
          data[idx + 3] = 0;
        } else {
          let bgNeighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (isBg[ny * width + nx]) bgNeighbors++;
              }
            }
          }
          if (bgNeighbors > 0) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            if (r > 215 && g > 215 && b > 215) {
              data[idx + 3] = Math.max(0, 255 - bgNeighbors * 40);
            }
          }
        }
      }
    }

    // Crop bounding box with 10px margin
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const margin = 10;
    minX = Math.max(0, minX - margin);
    minY = Math.max(0, minY - margin);
    maxX = Math.min(width - 1, maxX + margin);
    maxY = Math.min(height - 1, maxY + margin);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const cropped = new PNG({ width: cropW, height: cropH });
    for (let cy = 0; cy < cropH; cy++) {
      const sy = minY + cy;
      for (let cx = 0; cx < cropW; cx++) {
        const sx = minX + cx;
        const sidx = (sy * width + sx) * 4;
        const didx = (cy * cropW + cx) * 4;
        cropped.data[didx] = data[sidx];
        cropped.data[didx + 1] = data[sidx + 1];
        cropped.data[didx + 2] = data[sidx + 2];
        cropped.data[didx + 3] = data[sidx + 3];
      }
    }

    const tempProcessed = `/tmp/processed_${task.id}.png`;
    fs.writeFileSync(tempProcessed, PNG.sync.write(cropped));

    // Resize nicely to high-res standard sprite height 900
    execSync(`convert "${tempProcessed}" -resize x900 "${task.outputPng}"`);
    console.log(`Saved ${task.outputPng}`);

    if (task.additionalOutputs) {
      for (const extra of task.additionalOutputs) {
        fs.copyFileSync(task.outputPng, extra);
        console.log(`Copied to ${extra}`);
      }
    }
  }

  // Also convert skill card icons
  console.log('Processing skill icons...');
  execSync(`convert "src/assets/images/smurph_icon_landing_1794481266648.jpg" -resize 512x512 "public/assets/skills/smurph_aterrizaje_heroico.png"`);
  execSync(`convert "src/assets/images/smurph_icon_fireballs_1794481284168.jpg" -resize 512x512 "public/assets/skills/smurph_bolas_fuego.png"`);
  execSync(`convert "src/assets/images/smurph_icon_lightning_1794481298480.jpg" -resize 512x512 "public/assets/skills/smurph_aliento_rayo.png"`);
  console.log('Skill card icons processed successfully!');
}

processSprites().catch((err) => {
  console.error('Error processing sprites:', err);
  process.exit(1);
});
