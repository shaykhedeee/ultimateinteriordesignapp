import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync('C:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/server/services/visualizer-engine.js', 'utf8');
const lines = fileContent.split('\n');

let printLines = false;
let startLine = -1;
let endLine = -1;

lines.forEach((line, idx) => {
  if (line.includes('function buildStructuredVisualizerPrompt')) {
    startLine = idx + 1;
    printLines = true;
  }
  if (printLines && startLine !== -1 && idx > startLine && line.trim().startsWith('function ')) {
    endLine = idx;
    printLines = false;
  }
});

if (startLine !== -1) {
  console.log(`buildStructuredVisualizerPrompt starts at line ${startLine} and ends around line ${endLine || lines.length}`);
  for (let i = startLine - 1; i < Math.min(startLine + 200, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log("buildStructuredVisualizerPrompt not found in visualizer-engine.js");
}
