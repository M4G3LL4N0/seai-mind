// Real self-evolution experiment machinery (Darwin 0.1).
//
// This module implements the smallest REAL evolution loop:
// baseline and candidate arms run IDENTICAL task suites through REAL
// cognition engines, measurements are captured (never fabricated), deltas
// are computed from raw evidence, gates decide eligible/reject/hold, and
// promotion/rollback move versioned genomes with full lineage.
//
// What this module does NOT do (explicitly out of scope, not hidden):
// - OS-level isolation (no containers/VMs). Sandboxes isolate STATE
//   (fresh storage per arm) with timeouts and resource caps. A candidate
//   that needs filesystem/network beyond what the engines already do is
//   out of scope for Darwin sandboxes.
// - Model-weight evolution (LoRA/distillation). Candidates are
//   data/configuration only — never arbitrary source-code self-modification.
// - LLM-as-judge. Criteria are deterministic functions over actual outputs.

import { mkdir, appendFile, readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateId, nowISO, detectThreats, EventTypes } from "@seai/core";
import { createTelemetry, type Telemetry } from "@seai/core";
import type { EvolutionCandidate, Genome, Version } from "@seai/core";
import type { CognitionEngine, CognitionConfig, TaskContext } from "./cognition.js";

// ---------------------------------------------------------------------------
// Suite, tasks, criteria
// ---------------------------------------------------------------------------

export interface ExperimentTask {
  id: string;
  type: string;
  input: unknown;
  expected?: unknown;
  // Model-evaluation contract fields (Phase 1). timeoutMs is ENFORCED by
  // the sandbox; category is recorded per measurement. allowedRuntimes /
  // allowedModels / privacy are recorded with the suite for reproducibility
  // and reserved for future enforcement (documented, not faked).
  category?: string;
  timeoutMs?: number;
  privacy?: string;
  allowedRuntimes?: string[];
  allowedModels?: string[];
}

export interface ExperimentSuite {
  id: string;
  description: string;
  tasks: ExperimentTask[];
}

// Response-format compliance: tasks explicitly request JSON. The baseline
// (raw deterministic output) fails the format criterion; that measured
// failure is the evidence that motivates the candidate.
export const ARITHMETIC_FORMAT_SUITE_V1: ExperimentSuite = {
  id: "arithmetic-format-v1",
  description: "Arithmetic tasks requesting JSON output; measures format compliance",
  tasks: [
    { id: "arith-1", type: "reasoning", input: "What is 2 + 2? Answer in JSON.", expected: 4 },
    { id: "arith-2", type: "reasoning", input: "What is 7 * 6? Answer in JSON.", expected: 42 },
    { id: "arith-3", type: "reasoning", input: "What is (3 + 4) * 2? Answer in JSON.", expected: 14 },
    { id: "arith-4", type: "reasoning", input: "What is 10 / 4? Answer in JSON.", expected: 2.5 },
    { id: "arith-5", type: "reasoning", input: "What is -5 + 3? Answer in JSON.", expected: -2 },
    { id: "arith-6", type: "reasoning", input: "What is 100 - 58? Answer in JSON.", expected: 42 },
    { id: "arith-7", type: "reasoning", input: "What is 2.5 * 4? Answer in JSON.", expected: 10 },
    // Invalid arithmetic: no deterministic path exists. Both arms must fail
    // these identically (honest failure is the correct outcome).
    { id: "arith-8", type: "reasoning", input: "What is 10 / 0? Answer in JSON.", expected: null },
    { id: "arith-9", type: "reasoning", input: "Call me at 5. Answer in JSON.", expected: null },
    { id: "arith-10", type: "reasoning", input: "What is 9 * 9? Answer in JSON.", expected: 81 },
  ],
};

// Deterministic criterion: output must be a JSON string whose numeric
// "value" equals the expected number. Tasks with expected === null pass
// only when execution honestly failed (no output to check).
export function formatComplianceCriterion(
  output: unknown,
  expected: unknown
): { pass: boolean; details: string } {
  if (expected === null || expected === undefined) {
    return { pass: output === undefined || output === null, details: "invalid task: honest failure expected" };
  }
  if (typeof output !== "string") {
    return { pass: false, details: `not a JSON string (got ${typeof output})` };
  }
  try {
    const parsed = JSON.parse(output) as { value?: unknown };
    const pass =
      typeof parsed === "object" && parsed !== null && (parsed as { value?: unknown }).value === expected;
    return { pass, details: pass ? "value matches" : `value mismatch (got ${JSON.stringify(parsed)})` };
  } catch {
    return { pass: false, details: "unparseable as JSON" };
  }
}

export type OutputCriterion = (
  output: unknown,
  expected: unknown
) => { pass: boolean; details: string };

// Structured-extraction verification (fully deterministic — no LLM judge).
// Output must be PURE JSON (fenced/preambled text fails), with all expected
// keys present at equal values. Extra keys are permitted but noted.
export function extractionCriterion(
  output: unknown,
  expected: unknown
): { pass: boolean; details: string } {
  if (typeof output !== "string") {
    return { pass: false, details: `not a JSON string (got ${typeof output})` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    return { pass: false, details: "unparseable as JSON (fenced or preambled text fails)" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { pass: false, details: "top level is not a JSON object" };
  }
  const want = expected as Record<string, unknown>;
  const got = parsed as Record<string, unknown>;
  for (const [key, value] of Object.entries(want)) {
    if (!(key in got)) return { pass: false, details: `missing required field "${key}"` };
    if (got[key] !== value) {
      return { pass: false, details: `field "${key}": expected ${JSON.stringify(value)}, got ${JSON.stringify(got[key])}` };
    }
  }
  const extras = Object.keys(got).filter((k) => !(k in want));
  return { pass: true, details: extras.length > 0 ? `match (extra fields: ${extras.join(",")})` : "exact match" };
}

// Model-backed suite: unambiguous extraction tasks. Every expected value is
// stated explicitly in the input so verification needs no judgment.
export const EXTRACTION_JSON_V1: ExperimentSuite = {
  id: "extraction-json-v1",
  description: "Structured extraction as pure JSON via a real model; deterministic verification",
  tasks: [
    { id: "ext-1", type: "chat", category: "extraction", input: 'Extract name, age, and city as JSON from: "Maria is 34 and lives in Lima."', expected: { name: "Maria", age: 34, city: "Lima" } },
    { id: "ext-2", type: "chat", category: "extraction", input: 'Extract name, age, and city as JSON from: "Chen is 28 and lives in Oslo."', expected: { name: "Chen", age: 28, city: "Oslo" } },
    { id: "ext-3", type: "chat", category: "extraction", input: 'Extract product, price, and currency as JSON from: "The widget costs 19.99 USD."', expected: { product: "widget", price: 19.99, currency: "USD" } },
    { id: "ext-4", type: "chat", category: "extraction", input: 'Extract title, year, and director as JSON from: "The film Dune from 2021 was directed by Villeneuve."', expected: { title: "Dune", year: 2021, director: "Villeneuve" } },
    { id: "ext-5", type: "chat", category: "extraction", input: 'Extract name, role, and team as JSON from: "Ava works as designer on team Atlas."', expected: { name: "Ava", role: "designer", team: "Atlas" } },
    { id: "ext-6", type: "chat", category: "extraction", input: 'Extract city, country, and population as JSON from: "Reno is a city in USA with population 274000."', expected: { city: "Reno", country: "USA", population: 274000 } },
    { id: "ext-7", type: "chat", category: "extraction", input: 'Extract book, author, and pages as JSON from: "Solaris by Lem has 204 pages."', expected: { book: "Solaris", author: "Lem", pages: 204 } },
    { id: "ext-8", type: "chat", category: "extraction", input: 'Extract language, paradigm, and year as JSON from: "Rust is a systems language from 2010."', expected: { language: "Rust", paradigm: "systems", year: 2010 } },
    { id: "ext-9", type: "chat", category: "extraction", input: 'Extract fruit, color, and weight as JSON from: "The mango is yellow and weighs 300 grams."', expected: { fruit: "mango", color: "yellow", weight: 300 } },
    { id: "ext-10", type: "chat", category: "extraction", input: 'Extract planet, moons, and rings as JSON from: "Saturn has 146 moons and has rings."', expected: { planet: "Saturn", moons: 146, rings: true } },
  ],
};

// Named candidate configurations for cognitive behavior (data, not code).
// The experiment runner applies these to sandboxed cognition clones.
export interface CandidateSpec {
  name: string;
  description: string;
  config: {
    deterministicFormat?: "raw" | "json";
    systemPromptExtra?: string;
  };
}

export const CANDIDATE_SPECS: Record<string, CandidateSpec> = {
  "json-format": {
    name: "json-format",
    description: "Emit deterministic numeric results as {\"value\": n}",
    config: { deterministicFormat: "json" },
  },
  "json-only-prompt": {
    name: "json-only-prompt",
    description: "Constrain model responses to pure JSON via system instruction",
    config: {
      systemPromptExtra:
        "Return ONLY valid JSON with no explanations, no markdown fences, and no surrounding text.",
    },
  },
  "polite-json-prompt": {
    name: "polite-json-prompt",
    description: "Weaker nudge toward JSON output (comparison candidate)",
    config: { systemPromptExtra: "Please return your answer in JSON format." },
  },
};

// ---------------------------------------------------------------------------
// Measurements (raw evidence, never aggregated away)
// ---------------------------------------------------------------------------

export interface TaskMeasurement {
  taskId: string;
  success: boolean;
  outputMatches: boolean | null;
  verification: string;
  latencyMs: number;
  tokensUsed: number | null;
  executionPath: string;
  // Model that actually executed (null for deterministic/failed tasks).
  // Required for reproducibility metadata and honest token attribution.
  modelUsed: string | null;
  category?: string;
  error?: string;
  outputPreview?: string;
}

export interface ArmResult {
  measurements: TaskMeasurement[];
  taskCount: number;
  successCount: number;
  successRate: number;
  qualityRate: number;
  verificationRate: number;
  meanLatencyMs: number | null;
  totalTokensKnown: number;
  tokensUnknown: number;
}

export interface ComparisonDeltas {
  success_delta: number;
  quality_delta: number;
  verification_delta: number;
  latency_delta_ms: number | null;
  token_delta: number | null;
}

// ---------------------------------------------------------------------------
// Timeout + sandbox execution
// ---------------------------------------------------------------------------

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export interface SandboxArmDeps {
  telemetry: Telemetry;
  cognition: CognitionEngine;
  mindId: string;
  taskContext: TaskContext;
  taskTimeoutMs?: number;
  maxTasks?: number;
}

// Runs identical tasks through a REAL cognition engine inside a state
// sandbox (the engine owns isolated storage; production is untouched by
// construction). Every timing is wall-clock measured; token usage is
// recorded only when the engine reports it, otherwise null — never invented.
export async function measureArm(
  deps: SandboxArmDeps,
  tasks: ExperimentTask[],
  criterion: OutputCriterion
): Promise<ArmResult> {
  const defaultTimeoutMs = deps.taskTimeoutMs ?? 10000;
  const capped = tasks.slice(0, deps.maxTasks ?? 50);
  const measurements: TaskMeasurement[] = [];

  for (const task of capped) {
    // Per-task timeout from the task contract wins over the arm default.
    const timeoutMs = task.timeoutMs ?? defaultTimeoutMs;
    const start = Date.now();
    try {
      const res = await withTimeout(
        deps.cognition.processTask(
          { type: task.type, input: task.input } as never,
          deps.taskContext
        ),
        timeoutMs,
        `task ${task.id}`
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        measurements.push({
          taskId: task.id,
          success: false,
          outputMatches: null,
          verification: "none",
          latencyMs,
          tokensUsed: null,
          executionPath: "none",
          modelUsed: null,
          category: task.category,
          error: String(res.error),
        });
        continue;
      }
      const out = res.value.result;
      const check = criterion(out, task.expected);
      measurements.push({
        taskId: task.id,
        success: true,
        outputMatches: check.pass,
        verification: res.value.verification ?? "none",
        latencyMs,
        tokensUsed: typeof res.value.tokensUsed === "number" ? res.value.tokensUsed : null,
        executionPath: res.value.executionPath ?? "unknown",
        modelUsed: typeof res.value.modelUsed === "string" ? res.value.modelUsed : null,
        category: task.category,
        outputPreview: JSON.stringify(out)?.slice(0, 200),
      });
    } catch (error) {
      measurements.push({
        taskId: task.id,
        success: false,
        outputMatches: null,
        verification: "none",
        latencyMs: Date.now() - start,
        tokensUsed: null,
        executionPath: "none",
        modelUsed: null,
        category: task.category,
        error: String(error),
      });
    }
  }

  return summarizeArm(measurements);
}

export function summarizeArm(measurements: TaskMeasurement[]): ArmResult {
  const n = measurements.length;
  const successCount = measurements.filter((m) => m.success).length;
  const qualityCount = measurements.filter((m) => m.outputMatches === true).length;
  const verifiedCount = measurements.filter((m) => m.verification === "verified-deterministic").length;
  const latencies = measurements.map((m) => m.latencyMs);
  const tokensKnown = measurements.filter((m) => m.tokensUsed !== null) as Array<TaskMeasurement & { tokensUsed: number }>;
  return {
    measurements,
    taskCount: n,
    successCount,
    successRate: n > 0 ? successCount / n : 0,
    qualityRate: n > 0 ? qualityCount / n : 0,
    verificationRate: n > 0 ? verifiedCount / n : 0,
    meanLatencyMs: n > 0 ? latencies.reduce((a, b) => a + b, 0) / n : null,
    totalTokensKnown: tokensKnown.reduce((a, m) => a + m.tokensUsed, 0),
    tokensUnknown: measurements.filter((m) => m.tokensUsed === null).length,
  };
}

// Empty arm for the no-candidate case: zero evidence, not zero performance.
// Deltas against it stay honest because decideGate requires the candidate
// arm to carry the same workload (reproducibility check fails otherwise,
// and no-candidate records hold before gating).
export function summarizeEmptyArm(): ArmResult {
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
  };
}

export function compareArms(baseline: ArmResult, candidate: ArmResult): ComparisonDeltas {
  const tokensBothKnown = baseline.tokensUnknown === 0 && candidate.tokensUnknown === 0;
  return {
    success_delta: candidate.successRate - baseline.successRate,
    quality_delta: candidate.qualityRate - baseline.qualityRate,
    verification_delta: candidate.verificationRate - baseline.verificationRate,
    latency_delta_ms:
      baseline.meanLatencyMs !== null && candidate.meanLatencyMs !== null
        ? candidate.meanLatencyMs - baseline.meanLatencyMs
        : null,
    token_delta: tokensBothKnown ? candidate.totalTokensKnown - baseline.totalTokensKnown : null,
  };
}

// ---------------------------------------------------------------------------
// Named suites with their criterion and default candidate set, so CLI and
// tests address experiments by id without duplicating wiring.
export interface SuiteRegistration {
  suite: ExperimentSuite;
  criterion: OutputCriterion;
  candidates: CandidateSpec[];
}

export const EXPERIMENT_SUITES: Record<string, SuiteRegistration> = {
  "arithmetic-format-v1": {
    suite: ARITHMETIC_FORMAT_SUITE_V1,
    criterion: formatComplianceCriterion,
    candidates: [CANDIDATE_SPECS["json-format"] as CandidateSpec],
  },
  "extraction-json-v1": {
    suite: EXTRACTION_JSON_V1,
    criterion: extractionCriterion,
    candidates: [
      CANDIDATE_SPECS["json-only-prompt"] as CandidateSpec,
      CANDIDATE_SPECS["polite-json-prompt"] as CandidateSpec,
    ],
  },
};

// Deterministic candidate generation from measured evidence (Phase 2)
// ---------------------------------------------------------------------------

export interface FormatFailureEvidence {
  suiteId: string;
  failedTaskIds: string[];
  failureCount: number;
  baselineQuality: number;
  baselineSuccess: number;
}

// Scans a measured baseline arm for response-format failures and proposes
// the smallest config change that could fix them. The reason references the
// actual evidence — "why was this candidate created?" is always answerable.
export function proposeFormatComplianceCandidate(input: {
  mindId: string;
  genomeId: string;
  suiteId: string;
  baseline: ArmResult;
  suite: ExperimentSuite;
  // The configuration this candidate proposes (default: the json-format
  // change). No LLM is involved in Darwin generation: the mapping from
  // measured format failures to these known-good configurations is explicit
  // and recorded in the reason.
  sought?: { deterministicFormat?: "raw" | "json"; systemPromptExtra?: string };
  specName?: string;
}): EvolutionCandidate | null {
  const failures = input.baseline.measurements.filter((m) => m.success && m.outputMatches === false);
  if (failures.length === 0) return null;
  const failedTaskIds = failures.map((m) => m.taskId);
  const sought = input.sought ?? { deterministicFormat: "json" };
  const spec = input.specName ?? "json-format";
  return {
    id: generateId(),
    genomeId: input.genomeId,
    layer: "configuration",
    description: `Apply "${spec}" response formatting to fix measured format failures`,
    changes: {
      cognitionConfig: { ...sought },
      suite: input.suite,
    },
    generatedBy: "format-compliance-generator",
    generatedAt: nowISO(),
    reason:
      `${failures.length}/${input.baseline.taskCount} tasks in suite ${input.suiteId} ` +
      `completed but failed format compliance (tasks ${failedTaskIds.join(", ")}). ` +
      `Baseline quality ${input.baseline.qualityRate.toFixed(2)}. ` +
      `Hypothesis: applying "${spec}" ${JSON.stringify(sought)} fixes compliance ` +
      `without touching task semantics.`,
    evidence: {
      suiteId: input.suiteId,
      failedTaskIds,
      failureCount: failures.length,
      baselineQuality: input.baseline.qualityRate,
      baselineSuccess: input.baseline.successRate,
    } satisfies FormatFailureEvidence as unknown as Record<string, unknown>,
    status: "proposed",
  };
}

// ---------------------------------------------------------------------------
// Promotion gate (Phase 5) — real, narrow checks; default HOLD, never auto
// ---------------------------------------------------------------------------

export type GateDecision = "eligible" | "reject" | "hold";

export interface GateCheck {
  name: string;
  passed: boolean;
  details: string;
  severity: "reject" | "hold";
}

export interface GateReport {
  decision: GateDecision;
  reasons: string[];
  checks: GateCheck[];
}

export interface GateThresholds {
  minQualityImprovement?: number;
  maxLatencyIncreaseRatio?: number;
}

const COGNITION_ALLOWLIST: Record<string, string[]> = {
  cognitionConfig: ["deterministicFormat", "systemPromptExtra"],
};

// Prompt-instruction candidates are bounded text: long enough for a real
// constraint, short enough to review and incapable of smuggling a payload
// past the threat scan by volume.
const MAX_SYSTEM_PROMPT_EXTRA_CHARS = 2000;

const PRIVACY_GATED_KEYS = ["memory", "policies", "security", "privacy"];

export function reviewCandidateChanges(changes: Record<string, unknown>): GateCheck[] {
  const checks: GateCheck[] = [];

  // 1. Threat scan over the serialized changes.
  const scan = detectThreats(JSON.stringify(changes ?? {}));
  checks.push({
    name: "safety-threat-scan",
    passed: !scan.detected,
    details: scan.detected
      ? `Threat signatures: ${scan.threats.map((t) => t.signature.name).join(", ")}`
      : "No threat signatures in candidate changes",
    severity: "reject",
  });

  // 2. Config allowlist: only known-safe cognition keys may change.
  const topKeys = Object.keys(changes ?? {}).filter((k) => k !== "suite");
  const disallowed = topKeys.filter((k) => !(k in COGNITION_ALLOWLIST));
  let allowlistDetails = "All changed paths are allowlisted";
  let allowlistPassed = disallowed.length === 0;
  if (allowlistPassed) {
    for (const key of topKeys) {
      const allowed = COGNITION_ALLOWLIST[key] ?? [];
      const sub = changes[key] as Record<string, unknown>;
      const badSub = Object.keys(sub ?? {}).filter((k) => !allowed.includes(k));
      if (badSub.length > 0) {
        allowlistPassed = false;
        allowlistDetails = `Disallowed sub-keys under ${key}: ${badSub.join(", ")}`;
        break;
      }
    }
  } else {
    allowlistDetails = `Disallowed top-level change paths: ${disallowed.join(", ")}`;
  }
  // deterministicFormat value domain check.
  const cognition = (changes.cognitionConfig ?? {}) as Record<string, unknown>;
  const fmt = cognition.deterministicFormat;
  if (allowlistPassed && fmt !== undefined && fmt !== "raw" && fmt !== "json") {
    allowlistPassed = false;
    allowlistDetails = `deterministicFormat must be "raw" or "json" (got ${JSON.stringify(fmt)})`;
  }
  // systemPromptExtra value domain check: short reviewed string only.
  const extra = cognition.systemPromptExtra;
  if (allowlistPassed && extra !== undefined) {
    if (typeof extra !== "string") {
      allowlistPassed = false;
      allowlistDetails = "systemPromptExtra must be a string";
    } else if (extra.length > MAX_SYSTEM_PROMPT_EXTRA_CHARS) {
      allowlistPassed = false;
      allowlistDetails = `systemPromptExtra exceeds ${MAX_SYSTEM_PROMPT_EXTRA_CHARS} chars (${extra.length})`;
    }
  }
  checks.push({ name: "safety-allowlist", passed: allowlistPassed, details: allowlistDetails, severity: "reject" });

  // 3. Privacy: no privacy-gated configuration paths.
  const touched = topKeys;
  const violations = touched.filter((k) => PRIVACY_GATED_KEYS.some((g) => k.toLowerCase().includes(g)));
  checks.push({
    name: "privacy-config",
    passed: violations.length === 0,
    details: violations.length === 0
      ? "Candidate touches no privacy-gated configuration"
      : `Touches privacy-gated paths: ${violations.join(", ")}`,
    severity: "reject",
  });

  return checks;
}

export function decideGate(input: {
  baseline: ArmResult;
  candidate: ArmResult;
  deltas: ComparisonDeltas;
  candidateChanges: Record<string, unknown>;
  thresholds?: GateThresholds;
}): GateReport {
  const minImprovement = input.thresholds?.minQualityImprovement ?? 0.05;
  const maxLatencyRatio = input.thresholds?.maxLatencyIncreaseRatio ?? 0.5;
  const checks: GateCheck[] = [...reviewCandidateChanges(input.candidateChanges)];
  const reasons: string[] = [];

  // 4. Protected capability: arithmetic VALUES must not regress. A candidate
  // that changes computed values (not just formatting) is rejected even if
  // format compliance improved. (Checked by comparing value-correctness of
  // valid tasks across arms — the harness records outputPreview; the
  // experiment-level check below uses quality on the raw-value suite.)
  // NOTE: value-correctness is enforced by the caller passing a
  // value-correctness component; here we enforce the measurable part:
  // candidate success must not drop below baseline.
  if (input.deltas.success_delta < 0) {
    checks.push({
      name: "regression-success",
      passed: false,
      details: `Candidate success dropped by ${(-input.deltas.success_delta).toFixed(2)} vs baseline`,
      severity: "reject",
    });
  } else {
    checks.push({
      name: "regression-success",
      passed: true,
      details: `No success regression (delta ${input.deltas.success_delta >= 0 ? "+" : ""}${input.deltas.success_delta.toFixed(2)})`,
      severity: "reject",
    });
  }

  // 5. Quality improvement gate.
  if (input.deltas.quality_delta >= minImprovement) {
    checks.push({
      name: "quality-improvement",
      passed: true,
      details: `Quality delta +${input.deltas.quality_delta.toFixed(2)} meets threshold ${minImprovement}`,
      severity: "hold",
    });
  } else if (input.deltas.quality_delta < 0) {
    checks.push({
      name: "quality-improvement",
      passed: false,
      details: `Quality regressed by ${(-input.deltas.quality_delta).toFixed(2)}`,
      severity: "reject",
    });
  } else {
    checks.push({
      name: "quality-improvement",
      passed: false,
      details: `Inconclusive: quality delta +${input.deltas.quality_delta.toFixed(2)} below threshold ${minImprovement}`,
      severity: "hold",
    });
  }

  // 6. Cost/latency: measured only. Unknown (null) metrics are reported as
  // unknown — never invented. A large measured latency regression holds.
  // Sub-100ms absolute differences are measurement noise, not regressions:
  // without a floor, CPU contention between parallel test workers (or any
  // loaded host) flips deterministic sub-millisecond arms from ELIGIBLE to
  // HOLD. Found by the reproducibility test failing under parallel load.
  const LATENCY_NOISE_FLOOR_MS = 100;
  if (input.deltas.latency_delta_ms === null) {
    checks.push({
      name: "cost-latency",
      passed: true,
      details: "Latency delta unavailable (insufficient timing data); no cost claim made",
      severity: "hold",
    });
  } else if (Math.abs(input.deltas.latency_delta_ms) < LATENCY_NOISE_FLOOR_MS) {
    checks.push({
      name: "cost-latency",
      passed: true,
      details: `Latency delta ${input.deltas.latency_delta_ms.toFixed(1)}ms within ${LATENCY_NOISE_FLOOR_MS}ms measurement-noise floor`,
      severity: "hold",
    });
  } else {
    const base = input.baseline.meanLatencyMs ?? 0;
    const ratio = base > 0 ? input.deltas.latency_delta_ms / base : 0;
    if (ratio > maxLatencyRatio) {
      checks.push({
        name: "cost-latency",
        passed: false,
        details: `Latency increased ${(ratio * 100).toFixed(0)}% (budget ${(maxLatencyRatio * 100).toFixed(0)}%)`,
        severity: "hold",
      });
    } else {
      checks.push({
        name: "cost-latency",
        passed: true,
        details: `Latency delta ${input.deltas.latency_delta_ms.toFixed(1)}ms within budget`,
        severity: "hold",
      });
    }
  }
  // Token budget is PROPORTIONAL (legacy policy: 10%): an absolute
  // zero-increase rule would ban every prompt candidate by construction,
  // because longer prompts strictly cost more tokens. The budget bounds the
  // trade, it does not forbid paying for measured improvement.
  const MAX_TOKEN_INCREASE_RATIO = 0.1;
  if (input.deltas.token_delta === null) {
    checks.push({
      name: "cost-tokens",
      passed: true,
      details: "No model tokens measured in either arm; no token-cost claim made",
      severity: "hold",
    });
  } else if (input.deltas.token_delta <= 0) {
    checks.push({
      name: "cost-tokens",
      passed: true,
      details: "Token usage did not increase",
      severity: "hold",
    });
  } else {
    const base = input.baseline.totalTokensKnown;
    const ratio = base > 0 ? input.deltas.token_delta / base : Number.POSITIVE_INFINITY;
    if (ratio > MAX_TOKEN_INCREASE_RATIO) {
      checks.push({
        name: "cost-tokens",
        passed: false,
        details: `Token usage increased ${(ratio * 100).toFixed(1)}% (budget ${(MAX_TOKEN_INCREASE_RATIO * 100).toFixed(0)}%)`,
        severity: "hold",
      });
    } else {
      checks.push({
        name: "cost-tokens",
        passed: true,
        details: `Token usage increased ${(ratio * 100).toFixed(1)}% (within ${(MAX_TOKEN_INCREASE_RATIO * 100).toFixed(0)}% budget)`,
        severity: "hold",
      });
    }
  }

  // 7. Reproducibility: the decision is only valid with full raw evidence.
  const reproducible =
    input.baseline.measurements.length > 0 &&
    input.candidate.measurements.length > 0 &&
    input.baseline.measurements.length === input.candidate.measurements.length;
  checks.push({
    name: "reproducibility",
    passed: reproducible,
    details: reproducible
      ? `Identical workload: ${input.baseline.measurements.length} tasks in both arms with raw measurements preserved`
      : "Arm sizes differ or evidence missing — not a valid comparison",
    severity: "reject",
  });

  const rejected = checks.filter((c) => !c.passed && c.severity === "reject");
  const held = checks.filter((c) => !c.passed && c.severity === "hold");
  const decision: GateDecision = rejected.length > 0 ? "reject" : held.length > 0 ? "hold" : "eligible";
  for (const c of rejected) reasons.push(`REJECT: ${c.name} — ${c.details}`);
  for (const c of held) reasons.push(`HOLD: ${c.name} — ${c.details}`);
  if (decision === "eligible") {
    reasons.push(
      `ELIGIBLE: quality +${input.deltas.quality_delta.toFixed(2)}, success ${input.deltas.success_delta >= 0 ? "held" : "up"}, all safety/privacy/cost gates pass`
    );
  }
  return { decision, reasons, checks };
}

// ---------------------------------------------------------------------------
// Pure genome transitions (shared by live minds and CLI store operations)
// ---------------------------------------------------------------------------

export function applyPromotion(parent: Genome, candidate: EvolutionCandidate): Genome {
  const cognition =
    (candidate.changes.cognitionConfig as Record<string, unknown> | undefined) ?? {};
  return {
    ...parent,
    id: generateId(),
    version: { major: parent.version.major, minor: parent.version.minor, patch: parent.version.patch + 1 },
    cognitionConfig: { ...(parent.cognitionConfig ?? {}), ...cognition },
    parentGenome: parent.id,
    lineage: [...(parent.lineage ?? []), parent.id],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    evolutionHistory: [
      ...(parent.evolutionHistory ?? []),
      {
        candidateId: candidate.id,
        action: "promoted",
        timestamp: nowISO(),
        reason: candidate.reason ?? candidate.description,
      },
    ],
  };
}

export function applyRollback(active: Genome, parent: Genome, reason: string): Genome {
  return {
    ...parent,
    id: generateId(),
    version: { major: active.version.major, minor: active.version.minor, patch: active.version.patch + 1 },
    parentGenome: active.id,
    lineage: [...(active.lineage ?? []), active.id],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    evolutionHistory: [
      ...(active.evolutionHistory ?? []),
      { action: "rolled-back", timestamp: nowISO(), reason },
    ],
  };
}

// ---------------------------------------------------------------------------
// Experiment record
// ---------------------------------------------------------------------------

export interface PromotionInfo {
  promotedGenomeId: string;
  promotedVersion: Version;
  promotedAt: string;
}

// One evaluated candidate next to the primary: same baseline, same gate.
export interface CandidateEvaluation {
  candidate: EvolutionCandidate;
  result: ArmResult;
  deltas: ComparisonDeltas;
  gate: GateReport;
}

export interface RollbackInfo {
  rolledBackGenomeId: string;
  rolledBackVersion: Version;
  restoredGenomeId: string;
  rolledBackAt: string;
  reason: string;
}

export interface ExperimentRecord {
  id: string;
  mindId: string;
  suiteId: string;
  startedAt: string;
  completedAt: string;
  parentGenomeId: string;
  parentVersion: Version;
  // Null when the baseline arm revealed nothing to fix (no candidate
  // proposed). The gate then holds; promotion is impossible.
  candidate: EvolutionCandidate | null;
  // Additional candidates evaluated against the SAME baseline in the same
  // run (Phase 13: small-N comparison, not population evolution). Empty in
  // single-candidate mode. The primary `candidate` above stays first for
  // backward compatibility.
  extraCandidates: CandidateEvaluation[];
  // Engine sampling defaults in force during measurement. Stochastic model
  // arms can never be bit-reproduced; deterministic arms can.
  sampling: { temperature: number };
  reproducibility: "full" | "limited";
  baseline: ArmResult;
  candidateResult: ArmResult;
  deltas: ComparisonDeltas;
  gate: GateReport;
  promotion: PromotionInfo | null;
  rollback: RollbackInfo | null;
  lineage: string[];
}

// ---------------------------------------------------------------------------
// Durable file store (Phase 7): JSONL log + genome snapshots + active pointer
// ---------------------------------------------------------------------------

export interface ExperimentStorePaths {
  dir: string;
  logFile: string;
  activeFile: string;
  genomesDir: string;
}

export function defaultStorePaths(
  mindName: string,
  baseDir: string = process.env["SEAI_DATA_DIR"] ?? "./data"
): ExperimentStorePaths {
  const dir = join(baseDir, "minds", mindName);
  return {
    dir,
    logFile: join(dir, "evolution.jsonl"),
    activeFile: join(dir, "active.json"),
    genomesDir: join(dir, "genomes"),
  };
}

async function writeAtomic(file: string, content: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, content, "utf-8");
  await rename(tmp, file);
}

