import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(png|jpg|jpeg|webp)$/i.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

const dishDirs = [
  'public/assets/items/salmon_dishes',
  'public/assets/items/crab_dishes',
  'public/assets/items/trout_dishes',
  'public/assets/items/chicken_dishes',
];

const allFiles = [];
dishDirs.forEach(d => {
  allFiles.push(...walk(d));
});

// Also include specific food dishes in public/assets/items
const rootItems = fs.readdirSync('public/assets/items');
rootItems.forEach(f => {
  const full = path.join('public/assets/items', f);
  if (
    fs.statSync(full).isFile() &&
    (f.startsWith('food_') || f === 'shushi.png' || f === 'Comida.png')
  ) {
    allFiles.push(full);
  }
});

const hashMap = new Map();
allFiles.forEach(f => {
  const buf = fs.readFileSync(f);
  const h = crypto.createHash('md5').update(buf).digest('hex');
  if (!hashMap.has(h)) hashMap.set(h, []);
  hashMap.get(h).push(f);
});

const mapping = {};
let deletedCount = 0;
const deletedFilesList = [];

hashMap.forEach((list, hash) => {
  if (list.length > 1) {
    // Sort to choose the canonical file
    list.sort((a, b) => {
      const baseA = path.basename(a);
      const baseB = path.basename(b);
      // Prefer standard food_ names if present
      if (baseA.startsWith('food_') && !baseB.startsWith('food_')) return -1;
      if (!baseA.startsWith('food_') && baseB.startsWith('food_')) return 1;
      // Prefer shorter filename
      return a.length - b.length || a.localeCompare(b);
    });

    const canonical = list[0];
    const canonicalWebPath = canonical.replace(/^public/, '');

    for (let i = 1; i < list.length; i++) {
      const dup = list[i];
      const dupWebPath = dup.replace(/^public/, '');
      mapping[dupWebPath] = canonicalWebPath;

      // Delete duplicate file
      fs.unlinkSync(dup);
      deletedCount++;
      deletedFilesList.push({ duplicate: dupWebPath, canonical: canonicalWebPath });
    }
  }
});

fs.writeFileSync(
  'src/data/dishDuplicatesMap.json',
  JSON.stringify(mapping, null, 2),
  'utf8'
);

console.log(`Deduplication complete!`);
console.log(`Unique dish groups processed: ${hashMap.size}`);
console.log(`Duplicate files deleted: ${deletedCount}`);
console.log(`Saved mapping to src/data/dishDuplicatesMap.json`);
