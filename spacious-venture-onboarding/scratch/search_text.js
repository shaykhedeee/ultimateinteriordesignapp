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
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('Review PDF brief')) {
          console.log(`Found in: ${fullPath}`);
        }
      }
    }
  }
}

searchDir('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding');
