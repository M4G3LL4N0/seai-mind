# SE-AI Mind (Darwin 0.1) — Architectural Compression Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compress 27 workspace packages into 4 kernel packages (core, runtime, state, mind) + 3 separate packages (sdk, cli, web), preserving all real functionality.

**Architecture:** Merge packages by responsibility layer. Core provides primitives. Runtime provides model execution. State provides persistence. Mind integrates everything. SDK/CLI/Web remain separate.

**Tech Stack:** TypeScript, pnpm monorepo, Zod, Node.js

## Global Constraints

- All code must pass TypeScript strict mode
- All 27 current packages build successfully — the migration must maintain this
- CLI commands must continue to work
- Web must continue to build
- No circular dependencies
- No `any` types
- No fabricated functionality
- All stubs must be clearly labeled STUB or EXPERIMENTAL

---

## Task 1: Create New Package Structure

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/runtime/package.json`
- Create: `packages/runtime/tsconfig.json`
- Create: `packages/state/package.json`
- Create: `packages/state/tsconfig.json`
- Create: `packages/mind/package.json`
- Create: `packages/mind/tsconfig.json`

- [ ] **Step 1: Create core package.json**

```json
{
  "name": "@seai/core",
  "version": "0.1.0-alpha",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create core/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create runtime, state, mind package.json and tsconfig.json files**

Same pattern as core, with appropriate dependencies:
- runtime: depends on @seai/core
- state: depends on @seai/core
- mind: depends on @seai/core, @seai/runtime, @seai/state

- [ ] **Step 4: Create src/ directories**

```bash
mkdir -p packages/core/src
mkdir -p packages/runtime/src/adapters
mkdir -p packages/state/src
mkdir -p packages/mind/src
```

- [ ] **Step 5: Verify new packages exist**

Run: `ls packages/core packages/runtime packages/state packages/mind`
Expected: 4 directories exist

---

## Task 2: Move Core Layer

**Files:**
- Create: `packages/core/src/kernel.ts` (from packages/kernel/src/index.ts)
- Create: `packages/core/src/schemas.ts` (from packages/schemas/src/index.ts)
- Create: `packages/core/src/telemetry.ts` (from packages/telemetry/src/index.ts)
- Create: `packages/core/src/security.ts` (from packages/security/src/index.ts)
- Create: `packages/core/src/policy.ts` (from packages/policy/src/index.ts)
- Create: `packages/core/src/storage.ts` (from packages/storage/src/index.ts)
- Create: `packages/core/src/hardware.ts` (from packages/hardware/src/index.ts)
- Create: `packages/core/src/index.ts` (barrel export)

- [ ] **Step 1: Copy kernel source**

```bash
cp packages/kernel/src/index.ts packages/core/src/kernel.ts
```

- [ ] **Step 2: Copy schemas source**

```bash
cp packages/schemas/src/index.ts packages/core/src/schemas.ts
```

- [ ] **Step 3: Copy telemetry source**

```bash
cp packages/telemetry/src/index.ts packages/core/src/telemetry.ts
```

- [ ] **Step 4: Copy security source**

```bash
cp packages/security/src/index.ts packages/core/src/security.ts
```

- [ ] **Step 5: Copy policy source**

```bash
cp packages/policy/src/index.ts packages/core/src/policy.ts
```

- [ ] **Step 6: Copy storage source**

```bash
cp packages/storage/src/index.ts packages/core/src/storage.ts
```

- [ ] **Step 7: Copy hardware source**

```bash
cp packages/hardware/src/index.ts packages/core/src/hardware.ts
```

- [ ] **Step 8: Create barrel export**

```typescript
// packages/core/src/index.ts
export * from "./kernel.js";
export * from "./schemas.js";
export * from "./telemetry.js";
export * from "./security.js";
export * from "./policy.js";
export * from "./storage.js";
export * from "./hardware.js";
```

- [ ] **Step 9: Update internal imports in core modules**

Each module that imports from `@seai/kernel`, `@seai/schemas`, etc. must be updated to import from local files. For example, in `security.ts`:
- Change `import { ... } from "@seai/kernel"` → `import { ... } from "./kernel.js"`
- Change `import { ... } from "@seai/schemas"` → `import { ... } from "./schemas.js"`

Run this for all 6 modules that have internal imports.

- [ ] **Step 10: Build core**

Run: `cd packages/core && pnpm build`
Expected: Build succeeds with no errors

---

## Task 3: Move Runtime Layer

**Files:**
- Create: `packages/runtime/src/models.ts` (from packages/models/src/index.ts)
- Create: `packages/runtime/src/providers.ts` (from packages/providers/src/index.ts)
- Create: `packages/runtime/src/routing.ts` (from packages/routing/src/index.ts)
- Create: `packages/runtime/src/adapters/ollama.ts` (from runtimes/ollama/src/index.ts)
- Create: `packages/runtime/src/adapters/mlx.ts` (from runtimes/mlx/src/index.ts)
- Create: `packages/runtime/src/adapters/llamacpp.ts` (from runtimes/llamacpp/src/index.ts)
- Create: `packages/runtime/src/adapters/local.ts` (from runtimes/local/src/index.ts)
- Create: `packages/runtime/src/index.ts` (barrel export)

- [ ] **Step 1: Copy models source**

```bash
cp packages/models/src/index.ts packages/runtime/src/models.ts
```

- [ ] **Step 2: Copy providers source**

```bash
cp packages/providers/src/index.ts packages/runtime/src/providers.ts
```

- [ ] **Step 3: Copy routing source**

```bash
cp packages/routing/src/index.ts packages/runtime/src/routing.ts
```

- [ ] **Step 4: Copy runtime adapters**

```bash
cp runtimes/ollama/src/index.ts packages/runtime/src/adapters/ollama.ts
cp runtimes/mlx/src/index.ts packages/runtime/src/adapters/mlx.ts
cp runtimes/llamacpp/src/index.ts packages/runtime/src/adapters/llamacpp.ts
cp runtimes/local/src/index.ts packages/runtime/src/adapters/local.ts
```

- [ ] **Step 5: Create barrel export**

```typescript
// packages/runtime/src/index.ts
export * from "./models.js";
export * from "./providers.js";
export * from "./routing.js";
export * as Ollama from "./adapters/ollama.js";
export * as MLX from "./adapters/mlx.js";
export * as LlamaCpp from "./adapters/llamacpp.js";
export * as Local from "./adapters/local.js";
```

- [ ] **Step 6: Update internal imports in runtime modules**

Each module that imports from `@seai/kernel`, `@seai/schemas`, `@seai/models`, etc. must be updated to import from `@seai/core` or local files.

- [ ] **Step 7: Build runtime**

Run: `cd packages/runtime && pnpm build`
Expected: Build succeeds with no errors

---

## Task 4: Move State Layer

**Files:**
- Create: `packages/state/src/memory.ts` (from packages/memory/src/index.ts)
- Create: `packages/state/src/skills.ts` (from packages/skills/src/index.ts)
- Create: `packages/state/src/tools.ts` (from packages/tools/src/index.ts)
- Create: `packages/state/src/genome.ts` (from packages/genome/src/index.ts)
- Create: `packages/state/src/index.ts` (barrel export)

- [ ] **Step 1: Copy state sources**

```bash
cp packages/memory/src/index.ts packages/state/src/memory.ts
cp packages/skills/src/index.ts packages/state/src/skills.ts
cp packages/tools/src/index.ts packages/state/src/tools.ts
cp packages/genome/src/index.ts packages/state/src/genome.ts
```

- [ ] **Step 2: Create barrel export**

```typescript
// packages/state/src/index.ts
export * from "./memory.js";
export * from "./skills.js";
export * from "./tools.js";
export * from "./genome.js";
```

- [ ] **Step 3: Update internal imports in state modules**

Each module that imports from `@seai/kernel`, `@seai/schemas`, `@seai/storage`, etc. must be updated to import from `@seai/core`.

- [ ] **Step 4: Build state**

Run: `cd packages/state && pnpm build`
Expected: Build succeeds with no errors

---

## Task 5: Move Mind Layer

**Files:**
- Create: `packages/mind/src/mind.ts` (from packages/mind/src/index.ts)
- Create: `packages/mind/src/cognition.ts` (from packages/cognition/src/index.ts)
- Create: `packages/mind/src/compiler.ts` (from packages/compiler/src/index.ts)
- Create: `packages/mind/src/evaluation.ts` (from packages/evaluation/src/index.ts)
- Create: `packages/mind/src/evolution.ts` (from packages/evolution/src/index.ts)
- Create: `packages/mind/src/benchmark.ts` (from packages/benchmark/src/index.ts)
- Create: `packages/mind/src/index.ts` (barrel export)

- [ ] **Step 1: Copy mind sources**

```bash
cp packages/mind/src/index.ts packages/mind/src/mind.ts
cp packages/cognition/src/index.ts packages/mind/src/cognition.ts
cp packages/compiler/src/index.ts packages/mind/src/compiler.ts
cp packages/evaluation/src/index.ts packages/mind/src/evaluation.ts
cp packages/evolution/src/index.ts packages/mind/src/evolution.ts
cp packages/benchmark/src/index.ts packages/mind/src/benchmark.ts
```

- [ ] **Step 2: Create barrel export**

```typescript
// packages/mind/src/index.ts
export * from "./mind.js";
export * from "./cognition.js";
export * from "./compiler.js";
export * from "./evaluation.js";
export * from "./evolution.js";
export * from "./benchmark.js";
```

- [ ] **Step 3: Update internal imports in mind modules**

Each module that imports from `@seai/*` must be updated to import from `@seai/core`, `@seai/runtime`, or `@seai/state`.

- [ ] **Step 4: Build mind**

Run: `cd packages/mind && pnpm build`
Expected: Build succeeds with no errors

---

## Task 6: Update SDK

**Files:**
- Modify: `packages/sdk/src/index.ts`

- [ ] **Step 1: Update SDK imports**

Change all `@seai/*` imports to use the new packages:
- `@seai/kernel` → `@seai/core`
- `@seai/schemas` → `@seai/core`
- `@seai/telemetry` → `@seai/core`
- `@seai/security` → `@seai/core`
- `@seai/policy` → `@seai/core`
- `@seai/storage` → `@seai/core`
- `@seai/hardware` → `@seai/core`
- `@seai/models` → `@seai/runtime`
- `@seai/providers` → `@seai/runtime`
- `@seai/routing` → `@seai/runtime`
- `@seai/memory` → `@seai/state`
- `@seai/skills` → `@seai/state`
- `@seai/tools` → `@seai/state`
- `@seai/genome` → `@seai/state`
- `@seai/cognition` → `@seai/mind`
- `@seai/compiler` → `@seai/mind`
- `@seai/evaluation` → `@seai/mind`
- `@seai/evolution` → `@seai/mind`
- `@seai/benchmark` → `@seai/mind`
- `@seai/mind` → `@seai/mind`

- [ ] **Step 2: Update SDK package.json dependencies**

Change all `@seai/*` dependencies to the new packages.

- [ ] **Step 3: Build SDK**

Run: `cd packages/sdk && pnpm build`
Expected: Build succeeds with no errors

---

## Task 7: Update CLI

**Files:**
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/index.ts`
- Modify: `packages/cli/package.json`

- [ ] **Step 1: Update CLI imports**

Change imports to use `@seai/sdk` (which re-exports everything).

- [ ] **Step 2: Update CLI package.json dependencies**

Change `@seai/*` dependencies to `@seai/sdk`, `@seai/core`.

- [ ] **Step 3: Build CLI**

Run: `cd packages/cli && pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Test CLI**

Run: `node packages/cli/dist/cli.js --help`
Expected: Shows help with all commands

Run: `node packages/cli/dist/cli.js doctor`
Expected: Shows hardware profile

Run: `node packages/cli/dist/cli.js init --name TestMind`
Expected: Mind initialized successfully

---

## Task 8: Update Workspace

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Update workspace packages**

Change from:
```yaml
packages:
  - packages/*
  - runtimes/*
  - experiments/*
  - benchmarks/*
  - minds/*
  - web
```

To:
```yaml
packages:
  - packages/*
  - minds/*
  - web
```

- [ ] **Step 2: Remove old packages**

```bash
rm -rf packages/kernel
rm -rf packages/schemas
rm -rf packages/hardware
rm -rf packages/telemetry
rm -rf packages/security
rm -rf packages/policy
rm -rf packages/storage
rm -rf packages/models
rm -rf packages/providers
rm -rf packages/routing
rm -rf packages/memory
rm -rf packages/skills
rm -rf packages/tools
rm -rf packages/genome
rm -rf packages/cognition
rm -rf packages/compiler
rm -rf packages/evaluation
rm -rf packages/evolution
rm -rf packages/benchmark
rm -rf runtimes/ollama
rm -rf runtimes/mlx
rm -rf runtimes/llamacpp
rm -rf runtimes/local
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`
Expected: Installs successfully

- [ ] **Step 4: Build all**

Run: `pnpm build`
Expected: All packages build successfully

---

## Task 9: Add Smoke Tests

**Files:**
- Create: `packages/core/src/__tests__/smoke.test.ts`
- Create: `packages/runtime/src/__tests__/smoke.test.ts`
- Create: `packages/state/src/__tests__/smoke.test.ts`
- Create: `packages/mind/src/__tests__/smoke.test.ts`

- [ ] **Step 1: Create core smoke test**

```typescript
import { describe, it, expect } from "vitest";
import {
  generateId,
  Result,
  SEAIBaseError,
  ConfigurationError,
} from "../index.js";

describe("core smoke", () => {
  it("generates valid UUID", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("Result.ok works", () => {
    const result = Result.ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });

  it("Result.err works", () => {
    const result = Result.err(new Error("fail"));
    expect(result.ok).toBe(false);
  });

  it("SEAI error hierarchy works", () => {
    const err = new ConfigurationError("test");
    expect(err.code).toBe("CONFIGURATION_ERROR");
    expect(err.statusCode).toBe(500);
    expect(err.retryable).toBe(false);
  });
});
```

- [ ] **Step 2: Create state smoke test**

```typescript
import { describe, it, expect } from "vitest";
import { createMemoryEngine, createSkillEngine, createToolEngine, createGenomeEngine } from "../index.js";

describe("state smoke", () => {
  it("memory engine creates", async () => {
    const engine = createMemoryEngine();
    expect(engine).toBeDefined();
  });

  it("skill engine creates", async () => {
    const engine = createSkillEngine();
    expect(engine).toBeDefined();
  });

  it("tool engine creates", async () => {
    const engine = createToolEngine();
    expect(engine).toBeDefined();
  });

  it("genome engine creates", async () => {
    const engine = createGenomeEngine();
    expect(engine).toBeDefined();
  });
});
```

- [ ] **Step 3: Create mind smoke test**

```typescript
import { describe, it, expect } from "vitest";
import { createMindRuntime, detectAndCreateMind } from "../index.js";

describe("mind smoke", () => {
  it("mind runtime creates", () => {
    const runtime = createMindRuntime({
      identity: {
        id: "test",
        name: "TestMind",
        version: { major: 0, minor: 1, patch: 0 },
        generation: "Darwin",
        codename: "Darwin 0.1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    expect(runtime).toBeDefined();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: All tests pass

---

## Task 10: Verify Everything

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: All packages build successfully

- [ ] **Step 2: CLI verification**

Run: `node packages/cli/dist/cli.js --help`
Expected: Shows help

Run: `node packages/cli/dist/cli.js doctor`
Expected: Shows hardware

Run: `node packages/cli/dist/cli.js init --name DarwinTest`
Expected: Mind created

- [ ] **Step 3: Web build**

Run: `cd web && pnpm build`
Expected: Builds successfully

- [ ] **Step 4: Record metrics**

Count packages, source files, LOC, dependencies.

- [ ] **Step 5: Create COMPRESSION_AFTER.md**

Document the after state.

- [ ] **Step 6: Create COMPRESSION_RESULTS.md**

Document the before/after comparison.

---

## Task 11: Git and Deploy

- [ ] **Step 1: Check git status**

Run: `git status`
Expected: Shows changed files

- [ ] **Step 2: Create initial commit**

Run: `git add . && git commit -m "feat: architectural compression - 27 → 7 packages"`
Expected: Commit created

- [ ] **Step 3: Check GitHub**

Run: `gh auth status`
Expected: Shows authentication status

If not authenticated: BLOCKED

- [ ] **Step 4: Check Vercel**

Run: `vercel whoami`
Expected: Shows username

If not authenticated: BLOCKED

---

*Plan created 2025-09-08. Ready for execution.*