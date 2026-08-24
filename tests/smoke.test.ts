/** Setup check — `npm test`. Should be green on a fresh clone. */
import { describe, expect, it, beforeEach } from 'vitest';

import { MockDb, seedRows } from '../src/db/mock-db.ts';
import { moveCostsToTeam } from '../src/api/cost-allocation.ts';

describe('mock repository', () => {
  let db: MockDb;

  beforeEach(() => {
    db = new MockDb();
    db.latencyMs = 0;
    db.reset(seedRows());
  });

  it('finds only untagged rows, and only for the given account', async () => {
    const rows = await db.findUntaggedCosts('Wiz');
    expect(rows.map((r) => r.id)).toEqual(['row-1', 'row-2', 'row-3', 'row-4', 'row-5']);
  });

  it('assigns a team to one row', async () => {
    await db.assignCostToTeam('row-1', 'team-x');
    expect(db.rows.find((r) => r.id === 'row-1')).toMatchObject({ team: 'team-x' });
  });

  it('assigns many rows in a single round trip', async () => {
    await db.assignCostsToTeam([
      { rowId: 'row-1', team: 'team-x' },
      { rowId: 'row-2', team: 'team-x' },
    ]);
    expect(db.callCount).toBe(1);
    expect(db.rows.filter((r) => r.team === 'team-x')).toHaveLength(2);
  });

  it('rolls back every write when a transaction throws', async () => {
    const before = structuredClone(db.rows);

    await expect(
      db.withTransaction(async (tx) => {
        await tx.assignCostToTeam('row-1', 'team-x');
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(db.rows).toEqual(before);
  });

  it('can be told to fail on a specific row', async () => {
    db.failOnRowId = 'row-2';
    await expect(db.assignCostToTeam('row-2', 'team-x')).rejects.toThrow(/write conflict/);
  });
});

describe('the endpoint under review', () => {
  it('runs its happy path end to end', async () => {
    const { db } = await import('../src/db/mock-db.ts');
    db.latencyMs = 0;
    db.reset(seedRows());

    const summary = await moveCostsToTeam(
      { userId: 'user-1', accountId: 'Wiz' },
      { accountId: 'Wiz', targetTeam: 'team-x', reason: 'smoke test' },
    );

    expect(summary).toMatchObject({
      targetTeam: 'team-x',
      movedRowIds: expect.any(Array),
      totalMovedUSD: expect.any(Number),
    });
  });
});
