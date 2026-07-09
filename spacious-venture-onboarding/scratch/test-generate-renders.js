async function testGenerate() {
  console.log('Sending render generation request to http://localhost:8787/api/renders/generate ...');
  try {
    const response = await fetch('http://localhost:8787/api/renders/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: 'PJ3XPucpDXcx',
        style: 'modern',
        budgetTier: 'premium',
        variantCount: 4,
        imageSize: '1024x1024',
        quality: 'balanced'
      })
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

testGenerate();
