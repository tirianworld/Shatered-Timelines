import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const distPath = path.join(__dirname, 'dist');
const distIndexPath = path.join(distPath, 'index.html');

// If production build is missing, build it synchronously
if (!fs.existsSync(distIndexPath)) {
  console.log('Building application for production...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    console.error('Build execution failed:', err);
  }
}

// Serve production static assets from dist
app.use(express.static(distPath));

// Fallback static files from public
app.use(express.static(path.join(__dirname, 'public')));

// SPA router fallback: serve index.html for all HTML navigation requests
app.get('*', (req, res) => {
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server successfully listening on 0.0.0.0:${PORT}`);
});
