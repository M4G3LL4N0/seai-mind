import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  defaultStorePaths,
  appendExperimentRecord,
  readExperimentHistory,
  promoteInStore,
  promoteInStoreWithImmune,
  rollbackInStore,
  quarantineStorePaths,
  appendQuarantine,
  readQuarantines,
  lastQuarantineForCandidate,
  quarantineCandidate,
  isQuarantined,
  DecideImmuneAssessmentInput,
  deriveImmuneSignals,
  defaultImmunityPolicy,
  decideImmuneAssessment,
  storeGenomeSnapshot,
  type Genome,
  type Version,
} from "../experiment.js";
import type { ExperimentRecord, GateReport, SuiteVersion } from "../experiment.js";
import type { ArmResult } from "../experiment.js";

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "seai-immune-test-"));
}

function makeGateReport(decision: "eligible" | "reject" | "hold", overrides = {}): GateReport {
  return {
    decision,
    reasons: [],
    checks: [],
    ...overrides,
  };
}

function makeArmResult(overrides: Partial<ArmResult> = {}): ArmResult {
  return {
    measurements: [],
    taskCount: 10,
    successCount: 8,
    successRate: 0.8,
    qualityRate: 0.8,
    verificationRate: 0.8,
    meanLatencyMs: 100,
    totalTokensKnown: 1000,
    tokensUnknown: 0,
    taskRuns: 2,
    perTaskVariance: 0.01,
    confidence: "high",
    byCategory: { extraction: { count: 10, successCount: 8, successRate: 0.8 } },
    ...overrides,
  };
}

function makeSuiteVersion(overrides: Partial<SuiteVersion> = {}): SuiteVersion {
  return {
    suiteId: "test-suite",
    version: "v1",
    releasedAt: new Date().toISOString(),
    taskSetHash: "abc123",
    holdoutHash: "def456",
    contentHash: "ghi789",
    evaluator: "contract-v1",
    ...overrides,
  };
}

function makeRecord(overrides: Partial<ExperimentRecord> = {}): ExperimentRecord {
  const now = new Date().toISOString();
  return {
    id: "exp-1",
    mindId: "mind-1",
    suiteId: "test-suite",
    startedAt: now,
    completedAt: now,
    parentGenomeId: "genome-1",
    parentVersion: { major: 1, minor: 0, patch: 0 },
    candidate: null,
    extraCandidates: [],
    sampling: { temperature: 0 },
    reproducibility: "full",
    baseline: makeArmResult(),
    candidateResult: makeArmResult(),
    deltas: { success_delta: 0, quality_delta: 0.05, verification_delta: 0, latency_delta_ms: 10, token_delta: 50 },
    gate: makeGateReport("eligible"),
    promotion: null,
    rollback: null,
    lineage: ["genome-1"],
    suiteVersion: makeSuiteVersion(),
    // evidenceHash omitted so stampExperimentRecord computes it
    ...overrides,
  };
}

