import 'dotenv/config';

async function testGemini() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_AI_STUDIO_KEY_1,
    process.env.GOOGLE_AI_STUDIO_KEY_2
  ].filter(Boolean);

  console.log('Found Gemini Keys:', keys.length);
  for (const key of keys) {
    console.log(`Testing key: ${key.slice(0, 10)}...`);
    const model = 'gemini-2.5-flash-image';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': key
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'luxury living room' }]
          }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            temperature: 0.8
          }
        })
      });
      console.log(`Status: ${response.status}`);
      if (response.ok) {
        const json = await response.json();
        console.log('✅ Gemini native image generator succeeded!');
        console.log(JSON.stringify(json, null, 2).slice(0, 500));
        return;
      } else {
        const text = await response.text();
        console.log(`❌ Gemini native failed: ${text.slice(0, 200)}`);
      }
    } catch (e) {
      console.log('Error testing key:', e.message);
    }
  }
}

testGemini();
