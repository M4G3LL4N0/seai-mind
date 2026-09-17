import { describe, it, expect } from "vitest";
import {
  ImmuneSignalKind,
  makeImmuneSignal,
  unmeasuredCost,
  unmeasuredLatency,
  unmeasuredToken,
  deriveImmuneSignals,
  ImmunityPolicy,
  defaultImmunityPolicy,
  severityFor,
  decideImmuneAssessment,
  type ImmuneSignal,
  type ImmuneAssessment,
} from "../experiment.js";
import type {
  GateReport,
  GateDecision,
  GeneralizationGateResult,
  ArmResult,
  SuiteVersion,
} from "../experiment.js";

function makeGateReport(decision: GateDecision, overrides: Partial<GateReport> = {}): GateReport {
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
    taskCount: 0,
    successCount: 0,
    successRate: 0,
    qualityRate: 0,
    verificationRate: 0,
    meanLatencyMs: null,
    totalTokensKnown: 0,
    tokensUnknown: 0,
    taskRuns: 1,
    perTaskVariance: null,
    confidence: "n/a",
    byCategory: {},
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

describe("Task 2: ImmuneSignalKind enum + makeImmuneSignal factory", () => {
  it("ImmuneSignalKind includes all 11 evidence-backed kinds", () => {
    const kinds: ImmuneSignalKind[] = [
      "QUALITY_REGRESSION",
      "GENERALIZATION_FAILURE",
      "PROTECTED_CATEGORY_REGRESSION",
      "HIGH_VARIANCE",
      "EVIDENCE_INVALID",
      "SUITE_MISMATCH",
      "REPRODUCIBILITY_LIMITATION",
      "COST_REGRESSION",
      "LATENCY_REGRESSION",
      "TOKEN_REGRESSION",
      "POLICY_FAILURE",
    ];
    expect(kinds.length).toBe(11);
  });

  it("makeImmuneSignal produces stable id from same kind+evidenceRefs", () => {
    const s1 = makeImmuneSignal({
      kind: "QUALITY_REGRESSION",
      severity: "HIGH",
      evidenceRefs: ["ev-1", "ev-2"],
      source: "gate",
      message: "quality dropped",
      measured: true,
    });
    const s2 = makeImmuneSignal({
      kind: "QUALITY_REGRESSION",
      severity: "HIGH",
      evidenceRefs: ["ev-1", "ev-2"],
      source: "gate",
      message: "quality dropped",
      measured: true,
    });
    expect(s1.id).toBe(s2.id);
    expect(s1.id.length).toBeGreaterThan(0);
  });

  it("makeImmuneSignal carries measured flag correctly", () => {
    const measured = makeImmuneSignal({
      kind: "QUALITY_REGRESSION",
      severity: "HIGH",
      evidenceRefs: ["ev-1"],
      source: "gate",
      message: "measured signal",
      measured: true,
    });
    const unmeasured = makeImmuneSignal({
      kind: "COST_REGRESSION",
      severity: "INFO",
      evidenceRefs: [],
      source: "cost-model",
      message: "cost not measured",
      measured: false,
    });
    expect(measured.measured).toBe(true);
    expect(unmeasured.measured).toBe(false);
  });

  it("unmeasuredCost / unmeasuredLatency / unmeasuredToken helpers create NOT_MEASURED signals", () => {
    const cost = unmeasuredCost();
    const latency = unmeasuredLatency();
    const token = unmeasuredToken();

    expect(cost.kind).toBe("COST_REGRESSION");
    expect(cost.measured).toBe(false);
    expect(cost.evidenceRefs).toEqual([]);

    expect(latency.kind).toBe("LATENCY_REGRESSION");
    expect(latency.measured).toBe(false);

    expect(token.kind).toBe("TOKEN_REGRESSION");
    expect(token.measured).toBe(false);
  });
});

describe("Task 3: deriveImmuneSignals — real-only derivation", () => {
  const policy = defaultImmunityPolicy();

  it("gate reject with regression → QUALITY_REGRESSION or PROTECTED_CATEGORY_REGRESSION signal", () => {
    const gate = makeGateReport("reject", {
      reasons: ["REJECT: regression-success — Candidate success dropped by 0.15 vs baseline"],
      checks: [{ name: "regression-success", passed: false, details: "dropped", severity: "reject" }],
    });
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const qualityReg = signals.find((s) => s.kind === "QUALITY_REGRESSION");
    expect(qualityReg).toBeDefined();
    expect(qualityReg?.measured).toBe(true);
    expect(qualityReg?.evidenceRefs.length).toBeGreaterThan(0);
  });

  it("generalization gate FAIL → GENERALIZATION_FAILURE", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "FAIL",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const genFail = signals.find((s) => s.kind === "GENERALIZATION_FAILURE");
    expect(genFail).toBeDefined();
    expect(genFail?.severity).toBe("HIGH");
  });

  it("generalization gate HOLD → INSUFFICIENT_GENERALIZATION (WARNING)", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "HOLD",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const holdSignal = signals.find((s) => s.kind === "GENERALIZATION_FAILURE");
    expect(holdSignal).toBeDefined();
    expect(holdSignal?.severity).toBe("WARNING");
  });

  it("evidence-hash mismatch → EVIDENCE_INVALID, CRITICAL", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: false },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const evInvalid = signals.find((s) => s.kind === "EVIDENCE_INVALID");
    expect(evInvalid).toBeDefined();
    expect(evInvalid?.severity).toBe("CRITICAL");
    expect(evInvalid?.measured).toBe(true);
  });

  it("suite re-resolution mismatch (taskSetHash/holdoutHash differ) → SUITE_MISMATCH, CRITICAL", () => {
    const gate = makeGateReport("eligible");
    const original = makeSuiteVersion({ taskSetHash: "aaa", holdoutHash: "bbb" });
    const resolved = makeSuiteVersion({ taskSetHash: "ccc", holdoutHash: "ddd" });
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: original,
      resolvedSuiteVersion: resolved,
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const mismatch = signals.find((s) => s.kind === "SUITE_MISMATCH");
    expect(mismatch).toBeDefined();
    expect(mismatch?.severity).toBe("CRITICAL");
  });

  it("repeatRuns>1 variance above maxVariance → HIGH_VARIANCE", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.2, candV: 0.25, signalToNoise: 2 },
    });
    const highVar = signals.find((s) => s.kind === "HIGH_VARIANCE");
    expect(highVar).toBeDefined();
    expect(highVar?.measured).toBe(true);
  });

  it("repeatRuns<2 → no HIGH_VARIANCE signal (NOT_MEASURED)", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: null,
    });
    const highVar = signals.find((s) => s.kind === "HIGH_VARIANCE");
    expect(highVar).toBeUndefined();
  });

  it("reproducibility==='limited' → REPRODUCIBILITY_LIMITATION (INFO/WARNING)", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "limited",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const reprLimit = signals.find((s) => s.kind === "REPRODUCIBILITY_LIMITATION");
    expect(reprLimit).toBeDefined();
    expect(["INFO", "WARNING"]).toContain(reprLimit?.severity);
  });

  it("missing cost/latency/token measurement → signal with measured:false", () => {
    const gate = makeGateReport("eligible");
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
      cost: null,
      latencyMs: null,
      tokens: null,
    });
    const cost = signals.find((s) => s.kind === "COST_REGRESSION");
    const latency = signals.find((s) => s.kind === "LATENCY_REGRESSION");
    const token = signals.find((s) => s.kind === "TOKEN_REGRESSION");
    expect(cost?.measured).toBe(false);
    expect(latency?.measured).toBe(false);
    expect(token?.measured).toBe(false);
  });

  it("policy-failure → POLICY_FAILURE, CRITICAL", () => {
    const gate = makeGateReport("reject", {
      reasons: ["REJECT: safety-threat-scan — Threat signatures: injection"],
      checks: [{ name: "safety-threat-scan", passed: false, details: "threat", severity: "reject" }],
    });
    const signals = deriveImmuneSignals({
      gateReport: gate,
      generalizationDecision: "PASS",
      integrity: { candidateHashValid: true, holdoutHashValid: true, evidenceHashValid: true },
      suiteVersion: makeSuiteVersion(),
      resolvedSuiteVersion: makeSuiteVersion(),
      reproducibility: "full",
      variance: { baseV: 0.01, candV: 0.01, signalToNoise: 2 },
    });
    const policyFail = signals.find((s) => s.kind === "POLICY_FAILURE");
    expect(policyFail).toBeDefined();
    expect(policyFail?.severity).toBe("CRITICAL");
  });
});

