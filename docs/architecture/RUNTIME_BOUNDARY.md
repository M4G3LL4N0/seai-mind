# SE-AI Mind — Runtime Boundary

**Date:** 2025-09-08

---

## Design Principle

The kernel should not care whether inference happens through:
- Ollama
- MLX
- llama.cpp
- OpenAI-compatible APIs
- Other providers

Runtime adapters should be optional.
A user installing the minimal kernel should NOT need every runtime.

---

## Runtime Contract

```typescript
interface InferenceRuntime {
  readonly id: string;
  readonly name: string;
  
  discoverModels(): Promise<Model[]>;
  loadModel(model: Model): Promise<ModelHandle>;
  unloadModel(handle: ModelHandle): Promise<void>;
  generate(request: GenerationRequest, handle: ModelHandle): Promise<GenerationResponse>;
  health(): Promise<RuntimeHealth>;
  capabilities(): RuntimeCapabilities;
}
```

---

## Runtime Adapters

| Adapter | Status | Protocol | Real Calls? |
|---------|--------|----------|-------------|
| Ollama | REAL | HTTP to localhost:11434 | Yes |
| llama.cpp | MOSTLY REAL | Subprocess + HTTP | Yes |
| MLX | STUB | None | No (mock) |
| Local | INTENTIONAL STUB | None | No (mock) |

---

## Model Selection Flow

```
Task
  ↓
Routing Engine
  ├── Check privacy requirements
  ├── Check capability requirements
  ├── Check quality targets
  ├── Check latency budgets
  ├── Check cost budgets
  ├── Check hardware compatibility
  ├── Check provider health
  └── Check benchmark history
  ↓
Selected Model + Runtime + Provider
  ↓
Runtime Adapter
  ↓
Generation Response
```

---

## Hardware-Aware Routing

The routing engine considers:
- RAM availability
- GPU/accelerator availability
- Thermal constraints
- Battery level
- System load

This allows a Mind to:
- Use local models when hardware permits
- Fall back to cloud models when hardware is constrained
- Optimize for cost, latency, or quality based on context

---

## Runtime Independence

The kernel provides only the abstraction.
Actual runtime implementations are optional:

**Minimal install:** Just the kernel (no runtimes)
**With Ollama:** Add Ollama adapter
**With llama.cpp:** Add llama.cpp adapter
**With MLX:** Add MLX adapter (when implemented)

---

*Runtime boundary defined 2025-09-08.*