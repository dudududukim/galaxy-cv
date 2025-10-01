const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function main() {
  const outDir = path.join(__dirname, '..', 'assets', 'screenshots');
  await ensureDir(outDir);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'hero.png') });

  await page.evaluate(() => { const el = document.querySelector('#work'); el && el.scrollIntoView({ behavior: 'instant', block: 'start' }); });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, 'work.png') });

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });


