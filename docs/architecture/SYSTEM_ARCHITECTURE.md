# SE-AI Mind - System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SE-AI MIND (Darwin)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   MIND       │  │   GENOME     │  │  EVOLUTION   │  │  BENCHMARK   │   │
│  │  Runtime     │  │  Engine      │  │   Lab        │  │   Engine     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │           │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴───────┐  │
│  │                    COGNITIVE COMPILER                                │  │
│  │  GOAL → CLASSIFY → CACHE → MEMORY → SKILL → TOOL → MODEL → VERIFY   │  │
│  └──────┬────────────────────────────────────────────────────────────┬─┘  │
│         │                                                            │     │
│  ┌──────┴────────────────────────────────────────────────────────────┴───┐  │
│  │                        SUBSYSTEMS                                     │  │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │ │Memory  │ │ Skills │ │ Tools  │ │Routing │ │ Models │ │Providers│  │  │
│  │ │Engine  │ │Engine  │ │Engine  │ │Engine  │ │Runtime │ │Registry │  │  │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  └──────┬────────────────────────────────────────────────────────────┬─┘  │
│         │                                                            │     │
│  ┌──────┴────────────────────────────────────────────────────────────┴───┐  │
│  │                      FOUNDATION                                       │  │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │ │Security│ │ Policy │ │Storage │ │Hardware│ │Telemetry│ │Schemas │  │  │
│  │ │Engine  │ │Engine  │ │Adapter │ │Detect  │ │System  │ │(Zod)   │  │  │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Model ≠ Mind
- **Model**: Neural network weights + architecture (static)
- **Mind**: Persistent executable system (dynamic, evolving)

### 2. Cheapest Inference is No Inference
Cognitive compiler checks (in order):
1. Cache
2. Memory retrieval
3. Knowledge base
4. Skill execution
5. Tool use
6. Model inference (last resort)

### 3. Privacy First
- Default deny for cross-privilege access
- Local-first execution
- Explicit consent for external providers
- Redaction for lower-privacy contexts

### 4. Evolution with Guardrails
- Sandbox isolation
- Multi-layer reviews (security, privacy, cost)
- Human approval for promotion
- Instant rollback capability

---

## Data Flow

### Task Execution Pipeline

```
Task Input
    │
    ▼
┌─────────────┐
│ CLASSIFY    │ ──► Task type, complexity, required capabilities
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ CHECK CACHE │────►│ Hit? Return  │
└──────┬──────┘     │ cached result│
       │            └──────────────┘
       ▼
┌─────────────┐     ┌──────────────┐
│ CHECK MEMORY│────►│ Relevant     │
│             │     │ memories?    │
└──────┬──────┘     └──────┬───────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│ CHECK SKILL │────►│ Applicable   │
│             │     │ skill?       │
└──────┬──────┘     └──────┬───────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│ CHECK TOOL  │────►│ Applicable   │
│             │     │ tool?        │
└──────┬──────┘     └──────┬───────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────┐
│ SELECT MODEL (Routing Engine)       │
│ - Capability match                  │
│ - Privacy gate                      │
│ - Hardware compatibility            │
│ - Quality/latency/cost budgets      │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────┐
│ EXECUTE     │
│ (Model/Skill/Tool)
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ VERIFY      │────►│ Pass? Return │
└──────┬──────┘     │ result       │
       │            └──────────────┘
       ▼
┌─────────────┐
│ ESCALATE    │ ──► More capable model / human
└─────────────┘
```

---

## Component Details

### Memory Engine
```
Memory Types:
├── Working (100 entries, LRU)
├── Episodic (interactions, timestamped)
├── Semantic (facts, concepts)
├── Procedural (skills, workflows)
├── Identity (user profile)
├── Preference (explicit prefs)
├── Temporal (time patterns)
├── Relational (entity connections)
├── Negative (failed attempts)
└── Reflective (meta-cognition)

Lifecycle:
CAPTURE → VALIDATE → SCORE → CONSOLIDATE → COMPRESS → INDEX → 
RETRIEVE → USE → DECAY → ARCHIVE/DELETE
```

