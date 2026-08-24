/** Scratch runner — `npm run allocate`. Edit freely. */
import { db, seedRows, type CostRow } from './db/mock-db.ts';
import {
  moveCostsToTeam,
  type AuthContext,
  type MoveCostsRequest,
} from './api/cost-allocation.ts';

/** console.table, keyed by row id instead of an array index. */
const table = (rows: CostRow[]) =>
  console.table(Object.fromEntries(rows.map(({ id, ...rest }) => [id, rest])));

const auth: AuthContext = { userId: 'user-17', accountId: 'Wiz' };

const request: MoveCostsRequest = {
  accountId: 'Wiz',
  targetTeam: 'team-x',
  reason: 'Q3 shared infra split',
};

db.reset(seedRows());

console.log('--- request ---');
console.log({ auth, request });

console.log('\n--- rows before ---');
table(db.rows);

console.log(`\n--- untagged in ${request.accountId} (what the endpoint reads) ---`);
table(await db.findUntaggedCosts(request.accountId));

const callsBefore = db.callCount;
const startedAt = Date.now();

const summary = await moveCostsToTeam(auth, request);

console.log('--- returned ---');
console.log(summary);

console.log(
  `\n--- database access (${db.callCount - callsBefore} calls, ${Date.now() - startedAt}ms) ---`,
);
for (const call of db.callLog.slice(callsBefore)) console.log(`  ${call}`);

console.log('\n--- rows after ---');
table(db.rows);

console.log('--- audit trail after ---');
console.table(db.auditLog);