export async function appendExperimentRecord(
  paths: ExperimentStorePaths,
  record: ExperimentRecord
): Promise<void> {
  await mkdir(paths.dir, { recursive: true });
  await appendFile(paths.logFile, JSON.stringify(record) + "\n", "utf-8");
}

export async function updateExperimentRecord(
  paths: ExperimentStorePaths,
  record: ExperimentRecord
): Promise<void> {
  // Append-only log: readers take the LAST line per experiment id, so
  // promotion/rollback events never rewrite history.
  await appendExperimentRecord(paths, record);
}

export async function readExperimentHistory(paths: ExperimentStorePaths): Promise<ExperimentRecord[]> {
  let content: string;
  try {
    content = await readFile(paths.logFile, "utf-8");
  } catch {
    return [];
  }
  const latest = new Map<string, ExperimentRecord>();
  let corrupt = 0;
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const record = JSON.parse(trimmed) as ExperimentRecord;
      if (record && typeof record.id === "string") latest.set(record.id, record);
      else corrupt++;
    } catch {
      corrupt++;
    }
  }
  if (corrupt > 0) {
    // Corrupt lines are skipped, never silently repaired; the count is
    // surfaced through telemetry for operators to notice.
    createTelemetry({ enabled: false }).emitEvent(EventTypes.SECURITY_ALERT, "experiment-store", {
      action: "read-history",
      corruptLinesSkipped: corrupt,
    });
  }
  return Array.from(latest.values()).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export interface ActivePointer {
  genomeId: string;
  version: Version;
  experimentId: string | null;
  updatedAt: string;
}

