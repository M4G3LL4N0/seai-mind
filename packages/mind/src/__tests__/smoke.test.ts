import { describe, it, expect } from "vitest";
import {
  createMindRuntime,
  createMindConfigFromTemplate,
  DEFAULT_MIND_TEMPLATE,
  createPipeline,
  runPipeline,
  createCognitionEngine,
  createEvaluationEngine,
  evaluationEngine as singletonEval,
  tryDeterministicArithmetic,
  verifyDeterministic,
} from "../index.js";
import {
  createTelemetry,
  createStorage,
  SecurityEngine,
  PolicyEngine,
  generateId,
  nowISO,
} from "@seai/core";
import { createMemoryEngine, createSkillEngine, createToolEngine } from "@seai/state";
import { createRuntimeManager, createRoutingEngine } from "@seai/runtime";

function testIdentity() {
  return {
    id: generateId(),
    name: "TestMind",
    version: { major: 0, minor: 1, patch: 0 },
    generation: "Darwin",
    codename: "Darwin 0.1",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

describe("mind/config REAL", () => {
  it("creates MindConfig from template", () => {
    const cfg = createMindConfigFromTemplate(DEFAULT_MIND_TEMPLATE, testIdentity() as never);
    expect(cfg.identity.name).toBe("TestMind");
    expect(cfg.memory).toBeDefined();
    expect(cfg.evaluation).toBeDefined();
    expect(cfg.evolution).toBeDefined();
  });

  it("mind runtime creates with full config", () => {
    const cfg = createMindConfigFromTemplate(DEFAULT_MIND_TEMPLATE, testIdentity() as never);
    const runtime = createMindRuntime(cfg);
    expect(runtime).toBeDefined();
    expect(typeof runtime.initialize).toBe("function");
    expect(typeof runtime.runTask).toBe("function");
    expect(typeof runtime.evolve).toBe("function");
    expect(typeof runtime.getState).toBe("function");
  });

  it("mind getState before init", () => {
    const cfg = createMindConfigFromTemplate(DEFAULT_MIND_TEMPLATE, testIdentity() as never);
    const runtime = createMindRuntime(cfg);
    const state = runtime.getState();
    expect(state.name).toBe("TestMind");
  });
});

describe("mind/pipeline REAL", () => {
  it("pipeline runs deterministic steps (no LLM)", async () => {
    const pipe = createPipeline([
      { name: "upper", execute: async (input: unknown) => String(input).toUpperCase() },
      { name: "exclaim", execute: async (input: unknown) => `${input}!` },
    ]);
    const out = await runPipeline(pipe, "hello", {} as never);
    expect(out).toBe("HELLO!");
  });
});

describe("mind/evaluation REAL", () => {
  it("evaluation engine creates and lists suites", () => {
    const engine = createEvaluationEngine({}, createTelemetry({ enabled: false }), new SecurityEngine());
    expect(engine).toBeDefined();
    expect(engine.listSuites().length).toBeGreaterThan(0);
  });

  it("evaluation rejects unknown suite (fail-closed)", async () => {
    const engine = createEvaluationEngine({}, createTelemetry({ enabled: false }), new SecurityEngine());
    const res = await engine.evaluate("nope", "output", { taskId: "t", goal: "g" } as never);
    expect(res.ok).toBe(false);
  });

  it("singleton evaluation engine exists", () => {
    expect(singletonEval).toBeDefined();
  });
});

function wiredCognition() {
  const telemetry = createTelemetry({ enabled: false });
  const storage = createStorage();
  const security = new SecurityEngine();
  const policy = new PolicyEngine(security);
  const memory = createMemoryEngine({}, telemetry, storage, security);
  const skills = createSkillEngine({}, telemetry, storage, security);
  const tools = createToolEngine();
  const routing = createRoutingEngine(telemetry, security, policy);
  const runtimes = createRuntimeManager(telemetry);
  const cognition = createCognitionEngine({}, telemetry, memory, skills, tools, routing, runtimes, security, policy);
  return { cognition };
}

function taskContext(mindId: string) {
  const securityContext = {
    userId: "test",
    sessionId: "test-session",
    permissions: ["memory:read", "memory:write"],
    privacyLevel: "internal",
    securityLevel: "low",
  } as never;
  return {
    mindId,
    securityContext,
    policyContext: {} as never,
    hardwareProfile: {} as never,
    availableModels: [],
    availableProviders: [],
  } as never;
}

describe("mind/deterministic REAL (P2)", () => {
  it("evaluates embedded arithmetic without a model", () => {
    expect(tryDeterministicArithmetic("What is 2 + 2?")?.value).toBe(4);
    expect(tryDeterministicArithmetic("(3 + 4) * 2")?.value).toBe(14);
    expect(tryDeterministicArithmetic("10 / 4")?.value).toBe(2.5);
    expect(tryDeterministicArithmetic("-5 + 3")?.value).toBe(-2);
  });

  it("returns null for non-arithmetic or unsafe input", () => {
    expect(tryDeterministicArithmetic("Call me at 5")).toBeNull();
    expect(tryDeterministicArithmetic("Revenue grew 20% in 2024")).toBeNull();
    expect(tryDeterministicArithmetic("10 / 0")).toBeNull();
    expect(tryDeterministicArithmetic("hello world")).toBeNull();
  });

  it("verifyDeterministic accepts the true pair and rejects tampering", () => {
    expect(verifyDeterministic({ expression: "2 + 2", value: 4 })).toBe(true);
    expect(verifyDeterministic({ expression: "2 + 2", value: 5 })).toBe(false);
  });

  it("processTask executes 2+2 end to end with no model configured", async () => {
    const { cognition } = wiredCognition();
    const mindId = generateId();
    const res = await cognition.processTask(
      { type: "reasoning", input: "What is 2 + 2?" } as never,
      taskContext(mindId)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.result).toBe(4);
    expect(res.value.executionPath).toBe("deterministic");
    expect(res.value.verification).toBe("verified-deterministic");
    expect(res.value.status).toBe("completed");
  });

  it("processTask fails honestly when nothing can execute", async () => {
    const { cognition } = wiredCognition();
    const res = await cognition.processTask(
      { type: "reasoning", input: "Tell me a story about dragons" } as never,
      taskContext(generateId())
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(String(res.error)).toContain("No execution method available");
    expect(String(res.error)).toContain("ollama serve");
  });
});

describe("mind/experience REAL (P3)", () => {
  it("runTask records a retrievable experience for its own Mind", async () => {
    const cfg = createMindConfigFromTemplate(DEFAULT_MIND_TEMPLATE, {
      id: generateId(),
      name: "ExperienceMind",
      version: { major: 0, minor: 1, patch: 0 },
      generation: "Darwin",
      codename: "Darwin 0.1",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    } as never);
    const runtime = createMindRuntime(cfg);
    const init = await runtime.initialize();
    expect(init.ok).toBe(true);

    const res = await runtime.runTask({ type: "reasoning", input: "What is 2 + 2?" } as never);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.result).toBe(4);

    const mem = await runtime
      .getMemoryEngine()
      .retrieve(cfg.identity.id, { searchText: "task-experience", limit: 10 }, {
        userId: "test",
        sessionId: "s",
        permissions: [],
        privacyLevel: "internal",
        securityLevel: "low",
      } as never);
    expect(mem.ok).toBe(true);
    if (!mem.ok) return;
    const experiences = mem.value.filter(
      (m) => (m.content as Record<string, unknown>)?.["kind"] === "task-experience"
    );
    expect(experiences.length).toBeGreaterThan(0);
    const exp = experiences[0]?.content as Record<string, unknown>;
    expect(exp["executionPath"]).toBe("deterministic");
    expect(exp["verification"]).toBe("verified-deterministic");
    expect(exp["status"]).toBe("completed");

    await runtime.shutdown();
  }, 60000);
});

describe("mind/evaluation-of-execution REAL (P3)", () => {
  it("exact-match criterion passes on a real deterministic output", async () => {
    const engine = createEvaluationEngine({}, createTelemetry({ enabled: false }), new SecurityEngine());
    const res = await engine.evaluateWithCustomCriteria(
      [
        {
          name: "exact-match",
          description: "Output equals expected",
          weight: 1,
          evaluate: async (output, expected) => {
            const passed = String(output) === String(expected);
            return { score: passed ? 1 : 0, passed, details: passed ? "match" : "mismatch" };
          },
        },
      ],
      4,
      { taskId: "t-1", goal: "arithmetic", input: "What is 2 + 2?", expectedOutput: 4 } as never
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.passed).toBe(true);
    expect(res.value.overallScore).toBe(1);
  });
});

// Conditional live-model suite: runs ONLY when a real Ollama server is
// reachable. Never faked, never mocked — skipped honestly otherwise.
const ollamaLive = await (async () => {
  try {
    const res = await fetch("http://localhost:11434/api/version", {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
})();

describe.runIf(ollamaLive)("mind/live-model REAL (P2, requires Ollama)", () => {
  it("runTask executes on a real model end to end", async () => {
    const { Ollama } = await import("@seai/runtime");
    const createOllamaRuntime = Ollama.createOllamaRuntime;
    const cfg = createMindConfigFromTemplate(DEFAULT_MIND_TEMPLATE, {
      id: generateId(),
      name: "LiveModelMind",
      version: { major: 0, minor: 1, patch: 0 },
      generation: "Darwin",
      codename: "Darwin 0.1",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    } as never);
    const runtime = createMindRuntime(cfg);
    expect((await runtime.initialize()).ok).toBe(true);

    await runtime.registerRuntime(createOllamaRuntime());
    const res = await runtime.runTask({ type: "chat", input: "Reply with exactly: OK" } as never);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.executionPath).toBe("model");
    expect(String(res.value.result)).toContain("OK");
    expect(res.value.tokensUsed).toBeGreaterThan(0);

    // The real execution is evaluable: contains-criterion over actual output.
    const engine = createEvaluationEngine({}, createTelemetry({ enabled: false }), new SecurityEngine());
    const evaluation = await engine.evaluateWithCustomCriteria(
      [
        {
          name: "contains-ok",
          description: "Output contains OK",
          weight: 1,
          evaluate: async (output) => {
            const passed = String(output).includes("OK");
            return { score: passed ? 1 : 0, passed, details: passed ? "found" : "missing" };
          },
        },
      ],
      res.value.result,
      { taskId: res.value.id, goal: "live", input: "Reply with exactly: OK" } as never
    );
    expect(evaluation.ok).toBe(true);
    if (evaluation.ok) expect(evaluation.value.passed).toBe(true);

    await runtime.shutdown();
  }, 120000);
});
