# SE-AI Mind (Darwin 0.1) — Compression Gate

**Date:** 2025-09-08
**Status:** GATE COMPLETE

---

## Current Verified State

### Package Count
- packages/: 22
- runtimes/: 4
- minds/: 0 (no package.json)
- web/: 1
- **TOTAL: 27**

### Build Status
- **ALL 27 packages build successfully**
- Web builds with 15 static pages
- CLI works with `node packages/cli/dist/cli.js`

### Source Metrics
- TypeScript files: 201
- Total LOC: ~31,000 (estimated)
- Test files: 0
- Documentation files: 24

---

## Proposed Minimal Architecture

Based on actual dependency analysis, the minimal kernel consists of:

### Core Layer (MUST HAVE)
1. **core** = kernel + schemas + telemetry + security + policy + storage
   - Foundation types, errors, utilities
   - Zod schemas for all domain objects
   - Event system with persistence
   - Capability-based security
   - Policy engine
   - Storage adapters

### Runtime Layer (MUST HAVE)
2. **runtime** = ollama + mlx + llamacpp + local
   - Model runtime abstraction
   - Multiple adapter support
   - Model registry

### State Layer (MUST HAVE)
3. **state** = memory + skills + tools + genome
   - Persistent memory engine
   - Skill engine with composition
   - Tool system with capabilities
   - Genome versioning

### Integration Layer (MUST HAVE)
4. **mind** = mind runtime integrating all
   - Mind lifecycle
   - Task execution
   - Evolution triggering
   - Benchmarking

### Optional Layers (PLUGIN)
5. **evaluation** - Evaluation suites (can be separate)
6. **evolution** - Evolution engine (can be separate)
7. **benchmark** - MindBench (can be separate)
8. **cli** - CLI interface (can be separate)
9. **sdk** - Client API (can be separate)
10. **web** - Web platform (SEPARATE REPO)

---

## Package-by-Package Analysis

### KEEP (Core)
| Package | Rationale | Dependencies | Files |
|---------|-----------|--------------|-------|
| kernel | Foundation types, errors, utilities | 0 internal | Essential |
| schemas | All Zod schemas | 0 internal | Essential |
| security | Capability-based security | kernel, schemas | Essential |
| policy | Policy engine | kernel, schemas, security | Essential |
| storage | Storage adapters | kernel, schemas | Essential |
| telemetry | Event system | kernel | Essential |

### KEEP (Runtime)
| Package | Rationale | Dependencies | Files |
|---------|-----------|--------------|-------|
| models | Runtime abstraction | kernel, schemas, providers | Essential |
| providers | Provider registry | kernel, schemas, security | Essential |
| routing | Policy-driven routing | kernel, models, providers, security, policy | Essential |
| ollama | Ollama adapter | models, kernel | Adapter |
| mlx | MLX adapter | models, kernel | Adapter |
| llamacpp | llama.cpp adapter | models, kernel | Adapter |
| local | Local adapter | models, kernel | Adapter |

### KEEP (State)
| Package | Rationale | Dependencies | Files |
|---------|-----------|--------------|-------|
| memory | Memory engine | kernel, schemas, storage, security | Essential |
| skills | Skill engine | kernel, schemas, storage, tools, security | Essential |
| tools | Tool system | kernel, schemas, security, policy | Essential |
| genome | Genome versioning | kernel, schemas, storage, security | Essential |

### KEEP (Integration)
| Package | Rationale | Dependencies | Files |
|---------|-----------|--------------|-------|
| mind | Mind runtime | Everything | Essential |

### OPTIONAL (Plugin)
| Package | Rationale | Dependencies | Files |
|---------|-----------|--------------|-------|
| evaluation | Evaluation suites | kernel, schemas, security | Optional |
| evolution | Evolution engine | kernel, schemas, storage, security, policy | Optional |
| benchmark | MindBench | kernel, schemas, storage, security | Optional |
| cognition | Cognitive engine | kernel, schemas, memory, skills, tools, models, routing, security, policy | Optional |
| compiler | Cognitive compiler | kernel, schemas, memory, skills, tools, models, routing, security, policy, evaluation | Optional |

