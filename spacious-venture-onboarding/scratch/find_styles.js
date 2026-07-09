import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
const css = fs.readFileSync(cssPath, 'utf8');

const patterns = [
  /\.studio-sidebar/i,
  /background: #fff/i,
  /background-color: #fff/i,
  /background-color: white/i,
  /background: white/i,
  /\.main-shell/i,
  /--sidebar-total/i,
  /--inspector-width/i
];

patterns.forEach((pattern) => {
  const lines = css.split('\n');
  const matches = [];
  lines.forEach((line, idx) => {
    if (pattern.test(line)) {
      matches.push({ lineNum: idx + 1, text: line.trim() });
    }
  });
  console.log(`\nPattern ${pattern.toString()}: found ${matches.length} matches.`);
  matches.slice(0, 10).forEach((m) => {
    console.log(`  Line ${m.lineNum}: ${m.text}`);
  });
});
