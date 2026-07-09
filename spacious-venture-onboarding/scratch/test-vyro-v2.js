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

async function testV2() {
  const url = 'https://api.vyro.ai/v2/image/generations';
  const configs = [
    { style: 'realistic', variation: 'v5-artistic' },
    { style: 'realistic', variation: 'v5-realistic' },
    { style: 'realistic', variation: 'v5-anime' },
    { style: 'realistic', variation: 'v5-portrait' },
    { style: 'realistic', variation: 'v5-cartoon' },
    { style: 'realistic', variation: 'v6-artistic' },
    { style: 'realistic', variation: 'v6-realistic' }
  ];

  for (let i = 0; i < configs.length; i++) {
    const conf = configs[i];
    const formdata = new FormData();
    formdata.append('prompt', 'A modern contemporary Indian living room interior design, realistic scale, warm ambient lighting');
    formdata.append('aspect_ratio', '16:9');
    formdata.append('style', conf.style);
    if (conf.variation) formdata.append('variation', conf.variation);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}` },
        body: formdata
      });
      console.log(`Config ${i}: style=${conf.style}, variation=${conf.variation || 'none'} -> Status ${res.status}`);
      if (res.status === 200) {
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(`vyro-v2-test-${i}.png`, Buffer.from(buffer));
        console.log(`Saved vyro-v2-test-${i}.png!`);
      } else {
        const text = await res.text();
        console.log(`Error: ${text}`);
      }
    } catch (err) {
      console.log(`Failed: ${err.message}`);
    }
  }
}

testV2();