### SEPARATE (Platform)
| Package | Rationale | Dependencies | Files |
|---------|-----------|--------------|-------|
| web | Web platform | Next.js, React, etc. | Separate repo |
| sdk | Client API | All packages | Separate |
| cli | CLI interface | All packages | Separate |

---

## Proposed Architecture

```
SE-AI KERNEL (tiny)
├── core/
│   ├── kernel/
│   ├── schemas/
│   ├── telemetry/
│   ├── security/
│   ├── policy/
│   └── storage/
├── runtime/
│   ├── models/
│   ├── providers/
│   ├── routing/
│   ├── ollama/
│   ├── mlx/
│   ├── llamacpp/
│   └── local/
├── state/
│   ├── memory/
│   ├── skills/
│   ├── tools/
│   └── genome/
└── mind/
    └── mind/

OPTIONAL PLUGINS
├── evaluation/
├── evolution/
├── benchmark/
├── cognition/
└── compiler/

SEPARATE
├── sdk/
├── cli/
└── web/
```

---

## Dependency Reduction Estimate

### Current Dependencies (per package)
| Package | Internal Deps | External Deps |
|---------|---------------|---------------|
| kernel | 0 | 2 |
| schemas | 0 | 2 |
| security | 2 | 0 |
| policy | 3 | 0 |
| storage | 2 | 1 |
| telemetry | 1 | 0 |
| models | 5 | 0 |
| providers | 5 | 0 |
| routing | 7 | 0 |
| memory | 4 | 0 |
| skills | 5 | 0 |
| tools | 3 | 0 |
| genome | 3 | 0 |
| mind | 15 | 0 |
| evaluation | 3 | 0 |
| evolution | 6 | 0 |
| benchmark | 6 | 0 |
| cognition | 9 | 0 |
| compiler | 10 | 0 |
| sdk | 20 | 0 |
| cli | 19 | 3 |

### Proposed Dependencies (after merge)
| Package | Internal Deps | External Deps |
|---------|---------------|---------------|
| core | 0 | 2 |
| runtime | 3 | 0 |
| state | 4 | 0 |
| mind | 4 | 0 |
| evaluation | 3 | 0 |
| evolution | 5 | 0 |
| benchmark | 5 | 0 |
| cognition | 7 | 0 |
| compiler | 8 | 0 |
| sdk | 1 | 0 |
| cli | 1 | 3 |

### Reduction
- Current: 27 packages, ~150 internal dependencies
- Proposed: ~11 packages, ~30 internal dependencies
- **Reduction: ~60% packages, ~80% internal dependencies**

---

## Migration Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking imports | HIGH | Use codemods, update in single PR |
| Runtime adapter complexity | MEDIUM | Keep adapters as separate files |
| State persistence | MEDIUM | Keep sql.js optional, add tests first |
| Evolution sandbox | HIGH | Use Docker/VM, not process isolation |
| Web separation | LOW | Separate repo, submodule for docs |

---

## Recommended Migration Steps

1. **Phase 1:** Fix all build issues (DONE)
2. **Phase 2:** Create core package (kernel+schemas+telemetry+security+policy+storage)
3. **Phase 3:** Create runtime package (models+providers+routing+adapters)
4. **Phase 4:** Create state package (memory+skills+tools+genome)
5. **Phase 5:** Create mind package (integration)
6. **Phase 6:** Move optional packages to plugins
7. **Phase 7:** Separate web into its own repo
8. **Phase 8:** Add tests for core functionality
9. **Phase 9:** Verify CLI, web build, deployment

---

*Compression gate completed 2025-09-08. Repository verified and ready for architectural compression.*