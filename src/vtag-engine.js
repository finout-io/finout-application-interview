// ─────────────────────────────────────────────────────────────────────────────
// Supported operators
// ─────────────────────────────────────────────────────────────────────────────
const OPERATORS = {
  eq:       (rowVal, condVal)  => rowVal === condVal,
  in:       (rowVal, condVals) => condVals.includes(rowVal),
  not_in:   (rowVal, condVals) => !condVals.includes(rowVal),
  contains: (rowVal, condVal)  => String(rowVal).includes(condVal),
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — implement these three functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single condition against a billing row.
 *
 * @param {Object} row       - one billing row from the DB
 * @param {Object} condition - { field, operator, value?, values? }
 * @returns {boolean}
 *
 * Hints:
 *  - row[condition.field] gives you the value from the row
 *  - use the OPERATORS map above
 *  - 'in' and 'not_in' use condition.values (array)
 *  - 'eq' and 'contains' use condition.value (string)
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
 * @param {Object} vtag - { name, rules, default }
 * @returns {string}    - SQL fragment (the full CASE...END AS <name> expression)
 *
 * Hints:
 *  - each rule  → one WHEN ... THEN clause
 *  - conditions within a rule are joined with AND
 *  - operator 'in'  → field IN ('a','b','c')
 *  - operator 'eq'  → field = 'value'
 *  - vtag.default   → ELSE clause
 *  - finish with    → END AS <vtag.name>
 *  - escape single quotes in values: replace ' with ''
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
