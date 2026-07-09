import fs from 'fs';

const cssPath = 'frontend/src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update .pipeline-board grid columns to prevent overlapping circles
const originalBoard = `.pipeline-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}`;

const newBoard = `.pipeline-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 14px;
}`;

if (css.includes(originalBoard)) {
  css = css.replace(originalBoard, newBoard);
  console.log('Replaced .pipeline-board styling.');
} else {
  // Let's do regex replace if exact match fails
  css = css.replace(/\.pipeline-board\s*\{[^}]*grid-template-columns:[^;]*;/g, `.pipeline-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));`);
  console.log('Regex fallback: Replaced .pipeline-board grid column rules.');
}

// 2. Update .command-bottom-grid template columns to allow responsive wrapping
const originalBottomGrid = `.command-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.8fr);
  gap: 14px;
}`;

const newBottomGrid = `.command-bottom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}`;

if (css.includes(originalBottomGrid)) {
  css = css.replace(originalBottomGrid, newBottomGrid);
  console.log('Replaced .command-bottom-grid styling.');
} else {
  css = css.replace(/\.command-bottom-grid\s*\{[^}]*grid-template-columns:[^;]*;/g, `.command-bottom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));`);
  console.log('Regex fallback: Replaced .command-bottom-grid grid column rules.');
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Finished updating grid layout files.');
