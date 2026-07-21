// ─────────────────────────────────────────────────────────────────────────────
// Supported operators
// ─────────────────────────────────────────────────────────────────────────────
const OPERATORS = {
  eq:       (rowVal, condVal) => rowVal === condVal,
  in:       (rowVal, condVal) => condVal.includes(rowVal),
  not_in:   (rowVal, condVal) => !condVal.includes(rowVal),
  contains: (rowVal, condVal) => String(rowVal).includes(condVal),
  between:  (rowVal, condVal) => rowVal >= condVal[0] && rowVal <= condVal[1],
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — implement these three functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single condition against a billing row.
 *
 * @param {Object} row       - one billing row from the DB
 * @param {Object} condition - { field, operator, value }
 * @returns {boolean}
 */
export function evaluateCondition(row, condition) {
  // TODO
}

/**
 * Evaluates all conditions in a rule (AND logic).
 * Returns true only if EVERY condition matches.
 *
 * @param {Object} row  - one billing row
 * @param {Object} rule - { conditions: [...], value: string }
 * @returns {boolean}
 */
export function evaluateRule(row, rule) {
  // TODO
}

/**
 * Returns the vtag value for a given row.
 * Walks rules in order — first match wins.
 * Falls back to vtag.default if no rule matches.
 *
 * @param {Object} row  - one billing row
 * @param {Object} vtag - { name, rules, default }
 * @returns {string}
 */
export function applyVtagToRow(row, vtag) {
  // TODO
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-written — DO NOT MODIFY
// Loads all rows into memory and maps applyVtagToRow over them.
// ─────────────────────────────────────────────────────────────────────────────
export function runVtagInMemory(db, vtag) {
  const rows = db.prepare('SELECT * FROM billing').all();
  return rows.map(row => ({
    ...row,
    [vtag.name]: applyVtagToRow(row, vtag),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — implement these two functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a SQL CASE WHEN expression from a vtag definition.
 *
 * Target output shape:
 *
 *   CASE
 *     WHEN service IN ('AmazonEC2','AmazonEKS') AND region = 'us-east-1' THEN 'Infrastructure-East'
 *     WHEN service IN ('AmazonEC2','AmazonEKS')                          THEN 'Infrastructure'
 *     ...
 *     ELSE 'Unallocated'
 *   END AS team
 *
 * Must handle every operator in the OPERATORS map above, not just the ones used by
 * the vtag you're testing against.
 *
 * @param {Object} vtag - { name, rules, default }
 * @returns {string}    - SQL fragment (the full CASE...END AS <name> expression)
 */
export function buildCaseWhenSQL(vtag) {
  // TODO
  throw new Error('buildCaseWhenSQL not implemented');
}

/**
 * Runs the vtag via a single SQL query instead of in-memory JS loops.
 * Must produce identical results to runVtagInMemory.
 *
 * @param {Object} db   - better-sqlite3 database instance
 * @param {Object} vtag
 * @returns {Array}
 */
export function runVtagSQL(db, vtag) {
  const caseExpr = buildCaseWhenSQL(vtag);
  return db.prepare(`SELECT *, ${caseExpr} FROM billing`).all();
}
