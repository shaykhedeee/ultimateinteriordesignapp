import fs from 'node:fs';
import path from 'node:path';

async function testUpload() {
  const filePath = path.resolve('newinfo/reference-library/floor-plans/3bhk/3bhk-sample-floorplan.jpg');
  if (!fs.existsSync(filePath)) {
    console.error('Test file does not exist:', filePath);
    return;
  }

  console.log('Test file exists, reading...');
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  
  const formData = new FormData();
  formData.append('floorPlan', blob, '3bhk-sample-floorplan.jpg');
  formData.append('projectId', 'PJ3XPucpDXcx'); // Iyer Family project id
  formData.append('style', 'modern');
  formData.append('budgetTier', 'premium');

  console.log('Sending upload request to http://localhost:8787/api/renders/analyze-floorplan ...');
  try {
    const response = await fetch('http://localhost:8787/api/renders/analyze-floorplan', {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Raw response text length:', text.length);
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON successfully:');
      console.log(JSON.stringify(json, null, 2).slice(0, 1000));
    } catch {
      console.log('Failed to parse response as JSON. Content starts with:');
      console.log(text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
}

testUpload();
