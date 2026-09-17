# Phase 14: Evolution Immune System + Governed Candidate Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the Phase 13 protected-evaluation kernel in a durable immune system — typed immune signals, policy-driven severity, an immune assessment that can CLEAR / WARNING / BLOCKED / QUARANTINED a candidate, durable quarantine records, and a promotion integration that never bypasses existing gates and always requires explicit promotion.

**Architecture:** Reuse the Phase 13 gate machinery (`decideGate` + `decideGeneralizationGate`) as the hard integrity layer. Build a NEW thin immune layer ON TOP that (a) derives immune signals from real measurements, gate reports, evidence hashing, suite versions, and reproducibility; (b) folds them through a compact policy into an assessment; (c) writes durable quarantine + assessment records to the EXISTING durable JSONL store (extend `ExperimentRecord` additively — never replace). All in the existing 7-package architecture (`core`, `cli`, `mind`); NO new package, NO schema replacement.

**Tech Stack:** TypeScript (strict), zod (core schemas), Node CLI (commander-style), vitest (tests), `pnpm` only. Provider-neutral; Ollama optional; valid on 8GB M2.

## Global Constraints

(From the Phase 14 milestone; verbatim intent preserved.)
- ADD / EXTEND / CONNECT / IMPROVE ONLY — never replace/rebuild/delete working machinery, never duplicate abstractions.
- Never weaken existing gates. Immune layer is additive to the Phase 13 kernel.
- UNAVAILABLE != PASS: missing holdout/cost/policy/energy measurements must classify as `NOT_MEASURED`, never silently success.
- No auto-promotion; promotion always explicit. ELIGIBLE is not PROMOTED.
- Do not collapse HOLD into BLOCKED; do not collapse QUARANTINED into REJECTED; do not collapse HELD into FAILED; ROLLED_BACK is not never-promoted.
- No fabricated measurements/statistics/energy/cost; no fake production monitoring.
- 7-unit architecture preserved. No eighth package.
- `pnpm` only, preserve `.env.local`, no npm lockfile, no Vercel, no deploy, no push.
- Additive-only schemas: never remove a category/field once present.
- Quarantined candidates are never deleted, never silently overwritten. Quarantine is historical state.
- Reuse existing policy/evidence/event abstractions; do not invent a second policy engine or second evidence store.

---

## Architecture Decision Record (locked BEFORE impl)

