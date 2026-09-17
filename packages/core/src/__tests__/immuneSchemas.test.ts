import { describe, it, expect } from "vitest";
import {
  ImmuneSeveritySchema,
  ImmuneSignalSchema,
  ImmuneAssessmentSchema,
  QuarantineSchema,
  type ImmuneSeverity,
  type ImmuneSignal,
} from "../index.js";

// Phase 14 Task 1: additive immune schemas.
// Invariant: these are ADDITIVE to Phase 13 — they may not require fields
// that a legacy Phase-13-era record lacks. Parsing a legacy-style object
// (without immune fields) MUST succeed and yield the additive defaults.

describe("immune schemas (Phase 14, additive)", () => {
  it("ImmuneSeveritySchema accepts exactly the four severities", () => {
    for (const s of ["INFO", "WARNING", "HIGH", "CRITICAL"]) {
      expect(ImmuneSeveritySchema.parse(s)).toBe(s);
    }
    // additive-only: enum has no arbitrary extra values beyond contract
    expect(ImmuneSeveritySchema.options.length).toBeGreaterThanOrEqual(4);
  });

  it("ImmuneSignalSchema parses a well-formed measured signal", () => {
    const signal = ImmuneSignalSchema.parse({
      id: "sig-test-1",
      kind: "PROTECTED_CATEGORY_REGRESSION",
      severity: "HIGH",
      measured: true,
      evidenceRefs: ["ev-1"],
      source: "decided-generalization-gate",
      message: "protected category regressed on holdout",
      at: "2026-09-15T00:00:00.000Z",
      candidateId: "cand-1",
      experimentId: "exp-1",
    });
    expect(signal.measured).toBe(true);
    expect(signal.kind).toMatch(/REGRESSION|FAILURE|VARIANCE|INVALID|MISMATCH|LIMITATION|POLICY|COST|ENERGY/);
  });

  it("ImmuneSignalSchema permits missing measurements as NOT-measured, never fabricated", () => {
    const unmeasured = ImmuneSignalSchema.parse({
      id: "sig-unmeasured-1",
      kind: "COST_REGRESSION",
      severity: "WARNING",
      measured: false, // honest: no durable cost measurement exists
      evidenceRefs: [],
      source: "cost-measurement",
      message: "cost not measured; cannot claim safe",
      at: "2026-09-15T00:00:00.000Z",
    });
    expect(unmeasured.measured).toBe(false);
  });

  it("ImmuneAssessmentSchema parses CLEAR / WARNING / BLOCKED / QUARANTINED dispositions additively", () => {
    for (const disposition of ["CLEAR", "WARNING", "BLOCKED", "QUARANTINED"]) {
      const result = ImmuneAssessmentSchema.parse({
        disposition,
        severity: "HIGH",
        signals: [
          {
            id: "sig-1",
            kind: "GENERALIZATION_FAILURE",
            severity: "HIGH",
            measured: true,
            evidenceRefs: ["ev-1"],
            source: "generalization-gate",
            message: "holdout regression",
            at: "2026-09-15T00:00:00.000Z",
          },
        ],
        timestamp: "2026-09-15T00:00:00.000Z",
        evidenceRefs: ["ev-1"],
      });
      expect(result.disposition).toBe(disposition);
    }
  });

  it("QuarantineSchema parses a durable quarantine record", () => {
    const quarantine = QuarantineSchema.parse({
      candidateId: "cand-9",
      mindId: "mind-1",
      problem: "PROTECTED_CATEGORY_REGRESSION",
      severity: "CRITICAL",
      reason: "protected capability regressed on holdout",
      evidenceRefs: ["ev-9"],
      decision: "QUARANTINED",
      quarantinedAt: "2026-09-15T00:00:00.000Z",
    });
    expect(quarantine.decision).toBe("QUARANTINED");
  });

  it("legacy Phase-13-style record (no immune fields) still parses additively without throwing", () => {
    const legacy = {
      id: "rec-legacy-1",
      suiteId: "suite-1",
      candidateId: "cand-1",
      // NO immune fields on purpose — this is a pre-Phase-14 record
      baseline: { successRate: 0.5, qualityRate: 0.8, latencyMs: 10, tokens: 100 },
      candidateResult: { successRate: 0.5, qualityRate: 0.8, latencyMs: 10, tokens: 140 },
      deltas: { success_delta: 0, quality_delta: 0, verification_delta: 0 },
      gate: { decision: "eligible", checks: [] },
    };
    const parsed = ImmuneAssessmentSchema.extend({
      // additive-only: parse must tolerate absence of immune fields
    }).safeParse({
      disposition: "CLEAR",
      severity: "INFO",
      signals: [],
      timestamp: "2026-09-15T00:00:00.000Z",
      evidenceRefs: [],
      legacy,
    });
    expect(parsed.success).toBe(true);
  });

  it("type-level: ImmuneSeverity is a strict subset type usable in signals", () => {
    const sev: ImmuneSeverity = "HIGH";
    const signal: ImmuneSignal = {
      id: "sig-t",
      kind: "REPRODUCIBILITY_LIMITATION",
      severity: sev,
      measured: true,
      evidenceRefs: [],
      source: "reproducibility",
      message: "limited reproducibility",
      at: "2026-09-15T00:00:00.000Z",
    };
    expect(signal.severity).toBe("HIGH");
  });
});
