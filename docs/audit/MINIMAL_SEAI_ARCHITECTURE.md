# SE-AI Mind (Darwin 0.1) — Minimal Architecture Design

**Audit Date:** 2025-09-08  
**Objective:** MAXIMUM INTELLIGENCE, MINIMUM REPOSITORY COMPLEXITY

---

## 🎯 Executive Summary

**Current State:** 29 packages, 31K LOC, 4 broken, 0 tests, 0% deployable  
**Proposed State:** ~7 packages, ~8K LOC, all building, testable, deployable  
**Reduction:** ~75% packages, ~75% LOC, 100% build success

---

## 🔴 Current Architecture Problems

### 1. Package Explosion (29 packages for 1 product)
```
Current: 29 packages (24 core + 4 runtimes + 1 web)
Problem: Each package = separate build, test, version, publish, dependency
```

### 2. God Package (mind)
```
mind → 15 direct dependencies
Any change anywhere = mind rebuild
God package = single point of failure + coupling
```

### 3. SDK = Re-export Everything
```
sdk → 16 deps = re-exports everything
Diamond dependencies everywhere
```

### 4. Broken Integration Layer
```
mind, memory, genome, hardware = BROKEN (TS errors)
These ARE the SE-AI intelligence — the core thesis
```

### 5. Mock Implementations in "Core" Packages
```
cognition: 6 STUB methods returning null
evolution: sandbox MOCK, reviews AUTO-PASS
runtimes: mlx/llamacpp = MOCK implementations
evaluation: LLM Judge = PLACEHOLDER
```

### 6. Zero Tests
```
0 test files across 28 packages
No CI can verify correctness
```

---

## 🎯 Minimal Architecture Principle

**"If a boundary doesn't enable independent deployment, independent lifecycle, security isolation, or plugin extensibility — it shouldn't exist."**

---

## 🏗️ Proposed Minimal Architecture

### Target: 7 Packages (not 29)

```
seai-mind/
├── packages/
│   ├── core/              # kernel + schemas + telemetry + security + policy + storage
│   ├── runtime/           # ollama + mlx + llamacpp + local (unified)
│   ├── state/             # genome + memory + skills + tools
│   ├── cognition/         # compiler + evaluation (thin)
│   ├── evolution/         # standalone (depends on core + state)
│   ├── benchmark/         # standalone (depends on core + state)
│   └── cli/               # thin facade over core
├── web/                   # SEPARATE REPO (optional)
└── minds/                 # Specs only (no code)
```

---

## 📦 Package Definitions

### 1. `@seai/core` (Foundation)
**Combines:** kernel + schemas + telemetry + security + policy + storage
- **Exports:** Types, errors, Result, events, hardware detection, capabilities, permissions, policies, storage adapters
- **Deps:** zod, uuid, sql.js (optional)
- **Exports:** `SEAIError`, `Result`, `EventEmitter`, `SecurityEngine`, `PolicyEngine`, `StorageAdapter`, `HardwareProfile`, all Zod schemas

### 2. `@seai/runtime` (Model Execution)
**Combines:** models + providers + routing + ollama + mlx + llamacpp + local
- **Exports:** `InferenceRuntime`, `ModelRegistry`, `ProviderRegistry`, `RuntimeManager`, `Model`, `Provider`
- **Deps:** core, fetch (native)
- **Entry:** `createRuntimeManager()` returns manager with all 4 adapters

### 3. `@seai/state` (Persistent Intelligence)
**Combines:** genome + memory + skills + tools
- **Exports:** `MemoryEngine`, `SkillEngine`, `ToolEngine`, `GenomeEngine`
- **Deps:** core, runtime (optional for skill/tool execution)
- **Key:** All persistence, versioning, evolution happens here

### 4. `@seai/cognition` (Thin Orchestration)
**Combines:** compiler + evaluation (thin)
- **Exports:** `CognitiveCompiler`, `CognitionEngine`, `EvaluationEngine`
- **Deps:** core, state, runtime
- **Note:** No heavy logic — just orchestrates state + runtime

### 5. `@seai/evolution` (Standalone)
**Deps:** core, state
**Exports:** `EvolutionEngine`, `EvolutionLab`
**Note:** Works on genome + state, NOT on mind runtime

### 6. `@seai/benchmark` (Standalone)
**Deps:** core, state, runtime
**Exports:** `BenchmarkEngine`, `BenchmarkExperiment`

### 7. `@seai/cli` (Thin Facade)
**Deps:** core only (or sdk)
**Entry:** `seai` command

---

## 📁 Proposed File Tree