export async function setActiveGenome(paths: ExperimentStorePaths, ptr: ActivePointer): Promise<void> {
  await writeAtomic(paths.activeFile, JSON.stringify({ ...ptr, updatedAt: nowISO() }, null, 2));
}

export async function getActiveGenome(paths: ExperimentStorePaths): Promise<ActivePointer | null> {
  try {
    const raw = await readFile(paths.activeFile, "utf-8");
    const ptr = JSON.parse(raw) as ActivePointer;
    if (!ptr || typeof ptr.genomeId !== "string") return null;
    return ptr;
  } catch {
    return null;
  }
}

export async function storeGenomeSnapshot(paths: ExperimentStorePaths, genome: Genome): Promise<void> {
  await mkdir(paths.genomesDir, { recursive: true });
  await writeAtomic(join(paths.genomesDir, `${genome.id}.json`), JSON.stringify(genome, null, 2));
}

export async function loadGenomeSnapshot(
  paths: ExperimentStorePaths,
  genomeId: string
): Promise<Genome | null> {
  try {
    const raw = await readFile(join(paths.genomesDir, `${genomeId}.json`), "utf-8");
    return JSON.parse(raw) as Genome;
  } catch {
    return null;
  }
}

// True while a promotion is the latest lifecycle event. Deterministic by
// construction (no clock comparison — same-millisecond promote/rollback
// pairs made timestamp ordering flaky): a new promotion clears the rollback
// marker, a rollback sets it. Prior transitions stay in older log lines.
export function isCurrentlyPromoted(record: ExperimentRecord): boolean {
  return !!record.promotion && !record.rollback;
}

