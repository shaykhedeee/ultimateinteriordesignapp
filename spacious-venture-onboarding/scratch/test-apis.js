import 'dotenv/config';

async function testPollinations() {
  try {
    console.log('Testing Pollinations...');
    const url = 'https://image.pollinations.ai/prompt/luxury%20living%20room%20indian%20style?width=512&height=512&model=flux&seed=42';
    const res = await fetch(url);
    if (res.ok && res.headers.get('content-type').startsWith('image/')) {
      console.log('✅ Pollinations is working!');
      return true;
    }
    console.log('❌ Pollinations failed:', res.status);
  } catch (e) {
    console.log('❌ Pollinations failed with error:', e.message);
  }
  return false;
}

async function testPexels() {
  try {
    console.log('Testing Pexels...');
    if (!process.env.PEXELS_API_KEY) {
      console.log('❌ Pexels key missing');
      return false;
    }
    const res = await fetch('https://api.pexels.com/v1/search?query=living+room&per_page=1', {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    if (res.ok) {
      console.log('✅ Pexels is working!');
      return true;
    }
    console.log('❌ Pexels failed:', res.status);
  } catch (e) {
    console.log('❌ Pexels failed with error:', e.message);
  }
  return false;
}

async function testHuggingFace() {
  try {
    console.log('Testing Hugging Face...');
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.log('❌ HuggingFace key missing');
      return false;
    }
    const res = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: 'luxury living room' })
    });
    if (res.ok) {
      console.log('✅ Hugging Face is working!');
      return true;
    }
    const text = await res.text();
    console.log('❌ Hugging Face failed:', res.status, text.slice(0, 100));
  } catch (e) {
    console.log('❌ Hugging Face failed with error:', e.message);
  }
  return false;
}

async function run() {
  await testPollinations();
  await testPexels();
  await testHuggingFace();
}

run();
