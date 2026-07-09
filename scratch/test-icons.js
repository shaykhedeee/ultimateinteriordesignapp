const fs = require('fs');

// Mock window and OfficeSymbols
global.window = {};
require('../icons.js');

const furniture = global.window.OfficeSymbols.furniture;
const openings = global.window.OfficeSymbols.openings;

console.log('--- TESTING FURNITURE ---');
for (const [key, item] of Object.entries(furniture)) {
  for (let scaleVal = 5; scaleVal <= 100; scaleVal += 5) {
    const w = item.width * scaleVal;
    const h = item.height * scaleVal;
    try {
      const svgString = item.draw(w, h, '#4299E1');
      const widthMatch = svgString.match(/width="\s*-\d+/);
      const heightMatch = svgString.match(/height="\s*-\d+/);
      if (widthMatch) {
        console.log(`FAIL [furniture:${key}] scale ${scaleVal}: Found negative width in SVG:`, widthMatch[0], 'SVG:', svgString);
      }
      if (heightMatch) {
        console.log(`FAIL [furniture:${key}] scale ${scaleVal}: Found negative height in SVG:`, heightMatch[0], 'SVG:', svgString);
      }
    } catch (err) {
      console.error(`ERROR running draw on [${key}]:`, err);
    }
  }
}

console.log('--- TESTING OPENINGS ---');
for (const [key, item] of Object.entries(openings)) {
  for (let w = 5; w <= 200; w += 5) {
    try {
      const svgString = item.draw(w, '#4299E1');
      const widthMatch = svgString.match(/width="\s*-\d+/);
      const heightMatch = svgString.match(/height="\s*-\d+/);
      if (widthMatch) {
        console.log(`FAIL [opening:${key}] width ${w}: Found negative width in SVG:`, widthMatch[0], 'SVG:', svgString);
      }
      if (heightMatch) {
        console.log(`FAIL [opening:${key}] width ${w}: Found negative height in SVG:`, heightMatch[0], 'SVG:', svgString);
      }
    } catch (err) {
      console.error(`ERROR running draw on [${key}]:`, err);
    }
  }
}
console.log('Done testing!');
