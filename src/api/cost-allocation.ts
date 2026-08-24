import { db } from '../db/mock-db.ts';

/** Populated by the auth middleware from the caller's session. */
export interface AuthContext {
  userId: string;
  accountId: string;
}

export interface MoveCostsRequest {
  accountId: string;
  targetTeam: string;
  reason: string;
}

export interface MoveCostsSummary {
  movedRowIds: string[];
  totalMovedUSD: number;
  targetTeam: string;
}

/** Assigns every untagged cost in an account to one team. */
export async function moveCostsToTeam(
  auth: AuthContext,
  req: MoveCostsRequest,
): Promise<MoveCostsSummary> {
  const rows = await db.findUntaggedCosts(req.accountId);

  const movedRowIds: string[] = [];
  let totalMovedUSD = 0;

  for (const row of rows) {
    await db.assignCostToTeam(row.id, req.targetTeam);
    movedRowIds.push(row.id);
    totalMovedUSD += row.cost;
  }

  await db.insertAuditEntry({
    accountId: auth.accountId,
    actorId: auth.userId,
    targetTeam: req.targetTeam,
    movedRows: movedRowIds.length,
    totalUSD: totalMovedUSD,
    reason: req.reason,
  });

  return { movedRowIds, totalMovedUSD, targetTeam: req.targetTeam };
}
