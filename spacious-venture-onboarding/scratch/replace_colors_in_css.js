import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update variables in :root
const originalRoot = `:root {
  --ink: #14120f;
  --muted: #756f64;
  --line: rgba(20, 18, 15, 0.12);
  --paper: #faf8f2;
  --paper-2: #f1ede4;
  --dark: #111310;
  --dark-2: #1c1e1a;
  --gold: #bd934a;
  --gold-2: #d2ad67;
  --sage: #879171;
  --teak: #7a4d2d;`;

const newRoot = `:root {
  --ink: #e6e1da;
  --muted: #958f84;
  --line: rgba(210, 173, 103, 0.15);
  --paper: #0b0c0a;
  --paper-2: #141613;
  --dark: #070807;
  --dark-2: #111310;
  --gold: #bd934a;
  --gold-2: #d2ad67;
  --sage: #778161;
  --teak: #9c6844;`;

if (css.includes(originalRoot)) {
  css = css.replace(originalRoot, newRoot);
  console.log('Updated :root CSS variables to dark theme values.');
} else {
  console.warn('Could not find original :root variables. Manually checking...');
}

// 2. Widen default sidebar columns
css = css.replace(/grid-template-columns: 74px var\(--sidebar-total, 164px\)/g, 'grid-template-columns: 74px var(--sidebar-total, 240px)');
css = css.replace(/grid-template-columns: 74px var\(--sidebar-total, 164px\) 6px minmax\(0, 1fr\)/g, 'grid-template-columns: 74px var(--sidebar-total, 240px) 6px minmax(0, 1fr)');
css = css.replace(/grid-template-columns: 74px var\(--sidebar-total, 164px\) 6px minmax\(0, 1fr\) 6px var\(--inspector-width, 320px\)/g, 'grid-template-columns: 74px var(--sidebar-total, 240px) 6px minmax(0, 1fr) 6px var(--inspector-width, 320px)');
console.log('Updated default sidebar column widths to 240px.');

// 3. Update topbar background to dark color
css = css.replace(/background: rgba\(255,255,255,0.92\);/g, 'background: rgba(20, 22, 19, 0.95);');

// 4. Update secondary button backgrounds
const originalSecondaryBtn = `.btn-secondary,
.secondary-button:not(.btn),
.secondary-light-button:not(.btn) {
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--line);
}
.btn-secondary:hover:not(:disabled),
.secondary-button:not(.btn):hover:not(:disabled) {
  background: var(--paper-2);
}`;

const newSecondaryBtn = `.btn-secondary,
.secondary-button,
.secondary-light-button,
.upload-button {
  background: var(--paper-2);
  color: var(--ink);
  border: 1px solid var(--line);
}
.btn-secondary:hover:not(:disabled),
.secondary-button:hover:not(:disabled),
.secondary-light-button:hover:not(:disabled),
.upload-button:hover:not(:disabled) {
  background: rgba(210, 173, 103, 0.12);
  border-color: var(--gold-2);
}`;

if (css.includes(originalSecondaryBtn)) {
  css = css.replace(originalSecondaryBtn, newSecondaryBtn);
  console.log('Updated secondary and light buttons to dark themed versions.');
}

// 5. Replace card background
css = css.replace(/\.card {\n  background: #fff;/g, '.card {\n  background: var(--paper-2);');
// Replace modal background
css = css.replace(/\.modal {\n  background: #fff;/g, '.modal {\n  background: var(--paper-2);');
// Replace toast background
css = css.replace(/background: #fff;\n  box-shadow: 0 4px 16px rgba\(0,0,0,0.12\);/g, 'background: var(--paper-2);\n  box-shadow: 0 4px 16px rgba(0,0,0,0.3);');
// Replace inline designer input background
css = css.replace(/\.designer-edit-inline input {\n  background: #fff;/g, '.designer-edit-inline input {\n  background: var(--paper);');

// 6. Replace specific page and form hardcoded white backgrounds
css = css.replace(/\.brief-page {\n  background: #fff;/g, '.brief-page {\n  background: var(--paper-2);');
css = css.replace(/\.cutlist-summary-row article {\n  background: #fff;/g, '.cutlist-summary-row article {\n  background: var(--paper-2);');
css = css.replace(/\.cutlist-module-grid article {\n  background: #fff;/g, '.cutlist-module-grid article {\n  background: var(--paper-2);');
css = css.replace(/\.cutlist-module-grid article\.generated {\n  min-height: 170px;\n  border-color: rgba\(46,107,87,0.26\);\n  background: linear-gradient\(180deg, #fff, rgba\(231,241,236,0.74\)\);/g, '.cutlist-module-grid article.generated {\n  min-height: 170px;\n  border-color: rgba(46,107,87,0.26);\n  background: linear-gradient(180deg, var(--paper-2), rgba(46,107,87,0.12));');
css = css.replace(/\.module-edit-form {\n  border: 1px solid rgba\(184,138,47,0.28\);\n  border-radius: 10px;\n  padding: 14px;\n  background: linear-gradient\(180deg, rgba\(255,250,239,0.94\), #fff\);/g, '.module-edit-form {\n  border: 1px solid rgba(184,138,47,0.28);\n  border-radius: 10px;\n  padding: 14px;\n  background: linear-gradient(180deg, rgba(189, 147, 74, 0.12), var(--paper-2));');
css = css.replace(/\.module-edit-form textarea {\n  background: #fff;/g, '.module-edit-form textarea {\n  background: var(--paper);');
css = css.replace(/\.sheet-preview-card {\n  background: #fff;/g, '.sheet-preview-card {\n  background: var(--paper-2);');
css = css.replace(/\.cutlist-parts-table article {\n  background: #fff;/g, '.cutlist-parts-table article {\n  background: var(--paper-2);');
css = css.replace(/\.pricing-milestones article {\n  background: #fff;/g, '.pricing-milestones article {\n  background: var(--paper-2);');

// Replace general legacy aliases
css = css.replace(/\.secondary-button { background: #fff; color: var\(--ink\); border: 1px solid var\(--line\); }/g, '.secondary-button { background: var(--paper-2); color: var(--ink); border: 1px solid var(--line); }');
css = css.replace(/\.secondary-light-button { background: #fff; color: var\(--ink\); border: 1px solid var\(--line\); }/g, '.secondary-light-button { background: var(--paper-2); color: var(--ink); border: 1px solid var(--line); }');
css = css.replace(/\.upload-button { background: #fff; color: var\(--ink\); border: 1px solid var\(--line\); }/g, '.upload-button { background: var(--paper-2); color: var(--ink); border: 1px solid var(--line); }');

// 7. Make sure general form inputs and select elements have dark backgrounds
css = css.replace(/button,\ninput,\nselect,\ntextarea {\n  font: inherit;\n}/g, 'button,\ninput,\nselect,\ntextarea {\n  font: inherit;\n}\n\ninput, select, textarea {\n  background: var(--paper-2);\n  color: var(--ink);\n  border: 1px solid var(--line);\n  border-radius: var(--radius-md);\n  padding: var(--space-sm) var(--space-md);\n}');

// Save updated CSS
fs.writeFileSync(cssPath, css, 'utf8');
console.log('Saved dark mode changes to styles.css.');
