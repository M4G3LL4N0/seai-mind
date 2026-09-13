# SE-AI Mind (Darwin 0.1) - AGENTS.md

## North Star

Read `docs/NORTHSTAR.md` first. It defines what SE-AI is (an open platform for
persistent, measurable, governed, self-evolving AI Minds), the core loop
(OBSERVE → … → ROLLBACK), the core thesis (intelligence should be optimized,
not merely scaled), PAIOS as the first reference Mind, and the ten rules
(truth over theater, evidence over claims, real capability over mock
capability, governed evolution, privacy/security by default, provider-neutral,
local-first, measurable improvement, reversible changes, no fake autonomy).
Every subsystem, experiment, doc, and public-facing page must be judged
against it. When the site and the code disagree, the code wins and the site
is wrong.

## Architecture Overview

SE-AI Mind is a pnpm monorepo (7 build units) with a 4-layer kernel.
Full decisions: `docs/architecture/PACKAGE_DECISIONS.md`.
Details: `docs/architecture/MINIMAL_KERNEL.md`, `MIND_MODEL.md`,
`RUNTIME_BOUNDARY.md`, `EXECUTION_MODEL.md`, `MEMORY_MODEL.md`,
`EVOLUTION_MODEL.md`, `GENOME_MODEL.md`, `COGNITIVE_COMPILER.md`.

### Kernel (`packages/`, dependency order: core ← runtime/state ← mind)
- **core** - Foundation primitives: Result/errors/IDs, Zod schemas, event
  telemetry, capability security, policy engine, storage abstraction, hardware
- **runtime** - Provider-neutral execution: model/provider registries, routing
  engine, availability probing, local discovery; adapters live in
  `src/adapters/` (ollama REAL reference, llamacpp mostly real, mlx STUB,
  local INTENTIONAL test fixture — never auto-registered)
- **state** - Persistent mind state: memory (Mind-scoped by required `mindId`),
  skills, tools, genome
- **mind** - Central orchestrator: Mind runtime, cognition pipeline
  (deterministic → skill → tool → model, honest failure otherwise),
  goal compiler, evaluation, evolution, benchmark

### Interfaces (not part of the kernel)
- **sdk** - High-level client API + composition-root bootstrap
  (`enableLocalRuntimes`)
- **cli** - Command-line interface (`seai --help/init/run/doctor/status/…`)
- **web** - Standalone Next.js brochure/docs site; zero `@seai/*` runtime deps

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
│   ├── core/        # kernel primitives (kernel/schemas/telemetry/security/policy/storage/hardware)
│   ├── runtime/     # execution contract + routing + src/adapters/
│   ├── state/       # memory/skills/tools/genome
│   ├── mind/        # orchestrator (mind/cognition/compiler/evaluation/evolution/benchmark)
│   ├── sdk/         # client API
│   └── cli/         # seai CLI
├── minds/           # reference Minds (paios/); not hardwired into the kernel
├── web/             # standalone Next.js site (Vercel Root Directory)
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