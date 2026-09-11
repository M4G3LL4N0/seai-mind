# SE-AI Mind — Execution Model

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** IMPLEMENTED AND VERIFIED

---

## The Smallest Useful Path

```
GOAL → CLASSIFY → CHECK MEMORY → SELECT EXECUTION → EXECUTE → VERIFY → RECORD EXPERIENCE
```

Each stage may use deterministic code, memory, tools, micro-models,
specialist models, or reasoning models. The engine always tries the
cheapest viable path first. **Cheapest inference is no inference.**

### Stage table (actual code in `mind/src/cognition.ts`)

| Stage | Implementation | Status |
|-------|---------------|--------|
| classify | keyword type-map → category/complexity/capabilities | REAL (simple) |
| check-cache | TTL task cache | REAL |
| check-memory | mind-scoped retrieve by task input text | REAL |
| check-knowledge | returns null | STUB (labeled in code) |
| check-skill | match skills by capability | REAL |
| check-tool | returns null (no per-mind tool registry yet) | STUB (labeled in code) |
| select-model | routing over healthy runtimes + available models | REAL |
| execute | deterministic → skill → tool → model; else honest diagnostic | REAL |
| verify | non-empty check; deterministic recompute | REAL (narrow — see below) |
| escalate | throws "requires escalation" when verification fails | REAL (minimal) |

### Execution paths (`Task.executionPath`)

| Path | When | Example |
|------|------|---------|
| `deterministic` | input contains a parseable arithmetic expression | "What is 2 + 2?" → `4` |
| `skill` | a registered skill matches and succeeds | — (no builtin skills execute yet) |
| `tool` | a registered tool matches and succeeds | — (no per-mind tools yet) |
| `model` | routing selects a model on a healthy runtime | qwen2.5-coder:3b via Ollama → `"OK"` (27 real tokens, 4022ms) |
| — (error) | none of the above | honest `No execution method available…` diagnostic |

## Verification Taxonomy (strict)

- **EXECUTED** — a real path ran and produced output (deterministic compute,
  tool result, or model tokens). Never claimed without a path.
- **VALIDATED** — output passed syntactic checks: non-empty (`verifyResult`),
  schema match (structured output), tool exit status. Says nothing about meaning.
- **VERIFIED** — output passed a semantic check against expectation. In
  Darwin 0.1 this exists for exactly two classes:
  1. `verified-deterministic`: the recorded (expression, value) pair
     re-evaluates to the same value (`verifyDeterministic`). Parser semantics
     themselves are pinned by tests — the claim is narrow and stated.
  2. Exact-match evaluation of an actual execution (`evaluateWithCustomCriteria`
     with a real criterion over a real output — tested).
- Model prose is EXECUTED + VALIDATED, never VERIFIED, unless a real
  criterion or a human confirms it.

`Task.verification` records which level was reached per task.

## Missing Model = Explicit Diagnostic (never faked)

```
No execution method available. Task type "general" is not deterministic,
no skill or tool matched, and no model is configured. Registered runtimes:
(none). Available models: 0. To enable model execution, start a local
runtime (e.g. `ollama serve` with a pulled model) and register its adapter,
or configure a remote OpenAI-compatible endpoint.
```

No automatic installs. No simulated inference. No random quality scores.
No pretend token counts.

---

*Execution model implemented and verified 2026-09-11: `seai run "What is 2 + 2?"`
→ `4` (deterministic, 2ms); constrained model prompt → `"OK"` via live Ollama.*
