# SE-AI Mind — Runtime Boundary

**Date:** 2026-09-11 (Darwin 0.1, post-compression)
**Status:** IMPLEMENTED AND VERIFIED

---

## Design Principle

The kernel depends on a provider-neutral runtime contract — never on a
provider. Verified by grep: no file in `core/`, `state/`, `mind/`, `sdk/`,
or `cli/` imports any adapter (`OllamaRuntime`, `createOllamaRuntime`,
`LlamaCppRuntime`, `MLXRuntime`, `LocalRuntime`). Adapters are referenced
only from the `runtime` barrel (namespaced re-exports) and runtime's own tests.

Ollama is the FIRST reference adapter because it is easy for local
development. It is an adapter, not the kernel: Darwin installs and builds
with zero runtimes registered, and `seai run` fails honestly without one.

---

## The Contract (actual code, `runtime/src/models.ts`)

```typescript
interface InferenceRuntime {
  name: string;
  version: string;
  discoverModels(): Promise<Model[]>;
  loadModel(model: Model): Promise<ModelHandle>;
  unloadModel(handle: ModelHandle): Promise<void>;
  generate(handle: ModelHandle, request: GenerationRequest): Promise<GenerationResponse>;
  health(): Promise<RuntimeHealth>;
  capabilities: RuntimeCapabilities;
}
```

`GenerationRequest` carries model input plus generation parameters, timeout
budget (via task), privacy (via routing context), and cancellation is
future work. `GenerationResponse` carries output text, status
(`finishReason`), latency, usage when the provider reports it, model id,
and metadata. `health()` is the availability signal — every selection
decision is grounded in a live probe, never in configuration alone.

`RuntimeManager` (the only thing the Mind touches) adds the minimal
Darwin 0.1 selection surface:

- `probeAvailability(): Promise<RuntimeCandidate[]>` — fail-safe per-runtime
  health; never throws.
- `selectHealthyRuntime(preferred?: string[]): Promise<InferenceRuntime | null>`
  — first healthy runtime, honoring preference order; `null` means "nothing
  is reachable" and callers must fail honestly.

---

## Runtime Adapters

| Adapter | Status | Protocol | Real calls? |
|---------|--------|----------|-------------|
| Ollama | REAL (reference) | HTTP to `localhost:11434` (or `OLLAMA_BASE_URL`) | Yes — verified live with `qwen2.5-coder:3b` (27 real tokens) |
| llama.cpp | MOSTLY REAL | Spawns `llama-server` subprocess + HTTP | Yes, when a model path is configured; naive port allocation; no streaming |
| MLX | STUB | None | No — `mlxAvailable` is never true; mock strings |
| Local | INTENTIONAL STUB (test fixture) | None | No — mock strings by design; NEVER auto-registered for inference |

## Discovery (`runtime/src/discover.ts`)

`discoverLocalRuntimes()` probes candidates with a timeout budget (default
2s) and returns only healthy `InferenceRuntime` instances. Today it probes
Ollama. It deliberately excludes the local fixture (a mock must never stand
in for real inference) and cannot probe llama.cpp (needs an explicit model
path) or MLX (stub). Remote OpenAI-compatible endpoints extend this one
function — the contract does not change.

Composition root: `MindRuntime.registerRuntime()` (takes the interface) +
`SEAIClient.enableLocalRuntimes()` (explicit, best-effort, reports what was
found). The Mind never imports an adapter.

---

## Selection Flow (actual)

```
Task ─▶ Routing Engine ─▶ decision { model, runtime, provider, confidence }
  │        ├── privacy-gate (fail-closed: confidential/restricted need approved providers)
  │        ├── capability / quality / latency / cost / hardware filters
  │        ├── provider-health (preference only: fail-open on empty registry —
  │        │   fixed 2026-09-11; it previously vetoed ALL models when no
  │        │   providers were registered, blocking real inference)
  │        └── runtime constrained to probe-healthy list (fixed 2026-09-11;
  │            previously hardware preference could select the dead MLX stub)
  ▼
RuntimeManager.loadModel(model, runtime) ─▶ generate(handle, request)
  ▼
GenerationResponse { text, finishReason, usage, latencyMs, model }
```

Local-first policy: prefer a compatible local runtime when privacy permits,
capability suffices, and hardware allows; configured remote execution
otherwise. No provider is hardcoded.

---

*Runtime boundary implemented and verified 2026-09-11: 7 runtime tests pass,
live Ollama inference demonstrated end to end.*
