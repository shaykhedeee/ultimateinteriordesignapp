import { migrate, backup, restore } from '../scripts/db-backup.mjs.js';

console.log(JSON.stringify({ migrated: migrate(), backup: backup() }, null, 2));
