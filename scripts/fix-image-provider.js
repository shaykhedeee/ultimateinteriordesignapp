const fs = require('fs');
const target = 'server/services/image-provider.js';
let content = fs.readFileSync(target, 'utf8');

const fixes = [
  {
    match: /Authorization:[^\n]*\$\{[A-Z_]+\}[^\n]*/,
    replace: "Authorization: `Bearer ${process.env.${matchKey}}`",
    detect(m) {
      const mm = m[0].match(/\$\{([A-Z_]+)\}/);
      this.matchKey = mm ? mm[1] : 'KEY';
      return !!mm;
    }
  }
];

// Manual replacements for known broken fragments
const manual = [
  {
    from: `const openai = new OpenAI({ apiKey: proces..._KEY });`,
    to: `const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });`
  },
  {
    from: `headers: process.env.POLLINATIONS_API_KEY ? { Authorization: *** ${process.env.POLLINATIONS_API_KEY}` } : {}`,
    to: `headers: process.env.POLLINATIONS_API_KEY ? { Authorization: \`Bearer ${process.env.POLLINATIONS_API_KEY}\` } : {}`
  }
];

for (const fix of manual) {
  if (content.includes(fix.from)) {
    content = content.replace(fix.from, fix.to);
    console.log('fixed:', fix.from.slice(0, 70));
  }
}

fs.writeFileSync(target, content, 'utf8');
console.log('wrote', target);
console.log('remaining Authorization fragments:', (content.match(/Authorization:[^\n]*\*\*\*/g) || []).length);
console.log('remaining proces... fragments:', (content.match(/proces\.\.\./g) || []).length);
