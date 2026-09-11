# SE-AI Mind (Darwin 0.1)

Open-source self-evolving AI kernel. Small kernel, growing intelligence:
Minds + Models + Memory + Skills + Tools + Evolution + Evaluation.

## Quickstart

```bash
pnpm install
pnpm build
pnpm test

node packages/cli/dist/cli.js doctor
node packages/cli/dist/cli.js init --name DarwinTest
node packages/cli/dist/cli.js run "What is 2 + 2?"
```

With a local Ollama server running, model tasks execute for real; without
one, the system fails honestly instead of faking inference.

## First evolution loop

```bash
node packages/cli/dist/cli.js evolve propose --mind default
node packages/cli/dist/cli.js evolve history --mind default
node packages/cli/dist/cli.js evolve promote <experimentId> --mind default
node packages/cli/dist/cli.js run "What is 3 + 3? Answer in JSON." --mind default
node packages/cli/dist/cli.js evolve rollback --mind default
```

## Architecture (7 build units)

`core` ← `runtime`, `state` ← `mind` ← `sdk` ← `cli`; `web/` standalone.
See `docs/architecture/` (MINIMAL_KERNEL, MIND_MODEL, MEMORY_MODEL,
RUNTIME_BOUNDARY, EXECUTION_MODEL, EVOLUTION_MODEL, EVOLUTION_EXPERIMENTS,
EVOLUTION_GATES, INTELLIGENCE_GENOME, GENOME_MODEL, COGNITIVE_COMPILER)
and `docs/audit/` (ground truth, compression results, GitHub/Vercel status).

## Honest status

- REAL: Mind lifecycle, Mind-isolated memory, deterministic + Ollama model
  execution, routing over healthy runtimes, real evolution experiments with
  measured gates, explicit promotion, real rollback, durable history.
- PARTIAL: tools/skills (some executors stubbed), evolution reviews beyond
  the gate checks, compiler optimization.
- STUB (labeled in code/docs): MLX adapter, local test fixture, LLM-judge,
  OS-level sandboxing, weight evolution.

No fake capability is presented as real. See `docs/audit/COMPRESSION_RESULTS.md`.
