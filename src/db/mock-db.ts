/**
 * In-memory stand-in for the production repository. Not part of what's under
 * review — it is existing code the endpoint was written against.
 *
 * `CostRepository` below is the contract; start there. The `MockDb` class under
 * it behaves exactly as the real repository does, so it is where to look when
 * you want to know what a method actually does rather than what it is claimed
 * to do.
 *
 * To exercise a failure path, tell the mock to reject writes to one row:
 * `db.failOnRowId = 'row-3'`.
 */

export interface CostRow {
  id: string;
  accountId: string;
  /** Team that owns this cost. `''` means untagged — nobody owns it yet. */
  team: string;
  cluster: string;
  cost: number;
}

export interface AuditEntry {
  accountId: string;
  actorId: string;
  targetTeam: string;
  movedRows: number;
  totalUSD: number;
  reason: string;
}

export interface CostRepository {
  /** Untagged rows in this account — nobody owns them yet. */
  findUntaggedCosts(accountId: string): Promise<CostRow[]>;

  /** One row, one round trip. */
  assignCostToTeam(rowId: string, team: string): Promise<void>;

  /** Many rows, still one round trip. */
  assignCostsToTeam(updates: { rowId: string; team: string }[]): Promise<void>;

  /** Append to the audit trail. One round trip. */
  insertAuditEntry(entry: AuditEntry): Promise<void>;

  /** Runs `fn` atomically. If it throws, every write inside it is discarded. */
  withTransaction<T>(fn: (tx: CostRepository) => Promise<T>): Promise<T>;
}

// ---------------------------------------------------------------------------
// The implementation. Nothing under review touched this file, so it is a
// reliable reference for what the repository actually does.
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MockDb implements CostRepository {
  rows: CostRow[] = [];
  auditLog: AuditEntry[] = [];
  callLog: string[] = [];

  /** Simulated round-trip cost per call. */
  latencyMs = 10;

  /** When set, writes touching this row reject. */
  failOnRowId: string | null = null;

  reset(rows: CostRow[] = []): void {
    this.rows = rows.map((r) => ({ ...r }));
    this.auditLog = [];
    this.callLog = [];
    this.failOnRowId = null;
  }

  get callCount(): number {
    return this.callLog.length;
  }

  async findUntaggedCosts(accountId: string): Promise<CostRow[]> {
    await this.roundTrip(`findUntaggedCosts(${accountId})`);
    return this.rows.filter((r) => r.accountId === accountId && r.team === '').map((r) => ({ ...r }));
  }

  async assignCostToTeam(rowId: string, team: string): Promise<void> {
    await this.roundTrip(`assignCostToTeam(${rowId})`);
    this.write(rowId, team);
  }

  async assignCostsToTeam(updates: { rowId: string; team: string }[]): Promise<void> {
    await this.roundTrip(`assignCostsToTeam(${updates.length} rows)`);
    for (const u of updates) this.write(u.rowId, u.team);
  }

  async insertAuditEntry(entry: AuditEntry): Promise<void> {
    await this.roundTrip('insertAuditEntry');
    this.auditLog.push({ ...entry });
  }

  async withTransaction<T>(fn: (tx: CostRepository) => Promise<T>): Promise<T> {
    const rowSnapshot = this.rows.map((r) => ({ ...r }));
    const auditSnapshot = this.auditLog.map((a) => ({ ...a }));
    try {
      return await fn(this);
    } catch (err) {
      this.rows = rowSnapshot;
      this.auditLog = auditSnapshot;
      throw err;
    }
  }

  private async roundTrip(label: string): Promise<void> {
    this.callLog.push(label);
    await sleep(this.latencyMs);
  }

  private write(rowId: string, team: string): void {
    if (rowId === this.failOnRowId) throw new Error(`write conflict on row ${rowId}`);
    const row = this.rows.find((r) => r.id === rowId);
    if (!row) throw new Error(`no such row: ${rowId}`);
    row.team = team;
  }
}

export const db = new MockDb();

/** Two customer accounts, so cross-account behaviour is observable. */
export function seedRows(): CostRow[] {
  return [
    { id: 'row-1', accountId: 'Wiz', team: '', cluster: 'prod', cost: 1200 },
    { id: 'row-2', accountId: 'Wiz', team: '', cluster: 'prod', cost: 800 },
    { id: 'row-3', accountId: 'Wiz', team: '', cluster: 'staging', cost: 450 },
    { id: 'row-4', accountId: 'Wiz', team: '', cluster: 'staging', cost: 300 },
    { id: 'row-5', accountId: 'Wiz', team: '', cluster: 'data', cost: 90 },
    { id: 'row-6', accountId: 'Elastic', team: '', cluster: 'prod', cost: 5000 },
    { id: 'row-7', accountId: 'Elastic', team: '', cluster: 'search', cost: 2300 },
  ];
}
