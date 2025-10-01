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

  await page.evaluate(() => {
    const el = document.querySelector('#work');
    el && el.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (window.ScrollTrigger && window.gsap) {
      window.ScrollTrigger.refresh();
      window.ScrollTrigger.update();
    }
  });
  // Wait until project items are fully revealed (opacity ~ 1 and transform settled)
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('.project-list .project');
    if (!items.length) return false;
    for (const el of items) {
      const cs = getComputedStyle(el);
      const op = parseFloat(cs.opacity);
      if (op < 0.99) return false;
    }
    return true;
  }, { timeout: 6000 });
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({ path: path.join(outDir, 'work.png') });

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });


