import dotenv from 'dotenv';
dotenv.config();

const key = process.env.AIMLAPI_KEY;
console.log('Using AIMLAPI key:', key);

if (!key) {
  console.log('No AIMLAPI key found');
  process.exit(1);
}

async function testAimlImage() {
  const endpoint = 'https://api.aimlapi.com/v1/images/generations';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: 'A premium Indian living room with teak wood and brass accents, realistic 3d render',
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      })
    });

    console.log('Response Status:', res.status);
    const json = await res.json();
    if (res.status === 200) {
      console.log('Success! Base64 length:', json.data?.[0]?.b64_json?.length || json.data?.[0]?.url);
    } else {
      console.log('Error:', JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAimlImage();
