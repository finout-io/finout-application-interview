import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'billing.db');

let _db = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
  }
  return _db;
}
