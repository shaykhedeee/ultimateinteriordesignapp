import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('IMAGINE_ART_API_KEY=')) {
    key = line.split('=')[1].trim();
  }
}

async function checkEndpoints() {
  const endpoints = [
    'https://api.vyro.ai/v2/image/styles',
    'https://api.vyro.ai/v2/image/models',
    'https://api.vyro.ai/v2/image/generations/styles',
    'https://api.vyro.ai/v2/image/variations',
    'https://api.vyro.ai/v2/image/generations'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      console.log(`${url}: Status ${res.status}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`Response: ${text.slice(0, 500)}`);
      }
    } catch (err) {
      console.log(`${url} failed: ${err.message}`);
    }
  }
}

checkEndpoints();
