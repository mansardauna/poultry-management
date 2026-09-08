const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const VERCEL_BASE = 'https://poultry-management-theta.vercel.app';

const ROUTES = [
  { url: `${VERCEL_BASE}/login`, name: 'screen_login.png' },
  { url: `${VERCEL_BASE}/signup`, name: 'screen_signup.png' },
  { url: `${VERCEL_BASE}/dashboard`, name: 'screen_dashboard.png' },
  { url: `${VERCEL_BASE}/dashboard/eggs`, name: 'screen_eggs.png' },
  { url: `${VERCEL_BASE}/dashboard/chickens`, name: 'screen_chickens.png' },
  { url: `${VERCEL_BASE}/dashboard/housing`, name: 'screen_housing.png' },
  { url: `${VERCEL_BASE}/dashboard/feed`, name: 'screen_feed.png' },
  { url: `${VERCEL_BASE}/dashboard/health`, name: 'screen_health.png' },
  { url: `${VERCEL_BASE}/dashboard/sales`, name: 'screen_sales.png' },
  { url: `${VERCEL_BASE}/dashboard/finance`, name: 'screen_finance.png' },
  { url: `${VERCEL_BASE}/dashboard/staff`, name: 'screen_staff.png' },
  { url: `${VERCEL_BASE}/dashboard/enterprise`, name: 'screen_enterprise.png' },
  { url: `${VERCEL_BASE}/dashboard/admin`, name: 'screen_admin.png' }
];

async function captureVercelScreenshots() {
  console.log('Launching Edge browser for Vercel live app...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const docsDir = path.join(__dirname, '..', 'public', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const artifactsDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\9ad925d5-b8e3-4edf-a4fa-10347a434789';

  for (const item of ROUTES) {
    try {
      console.log(`Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise(r => setTimeout(r, 2000));

      const outPath1 = path.join(docsDir, item.name);
      await page.screenshot({ path: outPath1, fullPage: false });
      console.log(`Saved live Vercel screenshot: ${outPath1}`);

      const outPath2 = path.join(artifactsDir, item.name);
      fs.copyFileSync(outPath1, outPath2);
    } catch (err) {
      console.error(`Error capturing ${item.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('All Vercel live screenshots captured successfully!');
}

captureVercelScreenshots();
