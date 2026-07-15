// Headless UI smoke test: click through every nav screen, capture console + page errors.
import { chromium } from 'playwright';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8787';

// Screen labels as they appear in the sidebar nav (button text).
const SCREENS = [
  'Command Center', 'Client Board', 'Project Pipeline', 'Client Intake',
  'Plan Intelligence', 'Editable 3D Scene', 'Vastu Studio', 'Floor Plan Enhancer',
  'Drawings & Elevations', 'Render Studio', 'Design Library', 'Background Jobs',
  'Materials Catalog', 'Cutlist & Nesting', 'Commerce & Quotes', 'Project Timeline',
  'Presentation Pack', 'Pipeline Studio', 'Deliverables Vault', 'Brand Studio', 'Backup & Restore'
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push({ where: 'console', text: m.text() }); });
  page.on('pageerror', e => errors.push({ where: 'pageerror', text: e.message }));

  const results = [];
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('nav button:has-text("Command Center")', { timeout: 15000 });
  await page.waitForTimeout(1500);

  for (const label of SCREENS) {
    let status = 'OK', detail = '';
    try {
      const btn = page.locator(`nav button:has-text("${label}")`).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 8000, force: true });
      await page.waitForTimeout(2500);
      let mainLen = '';
      for (let i = 0; i < 3; i++) {
        mainLen = await page.evaluate(() => {
          const mains = [...document.querySelectorAll('main')].filter(m => {
            const s = getComputedStyle(m);
            return s.display !== 'none' && s.visibility !== 'hidden';
          });
          return mains.sort((a,b)=>b.innerText.length-a.innerText.length)[0]?.innerText || '';
        }).catch(() => '');
        if (mainLen && mainLen.trim().length >= 3) break;
        await page.waitForTimeout(1000);
      }
      if (!mainLen || mainLen.trim().length < 3) { status = 'WARN'; detail = 'main empty'; }
    } catch (e) {
      status = 'FAIL'; detail = e.message.split('\n')[0].slice(0, 120);
    }
    results.push({ label, status, detail });
    console.log(`${status === 'OK' ? '✓' : status === 'WARN' ? '⚠' : '✗'} ${label}${detail ? ' — ' + detail : ''}`);
  }

  console.log(`\n=== CONSOLE/PAGE ERRORS: ${errors.length} ===`);
  const seen = new Set();
  for (const e of errors) {
    const key = e.where + '::' + e.text.slice(0, 140);
    if (seen.has(key)) continue; seen.add(key);
    console.log(`[${e.where}] ${e.text.slice(0, 200)}`);
  }

  const fails = results.filter(r => r.status !== 'OK').length;
  console.log(`\nSUMMARY: ${results.length - fails}/${results.length} screens OK; ${errors.length} unique runtime errors.`);
  await browser.close();
  process.exit(fails === 0 && errors.length === 0 ? 0 : 1);
})().catch(e => { console.error('TEST HARNESS ERROR:', e); process.exit(2); });
