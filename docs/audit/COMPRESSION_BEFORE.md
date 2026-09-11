# SE-AI Mind (Darwin 0.1) — Compression Before

**Date:** 2025-09-08
**Status:** BASELINE RECORDED

---

## Package Count

| Category | Count |
|----------|-------|
| packages/ | 22 |
| runtimes/ | 4 |
| minds/ | 0 (no package.json) |
| web/ | 1 |
| **TOTAL WORKSPACE** | **27** |

---

## Source Metrics

| Metric | Value |
|--------|-------|
| TypeScript files | 201 |
| Total source LOC (kernel+schemas+hardware+telemetry+security+policy+storage) | 3,727 |
| Total source LOC (models+providers+routing+memory+skills+tools+genome) | 2,870 |
| Total source LOC (cognition+compiler+evaluation+evolution+mind+benchmark+sdk+cli) | 3,775 |
| Total source LOC (web) | 3,901 |
| **Total source LOC** | **~14,273** |
| Test files | 0 |
| Documentation files | 24 |

---

## External Dependencies (per package)

| Package | External Deps |
|---------|---------------|
| kernel | 0 |
| schemas | zod, uuid |
| hardware | 0 |
| telemetry | 0 |
| security | 0 |
| policy | 0 |
| storage | 0 |
| models | 0 |
| providers | 0 |
| routing | 0 |
| memory | 0 |
| skills | 0 |
| tools | 0 |
| genome | 0 |
| cognition | 0 |
| compiler | 0 |
| evaluation | 0 |
| evolution | 0 |
| mind | 0 |
| benchmark | 0 |
| sdk | 0 |
| cli | commander, chalk, ora |
| web | next, react, react-dom, framer-motion, lucide-react, tailwind-merge, clsx |

---

## Internal Dependencies (who imports whom)

| Package | Imports From |
|---------|-------------|
| kernel | (none) |
| schemas | (none) |
| hardware | schemas |
| telemetry | kernel, schemas |
| security | kernel, schemas |
| policy | kernel, schemas, security |
| storage | kernel, schemas |
| models | kernel, schemas |
| providers | kernel, schemas, security |
| routing | kernel, schemas, models, providers, security, policy |
| memory | kernel, schemas, storage, security, telemetry |
| skills | kernel, schemas, storage, tools, security, telemetry |
| tools | kernel, schemas, security, policy |
| genome | kernel, schemas, storage, security |
| cognition | kernel, schemas, memory, skills, tools, models, routing, security, policy, telemetry |
| compiler | kernel, schemas, memory, skills, tools, models, routing, security, policy, evaluation |
| evaluation | kernel, schemas, security |
| evolution | kernel, schemas, storage, security, policy, genome |
| mind | kernel, schemas, hardware, telemetry, security, policy, storage, models, providers, routing, memory, skills, tools, genome, cognition, compiler, evaluation, evolution, benchmark |
| benchmark | kernel, schemas, storage, security, hardware, cognition |
| sdk | ALL packages (re-exports) |
| cli | sdk, hardware, telemetry |
| web | (none) |

---

## Per-Package Assessment

### Tier 1: Foundation (no internal deps)
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| kernel | 393 | REAL | Foundation types, 14 error classes, Result pattern, utilities |
| schemas | 714 | REAL | 20+ Zod schemas, all domain types |

### Tier 2: Infrastructure (depend on Tier 1)
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| hardware | 936 | REAL | 3-platform detection (macOS/Linux/Windows) |
| telemetry | 318 | REAL | Event bus with buffering, persistence |
| security | 587 | REAL | Capability-based security, threat detection |
| policy | 411 | REAL | Rule-based policy engine |
| storage | 368 | REAL (simplified) | In-memory SQL emulator + file storage |

### Tier 3: Runtime (depend on Tier 1-2)
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| models | 511 | REAL | Runtime abstraction, registry, manager |
| providers | 663 | REAL | Provider discovery, verification, benchmarking |
| routing | 559 | REAL | Policy-driven model routing |

### Tier 4: State (depend on Tier 1-2)
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| memory | 590 | REAL | Full memory engine with persistence |
| skills | 450 | REAL | Skill engine, one stub (runSkillProcedure) |
| tools | 160 | MINIMAL | Thin wrapper, some stubs |
| genome | 534 | REAL | Genome versioning with branching |

### Tier 5: Integration (depend on Tier 1-4)
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| cognition | 455 | REAL | 10-step cognitive pipeline |
| compiler | 575 | REAL | Goal-to-DAG compiler with graph algorithms |
| evaluation | 469 | REAL+STUBS | Engine real, built-in evaluators hardcoded |
| evolution | 609 | REAL+STUBS | Lifecycle real, sandbox simulated |
| mind | 590 | REAL | Integration layer wiring 16 subsystems |
| benchmark | 515 | REAL | Real benchmarking with statistical metrics |

### Tier 6: Interface (depend on all)
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| sdk | 185 | REAL (facade) | Thin re-export layer |
| cli | 489 | REAL+STUBS | 9 real commands, 6 stub subcommands |

### Platform
| Package | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| web | 3,901 | REAL | Marketing/docs site, no @seai deps |

### Runtime Adapters
| Runtime | LOC | Real/Stub | Assessment |
|---------|-----|-----------|------------|
| ollama | 232 | REAL | Full HTTP integration |
| llamacpp | 167 | MOSTLY REAL | Subprocess-based, naive ports |
| mlx | 71 | STUB | Returns mock strings |
| local | 98 | INTENTIONAL STUB | Test fixture |

---

## Build Status

```
pnpm build: ALL 27 packages PASS
```

## CLI Status

```
seai --help: WORKS
seai doctor: WORKS
seai init --name TestMind: WORKS
```

## Web Status

```
pnpm build (web): WORKS (15 static pages)
```

---

## Key Observations

1. **27 packages is excessive for a kernel.** The dependency graph shows natural layering that can be collapsed.

2. **Many packages are genuinely real.** This is not scaffolding — there are ~14,000 lines of real TypeScript.

3. **Stubs are concentrated in specific areas:** sandbox execution, LLM-as-judge evaluation, some CLI subcommands, MLX/local runtimes.

4. **The web app is completely independent.** Zero @seai/* dependencies. Pure marketing site.

5. **The SDK is a pure facade.** It re-exports everything and wraps MindRuntime.

6. **Hardware detection is substantial (936 LOC) but optional.** Only needed for hardware-aware routing.

7. **The dependency graph is clean and acyclic.** No circular dependencies detected.

8. **External dependencies are minimal.** Only CLI (commander/chalk/ora) and web (next/react/etc.) have external deps. The kernel itself is dependency-free.

---

*Baseline recorded 2025-09-08.*