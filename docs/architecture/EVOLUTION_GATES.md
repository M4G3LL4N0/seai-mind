# SE-AI Mind — Evolution Gates

**Date:** 2026-09-11 (Darwin 0.1), extended 2026-09-13
**Status:** IMPLEMENTED (`decideGate()` in `mind/src/experiment.ts`)

---

## Decision Table

| Decision | Meaning | When |
|----------|---------|------|
| `eligible` | May be promoted by an explicit operation | quality delta ≥ threshold AND no reject-level failure AND no hold-level failure |
| `reject` | Must not be promoted | worse quality/success, safety or privacy failure, target-category regression, invalid comparison, tampered evidence |
| `hold` | Inconclusive; keep observing | no improvement but no regressions, noise-level signal, insufficient data, or unavailable metrics |

## Checks (each returns pass/fail + human-readable details)

| Check | Severity | What it actually does |
|-------|----------|----------------------|
| `safety-threat-scan` | reject | `detectThreats()` over serialized changes |
| `safety-allowlist` | reject | top-level keys ⊆ `{cognitionConfig, suite}`; cognition sub-keys ⊆ `{deterministicFormat, systemPromptExtra}` with `deterministicFormat ∈ {raw, json}` and system prompt ≤ 2000 chars; all prompt candidates (Phase 1) |
| `privacy-config` | reject | rejects `memory`/`policies`/`security`/`privacy` paths |
| `regression-success` | reject | candidate success rate must not drop below baseline |
| `quality-improvement` | reject if worse, hold if inconclusive | delta vs `minQualityImprovement` (default 0.05) |
| `cost-latency` | hold | sub-100ms absolute deltas pass as measurement noise; larger increases beyond the 50% ratio budget hold; unavailable data passes with an explicit "no claim" note |
| `cost-tokens` | hold | token increases beyond 10% of baseline hold (legacy proportional policy); all-null tokens pass with "no token-cost claim made". An absolute zero-increase rule was tried and rejected: it bans every prompt candidate by construction, since longer prompts strictly cost more tokens |
| `reproducibility` | reject | both arms ran the identical workload with raw evidence preserved |
| `holdout-regression` (Phase 4) | reject | candidate must not regress on holdout quality/success vs baseline holdout arm |
| `protected-<category>-regression` (Phase 3) | reject | protected categories must never regress |
| `variance-confidence` (Phase 6/10) | hold | when repeated runs are measured, the quality signal must exceed `varianceSignalToNoise` × pooled per-task variance; variance on only one arm holds; deterministic arms (no variance) pass by construction |
| `small-sample` (Phase 6) | hold | fewer than 3 tasks measured → insufficient statistical power |
| `category-<name>-regression` (Phase 6/11) | reject | target-vs-global: candidate must not regress on ANY measured category beyond `maxCategoryRegression` (default 0.10) |

## Configurable Thresholds (`GateThresholds`, Phase 7)

`EvolutionConfig.gateThresholds` (or per-call `runExperiment({ gateThresholds })`)
overrides `decideGate()` defaults:

- `minQualityImprovement` — quality gate (default 0.05)
- `maxLatencyIncreaseRatio` — latency budget (default 0.50)
- `maxHoldoutRegression` — holdout quality budget (default 0.05)
- `maxProtectedRegression` — protected category budget
- `maxCategoryRegression` — any-category budget (default 0.10)
- `varianceSignalToNoise` — noise threshold multiplier (default 2.0)

## Repeated-Run Variance (Phase 9-10)

- `runExperiment({ repeatRuns: n })` runs every task `n` times per arm; every
  run is a real execution preserved as raw evidence with `runIndex`.
- Per-task variance = Bernoulli variance `p(1-p)` averaged over tasks with
  ≥ 2 runs. Confidence: `high` (< 0.05), `medium` (< 0.15), `low`, and
  `n/a` for single-run or empty arms.
- **Cache integrity rule:** when `repeatRuns > 1` the experiment cognition
  runs with `enableCache: false`. Cached repeats are NOT measurements —
  identical latency + identical output would be a cache artifact masquerading
  as "high confidence", so repeated-run experiments force independent
  executions.

## Evidence Immutability (Phase 12-13)

- Before a record is persisted it is stamped with `evidenceHash`: a SHA-256
  over ONLY the immutable evidence (suite, candidate id, per-arm measurements,
  deltas, gate decision + checks).
- Lifecycle fields (promotion/rollback/lineage/timestamps) are excluded:
  a legitimately lifecycle-updated record still verifies.
- `readExperimentHistory()` verifies every line on read; a line whose
  signature does not match its payload is **excluded** — never silently
  accepted. Legacy (unsigned) records are tolerated.
- `seai evolve verify --mind <name>` and `verifyHistoryIntegrity()` report
  lines total / verified / legacy-unsigned / tampered.

## Promotion Rules (Phase 5)

- Default `autoPromote = false`; `runExperiment()` NEVER promotes.
- Only `promoteExperiment()` / `promoteInStore()` move CANDIDATE → PRODUCTION,
  and only for `eligible` records with no active promotion.
- Re-promotion after rollback is legal and creates a NEW version (branch
  continuation); promoting an already-active promotion is refused.
- Every promotion/rollback writes lineage + audit events
  (`EVOLUTION_PROMOTED` / `EVOLUTION_ROLLBACK`) and updates the durable
  active pointer.

---

*Gates verified 2026-09-13: reject/hold/eligible matrix, variance-confidence,
small-sample, target-vs-global, evidence-hash integrity, and tamper-detection
tests green (104 tests across all packages). First trustworthy live experiment
recorded a HOLD on noise-level +3% quality and +16.7% token cost — the gate
refused to promote on a non-significant signal.*