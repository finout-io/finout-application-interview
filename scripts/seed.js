import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'billing.db');
const CSV_PATH = path.join(__dirname, '..', 'data', 'billing.csv');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Handle values that might contain commas (quoted fields)
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i]?.trim() ?? '';
      return obj;
    }, {});
  });
}

const db = new Database(DB_PATH);

db.exec(`
  DROP TABLE IF EXISTS billing;
  CREATE TABLE billing (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT    NOT NULL,
    service     TEXT    NOT NULL,
    account_id  TEXT    NOT NULL,
    region      TEXT    NOT NULL,
    usage_type  TEXT    NOT NULL,
    cost        REAL    NOT NULL
  );
`);

const csv = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCSV(csv);

const insert = db.prepare(
  'INSERT INTO billing (date, service, account_id, region, usage_type, cost) VALUES (?, ?, ?, ?, ?, ?)'
);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(row.date, row.service, row.account_id, row.region, row.usage_type, parseFloat(row.cost));
  }
});

insertMany(rows);
console.log(`✓ Seeded ${rows.length} rows into billing.db`);
db.close();
