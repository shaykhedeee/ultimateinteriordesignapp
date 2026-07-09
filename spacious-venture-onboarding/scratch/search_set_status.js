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
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        let idx = 0;
        while ((idx = content.indexOf('setStatus', idx)) !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + 100);
          console.log(`Found in ${file}: ...${content.slice(start, end).replace(/\n/g, ' ')}...`);
          idx += 9;
        }
      }
    }
  }
}

searchDir('c:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding/frontend');
