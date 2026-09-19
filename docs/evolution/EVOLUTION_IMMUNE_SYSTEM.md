# Evolution Immune System

## Purpose

The Evolution Immune System adds durable, evidence-based governance to the Phase 13 protected-evaluation kernel. It wraps the existing gate machinery (`decideGate`, `decideGeneralizationGate`) in a thin immune layer that:

- **Derives immune signals from real measurements only** — no fabricated statistics, no invented cost/latency/energy.
- **Folds signals through a compact policy** into an assessment with disposition `CLEAR | WARNING | BLOCKED | QUARANTINED`.
- **Writes durable quarantine + assessment records** to the existing JSONL store (additive extension of `ExperimentRecord`).
- **Integrates at the promotion decision point** — after all Phase 13 gates, before eligibility → explicit promotion.
- **Never auto-promotes** — `ELIGIBLE` ≠ `PROMOTED`; `HOLD` ≠ `BLOCKED`; `QUARANTINED` ≠ `REJECTED`; `ROLLED_BACK` ≠ never-promoted.

## Signal Types (ImmuneSignalKind)

| Kind | Source | Measured? | Severity Range |
|------|--------|-----------|----------------|
| `QUALITY_REGRESSION` | Gate reject (success delta < 0) | Yes | HIGH |
| `GENERALIZATION_FAILURE` | Generalization gate FAIL/HOLD | Yes/No | HIGH/WARNING |
| `PROTECTED_CATEGORY_REGRESSION` | Gate protected-category reject | Yes | HIGH |
| `HIGH_VARIANCE` | repeatRuns variance > noise floor | Yes (only when repeatRuns ≥ 2) | WARNING |
| `EVIDENCE_INVALID` | Evidence hash mismatch | Yes | CRITICAL |
| `SUITE_MISMATCH` | Suite re-resolution hash differs | Yes | CRITICAL |
| `REPRODUCIBILITY_LIMITATION` | Stochastic engine (reproducibility="limited") | Yes | WARNING |
| `COST_REGRESSION` | Measured cost/latency/token delta | Only when measured | INFO/WARNING/HIGH |
| `LATENCY_REGRESSION` | Measured latency delta | Only when measured | INFO/WARNING/HIGH |
| `TOKEN_REGRESSION` | Measured token delta | Only when measured | INFO/WARNING/HIGH |
| `POLICY_FAILURE` | Safety threat scan / allowlist / privacy reject | Yes | CRITICAL |

**NOT_MEASURED signals**: When cost/latency/token/generalization evidence is unavailable, a signal is emitted with `measured: false` and severity `INFO`. **UNAVAILABLE ≠ PASS** — missing evidence never produces a CLEAR disposition.

## Severity Vocabulary

Fixed enum: `INFO < WARNING < HIGH < CRITICAL`. No intermediate tiers fabricated.

- `INFO` — measurement unavailable (NOT_MEASURED) or minor observation
- `WARNING` — gate HOLD, insufficient holdout, limited reproducibility, variance above noise
- `HIGH` — protected regression, generalization failure, quality regression
- `CRITICAL` — evidence invalid, suite mismatch, policy failure

## Assessment (ImmuneDisposition)

| Disposition | Trigger | Promotion |
|-------------|---------|-----------|
| `CLEAR` | No signals + gate `eligible` | Eligible; explicit promote still required |
| `WARNING` | Any WARNING signal, gate HOLD, or missing measurements (NOT_MEASURED) | Eligible-able; explicit promote required; policy re-check |
| `BLOCKED` | Any HIGH non-critical signal (protected regression, variance, gen failure) | **Blocked** — candidate cannot promote until cleared |
| `QUARANTINED` | Any CRITICAL signal (evidence invalid, suite mismatch, policy failure) | **Blocked + quarantined** — durable record, never auto-cleared |

**Non-collapse invariants** (test-enforced):
- `HOLD` (gate) → `WARNING`, **never** `BLOCKED`
- `QUARANTINED` (immune) ≠ `REJECTED` (gate) — different vocabularies, different semantics
- `ROLLED_BACK` → historical state only, **never** auto-quarantined

## Quarantine

- Separate append-only JSONL (`quarantine.jsonl`) alongside `evolution.jsonl`
- Record includes: `candidateId`, `mindId`, `problem` (signal kind), `severity`, `reason`, `evidenceRefs`, `decision` (`QUARANTINED | CLEARED_FROM_QUARANTINE | PROMOTED_FROM_QUARANTINE`), `quarantinedAt`, optional `resolvedAt`/`resolvedReason`
- **Immutable** — re-append same candidate preserves history (no silent overwrite)
- **Never deleted** — historical record of every quarantine event
- **Blocks promotion** — `promoteInStoreWithImmune` checks `isQuarantined()` and throws
- **Explicit clear/promote** — requires manual `CLEARED_FROM_QUARANTINE` or `PROMOTED_FROM_QUARANTINE` decision (no auto-clear)

## Promotion Integration

Conceptual order (test-enforced):

```
candidate
  ↓
evolution evaluation
  ↓
validation
  ↓
protected holdout
  ↓
generalization
  ↓
category regression
  ↓
immune assessment  ← NEW (Phase 14)
  ↓
promotion eligibility
  ↓
EXPLICIT promotion  ← always required (AUTO-PROMOTE = FALSE)
```