```
seai-mind/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── errors.ts           # SEAIError hierarchy
│   │   │   ├── result.ts           # Result<T,E> pattern
│   │   │   ├── utils.ts            # generateId, nowISO, math, pagination
│   │   │   ├── types.ts            # DeepReadonly, Optional, etc.
│   │   │   ├── telemetry.ts        # EventEmitter + persistence
│   │   │   ├── hardware.ts         # HardwareProfile + detectors
│   │   │   ├── security.ts         # CapabilityEngine + ThreatDetection
│   │   │   ├── policy.ts           # PolicyEngine + checks
│   │   │   ├── storage.ts          # StorageAdapter + Repository
│   │   │   ├── schemas/            # ALL Zod schemas (50+)
│   │   │   │   ├── index.ts        # Re-exports all
│   │   │   │   ├── mind.ts         # Mind, Genome, Memory, Skill, Tool, Model, Provider
│   │   │   │   ├── events.ts       # Event types
│   │   │   │   ├── hardware.ts     # HardwareProfile
│   │   │   │   ├── security.ts     # Capabilities, threats
│   │   │   │   └── benchmark.ts    # BenchmarkResult
│   │   │   └── index.ts            # Single barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── runtime/
│   │   ├── src/
│   │   │   ├── runtime.ts          # InferenceRuntime interface
│   │   │   ├── registry.ts         # ModelRegistry + ProviderRegistry
│   │   │   ├── manager.ts          # RuntimeManager
│   │   │   ├── selection.ts        # Model selection logic
│   │   │   ├── ollama.ts           # OllamaRuntime
│   │   │   │   ├── discover.ts
│   │   │   │   ├── load.ts
│   │   │   │   ├── generate.ts
│   │   │   │   └── health.ts
│   │   │   ├── mlx.ts              # MLXRuntime
│   │   │   ├── llamacpp.ts         # LlamaCppRuntime
│   │   │   ├── local.ts            # LocalRuntime
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── state/
│   │   ├── src/
│   │   │   ├── memory.ts           # MemoryEngine
│   │   │   ├── skills.ts           # SkillEngine
│   │   │   ├── tools.ts            # ToolEngine
│   │   │   ├── genome.ts           # GenomeEngine
│   │   │   ├── persistence.ts      # Repository implementations
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cognition/
│   │   ├── src/
│   │   │   ├── compiler.ts         # CognitiveCompiler
│   │   │   ├── engine.ts           # CognitionEngine (thin)
│   │   │   ├── evaluation.ts       # EvaluationEngine
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── evolution/
│   │   ├── src/
│   │   │   ├── engine.ts           # EvolutionEngine
│   │   │   ├── lab.ts              # EvolutionLab (real sandbox)
│   │   │   ├── generators/         # Per-layer generators
│   │   │   ├── reviews/            # Security/Privacy/Cost reviews
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── benchmark/
│   │   ├── src/
│   │   │   ├── engine.ts           # BenchmarkEngine
│   │   │   ├── tasks/              # Built-in task definitions
│   │   │   ├── comparison.ts       # Experiment comparison
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── cli/
│       ├── src/
│       │   ├── commands/           # doctor, init, run, goal, evolve, benchmark
│       │   ├── client.ts           # Thin SDK wrapper
│       │   └── index.ts            # Commander setup
│       ├── package.json
│       └── tsconfig.json
│
├── web/                    # SEPARATE REPO (seai-mind-web)
│   └── ... (Next.js app)
│
├── minds/                  # Specs only (markdown)
│   └── paios/
│       └── SPEC.md
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── roadmap/
│   └── audit/
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json           # Root (for IDE)
├── vercel.json             # For web repo only
├── .gitignore
├── README.md
└── CHANGELOG.md
```

---

## 📦 Proposed Dependencies

### Root package.json
```json
{
  "name": "seai-mind",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0"
  },
  "engines": { "node": ">=22.0.0" },
  "packageManager": "pnpm@11.17.0"
}
```

### Package Dependencies

| Package | Dependencies | Dev Dependencies |
|---------|-------------|------------------|
| core | zod, uuid, sql.js (optional) | typescript, vitest, eslint |
| runtime | core, fetch (native) | typescript, vitest, eslint |
| state | core, runtime (optional) | typescript, vitest, eslint |
| cognition | core, state, runtime | typescript, vitest, eslint |
| evolution | core, state | typescript, vitest, eslint |
| benchmark | core, state, runtime | typescript, vitest, eslint |
| cli | core (or sdk) | typescript, vitest, eslint, commander, chalk, ora |

