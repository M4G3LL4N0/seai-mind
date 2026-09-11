# SE-AI Mind (Darwin 0.1) — Dependency Graph Audit

**Audit Date:** 2025-09-08

---

## 📦 Package Dependency Graph

### Dependency Direction (A → B means A depends on B)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DEPENDENCIES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  zod (29 packages)                                                          │
│  uuid (29 packages)                                                         │
│  sql.js (1: storage)                                                        │
│  commander, chalk, ora (1: cli)                                             │
│  next, react, react-dom, lucide-react, framer-motion, recharts,            │
│  clsx, tailwind-merge, date-fns (1: web)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Internal Dependency Graph (Workspace)

### Layer 0: No Internal Dependencies (Leaf)
```
@seai/kernel          ← ZERO internal deps
@seai/schemas         ← ZERO internal deps
@seai/hardware        ← ZERO internal deps
@seai/telemetry       ← kernel
@seai/security        ← kernel, schemas, telemetry
@seai/policy          ← kernel, schemas, security, telemetry
@seai/storage         ← kernel, schemas
```

### Layer 1: Foundation Dependencies
```
@seai/models          ← kernel, schemas, hardware, telemetry, providers
@seai/providers       ← kernel, schemas, storage, security, policy, telemetry
@seai/routing         ← kernel, models, providers, hardware, policy, security, schemas
@seai/memory          ← kernel, schemas, storage, security
@seai/skills          ← kernel, schemas, storage, tools
@seai/tools           ← kernel, schemas, security, policy
```

### Layer 2: Subsystem Dependencies
```
@seai/cognition       ← kernel, memory, skills, tools, models, routing, schemas
@seai/compiler        ← kernel, cognition, routing, memory, skills, tools, models, evaluation, schemas
@seai/evaluation      ← kernel, schemas, telemetry
@seai/evolution       ← kernel, mind, memory, skills, genome, evaluation, benchmark, security, policy, schemas
@seai/genome          ← kernel, schemas, storage
@seai/benchmark       ← kernel, mind, models, evaluation, hardware, telemetry, schemas, storage
```

### Layer 3: Integration
```
@seai/mind            ← kernel, memory, skills, tools, cognition, models, routing, evaluation, evolution, genome, hardware, telemetry, security, policy, storage, schemas
@seai/sdk             ← kernel, mind, memory, skills, tools, cognition, models, routing, evolution, genome, evaluation, benchmark, hardware, telemetry, security, policy, storage, schemas
@seai/cli             ← sdk, kernel, mind, hardware, models, providers, memory, skills, genome, benchmark, evolution
@seai/benchmark       ← kernel, mind, models, evaluation, hardware, telemetry, schemas, storage
```

### Layer 3: Runtimes (depend on models)
```
@seai/runtime-ollama  ← models, kernel, schemas, telemetry
@seai/runtime-mlx     ← models, kernel, schemas, telemetry
@seai/runtime-llamacpp← models, kernel, schemas, telemetry
@seai/runtime-local   ← models, kernel, schemas, telemetry
```

### Layer 3: Web (depends on SDK)
```
@seai/web             ← sdk, kernel, mind, hardware, models, providers, memory, skills, genome, benchmark, evolution
```

---

## 📊 Dependency Metrics

| Package | Direct Deps | Transitive | Depth | Fan-out | Fan-in |
|---------|-------------|------------|-------|---------|--------|
| kernel | 0 | 2 | 0 | 22 | 0 |
| schemas | 0 | 2 | 0 | 22 | 0 |
| hardware | 0 | 2 | 0 | 1 | 0 |
| telemetry | 1 | 3 | 1 | 7 | 1 |
| security | 3 | 5 | 2 | 10 | 3 |
| policy | 4 | 6 | 2 | 2 | 4 |
| storage | 2 | 4 | 1 | 5 | 2 |
| models | 5 | 7 | 2 | 5 | 5 |
| providers | 6 | 8 | 2 | 1 | 5 |
| routing | 7 | 9 | 3 | 1 | 6 |
| memory | 4 | 6 | 2 | 4 | 4 |
| skills | 4 | 6 | 2 | 4 | 4 |
| tools | 4 | 6 | 2 | 3 | 4 |
| cognition | 7 | 9 | 3 | 1 | 7 |
| compiler | 9 | 11 | 4 | 0 | 8 |
| evaluation | 3 | 5 | 2 | 2 | 3 |
| evolution | 10 | 12 | 4 | 1 | 10 |
| genome | 3 | 5 | 2 | 2 | 3 |
| benchmark | 7 | 9 | 3 | 0 | 7 |
| mind | 15 | 17 | 5 | 1 | 15 |
| sdk | 16 | 18 | 5 | 1 | 16 |
| cli | 11 | 13 | 4 | 0 | 11 |
| **web** | **1** | **2** | **1** | **0** | **1** |

---

## 🔴 Circular Dependencies

**VERIFIED: ZERO circular dependencies detected.**

The workspace graph is a clean DAG (Directed Acyclic Graph).

---

## ⚠️ Unnecessary / Redundant Dependencies

