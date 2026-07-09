import fs from 'node:fs';
import path from 'node:path';

const searchDir = './server';
const query = /fileName\s*=|filePath\s*=/i;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|css|html)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (query.test(content)) {
        console.log(`Match in: ${fullPath}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (query.test(line)) {
            console.log(`  L${idx + 1}: ${line.trim().slice(0, 100)}`);
          }
        });
      }
    }
  }
}

walk(searchDir);
