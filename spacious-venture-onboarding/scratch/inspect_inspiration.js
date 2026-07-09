import Database from 'better-sqlite3';

const dbPath = './storage/spacious-venture.sqlite';
const db = new Database(dbPath);

const rows = db.prepare("SELECT * FROM inspiration_references LIMIT 10").all();
console.log('Inspiration Reference Rows:', rows);
