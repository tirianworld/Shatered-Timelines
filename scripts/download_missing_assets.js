import fs from 'fs';
import path from 'path';

const GITHUB_BASE = 'https://raw.githubusercontent.com/tirianworld/Shatered-Timelines/main-nuevo/public';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

async function fetchWithRetry(url, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.arrayBuffer();
      }
    } catch {
      // retry
    }
  }
  return null;
}

async function main() {
  const files = walk('src').concat(walk('export_data'));
  const imgRegex = /[\x22\x27\x60](\/(?:assets|items)[^\x22\x27\x60]+\.(?:png|jpg|jpeg|webp|webm|mp4|svg|gif))[\x22\x27\x60]/g;
  const referenced = new Set();

  files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      referenced.add(match[1]);
    }
  });

  const missing = [];
  referenced.forEach(p => {
    let cleanP = p.startsWith('/') ? p.slice(1) : p;
    let localPath = path.join('public', cleanP);
    if (cleanP.startsWith('items/')) {
      localPath = path.join('public', 'assets', cleanP);
    }
    if (!fs.existsSync(localPath)) {
      missing.push({
        urlPath: cleanP.startsWith('items/') ? `assets/${cleanP}` : cleanP,
        localPath
      });
    }
  });

  console.log(`Found ${missing.length} missing assets to download.`);

  let downloaded = 0;
  let failed = 0;
  const batchSize = 15;

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async item => {
        const fullUrl = `${GITHUB_BASE}/${encodeURI(item.urlPath)}`;
        const buffer = await fetchWithRetry(fullUrl);
        if (buffer) {
          fs.mkdirSync(path.dirname(item.localPath), { recursive: true });
          fs.writeFileSync(item.localPath, Buffer.from(buffer));
          downloaded++;
        } else {
          failed++;
        }
      })
    );
    if ((i + batchSize) % 60 === 0 || i + batchSize >= missing.length) {
      console.log(`Progress: ${downloaded} downloaded, ${failed} failed (${i + batch.length}/${missing.length})`);
    }
  }

  console.log(`Finished! Downloaded: ${downloaded}, Failed: ${failed}`);
}

main();
