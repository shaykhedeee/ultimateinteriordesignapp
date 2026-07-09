import fs from 'fs';

const css = fs.readFileSync('frontend/src/styles.css', 'utf8');
const lines = css.split('\n');

const lineNumbers = [215, 332, 383, 625, 690];
lineNumbers.forEach((num) => {
  console.log(`\n--- Line ${num} ---`);
  const start = Math.max(0, num - 5);
  const end = Math.min(lines.length - 1, num + 5);
  for (let i = start; i <= end; i++) {
    const marker = (i === num - 1) ? '>> ' : '   ';
    console.log(`${marker}${i + 1}: ${lines[i]}`);
  }
});
