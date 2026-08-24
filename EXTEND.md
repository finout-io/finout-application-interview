# Extend it

*Part two. Leave this closed until we get there.*

Today every untagged row in an account goes to **one** team. Instead, a rule says a
cluster's cost splits across teams by percentage:

```
prod     →  team-x 60%, team-y 40%
staging  →  team-x 60%
```

## What to build

A function that takes untagged cost rows and split rules, and returns **what each
team owes, plus what's left untagged.**

Run it on those two rules and `Wiz`'s untagged rows — `$1200` and `$800` of `prod`,
`$450` and `$300` of `staging`, `$90` of `data`, so `$2840` in total. That's the same
`$2840` the endpoint moves today, and it should still all be accounted for when
you're done.

Then one test — you pick which case is worth pinning.

The rows are `seedRows()` at the bottom of `src/db/mock-db.ts`, and `npm run
allocate` prints them.

Yours to decide: the rule and result types, where the rules come from, and whether
any of this touches the database.

Show it running. Use your assistant — we'll ask you about any line you keep.
