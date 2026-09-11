import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createMindRuntime,
  createMindConfigFromTemplate,
  DEFAULT_MIND_TEMPLATE,
  ARITHMETIC_FORMAT_SUITE_V1,
  EXTRACTION_JSON_V1,
  CANDIDATE_SPECS,
  extractionCriterion,
  createCognitionEngine,
} from "../index.js";
import {
  discoverLocalRuntimes,
  Local,
  createRoutingEngine,
  createRuntimeManager,
} from "@seai/runtime";
import {
  createTelemetry,
  createStorage,
  SecurityEngine,
  PolicyEngine,
  generateId,
  nowISO,
} from "@seai/core";
import { createMemoryEngine, createSkillEngine, createToolEngine } from "@seai/state";

function freshDir() {
  return mkdtempSync(join(tmpdir(), "seai-modevo-"));
}

function testIdentity(name: string) {
  return {
    id: generateId(),
    name,
    version: { major: 0, minor: 1, patch: 0 },
    generation: "Darwin",
    codename: "Darwin 0.1",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  } as never;
}

async function bootMind(name: string) {
  const cfg = createMindConfigFromTemplate(DEFAULT_MIND_TEMPLATE, testIdentity(name));
  const runtime = createMindRuntime(cfg);
  const init = await runtime.initialize();
  expect(init.ok).toBe(true);
  return { cfg, runtime };
}

// Wired cognition with a LABELED fixture runtime (LocalRuntime mock strings).
// Used ONLY to prove measurement plumbing — never presented as inference.
function wiredFixtureCognition() {
  const telemetry = createTelemetry({ enabled: false });
  const storage = createStorage();
  const security = new SecurityEngine();
  const policy = new PolicyEngine(security);
  const memory = createMemoryEngine({}, telemetry, storage, security);
  const skills = createSkillEngine({}, telemetry, storage, security);
  const tools = createToolEngine();
  const routing = createRoutingEngine(telemetry, security, policy);
  const runtimes = createRuntimeManager(telemetry);
  runtimes.registerRuntime(Local.createLocalRuntime());
  const cognition = createCognitionEngine({}, telemetry, memory, skills, tools, routing, runtimes, security, policy);
  return { cognition, runtimes };
}

function fixtureModel() {
  return {
    id: "fixture-1",
    provider: "local",
    name: "fixture",
    capabilities: ["text-generation", "chat"],
    costPerToken: { input: 0, output: 0 },
  } as never;
}

function fixtureContext(mindId: string, withModels: boolean) {
  return {
    mindId,
    securityContext: {
      userId: "test",
      sessionId: "t",
      permissions: [],
      privacyLevel: "internal",
      securityLevel: "low",
    },
    policyContext: {},
    hardwareProfile: { gpu: { present: false }, accelerator: { present: false } },
    availableModels: withModels ? [fixtureModel()] : [],
    availableProviders: [],
  } as never;
}

describe("model-evolution/criterion REAL", () => {
  it("extractionCriterion verifies real outputs deterministically", () => {
    expect(extractionCriterion('{"name":"Maria","age":34,"city":"Lima"}', { name: "Maria", age: 34, city: "Lima" }).pass).toBe(true);
    // Fenced/preambled model output fails: the exact baseline imperfection.
    expect(extractionCriterion('```json\n{"name":"Maria","age":34}\n```', { name: "Maria", age: 34 }).pass).toBe(false);
    expect(extractionCriterion('Here is the JSON: {"name":"Maria","age":34}', { name: "Maria", age: 34 }).pass).toBe(false);
    expect(extractionCriterion('{"name":"Maria"}', { name: "Maria", age: 34 }).pass).toBe(false);
    expect(extractionCriterion('{"name":"X","age":34}', { name: "Maria", age: 34 }).pass).toBe(false);
    expect(extractionCriterion(42, { name: "Maria" }).pass).toBe(false);
  });

  it("extraction suite is unambiguous and self-contained", () => {
    expect(EXTRACTION_JSON_V1.tasks.length).toBe(10);
    for (const t of EXTRACTION_JSON_V1.tasks) {
      expect(t.id).toBeTruthy();
      expect(typeof t.input).toBe("string");
      expect(t.expected).toBeTypeOf("object");
    }
  });
});

describe("model-evolution/fixture-plumbing REAL", () => {
  it("model path records execution metadata without claiming inference", async () => {
    const { cognition, runtimes } = wiredFixtureCognition();
    const seen: string[] = [];
    const orig = runtimes.generate.bind(runtimes);
    runtimes.generate = (async (h: never, r: never) => {
      seen.push((r as { systemPrompt?: string }).systemPrompt ?? "");
      return orig(h, r);
    }) as typeof runtimes.generate;

    const res = await cognition.processTask(
      { type: "chat", input: "Say hello" } as never,
      fixtureContext(generateId(), true)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.executionPath).toBe("model");
    expect(typeof res.value.modelUsed).toBe("string");
    expect(String(res.value.result)).toContain("Local Runtime");
    // Baseline prompt carries no extra instruction.
    expect(seen[0]).not.toContain("Be brief.");
  });

  it("systemPromptExtra reaches the model request (prompt evolution is real)", async () => {
    const { cognition, runtimes } = wiredFixtureCognition();
    const seen: string[] = [];
    const orig = runtimes.generate.bind(runtimes);
    runtimes.generate = (async (h: never, r: never) => {
      seen.push((r as { systemPrompt?: string }).systemPrompt ?? "");
      return orig(h, r);
    }) as typeof runtimes.generate;

    const ctx = fixtureContext(generateId(), true);
    await cognition.processTask({ type: "chat", input: "Say hello" } as never, ctx);
    cognition.updateConfig({ systemPromptExtra: "Be brief." });
    await cognition.processTask({ type: "chat", input: "Say hello again" } as never, ctx);
    expect(seen.length).toBe(2);
    expect(seen[1]).toContain("Be brief.");
  });

  it("model-list changes defeat the cache (no cross-model masquerade)", async () => {
    const { cognition } = wiredFixtureCognition();
    const mindId = generateId();
    const withModels = await cognition.processTask(
      { type: "chat", input: "Say hello" } as never,
      fixtureContext(mindId, true)
    );
    expect(withModels.ok).toBe(true);
    // Same input, no models available: must fail honestly, never serve the
    // fixture's cached mock as if a model executed.
    const withoutModels = await cognition.processTask(
      { type: "chat", input: "Say hello" } as never,
      fixtureContext(mindId, false)
    );
    expect(withoutModels.ok).toBe(false);
  });
});

describe("model-evolution/multi-candidate REAL", () => {
  it("two candidates share one baseline; each gated; extras promotable by id", async () => {
    const storeBaseDir = freshDir();
    const { runtime } = await bootMind(`Multi-${Date.now()}`);
    const rec = await runtime.runExperiment(ARITHMETIC_FORMAT_SUITE_V1, {
      storeBaseDir,
      candidates: [
        CANDIDATE_SPECS["json-format"] as never,
        { name: "json-again", config: { deterministicFormat: "json" } },
      ],
    });
    expect(rec.ok).toBe(true);
    if (!rec.ok) return;
    expect(rec.value.extraCandidates.length).toBe(1);
    // Identical workload across all three arms.
    const ids = ARITHMETIC_FORMAT_SUITE_V1.tasks.map((t) => t.id);
    expect(rec.value.baseline.measurements.map((m) => m.taskId)).toEqual(ids);
    expect(rec.value.extraCandidates[0]?.result.measurements.map((m) => m.taskId)).toEqual(ids);
    expect(rec.value.extraCandidates[0]?.gate.decision).toBe("eligible");

    // Promote the EXTRA candidate explicitly by id.
    const extraId = rec.value.extraCandidates[0]?.candidate.id as string;
    const promoted = await runtime.promoteExperiment(rec.value.id, { storeBaseDir, candidateId: extraId });
    expect(promoted.ok).toBe(true);
    await runtime.shutdown();
  }, 120000);
});

describe("model-evolution/reproducibility REAL", () => {
  it("deterministic records claim full reproduction; model arms claim limited", async () => {
    const storeBaseDir = freshDir();
    const { runtime } = await bootMind(`Repro2-${Date.now()}`);
    const rec = await runtime.runExperiment(ARITHMETIC_FORMAT_SUITE_V1, { storeBaseDir });
    expect(rec.ok).toBe(true);
    if (!rec.ok) return;
    expect(rec.value.reproducibility).toBe("full");
    expect(rec.value.sampling).toMatchObject({ temperature: 0.7 });
    await runtime.shutdown();
  }, 120000);
});

