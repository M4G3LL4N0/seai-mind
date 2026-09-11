# SE-AI Mind (Darwin 0.1) — Package Decisions

**Date:** 2025-09-08
**Status:** DECISIONS MADE

---

## Classification System

- **CORE** — Foundation required by everything
- **RUNTIME** — Model execution abstraction
- **STATE** — Persistent mind state
- **INTEGRATION** — Mind orchestration
- **INTERFACE** — User-facing (CLI, SDK, Web)
- **ADAPTER** — Optional runtime implementation
- **EXTENSION** — Optional capability (can be separate package later)

---

## Decision Matrix

### MERGE → core

| Current Package | Role | Dependencies | Dependents | Current Value | Proposed Destination | Reason | Migration Risk |
|----------------|------|-------------|------------|---------------|---------------------|--------|----------------|
| kernel | Foundation types, errors, utilities | 0 | ALL | Essential | core | Foundation | LOW — rename imports |
| schemas | All Zod schemas, domain types | 0 | ALL | Essential | core | Single source of truth | LOW — rename imports |
| telemetry | Event system with persistence | kernel | security, memory, skills, mind, sdk | Essential | core | Used everywhere, small | LOW — rename imports |
| security | Capability-based security, threat detection | kernel, schemas | policy, memory, skills, tools, genome, mind, sdk | Essential | core | Foundational security primitive | LOW — rename imports |
| policy | Rule-based policy engine | kernel, schemas, security | routing, tools, evolution, mind, sdk | Essential | core | Governance primitive | LOW — rename imports |
| storage | Persistence abstraction | kernel, schemas | memory, skills, genome, benchmark | Essential | core | Persistence primitive | LOW — rename imports |

**Result:** core = kernel + schemas + telemetry + security + policy + storage

### MERGE → runtime

| Current Package | Role | Dependencies | Dependents | Current Value | Proposed Destination | Reason | Migration Risk |
|----------------|------|-------------|------------|---------------|---------------------|--------|----------------|
| models | Runtime abstraction, registry | kernel, schemas | routing, mind, sdk | Essential | runtime | Runtime contract | LOW — rename imports |
| providers | Provider discovery, verification | kernel, schemas, security | routing, mind, sdk | Essential | runtime | Provider management | LOW — rename imports |
| routing | Policy-driven model routing | kernel, schemas, models, providers, security, policy | cognition, mind, sdk | Essential | runtime | Model selection | LOW — rename imports |
| ollama | Ollama HTTP adapter | models, kernel, schemas, telemetry | sdk | REAL | runtime/ollama | Real working adapter | LOW — move file |
| mlx | MLX stub | models, kernel, schemas, telemetry | sdk | STUB | runtime/mlx | Keep as stub, clearly labeled | LOW — move file |
| llamacpp | llama.cpp subprocess adapter | models, kernel, schemas, telemetry | sdk | MOSTLY REAL | runtime/llamacpp | Real working adapter | LOW — move file |
| local | Local test stub | models, kernel, schemas, telemetry | sdk | STUB | runtime/local | Keep as test fixture | LOW — move file |

**Result:** runtime = models + providers + routing + 4 adapter files

### MERGE → state

| Current Package | Role | Dependencies | Dependents | Current Value | Proposed Destination | Reason | Migration Risk |
|----------------|------|-------------|------------|---------------|---------------------|--------|----------------|
| memory | Memory engine with persistence | kernel, schemas, storage, security, telemetry | cognition, mind, sdk | Essential | state/memory | Mind state | LOW — rename imports |
| skills | Skill engine with composition | kernel, schemas, storage, tools, security, telemetry | cognition, mind, sdk | Essential | state/skills | Mind capabilities | LOW — rename imports |
| tools | Tool system with capabilities | kernel, schemas, security, policy | skills, cognition, mind, sdk | MINIMAL | state/tools | Mind tools | LOW — rename imports |
| genome | Genome versioning | kernel, schemas, storage, security | evolution, mind, sdk | Essential | state/genome | Mind identity | LOW — rename imports |

**Result:** state = memory + skills + tools + genome

### KEEP → mind

| Current Package | Role | Dependencies | Dependents | Current Value | Proposed Destination | Reason | Migration Risk |
|----------------|------|-------------|------------|---------------|---------------------|--------|----------------|
| mind | Integration layer wiring all | ALL | sdk | Essential | mind | Central orchestrator | MEDIUM — update imports |
| cognition | Cognitive pipeline | kernel, schemas, memory, skills, tools, models, routing, security, policy, telemetry | mind, sdk | REAL | mind/cognition | Core intelligence | MEDIUM — move into mind |
| compiler | Goal-to-task compiler | kernel, schemas, memory, skills, tools, models, routing, security, policy, evaluation | mind, sdk | REAL | mind/compiler | Goal compilation | MEDIUM — move into mind |
| evaluation | Evaluation engine | kernel, schemas, security | compiler, evolution, mind, sdk | REAL+STUBS | mind/evaluation | Quality verification | MEDIUM — move into mind |
| evolution | Evolution engine | kernel, schemas, storage, security, policy, genome | mind, sdk | REAL+STUBS | mind/evolution | Self-improvement | MEDIUM — move into mind |
| benchmark | Benchmarking infrastructure | kernel, schemas, storage, security, hardware, cognition | mind, sdk | REAL | mind/benchmark | Performance measurement | MEDIUM — move into mind |

