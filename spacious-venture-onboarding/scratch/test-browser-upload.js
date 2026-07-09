import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

async function runUploadTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]:', err.message, err.stack);
  });

  page.on('request', req => {
    if (req.url().includes('analyze-floorplan')) {
      console.log('REQUEST SENT:', req.method(), req.url());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('analyze-floorplan')) {
      console.log('RESPONSE STATUS:', res.status(), res.url());
      try {
        const text = await res.text();
        console.log('RESPONSE TEXT:', text);
      } catch (e) {
        console.log('COULD NOT READ RESPONSE TEXT:', e.message);
      }
    }
  });

  try {
    console.log('Navigating to app...');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(2000);

    // Let's make sure we are on the AI Renders page
    console.log('Clicking AI Renders nav...');
    await page.locator('nav[aria-label="Studio navigation"] button:has-text("AI Renders")').click();
    await page.waitForTimeout(2000);

    // Upload the file
    const fileInput = await page.locator('input[type="file"]#floorplan-upload');
    const uploadFilePath = path.resolve('newinfo/reference-library/floor-plans/3bhk/3bhk-sample-floorplan.jpg');
    console.log(`Uploading file: ${uploadFilePath}`);
    await fileInput.setInputFiles(uploadFilePath);

    console.log('File uploaded. Waiting for analysis response...');
    await page.waitForTimeout(4000);

    // Take screenshot of the screen
    await page.screenshot({ path: 'scratch/upload-result.png' });
    console.log('Saved screenshot to scratch/upload-result.png');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
}

runUploadTest();
