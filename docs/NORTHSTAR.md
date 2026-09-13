# SE-AI — North Star

## What SE-AI is

**SE-AI = Self-Evolving Artificial Intelligence.**

SE-AI is an open platform for creating **persistent, specialized, measurable,
governed, self-evolving AI Minds**.

A Mind is not a stateless model call. A Mind is:

```
Model
+ Memory
+ Skills
+ Tools
+ Identity
+ Goals
+ Experience
+ Evaluation
+ Evolution
+ Governance
```

## The core loop

Every Mind runs a single, auditable, reversible loop:

```
OBSERVE
→ REMEMBER
→ REASON
→ ACT
→ VERIFY
→ LEARN
→ EVOLVE
→ TEST
→ PROMOTE
→ MONITOR
→ ROLLBACK
```

Nothing in this loop is believed on faith. Each stage produces evidence —
measurements, records, hashes — that the next stage must be able to verify.

## The core thesis

**Intelligence should be optimized, not merely scaled.**

A small model inside a well-governed, experienced, evolving Mind should be
able to beat a much larger raw model on the same task — because the Mind
learns, remembers, and improves, while a raw model call just re-rolls the dice.
Proving this, or breaking it, is an empirical question we measure, not a claim
we assert. See `docs/research/` for the evidence so far.

## PAIOS — the first reference Mind

**PAIOS** (Personal AI Operating System) is the first real SE-AI reference Mind:
a local-first, privacy-preserving personal assistant that demonstrates the full
SE-AI architecture end to end. It is a reference implementation of the platform,
not a separate product. See `minds/paios/SPEC.md`.

## Rules

These rules are non-negotiable and apply to every subsystem, experiment, and
line of code:

- **Truth over theater** — real behavior beats plausible-looking behavior.
- **Evidence over claims** — every claim traces to code, data, or a measured
  record. No fabricated numbers, no fake metrics.
- **Real capability over mock capability** — a stub is labeled a stub.
- **Governed evolution** — nothing is promoted on noise; promotion is explicit
  and reversible.
- **Privacy and security by default** — default-deny data flows, Mind-scoped
  isolation, audit trails.
- **Provider-neutral architecture** — no provider is hardwired into the kernel.
- **Local-first where practical** — personal intelligence should not require
  a cloud.
- **Measurable improvement** — evolution only acts on measured deltas above a
  noise floor.
- **Reversible changes** — every promotion can be rolled back with lineage
  intact.
- **No fake autonomy** — the system never claims to decide more than it does.

## What this means for every release

A release is a point on the loop. It must state clearly:

1. what was **REAL** (shipped, measured, verified),
2. what is **PARTIAL** (shipped, known-honest gaps),
3. what is **STUB / LABELED** (present but not operational),
4. what is **FUTURE** (designed, not built).

This is the standard by which the public-facing site is judged. Any page,
link, button, or number that cannot survive this classification is a bug.

---

*This is the governing document. `AGENTS.md` references it. Everything a reader
sees should be traceable back to one of the truths named here.*