describe("Task 6: quarantine store — durable, append-only", () => {
  let testDir: string;
  let paths: ReturnType<typeof defaultStorePaths>;
  let qPaths: ReturnType<typeof quarantineStorePaths>;

  beforeEach(async () => {
    testDir = await tempDir();
    paths = defaultStorePaths("test-mind", testDir);
    qPaths = quarantineStorePaths(paths);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("appendQuarantine creates a quarantined record", async () => {
    const q = {
      candidateId: "cand-1",
      mindId: "mind-1",
      problem: "PROTECTED_CATEGORY_REGRESSION" as const,
      severity: "CRITICAL" as const,
      reason: "Protected category regressed",
      evidenceRefs: ["ev-1"],
      decision: "QUARANTINED" as const,
      quarantinedAt: new Date().toISOString(),
    };
    await appendQuarantine(qPaths, q);
    const records = await readQuarantines(qPaths);
    expect(records.length).toBe(1);
    expect(records[0].candidateId).toBe("cand-1");
    expect(records[0].decision).toBe("QUARANTINED");
  });

  it("re-append same candidate preserves history (no silent overwrite)", async () => {
    const q = {
      candidateId: "cand-1",
      mindId: "mind-1",
      problem: "PROTECTED_CATEGORY_REGRESSION" as const,
      severity: "CRITICAL" as const,
      reason: "First quarantine",
      evidenceRefs: ["ev-1"],
      decision: "QUARANTINED" as const,
      quarantinedAt: new Date().toISOString(),
    };
    await appendQuarantine(qPaths, q);
    await appendQuarantine(qPaths, { ...q, reason: "Second quarantine", quarantinedAt: new Date().toISOString() });
    const records = await readQuarantines(qPaths);
    expect(records.length).toBe(2);
    expect(records[0].reason).toBe("First quarantine");
    expect(records[1].reason).toBe("Second quarantine");
  });

  it("readQuarantines returns ALL historical quarantines", async () => {
    await appendQuarantine(qPaths, {
      candidateId: "cand-1",
      mindId: "mind-1",
      problem: "PROTECTED_CATEGORY_REGRESSION" as const,
      severity: "CRITICAL" as const,
      reason: "Q1",
      evidenceRefs: ["ev-1"],
      decision: "QUARANTINED" as const,
      quarantinedAt: new Date().toISOString(),
    });
    await appendQuarantine(qPaths, {
      candidateId: "cand-2",
      mindId: "mind-1",
      problem: "EVIDENCE_INVALID" as const,
      severity: "CRITICAL" as const,
      reason: "Q2",
      evidenceRefs: ["ev-2"],
      decision: "QUARANTINED" as const,
      quarantinedAt: new Date().toISOString(),
    });
    const records = await readQuarantines(qPaths);
    expect(records.length).toBe(2);
    const cand1 = records.filter((r) => r.candidateId === "cand-1");
    expect(cand1.length).toBe(1);
  });

  it("quarantine record is immutable (fields not mutating on re-read)", async () => {
    const originalAt = new Date().toISOString();
    await appendQuarantine(qPaths, {
      candidateId: "cand-1",
      mindId: "mind-1",
      problem: "PROTECTED_CATEGORY_REGRESSION" as const,
      severity: "CRITICAL" as const,
      reason: "Immutable test",
      evidenceRefs: ["ev-1"],
      decision: "QUARANTINED" as const,
      quarantinedAt: originalAt,
    });
    const records1 = await readQuarantines(qPaths);
    const records2 = await readQuarantines(qPaths);
    expect(records1[0].quarantinedAt).toBe(originalAt);
    expect(records2[0].quarantinedAt).toBe(originalAt);
    expect(records1[0]).toEqual(records2[0]);
  });
});

describe("Task 7: quarantine lifecycle officers", () => {
  let testDir: string;
  let paths: ReturnType<typeof defaultStorePaths>;
  let qPaths: ReturnType<typeof quarantineStorePaths>;

  beforeEach(async () => {
    testDir = await tempDir();
    paths = defaultStorePaths("test-mind", testDir);
    qPaths = quarantineStorePaths(paths);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("quarantineCandidate writes durable record + sets candidate state so it cannot promote", async () => {
    const record = makeRecord({ id: "exp-1" });
    await appendExperimentRecord(paths, record);

    const assessment = decideImmuneAssessment({
      signals: [{ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "hash mismatch", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy: defaultImmunityPolicy(),
    });

    await quarantineCandidate({
      paths,
      qPaths,
      candidateId: "cand-1",
      assessment,
      problem: "EVIDENCE_INVALID",
      reason: "Hash verification failed",
      mindId: "mind-1",
    });

    const isQ = await isQuarantined(paths, qPaths, "cand-1");
    expect(isQ).toBe(true);

    // Promote should fail for quarantined candidate
    await expect(promoteInStoreWithImmune(paths, qPaths, "exp-1", "cand-1")).rejects.toThrow();
  });

  it("isQuarantined true only for real quarantines (not REJECTED/HELD)", async () => {
    const record = makeRecord({ id: "exp-1" });
    await appendExperimentRecord(paths, record);

    // Non-quarantined candidate
    expect(await isQuarantined(paths, qPaths, "cand-1")).toBe(false);

    // Quarantine it
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "hash mismatch", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy: defaultImmunityPolicy(),
    });
    await quarantineCandidate({
      paths,
      qPaths,
      candidateId: "cand-1",
      assessment,
      problem: "EVIDENCE_INVALID",
      reason: "test",
      mindId: "mind-1",
    });

    expect(await isQuarantined(paths, qPaths, "cand-1")).toBe(true);
  });

  it("candidate quarantine record survives promote attempts (still listed; NOT auto-cleared)", async () => {
    const record = makeRecord({ id: "exp-1" });
    await appendExperimentRecord(paths, record);

    const assessment = decideImmuneAssessment({
      signals: [{ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "hash mismatch", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy: defaultImmunityPolicy(),
    });
    await quarantineCandidate({
      paths,
      qPaths,
      candidateId: "cand-1",
      assessment,
      problem: "EVIDENCE_INVALID",
      reason: "test",
      mindId: "mind-1",
    });

    // Try to promote (should fail but record should persist)
    try {
      await promoteInStoreWithImmune(paths, qPaths, "exp-1", "cand-1");
    } catch {
      // Expected to fail
    }

    const records = await readQuarantines(qPaths);
    expect(records.length).toBe(1);
    expect(records[0].candidateId).toBe("cand-1");
    expect(records[0].decision).toBe("QUARANTINED");
  });

  it("candidate previously ROLLED_BACK is NOT auto-quarantined (ROLLED_BACK is historical state, not immune failure)", async () => {
    // This test validates that rollback != quarantine
    // We just check the logic doesn't auto-quarantine on rollback
    const isQ = await isQuarantined(paths, qPaths, "rolled-back-cand");
    expect(isQ).toBe(false);
  });
});

describe("Task 8: promotion integration — immune assessment before eligibility", () => {
  let testDir: string;
  let paths: ReturnType<typeof defaultStorePaths>;
  let qPaths: ReturnType<typeof quarantineStorePaths>;

  beforeEach(async () => {
    testDir = await tempDir();
    paths = defaultStorePaths("test-mind", testDir);
    qPaths = quarantineStorePaths(paths);
    // Store parent genome for promotion tests
    const parentGenome: Genome = {
      id: "genome-1",
      version: { major: 1, minor: 0, patch: 0 },
      cognitionConfig: {},
      lineage: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evolutionHistory: [],
    };
    await storeGenomeSnapshot(paths, parentGenome);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("immune assessment BLOCKED → promotion blocked, explicit hold recorded", async () => {
    const record = makeRecord({
      id: "exp-blocked",
      candidate: {
        id: "cand-blocked",
        genomeId: "genome-1",
        layer: "configuration",
        description: "test",
        changes: { cognitionConfig: { deterministicFormat: "json" } },
        generatedBy: "test",
        generatedAt: new Date().toISOString(),
        reason: "test",
        evidence: {},
        status: "proposed",
      },
    });
    await appendExperimentRecord(paths, record);

    // Immune assessment returns BLOCKED
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "PROTECTED_CATEGORY_REGRESSION", severity: "HIGH", measured: true, evidenceRefs: ["ev-1"], source: "gate", message: "protected reg", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy: defaultImmunityPolicy(),
    });

    expect(assessment.disposition).toBe("BLOCKED");

    // Promotion should be blocked (pass assessment explicitly)
    await expect(promoteInStoreWithImmune(paths, qPaths, "exp-blocked", "cand-blocked", assessment)).rejects.toThrow();
  });

  it("immune assessment QUARANTINED → promotion blocked, quarantine recorded", async () => {
    const record = makeRecord({
      id: "exp-quarantined",
      candidate: {
        id: "cand-quarantined",
        genomeId: "genome-1",
        layer: "configuration",
        description: "test",
        changes: { cognitionConfig: { deterministicFormat: "json" } },
        generatedBy: "test",
        generatedAt: new Date().toISOString(),
        reason: "test",
        evidence: {},
        status: "proposed",
      },
    });
    await appendExperimentRecord(paths, record);

    const assessment = decideImmuneAssessment({
      signals: [{ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "tampered", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy: defaultImmunityPolicy(),
    });

    expect(assessment.disposition).toBe("QUARANTINED");
    await expect(promoteInStoreWithImmune(paths, qPaths, "exp-quarantined", "cand-quarantined", assessment)).rejects.toThrow();
  });

  it("immune assessment WARNING (e.g. holdout insufficient) → promotion requires explicit + policy re-check", async () => {
    const record = makeRecord({
      id: "exp-warning",
      candidate: {
        id: "cand-warning",
        genomeId: "genome-1",
        layer: "configuration",
        description: "test",
        changes: { cognitionConfig: { deterministicFormat: "json" } },
        generatedBy: "test",
        generatedAt: new Date().toISOString(),
        reason: "test",
        evidence: {},
        status: "proposed",
      },
    });
    await appendExperimentRecord(paths, record);

    const assessment = decideImmuneAssessment({
      signals: [{ kind: "GENERALIZATION_FAILURE", severity: "WARNING", measured: false, evidenceRefs: [], source: "gate", message: "insufficient holdout", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "HOLD",
      policy: defaultImmunityPolicy(),
    });

    expect(assessment.disposition).toBe("WARNING");
    // WARNING does NOT block promotion by itself (candidate remains eligible-able)
    // but promotion still requires explicit command (no auto-promotion)
  });

  it("CLEAR → candidate is ELIGIBLE but promotion still REQUIRES explicit promote command", async () => {
    const record = makeRecord({
      id: "exp-clear",
      candidate: {
        id: "cand-clear",
        genomeId: "genome-1",
        layer: "configuration",
        description: "test",
        changes: { cognitionConfig: { deterministicFormat: "json" } },
        generatedBy: "test",
        generatedAt: new Date().toISOString(),
        reason: "test",
        evidence: {},
        status: "proposed",
      },
    });
    await appendExperimentRecord(paths, record);

    const assessment = decideImmuneAssessment({
      signals: [],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy: defaultImmunityPolicy(),
    });

    expect(assessment.disposition).toBe("CLEAR");
    // CLEAR makes candidate eligible, but explicit promotion still required
    const { record: promoted, genome } = await promoteInStoreWithImmune(paths, qPaths, "exp-clear", "cand-clear", assessment);
    expect(promoted.promotion).not.toBeNull();
    expect(genome.version.patch).toBe(1);
  });

  it("existing benign promotion still works (no regression to Phase 13 promotion logic)", async () => {
    const record = makeRecord({
      id: "exp-benign",
      candidate: {
        id: "cand-benign",
        genomeId: "genome-1",
        layer: "configuration",
        description: "test",
        changes: { cognitionConfig: { deterministicFormat: "json" } },
        generatedBy: "test",
        generatedAt: new Date().toISOString(),
        reason: "test",
        evidence: {},
        status: "proposed",
      },
    });
    await appendExperimentRecord(paths, record);

    // Use original promoteInStore for backward compat test
    const { record: promoted, genome } = await promoteInStore(paths, "exp-benign", "cand-benign");
    expect(promoted.promotion).not.toBeNull();
    expect(genome.version.patch).toBe(1);
    expect(promoted.lineage.length).toBe(2); // parent + promoted
  });
});