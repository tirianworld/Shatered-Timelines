import fs from 'fs';
import path from 'path';

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'tirianworld';
const REPO = 'Shatered-Timelines';
const HEAD_SHA = 'bab5265b11d20c122cf80335ec9d05d78c824e1e';
const BASE_SHA = '73f99e3d257b7eca0f633bb12d43ae59c6db31de';

async function main() {
  console.log(`Fetching compare between ${BASE_SHA.slice(0, 7)} and ${HEAD_SHA.slice(0, 7)}...`);
  const compareRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/compare/${BASE_SHA}...${HEAD_SHA}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SyncScript',
      },
    }
  );

  if (!compareRes.ok) {
    throw new Error(`Failed to compare commits: ${compareRes.statusText}`);
  }

  const compareData = await compareRes.json();
  const files = compareData.files || [];
  console.log(`Found ${files.length} changed files across ${compareData.total_commits} commits.`);

  let downloadedCount = 0;
  let deletedCount = 0;
  let errorCount = 0;

  for (const f of files) {
    const filename = f.filename;
    const localPath = path.resolve(filename);

    if (f.status === 'removed') {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        deletedCount++;
        console.log(`[DELETED] ${filename}`);
      }
      continue;
    }

    try {
      const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${HEAD_SHA}/${encodeURI(filename)}`;
      const fileRes = await fetch(rawUrl, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'User-Agent': 'SyncScript',
        },
      });

      if (!fileRes.ok) {
        console.error(`Failed to fetch ${filename}: HTTP ${fileRes.status}`);
        errorCount++;
        continue;
      }

      const buffer = Buffer.from(await fileRes.arrayBuffer());
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, buffer);
      downloadedCount++;
      console.log(`[SYNCED] ${filename} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${filename}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\nSync finished: ${downloadedCount} synced, ${deletedCount} deleted, ${errorCount} errors.`);
}

main().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