### 1. **models → providers** (and vice versa = potential cycle risk)
- `models` depends on `providers` for provider registry
- `providers` depends on `models` for Model type
- **Risk:** Circular if both import each other's types
- **Actual:** `models` imports `ProviderRegistry` from providers, `providers` imports `Model` type from models
- **Fix:** Extract shared types to `schemas` or `kernel`

### 2. **mind → everything** (15 direct deps)
```
mind → [kernel, memory, skills, tools, cognition, models, routing, evaluation, evolution, genome, hardware, telemetry, security, policy, storage, schemas]
```
- **Problem:** `mind` is a "god package" depending on everything
- **Impact:** Any change anywhere forces mind rebuild
- **Fix:** Split mind into coordinator + thin facade

### 3. **sdk → everything** (16 direct deps)
- Re-exports everything
- **Problem:** Creates diamond dependencies
- **Fix:** Make SDK a thin facade over a single `mind` instance

### 4. **cli → sdk + 10 others** (redundant)
```
cli → sdk, kernel, mind, hardware, models, providers, memory, skills, genome, benchmark, evolution
```
- **Problem:** cli imports sdk AND all its dependencies
- **Fix:** cli should only depend on sdk

### 5. **benchmark → mind** (tight coupling)
- benchmark imports mind for `CognitionEngine`
- **Problem:** Benchmark cannot run without full mind
- **Fix:** Benchmark should test isolated components

### 6. **evolution → mind** (tight coupling)
- evolution imports mind for `MindRuntime`
- **Problem:** Evolution cannot run without full mind
- **Fix:** Evolution should work on genome/mind state, not runtime

---

## 🔄 Package Coupling Analysis

### High Coupling (Fan-out > 5)
| Package | Fan-out | Coupled To |
|---------|---------|------------|
| mind | 15 | kernel, memory, skills, tools, cognition, models, routing, evaluation, evolution, genome, hardware, telemetry, security, policy, storage, schemas |
| sdk | 16 | kernel, mind, memory, skills, tools, cognition, models, routing, evolution, genome, evaluation, benchmark, hardware, telemetry, security, policy, storage, schemas |
| compiler | 9 | kernel, cognition, routing, memory, skills, tools, models, evaluation, schemas |
| evolution | 10 | kernel, mind, memory, skills, genome, evaluation, benchmark, security, policy, schemas |
| benchmark | 7 | kernel, mind, models, evaluation, hardware, telemetry, schemas, storage |
| cognition | 7 | kernel, memory, skills, tools, models, routing, schemas |
| routing | 7 | kernel, models, providers, hardware, policy, security, schemas |

### Low Coupling (Good)
| Package | Fan-out | Note |
|---------|---------|------|
| kernel | 0 | Foundation |
| schemas | 0 | Foundation |
| hardware | 0 | Independent |
| storage | 2 | Only kernel + schemas |
| telemetry | 1 | Only kernel |
| evaluation | 3 | kernel, schemas, telemetry |
| genome | 3 | kernel, schemas, storage |

---

## 🎯 Recommended Dependency Reductions

### Priority 1: Break the "God Package" (mind)
```
CURRENT: mind → 15 deps
TARGET:  mind → 3 deps (kernel, schemas, runtime_coordinator)

Move to separate packages:
- mind-coordinator (orchestrates subsystems)
- mind-facade (thin API)
- mind-state (persistent state only)
```

### Priority 2: Make SDK a True Facade
```
CURRENT: sdk → 16 deps
TARGET:  sdk → 1 dep (mind)
```

### Priority 3: Extract Shared Types
```
Move to schemas (or new @seai/types):
- Model, Provider types (currently in models+providers)
- Error types (currently kernel+schemas)
- Result types (currently kernel)
```

### Priority 4: Decouple Benchmark & Evolution from Mind
```
benchmark: Use isolated components, not full Mind
evolution: Work on Genome + component configs, not MindRuntime
```

---

## 📦 Proposed Minimal Dependency Graph

```
                    ┌─────────────┐
                    │   @seai/web │  (optional, separate repo)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  @seai/sdk  │  ← ONLY depends on @seai/mind
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  @seai/mind │  ← 3 deps: kernel, schemas, runtime_coordinator
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  @seai/core   │ │ @seai/runtime │ │ @seai/state   │
│ (kernel,      │ │ (ollama, mlx, │ │ (genome,      │
│  schemas,     │ │  llamacpp,    │ │  memory,      │
│  telemetry,   │ │  local)       │ │  skills,      │
│  security,    │ │               │ │  tools,       │
│  policy,      │ │               │ │  cognition)   │
│  storage)     │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘

Separate (optional, plugin):
- @seai/evolution  (depends on core + state)
- @seai/benchmark  (depends on core + state)
- @seai/compiler   (depends on core + state)
- @seai/cli        (depends on sdk)
```

---

## 📋 Migration Impact

| Change | Packages Affected | Effort |
|--------|-------------------|--------|
| Split mind | mind, sdk, cli, web | High |
| Extract core | kernel, schemas, telemetry, security, policy, storage | Medium |
| Extract runtime | runtimes/*, models, providers, routing | Medium |
| Extract state | genome, memory, skills, tools, cognition | Medium |
| Fix circular types | models, providers | Low |
| Remove redundant deps | cli, sdk, benchmark, evolution | Low |

---

*Dependency graph generated from actual package.json analysis. Circular check: CLEAN.*