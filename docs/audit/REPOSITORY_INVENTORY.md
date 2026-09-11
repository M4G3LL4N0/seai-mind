# SE-AI Mind (Darwin 0.1) — Repository Inventory

**Audit Date:** 2025-09-08  
**Auditor:** Forensic Analysis  
**Branch:** main (no commits yet)

---

## 📊 Summary Statistics

| Metric | Count |
|--------|-------|
| **Total files** (excl. node_modules, .git, dist, .next) | 255 |
| **TypeScript/TSX files** | 134 |
| **Total lines of code** | 31,183 |
| **Packages** | 24 (packages/) + 4 (runtimes/) + 1 (web) = 29 |
| **Runtime adapters** | 4 (ollama, mlx, llamacpp, local) |
| **Tests** | 0 (no test files found) |
| **Documentation files** | 24 (in docs/) + README.md (none) |
| **Documentation lines** | ~1,500 (estimated) |

---

## 📁 Directory Structure

```
/Users/matador/startups/seai-mind/
├── packages/           # 24 packages (core kernel)
│   ├── benchmark/      # MindBench infrastructure
│   ├── cli/            # seai command-line interface
│   ├── cognition/      # Cognitive engine (task pipeline)
│   ├── compiler/       # Cognitive compiler (goal → task graph)
│   ├── evaluation/     # Evaluation engine (suites, judges)
│   ├── evolution/      # Evolution engine (sandbox, promotion)
│   ├── genome/         # Intelligence genome (versioning, diff)
│   ├── hardware/       # Hardware detection & profiling
│   ├── kernel/         # Core types, errors, Result pattern
│   ├── memory/         # Multi-type memory engine
│   ├── mind/           # Mind runtime (integrates all)
│   ├── models/         # Model runtime abstraction & registry
│   ├── policy/         # Policy engine (routing, tools, memory)
│   ├── providers/      # Provider registry & lifecycle
│   ├── routing/        # Policy-driven model routing
│   ├── schemas/        # Zod schemas for all domain objects
│   ├── sdk/            # High-level TypeScript SDK
│   ├── security/       # Capability-based security, threat detection
│   ├── skills/         # Skill engine (composition, validation)
│   ├── storage/        # SQLite + Memory + File storage
│   ├── telemetry/      # Event system with persistence
│   └── tools/          # Capability-based tool system
├── runtimes/           # 4 runtime adapters
│   ├── ollama/         # Ollama HTTP API adapter
│   ├── mlx/            # MLX-LM for Apple Silicon
│   ├── llamacpp/       # llama.cpp server adapter
│   └── local/          # Stub for testing
├── web/                # Next.js web platform
│   ├── src/app/        # 11 pages (/, /darwin, /command, /architecture, /research, /benchmarks, /minds, /docs, /releases, /docs/getting-started, /test)
│   ├── src/components/ # UI components (home, layout, ui)
│   └── src/lib/        # Utilities
├── docs/               # Documentation (architecture, decisions, roadmap, strategy)
├── minds/              # PAIOS reference mind spec
├── scripts/            # doctor.js, init.js, benchmark.js
└── infrastructure/     # Empty
```

---

## 📈 Largest Files (Source)

| File | Lines | Purpose |
|------|-------|---------|
| packages/schemas/src/index.d.ts | 2,571 | Generated Zod type definitions |
| packages/schemas/src/index.ts | 712 | Core Zod schemas for all domain objects |
| packages/hardware/src/index.ts | 942 | Hardware detection (Darwin, Linux, Windows) |
| packages/providers/src/index.ts | 662 | Provider registry & lifecycle |
| packages/tools/src/index.ts | 632 | Tool engine & built-in capabilities |
| packages/evolution/src/index.ts | 606 | Evolution engine & sandbox |
| packages/mind/src/index.ts | 589 | Mind runtime integration |
| packages/security/src/index.ts | 586 | Security engine & threat detection |
| packages/memory/src/index.ts | 584 | Multi-type memory engine |
| packages/compiler/src/index.ts | 574 | Cognitive compiler |
| packages/skills/src/index.ts | 559 | Skill engine & templates |
| packages/routing/src/index.ts | 556 | Routing engine |
| packages/genome/src/index.ts | 530 | Intelligence genome |
| packages/benchmark/src/index.ts | 514 | MindBench infrastructure |
| packages/models/src/index.ts | 510 | Model runtime & registry |
| packages/cli/src/cli.ts | 482 | CLI commands |
| packages/evaluation/src/index.ts | 468 | Evaluation engine |
| packages/cognition/src/index.ts | 454 | Cognitive pipeline |

