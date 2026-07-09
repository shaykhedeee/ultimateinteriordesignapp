import fs from 'fs';
const css = fs.readFileSync('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/frontend/src/styles.css', 'utf8');
const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('intake-workspace')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
