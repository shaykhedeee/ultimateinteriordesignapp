import { chromium } from 'playwright';

async function testAllScreens() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR]: ${msg.text()}`);
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error('[BROWSER RUNTIME ERROR]:', err.message);
    errors.push(`Page error: ${err.message}`);
  });

  try {
    console.log('Navigating to http://127.0.0.1:5173/ ...');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(2000);

    // Get all navigation buttons
    const navButtons = await page.locator('nav[aria-label="Studio navigation"] button');
    const count = await navButtons.count();
    console.log(`Found ${count} navigation buttons.`);

    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      const label = (await button.locator('span').textContent()).trim();
      console.log(`Clicking navigation item: "${label}"...`);
      
      await button.click();
      await page.waitForTimeout(1500);

      // Take a screenshot of the screen
      const safeLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const screenshotPath = `scratch/screen_${safeLabel}.png`;
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot to ${screenshotPath}`);
    }

    // Try opening help link
    console.log('Clicking "Help" button...');
    await page.locator('button.help-link').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/screen_help.png' });

    console.log('All screens tested.');
    if (errors.length > 0) {
      console.error('Test failed with errors:', errors);
      process.exit(1);
    } else {
      console.log('All screens loaded successfully with 0 errors!');
    }
  } catch (err) {
    console.error('Test script failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAllScreens();
