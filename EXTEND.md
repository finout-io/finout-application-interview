# Extend it - Part two

**Use your AI assistant**\
Drive the assistant however you normally would — we'll ask you about any line you keep.

Today, all untagged rows in an account go to **one** team. Instead, support rules that split a cluster's cost across teams by percentage:

```
prod     →  team-x 60%, team-y 40%
staging  →  team-x 60%
```

## What to build

A function that takes untagged cost rows and split rules, and returns **what each team owes, plus what's left untagged.**

Run it on those two examples rules and `Wiz`'s rows - they are the `seedRows()` at the bottom of `src/db/mock-db.ts`.\
Reminder - `npm run allocate` prints them.

Yours to decide: the rule and result schema.\
Show it running.
