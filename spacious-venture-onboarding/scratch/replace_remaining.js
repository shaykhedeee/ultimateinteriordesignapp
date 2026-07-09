import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace all remaining literal "background: #fff;" with "background: var(--paper-2);"
css = css.replace(/background:\s*#fff;/g, 'background: var(--paper-2);');
css = css.replace(/background-color:\s*#fff;/g, 'background-color: var(--paper-2);');

// Replace high-opacity white glassmorphic backgrounds (rgba(255,255,255,0.7)) with dark glassmorphic backgrounds (rgba(255,255,255,0.04))
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.[6789]\d*\)/g, 'rgba(255,255,255,0.04)');
css = css.replace(/rgba\(255,255,255,0\.6\d*\)/g, 'rgba(255,255,255,0.04)');
css = css.replace(/rgba\(255,255,255,0\.7\d*\)/g, 'rgba(255,255,255,0.04)');
css = css.replace(/rgba\(255,255,255,0\.8\d*\)/g, 'rgba(255,255,255,0.04)');

// Let's replace the linear-gradients that have #fff in them
css = css.replace(/background:\s*linear-gradient\(180deg,\s*#fff,\s*rgba\(231,241,236,0.74\)\);/g, 'background: linear-gradient(180deg, var(--paper-2), rgba(46,107,87,0.12));');
css = css.replace(/background:\s*linear-gradient\(180deg,\s*rgba\(255,250,239,0.94\),\s*#fff\);/g, 'background: linear-gradient(180deg, rgba(189,147,74,0.08), var(--paper-2));');

// Let's check some specific leftover items
css = css.replace(/background:\s*#fffaf0;/g, 'background: var(--paper-2);');

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully replaced remaining white backgrounds in styles.css.');