### Web (separate repo)
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "lucide-react": "^0.400",
    "clsx": "^2.1",
    "tailwind-merge": "^2.3",
    "framer-motion": "^11",
    "recharts": "^2.12",
    "date-fns": "^3.6",
    "@seai/sdk": "workspace:*"
  }
}
```

---

## 📉 Reduction Metrics

| Metric | Current | Proposed | Reduction |
|--------|---------|----------|-----------|
| Packages | 29 | 7 | **-76%** |
| Source files | 134 | ~35 | **-74%** |
| Lines of code | 31,183 | ~8,000 | **-74%** |
| Direct dependencies (total) | 150+ | ~35 | **-77%** |
| Max dependency depth | 5 | 2 | **-60%** |
| Build time (est) | 60s+ | <10s | **-85%** |
| Install size | ~500MB | ~50MB | **-90%** |

---

## 🚀 Migration Plan

### Phase 1: Fix Current Build (Week 1)
- [ ] Fix TS4111 in memory, genome, hardware
- [ ] Fix web lint (add ESLint config)
- [ ] All 29 packages build + typecheck

### Phase 2: Consolidate Foundation (Week 2)
- [ ] Merge kernel + schemas + telemetry + security + policy + storage → `core`
- [ ] Verify all imports update
- [ ] All tests pass (add smoke tests)

### Phase 3: Consolidate Runtime (Week 2)
- [ ] Merge models + providers + routing + 4 runtimes → `runtime`
- [ ] Single `RuntimeManager` with 4 adapters

### Phase 4: Consolidate State (Week 3)
- [ ] Merge genome + memory + skills + tools → `state`
- [ ] Fix broken memory/genome in context

### Phase 5: Thin Cognition + Evolution (Week 3)
- [ ] Merge compiler + evaluation → `cognition` (thin)
- [ ] Make evolution work on `state` not `mind`
- [ ] Implement REAL sandbox (Docker/VM)

### Phase 6: Thin Facade + CLI (Week 3)
- [ ] Create `cli` as thin facade over `core` + `state` + `runtime`
- [ ] Remove `sdk` package (replaced by CLI + direct imports)

### Phase 7: Web Separation (Week 4)
- [ ] Move `web/` to separate repo `seai-mind-web`
- [ ] Add as Git submodule or separate deploy
- [ ] Vercel deploy from web repo

### Phase 8: Tests + CI (Week 4)
- [ ] Add unit tests for core (target 80%)
- [ ] Add integration tests for state + runtime
- [ ] Fix CI pipeline (all green)

---

## ⚠️ Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking imports during merge | HIGH | HIGH | Use codemods, rename in single PR |
| Runtime adapter complexity | MEDIUM | HIGH | Keep adapters as separate files in runtime/ |
| State persistence complexity | MEDIUM | HIGH | Keep sql.js optional, add tests first |
| Evolution sandbox | HIGH | CRITICAL | Use gVisor/Firecracker, not process isolation |
| Web separation | LOW | MEDIUM | Separate repo, submodule for docs |
| Zero → test coverage | HIGH | HIGH | Add tests BEFORE merging |

---

## 🎯 Success Criteria for Minimal Architecture

| Criterion | Target |
|-----------|--------|
| `pnpm build` | ✅ All 7 packages in <10s |
| `pnpm typecheck` | ✅ Zero errors |
| `pnpm lint` | ✅ Zero warnings |
| `pnpm test` | ✅ >80% coverage |
| `pnpm install` | <15s, <50MB |
| `seai doctor` | ✅ Works |
| `seai init && seai run "test"` | ✅ Works end-to-end |
| `pnpm --filter @seai/web build` | ✅ Vercel deployable |

---

## 💡 Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| 7 packages | Each = independent deploy/lifecycle boundary |
| Core = 6 merged | No independent deployment needed |
| Runtime unified | All 4 adapters share 90% code |
| State unified | Genome+Memory+Skills+Tools = persistent intelligence |
| Cognition thin | Just orchestration, no heavy logic |
| Evolution/Benchmark standalone | Plugin architecture |
| Web separate | Different lifecycle, team, deploy target |
| SDK removed | Was just re-export; use direct imports |
| Tests mandatory | No merge without tests |

---

## 📋 Final Answer to Audit Question

> **"If we had to rebuild Darwin 0.1 today from scratch, knowing everything we now know, what is the smallest possible implementation that still demonstrates a genuinely powerful Self-Evolving AI Mind?"**

**Answer: 7 packages, ~8K LOC, 4 layers**

```
Core (types, errors, events, security, policy, storage, hardware)
    ↓
Runtime (4 adapters unified)
    ↓
State (genome + memory + skills + tools = persistent intelligence)
    ↓
Cognition (thin orchestration) + Evolution (plugin) + Benchmark (plugin)
    ↓
CLI (thin facade) + Web (separate repo)
```

**This is the smallest architecture that preserves:**
- ✅ Model independence (runtime abstraction)
- ✅ Persistent memory/skills/genome
- ✅ Governed evolution (sandbox + reviews)
- ✅ Policy/privacy enforcement
- ✅ Hardware-aware routing
- ✅ Benchmarking with provenance
- ✅ Model-agnostic, provider-agnostic

**This is NOT in the minimal architecture:**
- ❌ Separate packages for kernel/schemas/telemetry/security/policy/storage
- ❌ Separate packages for models/providers/routing
- ❌ Separate packages for genome/memory/skills/tools
- ❌ Separate packages for compiler/evaluation
- ❌ SDK re-export package
- ❌ Web in same repo
- ❌ Mock implementations in core
- ❌ God package (mind)
- ❌ Zero tests

---

*This architecture is derived from forensic analysis of actual implementation, not from the original design document.*