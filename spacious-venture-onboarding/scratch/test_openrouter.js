import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.OPENAI_API_KEY;
console.log('Using API key:', key ? key.slice(0, 15) + '...' : 'none');

if (!key) {
  console.log('No OpenAI key found');
  process.exit(1);
}

const config = {
  apiKey: key,
};

if (key.startsWith('sk-or-v1-')) {
  config.baseURL = 'https://openrouter.ai/api/v1';
}

const openai = new OpenAI(config);

async function testModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    const imageModels = data.data.filter(m => m.id.includes('image') || m.id.includes('dall-e') || m.id.includes('flux'));
    console.log('Supported image/generation models on OpenRouter:');
    imageModels.forEach(m => console.log(`- ${m.id} (${m.name})`));
  } catch (err) {
    console.error('Failed to list OpenRouter models:', err);
  }
}

async function testGeneration() {
  try {
    const model = key.startsWith('sk-or-v1-') ? 'openai/dall-e-3' : 'dall-e-3';
    console.log(`Testing image generation with model "${model}"...`);
    const response = await openai.images.generate({
      model: model,
      prompt: 'A premium Indian living room with teak wood and brass accents, realistic 3d render',
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });
    console.log('Success! Base64 length:', response.data[0]?.b64_json?.length);
  } catch (err) {
    console.error('Image generation failed:', err.message);
  }
}

async function run() {
  await testModels();
  await testGeneration();
}

run();
