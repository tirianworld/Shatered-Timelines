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

const TASKS: Task[] = [
  {
    id: 'idle',
    sourceJpg: 'src/assets/images/edacorn_nowings_idle_1794400072145.jpg',
    outputPng: 'public/assets/combat/edacorn_idle.png',
  },
  {
    id: 'hurt',
    sourceJpg: 'src/assets/images/edacorn_nowings_hurt_1794400088035.jpg',
    outputPng: 'public/assets/combat/edacorn_hurt.png',
  },
  {
    id: 'attack_furtivo',
    sourceJpg: 'src/assets/images/edacorn_nowings_attack_1794400102991.jpg',
    outputPng: 'public/assets/combat/edacorn_attack.png',
    additionalOutputs: ['public/assets/combat/edacorn_cast_furtivo.png'],
  },
  {
    id: 'contraataque',
    sourceJpg: 'src/assets/images/edacorn_nowings_counter_1794400118928.jpg',
    outputPng: 'public/assets/combat/edacorn_cast_contraataque.png',
  },
  {
    id: 'sigilo',
    sourceJpg: 'src/assets/images/edacorn_nowings_stealth_1794400139127.jpg',
    outputPng: 'public/assets/combat/edacorn_cast_sigilo.png',
  },
];

async function processAll() {
  for (const task of TASKS) {
    console.log(`Processing Edacorn ${task.id}...`);
    const tempRawPng = `/tmp/raw_edacorn_${task.id}.png`;
    execSync(`convert "${task.sourceJpg}" "${tempRawPng}"`);

    const fileBuf = fs.readFileSync(tempRawPng);
    const png = PNG.sync.read(fileBuf);
    const { width, height, data } = png;

    // Flood fill background removal from perimeter
    const isBg = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    const isWhite = (x: number, y: number): boolean => {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Pure or near pure white
      return r > 235 && g > 235 && b > 235 && Math.abs(r - g) < 20 && Math.abs(r - b) < 20;
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
          // Check if adjacent to background for smooth alpha edge
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

    // Crop to content bounding box
    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const pad = 12;
    minX = Math.max(0, minX - pad);
    maxX = Math.min(width - 1, maxX + pad);
    minY = Math.max(0, minY - pad);
    maxY = Math.min(height - 1, maxY + pad);

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;
    const croppedPng = new PNG({ width: croppedWidth, height: croppedHeight });

    for (let y = 0; y < croppedHeight; y++) {
      for (let x = 0; x < croppedWidth; x++) {
        const srcIdx = ((minY + y) * width + (minX + x)) * 4;
        const dstIdx = (y * croppedWidth + x) * 4;
        croppedPng.data[dstIdx] = data[srcIdx];
        croppedPng.data[dstIdx + 1] = data[srcIdx + 1];
        croppedPng.data[dstIdx + 2] = data[srcIdx + 2];
        croppedPng.data[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    const outBuf = PNG.sync.write(croppedPng);
    fs.writeFileSync(task.outputPng, outBuf);
    console.log(`Saved transparent sprite to ${task.outputPng} (${croppedWidth}x${croppedHeight})`);

    if (task.additionalOutputs) {
      for (const addPath of task.additionalOutputs) {
        fs.writeFileSync(addPath, outBuf);
        console.log(`Saved additional transparent sprite to ${addPath}`);
      }
    }

    try {
      fs.unlinkSync(tempRawPng);
    } catch {}
  }
  console.log('All Edacorn sprites processed successfully!');
}

processAll().catch(console.error);
