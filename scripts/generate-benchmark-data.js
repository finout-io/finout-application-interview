// Optional — not part of the candidate exercise.
// Generates a large synthetic billing dataset so the interviewer can demo, live,
// why the SQL approach (Step 2) beats the JS-loop approach (Step 1) at scale.
// Never touches data/billing.db (the 35-row interview dataset).
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'billing-benchmark.db');

const ROW_COUNT = parseInt(process.argv[2] ?? '500000', 10);

const SERVICES = ['AmazonEC2', 'AmazonEKS', 'AmazonRDS', 'AmazonDynamoDB', 'AWSLambda', 'AmazonAPIGateway', 'AmazonS3', 'AmazonCloudFront'];
const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1'];
const ACCOUNTS = ['111111111111', '222222222222', '333333333333', '444444444444', '555555555555'];

function randomRow() {
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const account_id = ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)];
  const cost = Math.round(Math.random() * 500 * 100) / 100;
  return {
    date: '2024-01-01',
    service,
    account_id,
    region,
    usage_type: `Usage:${service}`,
    cost,
  };
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

const insert = db.prepare(
  'INSERT INTO billing (date, service, account_id, region, usage_type, cost) VALUES (?, ?, ?, ?, ?, ?)'
);

const insertMany = db.transaction((count) => {
  for (let i = 0; i < count; i++) {
    const row = randomRow();
    insert.run(row.date, row.service, row.account_id, row.region, row.usage_type, row.cost);
  }
});

insertMany(ROW_COUNT);
console.log(`✓ Seeded ${ROW_COUNT} synthetic rows into data/billing-benchmark.db`);
db.close();
