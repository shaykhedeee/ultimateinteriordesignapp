import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync('C:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/server/services/visualizer-engine.js', 'utf8');
const lines = fileContent.split('\n');

lines.forEach((line, idx) => {
  if (line.trim().startsWith('export ')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
