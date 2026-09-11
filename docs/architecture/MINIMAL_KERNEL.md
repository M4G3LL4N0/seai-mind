# SE-AI Mind — Minimal Kernel Architecture

**Date:** 2025-09-08

---

## Design Principle

The SE-AI kernel should behave like an operating-system kernel:
small, stable, providing primitives that higher-level systems build upon.

The intelligence grows through Minds, Models, Memory, Skills, Tools,
Evolution, Evaluation, and Extensions — NOT through adding packages to the kernel.

---

## Architecture

```
                SE-AI PLATFORM
                     │
                SE-AI SDK/API
                     │
              ┌──────┴──────┐
              │    MIND     │
              └──────┬──────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
       COGNITION   STATE      EVOLUTION
          │          │          │
          └──────────┼──────────┘
                     │
                   CORE
                     │
             RUNTIME CONTRACT
                     │
      ┌──────────────┼──────────────┐
      │              │              │
    LOCAL          CLOUD        SPECIALIST
    MODELS         MODELS          MODELS
```

## Layers

### 1. Core
Primitives required across the entire system.

**Contains:**
- Foundation types (Result, errors, IDs, timestamps, utilities)
- Zod schemas for all domain objects
- Event system (emit, subscribe, persist)
- Capability-based security (authorize, audit, threat detection)
- Policy engine (rules, evaluation, governance)
- Storage abstraction (persistence, repositories)

**Does NOT contain:**
- Model execution
- Memory
- Skills
- Tools
- Cognition
- Evolution
- Hardware detection (optional)

### 2. Runtime
Model execution abstraction.

**Contains:**
- Model registry (register, discover, filter)
- Provider registry (discover, verify, benchmark, lifecycle)
- Routing engine (policy-driven model selection, hardware-aware)
- Runtime adapters (Ollama, MLX, llama.cpp, local)

**Does NOT contain:**
- Memory
- Skills
- Tools
- Policy enforcement (delegates to core)

### 3. State
Persistent mind state.

**Contains:**
- Memory engine (store, retrieve, consolidate, forget, snapshot)
- Skill engine (create, validate, compose, execute)
- Tool system (register, authorize, execute, audit)
- Genome engine (create, diff, branch, rollback, export)

**Does NOT contain:**
- Model execution
- Policy enforcement (delegates to core)
- Event emission (delegates to core)

### 4. Mind
Central orchestrator.

**Contains:**
- Mind runtime (lifecycle, task execution, goal compilation)
- Cognitive pipeline (classify, retrieve, plan, act, verify)
- Compiler (goal → task graph with DAG algorithms)
- Evaluation (suites, criteria, scoring, comparison)
- Evolution (observe, evaluate, propose, sandbox, verify, promote)
- Benchmark (experiments, measurements, comparisons)

**Does NOT contain:**
- Runtime adapters (delegates to runtime)
- Storage implementations (delegates to core)

---

## Dependency Rules

1. Core depends on nothing.
2. Runtime depends only on Core.
3. State depends only on Core.
4. Mind depends on Core, Runtime, and State.
5. No circular dependencies allowed.
6. Each layer may only import from layers below it.

---

## What a Mind Needs to Exist

```
Mind
├── Identity        (from core/schemas)
├── Goals           (from core/schemas)
├── Values          (from core/schemas)
├── Memory          (from state/memory)
├── Skills          (from state/skills)
├── Tools           (from state/tools)
├── Model Fleet     (from runtime)
├── Routing         (from runtime/routing)
├── Evaluation      (from mind/evaluation)
├── Evolution       (from mind/evolution)
└── Genome          (from state/genome)
```

---

## What a Mind Needs to Improve

```
Evolution Cycle:
OBSERVE  →  EVALUATE  →  PROPOSE  →  SANDBOX  →  VERIFY  →  PROMOTE  →  ROLLBACK
    │            │            │            │            │            │            │
    └── mind/evolution ──────┴────────────┴────────────┴────────────┴────────────┘
```

---

*Minimal kernel architecture defined 2025-09-08.*