- If gate `reject` → no promotion (existing behavior preserved)
- If immune `BLOCKED`/`QUARANTINED` → promotion blocked, error with reason
- If immune `WARNING` → candidate promotable but explicit promote required
- If immune `CLEAR` → candidate eligible but explicit promote still required
- Existing benign promotion (Phase 13) unchanged — no regression

## Evidence Requirements

| Measurement | Required for | When Absent → NOT_MEASURED signal |
|-------------|--------------|-----------------------------------|
| Holdout evaluation | Generalization gate PASS | `GENERALIZATION_FAILURE` (WARNING, measured:false) |
| Cost/latency/token | Cost regression signals | `COST/LATENCY/TOKEN_REGRESSION` (INFO, measured:false) |
| Evidence hash | `EVIDENCE_INVALID` | — (always verified on read) |
| Suite hashes | `SUITE_MISMATCH` | — (verified on re-resolution) |
| Reproducibility | `REPRODUCIBILITY_LIMITATION` | — (recorded as "limited" when stochastic) |
| Repeat runs (≥2) | `HIGH_VARIANCE` | No signal if <2 runs (NOT_MEASURED, not fabricated) |

## Relationship to Phase 13

| Phase 13 | Phase 14 Immune Layer |
|----------|----------------------|
| `decideGate` → `eligible/reject/hold` | Consumes gate decision; `reject`/`hold` feed signals |
| `decideGeneralizationGate` → `PASS/HOLD/FAIL` | `FAIL` → `GENERALIZATION_FAILURE` (HIGH); `HOLD` → `GENERALIZATION_FAILURE` (WARNING, measured:false) |
| `verifyEvidenceHash` | `false` → `EVIDENCE_INVALID` (CRITICAL) |
| `computeSuiteVersion` re-resolution | Hash mismatch → `SUITE_MISMATCH` (CRITICAL) |
| `repeatRuns` variance | `perTaskVariance` > noise floor → `HIGH_VARIANCE` |
| `reproducibility` field | `"limited"` → `REPRODUCIBILITY_LIMITATION` |
| `promoteInStore` | Extended → `promoteInStoreWithImmune` (checks assessment + quarantine) |
| `ExperimentRecord` | Additive fields: `immuneAssessment`, `immunitySignals` |
| Durable store | Extended → `quarantine.jsonl` (append-only, isolated) |

## Limitations

- **Does not prove general intelligence improvement** — only governs evolutionary experiments.
- **Holdout evaluation** currently uses `"PASS"` as generalization decision; full holdout-driven generalization signal requires Phase 13 holdout integration.
- **Variance signal** uses pooled per-task variance; no population-level variance estimation.
- **Cost/latency/token** signals only fire when measurements exist; no predictive cost model.
- **Quarantine clear/promote** requires explicit operator action; no automated remediation loop.
- **Policy** is project engineering defaults (`defaultImmunityPolicy`); not a learned or adaptive policy.

## CLI Commands

```bash
# Current immune status (latest experiment assessment + signals + quarantine count)
seai evolve immune status --mind <name> [--json]

# Durable quarantine history (never deletes)
seai evolve immune quarantine --mind <name> [--json]

# Full trustworthy immune report for an experiment
seai evolve immune report <experimentId> --mind <name> [--json]
```

All commands support `--json` for machine-readable output. Human output is concise and evidence-backed.

## Real Experiment

Deterministic arithmetic-format suite (no model required):

```bash
SEAI_DATA_DIR=/tmp/seai-test seai evolve propose --mind test-mind --suite arithmetic-format-v1
```

Typical honest result: **WARNING** (not CLEAR) because cost/latency/token/generalization measurements are unavailable — demonstrating `UNAVAILABLE != PASS`.

## Files Changed

| File | Change |
|------|--------|
| `packages/core/src/schemas.ts` | +144 lines: `ImmuneSeveritySchema`, `ImmuneSignalSchema`, `ImmuneAssessmentSchema`, `ImmuneAssessmentGateSchema`, `QuarantineSchema`, types |
| `packages/mind/src/experiment.ts` | +670 lines: `ImmuneSignalKind`, `makeImmuneSignal`, `unmeasuredCost/latency/token`, `deriveImmuneSignals`, `ImmunityPolicy`, `defaultImmunityPolicy`, `severityFor`, `decideImmuneAssessment`, `quarantineStorePaths`, `appendQuarantine`, `readQuarantines`, `lastQuarantineForCandidate`, `isQuarantined`, `quarantineCandidate`, `promoteInStoreWithImmune` |
| `packages/mind/src/mind.ts` | +80 lines: immune assessment in `runExperiment` record; `evolve` returns immune fields |
| `packages/sdk/src/index.ts` | +15 lines: `immuneAssessment`, `immunitySignals` in `evolve` return type |
| `packages/cli/src/cli.ts` | +220 lines: `evolve immune status|quarantine|report` commands |
| `packages/mind/src/__tests__/immuneSystem.test.ts` | 24 tests: signal kinds, derivation, policy, assessment |
| `packages/mind/src/__tests__/immunePromotion.test.ts` | 13 tests: quarantine store, lifecycle, promotion integration |
| `packages/core/src/__tests__/immuneSchemas.test.ts` | 7 tests: schema round-trip, additive-only invariant |