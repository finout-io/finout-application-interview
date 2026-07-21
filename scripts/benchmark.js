// Optional — not part of the candidate exercise.
// Runs the candidate's own runVtagInMemory / runVtagSQL implementations against the
// large synthetic dataset (see generate-benchmark-data.js) to make the "SQL is faster"
// claim from Step 2 observable instead of theoretical.
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEAM_VTAG } from '../src/vtags.js';
import { runVtagInMemory, runVtagSQL } from '../src/vtag-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'billing-benchmark.db');

const db = new Database(DB_PATH, { readonly: true });
const rowCount = db.prepare('SELECT COUNT(*) AS n FROM billing').get().n;

console.log(`Benchmarking against ${rowCount} rows\n`);

const t0 = performance.now();
const memRows = runVtagInMemory(db, TEAM_VTAG);
const t1 = performance.now();

const sqlRows = runVtagSQL(db, TEAM_VTAG);
const t2 = performance.now();

console.log(`runVtagInMemory (JS loop): ${(t1 - t0).toFixed(1)} ms  (${memRows.length} rows)`);
console.log(`runVtagSQL      (CASE WHEN): ${(t2 - t1).toFixed(1)} ms  (${sqlRows.length} rows)`);
console.log(`\nSQL was ${((t1 - t0) / (t2 - t1)).toFixed(1)}x faster`);

db.close();
