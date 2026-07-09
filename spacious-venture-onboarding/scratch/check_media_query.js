import fs from 'fs';
const css = fs.readFileSync('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/frontend/src/styles.css', 'utf8');
const lines = css.split('\n');

let mediaQueryOpenIndex = -1;
let openBraces = 0;
let closedAt = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('@media (max-width: 900px)')) {
    mediaQueryOpenIndex = i;
    openBraces = 0;
  }
  
  if (mediaQueryOpenIndex !== -1) {
    const chars = line.split('');
    for (let c of chars) {
      if (c === '{') openBraces++;
      if (c === '}') {
        openBraces--;
        if (openBraces === 0) {
          closedAt = i;
          console.log(`Media query opened at line ${mediaQueryOpenIndex + 1} closed at line ${i + 1}`);
          mediaQueryOpenIndex = -1;
          break;
        }
      }
    }
  }
}

if (mediaQueryOpenIndex !== -1) {
  console.log(`Media query opened at line ${mediaQueryOpenIndex + 1} was NEVER closed! Open braces left: ${openBraces}`);
}
