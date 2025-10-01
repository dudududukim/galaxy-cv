// Capture screenshots of the deployed GitHub Pages site using Playwright
// Saves images into assets/screenshots so README can render them

const { chromium } = require('playwright');

async function waitForOk(page, url, retries = 10) {
  for (let i = 0; i < retries; i++) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (res && res.ok()) return true;
    await page.waitForTimeout(3000);
  }
  return false;
}

(async () => {
  const base = process.env.SITE_URL || 'https://dudududukim.github.io/galaxy-cv/';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const ok = await waitForOk(page, base);
  if (!ok) {
    console.error('Failed to load site for screenshots:', base);
    await browser.close();
    process.exit(1);
  }

  // Hero (top)
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'assets/screenshots/hero.png' });

  // Work section
  await page.evaluate(() => {
    const el = document.querySelector('#work');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'assets/screenshots/work.png' });

  await browser.close();
})();


