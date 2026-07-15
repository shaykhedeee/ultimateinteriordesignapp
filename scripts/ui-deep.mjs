import { chromium } from 'playwright';
const BASE = process.env.APP_URL || 'http://127.0.0.1:8787';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0,200)); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button:has-text("Command Center")', { timeout: 15000 });
  await page.waitForTimeout(1500);

  for (const label of ['Pipeline Studio', 'Commerce & Quotes']) {
    console.log(`\n--- ${label} ---`);
    try {
      const btn = page.locator(`nav button:has-text("${label}")`).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 8000, force: true });
      await page.waitForTimeout(2500);
      const mainText = (await page.locator('main').innerText().catch(() => '')).slice(0, 300);
      console.log('MAIN TEXT (first 300):', JSON.stringify(mainText));
    } catch (e) {
      console.log('CLICK/RENDER FAIL:', e.message.split('\n')[0].slice(0,160));
    }
  }
  console.log('\nERRORS:', errs.length);
  errs.slice(0, 10).forEach(e => console.log(' -', e));
  await browser.close();
})();
