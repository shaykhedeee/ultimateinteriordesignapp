import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.sql') || file.endsWith('.mjs')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('floor_plan_analyses')) {
          console.log(`Found in: ${fullPath}`);
        }
      }
    }
  }
}

searchDir('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/server');