describe("Task 4: ImmunityPolicy", () => {
  it("defaultImmunityPolicy provides project engineering defaults", () => {
    const policy = defaultImmunityPolicy();
    expect(policy.maxVariance).toBeGreaterThan(0);
    expect(policy.requiredHoldoutEvidence).toBe(true);
    expect(policy.protectedRegressionThreshold).toBeGreaterThanOrEqual(0);
    expect(policy.criticalKinds).toContain("EVIDENCE_INVALID");
    expect(policy.criticalKinds).toContain("POLICY_FAILURE");
    expect(policy.quarantineKinds).toContain("EVIDENCE_INVALID");
    expect(policy.quarantineKinds).toContain("POLICY_FAILURE");
  });

  it("severityFor ranks INFO < WARNING < HIGH < CRITICAL", () => {
    const policy = defaultImmunityPolicy();
    expect(severityFor({ kind: "COST_REGRESSION", severity: "INFO", measured: true, evidenceRefs: [], source: "x", message: "x", at: new Date().toISOString() }, policy)).toBe("INFO");
    expect(severityFor({ kind: "QUALITY_REGRESSION", severity: "WARNING", measured: true, evidenceRefs: [], source: "x", message: "x", at: new Date().toISOString() }, policy)).toBe("WARNING");
    expect(severityFor({ kind: "PROTECTED_CATEGORY_REGRESSION", severity: "HIGH", measured: true, evidenceRefs: [], source: "x", message: "x", at: new Date().toISOString() }, policy)).toBe("HIGH");
    expect(severityFor({ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: [], source: "x", message: "x", at: new Date().toISOString() }, policy)).toBe("CRITICAL");
  });
});

