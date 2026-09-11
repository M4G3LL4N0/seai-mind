import { describe, it, expect } from "vitest";
import {
  createMemoryEngine,
  memoryEngine as singletonMemory,
  createSkillEngine,
  createToolEngine,
  toolEngine as singletonTools,
  createGenomeEngine,
} from "../index.js";
import { createTelemetry, storage, SecurityEngine } from "@seai/core";

function testDeps() {
  const telemetry = createTelemetry({ enabled: false });
  const security = new SecurityEngine();
  return { telemetry, storage, security };
}

const ctx = (privacyLevel = "internal") => ({
  userId: "test",
  sessionId: "test-session",
  permissions: ["memory:read", "memory:write", "tool:execute"],
  privacyLevel,
  securityLevel: "low",
});

describe("state/memory REAL", () => {
  it("memory engine creates with deps", () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createMemoryEngine({}, telemetry, storage, security);
    expect(engine).toBeDefined();
    expect(typeof engine.capture).toBe("function");
    expect(typeof engine.retrieve).toBe("function");
  });

  it("memory STORE then GETBYID roundtrip (REAL)", async () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createMemoryEngine({}, telemetry, storage, security);
    await engine.initialize();
    const mindId = `mind-${Date.now()}`;
    const cap = await engine.capture(mindId, "episodic", { text: "hello world" }, ctx() as never);
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    // getById is the reliable roundtrip: MemoryEntry schema has no mindId field,
    // so repository.list({mindId}) cannot filter (known upstream limitation, see COMPRESSION_RESULTS).
    const got = await engine.getById(cap.value.id, ctx() as never);
    expect(got.ok).toBe(true);
    if (got.ok) {
      expect(got.value?.id).toBe(cap.value.id);
    }
    const ret = await engine.retrieve(mindId, { limit: 10 }, ctx() as never);
    expect(ret.ok).toBe(true);
    await engine.shutdown().catch(() => undefined);
  });

  it("singleton memory engine exists", () => {
    expect(singletonMemory).toBeDefined();
  });
});

describe("state/tools REAL", () => {
  it("tool engine lists builtin capabilities", () => {
    const engine = createToolEngine();
    const caps = engine.listCapabilities();
    expect(caps.length).toBeGreaterThan(0);
    expect(engine.getCapability("file.read")).toBeDefined();
  });

  it("tool execute unknown returns failure (not throw)", async () => {
    const engine = createToolEngine();
    const res = await engine.executeTool("does.not.exist", {});
    expect(res.success).toBe(false);
  });

  it("singleton tools exists", () => {
    expect(singletonTools).toBeDefined();
  });
});

describe("state/skills REAL", () => {
  it("skill engine creates with deps", () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createSkillEngine({}, telemetry, storage, security);
    expect(engine).toBeDefined();
    expect(typeof engine.createSkill).toBe("function");
    expect(typeof engine.validateSkill).toBe("function");
  });
});

describe("state/genome REAL", () => {
  it("genome engine creates with deps and rejects low privacy", async () => {
    const { telemetry, storage, security } = testDeps();
    const engine = createGenomeEngine({}, telemetry, storage, security);
    expect(engine).toBeDefined();
    // low privacy context should be denied for genome creation (requires confidential)
    const res = await engine.createGenome(
      "mind-x",
      {
        mindId: "mind-x",
        baseModels: [],
        adapters: [],
        prompts: {},
        skills: [],
        tools: [],
        policies: [],
        routing: { rules: [], defaultRoute: "local", fallbackChain: [] } as never,
        evaluators: [],
        knowledge: [],
        memoryConfig: {} as never,
      } as never,
      ctx("public") as never
    );
    expect(res.ok).toBe(false);
  });
});
