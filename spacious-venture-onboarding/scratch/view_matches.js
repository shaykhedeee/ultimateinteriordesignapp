import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
const css = fs.readFileSync(cssPath, 'utf8');
const lines = css.split('\n');

const keywords = ['#fff', 'white', '#ffffff', '255,255,255'];
console.log('Searching for white background or colors in styles.css...');

lines.forEach((line, idx) => {
  const match = keywords.some(k => line.includes(k) && !line.includes('rgba(255,255,255,0.0') && !line.includes('rgba(255,255,255,0.1') && !line.includes('rgba(255,255,255,0.2') && !line.includes('color: #fff') && !line.includes('color: white'));
  if (match) {
    // Print context
    console.log(`\n--- Line ${idx + 1} ---`);
    for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
      const marker = i === idx ? '>> ' : '   ';
      console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
  }
});
