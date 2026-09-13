# SE-AI Mind — Evolution Model

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** REAL LOOP IMPLEMENTED (supersedes the 2025-09-08 design sketch)

---

## Principle

Self-evolution means evolving cognitive **configuration and measurable
behavior** — never arbitrary source-code self-modification. Candidates are
data (`changes: { cognitionConfig, suite }`), applied through versioned
genomes, promoted only on measured evidence.

```
OBSERVE (experiences + baseline measurements)
  → PROPOSE (deterministic generator cites evidence)
  → SANDBOX (isolated state, timeouts, identical suite)
  → MEASURE (raw per-task evidence, nothing fabricated)
  → COMPARE (baseline vs candidate deltas)
  → GATE (eligible / reject / hold)
  → PROMOTE (explicit only; auto-promote is off)
  → USE (live adoption via applyGenome)
  → ROLLBACK (lineage-preserving restore)
  → HISTORY (durable, inspectable)
```

## What Is Real

| Piece | Implementation | Evidence |
|-------|---------------|----------|
| Candidate generation | `proposeFormatComplianceCandidate()` scans measured baseline failures; reason cites task ids and rates | unit tests |
| Sandbox | `measureArm()`: fresh storage per arm, per-task timeouts, wall-clock latency, tokens only when reported | isolation + timeout tests |
| Comparison | `compareArms()`: success/quality/verification/latency/token deltas from raw measurements | math tests incl. negative case |
| Safety review | `detectThreats()` scan over serialized changes | injection test |
| Privacy review | denylist of privacy-gated config paths | memory-key test |
| Promotion | `applyPromotion()` → versioned genome + lineage + audit history | chain test |
| Rollback | `GenomeEngine.rollbackGenome()` lineage traversal + live re-adoption | chain test (caught 2 real bugs: invalid `candidateId: ""`, stale task cache) |
| History | append-only JSONL log + snapshots + active pointer | durability + corruption tests |

## What Remains Stub / Legacy

- `EvolutionEngine.sandboxCandidate()`: honest HOLD shim (retired simulation;
  refuses to fabricate). The real path is `MindRuntime.runExperiment()`.
- `EvolutionLab`: no callers; unimplemented isolation levels stay FUTURE.
- Legacy `generateCandidates()` default generators (vacuous, all 10 layers):
  unused by the real path; kept for API stability, documented as legacy.
- `costReview()` legacy method: superseded by measured token/latency gates.
- Model-weight evolution (LoRA/distillation): FUTURE by design (Phase 12).
- OS-level sandboxing (containers/VMs): FUTURE. Darwin sandboxes isolate
  STATE + enforce timeouts/caps; a candidate needing fs/net beyond engine
  behavior is out of scope and audited via tool-use evidence.

## Candidate Types (Phase 1)

Today: **cognition configuration** (`deterministicFormat: raw|json`) under
layer `"configuration"`, gated by an allowlist that rejects everything else
— including model weights. Later, in order: prompts, memory retrieval
policy, routing policy, tool-selection policy, verification policy, then
adapters → LoRA → distilled models → architecture. Each addition extends
the allowlist and its tests, never the kernel shape.

## Trustworthy Evolution (Phases 6-20, 2026-09-13)

Repeatability and integrity on top of the measured loop:

- **Repeated runs** (`repeatRuns: n`): each task is executed `n` times per
  arm with `enableCache: false` — cached repeats are not measurements.
  Every run is preserved as raw evidence (`runIndex`).
- **Variance confidence:** per-task Bernoulli variance + `confidence`
  (`high/medium/low/n/a`). `decideGate` holds signals that do not out-pace
  `varianceSignalToNoise` × pooled variance, and `small-sample` holds at
  < 3 tasks.
- **Target-vs-global:** the gate rejects regression on ANY measured category
  (`maxCategoryRegression`), not just protected ones.
- **Evidence immutability:** every record is stamped with a SHA-256
  `evidenceHash` over the measured evidence; reads verify signatures,
  tampered lines are excluded, and `seai evolve verify` audits the store.
- **Configurable thresholds:** `EvolutionConfig.gateThresholds` /
  `runExperiment({ gateThresholds })` override `decideGate()` defaults.
- **CLI:** `seai evolve propose --repeat-runs N --max-category-regression F
  --variance-signal-to-noise X`, plus `seai evolve verify`.
- **First trustworthy live result:** extraction suite at `repeat-runs 3`
  measured 0.43 → 0.47 (+0.03) with +16.7% tokens → **HOLD, not promoted**,
  signed evidence (`docs/research/TRUSTWORTHY_EVOLUTION_FIRST_EXPERIMENT.md`).
  A prior cache-on run's ELIGIBLE 0.40 → 0.60 was a cache artifact; the
  cache rule fixed it.

---

*Evolution model verified 2026-09-11: 19 evolution tests green, full CLI loop demonstrated.*