**Note:** The generated `.d.ts` files (2,571 lines each for schemas) inflate the count.

---

## 🔴 Largest Web Files

| File | Lines | Type |
|------|-------|------|
| web/src/app/releases/page.tsx | 302 | Page component |
| web/src/app/docs/page.tsx | 252 | Page component |
| web/src/app/benchmarks/page.tsx | 242 | Page component |
| web/src/app/research/page.tsx | 232 | Page component |
| web/src/components/home/Hero.tsx | 219 | Component |
| web/src/components/home/EvolutionLoop.tsx | 218 | Component |
| web/src/app/docs/getting-started/page.tsx | 218 | Page component |
| web/src/components/home/IntelligenceEfficiency.tsx | 204 | Component |
| web/src/app/minds/page.tsx | 200 | Page component |
| web/src/components/home/ArchitectureOverview.tsx | 187 | Component |

---

## 📦 Package Count & Distribution

| Category | Packages | Status |
|----------|----------|--------|
| **Foundation** | kernel, schemas, hardware, telemetry, security, policy, storage | 7 |
| **Subsystems** | memory, skills, tools, models, providers, routing | 6 |
| **Intelligence** | cognition, compiler, evaluation, evolution, genome | 5 |
| **Integration** | mind, benchmark, sdk, cli | 4 |
| **Runtimes** | ollama, mlx, llamacpp, local | 4 |
| **Web** | web (Next.js) | 1 |
| **Total** | **29** | |

---

## 🔍 Duplicated Concepts (Preliminary)

| Concept | Locations | Notes |
|---------|-----------|-------|
| **Zod schemas** | schemas/ + every package imports them | Centralized in schemas/ but each package re-validates |
| **Error types** | kernel/ + every package has custom errors | kernel defines base SEAIError but packages create their own |
| **Result pattern** | kernel/ + every package uses it | Consistent usage |
| **Event types** | telemetry/ + schema definitions | telemetry defines events, schemas re-define them |
| **Result type** | kernel/ + schemas both define | kernel has Result<T,E>, schemas has BenchmarkResult |
| **Version schema** | kernel + schemas both define | VersionSchema in schemas, but kernel uses its own |
| **Storage interfaces** | storage/ + memory/ + genome/ | Multiple storage abstractions |
| **Runtime capabilities** | models/ + runtimes/ | Duplicated capability definitions |
| **SEAIError** | kernel/ + schemas/ | Both export SEAIError |

---

## 📋 Documentation Inventory

| File | Lines | Status |
|------|-------|--------|
| AGENTS.md | 250 | Development rules |
| docs/architecture/SYSTEM_ARCHITECTURE.md | 304 | Architecture doc |
| docs/decisions/ADR_INDEX.md | 126 | ADRs |
| docs/roadmap/MASTER_ROADMAP.md | 279 | Roadmap |
| docs/strategy/CODENAME_SYSTEM.md | 86 | Codename philosophy |
| minds/paios/SPEC.md | 360 | PAIOS reference spec |
| docs/architecture/ | 2 files | Architecture |
| docs/decisions/ | 1 file | ADRs |
| docs/roadmap/ | 1 file | Roadmap |
| docs/strategy/ | 1 file | Strategy |
| docs/benchmarks/ | 0 files | Empty |
| docs/concepts/ | 0 files | Empty |
| docs/evolution/ | 0 files | Empty |
| docs/generated/ | 0 files | Empty |
| docs/minds/ | 0 files | Empty |
| docs/privacy/ | 0 files | Empty |
| docs/research/ | 0 files | Empty |
| docs/security/ | 0 files | Empty |

---

## 🧪 Test Status

