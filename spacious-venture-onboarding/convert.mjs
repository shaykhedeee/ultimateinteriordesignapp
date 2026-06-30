import fs from 'node:fs';
import path from 'node:path';

const filesToConvert = [
  'server/services/database-enhanced.js',
  'server/services/component-color-service.js',
  'server/services/fp-understanding-engine.js',
  'server/services/render-pipeline.js',
  'server/routes/renders-enhanced.js'
];

for (const file of filesToConvert) {
  let code = fs.readFileSync(file, 'utf8');
  
  // require to import
  code = code.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\(['"](.+?)['"]\);/g, (match, p1, p2) => {
    let importPath = p2;
    if (importPath.startsWith('.') && !importPath.endsWith('.js')) {
      importPath += '.js';
    }
    return `import ${p1} from '${importPath}';`;
  });
  
  // special case for database import
  code = code.replace(/import db from '\.\/database\.js';/g, 'import { getDb } from \'./database.js\';\nconst db = getDb;');

  // module.exports to export default
  code = code.replace(/module\.exports\s*=\s*([a-zA-Z0-9_]+);/g, 'export default $1;');
  
  // express router export
  code = code.replace(/module\.exports\s*=\s*router;/g, 'export default router;');
  
  // __dirname polyfill
  if (code.includes('__dirname')) {
    code = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n` + code;
  }
  
  // database.js prepare method invocation fix
  if (file === 'server/services/database-enhanced.js') {
    code = code.replace(/db\.prepare/g, 'db().prepare');
  }
  
  fs.writeFileSync(file, code);
  console.log('Converted', file);
}
