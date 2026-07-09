import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync('C:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/frontend/src/screens/ManagementScreens.jsx', 'utf8');
const lines = fileContent.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('mistake') || line.toLowerCase().includes('correction')) {
    if (line.includes('api(') || line.includes('fetch(') || line.includes('POST')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
