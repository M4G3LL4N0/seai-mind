# SE-AI Mind — Memory Model

**Date:** 2026-09-11 (Darwin 0.1, post-compression)
**Status:** IMPLEMENTED (P0 isolation fix verified by tests)

---

## Principle

Every persisted memory record belongs to exactly one Mind. Ownership is a
structural property of the record — not a query convention — and every
retrieval path enforces it. Mind A can never read Mind B's memory.

---

## Ownership Boundary

```
MemoryEntry.mindId  (required, immutable, z.string().min(1))
       │ set once at capture()
       │ preserved by update() even if updates contain mindId
       │ checked by getById()/update()/delete() when a mindId is supplied
       ▼
storage row column `mind_id`  (serializer/deserializer in MemoryEngine)
       │ filtered at the repository layer: list({ mind_id })
       │ re-checked in memory by applyQueryFilters (defense in depth)
       ▼
retrieve(mindId, query)  — caller identity always wins over query.mindId
```

## Lifecycle (traced end to end)

| Stage | Location | Ownership handling |
|-------|----------|-------------------|
| Schema | `core/schemas.ts` → `MemoryEntrySchema` | `mindId` required; parse fails without it |
| Capture | `state/memory.ts` → `capture(mindId, …)` | `mindId` set on the entry before validation |
| Serialize | `MemoryEngine.serialize` | writes `mind_id: entry.mindId` (was: `metadata?.mindId \|\| ""`, which was always `""`) |
| Repository | `core/storage.ts` → `createRepository` | `list({ mind_id })` generates `WHERE mind_id = ?` |
| Storage | `MemoryStorageImpl.matchWhere` | generic `col = ? [AND …]` positional matching; unknown predicates fail CLOSED (previously: only `id = ?` matched, everything else matched ALL rows) |
| Deserialize | `MemoryEngine.deserialize` | reads `mind_id` back into `mindId` |
| Retrieve | `retrieve(mindId, query, ctx)` | forces `query.mindId = mindId`; storage filter + in-memory re-check |
| Direct ID | `getById(id, ctx, mindId?)` | denies on mismatch (fail closed) |
| Mutations | `update(…, mindId?)`, `delete(…, mindId?)` | deny on mismatch; `update` strips ownership transfer |
| Indexing | `getWorkingMemory(mindId)` | in-memory Map keyed by mindId (already scoped) |
| Snapshots | `createSnapshot`/`restoreSnapshot` | scoped retrieve + capture-through-mindId |

## Related fixes in the same pass (storage layer)

- `matchWhere` now handles conjunctive equality instead of only `id = ?`.
  Side effect (intended): `getSkillsByMind` / `getGenomesByMind` / limit
  enforcement (`maxSkillsPerMind`, `maxGenomesPerMind`) now actually filter
  instead of silently matching everything. Genome already carried `mindId`
  and is now truly scoped. Skills scope via `provenance.createdBy`
  (pre-existing design, unchanged).
- `SELECT COUNT(*)` now returns a real count (was: first row → `count()`
  always 0, so genome/skill limits were unenforceable).
- `LIMIT ? OFFSET ?` is now honored by `all()` (was: ignored).
- `UPDATE … SET … WHERE …` now matches WHERE against trailing params and
  applies SET assignments (was: matched `id` against the first SET value
  AND applied an empty update — a double silent no-op, so `retrieve()`'s
  recency/frequency writes and `consolidate()` state changes never persisted).

## What is NOT yet isolated (out of P0 scope)

- Skills are scoped by `provenance.createdBy` (creator user), not by Mind.
  A per-Mind skill registry is future work.
- `MemoryEntry` carries no per-record privacy classification; access control
  is enforced via `SecurityContext` at call time, not stored on the record.

## Verification

`packages/state/src/__tests__/smoke.test.ts` → "state/memory ISOLATION (P0)":
create Mind A + Mind B → store A1/A2/B1 → retrieve A returns exactly
{A1,A2}, retrieve B returns exactly {B1} → searchText scoped → cross-Mind
`getById` denied → `searchSimilar` scoped → ownership immutable on update →
cross-Mind update/delete denied → spoofed `query.mindId` does not widen scope.

*Memory model defined and verified 2026-09-11.*
