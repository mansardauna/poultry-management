const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    console.log('Launching browser at:', edgePath);
    
    const browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('Navigating to http://localhost:3000/documentation/index.html...');
    await page.goto('http://localhost:3000/documentation/index.html', { waitUntil: 'networkidle0' });

    const targetPath1 = path.join(__dirname, '..', 'public', 'docs', 'documentation_category_index.png');
    const targetPath2 = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\9ad925d5-b8e3-4edf-a4fa-10347a434789\\documentation_category_index.png';

    console.log('Capturing screenshot to:', targetPath1);
    await page.screenshot({ path: targetPath1, fullPage: true });

    console.log('Copying screenshot to artifacts directory:', targetPath2);
    fs.copyFileSync(targetPath1, targetPath2);

    await browser.close();
    console.log('Screenshot captured successfully!');
  } catch (err) {
    console.error('Error capturing screenshot:', err);
    process.exit(1);
  }
})();
