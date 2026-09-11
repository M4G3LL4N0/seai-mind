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

---

*Evolution model verified 2026-09-11: 19 evolution tests green, full CLI loop demonstrated.*
