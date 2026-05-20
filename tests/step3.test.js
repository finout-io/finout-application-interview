/**
 * STEP 3 — Bug report from a customer
 *
 * "Some of our EC2 costs are showing as 'Unallocated' in the team breakdown.
 *  We expect all EC2 spending to appear under Infrastructure or Infrastructure-East."
 *
 * These tests reproduce the issue. Your job:
 *   1. Run the tests and observe what fails.
 *   2. Find the root cause. Hint: the bug is NOT in your code.
 *   3. Fix it (code change, data fix, or vtag rule update — your call).
 *   4. Make both tests green.
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { getDb } from '../src/db.js';
import { TEAM_VTAG } from '../src/vtags.js';
import { runVtagSQL } from '../src/vtag-engine.js';

let db;
let rows;

beforeAll(() => {
  db = getDb();
  rows = runVtagSQL(db, TEAM_VTAG);
});

describe('[STEP 3] EC2 costs mis-tagged as Unallocated', () => {
  test('no row with an EC2-like service should be tagged Unallocated', () => {
    const wrongRows = rows.filter(
      r => r.team === 'Unallocated' && r.service.toLowerCase().includes('ec2')
    );

    if (wrongRows.length > 0) {
      // Print the offending rows to help you investigate
      console.log('\nMis-tagged rows:');
      wrongRows.forEach(r =>
        console.log(`  service="${r.service}"  region=${r.region}  account=${r.account_id}  cost=${r.cost}`)
      );
    }

    expect(wrongRows).toHaveLength(0);
  });

  test('total Unallocated cost should be less than $100 (only truly untagged services)', () => {
    // Legitimate Unallocated rows: S3 and CloudFront from non-Platform accounts.
    // If EC2 rows leak into Unallocated the total will be much higher.
    const unallocatedTotal = rows
      .filter(r => r.team === 'Unallocated')
      .reduce((sum, r) => sum + r.cost, 0);

    expect(unallocatedTotal).toBeLessThan(100);
  });
});
