# Trustworthy Evolution — Protected Evaluation, Holdout, Generalization & Evolution Trust

**Milestone:** Part 1 of 2 — "Planned: generalization trust on measured evidence"
**Date:** 2026-09-14
**Status:** ACTIVE — frontier milestone (kernel | docs | CLI). Website untouched (see below).
**Location:** `docs/evolution/PROTECTED_EVALUATION.md` (this doc) + `docs/architecture/EVOLUTION_MODEL.md`,
`EVOLUTION_GATES.md`, `EVOLUTION_EXPERIMENTS.md`, and `docs/evolution/PROTECTED_CATEGORY_REGRESSION.md`.

---

## Why this milestone (the honest gap)

`decideGate()` already rejects candidates on: success regression, holdout regression,
protected-category regression, and category regression (target-vs-global). What it does
NOT yet distinguish is **which task set a candidate may see and which it may not**:

- There is no explicit **validation set** — a fixed set that participates in the
  candidate-visible workload but is excluded from the evolution (training) signal, so a
  candidate cannot tune against it and then claim it as "seen".
- `runExperiment` has `holdoutTasks` (Phase 4) but the **role assignment is implicit**:
  the same `tasks` array can carry `holdout`/`protected` flags, and there is no suite
  role-resolution step proving a task is assigned to exactly ONE set.
- There is a suite **version hash** (`SuiteVersion`/`computeSuiteVersion`) but it is not a
  first-class, evidence-binding **reproducibility header** on every arm's cached/measured
  evidence, so a changed holdout task cannot invalidate stale evidence on read.
- There is **no regression matrix** with per-category *policies* (no-regression,
  bounded-regression, required-improvement, informational) — inspection accepts
  target-global deltas but can't show WHICH policy applied and whether it was satisfied.

The milestone closes exactly these four gaps with **additive, backward-compatible**
changes: nothing is removed, no gate is weakened, no evidence is invented.

## What already exists (reused, not rebuilt)

Runs fully on the existing kernel — I only ADD to it:

1. `ExperimentTask.category`, `ExperimentTask.protected`, `ExperimentTask.holdout`
   and `ExperimentSuite.holdoutTasks` — role *stamps* already present.
2. `hashExperimentTasks()`, `canonicalTaskRepr()`, `computeSuiteVersion()`,
   `SuiteVersion` (`taskSetHash` / `holdoutHash` / `contentHash`) — hashing helper set.
3. `reviewCandidateChanges()` + gate checks for success/holdout/protected/category
   regression, cost-latency, variance-SNR, small-N — the deterministic gate checks.
4. `ArmResult` (measurements, variance, confidence, per-category), `decideGate()`,
   `GateReport` with `decision: eligible|reject|hold` and `checks[]`.

## What I ADD

### A. Suite role resolution — `resolveSuiteRoles()`

Partitions `suite.tasks + suite.holdoutTasks` into exactly one of three dataset roles
plus a protected-category map, and rejects a suite that would assign a task to two roles
(that is suite-authoring corruption, not runtime honesty):

- `evolution` — the candidate-visible workload a candidate tunes against.
- `validation` — a fixed set excluded from the evolution signal; measures how a
  candidate does on tasks it never deliberately tuned to. (NEW: explicit role)
- `holdout` — the inviolate holdout: candidates NEVER see it; the only arm that can
  testify about generalization.
- `protectedCategories` — categories that must never regress on promotion.

Exit check: every task appears in exactly one set; every task's `category` that is listed
in `protectedCategories` is implicitly protected; and a candidate's evolution+validation
workload NEVER includes a holdout task (structural — not a hope).

### B. Suite reproducibility header — `computeSuiteVersion()` (bind into evidence)

Callers already hash suites; the milestone makes the version a first-class field on
`GateReport` + `ExperimentRecord` (`suiteVersion?: SuiteVersion`), and folds the
`taskSetHash` / `holdoutHash` / `contentHash` into the arm cache key so that:

