# SE-AI Mind (Darwin 0.1) — Compression After

**Date:** 2026-09-11
**Status:** MIGRATION COMPLETE, VERIFIED

---

## Package Count

| Category | Count |
|----------|-------|
| packages/ | 6 (core, runtime, state, mind, sdk, cli) |
| runtimes/ | 0 (merged into runtime/adapters) |
| web/ | 1 |
| **TOTAL WORKSPACE PROJECTS** | **7** |

### Layout

```
packages/
├── core/       (@seai/core)
├── runtime/    (@seai/runtime)
├── state/      (@seai/state)
├── mind/       (@seai/mind)
├── sdk/        (@seai/sdk)
└── cli/        (@seai/cli)
web/            (@seai/web, independent)
```

---

## Source Metrics (measured 2026-09-11, wc -l)

| Metric | Value |
|--------|-------|
| TS source files in packages/ (incl. tests, excl. node_modules/dist) | 35 |
| TS impl files in packages/ (excl. tests) | 31 |
| Test files | 4 |
| Impl LOC in packages/ (wc -l, incl. blanks/comments) | 11,775 |
| Test LOC (wc -l) | 418 |
| Web TS/TSX files (excl. node_modules/dist/.next) | 29 |
| Total TS/TSX repo-wide (excl. node_modules/dist) | 76 |

### Per-file LOC (wc -l)

| File | LOC |
|------|-----|
| core/kernel.ts | 392 |
| core/schemas.ts | 713 |
| core/hardware.ts | 935 |
| core/telemetry.ts | 317 |
| core/security.ts | 586 |
| core/policy.ts | 410 |
| core/storage.ts | 367 |
| runtime/models.ts | 510 |
| runtime/providers.ts | 662 |
| runtime/routing.ts | 558 |
| runtime/adapters/ollama.ts | 232 |
| runtime/adapters/llamacpp.ts | 167 |
| runtime/adapters/mlx.ts | 71 |
| runtime/adapters/local.ts | 97 |
| state/memory.ts | 589 |
| state/skills.ts | 560 |
| state/tools.ts | 160 |
| state/genome.ts | 533 |
| mind/mind.ts | 589 |
| mind/cognition.ts | 454 |
| mind/compiler.ts | 574 |
| mind/evaluation.ts | 468 |
| mind/evolution.ts | 608 |
| mind/benchmark.ts | 514 |
| sdk/index.ts | 198 |
| cli/cli.ts | 487 |

---

## Package-Level Dependencies (from package.json)

| Package | Depends On |
|---------|-----------|
| core | zod, uuid (external only) |
| runtime | @seai/core |
| state | @seai/core |
| mind | @seai/core, @seai/runtime, @seai/state |
| sdk | @seai/core, @seai/runtime, @seai/state, @seai/mind |
| cli | @seai/sdk, @seai/core, @seai/runtime, @seai/state, @seai/mind |
| web | (no @seai/* runtime deps) |

**Total declared internal edges: 14** (0+1+1+3+4+5)

**Dependency direction is clean and acyclic:** core ← runtime, state ← mind ← sdk ← cli.

---

## Build Status (verified 2026-09-11)

```
$ pnpm build
packages/core build: Done
web build: Done (15 static pages)
packages/runtime build: Done
packages/state build: Done
packages/mind build: Done
packages/sdk build: Done
packages/cli build: Done
```

**Build time:** ~27.5s (full monorepo, incl. Next.js web)

---

## Test Status (verified 2026-09-11)

```
$ pnpm test
packages/core:  21 passed
packages/state:  8 passed
packages/runtime: 3 passed
packages/mind:   7 passed
sdk/cli/web:    no tests (passWithNoTests)
TOTAL: 39 passed, 0 failed
```

Tests exercise REAL behavior (no mocks for core logic):
- core: Result, errors, retry, stats, pagination, UUID
- state: engine construction, memory store→getById, tool capabilities, genome privacy denial
- runtime: manager construction, local runtime generate (STUB code path, labeled), ollama construction
- mind: config from template, runtime construction, deterministic pipeline, evaluation fail-closed

**Known limitation caught by tests:** `MemoryEntry` schema has no `mindId` field, so `repository.list({mindId})` cannot filter by mind. Test uses `getById` roundtrip and documents the limitation. Not fixed to avoid scope creep; flagged for next frontier.

---

## CLI Status (verified 2026-09-11)

```
$ node packages/cli/dist/cli.js --help        → WORKS (16 commands listed)
$ node packages/cli/dist/cli.js doctor        → WORKS (Apple M2 profile shown)
$ node packages/cli/dist/cli.js init --name DarwinTest → WORKS (Status: ready)
$ node packages/cli/dist/cli.js status        → WORKS (Status: ready)
$ node packages/cli/dist/cli.js hardware      → WORKS (JSON profile)
$ node packages/cli/dist/cli.js run "hello"   → HONEST FAILURE: "No execution method available"
```

The `run` failure is **preserved real behavior**, not a regression: cognition requires a configured model/runtime, none is configured by default, and the kernel refuses to fake intelligence. Documented as PARTIAL.

**CLI startup:** ~0.13–0.18s (`--help`)

---

## Web Status (verified 2026-09-11)

```
$ cd web && pnpm build → WORKS (15 static pages)
```

No `@seai/*` runtime imports in web/src (only CLI command strings in docs pages). No kernel → web dependency.

---

## What Changed Structurally

- Deleted 20 old package dirs + `runtimes/` (22 packages + 4 adapters removed as separate packages).
- Created 4 kernel packages (core, runtime, state, mind); kept sdk, cli, web.
- Moved 26 source modules into 24 files + 4 barrels + 4 tests (31 impl + 4 test).
- Updated all `@seai/*` imports to new package names; mind-internal cross-imports became relative (`./cognition.js`, etc.).
- Excluded `src/__tests__` and `*.test.ts` from all `tsconfig.json` builds.
- Removed stale build artifacts (root-level `.js`/`.d.ts`, `src/*.js`, `tsbuildinfo`) left from pre-compression builds.
- Updated `pnpm-workspace.yaml` (removed `runtimes/*`, `experiments/*`, `benchmarks/*`).

---

*After-state recorded 2026-09-11. All values measured, not estimated.*