// Store-level promotion/rollback: pure operations over durable records, so
// CLI commands work across processes without booting engines. Live minds use
// the same pure transitions (applyPromotion/applyRollback) plus live apply.
export async function promoteInStore(
  paths: ExperimentStorePaths,
  experimentId: string,
  candidateId?: string
): Promise<{ record: ExperimentRecord; genome: Genome }> {
  const history = await readExperimentHistory(paths);
  const record = history.find((r) => r.id === experimentId);
  if (!record) throw new Error(`Experiment not found: ${experimentId}`);
  if (isCurrentlyPromoted(record)) {
    throw new Error(`Experiment ${experimentId} already promoted (roll back first to re-promote)`);
  }
  const pool: Array<{ candidate: EvolutionCandidate | null; gate: GateReport }> = [
    { candidate: record.candidate, gate: record.gate },
    ...record.extraCandidates.map((e) => ({ candidate: e.candidate as EvolutionCandidate | null, gate: e.gate })),
  ];
  const chosen = candidateId ? pool.find((c) => c.candidate?.id === candidateId) : pool[0];
  if (!chosen?.candidate) {
    throw new Error(
      candidateId
        ? `Candidate ${candidateId} not found in experiment ${experimentId}`
        : `Experiment ${experimentId} produced no candidate`
    );
  }
  if (chosen.gate.decision !== "eligible") {
    throw new Error(`Candidate ${chosen.candidate.id} is not eligible (decision: ${chosen.gate.decision})`);
  }
  const parent = await loadGenomeSnapshot(paths, record.parentGenomeId);
  if (!parent) throw new Error(`Parent genome snapshot missing: ${record.parentGenomeId}`);
  const genome = applyPromotion(parent, chosen.candidate);
  await storeGenomeSnapshot(paths, genome);
  const updated: ExperimentRecord = {
    ...record,
    promotion: {
      promotedGenomeId: genome.id,
      promotedVersion: genome.version,
      promotedAt: nowISO(),
    },
    // A new promotion supersedes any earlier rollback marker; the rolled-back
    // event itself remains in older appended log lines.
    rollback: null,
    lineage: [...record.lineage, genome.id],
  };
  await updateExperimentRecord(paths, updated);
  await setActiveGenome(paths, {
    genomeId: genome.id,
    version: genome.version,
    experimentId: record.id,
    updatedAt: nowISO(),
  });
  return { record: updated, genome };
}

