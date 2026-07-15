import { chromium } from 'playwright';
const BASE = process.env.APP_URL || 'http://127.0.0.1:8787';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SCREENS = ['Command Center','Client Board','Project Pipeline','Client Intake','Plan Intelligence','Editable 3D Scene','Vastu Studio','Floor Plan Enhancer','Drawings & Elevations','Render Studio','Design Library','Background Jobs','Materials Catalog','Cutlist & Nesting','Commerce & Quotes','Project Timeline','Presentation Pack','Pipeline Studio','Deliverables Vault','Brand Studio','Backup & Restore'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.split('\n')[0].slice(0,140)));
  page.on('console', m => { if (m.type()==='error' && !m.text().includes('404') && !m.text().includes('422') && !m.text().includes('Failed to load resource')) errs.push('CONSOLE: ' + m.text().slice(0,140)); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button:has-text("Command Center")', { timeout: 15000 });
  await sleep(2000);
  for (let i=0;i<SCREENS.length;i++){
    const label = SCREENS[i];
    const start = errs.length;
    try { await page.locator(`nav button:has-text("${label}")`).first().click({ force: true, timeout: 5000 }); }
    catch (e) { errs.push(`NAV ${label}: ${e.message.split('\n')[0].slice(0,70)}`); }
    await sleep(900);
    // Click up to 2 role=tab elements
    try {
      const tabs = await page.locator('[role="tab"]').all();
      for (const t of tabs.slice(0,2)) { try { await t.click({force:true,timeout:2500}); await sleep(300);} catch{} }
    } catch {}
    // Click up to 2 main buttons
    try {
      const btns = await page.locator('main button').all();
      for (const b of btns.slice(0,2)) { try { await b.click({force:true,timeout:2500}); await sleep(300);} catch{} }
    } catch {}
    const added = errs.slice(start);
    console.log(added.length ? `✗ ${label}: ${added.slice(0,2).join(' | ')}` : `✓ ${label}`);
  }
  console.log(`\nTOTAL RUNTIME ERRORS: ${errs.length}`);
  [...new Set(errs)].slice(0,25).forEach(e => console.log(' -', e));
  await browser.close();
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
