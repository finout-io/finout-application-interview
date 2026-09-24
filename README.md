# Finout — Engineering Interview

## The domain

A cloud bill arrives with rows nobody owns — $2000 for a cluster several teams share.\
Someone has to decide which team pays for what. All rows without a team are **untagged**.

## What we'll do

**First you'll review some code.** The endpoint in `src/api/cost-allocation.ts` is up for merge: it compiles, `npm test` is green.\
We'll run it, then read it — tell us what you think, starting with whatever worries you most.\
No AI for this part — we want your read.

**Then we'll extend the code, with your assistant.**

Files - 
```
src/api/cost-allocation.ts   the code under review
src/db/mock-db.ts            existing code, not part of the review. The interface is the contract.
src/run-allocation.ts        npm run allocate — runs the happy path & prints an example
```

- Nothing is destructive. Edit the request, seed different rows;
- We care about how you reason, not how much you finish.
