import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.OPENAI_API_KEY;
console.log('Using API key:', key ? key.slice(0, 15) + '...' : 'none');

const config = {
  apiKey: key,
};

if (key.startsWith('sk-or-v1-')) {
  config.baseURL = 'https://openrouter.ai/api/v1';
}

const openai = new OpenAI(config);

async function testGeneration() {
  try {
    const model = 'openai/dall-e-3';
    console.log(`Testing image generation with model "${model}"...`);
    const response = await openai.images.generate({
      model: model,
      prompt: 'A premium Indian living room with teak wood and brass accents, realistic 3d render',
      n: 1,
      size: '1024x1024'
    });
    console.log('Success! Image URL:', response.data[0]?.url);
  } catch (err) {
    console.error('Image generation failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response body:', await err.response.text());
    } else {
      console.error('Error detail:', err);
    }
  }
}

testGeneration();
