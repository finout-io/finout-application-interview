# Finout — Engineering Interview

Everything is in-memory: nothing to provision, nothing you can break.

## The domain, in one paragraph

A cloud bill arrives with rows nobody owns — $2000 for a cluster several teams
share. Someone has to decide which team pays for what, and until they do, that
cost sits **untagged**.

## What we'll do

**First you'll review some code.** The endpoint in `src/api/cost-allocation.ts` is
up for merge: it compiles, `npm test` is green. We'll run it, then read it — tell us
what you think, starting with whatever worries you most. No AI for this part — we
want your read.

**Then you'll extend it, with your assistant.** The feature is in `EXTEND.md` — leave that
closed until we get there. Drive the assistant however you normally would — we'll
ask you about any line you keep.

```
src/api/cost-allocation.ts   the code under review
src/db/mock-db.ts            the repository it calls — existing code, not part of
                             what's under review. The interface is the contract,
                             and seedRows() at the bottom is the data
src/run-allocation.ts        npm run allocate — runs the happy path
tests/smoke.test.ts          setup check — npm test
EXTEND.md                    part two, for later
```

- Nothing is destructive. Edit the request, seed different rows;
  `db.reset(seedRows())` puts it back.
- We care about how you reason, not how much you finish.