**Where does the immune layer live?**
- `packages/mind/src/experiment.ts` already owns: gates, evidence hashing, suite versioning, promotion/rollback, durable store. → The immune assessment, immune policy, and quarantine live here, as pure functions + durable store extensions (single cohesive home, matches existing single-file cohesion).
- `packages/mind/src/mind.ts` already owns the orchestration (`runExperiment`, promotion-path). → The immune assessment is invoked at the promotion decision point (after gate, before eligibility).
- `packages/core/src/schemas.ts` owns zod schemas. → Add `ImmuneSignalSchema`, `ImmuneAssessmentSchema`, `ImmuneSeveritySchema`, `QuarantineSchema` (additive; no changes to existing schemas' field meaning).
- `packages/cli/src/cli.ts` owns CLI. → Add `evolve immune status|quarantine|report` (compact) + `--json` where it aids inspection.

**What is CONNECTED (not re-implemented)?**
- `decideGeneralizationGate` → already returns `PASS/HOLD/FAIL`. Its FAIL = regression on holdout → immune signal `GENERALIZATION_FAILURE`; HOLD → `INSUFFICIENT_GENERALIZATION` (severity INFO/WARNING per policy).
- `decideGate` returns `GateReport { decision: eligible|reject|hold; checks; reasons }` and already consumes `holdoutResults`/`protectedResults`/`categoryResults`. Its `reject` → `PROTECTED_CATEGORY_REGRESSION` or `QUALITY_REGRESSION`; `hold` → insufficient evidence signal.
- `computeEvidenceHash` / `verifyHistoryIntegrity` / `verifyEvidenceRegistration` → a hash-verify failure IS the `EVIDENCE_INVALID` signal source (never re-derive).
- `computeSuiteVersion` + `suiteVersion` on records → a `taskSetHash`/`holdoutHash` mismatch when re-resolving a suite IS the `SUITE_MISMATCH` signal source.
- `reproducibility: "full" | "limited"` on record → `REPRODUCIBILITY_LIMITATION` signal (Phase 7 sampling). HIGH_VARIANCE comes from Phase 9 `repeatRuns` variance statistics — only when actually measured; otherwise `NOT_MEASURED`.
- `rollbackInStore` / `applyRollback` → a candidate previously rolled back records `ROLLED_BACK` disposition (historical, still intact).

---

## File Inventory (exact, per skill)

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/core/src/schemas.ts` | modify (additive) | `ImmuneSeveritySchema`, `ImmuneSignalSchema`, `ImmuneAssessmentSchema`, `QuarantineSchema`, types |
| `packages/mind/src/experiment.ts` | modify (additive) | `ImmuneSignalKind` enum + factory, `deriveImmuneSignals`, `ImmunityPolicy` + de/constructor, `decideImmuneAssessment`, `ImmuneAssessmentReport`, quarantine store helpers |
| `packages/mind/src/mind.ts` | modify (additive) | invoke immune assessment at promotion decision; gate decision feeds signals; quarantine/assessment bound into durable record |
| `packages/cli/src/cli.ts` | modify (additive) | `evolve immune status`, `evolve immune quarantine`, `evolve immune report` (+`--json`) |
| `packages/sdk/src/index.ts` | modify (additive) | expose `immuneSignals`/`assessment` in evolve result types (minimal) |
| `docs/evolution/EVOLUTION_IMMUNE_SYSTEM.md` | create | milestone documentation (idempotent with existing `docs/evolution/`) |
| `docs/evolution/` existing docs | read-only | DO NOT rewrite; append forward pointer only |

Test files (TDD — one spec per milestone area, follow existing `*_test.ts` conventions in `packages/`):
| File | Coverage |
|------|----------|
| `packages/core/src/__tests__/immuneSchemas.test.ts` | schema round-trip + additive-only invariant |
| `packages/mind/src/__tests__/immuneSystem.test.ts` | signal derivation, assessment, policy, quarantine lifecycle (the 19+milestone cases) |
| `packages/mind/src/__tests__/immunePromotion.test.ts` | promotion integration + no-bypass + explicit-promotion + rollback reconciliation |
| `packages/cli/src/__tests__/cli.test.ts` (extend) | `evolve immune status/quarantine/report` + `--json` |

---

## Task Matrix (TDD; each task = tiny + committed)

### Task 1: add core immune schemas (TDD)
**Files:** `packages/core/src/schemas.ts`; test `packages/core/src/__tests__/immuneSchemas.test.ts`
**Interfaces produced (consumed by Tasks 2+):**
- `ImmuneSeveritySchema` (enum `INFO|WARNING|HIGH|CRITICAL`) and types.
- `ImmuneSignalSchema`: `{ id, kind, severity, source, message, evidence: { hash-bound refs }, experimentId?, candidateId?, measured: boolean, at }`.
- `ImmuneAssessmentSchema`: `disposition: CLEAR|WARNING|BLOCKED|QUARANTINED`, `signals[]`, `severity`, `timestamp`, `evidenceRefs`.
- `QuarantineSchema`: `{ candidateId, mindId, version, parentLineage, experimentId, generation?, signals[], severity, evidenceIds[], reason, quarantinedAt, disposition: "QUARANTINED" }`.
- `ENUM values` + zod `.enum` additive — verify parse does not require fields Phase 12 removed.

Steps:
- [ ] Write failing `immuneSchemas.test.ts`: round-trip each schema; assert additive-only (parse an existing legacy record through the widened schema with an explicit "immune fields optional/absent" case).
- [ ] Run `pnpm --filter @seai/core test` → expect FAIL (schemas not exported).
- [ ] Add minimal schemas to `packages/core/src/schemas.ts` + re-export types.
- [ ] Run → PASS.
- [ ] `pnpm --filter @seai/core test` green. Commit.

### Task 2: immune signal kinds + factory (TDD)
**Files:** `packages/mind/src/experiment.ts`; test `packages/mind/src/__tests__/immuneSystem.test.ts`
**Consumes:** Task 1 schema types.
**Produces (Task 3 uses):** `ImmuneSignalKind = QUALITY_REGRESSION | GENERALIZATION_FAILURE | PROTECTED_CATEGORY_REGRESSION | HIGH_VARIANCE | EVIDENCE_INVALID | SUITE_MISMATCH | REPRODUCIBILITY_LIMITATION | COST_REGRESSION | LATENCY_REGRESSION | TOKEN_REGRESSION | POLICY_FAILURE`; `makeImmuneSignal(...)` factory (id = stable hash of kind+evidenceRefs so identity is stable/provenance-carrying).

Steps:
- [ ] Write failing tests: `makeImmuneSignal` assigns a stable id (same kind+refs → same id), carries `measured` flag; `NOT_MEASURED` signal forms exist for COST/LATENCY/TOKEN when measurement absent.
- [ ] Run → FAIL.
- [ ] Implement enum + factory + `measured:false` helpers (`unmeasuredCost()`, `unmeasuredLatency()`, `unmeasuredToken()`).
- [ ] Run → PASS. Commit.

### Task 3: deriveImmuneSignals — real-only derivation (TDD)
**Files:** `packages/mind/src/experiment.ts`; test `immuneSystem.test.ts`
**Consumes:** Task 2 kinds + existing `GateReport`, `GeneralizationGateResult`, `evidenceHash`, `suiteVersion`.
**Key invariant: a signal is ONLY produced when real evidence exists.** No measured value → signal carries `measured:false` (NOT_MEASURED), NEVER a fabricated severity.

Steps:
- [ ] Write failing tests:
  - gate `decision: reject` with regression field → `QUALITY_REGRESSION` or `PROTECTED_CATEGORY_REGRESSION` signal, severity HIGH/CRITICAL per policy.
  - generalization gate FAIL → `GENERALIZATION_FAILURE`; HOLD → insufficient-generalization signal (WARNING).
  - `verifyHistoryIntegrity` false / evidence-hash mismatch → `EVIDENCE_INVALID`, CRITICAL.
  - re-resolved suite `taskSetHash`/`holdoutHash` differ → `SUITE_MISMATCH`, CRITICAL.
  - `repeatRuns>1` variance above maxVariance → `HIGH_VARIANCE` (severity per policy). repeatRuns<2 → `NOT_MEASURED` (no fabricated variance).
  - `reproducibility==="limited"` → `REPRODUCIBILITY_LIMITATION` (INFO/WARNING).
  - missing cost/latency/token measurement → signal with `measured:false`.
  - policy-failure (model-level policy signal) → `POLICY_FAILURE`, CRITICAL.
- [ ] Run → FAIL (functions absent).
- [ ] Implement `deriveImmuneSignals(input: { gateReport, generalizationDecision, integrity: {candidateHashValid,holdoutHashValid,evidenceHashValid}, suiteVersion?+resolvedVersion, reproducibility, variance?, cost?, latencyMs?, tokens? }): ImmuneSignal[]`. Pure; each branch gated on `measured`.
- [ ] Run → PASS. Commit.

### Task 4: immunity policy (TDD)
**Files:** `packages/mind/src/experiment.ts`; test `immuneSystem.test.ts`
**Consumes:** Task 2/3. **Produces (Task 5 uses):** `ImmunityPolicy` with `{ maxVariance, requiredHoldoutEvidence: boolean, protectedRegressionThreshold, criticalKinds: ImmuneSignalKind[], quarantineKinds: ImmuneSignalKind[] }`; `defaultImmunityPolicy()` (project engineering defaults, labeled as policy not law); `severityFor(signal, policy)`.

Steps:
- [ ] Write failing tests: default policy maps kinds→severity; `severityFor` ranks INFO<WARNING<HIGH<CRITICAL; policy can demote/promote per-kind; default `quarantineKinds` includes `EVIDENCE_INVALID`+`POLICY_FAILURE`.
- [ ] Run → FAIL.
- [ ] Implement policy type + defaults + `severityFor`. Reuse `GateThresholds` naming conventions; do NOT second-policy-engine (fold into existing gate request path).
- [ ] Run → PASS. Commit.

### Task 5: decideImmuneAssessment (TDD)
**Files:** `packages/mind/src/experiment.ts`; test `immuneSystem.test.ts`
**Consumes:** Task 3 signals + Task 4 policy + existing gate.
**Produces (Task 6/8 use):** `ImmuneDisposition = CLEAR|WARNING|BLOCKED|QUARANTINED`; `decideImmuneAssessment({signals, gateDecision, generalization, policy}) → {disposition, severity, reason, failsCritical}`.
Critical rules (test-enforced):
- No signals + gate `eligible` → **CLEAR**.
- Any WARNING-kind signal (or gate `hold`) → **WARNING** (NOT BLOCKED — distinguishes HOLD from blocker).
- Any HIGH/severe-but-not-critical (e.g. protected regression above threshold, variance) → **BLOCKED** (candidate cannot promote until cleared).
- Any CRITICAL kind (`EVIDENCE_INVALID`, `SUITE_MISMATCH`, `POLICY_FAILURE`) → **QUARANTINED**.
- Missing holdout evidence → BLOCKED/WARNING as `NOT_MEASURED`, never CLEAR. `UNAVAILABLE != PASS`.

Steps:
- [ ] Write failing tests for each disposition class incl. the non-collapse cases (HOLD != BLOCKED; QUARANTINED != REJECTED; insufficient evidence != PASS).
- [ ] Run → FAIL.
- [ ] Implement `decideImmuneAssessment`.
- [ ] Run → PASS. Commit.

### Task 6: quarantine store — durable, append-only (TDD)
**Files:** `packages/mind/src/experiment.ts`; test `immunePromotion.test.ts` + `immuneSystem.test.ts`
**Consumes:** Task 1 QuarantineSchema + existing `experimentStorePaths` + JSONL writers.
**Produces (Task 7+ use):** `quarantineStorePaths(paths)`, `appendQuarantine(paths, q)` (append-only, idempotent by candidateId — never overwrite), `readQuarantines(paths)` (historical, never deleted), `lastQuarantineForCandidate(paths, candidateId)`.

Steps:
- [ ] Write failing tests: append creates a quarantined record; re-append same candidate → preserved (no silent overwrite); read returns ALL historical quarantines; quarantine is immutable (fields not mutating on re-read).
- [ ] Run → FAIL.
- [ ] Implement on top of existing `.jsonl` patterns (mirror `appendExperimentRecord` style but separate quarantine file `quarantine.jsonl` to keep history kinds isolated).
- [ ] Run → PASS. Commit.

### Task 7: quarantine — full lifecycle officers (TDD)
**Files:** `packages/mind/src/experiment.ts`; test `immunePromotion.test.ts`
**Consumes:** Task 6 store + Task 3/5.
**Produces (Task 8 uses):** `quarantineCandidate(...)` (writes durable record; sets candidate state so it cannot promote), `isQuarantined(paths, candidateId)`, `quarantinedCandidateCannotPromote` guard.

Steps:
- [ ] Write failing tests:
  - quarantined candidate cannot be promoted (guard throws / returns non-eligible).
  - isQuarantined true only for real quarantines (not REJECTED/HELD).
  - candidate quarantine record survives promote attempts (still listed; NOT auto-cleared).
  - candidate previously ROLLED_BACK is NOT auto-quarantined (ROLLED_BACK is historical state, not immune failure) unless an actual critical signal fired.
- [ ] Run → FAIL.
- [ ] Implement lifecycle + guard. Wire the guard into the promotion eligibility check path (Task 8 does the promotion integration; this task provides the guard predicate).
- [ ] Run → PASS. Commit.

### Task 8: promotion integration — immune assessment before eligibility (TDD)
**Files:** `packages/mind/src/mind.ts` (+ `experiment.ts` guard re-exports); test `immunePromotion.test.ts`
**Consumes:** Task 5 assessment + Task 7 quarantine guard + existing `promoteInStore`/`decideGate`.
**Contract (test-enforced):**
- Sequence: candidate → experiment → validation → protected holdout → regression → generalization → **immune assessment** → promotion eligibility → EXPLICIT promotion.
- If gate FAIL → no promotion (existing behavior, preserved).
- If immune assessment BLOCKED/QUARANTINED → promotion blocked, explicit `hold`/`quarantine` recorded.
- If immune assessment WARNING (e.g. holdout insufficient) → promotion requires explicit + policy re-check; candidate remains eligible-able but never auto-promoted.
- If CLEAR → candidate is ELIGIBLE — but promotion still REQUIRES the explicit `promote` command (never automatic).

Steps:
- [ ] Write failing tests for the full promotion path (no-bypass, blocked, quarantined, warning-hold, clear-explicit). Also assert existing benign promotion still works (no regression to Phase 13 promotion logic).
- [ ] Run → FAIL.
- [ ] Insert immune assessment at the promotion decision point in `mind.ts`; thread assessment + quarantine guard into promotion eligibility.
- [ ] Run → PASS. Commit.

### Task 9: SDK surface (minimal, additive)
**Files:** `packages/sdk/src/index.ts`
**Consumes:** Task 5/8 types. **Produces:** evolve result carries `immuneAssessment` + `immunitySignals` + `quarantine` (optional, present-only for compat).
Steps:
- [ ] Add fields to the evolve result type (present-only so CLI/json output and old consumers stay stable).
- [ ] Typecheck `pnpm --filter @seai/sdk typecheck` + `pnpm build`. No fabricated metrics in SDK. Commit.

### Task 10: CLI — `evolve immune status|quarantine|report` (+`--json`)
**Files:** `packages/cli/src/cli.ts`; extend `packages/cli/src/__tests__/cli.test.ts`
**Consumes:** Task 6/7/8 functions + existing CLI style (`--mind`, `--json`).
Steps:
- [ ] `evolve immune status --mind <n> [--json]`: reads durable store; prints current assessment severity + disposition + quarantined count (concise human output; full fields only in `--json`).
- [ ] `evolve immune quarantine --mind <n> [--json]`: lists durable quarantine history (candidate, severity, reason, evidence ids, at); never deletes.
- [ ] `evolve immune report <experimentId> [--json]`: trustworthy report — baseline/candidate/validation/holdout/protected/variance/tokens/latency/cost/immune signals/severity/gates/evidence integrity/reproducibility/disposition. (No vague prose; evidence-backed.)
- [ ] CLI tests: command presence + `--json` valid JSON + human output concise + quarantine listing. Follow existing CLI test helpers (`runCli(args, env)` with `SEAI_DATA_DIR` temp).
- [ ] Run `pnpm --filter @seai/cli test` + full `pnpm build`. Commit.

### Task 11: real experiment + trustworthy report proof
- [ ] Add a model-backed smoke test (skipped when no local runtime) OR run CLI manually: run a REAL `evolve propose` experiment that produces a non-CLEAR disposition (e.g. insufficient-holdout → WARNING/HOLD is a valid, honest outcome — see milestone §15).
- [ ] Demonstrate in output/docs: CLEAR on clean candidate, WARNING/HOLD on weak evidence, quarantine on critical (evidence-invalid). Use temp `SEAI_DATA_DIR`. Show evidence hash verify runs green.
- [ ] Record one real `immune report` JSON in docs/evolution/ as a fixture.

### Task 12: documentation — `docs/evolution/EVOLUTION_IMMUNE_SYSTEM.md`
- [ ] Write: purpose, signals, severity, assessment, quarantine, policy, relation to existing gates/holdouts/rollback, limitations. Include canonical flow diagram (CANDIDATE → EVALUATION → GENERALIZATION → REGRESSION → IMMUNE ASSESSMENT → CLEAR/WARNING/BLOCKED/QUARANTINED → ELIGIBLE → EXPLICIT PROMOTION).
- [ ] State explicitly: *"The immune system improves governance of evolutionary experiments; it does not prove general intelligence improvement."*
- [ ] NO website changes (only factual updates if already wrong; no fake live evolution). NO deploy.

### Task 13: global verification (gate to `verification-before-completion`)
- [ ] `pnpm build` + `pnpm typecheck` + `pnpm test` all green. Record `git diff --stat` + `git status`.
- [ ] Confirm: 7-unit architecture, no new package, no deletions of working behavior, no weaker gates, no auto-promotion, no fabricated measurements/energy/cost, no deploy/push/Vercel, `.env.local` preserved, no npm lockfile.
- [ ] Run lint if configured (it is not repo-wide — note pre-existing, do not chase).
- [ ] Commit final.

---

## Self-Review (per skill — done below)

**Spec coverage:** Milestone §1 forensic ✓ (done in earlier session). §2 immune signals → Task 2/3. §3 severity → Task 4. §4/immune assessment → Task 5. §5 quarantine → Task 6/7. §6 promotion integration → Task 8. §7 missing-data-not-pass → Task 3/5 (measured:false, NOT_MEASURED). §8 immune policy → Task 4 (reuses gate thresholds, no second engine). §9 candidate state → Task 6/7/8 (ELIGIBLE≠PROMOTED, QUARANTINED≠REJECTED, HELD≠FAILED, ROLLED_BACK≠never-promoted). §10 immune events → Task 3/5 (stable signal ids + durable quarantine; reuses evolution history, no duplicate store). §11 multi-candidate comparison → preserved via existing `extraCandidates`; immune layer adds parallel signals, does not collapse rankings. §12 trustworthy report → Task 10 `immune report`. §13 CLI → Task 10. §14 tests → Tasks 1-8 (19 milestone cases enumerated). §15 real experiment → Task 11. §16 docs → Task 12. §17 website → Task 12 (no-op/factual only). §18 verification → Task 13.

**Placeholder scan:** All functions named with exact intended signatures; no "TBD/TODO". Guard uses existing `promoteInStore`.

**Type consistency:** `ImmuneDisposition` CLEAR/WARNING/BLOCKED/QUARANTINED used identically in Task 5/8/10. `ImmuneSignalKind` literal union reused throughout. `ImmuneSignal.measured:boolean` invariant used in Task 3 + Task 5.

---

## Execution Handoff

"Plan complete and saved to `docs/superpowers/plans/2026-09-15-evolution-immune-system.md`. Two execution options:

**1. Subagent-Driven (recommended)**
**2. Inline Execution**

Which approach?"
