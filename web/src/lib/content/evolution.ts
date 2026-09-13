export interface LoopPhase {
  key: string;
  title: string;
  description: string;
}

// The implemented evolution lifecycle — terminology matches the codebase
// (experiment.ts, EVOLUTION_MODEL.md, EVOLUTION_GATES.md).
export const lifecycle: LoopPhase[] = [
  { key: "observe", title: "OBSERVE", description: "Measure the current Mind on a task suite with a deterministic criterion. Raw per-task evidence is preserved." },
  { key: "learn", title: "LEARN", description: "Derive a weakness from the evidence — e.g. format compliance fails on unambiguous tasks." },
  { key: "hypothesize", title: "HYPOTHESIZE", description: "State a falsifiable claim about a change, e.g. H1: a JSON-only instruction raises compliance." },
  { key: "candidate", title: "CANDIDATE", description: "Generate candidates in a sandbox. The candidate proposer only sees baseline measurements on evolution tasks." },
  { key: "evaluate", title: "EVALUATE", description: "Run baseline and candidate arms on the identical workload. Deterministic criterion — no LLM judge." },
  { key: "holdout", title: "HOLDOUT", description: "Probe generalization on tasks outside the evolution set. Holdout never enters candidate evidence." },
  { key: "gate", title: "GATE", description: "Apply the decision table: eligible / hold / reject from explicit checks. Signal must exceed noise." },
  { key: "promote", title: "PROMOTE", description: "Explicit, reversible adoption of an eligible candidate into the active genome. Never automatic by default." },
  { key: "monitor", title: "MONITOR", description: "Verify adoption in a fresh process and keep measuring; a fresh-process probe confirms the change took." },
  { key: "rollback", title: "ROLLBACK", description: "Restore the parent version with lineage and audit history intact. Re-promotion after rollback is legal." },
];

export interface GateCheck {
  name: string;
  severity: "reject" | "hold" | "informational";
  what: string;
}

export const gateChecks: GateCheck[] = [
  { name: "safety-threat-scan", severity: "reject", what: "detectThreats() over serialized changes" },
  { name: "safety-allowlist", severity: "reject", what: "candidate changes must stay within the allowed configuration surface (cognitionConfig → deterministicFormat / systemPromptExtra ≤ 2000 chars)" },
  { name: "privacy-config", severity: "reject", what: "refuses candidate changes to memory, policies, security, or privacy paths" },
  { name: "regression-success", severity: "reject", what: "candidate success rate must not drop below baseline" },
  { name: "quality-improvement", severity: "reject", what: "delta vs minQualityImprovement (default 0.05); worse rejects, inconclusive holds" },
  { name: "cost-latency", severity: "hold", what: "sub-100ms deltas are noise; larger increases beyond the ratio budget hold" },
  { name: "cost-tokens", severity: "hold", what: "token increases beyond 10% of baseline hold" },
  { name: "reproducibility", severity: "reject", what: "both arms must run the identical workload with raw evidence preserved" },
  { name: "holdout-regression", severity: "reject", what: "candidate must not regress on holdout quality/success vs baseline holdout" },
  { name: "protected-<category>-regression", severity: "reject", what: "protected categories must never regress" },
  { name: "variance-confidence", severity: "hold", what: "with repeated runs, quality signal must exceed varianceSignalToNoise × pooled per-task variance" },
  { name: "small-sample", severity: "hold", what: "fewer than 3 tasks measured → insufficient statistical power" },
  { name: "category-<name>-regression", severity: "reject", what: "target-vs-global: no measured category may regress beyond maxCategoryRegression (0.10 default)" },
];

export const thresholdTable = {
  headers: ["Threshold", "Default", "Role"],
  rows: [
    ["minQualityImprovement", "0.05", "minimum quality delta for eligible"],
    ["maxLatencyIncreaseRatio", "0.50", "latency budget"],
    ["maxHoldoutRegression", "0.05", "holdout quality budget"],
    ["maxProtectedRegression", "—", "protected category budget"],
    ["maxCategoryRegression", "0.10", "any-category regression budget"],
    ["varianceSignalToNoise", "2.0", "noise threshold multiplier"],
  ],
} as const;