import fs from 'fs';
import path from 'path';

const searchDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('fetch')) {
        console.log(`Found 'fetch' in ${fullPath}`);
      }
    }
  }
};

searchDir('C:/Users/USER/Documents/Muskans autocad solution/spacious-venture-onboarding');
