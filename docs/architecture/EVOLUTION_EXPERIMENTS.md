# SE-AI Mind — Evolution Experiments

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** IMPLEMENTED (`mind/src/experiment.ts`, `MindRuntime.runExperiment()`)

---

## The Reference Experiment: `arithmetic-format-v1`

Ten arithmetic tasks that explicitly request JSON output, with expected
numeric values (seven valid, three invalid where honest failure is correct).

| Arm | Config | Measured result |
|-----|--------|-----------------|
| Baseline | `deterministicFormat: "raw"` | success 7/10, format-quality 0/10 |
| Candidate | `deterministicFormat: "json"` | success 7/10, format-quality 7/10 |

Quality delta +0.70 ≥ 0.05 threshold, no success regression, no safety or
privacy findings, no tokens in either arm → gate: **ELIGIBLE**.
Promotion creates genome N+1, live adoption switches output to
`{"value": n}`, rollback restores raw output. All measured, all persisted.

## Running It

```bash
seai evolve propose "json answers wanted" --mind default
seai evolve history --mind default
seai evolve promote <experimentId> --mind default
seai run "What is 3 + 3? Answer in JSON." --mind default  # uses promoted version
seai evolve rollback --mind default --reason "..."
```

`propose` never promotes (auto-promote is off). `promote` requires an
ELIGIBLE decision. `rollback` requires an active genome with a parent.

## Reproducibility Contract

Every `ExperimentRecord` carries: suite id + full task list, both arms' raw
per-task measurements (success, output match, verification, latency, tokens
or explicit null, execution path, errors), deltas, gate checks with reasons,
candidate with evidence, genome lineage, timestamps. Re-running the suite
yields the same decision (tested). Corrupt log lines are skipped and counted,
never silently repaired.

## Cost Discipline (Phase 13)

Small deterministic suites first; model-backed suites only when evidence
warrants. Unknown metrics are `null`, never zero-claimed or invented. The
deterministic arms measure ~2ms/task with zero tokens — the evolution system
itself honors "cheapest inference is no inference."

---

*Experiments verified 2026-09-11: in-process chain test + cross-process CLI loop test green.*
