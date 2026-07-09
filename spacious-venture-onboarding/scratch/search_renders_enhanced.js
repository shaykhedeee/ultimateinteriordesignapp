import fs from 'fs';
const content = fs.readFileSync('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/server/routes/renders-enhanced.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('renderPipeline') || line.includes('generate')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
