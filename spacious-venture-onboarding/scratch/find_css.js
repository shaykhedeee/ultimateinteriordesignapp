import fs from 'fs';

const css = fs.readFileSync('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/frontend/src/styles.css', 'utf8');
const lines = css.split('\n');

const keywords = ['workflow-rail', 'workflow-list', 'intake-panel', 'onboarding-center', 'design-workspace', 'MoodboardCanvas', 'Moodboard', 'moodboard'];

keywords.forEach(kw => {
  console.log(`=== Matches for "${kw}" ===`);
  lines.forEach((line, index) => {
    if (line.includes(kw)) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
});
