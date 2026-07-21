# Interviewer hints (not for candidates by default)

This file is **not** linked from `README.md`, `STEPS.md`, or any Claude context file.
Only share a specific bullet if a candidate is genuinely stuck — sharing these up front
collapses the Step 1 "model understanding" signal, since the hints do most of the
reasoning for them.

## `evaluateCondition(row, condition)`

- `row[condition.field]` gives you the value from the row.
- Use the `OPERATORS` map at the top of the file.
- Every operator reads its operand from `condition.value` — arrays for `in`/`not_in`,
  scalars for `eq`/`contains`.
- Nothing in `OPERATORS` guards against an unknown `condition.operator`. Ask: what
  should happen if `condition.operator` isn't one of the four keys?

## `evaluateRule(row, rule)`

- AND logic: every condition in `rule.conditions` must be true.
- `Array.prototype.every` (or a plain loop with early return) is the natural shape.

## `applyVtagToRow(row, vtag)`

- Walk `vtag.rules` in order; return the `value` of the first rule whose conditions
  all match.
- If nothing matches, return `vtag.default`.

## `buildCaseWhenSQL(vtag)`

- Each rule → one `WHEN ... THEN` clause.
- Conditions within a rule are joined with `AND`.
- `in` / `not_in` → `field IN ('a','b','c')` / `field NOT IN (...)`.
- `eq` → `field = 'value'`.
- `contains` isn't used by `TEAM_VTAG`, but if asked: `field LIKE '%value%'`.
- `vtag.default` → the `ELSE` clause.
- Finish with `END AS <vtag.name>`.
- Escape single quotes in values: replace `'` with `''` (this is the interview's
  built-in SQL-injection discussion hook — `runVtagSQL` interpolates the generated
  string directly into a query).
