import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let key = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('OPENAI_API_KEY=')) {
    key = line.split('=')[1].trim();
  }
}

async function testOpenRouterImage() {
  if (!key) return;

  const endpoint = 'https://openrouter.ai/api/v1/images/generations';
  // Also try chat endpoint with a multimodal/image model or standard DALL-E
  const models = [
    'openai/dall-e-3',
    'google/imagen-3'
  ];

  for (const model of models) {
    try {
      console.log(`Testing model: ${model}`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          prompt: 'A modern contemporary Indian living room interior design',
          size: '1024x1024'
        })
      });

      console.log(`Model ${model}: Status ${res.status}`);
      const json = await res.json();
      console.log(`Response:`, JSON.stringify(json, null, 2));
    } catch (err) {
      console.error(`Model ${model} failed:`, err);
    }
  }
}

testOpenRouterImage();