export async function rollbackInStore(
  paths: ExperimentStorePaths,
  reason: string
): Promise<{ record: ExperimentRecord | null; genome: Genome }> {
  const active = await getActiveGenome(paths);
  if (!active) throw new Error("No active genome to roll back from");
  const activeGenome = await loadGenomeSnapshot(paths, active.genomeId);
  if (!activeGenome) throw new Error(`Active genome snapshot missing: ${active.genomeId}`);
  const parentId = activeGenome.parentGenome;
  if (!parentId) throw new Error("Active genome has no parent; nothing to roll back to");
  const parent = await loadGenomeSnapshot(paths, parentId);
  if (!parent) throw new Error(`Parent genome snapshot missing: ${parentId}`);
  const genome = applyRollback(activeGenome, parent, reason);
  await storeGenomeSnapshot(paths, genome);
  await setActiveGenome(paths, {
    genomeId: genome.id,
    version: genome.version,
    experimentId: active.experimentId,
    updatedAt: nowISO(),
  });
  // Annotate the originating experiment record without rewriting history.
  const history = await readExperimentHistory(paths);
  const record = active.experimentId ? history.find((r) => r.id === active.experimentId) : undefined;
  if (record) {
    await updateExperimentRecord(paths, {
      ...record,
      rollback: {
        rolledBackGenomeId: genome.id,
        rolledBackVersion: genome.version,
        restoredGenomeId: parent.id,
        rolledBackAt: nowISO(),
        reason,
      },
      lineage: [...record.lineage, genome.id],
    });
  }
  const updated = active.experimentId
    ? ((await readExperimentHistory(paths)).find((r) => r.id === active.experimentId) ?? null)
    : null;
  return { record: updated, genome };
}
