import Database from 'better-sqlite3';

const dbPath = './storage/spacious-venture.sqlite';
const db = new Database(dbPath);

const rows = db.prepare("SELECT * FROM reference_library LIMIT 5").all();
console.log('Reference Library Rows:', rows);
