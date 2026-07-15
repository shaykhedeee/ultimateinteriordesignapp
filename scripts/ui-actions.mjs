import { chromium } from 'playwright';
const BASE = process.env.APP_URL || 'http://127.0.0.1:8787';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404') && !m.text().includes('422')) errs.push('CONSOLE: ' + m.text().slice(0,160)); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button:has-text("Command Center")', { timeout: 15000 });
  await page.waitForTimeout(2500);

  const clickNav = async (label) => {
    await page.locator(`nav button:has-text("${label}")`).first().click({ force: true });
    await sleep(1500);
  };

  const results = [];
  const tryAction = async (name, fn) => {
    try { await fn(); results.push(`✓ ${name}`); }
    catch (e) { results.push(`✗ ${name} — ${e.message.split('\n')[0].slice(0,100)}`); }
  };

  // Plan Intelligence: Run AI Auto-Detect
  await clickNav('Plan Intelligence');
  await tryAction('Plan Intelligence → Run AI Auto-Detect', async () => {
    const b = page.getByText('Run AI Auto-Detect', { exact: false }).first();
    await b.click({ timeout: 6000, force: true });
    await sleep(3000);
  });

  // Vastu Studio: Analyze
  await clickNav('Vastu Studio');
  await tryAction('Vastu Studio → Analyze', async () => {
    const b = page.getByText('Analyze', { exact: false }).first();
    await b.click({ timeout: 6000, force: true });
    await sleep(2500);
  });

  // Render Studio: Generate a render (base render from scene graph)
  await clickNav('Render Studio');
  await tryAction('Render Studio → Generate base render', async () => {
    const b = page.getByText('Generate', { exact: false }).first();
    await b.click({ timeout: 6000, force: true });
    await sleep(4000);
  });

  // Cutlist: Run nesting
  await clickNav('Cutlist & Nesting');
  await tryAction('Cutlist → Run CNC Nesting', async () => {
    const b = page.getByText('Run Nesting', { exact: false }).first();
    await b.click({ timeout: 6000, force: true });
    await sleep(3000);
  });

  // Materials Catalog: open a laminate
  await clickNav('Materials Catalog');
  await tryAction('Materials Catalog → click first laminate', async () => {
    const card = page.locator('div.cursor-pointer, button').filter({ hasText: 'Laminate' }).first();
    await card.click({ timeout: 6000, force: true });
    await sleep(1500);
  });

  // Commerce: build an estimate (if button exists)
  await clickNav('Commerce & Quotes');
  await tryAction('Commerce → Generate Quote', async () => {
    const b = page.getByText('Generate Quote', { exact: false }).or(page.getByText('Build Estimate', { exact: false })).first();
    await b.click({ timeout: 6000, force: true });
    await sleep(2500);
  });

  console.log(results.join('\n'));
  console.log(`\nRUNTIME ERRORS (excl 404/422): ${errs.length}`);
  [...new Set(errs)].slice(0,10).forEach(e => console.log(' -', e));
  await browser.close();
  process.exit(errs.length === 0 ? 0 : 1);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
