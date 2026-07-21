import { describe, test, expect, beforeAll } from 'vitest';
import { getDb } from '../src/db.js';
import { TEAM_VTAG } from '../src/vtags.js';
import { evaluateCondition, evaluateRule, applyVtagToRow, runVtagInMemory } from '../src/vtag-engine.js';

let db;
beforeAll(() => { db = getDb(); });

// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateCondition', () => {
  test('eq — matches exact value', () => {
    const row = { region: 'us-east-1' };
    expect(evaluateCondition(row, { field: 'region', operator: 'eq', value: 'us-east-1' })).toBe(true);
  });

  test('eq — rejects wrong value', () => {
    const row = { region: 'us-west-2' };
    expect(evaluateCondition(row, { field: 'region', operator: 'eq', value: 'us-east-1' })).toBe(false);
  });

  test('in — matches member of array', () => {
    const row = { service: 'AmazonEC2' };
    expect(evaluateCondition(row, { field: 'service', operator: 'in', value: ['AmazonEC2', 'AmazonEKS'] })).toBe(true);
  });

  test('in — rejects non-member', () => {
    const row = { service: 'AmazonS3' };
    expect(evaluateCondition(row, { field: 'service', operator: 'in', value: ['AmazonEC2', 'AmazonEKS'] })).toBe(false);
  });

  test('not_in — matches non-member', () => {
    const row = { service: 'AmazonS3' };
    expect(evaluateCondition(row, { field: 'service', operator: 'not_in', value: ['AmazonEC2', 'AmazonEKS'] })).toBe(true);
  });

  test('not_in — rejects member', () => {
    const row = { service: 'AmazonEC2' };
    expect(evaluateCondition(row, { field: 'service', operator: 'not_in', value: ['AmazonEC2', 'AmazonEKS'] })).toBe(false);
  });

  test('contains — matches substring', () => {
    const row = { usage_type: 'BoxUsage:t3.medium' };
    expect(evaluateCondition(row, { field: 'usage_type', operator: 'contains', value: 'BoxUsage' })).toBe(true);
  });

  test('unsupported operator throws a clear error', () => {
    const row = { service: 'AmazonEC2' };
    expect(() =>
      evaluateCondition(row, { field: 'service', operator: 'startswith', value: 'Amazon' })
    ).toThrow(/operator/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateRule', () => {
  const multiCondRule = {
    conditions: [
      { field: 'service', operator: 'in', value: ['AmazonEC2', 'AmazonEKS'] },
      { field: 'region',  operator: 'eq', value: 'us-east-1' },
    ],
    value: 'Infrastructure-East',
  };

  test('all conditions match → true', () => {
    expect(evaluateRule({ service: 'AmazonEC2', region: 'us-east-1' }, multiCondRule)).toBe(true);
  });

  test('first condition fails → false (AND logic)', () => {
    expect(evaluateRule({ service: 'AmazonS3', region: 'us-east-1' }, multiCondRule)).toBe(false);
  });

  test('second condition fails → false (AND logic)', () => {
    expect(evaluateRule({ service: 'AmazonEC2', region: 'us-west-2' }, multiCondRule)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('applyVtagToRow', () => {
  test('EC2 in us-east-1 → Infrastructure-East', () => {
    expect(applyVtagToRow({ service: 'AmazonEC2', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Infrastructure-East');
  });

  test('EKS in us-east-1 → Infrastructure-East', () => {
    expect(applyVtagToRow({ service: 'AmazonEKS', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Infrastructure-East');
  });

  test('EC2 in us-west-2 → Infrastructure', () => {
    expect(applyVtagToRow({ service: 'AmazonEC2', region: 'us-west-2', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Infrastructure');
  });

  test('RDS → Data', () => {
    expect(applyVtagToRow({ service: 'AmazonRDS', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Data');
  });

  test('DynamoDB → Data', () => {
    expect(applyVtagToRow({ service: 'AmazonDynamoDB', region: 'us-west-2', account_id: '444444444444' }, TEAM_VTAG))
      .toBe('Data');
  });

  test('Lambda → Backend', () => {
    expect(applyVtagToRow({ service: 'AWSLambda', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Backend');
  });

  test('APIGateway → Backend', () => {
    expect(applyVtagToRow({ service: 'AmazonAPIGateway', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Backend');
  });

  test('S3 from Platform account → Platform', () => {
    expect(applyVtagToRow({ service: 'AmazonS3', region: 'us-east-1', account_id: '111111111111' }, TEAM_VTAG))
      .toBe('Platform');
  });

  test('EC2 from Platform account → Infrastructure-East (service rule wins, not account rule)', () => {
    // Rule ordering: more specific service rules come before account_id catch-all.
    // EC2 must match Infrastructure-East even when account_id is a Platform account.
    expect(applyVtagToRow({ service: 'AmazonEC2', region: 'us-east-1', account_id: '111111111111' }, TEAM_VTAG))
      .toBe('Infrastructure-East');
  });

  test('S3 from unknown account → Unallocated', () => {
    expect(applyVtagToRow({ service: 'AmazonS3', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Unallocated');
  });

  test('unknown service → Unallocated', () => {
    expect(applyVtagToRow({ service: 'AmazonSomeNewService', region: 'us-east-1', account_id: '333333333333' }, TEAM_VTAG))
      .toBe('Unallocated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('runVtagInMemory — integration', () => {
  test('every row gets a team field', () => {
    const rows = runVtagInMemory(db, TEAM_VTAG);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toHaveProperty('team');
      expect(typeof row.team).toBe('string');
      expect(row.team.length).toBeGreaterThan(0);
    }
  });

  test('known AmazonEC2 row in us-east-1 tagged Infrastructure-East', () => {
    const rows = runVtagInMemory(db, TEAM_VTAG);
    const ec2East = rows.find(r => r.service === 'AmazonEC2' && r.region === 'us-east-1' && r.account_id === '333333333333');
    expect(ec2East).toBeDefined();
    expect(ec2East.team).toBe('Infrastructure-East');
  });

  test('Platform account S3 rows tagged Platform', () => {
    const rows = runVtagInMemory(db, TEAM_VTAG);
    const platformS3 = rows.filter(r => r.account_id === '111111111111' && r.service === 'AmazonS3');
    expect(platformS3.length).toBeGreaterThan(0);
    platformS3.forEach(r => expect(r.team).toBe('Platform'));
  });

  test('all team labels are valid (no undefined, no null)', () => {
    const rows = runVtagInMemory(db, TEAM_VTAG);
    const validTeams = new Set(['Infrastructure-East', 'Infrastructure', 'Data', 'Backend', 'Platform', 'Unallocated']);
    rows.forEach(r => expect(validTeams.has(r.team)).toBe(true));
  });
});
