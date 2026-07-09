import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\07864430-bd4d-457b-9d44-e64a25f91412\\.system_generated\\logs\\transcript.jsonl';

async function searchLog() {
  if (!fs.existsSync(logPath)) {
    console.log('Log file not found at:', logPath);
    return;
  }
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  const matches = [];
  for await (const line of rl) {
    lineCount++;
    if (line.toLowerCase().includes('vyro') || line.toLowerCase().includes('imagine') || line.toLowerCase().includes('style_id') || line.toLowerCase().includes('variation')) {
      matches.push(`Line ${lineCount}: ${line.slice(0, 400)}`);
    }
  }
  fs.writeFileSync('scratch/log-matches.txt', matches.join('\n'));
  console.log(`Saved ${matches.length} matches to scratch/log-matches.txt`);
}

searchLog();
