# Steps

## Step 1 — Implement rule evaluation

Open `src/vtag-engine.js`. Implement the three functions marked `TODO`:

1. `evaluateCondition(row, condition)` — does this row satisfy one condition?
2. `evaluateRule(row, rule)` — does this row satisfy ALL conditions in a rule?
3. `applyVtagToRow(row, vtag)` — walk rules in order, return first match (or default)

Run tests:
```bash
npm test
```

All tests in `step1.test.js` must pass before moving on.

---

## Step 2 — Generate SQL instead of evaluating in JS

`runVtagInMemory` loads every row into JavaScript memory and evaluates rules in a loop.
This works, but at scale (millions of rows) it becomes a bottleneck.

Implement `buildCaseWhenSQL(vtag)` to generate an equivalent SQL `CASE WHEN` expression,
so the database does the work instead.

Example of what the output should look like:

```sql
CASE
  WHEN service IN ('AmazonEC2','AmazonEKS') AND region = 'us-east-1' THEN 'Infrastructure-East'
  WHEN service IN ('AmazonEC2','AmazonEKS')                          THEN 'Infrastructure'
  WHEN service IN ('AmazonRDS','AmazonDynamoDB')                     THEN 'Data'
  WHEN service IN ('AWSLambda','AmazonAPIGateway')                   THEN 'Backend'
  WHEN account_id IN ('111111111111','222222222222')                  THEN 'Platform'
  ELSE 'Unallocated'
END AS team
```

`runVtagSQL` is already wired up — once `buildCaseWhenSQL` works, `runVtagSQL` works.

Run tests:
```bash
npm test
```

All tests in `step2.test.js` must pass before moving on.

---

## Step 3 — Debug a customer complaint

*(Revealed by interviewer)*

Run:
```bash
npm run test:step3
```

A customer reports that some of their EC2 costs appear as "Unallocated" in the team breakdown.
The failing tests reproduce the issue.

Your job: find the root cause and fix it.
The bug is **not** in your rule evaluation logic.
