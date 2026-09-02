const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const VERCEL_BASE = 'https://poultry-management-theta.vercel.app';

async function captureSetup() {
  console.log('Launching Edge browser for setup screenshot...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const docsDir = path.join(__dirname, '..', 'public', 'docs');
  const publicDir = path.join(__dirname, '..', 'public');
  const artifactsDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\9ad925d5-b8e3-4edf-a4fa-10347a434789';

  console.log(`Navigating to ${VERCEL_BASE}/setup...`);
  await page.goto(`${VERCEL_BASE}/setup`, { waitUntil: 'networkidle0', timeout: 45000 });
  await new Promise(r => setTimeout(r, 2000));

  const p1 = path.join(docsDir, 'screen_setup.png');
  const p2 = path.join(publicDir, 'screen_setup.png');
  const p3 = path.join(artifactsDir, 'screen_setup.png');

  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  fs.copyFileSync(p1, p3);

  console.log('Saved setup screenshot to screen_setup.png!');
  await browser.close();
}

captureSetup();
