import { describe, it, expect } from "vitest";
import { createRuntimeManager } from "../index.js";
import { createLocalRuntime } from "../adapters/local.js";
import { createOllamaRuntime } from "../adapters/ollama.js";

describe("runtime REAL", () => {
  it("runtime manager creates", () => {
    const m = createRuntimeManager();
    expect(m).toBeDefined();
    expect(typeof m.discoverAllModels).toBe("function");
    expect(typeof m.generate).toBe("function");
  });

  it("local runtime generate returns mock (STUB, real code path)", async () => {
    const rt = createLocalRuntime();
    const health = await rt.health();
    expect(health.healthy).toBe(true);
    const handle = await rt.loadModel({ id: "test", provider: "local", name: "test" } as never);
    expect(handle).toBeDefined();
    const res = await rt.generate(handle, { prompt: "hello" } as never);
    expect(res.text).toContain("Local Runtime");
  });

  it("ollama runtime constructs without server", () => {
    const rt = createOllamaRuntime("http://localhost:11434");
    expect(rt).toBeDefined();
  });
});

describe("runtime/selection REAL (P1)", () => {
  it("probeAvailability on an empty manager reports nothing (honest)", async () => {
    const m = createRuntimeManager();
    expect(await m.probeAvailability()).toEqual([]);
    expect(await m.selectHealthyRuntime()).toBeNull();
  });

  it("selectHealthyRuntime prefers the requested healthy runtime", async () => {
    const { createLocalRuntime: local } = await import("../adapters/local.js");
    const { createMLXRuntime: mlx } = await import("../adapters/mlx.js");
    const m = createRuntimeManager();
    m.registerRuntime(mlx());
    m.registerRuntime(local());
    const selected = await m.selectHealthyRuntime(["local"]);
    // mlx reports unhealthy (STUB, never available); local is healthy.
    expect(selected?.name).toBe("local");
  });

  it("adapter errors propagate instead of being hidden", async () => {
    const m = createRuntimeManager();
    await expect(
      m.generate(
        { id: "h", model: { id: "x" }, runtime: "ghost", loadedAt: "" } as never,
        { prompt: "hi" } as never
      )
    ).rejects.toThrow("Runtime not found");
  });
});

describe("runtime/routing REAL (P2)", () => {
  it("selects a runtime-discovered model when no providers are registered", async () => {
    const { createRoutingEngine } = await import("../routing.js");
    const { createTelemetry, SecurityEngine, PolicyEngine } = await import("@seai/core");
    const telemetry = createTelemetry({ enabled: false });
    const security = new SecurityEngine();
    const routing = createRoutingEngine(telemetry, security, new PolicyEngine(security));
    const model = {
      id: "m-1",
      provider: "ollama",
      name: "qwen2.5-coder:3b",
      capabilities: ["text-generation", "chat"],
      costPerToken: { input: 0, output: 0 },
    };
    const res = await routing.route({
      task: { id: "t", type: "chat", capability: "chat", privacy: "internal" },
      hardware: { gpu: { present: false }, accelerator: { present: false } } as never,
      availableModels: [model] as never,
      availableProviders: [],
      availableRuntimes: ["ollama"],
      securityContext: {} as never,
      policyContext: {} as never,
    });
    expect(res.decision.model).toBe("m-1");
    expect(res.decision.runtime).toBe("ollama");
  });
});