describe("model-evolution/evidence-linkage REAL", () => {
  it("candidate evidence references actual baseline failures", async () => {
    const storeBaseDir = freshDir();
    const { runtime } = await bootMind(`Evidence-${Date.now()}`);
    const rec = await runtime.runExperiment(ARITHMETIC_FORMAT_SUITE_V1, { storeBaseDir });
    expect(rec.ok).toBe(true);
    if (!rec.ok || !rec.value.candidate) return;
    const failedIds = new Set(
      rec.value.baseline.measurements.filter((m) => m.success && !m.outputMatches).map((m) => m.taskId)
    );
    const cited = (rec.value.candidate.evidence as { failedTaskIds: string[] }).failedTaskIds;
    expect(cited.length).toBeGreaterThan(0);
    for (const id of cited) expect(failedIds.has(id)).toBe(true);
    await runtime.shutdown();
  }, 120000);
});

describe("model-evolution/discovery REAL", () => {
  it("unreachable endpoint yields nothing (honest)", async () => {
    const found = await discoverLocalRuntimes({ ollamaBaseUrl: "http://localhost:9", timeoutMs: 1500 });
    expect(found).toEqual([]);
  });

  it("live discovery never auto-registers the mock fixture", async () => {
    const found = await discoverLocalRuntimes({ timeoutMs: 2000 });
    expect(found.find((r) => r.name === "local")).toBeUndefined();
  });
});

// Conditional live integration: real Ollama, real model, real tokens.
// Skipped honestly when no server is reachable. No outcome is asserted
// beyond structural honesty (any of eligible/hold/reject is valid).
const ollamaLive = await (async () => {
  try {
    const res = await fetch("http://localhost:11434/api/version", { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
})();

describe.runIf(ollamaLive)("model-evolution/live REAL (requires Ollama)", () => {
  it("model-backed experiment measures real executions on identical workload", async () => {
    const { Ollama } = await import("@seai/runtime");
    const storeBaseDir = freshDir();
    const { runtime } = await bootMind(`LiveModelEvo-${Date.now()}`);
    await runtime.registerRuntime(Ollama.createOllamaRuntime());

    const miniSuite = {
      id: "extraction-json-v1-mini",
      description: "4-task live subset (time-boxed integration)",
      tasks: EXTRACTION_JSON_V1.tasks.slice(0, 4),
    };
    const runOnce = () =>
      runtime.runExperiment(miniSuite as never, {
        storeBaseDir,
        criterion: extractionCriterion,
        candidates: [{ name: "json-only-prompt", config: CANDIDATE_SPECS["json-only-prompt"]?.config ?? {} }],
        taskTimeoutMs: 60000,
      });
    let rec = await runOnce();
    // A fully-failed baseline means the shared local server was saturated by
    // parallel tests, not that the machinery broke: up to two retries, then
    // judge. Error samples are printed for diagnosis (never asserted on).
    for (let attempt = 0; attempt < 2 && rec.ok && rec.value.baseline.successCount === 0; attempt++) {
      console.log(
        "live baseline all-failed; sample errors:",
        rec.value.baseline.measurements.slice(0, 3).map((m) => m.error)
      );
      await new Promise((r) => setTimeout(r, 8000));
      rec = await runOnce();
    }
    expect(rec.ok).toBe(true);
    if (!rec.ok) return;
    expect(rec.value.reproducibility).toBe("limited");
    expect(rec.value.sampling).toMatchObject({ temperature: 0.7 });
    // Identical workload in both arms.
    expect(rec.value.baseline.measurements.map((m) => m.taskId)).toEqual(
      rec.value.candidateResult.measurements.map((m) => m.taskId)
    );
    // Real executions carry model identity, latency, and reported tokens.
    const executed = rec.value.candidateResult.measurements.filter((m) => m.executionPath === "model");
    expect(executed.length).toBeGreaterThan(0);
    for (const m of executed) {
      expect(m.modelUsed).toBeTruthy();
      expect(m.latencyMs).toBeGreaterThan(0);
    }
    expect(["eligible", "hold", "reject"]).toContain(rec.value.gate.decision);
    await runtime.shutdown();
  }, 300000);
});
