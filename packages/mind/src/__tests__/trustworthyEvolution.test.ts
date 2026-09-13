import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendFile } from "node:fs/promises";
import { createTelemetry, generateId, nowISO, Result } from "@seai/core";
import {
  createMindRuntime,
  createMindConfigFromTemplate,
  DEFAULT_MIND_TEMPLATE,
  summarizeArm,
  compareArms,
  decideGate,
  measureArm,
  computeEvidenceHash,
  stampExperimentRecord,
  verifyEvidenceHash,
  verifyHistoryIntegrity,
  appendExperimentRecord,
  readExperimentHistory,
  defaultStorePaths,
  extractionCriterion,
  CANDIDATE_SPECS,
  type ExperimentRecord,
  type ExperimentSuite,
  type TaskMeasurement,
} from "../index.js";

function freshDir() {
  return mkdtempSync(join(tmpdir(), "seai-trust-"));
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

// Real measurement sequence where a discrete subset of run indexes FAILS.
// Every entry is a genuine measurement; variance falls out of the runs.
function runMeasurements(
  taskIds: string[],
  runs: number,
  failedRunIndexes: number[],
  category?: string
): TaskMeasurement[] {
  const ms: TaskMeasurement[] = [];
  for (const id of taskIds) {
    for (let r = 0; r < runs; r++) {
      const fail = failedRunIndexes.includes(r);
      ms.push({
        taskId: id,
        success: !fail,
        outputMatches: !fail ? true : null,
        verification: !fail ? "verified-deterministic" : "none",
        latencyMs: 1,
        tokensUsed: null,
        executionPath: fail ? "none" : "deterministic",
        modelUsed: null,
        runIndex: r,
        category,
      });
    }
  }
  return ms;
}

// Per-task controllable success count (the first `successCount` runs succeed,
// the rest fail). All runs are real measurements; variance falls out directly.
function noisyPerTask(
  taskIds: string[],
  runs: number,
  successesPerTask: number[]
): TaskMeasurement[] {
  const ms: TaskMeasurement[] = [];
  for (let i = 0; i < taskIds.length; i++) {
    const id = taskIds[i];
    const okCount = successesPerTask[i];
    for (let r = 0; r < runs; r++) {
      const ok = r < okCount;
      ms.push({
        taskId: id,
        success: ok,
        outputMatches: ok ? true : null,
        verification: ok ? "verified-deterministic" : "none",
        latencyMs: 1,
        tokensUsed: null,
        executionPath: ok ? "deterministic" : "none",
        modelUsed: null,
        runIndex: r,
        category: "arithmetic",
      });
    }
  }
  return ms;
}

function sampleArm(passing: number, taskIds: string[]): ReturnType<typeof summarizeArm> {
  return summarizeArm(
    taskIds.slice(0, passing).map((taskId) => ({
      taskId,
      success: true,
      outputMatches: true,
      verification: "verified-deterministic",
      latencyMs: 2,
      tokensUsed: null,
      executionPath: "deterministic",
      modelUsed: null,
    }))
  );
}

function sampleRecord(): ExperimentRecord {
  const baseline = sampleArm(8, ["a", "b", "c", "d", "e", "f", "g", "h"]);
  const candidateResult = sampleArm(5, ["a", "b", "c", "d", "e"]);
  const deltas = compareArms(baseline, candidateResult);
  const gate = decideGate({ baseline, candidate: candidateResult, deltas, candidateChanges: {} });
  return {
    id: generateId(),
    mindId: "mind-1",
    suiteId: "s1",
    startedAt: nowISO(),
    completedAt: nowISO(),
    parentGenomeId: "g0",
    parentVersion: { major: 0, minor: 1, patch: 0 },
    candidate: null,
    baseline,
    candidateResult,
    deltas,
    gate,
    extraCandidates: [],
    sampling: { temperature: 0 },
    reproducibility: "full",
    promotion: null,
    rollback: null,
    lineage: [],
  };
}

describe("trustworthy/variance REAL", () => {
  it("repeated runs surface per-task variance, confidence and category rates", async () => {
    const telemetry = createTelemetry({ enabled: false });
    let counter = 0;
    const stub = {
      processTask: async (input: never) => {
        const even = counter % 2 === 0;
        counter++;
        if (!even) return Result.err(new Error("engine down"));
        const value = (input as { input?: unknown }).input;
        return Result.ok({
          result: value,
          verification: "verified-deterministic",
          executionPath: "deterministic",
          modelUsed: null,
          tokensUsed: null,
        } as never);
      },
    } as never;

    const suite: ExperimentSuite = {
      id: "variance-suite-v1",
      description: "small variance suite",
      tasks: [
        { id: "v-1", type: "reasoning", input: 1, expected: 1, category: "arithmetic" },
        { id: "v-2", type: "reasoning", input: 2, expected: 2, category: "arithmetic" },
        { id: "v-3", type: "reasoning", input: 3, expected: 3, category: "semantic" },
      ],
    };

    const arm = await measureArm(
      { telemetry, cognition: stub, mindId: "m", taskContext: {} as never, repeatRuns: 2 },
      suite.tasks,
      (out, exp) => ({ pass: out === exp, details: "" })
    );

    expect(arm.taskRuns).toBe(2);
    expect(arm.measurements.length).toBe(6);
    expect(arm.measurements.every((m) => typeof m.runIndex === "number")).toBe(true);
    expect(arm.measurements.filter((m) => m.runIndex === 0).length).toBe(3);
    expect(arm.successCount).toBe(3);
    expect(arm.perTaskVariance).toBeCloseTo(0.25);
    expect(arm.confidence).toBe("low");
    expect(arm.byCategory["arithmetic"]).toMatchObject({ count: 4, successCount: 2, successRate: 0.5 });
    expect(arm.byCategory["semantic"]).toMatchObject({ count: 2, successCount: 1, successRate: 0.5 });
  });

  it("single-run arms stay n/a and never invent variance", () => {
    const arm = summarizeArm(runMeasurements(["a", "b", "c"], 1, [0], "arithmetic"));
    expect(arm.taskRuns).toBe(1);
    expect(arm.perTaskVariance).toBeNull();
    expect(arm.confidence).toBe("n/a");
  });
});

describe("trustworthy/gate REAL", () => {
  it("holds a candidate whose signal is drowned by measured variance", () => {
    // Identical workload (3 tasks x 20 runs both arms) but noisy arms: the
    // +0.1 quality signal is smaller than 2x pooled per-task variance.
    const baseline = summarizeArm(noisyPerTask(["a", "b", "c"], 20, [10, 10, 10]), 20, 3);
    const candidate = summarizeArm(noisyPerTask(["a", "b", "c"], 20, [12, 12, 12]), 20, 3);
    const gate = decideGate({
      baseline,
      candidate,
      deltas: compareArms(baseline, candidate),
      candidateChanges: { cognitionConfig: { deterministicFormat: "json" } },
      thresholds: { minQualityImprovement: 0.05 },
    });
    expect(gate.decision).toBe("hold");
    expect(gate.reasons.some((r) => r.includes("variance-confidence"))).toBe(true);
  });

  it("holds when variance was measured on only one arm", () => {
    const baseline = summarizeArm(runMeasurements(["a", "b", "c"], 10, [9]), 10, 3);
    const deterministic = summarizeArm(runMeasurements(["a", "b", "c"], 1, []));
    // Baseline is noisy, candidate is deterministic single-run: uneven evidence.
    const gate = decideGate({
      baseline,
      candidate: deterministic,
      deltas: compareArms(baseline, deterministic),
      candidateChanges: {},
      thresholds: { minQualityImprovement: 0.05 },
    });
    expect(gate.reasons.some((r) => r.includes("variance-confidence"))).toBe(true);
  });

  it("passes a candidate whose signal clearly exceeds measured noise", () => {
    const baseline = summarizeArm(runMeasurements(["a", "b", "c"], 10, [0, 1, 2, 3, 4, 5]), 10, 3);
    const candidate = summarizeArm(runMeasurements(["a", "b", "c"], 10, [9]), 10, 3);
    // Signal +0.5 vs pooled variance 0.24 with a 1.5x SNR budget.
    const gate = decideGate({
      baseline,
      candidate,
      deltas: compareArms(baseline, candidate),
      candidateChanges: { cognitionConfig: { deterministicFormat: "json" } },
      thresholds: { minQualityImprovement: 0.05, varianceSignalToNoise: 1.5 },
    });
    expect(gate.decision).toBe("eligible");
  });

  it("holds with insufficient statistical power (small-N)", () => {
    const baseline = summarizeArm([
      { taskId: "s-1", success: true, outputMatches: true, verification: "verified-deterministic", latencyMs: 1, tokensUsed: null, executionPath: "deterministic", modelUsed: null },
      { taskId: "s-2", success: false, outputMatches: null, verification: "none", latencyMs: 1, tokensUsed: null, executionPath: "none", modelUsed: null },
    ]);
    const candidate = summarizeArm([
      { taskId: "s-1", success: true, outputMatches: true, verification: "verified-deterministic", latencyMs: 1, tokensUsed: null, executionPath: "deterministic", modelUsed: null },
      { taskId: "s-2", success: true, outputMatches: true, verification: "verified-deterministic", latencyMs: 1, tokensUsed: null, executionPath: "deterministic", modelUsed: null },
    ]);
    const gate = decideGate({
      baseline,
      candidate,
      deltas: compareArms(baseline, candidate),
      candidateChanges: {},
      thresholds: { minQualityImprovement: 0.05 },
    });
    expect(gate.decision).toBe("hold");
    expect(gate.reasons.some((r) => r.includes("small-sample"))).toBe(true);
  });

  it("rejects target-vs-global regression on any measured category", () => {
    const baselineTasks = ["a-a", "a-b", "a-c", "b-a", "b-b", "b-c", "c-a", "c-b", "no-1", "no-2"];
    const candTasks = ["a-a", "a-b", "a-c", "a-f1", "a-f2", "b-a", "b-b", "b-c", "b-f", "c-a", "c-b", "c-c"];
    const baseline = summarizeArm(baselineTasks.map((id) => ({
      taskId: id, success: true, outputMatches: true, verification: "verified-deterministic", latencyMs: 1, tokensUsed: null, executionPath: "deterministic", modelUsed: null,
    })));
    const candidate = summarizeArm(candTasks.map((id) => ({
      taskId: id, success: true, outputMatches: true, verification: "verified-deterministic", latencyMs: 1, tokensUsed: null, executionPath: "deterministic", modelUsed: null,
    })));
    // Global quality improved (+0.1) but the target category regressed hard.
    const gate = decideGate({
      baseline,
      candidate,
      deltas: compareArms(baseline, candidate),
      candidateChanges: {},
      thresholds: { minQualityImprovement: 0.05, maxCategoryRegression: 0.1 },
      categoryResults: {
        critical: { baselineSuccessRate: 1, candidateSuccessRate: 0.5, count: 6 },
        other: { baselineSuccessRate: 0.75, candidateSuccessRate: 0.9, count: 8 },
      },
    });
    expect(gate.decision).toBe("reject");
    expect(gate.reasons.some((r) => r.includes("category-critical-regression"))).toBe(true);
  });
});

describe("trustworthy/evidence-integrity REAL", () => {
  it("computes a stable evidence hash that ignores lifecycle fields", () => {
    const stamped = stampExperimentRecord(sampleRecord());
    expect(typeof stamped.evidenceHash).toBe("string");
    // A promotion appends lifecycle info; evidence hash must NOT change.
    const promoted: ExperimentRecord = {
      ...stamped,
      promotion: { promotedGenomeId: "g1", promotedAt: nowISO() },
      lineage: ["g0", "g0-1"],
    };
    expect(computeEvidenceHash(promoted)).toBe(stamped.evidenceHash);
    expect(verifyEvidenceHash(promoted)).toBe(true);
  });

  it("stamping is idempotent and unsigned records verify null", () => {
    const bare = sampleRecord();
    expect(verifyEvidenceHash(bare)).toBeNull();
    const once = stampExperimentRecord(bare);
    const twice = stampExperimentRecord(once);
    expect(twice.evidenceHash).toBe(once.evidenceHash);
  });

  it("detects tampering with measured evidence", () => {
    const stamped = stampExperimentRecord(sampleRecord());
    const clone = JSON.parse(JSON.stringify(stamped)) as ExperimentRecord;
    clone.candidateResult.measurements[0].success = !clone.candidateResult.measurements[0].success;
    expect(verifyEvidenceHash(clone)).toBe(false);
  });

  it("history skips tampered lines and tolerates unsigned legacy records", async () => {
    const storeBaseDir = freshDir();
    const paths = defaultStorePaths("integrity-mind", storeBaseDir);

    const valid = stampExperimentRecord(sampleRecord());

    await appendExperimentRecord(paths, valid);

    // Tampered: payload altered but the ORIGINAL signature is kept.
    const tampered = JSON.parse(JSON.stringify(valid)) as ExperimentRecord;
    tampered.baseline.measurements[0].success = !tampered.baseline.measurements[0].success;
    await appendExperimentRecord(paths, tampered);

    // A legacy record predating evidence hashing (no stamp).
    const unsigned = sampleRecord();
    await appendFile(paths.logFile, JSON.stringify(unsigned) + "\n", "utf-8");

    await appendFile(paths.logFile, "{ definitely not json }\n", "utf-8");

    const history = await readExperimentHistory(paths);
    expect(history.map((r) => r.id).sort()).toEqual([unsigned.id, valid.id].sort());

    const integrity = await verifyHistoryIntegrity(paths);
    expect(integrity).toEqual({ total: 4, verified: 1, unsigned: 1, tampered: 2 });
  });
});

describe("trustworthy/anti-overfitting REAL", () => {
  it("candidate evidence never references holdout tasks", async () => {
    const storeBaseDir = freshDir();
    const { runtime } = await bootMind(`Guard-${Date.now()}`);

    const suite: ExperimentSuite = {
      id: "ne-guard-v1",
      description: "generalization guard",
      tasks: [
        { id: "e-1", type: "reasoning", input: "What is 2 + 2? Answer in JSON.", expected: 4, category: "arithmetic" },
        { id: "e-2", type: "reasoning", input: "What is 7 * 6? Answer in JSON.", expected: 42, category: "arithmetic" },
        { id: "e-3", type: "reasoning", input: "What is (3 + 4) * 2? Answer in JSON.", expected: 14, category: "arithmetic" },
        { id: "e-4", type: "reasoning", input: "What is 10 / 4? Answer in JSON.", expected: 2.5, category: "arithmetic" },
      ],
      holdoutTasks: [
        { id: "h-1", type: "reasoning", input: "What is 11 * 11? Answer in JSON.", expected: 121 },
        { id: "h-2", type: "reasoning", input: "What is 100 - 38? Answer in JSON.", expected: 62 },
      ],
    };

    const res = await runtime.runExperiment(suite, { storeBaseDir });
    await runtime.shutdown();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const record = res.value;

    const evolutionIds = new Set(suite.tasks.map((t) => t.id));
    const holdoutIds = new Set((suite.holdoutTasks ?? []).map((t) => t.id));

    expect(record.candidateResult.measurements.length).toBeGreaterThan(0);
    for (const m of record.candidateResult.measurements) {
      expect(evolutionIds.has(m.taskId)).toBe(true);
      expect(holdoutIds.has(m.taskId)).toBe(false);
    }
    const candidateReason = record.candidate?.reason ?? "";
    for (const id of holdoutIds) {
      expect(candidateReason.includes(id)).toBe(false);
    }
  }, 120000);
});

// Conditional live integration: real Ollama, real model. The adversarial
// claim checked here is that a live-model candidate NEVER has holdout task
// evidence in its proposal or measurements, even though holdout tasks are
// deliberately structured to look exactly like evolution tasks (the same
// extraction shape) so any leakage would be tempting to overfit on.
const ollamaLive = await (async () => {
  try {
    const res = await fetch("http://localhost:11434/api/version", { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
})();

describe.runIf(ollamaLive)("trustworthy/anti-overfitting-live REAL (requires Ollama)", () => {
  it("live-model candidate evidence never references holdout tasks", async () => {
    const { Ollama } = await import("@seai/runtime");
    const storeBaseDir = freshDir();
    const { runtime } = await bootMind(`Adversarial-${Date.now()}`);
    await runtime.registerRuntime(Ollama.createOllamaRuntime());

    // Holdout tasks reuse the SAME extraction shape/category as evolution
    // tasks (max temptation to leak them into candidate evidence).
    const suite = {
      id: "adversarial-extraction-v1",
      description: "evolution tasks + structurally identical holdout tasks",
      tasks: [
        { id: "evo-1", type: "chat", category: "extraction", input: 'Extract name, age, city as JSON from: "Maria is 34 and lives in Lima."', expected: { name: "Maria", age: 34, city: "Lima" } },
        { id: "evo-2", type: "chat", category: "extraction", input: 'Extract name, age, city as JSON from: "Chen is 28 and lives in Oslo."', expected: { name: "Chen", age: 28, city: "Oslo" } },
        { id: "evo-3", type: "chat", category: "extraction", input: 'Extract product, price, currency as JSON from: "The widget costs 19.99 USD."', expected: { product: "widget", price: 19.99, currency: "USD" } },
        { id: "evo-4", type: "chat", category: "extraction", input: 'Extract title, year, director as JSON from: "The film Dune from 2021 directed by Villeneuve."', expected: { title: "Dune", year: 2021, director: "Villeneuve" } },
      ],
      holdoutTasks: [
        { id: "hold-1", type: "chat", category: "extraction", input: 'Extract name, age, city as JSON from: "Yuki is 41 and lives in Kyoto."', expected: { name: "Yuki", age: 41, city: "Kyoto" } },
        { id: "hold-2", type: "chat", category: "extraction", input: 'Extract product, price, currency as JSON from: "The gadget costs 299.00 EUR."', expected: { product: "gadget", price: 299, currency: "EUR" } },
      ],
    };

    const res = await runtime.runExperiment(suite as never, {
      storeBaseDir,
      criterion: extractionCriterion,
      candidates: [{ name: "json-only-prompt", config: CANDIDATE_SPECS["json-only-prompt"]?.config ?? {} }],
      taskTimeoutMs: 60000,
    });
    await runtime.shutdown();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const record = res.value;

    const evolutionIds = new Set(suite.tasks.map((t) => t.id));
    const holdoutIds = new Set(suite.holdoutTasks.map((t) => t.id));

    // 0. Baseline never leaks holdout tasks into its measurements either.
    for (const m of record.baseline.measurements) {
      expect(evolutionIds.has(m.taskId)).toBe(true);
      expect(holdoutIds.has(m.taskId)).toBe(false);
    }

    // 1. The candidate arm measured ONLY evolution tasks. (When the baseline
    // had zero failures, no candidate is proposed — that is honest: no
    // evidence, no claim. The invariant below still holds vacuously.)
    if (record.candidate !== null) {
      expect(record.candidateResult.measurements.length).toBeGreaterThan(0);
      for (const m of record.candidateResult.measurements) {
        expect(evolutionIds.has(m.taskId)).toBe(true);
        expect(holdoutIds.has(m.taskId)).toBe(false);
      }

      // 2. The candidate's stated evidence cites only evolution failures.
      const evidence = record.candidate.evidence as { failedTaskIds?: string[] } | undefined;
      const cited = evidence?.failedTaskIds ?? [];
      for (const id of cited) expect(evolutionIds.has(id)).toBe(true);

      // 3. The proposal reason never names holdout tasks.
      for (const id of holdoutIds) expect(record.candidate.reason.includes(id)).toBe(false);
    } else {
      // No candidate proposed because the stock baseline passed all 4 evo
      // tasks — verify there is genuinely nothing to improve on the evo set.
      expect(record.baseline.measurements.every((m) => m.outputMatches === true)).toBe(true);
    }

    // 4. Structural honesty only: any gate decision is valid as long as it is real.
    expect(["eligible", "hold", "reject"]).toContain(record.gate.decision);
  }, 300000);
});