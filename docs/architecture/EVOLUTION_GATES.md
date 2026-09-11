# SE-AI Mind — Evolution Gates

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** IMPLEMENTED (`decideGate()` in `mind/src/experiment.ts`)

---

## Decision Table

| Decision | Meaning | When |
|----------|---------|------|
| `eligible` | May be promoted by an explicit operation | quality delta ≥ threshold AND no reject-level failure AND no hold-level failure |
| `reject` | Must not be promoted | worse quality/success, safety or privacy failure, invalid comparison |
| `hold` | Inconclusive; keep observing | no improvement but no regressions, or unavailable metrics |

## Checks (each returns pass/fail + human-readable details)

| Check | Severity | What it actually does |
|-------|----------|----------------------|
| `safety-threat-scan` | reject | `detectThreats()` over serialized changes |
| `safety-allowlist` | reject | top-level keys ⊆ `{cognitionConfig, suite}`; cognition keys ⊆ `{deterministicFormat}` with values in `{raw, json}` |
| `privacy-config` | reject | rejects `memory`/`policies`/`security`/`privacy` paths |
| `regression-success` | reject | candidate success rate must not drop below baseline |
| `quality-improvement` | reject if worse, hold if inconclusive | delta vs `minQualityImprovement` (default 0.05) |
| `cost-latency` | hold | measured increase beyond ratio budget holds; unavailable data passes with an explicit "no claim" note |
| `cost-tokens` | hold | increased measured tokens hold; all-null tokens pass with "no token-cost claim made" |
| `reproducibility` | reject | both arms ran the identical workload with raw evidence preserved |

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

*Gates verified 2026-09-11: reject/hold/eligible matrix tests green, including
threat, privacy, allowlist, and regression cases.*
