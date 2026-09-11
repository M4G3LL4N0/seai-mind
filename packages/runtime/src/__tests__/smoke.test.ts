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
