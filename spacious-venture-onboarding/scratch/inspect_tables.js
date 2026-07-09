import Database from 'better-sqlite3';

const dbPath = './storage/spacious-venture.sqlite';
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log('Tables in database:', tables.map(t => t.name));

tables.forEach(t => {
  const fk = db.prepare(`PRAGMA foreign_key_list(${t.name})`).all();
  if (fk.length > 0) {
    console.log(`Foreign keys for ${t.name}:`, fk);
  }
});
