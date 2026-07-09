import { chromium } from 'playwright';

async function checkBrowser() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Listen to page errors
  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]:', err.message, err.stack);
  });

  try {
    console.log('Navigating to http://127.0.0.1:5173/ ...');
    await page.goto('http://127.0.0.1:5173/');

    console.log('Page loaded. Waiting 4 seconds to check if it goes to black screen...');
    await page.waitForTimeout(4000);

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'scratch/screenshot.png' });
    console.log('Screenshot saved to scratch/screenshot.png');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
}

checkBrowser();