describe("Task 5: decideImmuneAssessment", () => {
  const policy = defaultImmunityPolicy();

  it("no signals + gate eligible → CLEAR", () => {
    const assessment = decideImmuneAssessment({
      signals: [],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment.disposition).toBe("CLEAR");
    expect(assessment.severity).toBe("INFO");
  });

  it("WARNING-kind signal (or gate hold) → WARNING (NOT BLOCKED)", () => {
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "COST_REGRESSION", severity: "WARNING", measured: true, evidenceRefs: ["ev-1"], source: "cost", message: "cost up", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment.disposition).toBe("WARNING");
    // gate hold also yields WARNING
    const assessment2 = decideImmuneAssessment({
      signals: [],
      gateDecision: "hold",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment2.disposition).toBe("WARNING");
  });

  it("HIGH/severe-but-not-critical (protected regression above threshold, variance) → BLOCKED", () => {
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "PROTECTED_CATEGORY_REGRESSION", severity: "HIGH", measured: true, evidenceRefs: ["ev-1"], source: "gate", message: "protected reg", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment.disposition).toBe("BLOCKED");
  });

  it("CRITICAL kind (EVIDENCE_INVALID, SUITE_MISMATCH, POLICY_FAILURE) → QUARANTINED", () => {
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "hash mismatch", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment.disposition).toBe("QUARANTINED");

    const assessment2 = decideImmuneAssessment({
      signals: [{ kind: "SUITE_MISMATCH", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "suite changed", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment2.disposition).toBe("QUARANTINED");

    const assessment3 = decideImmuneAssessment({
      signals: [{ kind: "POLICY_FAILURE", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "gate", message: "threat", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment3.disposition).toBe("QUARANTINED");
  });

  it("missing holdout evidence → BLOCKED/WARNING as NOT_MEASURED, never CLEAR", () => {
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "GENERALIZATION_FAILURE", severity: "WARNING", measured: false, evidenceRefs: [], source: "gate", message: "insufficient holdout", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "HOLD",
      policy,
    });
    expect(assessment.disposition).not.toBe("CLEAR");
    expect(["WARNING", "BLOCKED"]).toContain(assessment.disposition);
  });

  it("HOLD != BLOCKED distinction preserved", () => {
    // Gate HOLD with only info signals should be WARNING, not BLOCKED
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "REPRODUCIBILITY_LIMITATION", severity: "INFO", measured: true, evidenceRefs: ["ev-1"], source: "repro", message: "limited", at: new Date().toISOString() }],
      gateDecision: "hold",
      generalizationDecision: "HOLD",
      policy,
    });
    expect(assessment.disposition).toBe("WARNING");
  });

  it("QUARANTINED != REJECTED distinction preserved", () => {
    const assessment = decideImmuneAssessment({
      signals: [{ kind: "EVIDENCE_INVALID", severity: "CRITICAL", measured: true, evidenceRefs: ["ev-1"], source: "integrity", message: "tampered", at: new Date().toISOString() }],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment.disposition).toBe("QUARANTINED");
    // Not REJECTED (that's a gate decision, not immune disposition)
  });

  it("insufficient evidence != PASS (UNAVAILABLE != PASS)", () => {
    const assessment = decideImmuneAssessment({
      signals: [
        { kind: "COST_REGRESSION", severity: "INFO", measured: false, evidenceRefs: [], source: "cost", message: "not measured", at: new Date().toISOString() },
        { kind: "LATENCY_REGRESSION", severity: "INFO", measured: false, evidenceRefs: [], source: "cost", message: "not measured", at: new Date().toISOString() },
      ],
      gateDecision: "eligible",
      generalizationDecision: "PASS",
      policy,
    });
    expect(assessment.disposition).not.toBe("CLEAR");
  });
});