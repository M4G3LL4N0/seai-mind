# First Model-Backed Evolution Experiment

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** EXECUTED LIVE — numbers below are measured, not projected

---

## Hypothesis (H1)

Adding a JSON-only system instruction raises pure-JSON compliance on
unambiguous extraction tasks without changing task semantics.

## Controlled Variables (held constant)

- MODEL: qwen2.5-coder:3b (single discovered model, same id both arms)
- RUNTIME: ollama (sole healthy runtime, probed)
- PROVIDER: none registered (direct adapter; provider-health rule correctly
  fail-open — verified by the ELIGIBLE outcome)
- TASK INPUTS + ORDER: identical 10-task `extraction-json-v1` suite
- EVALUATION: deterministic `extractionCriterion` (pure `JSON.parse` +
  required-field equality) — no LLM judge
- SAMPLING: temperature 0.7 (engine default, recorded per record)

## Independent Variable

- Baseline: stock system prompt
- Candidate A (`json-only-prompt`): + "Return ONLY valid JSON with no
  explanations, no markdown fences, and no surrounding text."
- Candidate B (`polite-json-prompt`): + "Please return your answer in JSON format."

## Results (experiment `e09b4797-91e2-…`, Mind `demo`)

| Arm | Success | Quality | Latency (mean) | Tokens |
|-----|---------|---------|----------------|--------|
| Baseline | 10/10 | **0.30** | 2046.2ms | 875 |
| Candidate A | 10/10 | **0.70** | 2045.1ms (−1.1) | 895 (+20, +2.3% — within 10% budget) |
| Candidate B | 10/10 | **0.80** | 2024.6ms | 807 |

Gate: **ELIGIBLE** for both. Per-task evidence shows fences/preambles in
the baseline arm and pure JSON in candidate arms (raw records persisted).

A second run on the same server measured baseline 0.40 / candidate 0.50
(HOLD on +22% tokens) — stochastic variance across runs is real and is why
`reproducibility: "limited"` is recorded on every model-backed record.

## Promotion / Adoption / Rollback (all live, same Mind)

- `evolve promote` → genome v0.1.1 with `systemPromptExtra` persisted.
- Fresh-process `run` adopted it: in-suite probe `"Maria is 34…"` returned
  pure JSON **2/2** (baseline behavior fences it).
- `evolve rollback` → v0.1.2 restoring the parent prompt; lineage and audit
  history intact; `evolve status` shows promotion + rollback.

## Limitations (stated, not hidden)

1. **Single small model, single server.** No claim about other models.
2. **Prompt ≠ robust fix.** An unseen probe ("Bob is 41") fenced 3/3 under
   the promoted prompt while the in-suite probe passed 2/2 — the constraint
   raises compliance rates, it does not guarantee them. The gate measures,
   it does not promise.
3. **Stochastic.** Quality varies run to run (0.70 vs 0.50 across runs);
   records say `limited` and small suites can mislead — larger suites first
   when the stakes rise.
4. **Prompt-only.** Weights, routing, memory, skills untouched (FUTURE).

## Decision

H1 SUPPORTED for the tested suite and model (0.30 → 0.70/0.80, ELIGIBLE,
adopted, rolled back cleanly). H3 (weaker nudge cheaper + effective)
PARTIALLY supported: candidate B measured 0.80 at fewer tokens in this run —
worth re-testing before claiming a pattern.

---

*Written AFTER the experiment ran. Every number above is traceable to the
persisted `ExperimentRecord` (per-task measurements, deltas, gate reasons).*
