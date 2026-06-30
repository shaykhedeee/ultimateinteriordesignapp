import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Resolve absolute path to the HTML brief
  const htmlPath = path.resolve(__dirname, 'client-brief/sales-onboarding-brief.html');
  console.log(`Loading HTML file from: file://${htmlPath}`);
  
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  
  // Set A4 print options to match our layout exactly
  const pdfPath = path.resolve(__dirname, 'client-brief/sales-onboarding-brief.pdf');
  console.log(`Printing PDF to: ${pdfPath}`);
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0px',
      bottom: '0px',
      left: '0px',
      right: '0px'
    }
  });
  
  await browser.close();
  console.log('PDF generated successfully!');
}

generatePDF().catch((err) => {
  console.error('Error during PDF generation:', err);
  process.exit(1);
});
