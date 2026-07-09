import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace color declarations that ended up at 0.04 opacity back to a readable 0.72 opacity
css = css.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/g, 'color: rgba(255, 255, 255, 0.72)');
css = css.replace(/color:\s*rgba\(255,255,255,0\.04\)/g, 'color: rgba(255, 255, 255, 0.72)');

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Restored text colors to readable opacities in styles.css.');
