# SE-AI Architecture Decisions

## ADR-001: Monorepo with pnpm

**Date**: 2025-01-08
**Status**: Accepted

### Context
Need to manage 27+ packages with shared dependencies and cross-package imports.

### Decision
Use pnpm workspace with single lockfile. Each package has own package.json, tsconfig.json, and builds independently.

### Consequences
- Fast installs, disk efficient
- Shared dependencies hoisted
- Independent versioning per package
- Requires build order management

---

## ADR-002: TypeScript with Strict Mode

**Date**: 2025-01-08
**Status**: Accepted (with temporary relaxations)

### Context
Need type safety across package boundaries.

### Decision
Use strict mode with:
- `exactOptionalPropertyTypes: false` (temporarily)
- `noPropertyAccessFromIndexSignature: false` (temporarily)
- Zod schemas for all public APIs

### Consequences
- Runtime validation via Zod
- Build-time type checking
- Some verbosity in type definitions

---

## ADR-003: Zod for Schema Validation

**Date**: 2025-01-08
**Status**: Accepted

### Context
Need runtime validation that matches TypeScript types.

### Decision
All domain objects defined as Zod schemas in `@seai/schemas`. Types inferred via `z.infer`.

### Consequences
- Single source of truth
- Validation at boundaries
- Automatic TypeScript types

---

## ADR-004: Result Pattern for Error Handling

**Date**: 2025-01-08
**Status**: Accepted

### Context
Need consistent error handling without exceptions for expected failures.

### Decision
Use `Result<T, E>` type for all fallible operations:
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
```

### Consequences
- Explicit error handling
- No unhandled promise rejections
- Composable with `Result.ok()` / `Result.err()`

---

## ADR-005: Capability-Based Security

**Date**: 2025-01-08
**Status**: Accepted

### Context
Tools, skills, and models need fine-grained permissions.

### Decision
Every capability declares:
- Required permissions
- Privacy level
- Security level
- Cost/latency estimates

Policy engine evaluates before execution.

### Consequences
- Least privilege by default
- Audit trail for all access
- Privacy gates on data flow

---

## ADR-006: Model != Mind

**Date**: 2025-01-08
**Status**: Accepted

### Context
Industry conflates models with AI systems.

### Decision
Explicit separation:
- **Model**: Neural substrate (weights, architecture)
- **Mind**: Persistent executable system (model + memory + skills + tools + evolution + genome)

### Consequences
- Model-agnostic architecture
- Multiple models per Mind
- Model swapping without Mind restart

---

## ADR-007: Local-First with Optional Cloud

**Date**: 2025-01-08
**Status**: Accepted

### Context
Privacy and latency requirements.

### Decision
Default to local execution. Cloud providers require:
- Explicit user consent
- Privacy level check (PUBLIC/INTERNAL only)
- Provider verification (approved/canary/active only)

### Consequences
- Works offline
- Data sovereignty
- Cloud as accelerator, not requirement

---

## ADR-008: Evolution with Human-in-the-Loop

**Date**: 2025-01-08
**Status**: Accepted

### Context
Self-modifying code is dangerous.

### Decision
Evolution loop requires:
1. Sandbox isolation
2. Regression testing
3. Security review
4. Privacy review
5. Cost review
6. Human approval for promotion
7. Rollback capability

### Consequences
- No autonomous self-modification
- Slow but safe evolution
- Full audit trail

---

## ADR-009: Genome as Git for Intelligence

**Date**: 2025-01-08
**Status**: Accepted

### Context
Need versioning, branching, rollback for Mind configurations.

### Decision
Genome records:
- Base models + adapters
- Prompts, memory config, skills, tools
- Policies, routing, evaluators
- Benchmark history, evolution history
- Lineage, branches, parent references

Operations: version, diff, branch, rollback, reproduce

### Consequences
- Reproducible Minds
- Safe experimentation
- Collaborative development

---

## ADR-010: Benchmark Labeling

**Date**: 2025-01-08
**Status**: Accepted

### Context
Prevent fabrication and confusion about result validity.

### Decision
Every benchmark result labeled:
- `PLANNED` - Designed, not run
- `SIMULATED` - Modeled, not measured
- `EXPERIMENTAL` - Run in test environment
- `MEASURED` - Run on target hardware
- `VERIFIED` - Independently reproduced
- `PRODUCTION` - Running in production

### Consequences
- Honest reporting
- Clear evidence chain
- No marketing numbers mistaken for measurements

---

## ADR-011: Hardware-Aware Model Selection

**Date**: 2025-01-08
**Status**: Accepted

### Context
Model must fit actual hardware, not theoretical specs.

### Decision
Hardware profile includes:
- CPU cores, RAM, unified memory
- GPU/VRAM, accelerator
- Current load, thermal, battery
- Real-time capacity check

Routing answers: "What can run efficiently NOW?"

### Consequences
- No OOM crashes
- Optimal model per task
- Battery/thermal awareness

---

## ADR-012: Event Sourcing for Telemetry

**Date**: 2025-01-08
**Status**: Accepted

### Context
Need audit trail, debugging, replay capability.

### Decision
Versioned events for all state changes:
- Mind lifecycle
- Task execution
- Memory operations
- Skill/tool use
- Model selection
- Evolution actions
- Security/policy decisions

### Consequences
- Complete audit trail
- Time-travel debugging
- Replay for testing