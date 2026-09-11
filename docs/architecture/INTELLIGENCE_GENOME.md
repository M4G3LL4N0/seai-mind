# SE-AI Mind — Intelligence Genome (Operational)

**Date:** 2026-09-11 (Darwin 0.1)
**Status:** OPERATIONAL FOR VERSIONED COGNITIVE CONFIGURATION

---

## What the Genome Is Now

Not a concept: a persisted, versioned, diffable record of what a Mind is.
Every `Genome` carries `id`, `mindId`, semver `version`, `parentGenome`,
`lineage`, `evolutionHistory`, timestamps — plus the configuration the Mind
executes from, including `cognitionConfig` (added 2026-09-11; optional so
older genomes still parse).

## Lifecycle (all real, all tested)

- **Create**: `ensureBaselineGenome()` snapshots live cognition config as gen-0.
- **Evolve**: `applyPromotion()` bumps patch version, extends lineage, appends
  a `promoted` audit entry with candidate id + reason.
- **Adopt**: `MindRuntime.applyGenome()` switches live execution without reboot.
- **Rollback**: `GenomeEngine.rollbackGenome()` traverses lineage to the
  target version and mints a restoring version; live re-adoption follows.
- **Inspect**: `getEvolutionHistory()` answers what changed, why (candidate
  reason + evidence), what was measured (both arms), why it was decided
  (gate reasons), what is active, what preceded it, and whether rollback
  is available.

## Durability

In-engine repositories are session-scoped, so Darwin persists the genome
record durably beside them: per-Mind directory with an append-only
`evolution.jsonl` experiment log, `genomes/<id>.json` snapshots, and an
atomically-written `active.json` pointer (default `./data/minds/<name>/`,
overridable via `SEAI_DATA_DIR`; `data/` is gitignored). Corrupt lines are
skipped and counted. Live engines rehydrate from snapshots on demand.

## What It Is Not Yet

- No weight/adapters versioning (FUTURE: LoRA → distilled models).
- No branching/merging UI (lineage supports branches; no merge operation yet).
- No cross-Mind genome sharing (genomes are Mind-scoped like memory).

---

*Genome verified 2026-09-11: promotion/rollback/lineage/history tests green;
`seai evolve status|history` expose real durable state.*
