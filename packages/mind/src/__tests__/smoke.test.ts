import { describe, it, expect } from "vitest";
import {
  createMindRuntime,
  createMindConfigFromTemplate,
  DEFAULT_MIND_TEMPLATE,
  createPipeline,
  runPipeline,
  createEvaluationEngine,
  evaluationEngine as singletonEval,
} from "../index.js";
import { createTelemetry, SecurityEngine, generateId, nowISO } from "@seai/core";

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
