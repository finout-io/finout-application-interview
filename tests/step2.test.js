import { describe, test, expect, beforeAll } from 'vitest';
import { getDb } from '../src/db.js';
import { TEAM_VTAG } from '../src/vtags.js';
import { buildCaseWhenSQL, runVtagSQL, runVtagInMemory } from '../src/vtag-engine.js';

let db;
beforeAll(() => { db = getDb(); });

// ─────────────────────────────────────────────────────────────────────────────
describe('buildCaseWhenSQL', () => {
  test('returns a non-empty string', () => {
    const sql = buildCaseWhenSQL(TEAM_VTAG);
    expect(typeof sql).toBe('string');
    expect(sql.length).toBeGreaterThan(0);
  });

  test('contains required SQL keywords', () => {
    const sql = buildCaseWhenSQL(TEAM_VTAG).toUpperCase();
    expect(sql).toContain('CASE');
    expect(sql).toContain('WHEN');
    expect(sql).toContain('THEN');
    expect(sql).toContain('ELSE');
    expect(sql).toContain('END');
  });

  test('generated SQL executes without error', () => {
    const caseExpr = buildCaseWhenSQL(TEAM_VTAG);
    expect(() => db.prepare(`SELECT *, ${caseExpr} FROM billing`).all()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('runVtagSQL — results match in-memory', () => {
  test('same row count', () => {
    const sqlRows = runVtagSQL(db, TEAM_VTAG);
    const memRows = runVtagInMemory(db, TEAM_VTAG);
    expect(sqlRows.length).toBe(memRows.length);
  });

  test('same team distribution', () => {
    const sqlRows = runVtagSQL(db, TEAM_VTAG);
    const memRows = runVtagInMemory(db, TEAM_VTAG);

    const countByTeam = (rows) =>
      rows.reduce((acc, r) => { acc[r.team] = (acc[r.team] ?? 0) + 1; return acc; }, {});

    expect(countByTeam(sqlRows)).toEqual(countByTeam(memRows));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('runVtagSQL — cost totals by team', () => {
  let rows;
  beforeAll(() => { rows = runVtagSQL(db, TEAM_VTAG); });

  const totalFor = (rows, team) =>
    rows.filter(r => r.team === team).reduce((sum, r) => sum + r.cost, 0);

  test('Infrastructure-East total cost', () => {
    expect(totalFor(rows, 'Infrastructure-East')).toBeCloseTo(794.00, 1);
  });

  test('Infrastructure total cost', () => {
    expect(totalFor(rows, 'Infrastructure')).toBeCloseTo(315.00, 1);
  });

  test('Data total cost', () => {
    expect(totalFor(rows, 'Data')).toBeCloseTo(386.25, 1);
  });

  test('Backend total cost', () => {
    expect(totalFor(rows, 'Backend')).toBeCloseTo(49.55, 1);
  });

  test('Platform total cost', () => {
    expect(totalFor(rows, 'Platform')).toBeCloseTo(143.00, 1);
  });
});
