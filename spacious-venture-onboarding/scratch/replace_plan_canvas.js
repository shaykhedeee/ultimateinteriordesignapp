import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace .plan-canvas background
const planCanvasOrig = `background:
    linear-gradient(90deg, rgba(20,18,15,0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(20,18,15,0.04) 1px, transparent 1px),
    #fffdf7;`;

const planCanvasNew = `background:
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px),
    #121312;`;

if (css.includes(planCanvasOrig)) {
  css = css.replace(planCanvasOrig, planCanvasNew);
  console.log('Replaced .plan-canvas background.');
} else {
  // Let's do a regex replace
  css = css.replace(/#fffdf7;/g, '#121312;');
  console.log('Fallback: Replaced #fffdf7 with #121312.');
}

// Replace .start-hero background
const startHeroOrig = `background:
    linear-gradient(135deg, rgba(189,147,74,0.16), rgba(135,145,113,0.12)),
    #fff;`;

const startHeroNew = `background:
    linear-gradient(135deg, rgba(189,147,74,0.16), rgba(135,145,113,0.12)),
    var(--paper-2);`;

if (css.includes(startHeroOrig)) {
  css = css.replace(startHeroOrig, startHeroNew);
  console.log('Replaced .start-hero background.');
} else {
  console.log('Start hero exact match not found, searching with regex...');
  // Let's do a regex replacement for start-hero background
  css = css.replace(/\.start-hero \{([^}]+)#fff;/g, '.start-hero {$1var(--paper-2);');
}

// Replace .admin-command-hero background
const adminHeroOrig = `background:
    linear-gradient(135deg, rgba(20,18,15,0.06), rgba(189,147,74,0.12)),
    #fff;`;

const adminHeroNew = `background:
    linear-gradient(135deg, rgba(189,147,74,0.12), rgba(255,255,255,0.03)),
    var(--paper-2);`;

if (css.includes(adminHeroOrig)) {
  css = css.replace(adminHeroOrig, adminHeroNew);
  console.log('Replaced .admin-command-hero background.');
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Finished updating plan canvas and start/admin heroes background styles.');
