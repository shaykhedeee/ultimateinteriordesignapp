import fs from 'fs';
import path from 'path';

function fixBat(filePath, replacements = []) {
  let text = fs.readFileSync(filePath, 'utf-8');
  for (const [from, to] of replacements) text = text.replace(from, to);
  fs.writeFileSync(filePath, text, 'utf-8');
}

if (fs.existsSync('launch.bat')) {
  fixBat('launch.bat', [
    ['%*', '--silent'],
    ['start ""', 'start /B'],
    [/npm run client\r?\n/m, 'npm run client\r\n']
  ]);
}

if (fs.existsSync('start.bat')) {
  fixBat('start.bat', [
    ['start "" cmd /c', 'start "" cmd /c "'],
    ['npm run server', 'npm run server\"'],
    ['npm run client', 'npm run client\"']
  ]);
}

if (fs.existsSync('START.bat')) {
  fixBat('START.bat', [
    ['start ""', 'start /B ""']
  ]);
}

console.log('ok');