| Package | Test Files | Status |
|---------|------------|--------|
| kernel | 0 | ❌ No tests |
| schemas | 0 | ❌ No tests |
| hardware | 0 | ❌ No tests |
| telemetry | 0 | ❌ No tests |
| security | 0 | ❌ No tests |
| policy | 0 | ❌ No tests |
| storage | 0 | ❌ No tests |
| models | 0 | ❌ No tests |
| providers | 0 | ❌ No tests |
| routing | 0 | ❌ No tests |
| memory | 0 | ❌ No tests |
| skills | 0 | ❌ No tests |
| tools | 0 | ❌ No tests |
| cognition | 0 | ❌ No tests |
| compiler | 0 | ❌ No tests |
| evaluation | 0 | ❌ No tests |
| evolution | 0 | ❌ No tests |
| genome | 0 | ❌ No tests |
| mind | 0 | ❌ No tests |
| benchmark | 0 | ❌ No tests |
| sdk | 0 | ❌ No tests |
| cli | 0 | ❌ No tests |
| web | 0 | ❌ No tests |
| runtimes/* | 0 | ❌ No tests |

**Total test files: 0** — No test files exist in the entire repository.

---

## 🔧 Scripts Inventory

| Script | Status |
|--------|--------|
| scripts/doctor.js | Exists (not checked) |
| scripts/init.js | Exists (not checked) |
| scripts/benchmark.js | Exists (not checked) |

---

## 🔐 Security Scan Summary

| Check | Result |
|-------|--------|
| Hardcoded secrets | None found |
| API keys in source | None found |
| Password patterns | None found (only detection patterns in security.ts) |
| Shell execution | tools/src uses shell.execute (capability-gated) |
| Arbitrary file access | tools/src has file.read/write (capability-gated) |
| Arbitrary network | tools/src has http.request (capability-gated) |
| Arbitrary code exec | tools/src has code.execute (stub, capability-gated) |
| SQL injection | tools/src has database.query (stub) |
| Path traversal | file.read/write use path resolution (needs audit) |

---

## 📦 Dependency Analysis

| Dependency | Packages Using | Notes |
|------------|---------------|-------|
| zod | 29 | Universal |
| uuid | 29 | Universal |
| sql.js | 1 (storage) | Only storage |
| better-sqlite3 | 0 (removed) | Was in storage, replaced |
| sql.js types | 1 | Only storage |
| commander | 1 (cli) | CLI only |
| chalk | 1 (cli) | CLI only |
| ora | 1 (cli) | CLI only |
| next | 1 (web) | Web only |
| react | 1 (web) | Web only |
| lucide-react | 1 (web) | Web only |
| framer-motion | 1 (web) | Web only |
| recharts | 1 (web) | Web only |
| clsx | 1 (web) | Web only |
| tailwind-merge | 1 (web) | Web only |
| date-fns | 1 (web) | Web only |
| @types/* | varies | Dev only |

---

## ⚠️ Immediate Build Failures

| Package | Error Type | Count |
|---------|------------|-------|
| memory | TS4111 (index signature access) | ~25 errors |
| genome | TS4111 + TS2345 | ~15 errors |
| hardware | TS4111 + TS18048 | ~15 errors |
| schema | TS4111 (in dist) | N/A (dist files) |
| kernel | ✅ builds | 0 |
| schemas | ✅ builds | 0 |
| telemetry | ✅ builds | 0 |
| security | ✅ builds | 0 |
| policy | ✅ builds | 0 |
| storage | ✅ builds | 0 |
| models | ✅ builds | 0 |
| providers | ✅ builds | 0 |
| routing | ✅ builds | 0 |
| skills | ✅ builds | 0 |
| tools | ✅ builds | 0 |
| cognition | ✅ builds | 0 |
| compiler | ✅ builds | 0 |
| evaluation | ✅ builds | 0 |
| evolution | ✅ builds | 0 |
| genome | ❌ typecheck fails | 15 |
| mind | ❌ build fails | 25 |
| benchmark | ✅ builds | 0 |
| sdk | ✅ builds | 0 |
| cli | ✅ builds | 0 |
| web | ✅ builds | 0 |

---

## 🏷️ Git Status

| Property | Value |
|----------|-------|
| Branch | main |
| Commits | 0 (no commits yet) |
| Remote | None configured |
| Untracked files | All source files |
| .gitignore | Missing (node_modules, dist, .next not ignored) |

---

## 🌐 Vercel Status

| Property | Value |
|----------|-------|
| Vercel CLI auth | ❌ Invalid token |
| .vercel folder | ❌ Missing |
| Project linked | ❌ No |
| Deployments | ❌ None |
| Production URL | ❌ None |

---

## 🔍 Key Findings Summary

| Category | Finding |
|----------|---------|
| **Build** | ❌ FAILING (memory, genome, hardware) |
| **TypeCheck** | ❌ FAILING (genome, hardware, memory) |
| **Lint** | ❌ FAILING (web needs ESLint config) |
| **Tests** | ❌ ZERO tests exist |
| **Git** | ❌ No commits, no remote |
| **Vercel** | ❌ Not linked, not deployed |
| **Secrets** | ✅ None found |
| **Tests** | ❌ 0 test files total |
| **Duplication** | ⚠️ Moderate (schemas, errors, types) |
| **Stub implementations** | ⚠️ Many (cognition, evaluation, tools, runtimes) |
| **TypeScript strictness** | ❌ TS4111 errors in multiple packages |

---

*Generated by forensic audit — Part 1 of Complexity Audit*