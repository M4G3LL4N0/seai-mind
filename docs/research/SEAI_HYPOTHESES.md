# SE-AI Hypotheses

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** Living document. Each hypothesis records status + evidence, never claims without measurements.

---

## H1 — Response-format compliance improves under explicit JSON-only instruction

- **Claim:** Adding "Return ONLY valid JSON…" to the system prompt raises
  pure-JSON compliance on unambiguous extraction tasks without changing
  task semantics.
- **Status:** TESTED (see `docs/research/MODEL_EVOLUTION_FIRST_EXPERIMENT.md`).
- **Evidence:** baseline vs candidate arms on identical 10-task suite,
  deterministic `extractionCriterion`, 8-check gate.

## H2 — Deterministic response formatting fixes format compliance at zero model cost

- **Claim:** Emitting `{"value": n}` instead of raw `n` for deterministic
  arithmetic restores format compliance with no tokens and ~ms latency.
- **Status:** CONFIRMED (`arithmetic-format-v1`: quality 0.00 → 0.70/0.80,
  ELIGIBLE, promoted, adopted, rolled back — all verified live).

## H3 — A weaker prompt nudge is cheaper but less effective than an explicit constraint

- **Claim:** "Please return JSON" costs fewer tokens than a strict JSON-only
  instruction but complies less often.
- **Status:** TESTED alongside H1 (polite-json-prompt second candidate arm).

## H4 — Latency-gate noise floor

- **Claim:** Sub-100ms latency deltas between arms are measurement noise and
  must not flip promotion decisions.
- **Status:** CONFIRMED by failure: parallel test load flipped a deterministic
  experiment to HOLD before the floor existed; stable after.

## H5 (open) — Memory-retrieval policy evolution

- **Claim:** Reusing verified cached answers for repeated tasks lowers latency
  without quality loss.
- **Status:** UNTESTED. Requires per-Mind skill registry work first.

## H6 (open) — Routing-policy evolution

- **Claim:** Preferring cheapest healthy runtime first lowers cost at equal quality.
- **Status:** UNTESTED. Requires multi-runtime environment (only Ollama live).

---

*Hypotheses graduate H-open → TESTED → CONFIRMED/REJECTED only with measured evidence.*
