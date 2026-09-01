const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ROUTES = [
  { url: 'http://localhost:3000/login', name: 'screen_login.png' },
  { url: 'http://localhost:3000/signup', name: 'screen_signup.png' },
  { url: 'http://localhost:3000/dashboard', name: 'screen_dashboard.png' },
  { url: 'http://localhost:3000/dashboard/eggs', name: 'screen_eggs.png' },
  { url: 'http://localhost:3000/dashboard/chickens', name: 'screen_chickens.png' },
  { url: 'http://localhost:3000/dashboard/housing', name: 'screen_housing.png' },
  { url: 'http://localhost:3000/dashboard/feed', name: 'screen_feed.png' },
  { url: 'http://localhost:3000/dashboard/health', name: 'screen_health.png' },
  { url: 'http://localhost:3000/dashboard/sales', name: 'screen_sales.png' },
  { url: 'http://localhost:3000/dashboard/finance', name: 'screen_finance.png' },
  { url: 'http://localhost:3000/dashboard/staff', name: 'screen_staff.png' },
  { url: 'http://localhost:3000/dashboard/enterprise', name: 'screen_enterprise.png' },
  { url: 'http://localhost:3000/dashboard/admin', name: 'screen_admin.png' }
];

async function captureAll() {
  console.log('Launching Edge browser...');
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
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));

      const outPath1 = path.join(docsDir, item.name);
      await page.screenshot({ path: outPath1, fullPage: false });
      console.log(`Saved screenshot: ${outPath1}`);

      const outPath2 = path.join(artifactsDir, item.name);
      fs.copyFileSync(outPath1, outPath2);
    } catch (err) {
      console.error(`Error capturing ${item.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureAll();
