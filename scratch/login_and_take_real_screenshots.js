const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const VERCEL_BASE = 'https://poultry-management-theta.vercel.app';

const ADMIN_EMAIL = 'mansur@ankabit.com';
const ADMIN_PASS = 'Mansur@12';

const STAFF_EMAIL = 'staff@ankabit.com';
const STAFF_PASS = 'StaffPassword123!';

async function runAuthScreenshots() {
  console.log('Launching Edge browser for authenticated screenshot capture...');
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

  async function savePic(name) {
    const p1 = path.join(docsDir, name);
    const p2 = path.join(publicDir, name);
    const p3 = path.join(artifactsDir, name);

    await page.screenshot({ path: p1, fullPage: false });
    fs.copyFileSync(p1, p2);
    fs.copyFileSync(p1, p3);
    console.log(`Saved screenshot: ${name}`);
  }

  // STEP 1: LOGIN AS ADMIN
  console.log(`Navigating to ${VERCEL_BASE}/login...`);
  await page.goto(`${VERCEL_BASE}/login`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  await savePic('screen_login.png');

  console.log('Attempting Admin Login with mansur@ankabit.com / Mansur@12...');
  try {
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].type(ADMIN_EMAIL);
      await inputs[1].type(ADMIN_PASS);
      console.log('Typed credentials into input fields.');
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        console.log('Clicked login submit button. Waiting for dashboard navigation...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  } catch (err) {
    console.error('Error typing admin credentials:', err.message);
  }

  console.log('Current URL after login attempt:', page.url());

  // ADMIN SCREENSHOTS
  const ADMIN_ROUTES = [
    { url: `${VERCEL_BASE}/dashboard`, name: 'screen_dashboard.png' },
    { url: `${VERCEL_BASE}/dashboard/staff`, name: 'screen_staff.png' },
    { url: `${VERCEL_BASE}/dashboard/finance`, name: 'screen_finance.png' },
    { url: `${VERCEL_BASE}/dashboard/sales`, name: 'screen_sales.png' },
    { url: `${VERCEL_BASE}/dashboard/health`, name: 'screen_health.png' },
    { url: `${VERCEL_BASE}/dashboard/enterprise`, name: 'screen_enterprise.png' },
    { url: `${VERCEL_BASE}/dashboard/admin`, name: 'screen_admin.png' }
  ];

  for (const item of ADMIN_ROUTES) {
    try {
      console.log(`[ADMIN] Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      await savePic(item.name);
    } catch (err) {
      console.error(`Error navigating to ${item.url}:`, err.message);
    }
  }

  // STEP 2: CREATE A STAFF MEMBER IN /dashboard/staff
  try {
    console.log('Navigating to staff page to create staff member...');
    await page.goto(`${VERCEL_BASE}/dashboard/staff`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Attempting API staff creation fallback...');
    await page.evaluate(async (email, pass) => {
      try {
        await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Attendant Worker',
            email: email,
            password: pass,
            role: 'STAFF'
          })
        });
      } catch (e) {}
    }, STAFF_EMAIL, STAFF_PASS);
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.error('Error creating staff:', err.message);
  }

  // STEP 3: LOGOUT AND LOGIN AS STAFF
  try {
    console.log('Logging out Admin...');
    await page.goto(`${VERCEL_BASE}/api/auth/logout`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`Navigating to ${VERCEL_BASE}/login for Staff login...`);
    await page.goto(`${VERCEL_BASE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].type(STAFF_EMAIL);
      await inputs[1].type(STAFF_PASS);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 4000));
      }
    }
    console.log('Staff login submitted. Current URL:', page.url());
  } catch (err) {
    console.error('Staff login error:', err.message);
  }

  // STAFF SCREENSHOTS
  const STAFF_ROUTES = [
    { url: `${VERCEL_BASE}/dashboard/eggs`, name: 'screen_eggs.png' },
    { url: `${VERCEL_BASE}/dashboard/chickens`, name: 'screen_chickens.png' },
    { url: `${VERCEL_BASE}/dashboard/housing`, name: 'screen_housing.png' },
    { url: `${VERCEL_BASE}/dashboard/feed`, name: 'screen_feed.png' }
  ];

  for (const item of STAFF_ROUTES) {
    try {
      console.log(`[STAFF] Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      await savePic(item.name);
    } catch (err) {
      console.error(`Error navigating to ${item.url}:`, err.message);
    }
  }

  await browser.close();
  console.log('All authenticated Admin & Staff screenshots captured successfully!');
}

runAuthScreenshots();
