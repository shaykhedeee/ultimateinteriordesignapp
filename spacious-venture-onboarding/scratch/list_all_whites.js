import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
const css = fs.readFileSync(cssPath, 'utf8');
const lines = css.split('\n');

const keywords = ['#fff', 'white', '#ffffff', '255, 255, 255', '255,255,255'];
let currentSelector = '';

lines.forEach((line, idx) => {
  // Try to track the current CSS selector for context
  if (line.includes('{') && !line.includes('@media') && !line.includes('@keyframes')) {
    currentSelector = line.trim();
  }
  
  const hasWhite = keywords.some(k => 
    line.includes(k) && 
    !line.includes('rgba(255,255,255,0.0') && 
    !line.includes('rgba(255,255,255,0.1') && 
    !line.includes('rgba(255,255,255,0.2') && 
    !line.includes('color: #fff') && 
    !line.includes('color: white') &&
    !line.includes('border-color: rgba(255,255,255') &&
    !line.includes('border-bottom: 1px solid rgba(255,255,255') &&
    !line.includes('border-right: 1px solid rgba(255,255,255') &&
    !line.includes('border-top: 1px solid rgba(255,255,255') &&
    !line.includes('border-left: 1px solid rgba(255,255,255')
  );
  
  if (hasWhite) {
    console.log(`Line ${idx + 1} [Selector: ${currentSelector}]: ${line.trim()}`);
  }
});
