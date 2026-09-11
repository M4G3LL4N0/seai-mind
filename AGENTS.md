# SE-AI Mind (Darwin 0.1) - AGENTS.md

## Architecture Overview

SE-AI Mind is a monorepo built with pnpm containing the following key packages:

### Core Packages (`packages/`)
- **kernel** - Core types, errors, utilities, Result pattern
- **schemas** - Zod schemas for all domain objects (Mind, Memory, Skill, Tool, Model, Genome, etc.)
- **hardware** - Hardware detection and profiling (CPU, GPU, memory, storage, thermal)
- **telemetry** - Event system with structured logging and persistence
- **security** - Capability-based security, threat detection, privacy gates
- **policy** - Policy engine for routing, tool execution, memory access, evolution
- **storage** - SQLite + file storage abstraction with repositories
- **models** - Model runtime abstraction, registry, runtime manager
- **providers** - Provider registry with lifecycle management
- **routing** - Policy-driven model routing engine
- **memory** - Multi-type memory engine (working, episodic, semantic, procedural, etc.)
- **skills** - Skill engine with composition and validation
- **tools** - Capability-based tool system with sandboxed execution
- **cognition** - Cognitive engine implementing the task processing pipeline
- **compiler** - Cognitive compiler for goal-to-task-graph compilation
- **evaluation** - Evaluation engine with built-in suites
- **evolution** - Evolution engine with sandbox, regression testing, promotion
- **genome** - Intelligence genome with versioning, branching, diff, rollback
- **mind** - Main Mind runtime integrating all subsystems
- **benchmark** - MindBench infrastructure for reproducible experiments
- **sdk** - High-level client API
- **cli** - Command-line interface

### Runtime Adapters (`runtimes/`)
- **ollama** - Ollama HTTP API adapter
- **mlx** - MLX-LM adapter for Apple Silicon
- **llamacpp** - llama.cpp server adapter
- **local** - Stub runtime for testing

## Development Rules

### Code Quality
- All code must pass TypeScript strict mode
- ESLint must pass with zero errors
- Prettier formatting required
- No `any` types - use proper generics
- All public APIs must have Zod schemas
- All errors must use SEAI error classes

### Testing
- Unit tests for all pure functions
- Integration tests for subsystem interactions
- Contract tests for runtime adapters
- Benchmark tests for performance regression
- Security tests for threat detection
- Policy tests for authorization logic

### Documentation
- Update docs/architecture/ for structural changes
- Record decisions in docs/decisions/
- Update roadmap for milestone changes
- Changelog for every release

### Git Workflow
- Feature branches from main
- Conventional commits (feat, fix, docs, refactor, test, chore)
- PR required for all changes
- CI must pass before merge
- No direct commits to main

### Security
- Never commit secrets or keys
- All external inputs validated with Zod
- Capability-based permissions enforced
- Privacy gates on all data flows
- Sandbox evolution candidates
- Audit logging for all sensitive operations

### Privacy
- Default deny for cross-privacy-level access
- Data classification on all memory entries
- Redaction for lower-privacy contexts
- Audit trail for privacy decisions

### Benchmarking
- All results labeled: PLANNED|SIMULATED|EXPERIMENTAL|MEASURED|VERIFIED|PRODUCTION
- Hardware profile recorded with every benchmark
- Full configuration snapshots
- No fabricated numbers

## Coding Standards

### TypeScript
```typescript
// Use explicit types for public APIs
export interface MyInterface {
  readonly id: string;
  name: string;
  optionalField?: number;
}

// Use Zod for validation
export const MySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  optionalField: z.number().optional(),
});

// Use Result pattern for fallible operations
export async function myFunction(input: Input): Promise<Result<Output, SEAIError>> {
  try {
    const result = await doWork(input);
    return Result.ok(result);
  } catch (error) {
    return Result.err(new SEAIError("CODE", error.message));
  }
}
```

### Error Handling
- Use specific error classes from `@seai/kernel`
- Include context in error details
- Mark retryable errors appropriately
- Never swallow errors silently

### Async Patterns
- Use `Promise.all` for parallel operations
- Implement timeouts for external calls
- Use exponential backoff for retries
- Properly clean up resources (timers, connections)

### Immutability
- Prefer `readonly` properties
- Return new objects instead of mutating
- Use `Object.freeze` for constants

## Project Structure

```
seai-mind/
├── packages/
│   ├── kernel/
│   ├── schemas/
│   ├── hardware/
│   ├── telemetry/
│   ├── security/
│   ├── policy/
│   ├── storage/
│   ├── models/
│   ├── providers/
│   ├── routing/
│   ├── memory/
│   ├── skills/
│   ├── tools/
│   ├── cognition/
│   ├── compiler/
│   ├── evaluation/
│   ├── evolution/
│   ├── genome/
│   ├── mind/
│   ├── benchmark/
│   ├── sdk/
│   └── cli/
├── runtimes/
│   ├── ollama/
│   ├── mlx/
│   ├── llamacpp/
│   └── local/
├── experiments/
├── benchmarks/
├── research/
├── minds/
├── docs/
│   ├── architecture/
│   ├── concepts/
│   ├── research/
│   ├── benchmarks/
│   ├── evolution/
│   ├── minds/
│   ├── security/
│   ├── privacy/
│   ├── decisions/
│   ├── roadmap/
│   └── generated/
├── scripts/
├── infrastructure/
├── .github/
└── .opencode/
```

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck

# Run CLI
pnpm --filter @seai/cli start

# Doctor check
pnpm doctor
```

## SE-AI Generation Naming

| Generation | Codename | Version | Focus |
|------------|----------|---------|-------|
| 1 | Darwin | 0.1.x | Evolution infrastructure |
| 2 | Woz | 0.2.x | TBD |
| 3 | Turing | 0.3.x | TBD |

Codenames must be: globally recognizable, memorable, pronounceable, culturally sticky, thematically meaningful.

## No-Fabrication Policy

- Never fabricate benchmark results
- Never claim features that don't exist
- Never invent fake integrations
- All results must be labeled with evidence level
- Every claim must be traceable to code or data

## Failure Recovery

- All subsystems implement graceful degradation
- Circuit breakers for external dependencies
- Automatic rollback for failed evolution
- Checkpoint/restore for long-running tasks
- Dead letter queues for failed events

## Autonomous Development Procedure

1. Read existing documentation and code
2. Write failing tests first (TDD)
3. Implement minimal solution
4. Verify with tests and benchmarks
5. Document changes
6. Update architecture if needed
7. Record decisions
8. Update roadmap/changelog
9. Run quality gates
10. Submit PR