### Skill Engine
```
Skill = Procedure + Requirements + Evaluation
├── Inputs/Outputs (schemas)
├── Prerequisites (other skills)
├── Tools needed
├── Model requirements
├── Evaluator (for validation)
├── Examples (few-shot)
├── Version + Provenance
├── Performance metrics
└── Failure history

Composition: skillA → skillB → skillC
```

### Tool System
```
Capability-based:
├── web.search, web.fetch
├── file.read, file.write
├── shell.execute (sandboxed)
├── code.execute (sandboxed)
├── database.query
├── http.request
├── memory.query
└── skill.execute

Each declares: permissions, privacy, security, cost, latency, failure modes
```

### Routing Engine
```
Policy-driven selection:
Inputs: task, capability, privacy, hardware, quality, latency, cost, model caps, benchmarks
Output: model, runtime, provider, fallback chain

Rules (priority):
1. Privacy gate (reject if no approved route)
2. Capability match
3. Quality target
4. Latency budget
5. Cost budget
6. Hardware compatibility
7. Provider health
8. Benchmark history
9. Default fallback
```

### Evolution Engine
```
Layers (10):
1. Configuration
2. Prompts
3. Memory
4. Skills
5. Knowledge
6. Routing
7. Model Selection
8. Adapters
9. Distilled Models
10. Architecture

Loop:
OBSERVE → IDENTIFY WEAKNESS → GENERATE CANDIDATES → 
SANDBOX → BENCHMARK → REGRESSION → SECURITY → PRIVACY → COST →
COMPARE → PROMOTE → MONITOR → ROLLBACK IF NEEDED
```

---

## Runtime Adapters

| Runtime | Models | Strengths |
|---------|--------|-----------|
| Ollama | Local (llama, qwen, phi, etc.) | Easy setup, many models |
| MLX | Apple Silicon optimized | Fast on M-series, unified memory |
| llama.cpp | GGUF models, CPU/GPU | Quantization, broad support |
| Local | Stub | Testing, development |

---

## Security Boundaries

```
┌─────────────────────────────────────┐
│           SE-AI MIND                │
│  ┌─────────────────────────────┐   │
│  │      PRIVATE DATA           │   │ ◄── Never leaves
│  │  (memories, prefs, keys)    │   │
│  └──────────────┬──────────────┘   │
│                 │                  │
│  ┌──────────────▼──────────────┐   │
│  │    POLICY ENGINE            │   │
│  │  (privacy gates, capabilities)│  │
│  └──────────────┬──────────────┘   │
│                 │                  │
│  ┌──────────────▼──────────────┐   │
│  │    ROUTING DECISION         │   │
│  │  (local vs external)        │   │
│  └──────────────┬──────────────┘   │
│                 │                  │
│    LOCAL ───────┘  EXTERNAL*       │
│                 │                  │
│                 ▼                  │
│  ┌─────────────────────────────┐   │
│  │    APPROVED PROVIDERS ONLY  │   │
│  │  (verified, canary, active) │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

* External only with: user consent + privacy check + provider approval
```

---

## Deployment Topology

### Local Development
```
User Machine
├── seai CLI
├── Mind Runtime (Node.js)
├── Ollama / llama.cpp / MLX
├── SQLite (MemoryStorage)
└── FileStorage (artifacts)
```

### Production (Future)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Load       │     │  Mind       │     │  Model      │
│  Balancer   │────►│  Runtime    │────►│  Fleet      │
│             │     │  (K8s)      │     │  (K8s)      │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │PostgreSQL│   │Object   │
              │(State)   │   │Storage  │
              └─────────┘   └─────────┘
```

---

## Extension Points

1. **Custom Runtimes**: Implement `InferenceRuntime` interface
2. **Custom Skills**: Register via `SkillEngine.createSkill()`
3. **Custom Tools**: Register capability in `ToolEngine`
4. **Custom Policies**: Add rules to `PolicyEngine`
5. **Custom Evaluators**: Implement `EvaluationCriteria`
6. **Custom Generators**: Register per `EvolutionLayer`
7. **Custom Benchmarks**: Add tasks to `BenchmarkEngine`