- a changed holdout task → different `holdoutHash` → the cache key changes → stale
  candidate holdout evidence can never be served to a new experiment;
- `verifyEvidenceHash()` (already SHA-256 over measured evidence) now ALSO covers the
  suite identity, so replacing a suite/task set changes the evidence hash on read —
  tampering with measured evidence is detectable before any gate is consulted.

### C. Regression matrix + generalization metrics — `buildRegressionMatrix()`

Per-category rows over the EVOLUTION + VALIDATION set, each with a policy understood by
inspection:

- `no-regression` — candidate success must not drop below baseline for the category.
- `bounded-regression` — may regress within a small configurable budget.
- `required-improvement` — the observed delta must be >= minImprovement for the category.
- `informational` — measured and reported, never gates.

Together with `decideGate`'s target-vs-global checks this is the **category regression
matrix** the milestone wants, surfaced by the CLI.

### D. Generalization gate — `decideGeneralizationGate()` (PASS/HOLD/FAIL)

A dedicated gate over holdout evidence (this is what "protected evaluation" means here):
- requires a minimum number of holdout tasks (`minHoldoutTasks`, default 5) before it
  will ever produce PASS on generalization;
- requires holdout quality to not regress (already a reject check in `decideGate`) AND
  the candidate to hold/improve on the holdout arm relative to baseline;
- returns `generalization: "pass" | "hold" | "fail"` plus reasons, and influences the
  promotion gate: a candidate that passes evolution + protection but FAILS holdout
  generalization is REJECTED; one that HOLDS on generalization is held, not auto-promoted.

All three dispositions are honest labels over measured evidence — never invented.

## Files

| File | Change |
|------|--------|
| `packages/mind/src/experiment.ts` | Add `resolveSuiteRoles`, `computeSuiteVersion` caching + evidence binding, `buildRegressionMatrix`, `decideGeneralizationGate`, fold suite version into cache key + evidence hash; extend `GateReport`/`ExperimentRecord` with `suiteVersion` + `generalizationGate` |
| `packages/mind/src/mind.ts` | `runExperiment`: use `resolveSuiteRoles` for task partitioning + pass `suiteVersion`/holdout evidence through; CLI/`evolve` integration uses new fields |
| `packages/mind/src/cognition.ts` | Fold suite-context into cache key namespace (validation/holdout isolation, no stale reuse) |
| `packages/cli/src/cli.ts` | `seai evolve` validation/holdout flags + matrix/generalization output |
| `packages/mind/src/__tests__/protectedEvolution.test.ts` | NEW: role assignment exclusivity, suite version binding, generalization gate decisions, cache isolation, backward-compat (legacy suites still gate) |
| `docs/architecture/EVOLUTION_MODEL.md` + `EVOLUTION_GATES.md` + `EVOLUTION_EXPERIMENTS.md` + `docs/evolution/*` | Document roles (evolution/validation/holdout), matrix, generalization gate, reproducibility |
| `web/src/lib/content/*` | NONE — website already truthful (categories "additive-only", gate labels honest). Only factual corrections if this kernel work exposes a contradiction. |

## Verification

- `pnpm --filter @seai/core build` (already passing — schema additive change on disk)
- `pnpm -r build && pnpm test` — all 105 tests stay green (59 mind)
- `packages/mind` new test file: `resolveSuiteRoles` exclusivity, `buildRegressionMatrix`
  policies, `decideGeneralizationGate` dispositions, cache-key suite binding, backward compat
- CLI: run `seai evolve` on the live arithmetic suite; confirm gate output now includes
  generalization/matrix sections and unchanged decision for the promoted real candidate.

## Honesty rules (unchanged)

- No weakened gates. `decideGate` reject checks stay. Generalization FAIL → reject.
- No fabricated variance / confidence. HOLD means "not enough honest evidence".
- Holdout NEVER folds into candidate-visible evidence. The only arm allowed to speak to
  generalization is the holdout.
- `verifyEvidenceHash` gets suite binding — tampered evidence is caught on read.