**Result:** mind = mind + cognition + compiler + evaluation + evolution + benchmark

### SEPARATE (not in kernel)

| Current Package | Role | Dependencies | Dependents | Current Value | Proposed Destination | Reason | Migration Risk |
|----------------|------|-------------|------------|---------------|---------------------|--------|----------------|
| sdk | Facade re-exporting all | ALL | cli | REAL (facade) | sdk | Client API | LOW — update imports |
| cli | CLI interface | sdk, hardware, telemetry | (none) | REAL+STUBS | cli | User interface | LOW — update imports |
| web | Marketing/docs site | (none, no @seai deps) | (none) | REAL | web (separate repo) | Not part of kernel | LOW — already independent |

### KEEP AS-IS (optional, outside kernel)

| Current Package | Role | Dependencies | Dependents | Current Value | Proposed Destination | Reason | Migration Risk |
|----------------|------|-------------|------------|---------------|---------------------|--------|----------------|
| hardware | Hardware detection | schemas | routing, mind, benchmark, cli | REAL | Optional in core | Only needed for hardware-aware routing | LOW — make optional |

**Note:** Hardware detection (936 LOC) is real and useful, but only needed by routing and benchmark. It can be an optional module within core or a separate package. For the minimal kernel, it should be optional.

---

## Final Architecture

```
SE-AI KERNEL (4 packages)
├── core/
│   ├── index.ts          (from kernel)
│   ├── schemas.ts        (from schemas)
│   ├── telemetry.ts      (from telemetry)
│   ├── security.ts       (from security)
│   ├── policy.ts         (from policy)
│   └── storage.ts        (from storage)
├── runtime/
│   ├── index.ts          (from models + providers + routing)
│   ├── adapters/
│   │   ├── ollama.ts     (from runtimes/ollama)
│   │   ├── mlx.ts        (from runtimes/mlx)
│   │   ├── llamacpp.ts   (from runtimes/llamacpp)
│   │   └── local.ts      (from runtimes/local)
├── state/
│   ├── index.ts          (barrel)
│   ├── memory.ts         (from memory)
│   ├── skills.ts         (from skills)
│   ├── tools.ts          (from tools)
│   └── genome.ts         (from genome)
├── mind/
│   ├── index.ts          (from mind)
│   ├── cognition.ts      (from cognition)
│   ├── compiler.ts       (from compiler)
│   ├── evaluation.ts     (from evaluation)
│   ├── evolution.ts      (from evolution)
│   └── benchmark.ts      (from benchmark)

SEPARATE (not in kernel)
├── sdk/
├── cli/
└── web/ (separate repo)
```

---

## Dependency Graph (After)

```
core (0 internal deps)
  ↓
runtime (depends on: core)
  ↓
state (depends on: core)
  ↓
mind (depends on: core, runtime, state)
  ↓
sdk (depends on: core, runtime, state, mind)
  ↓
cli (depends on: sdk)
```

**Total internal dependency edges: ~15 (down from ~80)**

---

## What Each Layer Provides

### core
- Foundation types (Result, errors, IDs, timestamps)
- Zod schemas for all domain objects
- Event system (emit, subscribe, persist)
- Capability-based security (authorize, audit, threat detection)
- Policy engine (rules, evaluation, governance)
- Storage abstraction (persistence, repositories)

### runtime
- Model registry (register, discover, filter)
- Provider registry (discover, verify, benchmark, lifecycle)
- Routing engine (policy-driven model selection, hardware-aware)
- Runtime adapters (Ollama, MLX, llama.cpp, local)

### state
- Memory engine (store, retrieve, consolidate, forget, snapshot)
- Skill engine (create, validate, compose, execute)
- Tool system (register, authorize, execute, audit)
- Genome engine (create, diff, branch, rollback, export)

### mind
- Mind runtime (lifecycle, task execution, goal compilation)
- Cognitive pipeline (classify, retrieve, plan, act, verify)
- Compiler (goal → task graph with DAG algorithms)
- Evaluation (suites, criteria, scoring, comparison)
- Evolution (observe, evaluate, propose, sandbox, verify, promote)
- Benchmark (experiments, measurements, comparisons)

---

*Package decisions completed 2025-09-08.*