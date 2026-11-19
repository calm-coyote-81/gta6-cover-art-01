// Takes the entry's screenshots headlessly: serves app/ with serve.ts, opens
// each scene from shots.json in headless Chrome, waits for
// window.__shotReady, and saves a JPEG into screenshots/. If a shot comes
// out over the 256 KiB cap it is retaken at lower JPEG quality until it fits.
// Run from the repository root: node take-shots.mjs
import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

// playwright-core lives in the shared shot-tools install, not in this repo.
const require = createRequire('/home/hatch/workspace/makefun/shot-tools/package.json');
const { chromium } = require('playwright-core');

const repo = dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));
const port = 8094;
const CAP = 262144;

const server = spawn('node', ['serve.ts', '--port', String(port)], { cwd: repo, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));

const browser = await chromium.launch({
  executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function takeOne(page, shot) {
  for (const quality of [82, 70, 58, 45]) {
    await page.goto(`http://localhost:${port}/${shot.query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
    const out = join(repo, 'screenshots', shot.name);
    await page.screenshot({ path: out, type: 'jpeg', quality });
    const size = statSync(out).size;
    console.log(`${shot.name}: ${size} bytes at quality ${quality}${size > CAP ? ' — over cap, retrying' : ''}`);
    if (size <= CAP) return size;
  }
  throw new Error(`${shot.name} still over the 256 KiB cap`);
}

try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
    page.on('pageerror', (err) => console.log(`PAGE ERROR ${shot.name}:`, String(err)));
    page.on('console', (msg) => { if (msg.type() === 'error') console.log(`CONSOLE ${shot.name}:`, msg.text()); });
    await takeOne(page, shot);
    await page.close();
  }
  console.log('all shots done');
} finally {
  await browser.close();
  server.kill();
}
